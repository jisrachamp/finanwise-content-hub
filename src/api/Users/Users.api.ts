import { apiFetch } from "@/api/http";
import type { Usuario, UsuarioCreatePayload, UsuarioUpdatePayload } from "./types";

export async function usersList() {
  return apiFetch<Usuario[]>("/usuarios", { method: "GET" });
}

/**
 * ⚠️ Ajusta si tu backend usa otra ruta para crear.
 */
export async function usersCreate(payload: UsuarioCreatePayload) {
  return apiFetch<Usuario>("/usuarios", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/**
 * ⚠️ Ajusta si tu backend usa otra ruta para editar.
 */
export async function usersUpdate(id: string, payload: UsuarioUpdatePayload) {
  return apiFetch<Usuario>(`/usuarios/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

/**
 * ⚠️ Ajusta si tu backend usa otra ruta para eliminar.
 */
export async function usersDelete(id: string) {
  return apiFetch<void>(`/usuarios/${id}`, { method: "DELETE" });
}
