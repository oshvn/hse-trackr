import type { Session } from "@supabase/supabase-js";
import { supabase } from "./supabase";

declare const process: { env?: Record<string, string | undefined> } | undefined;

const resolveEnv = (key: string) => {
  if (typeof import.meta !== "undefined" && import.meta.env) {
    const value = (import.meta.env as Record<string, string | undefined>)[key];
    if (value) return value;
  }

  if (typeof process !== "undefined" && process.env) {
    return process.env[key];
  }

  return undefined;
};

const getGuestCredentials = () => {
  const email =
    resolveEnv("VITE_GUEST_EMAIL") ||
    resolveEnv("NEXT_PUBLIC_GUEST_EMAIL");
  const password =
    resolveEnv("VITE_GUEST_PASSWORD") ||
    resolveEnv("NEXT_PUBLIC_GUEST_PASSWORD");

  return { email, password };
};

let inflight: Promise<Session | null> | null = null;


const shouldAutoGuest = () => {
  if (typeof window === "undefined") {
    return false;
  }

  const pathname = window.location?.pathname ?? "/";
  const blockedPrefixes = ["/login", "/forgot-password", "/admin", "/my-submissions"];

  if (blockedPrefixes.some(prefix => pathname.startsWith(prefix))) {
    return false;
  }

  return pathname === "/" || pathname === "";
};

export const ensureSession = async () => {
  if (inflight) {
    return inflight;
  }

  inflight = (async () => {
    const { data } = await supabase.auth.getSession();
    if (data.session) {
      return data.session;
    }

    if (!shouldAutoGuest()) {
      return null;
    }

    const { email, password } = getGuestCredentials();
    if (!email || !password) {
      console.warn("Guest credentials missing. Skipping auto-login");
      return null;
    }

    const { data: signInData, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error("Guest auto-login failed", error);
      return null;
    }

    return signInData.session ?? null;
  })();

  try {
    return await inflight;
  } finally {
    inflight = null;
  }
};
