import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";
import { createHash } from "node:crypto";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import pg from "pg";
import { from as copyFrom, to as copyTo } from "pg-copy-streams";

export const quote = (name) => {
  if (!/^[a-z_][a-z0-9_]*$/.test(name)) throw new Error(`Invalid SQL identifier: ${name}`);
  return `"${name}"`;
};

export function parseBackup(path) {
  const compressed = readFileSync(path);
  const sql = gunzipSync(compressed).toString("utf8");
  const headers = [...sql.matchAll(/^--\n-- Name: ([^\n]+)\n--\n/gm)];
  const blocks = headers.map((m, i) => ({
    header: m[1], sql: sql.slice(m.index + m[0].length, headers[i + 1]?.index ?? sql.length),
  }));
  const copies = new Map();
  for (const m of sql.matchAll(/^COPY ([a-z_]+\.[a-z_]+) \(([^\n]+)\) FROM stdin;\n/gm)) {
    const start = m.index + m[0].length;
    const end = sql.indexOf("\\.\n", start);
    if (end < 0) throw new Error(`Unterminated COPY: ${m[1]}`);
    const text = sql.slice(start, end);
    const rows = text ? text.replace(/\n$/, "").split("\n") : [];
    copies.set(m[1], { columns: m[2].split(", "), text, rows });
  }
  const tables = blocks.filter(b => /^pdh_\w+; Type: TABLE; Schema: public;/.test(b.header))
    .map(b => b.header.split(";")[0]);
  if (tables.length !== 15) throw new Error(`Expected 15 project tables; found ${tables.length}`);
  for (const table of tables) if (!copies.has(`public.${table}`)) throw new Error(`Missing data: ${table}`);
  const users = copies.get("auth.users");
  if (!users) throw new Error("Missing source users");
  const ids = new Set();
  for (const [table, column] of [["pdh_admins", "user_id"], ["pdh_tournaments", "owner_id"]]) {
    const data = copies.get(`public.${table}`);
    for (const row of data.rows) ids.add(row.split("\t")[data.columns.indexOf(column)]);
  }
  const neededUsers = users.rows.filter(row => ids.has(row.split("\t")[users.columns.indexOf("id")]));
  if (neededUsers.length !== ids.size) throw new Error("Missing referenced user identities");
  return { blocks, copies, tables, users, neededUsers, sha256: createHash("sha256").update(compressed).digest("hex") };
}

export function schemaFromBackup(backup) {
  const clean = (sql) => sql
    .replace(/^ALTER (TABLE|FUNCTION)[^\n]+ OWNER TO [^;]+;\s*/gm, "")
    .replace(/auth\.users/g, "public.pdh_users")
    .replace(/system\.update_updated_at/g, "public.pdh_update_updated_at").trim();
  const pick = (type) => backup.blocks.filter(b => /^pdh_/.test(b.header) && b.header.includes(`Type: ${type}; Schema: public;`))
    .map(b => clean(b.sql)).join("\n\n");
  const publicPolicies = backup.blocks.filter(b => /^pdh_/.test(b.header)
    && b.header.includes("Type: POLICY; Schema: public;") && /_public_read ON/.test(b.sql))
    .map(b => clean(b.sql).replace(/TO anon, authenticated/g, "TO pdh_reader")).join("\n\n");
  return `-- Extracted from the InsForge backup; project objects only. No application data or secrets.
-- Apply with scripts/neon-backup.mjs so schema and data import share one transaction.
DO $$ BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'pdh_reader') THEN
    CREATE ROLE pdh_reader NOLOGIN;
  END IF;
END $$;
GRANT pdh_reader TO CURRENT_USER;
CREATE TABLE public.pdh_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  email_verified boolean NOT NULL DEFAULT false,
  profile jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  neon_auth_user_id text UNIQUE
);
CREATE UNIQUE INDEX pdh_users_email_key ON public.pdh_users (lower(email));
${pick("TABLE")}
CREATE FUNCTION public.pdh_update_updated_at() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;
${pick("FUNCTION")}
-- PDH_NEON_DATA
${pick("CONSTRAINT")}
${pick("INDEX")}
${pick("FK CONSTRAINT")}
${pick("TRIGGER")}
${[...backup.tables, "pdh_users"].map(t => `ALTER TABLE public.${quote(t)} ENABLE ROW LEVEL SECURITY;`).join("\n")}
${publicPolicies}
${[...backup.tables, "pdh_users"].map(t => `REVOKE ALL ON public.${quote(t)} FROM PUBLIC;`).join("\n")}
GRANT USAGE ON SCHEMA public TO pdh_reader;
${backup.tables.map(t => `GRANT SELECT ON public.${quote(t)} TO pdh_reader;`).join("\n")}
${backup.blocks.filter(b => /^pdh_/.test(b.header) && b.header.includes("Type: FUNCTION; Schema: public;"))
  .map(b => `REVOKE ALL ON FUNCTION public.${b.header.split(";")[0]} FROM PUBLIC;`).join("\n")}
REVOKE ALL ON FUNCTION public.pdh_update_updated_at() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.pdh_event_is_public(uuid) TO pdh_reader;
`;
}

async function importBackup(client, backup) {
  const existing = await client.query("SELECT tablename FROM pg_tables WHERE schemaname='public' AND starts_with(tablename, 'pdh_')");
  if (existing.rowCount) throw new Error("Destination already contains pdh_ tables; refusing to overwrite them");
  const schema = readFileSync("migrations/neon/20261109_pdh.sql", "utf8").replaceAll("\r\n", "\n");
  if (schema !== schemaFromBackup(backup)) throw new Error("Backup schema differs from reviewed migration");
  const [before, after] = schema.split("-- PDH_NEON_DATA");
  if (!before || !after) throw new Error("Missing data boundary");
  await client.query(before);
  const wanted = ["id", "email", "email_verified", "profile", "created_at", "updated_at"];
  for (const row of backup.neededUsers) {
    const values = row.split("\t");
    const text = wanted.map(k => values[backup.users.columns.indexOf(k)]).join("\t") + "\n";
    await pipeline(Readable.from([text]), client.query(copyFrom(`COPY public.pdh_users (${wanted.map(quote).join(",")}) FROM STDIN`)));
  }
  for (const table of backup.tables) {
    const data = backup.copies.get(`public.${table}`);
    await pipeline(Readable.from([data.text]), client.query(copyFrom(`COPY public.${quote(table)} (${data.columns.map(quote).join(",")}) FROM STDIN`)));
  }
  await client.query(after);
}

async function verifyBackup(client, backup) {
  const results = [];
  for (const table of backup.tables) {
    const source = backup.copies.get(`public.${table}`);
    const stream = client.query(copyTo(`COPY (SELECT ${source.columns.map(quote).join(",")} FROM public.${quote(table)}) TO STDOUT`));
    let text = "";
    for await (const chunk of stream) text += chunk.toString("utf8");
    const hash = rows => createHash("sha256").update([...rows].sort().join("\n")).digest("hex");
    const rows = text ? text.replace(/\n$/, "").split("\n") : [];
    if (hash(rows) !== hash(source.rows)) throw new Error(`Data mismatch in ${table} (COPY round-trip)`);
    results.push({ table, rows: rows.length, sha256: hash(rows) });
  }
  const { rows: users } = await client.query("SELECT id FROM public.pdh_users ORDER BY id");
  const expected = backup.neededUsers.map(row => row.split("\t")[backup.users.columns.indexOf("id")]).sort();
  if (JSON.stringify(users.map(u => u.id)) !== JSON.stringify(expected)) throw new Error("Identity mismatch");
  const userColumns = ["id", "email", "email_verified", "profile", "created_at", "updated_at"];
  const expectedUserRows = backup.neededUsers.map(row => {
    const fields = row.split("\t");
    return userColumns.map(k => fields[backup.users.columns.indexOf(k)]).join("\t");
  }).sort();
  let userText = "";
  for await (const chunk of client.query(copyTo(`COPY (SELECT ${userColumns.map(quote).join(",")} FROM public.pdh_users) TO STDOUT`))) userText += chunk.toString("utf8");
  if (JSON.stringify(userText.trimEnd().split("\n").sort()) !== JSON.stringify(expectedUserRows)) throw new Error("Identity data mismatch");
  return { tables: results, users: users.length, backupSha256: backup.sha256 };
}

if (process.argv[1]?.endsWith("neon-backup.mjs")) {
  const [command, path = "20261109_030829.sql.gz"] = process.argv.slice(2);
  const backup = parseBackup(path);
  if (command === "prepare") {
    mkdirSync("migrations/neon", { recursive: true });
    writeFileSync("migrations/neon/20261109_pdh.sql", schemaFromBackup(backup));
    console.log(JSON.stringify({ tables: backup.tables.map(t => ({ table: t, rows: backup.copies.get(`public.${t}`).rows.length })), users: backup.neededUsers.length, backupSha256: backup.sha256 }, null, 2));
  } else if (command === "import" || command === "verify") {
    const connectionString = process.env.DATABASE_URL_UNPOOLED;
    if (!connectionString || new URL(connectionString).hostname.includes("-pooler")) throw new Error("A direct DATABASE_URL_UNPOOLED is required");
    const client = new pg.Client({ connectionString, application_name: "pdh-backup-migration" });
    await client.connect();
    try {
      await client.query("BEGIN; SET LOCAL TIME ZONE 'UTC'; SET LOCAL DateStyle = 'ISO, MDY';");
      if (command === "import") await importBackup(client, backup);
      const result = await verifyBackup(client, backup);
      await client.query("COMMIT");
      mkdirSync(".migration", { recursive: true });
      writeFileSync(`.migration/${process.env.NEON_BRANCH ?? "database"}-verification.json`, JSON.stringify(result, null, 2));
      console.log(JSON.stringify(result, null, 2));
    } catch (error) {
      await client.query("ROLLBACK");
      console.error(error.message);
      process.exitCode = 1;
    } finally { await client.end(); }
  } else throw new Error("Use prepare, import, or verify");
}
