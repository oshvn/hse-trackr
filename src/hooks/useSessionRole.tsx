import { useState, useEffect } from "react";
import type { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

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

const normalizeRole = (value: unknown): UserProfile["role"] | null => {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim().toLowerCase();
  if (normalized === "admin" || normalized === "contractor") {
    return normalized;
  }

  return null;
};

const normalizeStatus = (value: unknown): UserProfile["status"] | null => {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim().toLowerCase();
  if (normalized === "invited" || normalized === "active" || normalized === "deactivated") {
    return normalized;
  }

  return null;
};

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

        let shouldFetchProfile = false;

        setAuthState(prev => {
          const shouldLoadProfile = !!user && (!prev.profile || prev.profile.user_id !== user.id);
          if (shouldLoadProfile) {
            shouldFetchProfile = true;
          }

          return {
            ...prev,
            session,
            user,
            loading: shouldLoadProfile,
            profile: user ? prev.profile : null
          };
        });

        // Fetch profile if authentication state requires it
        if (user) {
          if (shouldFetchProfile) {
            await fetchUserProfile(user);
          }
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

        let shouldFetchProfile = false;

        setAuthState(prev => {
          const shouldLoadProfile =
            event === 'SIGNED_IN' &&
            !!user &&
            (!prev.profile || prev.profile.user_id !== user.id);

          if (shouldLoadProfile) {
            shouldFetchProfile = true;
          }

          return {
            ...prev,
            session,
            user,
            loading: shouldLoadProfile
          };
        });

        if (user && event === 'SIGNED_IN' && shouldFetchProfile) {
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
          const normalizedRole = normalizeRole(user.user_metadata?.role);
          if (normalizedRole) {
            setAuthState(prev => ({
              ...prev,
              profile: {
                id: user.id,
                user_id: user.id,
                role: normalizedRole,
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
              error: 'Tai khoan chua duoc cap quyen. Lien he quan tri vien.',
              loading: false
            }));
          }
          return;
        }

        const normalizedRole = normalizeRole(data.role);
        const normalizedStatus = normalizeStatus(data.status) ?? 'invited';

        if (!normalizedRole) {
          setAuthState(prev => ({
            ...prev,
            profile: null,
            error: 'Tai khoan chua duoc cap quyen. Lien he quan tri vien.',
            loading: false
          }));
          return;
        }

        setAuthState(prev => ({
          ...prev,
          profile: {
            id: data.id,
            user_id: data.user_id,
            email: data.email,
            role: normalizedRole,
            contractor_id: data.contractor_id,
            status: normalizedStatus,
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
          error: 'Khong the tai thong tin tai khoan. Hien thi che do khach.',
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

    const profileStatus = normalizeStatus(authState.profile.status) ?? 'invited';
    if (profileStatus !== "active") {
      console.log('Role: guest (inactive status)', { status: authState.profile.status });
      return "guest";
    }

    const resolvedRole = normalizeRole(authState.profile.role);
    if (!resolvedRole) {
      console.log('Role: guest (unrecognized role)', { role: authState.profile.role });
      return "guest";
    }

    console.log('Role resolved:', resolvedRole, { email: authState.profile.email });
    return resolvedRole;
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
              const normalizedRole = normalizeRole(data.role);
              const normalizedStatus = normalizeStatus(data.status) ?? 'invited';

              if (!normalizedRole) {
                setAuthState(prev => ({
                  ...prev,
                  profile: null,
                  error: 'Tai khoan chua duoc cap quyen. Lien he quan tri vien.',
                  loading: false
                }));
                return;
              }

              setAuthState(prev => ({
                ...prev,
                profile: {
                  id: data.id,
                  user_id: data.user_id,
                  email: data.email,
                  role: normalizedRole,
                  contractor_id: data.contractor_id,
                  status: normalizedStatus,
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
