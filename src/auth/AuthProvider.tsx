import React, { createContext, useMemo, useState } from "react";
import type { BackendUser, LoginPayload } from "@/types/auth.types";
import * as authApi from "@/api/auth.api";
import { clearSession, loadSession, saveSession, type AuthSession } from "@/auth/auth.storage";

type AuthContextValue = {
  user: BackendUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;

  login: (payload: LoginPayload) => Promise<void>;
  logout: () => Promise<void>;
  hydrate: () => void;
};

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // ✅ carga inmediata desde localStorage (evita parpadeos y rebotes)
  const [session, setSession] = useState<AuthSession | null>(() => loadSession());

  const hydrate = () => {
    setSession(loadSession());
  };

  const login = async (payload: LoginPayload) => {
    const res = await authApi.login(payload);

    // ✅ Solo admins pueden entrar al CMS
    const role = String(res.user.rol ?? "").toLowerCase();
    const isBackendAdmin = role === "admin" || role === "administrador";
    if (!isBackendAdmin) {
      clearSession();
      setSession(null);
      throw new Error("Acceso denegado: este CMS es solo para administradores.");
    }

    const next: AuthSession = {
      user: res.user,
      accessToken: res.accessToken,
      refreshToken: res.refreshToken,
    };

    saveSession(next);
    setSession(next);
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {
      // aunque falle backend, cerramos local
    } finally {
      clearSession();
      setSession(null);
    }
  };

  const value = useMemo<AuthContextValue>(() => {
    const user = session?.user ?? null;
    const accessToken = session?.accessToken ?? null;
    const refreshToken = session?.refreshToken ?? null;

    return {
      user,
      accessToken,
      refreshToken,
      isAuthenticated: Boolean(user && accessToken),
      isAdmin: ["admin", "administrador"].includes(String(user?.rol ?? "").toLowerCase()),
      login,
      logout,
      hydrate,
    };
  }, [session]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
