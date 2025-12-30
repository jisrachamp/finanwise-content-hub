export type ExamAnswer = {
  preguntaID: string;
  respuestaSeleccionada: "a" | "b" | "c" | "d";
  esCorrecta: boolean;
};

export type Exam = {
  _id: string;
  tipo: "conocimiento" | "percepcion";
  tema: "ahorro" | "inversion" | "credito" | "control-gastos" | "general";
  nivel: "basico" | "intermedio" | "avanzado";
  usuarioID: string; // <- CONFIRMADO: viene en el schema
  preguntas: ExamAnswer[];
  puntuacion: number;
  puntuacionMinimaRequerida: number;
  puntuacionMaximaRequerida: number;
  fecha: string;
};

export type Paginated<T> = {
  data: T[];
  meta: { total: number; page: number; limit: number; pages: number };
};
