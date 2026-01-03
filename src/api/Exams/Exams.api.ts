import type { Exam, Paginated } from "./types";

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    ...init,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export async function adminExamsSearch(params: {
  usuarioID?: string;
  tipo?: string;
  tema?: string;
  nivel?: string;
  from?: string; // ISO
  to?: string;   // ISO
  page: number;
  limit: number;
}): Promise<Paginated<Exam>> {
  const qs = new URLSearchParams();
  if (params.usuarioID) qs.set("usuarioID", params.usuarioID);
  if (params.tipo && params.tipo !== "all") qs.set("tipo", params.tipo);
  if (params.tema && params.tema !== "all") qs.set("tema", params.tema);
  if (params.nivel && params.nivel !== "all") qs.set("nivel", params.nivel);
  if (params.from) qs.set("from", params.from);
  if (params.to) qs.set("to", params.to);
  qs.set("page", String(params.page));
  qs.set("limit", String(params.limit));

  return fetchJson(`/api/admin/exams?${qs.toString()}`);
}

export async function adminExamGetById(id: string): Promise<Exam> {
  return fetchJson(`/api/admin/exams/${id}`);
}

// opcional
export async function adminExamDelete(id: string): Promise<{ ok: true }> {
  return fetchJson(`/api/admin/exams/${id}`, { method: "DELETE" });
}
