import "server-only";
import { queryDatabase, type DatabaseAccess } from "./server";

type Row = Record<string, unknown>;
type Result<T> = { data: T | null; error: { message: string; code?: string } | null; count: number | null };
type Filter = { column: string; operator: "=" | ">=" | "<=" | "<" | "IN"; value: unknown };

const tables = new Set([
  "pdh_admins", "pdh_users", "pdh_contact_submissions", "pdh_deck_cards", "pdh_deck_submissions",
  "pdh_event_exceptions", "pdh_events", "pdh_formats", "pdh_players", "pdh_products",
  "pdh_site_items", "pdh_site_media", "pdh_site_sections", "pdh_site_settings", "pdh_standings", "pdh_tournaments",
]);
function identifier(value: string) {
  if (!/^[a-z_][a-z0-9_]*$/.test(value)) throw new Error("Identificador SQL inválido.");
  return `"${value}"`;
}
function columns(value: string) {
  return value === "*" ? "*" : value.split(",").map(c => identifier(c.trim())).join(",");
}
function failure(error: unknown) {
  // Database messages can include private row contents. Keep those out of responses and logs.
  const code = error && typeof error === "object" && "code" in error ? String(error.code) : undefined;
  return { message: "No se pudo completar la operación en la base de datos.", code };
}

// A small server-only adapter for the query shapes already used by the application.
// All values are parameters; table and column identifiers are validated separately.
class Query<T = Row[]> implements PromiseLike<Result<T>> {
  private operation: "select" | "insert" | "update" | "delete" | "upsert" = "select";
  private projection = "*";
  private returning = false;
  private filters: Filter[] = [];
  private sorts: string[] = [];
  private page?: { limit: number; offset: number };
  private payload: Row[] = [];
  private conflict = "";
  private cardinality: "many" | "single" | "optional" = "many";
  private exactCount = false;
  private promise?: Promise<Result<T>>;

  constructor(private access: DatabaseAccess, private table: string) {
    if (!tables.has(table)) throw new Error("Tabla no permitida.");
  }
  select(projection = "*", options?: { count?: "exact" }) {
    this.projection = columns(projection);
    this.returning = true;
    this.exactCount = options?.count === "exact";
    return this;
  }
  insert(rows: Row[]) { this.operation = "insert"; this.payload = rows; return this; }
  upsert(rows: Row[], options: { onConflict: string }) {
    this.operation = "upsert"; this.payload = rows; this.conflict = columns(options.onConflict); return this;
  }
  update(row: Row) { this.operation = "update"; this.payload = [row]; return this; }
  delete() { this.operation = "delete"; return this; }
  eq(column: string, value: unknown) { this.filters.push({ column, operator: "=", value }); return this; }
  gte(column: string, value: unknown) { this.filters.push({ column, operator: ">=", value }); return this; }
  lte(column: string, value: unknown) { this.filters.push({ column, operator: "<=", value }); return this; }
  lt(column: string, value: unknown) { this.filters.push({ column, operator: "<", value }); return this; }
  in(column: string, value: unknown[]) { this.filters.push({ column, operator: "IN", value }); return this; }
  order(column: string, options?: { ascending?: boolean }) {
    this.sorts.push(`${identifier(column)} ${options?.ascending === false ? "DESC" : "ASC"}`); return this;
  }
  range(first: number, last: number) {
    if (!Number.isSafeInteger(first) || !Number.isSafeInteger(last) || first < 0 || last < first) throw new Error("Página inválida.");
    this.page = { limit: last - first + 1, offset: first }; return this;
  }
  limit(limit: number) { return this.range(0, limit - 1); }
  single() { this.cardinality = "single"; return this as unknown as Query<Row>; }
  maybeSingle() { this.cardinality = "optional"; return this as unknown as Query<Row>; }

  private async execute(): Promise<Result<T>> {
    try {
      if (this.access === "public" && this.operation !== "select") throw new Error("Solo lectura.");
      const values: unknown[] = [];
      const param = (value: unknown) => { values.push(value); return `$${values.length}`; };
      const table = `public.${identifier(this.table)}`;
      let statement: string;
      if (this.operation === "select") statement = `SELECT ${this.projection} FROM ${table}`;
      else if (this.operation === "delete") statement = `DELETE FROM ${table}`;
      else {
        if (!this.payload.length) return { data: [] as T, error: null, count: 0 };
        const keys = [...new Set(this.payload.flatMap(row => Object.keys(row)))];
        if (!keys.length) throw new Error("Datos vacíos.");
        if (this.operation === "update") {
          statement = `UPDATE ${table} SET ${keys.map(k => `${identifier(k)}=${param(this.payload[0][k])}`).join(",")}`;
        } else {
          const encode = (value: unknown) => value !== null && typeof value === "object" && !Array.isArray(value) ? JSON.stringify(value) : value;
          statement = `INSERT INTO ${table} (${keys.map(identifier).join(",")}) VALUES ${this.payload.map(row =>
            `(${keys.map(k => k in row ? param(encode(row[k])) : "DEFAULT").join(",")})`).join(",")}`;
          if (this.operation === "upsert") statement += ` ON CONFLICT (${this.conflict}) DO UPDATE SET ${keys.map(k => `${identifier(k)}=EXCLUDED.${identifier(k)}`).join(",")}`;
        }
      }
      if (this.filters.length) statement += ` WHERE ${this.filters.map(f => {
        const column = identifier(f.column);
        if (f.operator === "IN") {
          const items = f.value as unknown[];
          return items.length ? `${column} IN (${items.map(param).join(",")})` : "FALSE";
        }
        if (f.value === null && f.operator === "=") return `${column} IS NULL`;
        return `${column} ${f.operator} ${param(f.value)}`;
      }).join(" AND ")}`;
      if (this.operation === "select") {
        const base = statement;
        let suffix = this.sorts.length ? ` ORDER BY ${this.sorts.join(",")}` : "";
        if (this.page) suffix += ` LIMIT ${param(this.page.limit)} OFFSET ${param(this.page.offset)}`;
        statement += suffix;
        if (this.exactCount) {
          // Pagination may sort on a column omitted from the requested projection.
          const matching = base.replace(`SELECT ${this.projection}`, "SELECT *");
          statement = `WITH matching AS (${matching}), page AS (SELECT ${this.projection} FROM matching${suffix}) SELECT (SELECT COALESCE(jsonb_agg(page), '[]'::jsonb) FROM page) AS items, (SELECT count(*)::int FROM matching) AS total`;
        }
      } else if (this.returning) statement += ` RETURNING ${this.projection}`;
      if (this.operation !== "select" && ["delete", "update"].includes(this.operation) && !this.filters.length) throw new Error("Falta el filtro de escritura.");
      const result = await queryDatabase(this.access, statement, values);
      let rows = result.rows;
      let count: number | null = null;
      if (this.exactCount) { count = Number(rows[0]?.total ?? 0); rows = (rows[0]?.items ?? []) as Row[]; }
      if (this.cardinality !== "many" && (rows.length > 1 || (this.cardinality === "single" && rows.length !== 1))) throw new Error("Número de resultados inesperado.");
      return { data: (this.cardinality === "many" ? rows : rows[0] ?? null) as T, error: null, count };
    } catch (error) { return { data: null, error: failure(error), count: null }; }
  }
  then<TResult1 = Result<T>, TResult2 = never>(
    onfulfilled?: ((value: Result<T>) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): Promise<TResult1 | TResult2> {
    this.promise ??= this.execute();
    return this.promise.then(onfulfilled, onrejected);
  }
}

export function createDatabase(access: DatabaseAccess) {
  return {
    from(table: string) { return new Query(access, table); },
    async rpc(name: string, args: Row): Promise<Result<unknown>> {
      if (access !== "admin" || name !== "pdh_save_calendar_event_with_registration") throw new Error("Función no permitida.");
      try {
        const entries = Object.entries(args);
        const result = await queryDatabase(access, `SELECT public.${identifier(name)}(${entries.map(([key], i) => `${identifier(key)} => $${i + 1}`).join(",")}) AS value`,
          entries.map(([, v]) => v !== null && typeof v === "object" ? JSON.stringify(v) : v));
        return { data: result.rows[0]?.value ?? null, error: null, count: null };
      } catch (error) {
        const result = failure(error);
        // The calendar uses this fixed sentinel for optimistic concurrency.
        if (error instanceof Error && error.message === "EVENT_CONFLICT") result.message = "EVENT_CONFLICT";
        return { data: null, error: result, count: null };
      }
    },
  };
}
