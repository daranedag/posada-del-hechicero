// Compatibility runner for linked InsForge backends without migration endpoints.
// SQL files remain the source of truth. The CLI handles credentials and transport.
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
const args = process.argv.slice(2);
const rehearse = args.includes("--rehearse");
const files = args.filter(arg => arg !== "--rehearse");
if (!files.length || files.some(file => !/^(migrations|tests)\/[\w-]+\.sql$/.test(file))) {
  throw new Error("Usage: pnpm exec node scripts/insforge-sql.mjs [--rehearse] migrations/file.sql [tests/file.sql]");
}
const body = files.map(file => readFileSync(file, "utf8")).join("\n");
// One statement is atomic on older backends too. Rehearsals always roll back.
const sql = `DO $pdh_sql_runner$ BEGIN\n${body}\n${rehearse ? "RAISE EXCEPTION 'PDH_REHEARSAL_OK';" : ""}\nEND $pdh_sql_runner$;`;
const result = spawnSync("pnpm", ["dlx", "@insforge/cli", "db", "query", sql, "--json"], { encoding: "utf8", maxBuffer: 4 * 1024 * 1024 });
const output = `${result.stdout ?? ""}\n${result.stderr ?? ""}`;
if (rehearse && output.includes("PDH_REHEARSAL_OK")) {
  console.log("SQL rehearsal passed; all changes and fixtures were rolled back.");
} else {
  process.stdout.write(output);
  process.exitCode = result.status ?? 1;
}
