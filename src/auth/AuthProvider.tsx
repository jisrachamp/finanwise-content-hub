import React, { createContext, useEffect, useMemo, useState } from "react";
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
  logout: () => void;
  hydrate: () => void;
};

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);

  const hydrate = () => {
    const s = loadSession();
    setSession(s);
  };

  useEffect(() => {
    hydrate();
  }, []);

  const logout = () => {
    clearSession();
    setSession(null);
  };

  const login = async (payload: LoginPayload) => {
    const res = await authApi.login(payload);

    // ✅ Regla: solo admins pueden entrar al CMS
    if (res.user.rol !== "admin") {
      // No guardes tokens si no es admin
      logout();
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

  const value = useMemo<AuthContextValue>(() => {
    const user = session?.user ?? null;
    const accessToken = session?.accessToken ?? null;
    const refreshToken = session?.refreshToken ?? null;
    const isAuthenticated = Boolean(user && accessToken);
    const isAdmin = user?.rol === "admin";

    return {
      user,
      accessToken,
      refreshToken,
      isAuthenticated,
      isAdmin,
      login,
      logout,
      hydrate,
    };
  }, [session]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
