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
    const client = postgres(connectionString, { prepare: false, max: 10 });
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
