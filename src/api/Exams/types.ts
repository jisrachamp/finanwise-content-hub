// src/api/Exams/types.ts
export type ExamTipo = "conocimiento" | "percepcion";
export type ExamTema = "ahorro" | "inversion" | "credito" | "control-gastos" | "general";
export type ExamNivel = "basico" | "intermedio" | "avanzado";

export type ExamAnswer = {
  preguntaID: string; // normalizado a string
  respuestaSeleccionada: "a" | "b" | "c" | "d";
  esCorrecta?: boolean; // a veces backend lo manda, a veces lo calcula
};

export type Exam = {
  _id: string;
  tipo: ExamTipo;
  tema: ExamTema;
  nivel: ExamNivel;
  usuarioID: string;
  preguntas: ExamAnswer[];
  puntuacion?: number;
  puntuacionMinimaRequerida?: number;
  puntuacionMaximaRequerida?: number;
  fecha?: string;
};

export type Paginated<T> = {
  data: T[];
  meta: { total: number; page: number; limit: number; pages: number };
};

/** helpers para tolerar { $oid } o { $date } */
export function unwrapMongoId(v: any): string {
  if (!v) return "";
  if (typeof v === "string") return v;
  if (typeof v === "object" && typeof v.$oid === "string") return v.$oid;
  return String(v);
}

export function unwrapMongoDate(v: any): string {
  if (!v) return "";
  if (typeof v === "string") return v;
  if (typeof v === "object" && typeof v.$date === "string") return v.$date;
  return String(v);
}
