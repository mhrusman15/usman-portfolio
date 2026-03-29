import { createClient, SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

export function isSupabaseConfigured(): boolean {
  return Boolean(
    import.meta.env.VITE_SUPABASE_URL?.trim() &&
      import.meta.env.VITE_SUPABASE_ANON_KEY?.trim()
  );
}

export function getSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null;
  const url = import.meta.env.VITE_SUPABASE_URL!.trim();
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY!.trim();
  if (!client) {
    client = createClient(url, key);
  }
  return client;
}
