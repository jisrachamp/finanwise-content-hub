import type { Paginated, Question, QuestionUpsertPayload } from "./types";

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

export async function adminQuestionsSearch(params: {
  text?: string;
  tipo?: string;
  tema?: string;
  nivel?: string;
  estado?: string;
  page: number;
  limit: number;
}): Promise<Paginated<Question>> {
  const qs = new URLSearchParams();
  if (params.text) qs.set("text", params.text);
  if (params.tipo && params.tipo !== "all") qs.set("tipo", params.tipo);
  if (params.tema && params.tema !== "all") qs.set("tema", params.tema);
  if (params.nivel && params.nivel !== "all") qs.set("nivel", params.nivel);
  if (params.estado && params.estado !== "all") qs.set("estado", params.estado);
  qs.set("page", String(params.page));
  qs.set("limit", String(params.limit));

  return fetchJson(`/api/admin/questions?${qs.toString()}`);
}

export async function adminQuestionGetById(id: string): Promise<Question> {
  return fetchJson(`/api/admin/questions/${id}`);
}

export async function adminQuestionCreate(payload: QuestionUpsertPayload): Promise<Question> {
  return fetchJson(`/api/admin/questions`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function adminQuestionUpdate(id: string, payload: QuestionUpsertPayload): Promise<Question> {
  return fetchJson(`/api/admin/questions/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function adminQuestionDelete(id: string): Promise<{ ok: true }> {
  return fetchJson(`/api/admin/questions/${id}`, { method: "DELETE" });
}
