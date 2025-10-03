import { createClient, type SupabaseClientOptions } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

declare const process: { env?: Record<string, string | undefined> } | undefined;

const resolveEnv = (key: string): string | undefined => {
  if (typeof import.meta !== "undefined" && import.meta.env) {
    const value = (import.meta.env as Record<string, string | undefined>)[key];
    if (value) {
      return value;
    }
  }

  if (typeof process !== "undefined" && process.env) {
    const value = process.env[key];
    if (value) {
      return value;
    }
  }

  return undefined;
};

const SUPABASE_URL = resolveEnv("VITE_SUPABASE_URL");
const SUPABASE_ANON_KEY = resolveEnv("VITE_SUPABASE_ANON_KEY");

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error("Missing Supabase configuration. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.");
}

const clientOptions: SupabaseClientOptions<"public"> = {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
};

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, clientOptions);
export type { Database };
