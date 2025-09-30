import { supabase as supabaseClient } from "@/integrations/supabase/client";

export const supabase = supabaseClient;
export type { Database } from "@/integrations/supabase/types";
