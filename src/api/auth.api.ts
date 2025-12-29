import { apiFetch } from "@/api/http";
import type { LoginPayload, LoginResponse } from "@/types/auth.types";

export async function login(payload: LoginPayload) {
  // Endpoint que diste: /api/auth/login
  return apiFetch<LoginResponse>("/auth/login", {
    method: "POST",
    auth: false,
    body: JSON.stringify(payload),
  });
}
