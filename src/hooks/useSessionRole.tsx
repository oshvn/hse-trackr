import { useState, useEffect } from "react";
import type { User, Session } from "@supabase/supabase-js";
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

interface AuthState {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
}

export const useSessionRole = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    profile: null,
    loading: true,
    error: null
  });

  useEffect(() => {
    let isMounted = true;

    // Session bootstrap with timeout
    const initAuth = async () => {
      try {
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Session timeout')), 10000)
        );

        const { data: { session } } = await Promise.race([sessionPromise, timeoutPromise]);

        if (!isMounted) return;

        const user = session?.user ?? null;

        setAuthState(prev => ({
          ...prev,
          session,
          user,
          loading: !!user,
          profile: user ? prev.profile : null
        }));

        // Fetch profile if authenticated
        if (user) {
          await fetchUserProfile(user);
        } else {
          setAuthState(prev => ({
            ...prev,
            loading: false,
            profile: null
          }));
        }
      } catch (error) {
        console.error('Session init failed:', error);
        if (isMounted) {
          setAuthState(prev => ({
            ...prev,
            loading: false,
            error: error instanceof Error ? error.message : 'Session bootstrap failed'
          }));
        }
      }
    };

    // Auth state listener - avoid async operations in callback
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!isMounted) {
          return;
        }

        const user = session?.user ?? null;

        setAuthState(prev => ({
          ...prev,
          session,
          user,
          loading: event === 'SIGNED_IN' && !!user
        }));

        if (user && event === 'SIGNED_IN') {
          // Defer profile fetch to avoid callback blocking
          setTimeout(() => {
            if (isMounted) {
              fetchUserProfile(user);
            }
          }, 0);
        } else if (event === 'SIGNED_OUT') {
          setAuthState(prev => ({
            ...prev,
            profile: null,
            error: null,
            loading: false
          }));
        }
      }
    );

    const fetchUserProfile = async (user: User) => {
      try {
        const profilePromise = supabase
          .from('profiles')
          .select(`
            *,
            contractor:contractors(name)
          `)
          .eq('user_id', user.id)
          .maybeSingle();

        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Profile fetch timeout')), 5000)
        );

        const { data, error } = await Promise.race([profilePromise, timeoutPromise]);

        if (error && error.code !== 'PGRST116') { // Not found error
          throw error;
        }

        if (!data) {
          // Fallback to user_metadata if profile missing
          const role = user.user_metadata?.role;
          if (role && (role === 'admin' || role === 'contractor')) {
            setAuthState(prev => ({
              ...prev,
              profile: {
                id: user.id,
                user_id: user.id,
                role,
                status: 'active',
                email: user.email || ''
              } as UserProfile,
              error: null,
              loading: false
            }));
          } else {
            setAuthState(prev => ({
              ...prev,
              profile: null,
              error: 'Tài khoản chưa được cấp quyền. Liên hệ quản trị viên.',
              loading: false
            }));
          }
          return;
        }

        setAuthState(prev => ({
          ...prev,
          profile: {
            id: data.id,
            user_id: data.user_id,
            email: data.email,
            role: data.role as "admin" | "contractor",
            contractor_id: data.contractor_id,
            status: data.status as "invited" | "active" | "deactivated",
            contractor_name: data.contractor?.name
          },
          error: null,
          loading: false
        }));

      } catch (error) {
        console.error('Profile fetch failed:', error);
        // Don't crash - show guest dashboard with warning
        setAuthState(prev => ({
          ...prev,
          error: 'Không thể tải thông tin tài khoản. Hiển thị chế độ khách.',
          loading: false
        }));
      }
    };

    initAuth();

    return () => {
      subscription.unsubscribe();
      isMounted = false;
    };
  }, []);

  const getUserRole = (): "admin" | "contractor" | "guest" => {
    if (!authState.session || !authState.profile) {
      console.log('Role: guest (no session or profile)', { session: !!authState.session, profile: !!authState.profile });
      return "guest";
    }
    if (authState.profile.status !== "active") {
      console.log('Role: guest (inactive status)', { status: authState.profile.status });
      return "guest";
    }
    console.log('Role resolved:', authState.profile.role, { email: authState.profile.email });
    return authState.profile.role;
  };

  const retry = () => {
    if (authState.user) {
      setAuthState(prev => ({ ...prev, error: null, loading: true }));
      setTimeout(() => {
        const fetchProfile = async () => {
          try {
            const { data, error } = await supabase
              .from('profiles')
              .select(`
                *,
                contractor:contractors(name)
              `)
              .eq('user_id', authState.user!.id)
              .maybeSingle();

            if (!error && data) {
              setAuthState(prev => ({
                ...prev,
                profile: {
                  id: data.id,
                  user_id: data.user_id,
                  email: data.email,
                  role: data.role as "admin" | "contractor",
                  contractor_id: data.contractor_id,
                  status: data.status as "invited" | "active" | "deactivated",
                  contractor_name: data.contractor?.name
                },
                error: null,
                loading: false
              }));
            }
          } catch (error) {
            console.error('Retry failed:', error);
            setAuthState(prev => ({
              ...prev,
              loading: false
            }));
          }
        };
        fetchProfile();
      }, 0);
    }
  };

  return {
    user: authState.user,
    session: authState.session,
    profile: authState.profile,
    loading: authState.loading,
    error: authState.error,
    role: getUserRole(),
    isAdmin: () => getUserRole() === "admin",
    isContractor: () => getUserRole() === "contractor",
    isGuest: () => getUserRole() === "guest",
    retry
  };
};