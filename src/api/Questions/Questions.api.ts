// src/api/Questions/Questions.api.ts
import { apiFetch } from "@/api/http";
import type { Question, QuestionUpsertPayload } from "./types";

function qs(params: Record<string, any>) {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === "") return;
    sp.set(k, String(v));
  });
  const s = sp.toString();
  return s ? `?${s}` : "";
}

/**
 * RUTAS BACKEND (según tu router):
 * GET    /preguntas                (listar + filtros)
 * POST   /preguntas                (crear 1 o muchas)
 * GET    /preguntas/:id             (admin)
 * GET    /preguntas/userQuestions/:id (usuario)
 * PATCH  /preguntas/:id             (admin)
 * DELETE /preguntas/:id             (admin)
 * GET    /preguntas/export          (admin)
 * POST   /preguntas/import          (admin)
 * GET    /preguntas/sugerencias     (user)
 */
const BASE = "/preguntas";

/** LISTAR (esto es tu "search") */
export async function adminQuestionsSearch(params: {
  text?: string;
  tipo?: string;   // "all" o enum
  tema?: string;   // "all" o enum
  nivel?: string;  // "all" o enum
  estado?: string; // "all" o enum
  page?: number;
  limit?: number;
}) {
  const cleaned = {
    text: params.text || undefined,
    tipo: params.tipo && params.tipo !== "all" ? params.tipo : undefined,
    tema: params.tema && params.tema !== "all" ? params.tema : undefined,
    nivel: params.nivel && params.nivel !== "all" ? params.nivel : undefined,
    estado: params.estado && params.estado !== "all" ? params.estado : undefined,
    page: params.page ?? 1,
    limit: params.limit ?? 20,
  };

  // backend: listarPreguntas
  return apiFetch<any>(`${BASE}${qs(cleaned)}`, { method: "GET" });
}

/** OBTENER POR ID (ADMIN) */
export async function adminQuestionGetById(id: string) {
  return apiFetch<Question>(`${BASE}/${id}`, { method: "GET" });
}

/** OBTENER POR ID (USUARIO) - si lo necesitas en alguna vista no-admin */
export async function userQuestionGetById(id: string) {
  return apiFetch<Question>(`${BASE}/userQuestions/${id}`, { method: "GET" });
}

/** CREAR (1 o ARRAY) */
export async function adminQuestionCreate(payload: QuestionUpsertPayload | QuestionUpsertPayload[]) {
  return apiFetch<any>(`${BASE}`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/** ACTUALIZAR (PATCH) */
export async function adminQuestionUpdate(id: string, payload: QuestionUpsertPayload) {
  return apiFetch<Question>(`${BASE}/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

/** ELIMINAR */
export async function adminQuestionDelete(id: string) {
  return apiFetch<void>(`${BASE}/${id}`, { method: "DELETE" });
}

/** EXPORT (admin) */
export async function adminQuestionsExport(params: {
  text?: string;
  tipo?: string;
  tema?: string;
  nivel?: string;
  estado?: string;
}) {
  const cleaned = {
    text: params.text || undefined,
    tipo: params.tipo && params.tipo !== "all" ? params.tipo : undefined,
    tema: params.tema && params.tema !== "all" ? params.tema : undefined,
    nivel: params.nivel && params.nivel !== "all" ? params.nivel : undefined,
    estado: params.estado && params.estado !== "all" ? params.estado : undefined,
  };
  return apiFetch<any>(`${BASE}/export${qs(cleaned)}`, { method: "GET" });
}

/** IMPORT (admin) */
export async function adminQuestionsImport(payload: QuestionUpsertPayload[]) {
  return apiFetch<any>(`${BASE}/import`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/** SUGERENCIAS (usuario) */
export async function userQuestionsSuggestions(params?: {
  tipo?: string;
  tema?: string;
  nivel?: string;
  limit?: number;
}) {
  return apiFetch<any>(`${BASE}/sugerencias${qs(params ?? {})}`, { method: "GET" });
}
