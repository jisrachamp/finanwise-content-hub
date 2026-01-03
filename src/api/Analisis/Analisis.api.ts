// src/api/Analisis/Analisis.api.ts
import { apiFetch } from "@/api/http";
import type {
  DashboardResponse,
  IndicadorKPI,
  SerieTemporalResponse,
  ComposicionCategoriasResponse,
  ResumenResponse,
  RachaResponse,
  DTIResponse,
  VariacionMensualResponse,
  CohortesResponse,
  SegmentacionResponse,
  UsuarioScopedParams,
  ComposicionParams,
  VariacionParams,
  AdminRangeParams,
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

// ====== ADMIN ======
export async function analyticsAdminDashboard(usuarioId?: string) {
  return apiFetch<DashboardResponse>(`/analytics/dashboard${qs({ usuarioId })}`, { method: "GET" });
}

export async function analyticsAdminKPIsLatest(usuarioId?: string) {
  return apiFetch<IndicadorKPI>(`/analytics/kpis${qs({ usuarioId })}`, { method: "GET" });
}

export async function analyticsAdminCohortes(params: AdminRangeParams) {
  const { from, to } = params;
  return apiFetch<CohortesResponse>(`/analytics/admin/cohortes${qs({ from, to })}`, { method: "GET" });
}

export async function analyticsAdminSegmentacion(params: AdminRangeParams) {
  const { from, to } = params;
  return apiFetch<SegmentacionResponse>(`/analytics/admin/segmentacion${qs({ from, to })}`, {
    method: "GET",
  });
}

// ====== USUARIO (self) / ADMIN (puede pasar usuarioId) ======
export async function analyticsSerieTemporal(params: UsuarioScopedParams) {
  const { usuarioId, from, to } = params;
  return apiFetch<SerieTemporalResponse>(`/analytics/usuario/serie${qs({ usuarioId, from, to })}`, {
    method: "GET",
  });
}

export async function analyticsComposicionCategorias(params: ComposicionParams) {
  const { usuarioId, from, to, top } = params;
  return apiFetch<ComposicionCategoriasResponse>(
    `/analytics/usuario/composicion${qs({ usuarioId, from, to, top })}`,
    { method: "GET" }
  );
}

export async function analyticsResumen(params: UsuarioScopedParams) {
  const { usuarioId, from, to } = params;
  return apiFetch<ResumenResponse>(`/analytics/usuario/resumen${qs({ usuarioId, from, to })}`, {
    method: "GET",
  });
}

export async function analyticsRacha(params: UsuarioScopedParams) {
  const { usuarioId, from, to } = params;
  return apiFetch<RachaResponse>(`/analytics/usuario/racha${qs({ usuarioId, from, to })}`, {
    method: "GET",
  });
}

export async function analyticsDTI(params: UsuarioScopedParams) {
  const { usuarioId, from, to } = params;
  return apiFetch<DTIResponse>(`/analytics/usuario/dti${qs({ usuarioId, from, to })}`, {
    method: "GET",
  });
}

export async function analyticsVariacionMensual(params: VariacionParams) {
  const { usuarioId, año, mes, allowZeroBase, presupuesto } = params;
  return apiFetch<VariacionMensualResponse>(
    `/analytics/usuario/variacion${qs({ usuarioId, año, mes, allowZeroBase, presupuesto })}`,
    { method: "GET" }
  );
}

/**
 * ✅ EXPORTS con los nombres que tu vista está importando
 * (para no tocar tu componente)
 */
export const analyticsDashboard = analyticsAdminDashboard;
export const analyticsKPIsLatest = analyticsAdminKPIsLatest;
export const adminCohortes = analyticsAdminCohortes;
export const adminSegmentacion = analyticsAdminSegmentacion;
