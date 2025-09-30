import { createClient, type SupabaseClientOptions } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

const SUPABASE_URL = "https://vsvscnlybsmkkgzgnjdo.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZzdnNjbmx5YnNta2tnemduamRvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4MDUwNTksImV4cCI6MjA3NDM4MTA1OX0.7sOn7aw3enZOeGbKMIPtpdg0YuEhlNQKCcrnCaFuRtM";

const clientOptions: SupabaseClientOptions<"public"> = {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
};

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, clientOptions);
export type { Database };
