import { ComponentType, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { UserRole } from "./AppShell";

interface WithRoleProps {
  user?: User | null;
}

export const withRole = <P extends object>(
  WrappedComponent: ComponentType<P>,
  requiredRole: UserRole["role"]
) => {
  return (props: P & WithRoleProps) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      const getUser = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user ?? null);
        setLoading(false);
      };

      getUser();

      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        (event, session) => {
          setUser(session?.user ?? null);
          setLoading(false);
        }
      );

      return () => subscription.unsubscribe();
    }, []);

    if (loading) {
      return (
        <div className="flex h-screen items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      );
    }

    const userRole: UserRole["role"] = user?.user_metadata?.role === "admin" ? "admin" : "contractor";

    if (requiredRole === "admin" && userRole !== "admin") {
      return <Navigate to="/" replace />;
    }

    return <WrappedComponent {...props} user={user} />;
  };
};