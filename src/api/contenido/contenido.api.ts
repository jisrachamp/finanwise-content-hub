import { apiFetch } from "@/api/http";
import type {
  Capsule,
  Paginated,
  EducationSearchParams,
  EducationListParams,
  CapsuleUpsertPayload,
} from "./types";

function qs(params: Record<string, any>) {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === "") return;
    sp.set(k, String(v));
  });
  const s = sp.toString();
  return s ? `?${s}` : "";
}

// ====== EDUCATION (consulta / búsqueda) ======

export async function educationSearch(params: EducationSearchParams) {
  const { text = "", page = 1, limit = 10 } = params;
  return apiFetch<Paginated<Capsule>>(`/education/search${qs({ text, page, limit })}`, {
    method: "GET",
  });
}

export async function educationGetById(id: string) {
  return apiFetch<Capsule>(`/education/capsules/${id}`, { method: "GET" });
}

export async function educationList(params: EducationListParams) {
  const { page = 1, limit = 10 } = params;
  return apiFetch<Paginated<Capsule>>(`/education/capsules${qs({ page, limit })}`, {
    method: "GET",
  });
}

// ====== ADMIN (CRUD) ======

export async function adminListContent() {
  return apiFetch<Capsule[]>(`/admin/content`, { method: "GET" });
}

export async function adminCreateContent(payload: CapsuleUpsertPayload) {
  return apiFetch<Capsule>(`/admin/content`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function adminUpdateContent(id: string, payload: CapsuleUpsertPayload) {
  return apiFetch<Capsule>(`/admin/content/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function adminDeleteContent(id: string) {
  return apiFetch<void>(`/admin/content/${id}`, { method: "DELETE" });
}
