import type { Capsule, CapsuleUpsertPayload, QuizQuestion } from "@/api/Content/types";

export type UpsertMode = "create" | "edit" | "view";

export type UpsertState = {
  _id?: string;
  titulo: string;
  cuerpo: string;
  nivel: string;
  tipo: string;
  temasCsv: string;
  etiquetasCsv: string;

  intentosMax: number;
  preguntas: QuizQuestion[];
};

export function isProbablyMongoId(s: string) {
  return /^[a-fA-F0-9]{24}$/.test(s.trim());
}

export function splitCsv(s: string) {
  return s
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
}

export function joinCsv(arr: string[] | undefined) {
  return (arr ?? []).join(", ");
}

export function makeEmptyState(): UpsertState {
  return {
    titulo: "",
    cuerpo: "",
    nivel: "básico",
    tipo: "capsula",
    temasCsv: "",
    etiquetasCsv: "",
    intentosMax: 3,
    preguntas: [
      {
        enunciado: "",
        explicacionCorrecta: "",
        opciones: [
          { texto: "", correcta: false },
          { texto: "", correcta: true },
        ],
      },
    ],
  };
}

export function fromCapsule(c: Capsule): UpsertState {
  return {
    _id: c._id,
    titulo: c.titulo ?? "",
    cuerpo: c.cuerpo ?? "",
    nivel: c.nivel ?? "básico",
    tipo: c.tipo ?? "capsula",
    temasCsv: joinCsv(c.temas),
    etiquetasCsv: joinCsv(c.etiquetas),
    intentosMax: c.quiz?.intentosMax ?? 3,
    preguntas:
      c.quiz?.preguntas?.length
        ? c.quiz.preguntas.map((q) => ({
            _id: q._id,
            enunciado: q.enunciado ?? "",
            explicacionCorrecta: q.explicacionCorrecta ?? "",
            opciones: (q.opciones ?? []).map((o) => ({
              _id: o._id,
              texto: o.texto ?? "",
              correcta: Boolean(o.correcta),
            })),
          }))
        : makeEmptyState().preguntas,
  };
}

export function toPayload(s: UpsertState): CapsuleUpsertPayload {
  const temas = splitCsv(s.temasCsv);
  const etiquetas = splitCsv(s.etiquetasCsv);

  const hasAnyQuizText =
    s.preguntas.some((p) => p.enunciado.trim() || p.opciones.some((o) => o.texto.trim()));

  const payload: CapsuleUpsertPayload = {
    titulo: s.titulo.trim(),
    cuerpo: s.cuerpo.trim(),
    nivel: s.nivel,
    tipo: s.tipo,
    temas,
    etiquetas,
  };

  if (hasAnyQuizText) {
    payload.quiz = {
      intentosMax: s.intentosMax,
      preguntas: s.preguntas.map((p) => ({
        enunciado: p.enunciado,
        explicacionCorrecta: p.explicacionCorrecta ?? "",
        opciones: p.opciones.map((o) => ({
          texto: o.texto,
          correcta: Boolean(o.correcta),
        })),
      })),
    };
  }

  return payload;
}
