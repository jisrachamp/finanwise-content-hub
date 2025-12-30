export type QuestionAnswerOption = {
  inciso: "a" | "b" | "c" | "d";
  texto: string;
  correcta: boolean;
};

export type Question = {
  _id: string;
  tipo: "conocimiento" | "percepcion";
  tema: "ahorro" | "inversion" | "credito" | "control-gastos" | "general";
  nivel: "basico" | "intermedio" | "avanzado";
  dimension?: string;
  pregunta: string;
  respuestas: QuestionAnswerOption[];
  estado: "activa" | "inactiva";
  fechaCreacion: string;
};

export type QuestionUpsertPayload = Omit<Question, "_id" | "fechaCreacion">;

export type Paginated<T> = {
  data: T[];
  meta: { total: number; page: number; limit: number; pages: number };
};
