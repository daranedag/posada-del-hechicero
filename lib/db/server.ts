import "server-only";
import { Pool, types } from "pg";
import { attachDatabasePool } from "@vercel/functions";

export type DatabaseAccess = "admin" | "public";
const globalDatabase = globalThis as typeof globalThis & { pdhPool?: Pool };

function getPool() {
  if (!globalDatabase.pdhPool) {
    if (!process.env.DATABASE_URL) throw new Error("Falta DATABASE_URL para conectar con Neon.");
    const connection = new URL(process.env.DATABASE_URL);
    connection.searchParams.set("sslmode", "verify-full");
    globalDatabase.pdhPool = new Pool({
      connectionString: connection.toString(), max: 5, idleTimeoutMillis: 5000,
      connectionTimeoutMillis: 10000,
      types: { getTypeParser(oid, format) {
        // Keep the JSON shapes previously returned by the HTTP database API.
        if (oid === 1184 || oid === 1114) return (value: string) => new Date(value).toISOString();
        if (oid === 1082) return (value: string) => value;
        if (oid === 1700) return Number;
        return types.getTypeParser(oid, format);
      } },
    });
    attachDatabasePool(globalDatabase.pdhPool);
  }
  return globalDatabase.pdhPool;
}

export async function queryDatabase(access: DatabaseAccess, text: string, values: unknown[] = []) {
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    if (access === "public") await client.query("SET LOCAL ROLE pdh_reader");
    const result = await client.query<Record<string, unknown>>(text, values);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally { client.release(); }
}
