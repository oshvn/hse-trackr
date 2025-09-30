import { createClient, type SupabaseClientOptions } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

type EnvSource = Partial<Record<string, string | undefined>>;

declare const process: { env?: EnvSource } | undefined;

type RuntimeEnv = {
  importMeta?: { env?: EnvSource };
  process?: { env?: EnvSource };
};

const runtimeEnv: RuntimeEnv = {
  importMeta: typeof import.meta !== "undefined" ? (import.meta as RuntimeEnv["importMeta"]) : undefined,
  process: typeof process !== "undefined" ? (process as RuntimeEnv["process"]) : undefined,
};

const getEnvVar = (key: string): string | undefined => {
  const importMetaValue = runtimeEnv.importMeta?.env?.[key];
  if (importMetaValue) return importMetaValue;

  const nodeValue = runtimeEnv.process?.env?.[key];
  if (nodeValue) return nodeValue;

  return undefined;
};

const SUPABASE_URL =
  getEnvVar("VITE_SUPABASE_URL") ||
  getEnvVar("NEXT_PUBLIC_SUPABASE_URL") ||
  getEnvVar("SUPABASE_URL");

const SUPABASE_ANON_KEY =
  getEnvVar("VITE_SUPABASE_ANON_KEY") ||
  getEnvVar("NEXT_PUBLIC_SUPABASE_ANON_KEY") ||
  getEnvVar("SUPABASE_ANON_KEY");

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error("Supabase environment variables are missing. Please set SUPABASE_URL and SUPABASE_ANON_KEY.");
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
