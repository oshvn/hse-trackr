import { useCallback, useEffect, useRef, useState } from "react";
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

type RawProfile = {
  id: string;
  user_id: string;
  email: string | null;
  role: string | null;
  status: string | null;
  contractor_id?: string | null;
  contractor?: { name?: string | null } | null;
};

const mapProfile = (data: RawProfile): UserProfile => {
  const normalizedRole = normalizeRole(data.role) ?? "contractor";
  const normalizedStatus = normalizeStatus(data.status) ?? "invited";

  return {
    id: data.id,
    user_id: data.user_id,
    email: data.email ?? "",
    role: normalizedRole,
    contractor_id: data.contractor_id ?? undefined,
    status: normalizedStatus,
    contractor_name: data.contractor?.name ?? undefined
  };
};

const fetchProfileRecord = async (userId: string): Promise<RawProfile | null> => {
  const { data, error } = await supabase
    .from("profiles")
    .select(`
      *,
      contractor:contractors(name)
    `)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
};

const upsertProfileRecord = async (user: User, role: UserProfile["role"], status: UserProfile["status"]): Promise<RawProfile> => {
  const { data, error } = await supabase
    .from("profiles")
    .upsert(
      [{
        user_id: user.id,
        email: user.email ?? "",
        role,
        status,
        contractor_id: null,
        activated_at: status === 'active' ? new Date().toISOString() : null,
      }],
      { onConflict: "user_id", ignoreDuplicates: false }
    )
    .select(`
      *,
      contractor:contractors(name)
    `)
    .single();

  if (error) {
    throw error;
  }

  return data;
};

const ensureProfileForUser = async (user: User): Promise<UserProfile> => {
  const metadataRole = normalizeRole(user.user_metadata?.role);
  const derivedRole: UserProfile["role"] = metadataRole ?? "contractor";

  let profileRecord = await fetchProfileRecord(user.id);

  if (!profileRecord) {
    // Determine activation based on allowed email list
    const emailLower = (user.email ?? "").toLowerCase();
    let statusToSet: UserProfile["status"] = derivedRole === "admin" ? "active" : "invited";
    try {
      const { data: allowed } = await supabase
        .from('allowed_users_email')
        .select('email')
        .eq('email', emailLower)
        .maybeSingle();
      if (allowed) {
        statusToSet = 'active';
      }
    } catch {
      // ignore and fallback to derived status
    }

    profileRecord = await upsertProfileRecord(user, derivedRole, statusToSet);
  } else if (metadataRole === "admin" && normalizeRole(profileRecord.role) !== "admin") {
    const { data, error } = await supabase
      .from("profiles")
      .update({ role: "admin", status: "active" })
      .eq("user_id", user.id)
      .select(`
        *,
        contractor:contractors(name)
      `)
      .maybeSingle();

    if (error) {
      throw error;
    }

    profileRecord = data ?? profileRecord;
  }

  return mapProfile(profileRecord);
};

const resolveRole = (state: AuthState): "admin" | "contractor" | "guest" => {
  if (!state.session || !state.profile) {
    return "guest";
  }

  if (state.profile.status !== "active") {
    return "guest";
  }

  const normalized = normalizeRole(state.profile.role);
  return normalized ?? "guest";
};

const initialState: AuthState = {
  user: null,
  session: null,
  profile: null,
  loading: true,
  error: null
};

export const useSessionRole = () => {
  const mountedRef = useRef(true);
  const [authState, setAuthStateState] = useState<AuthState>(initialState);
  const authStateRef = useRef<AuthState>(initialState);

  const updateAuthState = useCallback((updater: (prev: AuthState) => AuthState) => {
    setAuthStateState(prev => {
      const next = updater(prev);
      authStateRef.current = next;
      return next;
    });
  }, []);

  const overwriteAuthState = useCallback((next: AuthState) => {
    authStateRef.current = next;
    setAuthStateState(next);
  }, []);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const loadProfileForUser = useCallback(async (user: User) => {
    return ensureProfileForUser(user);
  }, []);

  const syncSession = useCallback(async (session: Session | null) => {
    if (!mountedRef.current) {
      return;
    }

    const user = session?.user ?? null;

    if (!user) {
      overwriteAuthState({
        user: null,
        session: null,
        profile: null,
        loading: false,
        error: null
      });
      return;
    }

    const current = authStateRef.current;
    const hasProfile = !!current.profile && current.profile.user_id === user.id && !current.error;

    updateAuthState(prev => ({
      ...prev,
      session,
      user,
      loading: hasProfile ? false : true,
      error: null
    }));

    try {
      const profile = await loadProfileForUser(user);
      if (!mountedRef.current) {
        return;
      }

      overwriteAuthState({
        user,
        session,
        profile,
        loading: false,
        error: null
      });
    } catch (error) {
      console.error('Profile fetch failed:', error);
      if (!mountedRef.current) {
        return;
      }

      const message = error instanceof Error ? error.message : 'Không thể tải thông tin tài khoản. Hiển thị chế độ khách.';

      updateAuthState(prev => ({
        ...prev,
        session,
        user,
        loading: false,
        error: message
      }));
    }
  }, [loadProfileForUser, overwriteAuthState, updateAuthState]);

  const refreshSession = useCallback(async () => {
    if (!mountedRef.current) {
      return;
    }

    if (!authStateRef.current.profile) {
      updateAuthState(prev => ({
        ...prev,
        loading: true,
        error: null
      }));
    }

    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        throw error;
      }
      await syncSession(data.session);
    } catch (error) {
      console.error('Session init failed:', error);
      if (!mountedRef.current) {
        return;
      }

      const message = error instanceof Error ? error.message : 'Session bootstrap failed';
      overwriteAuthState({
        user: null,
        session: null,
        profile: null,
        loading: false,
        error: message
      });
    }
  }, [syncSession, updateAuthState, overwriteAuthState]);

  useEffect(() => {
    refreshSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      syncSession(session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [refreshSession, syncSession]);

  const retry = useCallback(() => {
    refreshSession();
  }, [refreshSession]);

  const role = resolveRole(authStateRef.current);

  return {
    user: authState.user,
    session: authState.session,
    profile: authState.profile,
    loading: authState.loading,
    error: authState.error,
    role,
    isAdmin: () => role === "admin",
    isContractor: () => role === "contractor",
    isGuest: () => role === "guest",
    retry
  };
};
