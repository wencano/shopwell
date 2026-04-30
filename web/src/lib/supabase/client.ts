import { createBrowserClient } from "@supabase/ssr";
import { getSupabasePublishableKey, getSupabaseUrl } from "./keys";

export function createClient() {
  return createBrowserClient(getSupabaseUrl(), getSupabasePublishableKey());
}
