import { createClient } from "@supabase/supabase-js";

let supabaseClient;

export function getSupabaseConfig() {
  return {
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || "",
    url: import.meta.env.VITE_SUPABASE_URL || "",
  };
}

export function hasSupabaseConfig() {
  const { anonKey, url } = getSupabaseConfig();
  return Boolean(url && anonKey);
}

export function getSupabaseClient() {
  const { anonKey, url } = getSupabaseConfig();

  if (!url || !anonKey) {
    throw new Error(
      "Supabase is selected but not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment."
    );
  }

  if (!supabaseClient) {
    supabaseClient = createClient(url, anonKey);
  }

  return supabaseClient;
}
