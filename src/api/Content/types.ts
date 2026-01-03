export type QuizOption = {
  _id?: string;
  texto: string;
  correcta: boolean;
};

export type QuizQuestion = {
  _id?: string;
  enunciado: string;
  opciones: QuizOption[];
  explicacionCorrecta?: string;
};

export type Quiz = {
  preguntas: QuizQuestion[];
  intentosMax?: number;
};

export type Capsule = {
  _id: string;
  titulo: string;
  cuerpo: string;
  nivel: "básico" | "intermedio" | "avanzado" | string;
  tipo: "capsula" | string;

  temas: string[];
  etiquetas: string[];

  quiz?: Quiz;

  likes: number;
  dislikes: number;

  fuentes: any[];
  pasos: any[];

  fechaCreacion?: string;
  __v?: number;
};

export type Paginated<T> = {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
};

export type EducationSearchParams = {
  text?: string;
  page?: number;
  limit?: number;
};

export type EducationListParams = {
  page?: number;
  limit?: number;
};

// Payload admin create/update: parcial o completo
export type CapsuleUpsertPayload = Partial<
  Pick<
    Capsule,
    "titulo" | "cuerpo" | "nivel" | "tipo" | "temas" | "etiquetas" | "quiz" | "fuentes" | "pasos"
  >
>;
