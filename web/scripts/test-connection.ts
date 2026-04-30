/**
 * Verifies DATABASE_URL, Supabase publishable key, and secret key (no secrets printed).
 */
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import postgres from "postgres";
import {
  getSupabasePublishableKey,
  getSupabaseSecretKey,
  getSupabaseUrl,
} from "../src/lib/supabase/keys";

function hostFromDbUrl(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return "(invalid DATABASE_URL)";
  }
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("FAIL: DATABASE_URL is not set");
    process.exit(1);
  }

  const sql = postgres(databaseUrl, { max: 1 });
  try {
    const rows = await sql`select 1 as ok`;
    const row = rows[0] as { ok: number } | undefined;
    console.log("OK  Postgres", { host: hostFromDbUrl(databaseUrl), ok: row?.ok });
  } catch (e) {
    console.error("FAIL Postgres:", e instanceof Error ? e.message : e);
    process.exit(1);
  } finally {
    await sql.end({ timeout: 5 }).catch(() => undefined);
  }

  let url: string;
  let publishable: string;
  try {
    url = getSupabaseUrl();
    publishable = getSupabasePublishableKey();
  } catch (e) {
    console.error(
      "FAIL Supabase URL / publishable key:",
      e instanceof Error ? e.message : e,
    );
    process.exit(1);
  }

  const pubClient = createClient(url, publishable);
  const { error: pubErr } = await pubClient.auth.getSession();
  if (pubErr) {
    console.error("FAIL Supabase publishable key (Auth):", pubErr.message);
    process.exit(1);
  }
  console.log("OK  Supabase publishable key (Auth API)", {
    host: new URL(url).hostname,
  });

  let secret: string;
  try {
    secret = getSupabaseSecretKey();
  } catch (e) {
    console.error(
      "FAIL Supabase secret key:",
      e instanceof Error ? e.message : e,
    );
    process.exit(1);
  }

  const admin = createClient(url, secret, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error: adminErr } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 1,
  });
  if (adminErr) {
    console.error("FAIL Supabase secret key (admin):", adminErr.message);
    process.exit(1);
  }
  console.log("OK  Supabase secret key (Auth admin)", {
    users_sample: data?.users?.length ?? 0,
  });

  console.log("All connection checks passed.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
