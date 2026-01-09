// src/api/Exams/Exams.api.ts
import type { Exam, Paginated } from "./types";
import { apiFetch } from "@/api/http";
import { unwrapMongoDate, unwrapMongoId } from "./types";

/** ===== Usuarios (para el CMS de exámenes) ===== */
export type CmsUser = {
  _id: string;
  nombre?: string;
  correo?: string;
  rol?: string;
  fechaRegistro?: string;
};

function normalizeUser(raw: any): CmsUser {
  return {
    _id: unwrapMongoId(raw?._id),
    nombre: raw?.nombre ?? raw?.username ?? raw?.name ?? "",
    correo: raw?.correo ?? raw?.email ?? "",
    rol: raw?.rol ?? raw?.role ?? "",
    fechaRegistro: unwrapMongoDate(raw?.fechaRegistro),
  };
}

/** GET /usuarios */
export async function adminUsersList(): Promise<CmsUser[]> {
  const raw: any = await apiFetch(`/usuarios`);

  const arr =
    Array.isArray(raw) ? raw :
    Array.isArray(raw?.data) ? raw.data :
    Array.isArray(raw?.items) ? raw.items :
    [];

  const users = arr.map(normalizeUser);
  users.sort((a, b) => (a.nombre || "").localeCompare(b.nombre || "", "es"));
  return users;
}

/** ===== Preguntas (para mostrar texto en detalle de examen) ===== */
export type UserQuestion = {
  _id: string;
  tipo: "conocimiento" | "percepcion";
  tema: "ahorro" | "inversion" | "credito" | "control-gastos" | "general" | string;
  nivel: "basico" | "intermedio" | "avanzado" | string;
  dimension?: string;
  pregunta: string;
  respuestas: { inciso: "a" | "b" | "c" | "d"; texto: string; correcta: boolean }[];
  estado?: string;
  fechaCreacion?: string;
};

function normalizeUserQuestion(raw: any): UserQuestion {
  return {
    _id: unwrapMongoId(raw?._id),
    tipo: raw?.tipo,
    tema: raw?.tema,
    nivel: raw?.nivel,
    dimension: raw?.dimension ?? "",
    pregunta: raw?.pregunta ?? "",
    respuestas: Array.isArray(raw?.respuestas) ? raw.respuestas : [],
    estado: raw?.estado,
    fechaCreacion: unwrapMongoDate(raw?.fechaCreacion),
  };
}

/** GET /preguntas/userQuestions/:id */
export async function userQuestionGetById(id: string): Promise<UserQuestion> {
  const raw: any = await apiFetch(`/preguntas/userQuestions/${id}`);
  return normalizeUserQuestion(raw);
}

/** ===== Exámenes ===== */
function normalizeExam(raw: any): Exam {
  return {
    _id: unwrapMongoId(raw?._id),
    tipo: raw?.tipo,
    tema: raw?.tema,
    nivel: raw?.nivel,
    usuarioID: unwrapMongoId(raw?.usuarioID),
    preguntas: Array.isArray(raw?.preguntas)
      ? raw.preguntas.map((p: any) => ({
          preguntaID: unwrapMongoId(p?.preguntaID),
          respuestaSeleccionada: p?.respuestaSeleccionada,
          esCorrecta: p?.esCorrecta,
        }))
      : [],
    puntuacion: raw?.puntuacion ?? 0,
    puntuacionMinimaRequerida: raw?.puntuacionMinimaRequerida ?? 0,
    puntuacionMaximaRequerida: raw?.puntuacionMaximaRequerida ?? 0,
    fecha: unwrapMongoDate(raw?.fecha),
  };
}

/**
 * ✅ LISTADO CMS:
 * - Tu backend lista exámenes por usuario: GET /examenes/usuario/:usuarioId
 * - Aquí filtramos/paginamos en front.
 */
export async function adminExamsSearch(params: {
  usuarioID?: string; // requerido realmente
  tipo?: string;
  tema?: string;
  nivel?: string;
  from?: string; // ISO
  to?: string; // ISO
  page: number;
  limit: number;
}): Promise<Paginated<Exam>> {
  const usuarioId = (params.usuarioID || "").trim();

  if (!usuarioId) {
    return {
      data: [],
      meta: { total: 0, page: params.page, limit: params.limit, pages: 0 },
    };
  }

  const listRaw: any = await apiFetch(`/examenes/usuario/${usuarioId}`);

  const arr =
    Array.isArray(listRaw) ? listRaw :
    Array.isArray(listRaw?.data) ? listRaw.data :
    Array.isArray(listRaw?.items) ? listRaw.items :
    [];

  let exams = arr.map(normalizeExam);

  // filtros front
  if (params.tipo && params.tipo !== "all") exams = exams.filter((e) => e.tipo === params.tipo);
  if (params.tema && params.tema !== "all") exams = exams.filter((e) => e.tema === params.tema);
  if (params.nivel && params.nivel !== "all") exams = exams.filter((e) => e.nivel === params.nivel);

  if (params.from) {
    const from = new Date(params.from).getTime();
    exams = exams.filter((e) => (e.fecha ? new Date(e.fecha).getTime() : 0) >= from);
  }
  if (params.to) {
    const to = new Date(params.to).getTime();
    exams = exams.filter((e) => (e.fecha ? new Date(e.fecha).getTime() : 0) <= to);
  }

  exams.sort(
    (a, b) => (b.fecha ? new Date(b.fecha).getTime() : 0) - (a.fecha ? new Date(a.fecha).getTime() : 0)
  );

  const total = exams.length;
  const limit = Math.max(1, Number(params.limit) || 10);
  const page = Math.max(1, Number(params.page) || 1);
  const pages = Math.ceil(total / limit) || 0;

  const start = (page - 1) * limit;
  const data = exams.slice(start, start + limit);

  return { data, meta: { total, page, limit, pages } };
}

export async function adminExamGetById(id: string): Promise<Exam> {
  const raw = await apiFetch<any>(`/examenes/${id}`);
  return normalizeExam(raw);
}

export async function adminExamDelete(id: string): Promise<{ ok: true }> {
  await apiFetch(`/examenes/${id}`, { method: "DELETE" });
  return { ok: true };
}
