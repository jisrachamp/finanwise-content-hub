// src/api/Analisis/types.ts

export type ObjectId = string;

export type ISODateString = string; // "2026-01-01" o "2026-01-01T00:00:00.000Z"

export type KPITrend = "positiva" | "negativa" | "estable";

export type IndicadorKPI = {
  _id: ObjectId;
  usuarioId: ObjectId;
  fechaCalculo: ISODateString;
  ingresos: number;
  egresos: number;
  ahorro: number;
  inversiones: number;
  endeudamiento: number;
  frecuenciaRegistro: number;
  tendenciaActual: KPITrend;
};

export type DashboardResponse = {
  items: IndicadorKPI[];
};

export type SerieTemporalPoint = {
  año: number;
  mes: number; // 1-12
  ingresos: number;
  egresos: number;
  ahorro: number;
};

export type SerieTemporalResponse = {
  serie: SerieTemporalPoint[];
};

export type ComposicionCategoriaItem = {
  categoriaId: ObjectId | null;
  nombre: string;
  total: number;
  porcentaje: number; // 0..1
};

export type ComposicionCategoriasResponse = {
  totalEgresos: number;
  items: ComposicionCategoriaItem[];
  otros: number;
};

export type ResumenResponse = {
  ingresos: number;
  egresos: number;
  ahorro: number;
};

export type RachaResponse = {
  rachaMaxima: number;
};

export type DTIResponse = {
  dti: number; // 0..1 (placeholder en tu backend)
};

export type VariacionMensualResponse = {
  periodo: { año: number; mes: number };
  mesAnterior: { año: number; mes: number };
  actual: { ingresos: number; egresos: number; ahorro: number };
  anterior: { ingresos: number; egresos: number; ahorro: number };
  variacionIngresos: number | null;
  variacionEgresos: number | null;
  variacionAhorro: number | null;
  vsPresupuestoEgresos: number | null;
};

export type CohorteItem = {
  año: number;
  mes: number;
  usuarios: number;
  activosPeriodo: number;
  tasaActividad: number; // 0..1
};

export type CohortesResponse = {
  periodo: { from: ISODateString; to: ISODateString };
  cohorts: CohorteItem[];
  totales: { usuarios: number; activosPeriodo: number };
};

export type SegmentacionGrupo = {
  incomeTier: "bajo" | "medio" | "alto" | "desconocido";
  usuarios: number;
  ahorroRatePromedio: number; // 0..1
};

export type SegmentacionDetalle = {
  usuarioId: ObjectId;
  ingresosPeriodo: number;
  egresosPeriodo: number;
  ahorroPeriodo: number;
  ingresoReferencia: number;
  ahorroRate: number | null;
  incomeTier: "bajo" | "medio" | "alto" | "desconocido";
};

export type SegmentacionResponse = {
  periodo: { from: ISODateString; to: ISODateString };
  grupos: SegmentacionGrupo[];
  detalles: SegmentacionDetalle[];
};

// ================= PARAMS (query) =================

// endpoints usuario: aceptan usuarioId opcional (admin) o se toma req.user.id
export type UsuarioScopedParams = {
  usuarioId?: ObjectId;
  from?: ISODateString;
  to?: ISODateString;
};

export type ComposicionParams = UsuarioScopedParams & {
  top?: number; // default 5
};

export type VariacionParams = {
  usuarioId?: ObjectId;
  año?: number;
  mes?: number; // 1-12
  allowZeroBase?: boolean;
  presupuesto?: number; // manual
};

export type AdminRangeParams = {
  from: ISODateString;
  to: ISODateString;
};
