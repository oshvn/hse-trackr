import { useState, useEffect } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export interface UserProfile {
  id: string;
  user_id: string;
  email: string;
  role: "admin" | "contractor";
  contractor_id?: string;
  status: "invited" | "active" | "deactivated";
  contractor_name?: string;
}

export const useSessionRole = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Fetch user profile
          const { data } = await supabase
            .from('profiles')
            .select(`
              *,
              contractor:contractors(name)
            `)
            .eq('user_id', session.user.id)
            .single();
          
          if (data) {
            setProfile({
              id: data.id,
              user_id: data.user_id,
              email: data.email,
              role: data.role as "admin" | "contractor",
              contractor_id: data.contractor_id,
              status: data.status as "invited" | "active" | "deactivated",
              contractor_name: data.contractor?.name
            });
          }
        } else {
          setProfile(null);
        }
        
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        const { data } = await supabase
          .from('profiles')
          .select(`
            *,
            contractor:contractors(name)
          `)
          .eq('user_id', session.user.id)
          .single();
        
        if (data) {
          setProfile({
            id: data.id,
            user_id: data.user_id,
            email: data.email,
            role: data.role as "admin" | "contractor",
            contractor_id: data.contractor_id,
            status: data.status as "invited" | "active" | "deactivated",
            contractor_name: data.contractor?.name
          });
        }
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const getUserRole = (): "admin" | "contractor" | "guest" => {
    if (!user) return "guest";
    if (profile?.status !== "active") return "guest";
    return profile?.role || "contractor";
  };

  const isAdmin = () => getUserRole() === "admin";
  const isContractor = () => getUserRole() === "contractor";
  const isGuest = () => getUserRole() === "guest";

  return {
    user,
    session,
    profile,
    loading,
    role: getUserRole(),
    isAdmin,
    isContractor,
    isGuest,
  };
};