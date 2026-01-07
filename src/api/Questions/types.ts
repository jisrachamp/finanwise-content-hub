// === QUESTIONS ===

export type QuestionTipo = "conocimiento" | "percepcion";
export type QuestionNivel = "basico" | "intermedio" | "avanzado";
export type QuestionEstado = "activa" | "inactiva";

/**
 * IMPORTANTE:
 * Tu BACKEND NO acepta "presupuesto" (según Joi).
 * Si lo quieres usar de verdad, hay que agregarlo al backend también.
 */
export type QuestionTema =
  | "ahorro"
  | "inversion"
  | "credito"
  | "control-gastos"
  | "presupuesto"
  | "general";

export type Answer = {
  inciso: "a" | "b" | "c" | "d";
  texto: string;
  correcta: boolean;
};

export type Question = {
  _id: string;
  tipo: QuestionTipo;
  tema: QuestionTema;
  nivel: QuestionNivel;
  dimension?: string | null;
  pregunta: string;
  respuestas: Answer[];
  estado: QuestionEstado;
  fechaCreacion?: string;
};

export type QuestionUpsertPayload = {
  tipo: QuestionTipo;
  tema: QuestionTema;
  nivel: QuestionNivel;
  dimension?: string | null;
  pregunta: string;
  respuestas: Answer[];
  estado: QuestionEstado;
};

export const LABEL_TIPO: Record<QuestionTipo, string> = {
  conocimiento: "conocimiento",
  percepcion: "percepción",
};

export const LABEL_NIVEL: Record<QuestionNivel, string> = {
  basico: "básico",
  intermedio: "intermedio",
  avanzado: "avanzado",
};

export const LABEL_TEMA: Record<QuestionTema, string> = {
  ahorro: "ahorro",
  inversion: "inversión",
  credito: "crédito",
  "control-gastos": "control de gastos",
  presupuesto: "presupuesto",
  general: "general",
};
