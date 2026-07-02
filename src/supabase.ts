import { createClient, SupabaseClient } from "@supabase/supabase-js";

let supabaseInstance: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (supabaseInstance) return supabaseInstance;

  const url = (import.meta as any).env?.VITE_SUPABASE_URL || "https://qjgfjcxzqnawgxikwcpc.supabase.co";
  const anonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY;

  if (!anonKey || anonKey === "your-anon-key-here" || anonKey.includes("placeholder")) {
    console.warn(
      "Supabase environment variables (VITE_SUPABASE_ANON_KEY) are missing or placeholder. Running in Offline/Local Mode."
    );
    return null;
  }

  let isValidUrl = false;
  try {
    const parsed = new URL(url);
    isValidUrl = parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch (e) {
    isValidUrl = false;
  }

  if (!isValidUrl || url.includes("placeholder") || url === "your-supabase-url") {
    console.warn(
      "Supabase URL is invalid or placeholder. Running in Offline/Local Mode."
    );
    return null;
  }

  try {
    supabaseInstance = createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    });
    return supabaseInstance;
  } catch (error) {
    console.warn("Failed to initialize Supabase client:", error);
    return null;
  }
}

export const supabase = getSupabase();
