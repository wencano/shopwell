import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

export type Database = PostgresJsDatabase<typeof schema>;

let _db: Database | undefined;

function getDb(): Database {
  if (!_db) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("DATABASE_URL is not set");
    }
    /** Vercel serverless: keep pool small; use Supabase pooler URI (port 6543, `?pgbouncer=true`) in prod. */
    const max = Math.min(
      10,
      Math.max(1, Number.parseInt(process.env.DATABASE_POOL_MAX ?? "4", 10) || 4),
    );
    const client = postgres(connectionString, {
      prepare: false,
      max,
      connect_timeout: 15,
      idle_timeout: 20,
    });
    _db = drizzle(client, { schema });
  }
  return _db;
}

export const db = new Proxy({} as Database, {
  get(_, prop, receiver) {
    const d = getDb() as object;
    const v = Reflect.get(d, prop, receiver);
    return typeof v === "function" ? v.bind(d) : v;
  },
});
