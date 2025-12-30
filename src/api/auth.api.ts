import { apiFetch } from "@/api/http";
import type { LoginPayload, LoginResponse } from "@/types/auth.types";

export async function login(payload: LoginPayload) {
  return apiFetch<LoginResponse>("/auth/login", {
    method: "POST",
    auth: false,
    body: JSON.stringify(payload),
  });
}

export async function logout() {
  // Endpoint backend
  return apiFetch<void>("/auth/logout", { method: "POST" });
}
