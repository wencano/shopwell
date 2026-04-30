/** Resolve Supabase URL and API keys (new names + legacy JWT fallbacks). */

export function getSupabaseUrl(): string {
  const u = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!u) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
  return u;
}

/** Publishable key (`sb_publishable_...`) or legacy anon JWT — safe for browser / SSR cookie client. */
export function getSupabasePublishableKey(): string {
  const k =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!k) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (or legacy NEXT_PUBLIC_SUPABASE_ANON_KEY)",
    );
  }
  return k;
}

/** Secret key (`sb_secret_...`) or legacy service_role JWT — server-only. */
export function getSupabaseSecretKey(): string {
  const k =
    process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!k) {
    throw new Error(
      "Missing SUPABASE_SECRET_KEY (or legacy SUPABASE_SERVICE_ROLE_KEY)",
    );
  }
  return k;
}
