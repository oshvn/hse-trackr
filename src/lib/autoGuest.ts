import { supabase } from "@/integrations/supabase/client";

const GUEST_EMAIL = "guest@example.com";
const GUEST_PASSWORD = "guest123456";

export async function ensureSession() {
  try {
    // Check if we already have a session
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      return session;
    }

    // No session, try to sign in as guest
    const { data, error } = await supabase.auth.signInWithPassword({
      email: GUEST_EMAIL,
      password: GUEST_PASSWORD,
    });

    if (error) {
      console.error("Auto-guest login failed:", error.message);
      return null;
    }

    return data.session;
  } catch (error) {
    console.error("Session check failed:", error);
    return null;
  }
}