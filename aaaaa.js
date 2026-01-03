Con tu nuevo esquema unificado de simuladores, el análisis (KPIs/DTI/ahorro) no cambia en su fórmula; lo que cambia es cómo modelas y consultas “uso de simuladores” (y su último resultado) para mostrarlo en la vista de análisis descriptivo.

Abajo te dejo:

Qué campos “faltan” (recomendados) en tu simulador unificado para que sea robusto sin complicarse.

TODOS los esquemas Mongoose (con campos mínimos + necesarios para análisis descriptivo sencillo: filtros por fecha, DTI, usuario, y métricas básicas + calificaciones + feedback + simuladores).

1) Simulador unificado: ¿faltó algún campo “necesario”?

Con tus objetivos (offline, editar, descargar nube, gráficas, “simulador real”), tu lista está bien. Solo te recomiendo agregar estos 3–6 campos:

Necesarios prácticos (muy recomendados):

status: "active" | "inactive" | "archived" (para ocultar sin borrar)

isPinned o favorite: (UX, acceso rápido)

deletedAt (soft delete, por si sincronizas)

lastOpenedAt (para “Recientes”)

runCount (contador simple)

sync: estado de sincronización si vas a nube (ej. "synced" | "dirty" | "conflict")

Si quieres historial de corridas, NO lo guardes dentro del doc (se vuelve pesado). Guarda lastRun aquí y un SimRun separado opcional.

2) Esquemas completos para “análisis descriptivo sencillo”
A) Transacción (base para KPIs, análisis mensual, presupuesto, etc.)

models/Transaccion.js

import mongoose from "mongoose";

const clasificacionSchema = new mongoose.Schema(
  {
    essential: { type: Boolean, default: true },
    fixed: { type: Boolean, default: false },
    recurrent: { type: Boolean, default: true },
  },
  { _id: false }
);

const transaccionSchema = new mongoose.Schema({
  usuarioId: { type: mongoose.Schema.Types.ObjectId, ref: "Usuario", required: true },

  // ingreso | egreso | transferencia | financiero
  tipoMovimiento: {
    type: String,
    enum: ["ingreso", "egreso", "transferencia", "financiero"],
    required: true,
  },

  monto: { type: Number, required: true, min: 0 },
  descripcion: { type: String, default: "", maxLength: 220 },

  fecha: { type: Date, required: true }, // fecha real del movimiento
  fechaRegistro: { type: Date, default: Date.now },

  origen: { type: String, enum: ["manual", "csv", "import", "api"], default: "manual" },

  // ==== Taxonomía ====
  // Egreso: COICOP 01–13
  categoriaCode: {
    type: String,
    match: /^(0[1-9]|1[0-3])$/,
    required: function () { return this.tipoMovimiento === "egreso"; },
  },
  categoriaLabel: { type: String, maxLength: 120 }, // opcional para UI/histórico

  // Para egreso (subcategoría) o ingreso (origen del ingreso)
  subcategoria: { type: String, maxLength: 120 },

  clasificacion: { type: clasificacionSchema, default: () => ({}) },
  etiquetas: { type: [String], default: [] },

  // ==== Financiero ====
  // Para DTI y exclusiones (no consumo)
  financieroTipo: {
    type: String,
    enum: ["ahorro_inversion", "pago_deuda", "prestamo_otorgado", "activo", "otro"],
    required: function () { return this.tipoMovimiento === "financiero"; },
  },

  // ==== Transferencias ====
  esTransferenciaInterna: { type: Boolean, default: false },
  transferenciaRef: { type: String, maxLength: 80 },
});

transaccionSchema.index({ usuarioId: 1, fecha: -1 });
transaccionSchema.index({ usuarioId: 1, tipoMovimiento: 1, fecha: -1 });
transaccionSchema.index({ usuarioId: 1, categoriaCode: 1, fecha: -1 });

export default mongoose.model("Transaccion", transaccionSchema);

B) Análisis por periodo (mensual) — para la vista de análisis con filtros (rango/DTI/usuario)

models/AnalisisPeriodo.js

import mongoose from "mongoose";

const topCategoriaSchema = new mongoose.Schema(
  {
    categoriaCode: { type: String, match: /^(0[1-9]|1[0-3])$/, required: true },
    total: { type: Number, required: true, min: 0 },
    porcentaje: { type: Number, min: 0, max: 1 },
  },
  { _id: false }
);

const totalesEtiquetasSchema = new mongoose.Schema(
  {
    esencial: { type: Number, default: 0 },
    discrecional: { type: Number, default: 0 },
    fijo: { type: Number, default: 0 },
    variable: { type: Number, default: 0 },
    recurrente: { type: Number, default: 0 },
    noRecurrente: { type: Number, default: 0 },
  },
  { _id: false }
);

const conteosSchema = new mongoose.Schema(
  {
    total: { type: Number, default: 0 },
    ingresos: { type: Number, default: 0 },
    egresos: { type: Number, default: 0 },
    transferencias: { type: Number, default: 0 },
    financieros: { type: Number, default: 0 },
    diasConRegistro: { type: Number, default: 0 },
    origenes: {
      manual: { type: Number, default: 0 },
      csv: { type: Number, default: 0 },
      import: { type: Number, default: 0 },
      api: { type: Number, default: 0 },
    },
  },
  { _id: false }
);

const resumenSchema = new mongoose.Schema(
  {
    ingresosTotales: { type: Number, default: 0 },

    egresosConsumo: { type: Number, default: 0 },       // COICOP 01–13
    egresosFinancieros: { type: Number, default: 0 },   // financiero
    transferenciasInternas: { type: Number, default: 0 },

    ahorro: { type: Number, default: 0 },               // ingresos - egresosConsumo
    tasaAhorro: { type: Number, default: 0 },           // ahorro/ingresos

    pagosDeuda: { type: Number, default: 0 },           // financieroTipo=pago_deuda
    dti: { type: Number, default: 0 },                  // pagosDeuda/ingresos
  },
  { _id: false }
);

const analisisPeriodoSchema = new mongoose.Schema({
  usuarioId: { type: mongoose.Schema.Types.ObjectId, ref: "Usuario", required: true },

  periodo: {
    mes: { type: Number, min: 1, max: 12, required: true },
    año: { type: Number, min: 2000, max: 2100, required: true },
  },

  // el “rango” real que cubre el periodo (útil para filtros por fecha)
  rango: {
    desde: { type: Date, required: true },
    hasta: { type: Date, required: true },
  },

  fechaAnalisis: { type: Date, default: Date.now },

  resumen: { type: resumenSchema, default: () => ({}) },

  desglose: {
    topCategoriasEgreso: { type: [topCategoriaSchema], default: [] },
    totalesEtiquetas: { type: totalesEtiquetasSchema, default: () => ({}) },
    conteos: { type: conteosSchema, default: () => ({}) },
  },

  alertas: { type: [String], default: [] },
});

// único por usuario/mes/año
analisisPeriodoSchema.index({ usuarioId: 1, "periodo.año": 1, "periodo.mes": 1 }, { unique: true });

// filtros por rango y dti
analisisPeriodoSchema.index({ usuarioId: 1, "rango.desde": 1, "rango.hasta": 1 });
analisisPeriodoSchema.index({ "resumen.dti": 1 });

export default mongoose.model("AnalisisPeriodo", analisisPeriodoSchema);

C) KPI Snapshot (si lo quieres separado del análisis)

models/IndicadorKPI.js

import mongoose from "mongoose";

const indicadorKpiSchema = new mongoose.Schema({
  usuarioId: { type: mongoose.Schema.Types.ObjectId, ref: "Usuario", required: true },

  periodo: {
    mes: { type: Number, min: 1, max: 12, required: true },
    año: { type: Number, min: 2000, max: 2100, required: true },
  },

  fechaCalculo: { type: Date, default: Date.now },

  ingresos: { type: Number, default: 0 },
  egresosConsumo: { type: Number, default: 0 },
  egresosFinancieros: { type: Number, default: 0 },

  ahorro: { type: Number, default: 0 },
  tasaAhorro: { type: Number, default: 0 },

  pagosDeuda: { type: Number, default: 0 },
  dti: { type: Number, default: 0 },

  inversiones: { type: Number, default: 0 }, // financieroTipo=ahorro_inversion
  frecuenciaRegistro: { type: Number, default: 0 },

  tendenciaActual: { type: String, enum: ["positiva", "negativa", "estable"], default: "estable" },
});

indicadorKpiSchema.index({ usuarioId: 1, "periodo.año": 1, "periodo.mes": 1 }, { unique: true });
indicadorKpiSchema.index({ usuarioId: 1, fechaCalculo: -1 });

export default mongoose.model("IndicadorKPI", indicadorKpiSchema);

D) Metas (ahorro/deuda/presupuesto mensual)

models/Meta.js

import mongoose from "mongoose";

const metaSchema = new mongoose.Schema({
  usuario: { type: mongoose.Schema.Types.ObjectId, ref: "Usuario", required: true },

  tipo: { type: String, enum: ["presupuesto-mensual", "ahorro", "deuda"], required: true },

  descripcion: { type: String, default: "" },

  montoObjetivo: { type: Number, required: true },
  montoActual: { type: Number, default: 0 },

  fechaLimite: { type: Date },

  mes: { type: Number, min: 1, max: 12 },
  año: { type: Number, min: 2000, max: 2100 },

  estado: { type: String, enum: ["activa", "completada", "vencida"], default: "activa" },
});

metaSchema.index(
  { usuario: 1, tipo: 1, año: 1, mes: 1 },
  { unique: true, partialFilterExpression: { tipo: "presupuesto-mensual" } }
);

metaSchema.pre("save", function (next) {
  if (this.montoActual >= this.montoObjetivo) this.estado = "completada";
  else if (this.fechaLimite && this.fechaLimite < new Date()) this.estado = "vencida";
  next();
});

export default mongoose.model("Meta", metaSchema);

E) Preguntas + Exámenes (control de calificaciones)

models/Pregunta.js

import mongoose from "mongoose";

const respuestaSchema = new mongoose.Schema(
  { inciso: { type: String, enum: ["a","b","c","d"], required: true },
    texto: { type: String, required: true },
    correcta: { type: Boolean, required: true } },
  { _id: false }
);

const preguntaSchema = new mongoose.Schema({
  tipo: { type: String, enum: ["conocimiento", "percepcion"], required: true },
  tema: { type: String, enum: ["ahorro","inversion","credito","control-gastos","general"], required: true },
  nivel: { type: String, enum: ["basico","intermedio","avanzado"], required: true },

  dimension: { type: String, default: "" },
  pregunta: { type: String, required: true },

  respuestas: {
    type: [respuestaSchema],
    validate: [(arr) => arr && arr.length >= 2, "Debe tener al menos 2 respuestas"],
    required: true,
  },

  estado: { type: String, enum: ["activa", "inactiva"], default: "activa" },
  fechaCreacion: { type: Date, default: Date.now },
});

preguntaSchema.index({ pregunta: 1, tema: 1, nivel: 1, tipo: 1 }, { unique: true });
preguntaSchema.index({ pregunta: "text" });

export default mongoose.model("Pregunta", preguntaSchema);


models/Examen.js

import mongoose from "mongoose";

const respuestaExamenSchema = new mongoose.Schema(
  {
    preguntaID: { type: mongoose.Schema.Types.ObjectId, ref: "Pregunta", required: true },
    respuestaSeleccionada: { type: String, enum: ["a","b","c","d"], required: true },
    esCorrecta: { type: Boolean, required: true },
  },
  { _id: false }
);

const examenSchema = new mongoose.Schema({
  tipo: { type: String, enum: ["conocimiento", "percepcion"], required: true },
  tema: { type: String, enum: ["ahorro","inversion","credito","control-gastos","general"], required: true },
  nivel: { type: String, enum: ["basico","intermedio","avanzado"], required: true },

  usuarioID: { type: mongoose.Schema.Types.ObjectId, ref: "Usuario", required: true },

  versionCuestionario: { type: String, default: "v1" },

  preguntas: { type: [respuestaExamenSchema], validate: [(arr) => arr && arr.length >= 1, "Debe incluir al menos una pregunta"], required: true },

  puntuacion: { type: Number, default: 0 },
  puntuacionMinimaRequerida: { type: Number, default: 0 },
  puntuacionMaximaRequerida: { type: Number, default: 0 },

  fecha: { type: Date, default: Date.now },
});

examenSchema.index({ usuarioID: 1, fecha: -1 });
examenSchema.index({ usuarioID: 1, tema: 1, tipo: 1, fecha: -1 });

export default mongoose.model("Examen", examenSchema);

F) Quiz por Contenido (mini-quiz de artículos)

models/IntentoQuizContenido.js

import mongoose from "mongoose";

const respuestaQuizSchema = new mongoose.Schema(
  {
    preguntaIndex: { type: Number, required: true, min: 0 },
    opcionIndex: { type: Number, required: true, min: 0 },
    esCorrecta: { type: Boolean, required: true },
  },
  { _id: false }
);

const intentoQuizContenidoSchema = new mongoose.Schema({
  usuarioId: { type: mongoose.Schema.Types.ObjectId, ref: "Usuario", required: true },
  contenidoId: { type: mongoose.Schema.Types.ObjectId, ref: "Contenido", required: true },

  intentoNumero: { type: Number, default: 1, min: 1 },
  respuestas: { type: [respuestaQuizSchema], default: [] },

  score: { type: Number, default: 0 }, // correctas/total
  totalPreguntas: { type: Number, default: 0 },
  aprobado: { type: Boolean, default: false },

  fecha: { type: Date, default: Date.now },
});

intentoQuizContenidoSchema.index({ usuarioId: 1, contenidoId: 1, fecha: -1 });

export default mongoose.model("IntentoQuizContenido", intentoQuizContenidoSchema);

G) Feedback separado: Contenido vs Simulador

models/FeedbackContenido.js

import mongoose from "mongoose";

const feedbackContenidoSchema = new mongoose.Schema({
  usuarioId: { type: mongoose.Schema.Types.ObjectId, ref: "Usuario", required: true },
  contenidoId: { type: mongoose.Schema.Types.ObjectId, ref: "Contenido", required: true },
  tipo: { type: String, enum: ["like","dislike"], required: true },
  fecha: { type: Date, default: Date.now },
});

feedbackContenidoSchema.index({ usuarioId: 1, contenidoId: 1 }, { unique: true });

export default mongoose.model("FeedbackContenido", feedbackContenidoSchema);


models/FeedbackSimulador.js

import mongoose from "mongoose";

const feedbackSimuladorSchema = new mongoose.Schema({
  usuarioId: { type: mongoose.Schema.Types.ObjectId, ref: "Usuario", required: true },
  simuladorId: { type: String, required: true }, // tu "id" tipo sim_cc_local_001
  tipo: { type: String, enum: ["like","dislike"], required: true },
  fecha: { type: Date, default: Date.now },
});

feedbackSimuladorSchema.index({ usuarioId: 1, simuladorId: 1 }, { unique: true });

export default mongoose.model("FeedbackSimulador", feedbackSimuladorSchema);

H) Simulador (nuevo esquema unificado) — Mongo/Mongoose

models/Simulador.js

import mongoose from "mongoose";

const optionSchema = new mongoose.Schema(
  { label: { type: String, required: true }, value: { type: String, required: true } },
  { _id: false }
);

const inputSchema = new mongoose.Schema(
  {
    key: { type: String, required: true },
    label: { type: String, required: true },
    type: { type: String, required: true }, // currency, percent, months, years, days, number, select, array, text...
    required: { type: Boolean, default: false },
    min: Number,
    max: Number,
    step: Number,
    defaultValue: { type: mongoose.Schema.Types.Mixed },
    options: { type: [optionSchema], default: [] },
  },
  { _id: false }
);

const simuladorSchema = new mongoose.Schema({
  // Tu id string (sim_cc_local_001)
  id: { type: String, required: true, unique: true },

  simType: {
    type: String,
    enum: ["credit_card", "personal_loan", "savings_goal", "compound_interest", "bonds_investment", "debt_payoff"],
    required: true,
    index: true,
  },

  origin: { type: String, enum: ["local", "cloud"], required: true, index: true },

  // null = preset global de nube
  ownerUserId: { type: mongoose.Schema.Types.ObjectId, ref: "Usuario", default: null, index: true },

  title: { type: String, required: true, maxLength: 160 },
  description: { type: String, default: "", maxLength: 500 },

  currency: { type: String, default: "MXN" },
  locale: { type: String, default: "es-MX" },

  definitionVersion: { type: Number, default: 1 },

  status: { type: String, enum: ["active", "inactive", "archived"], default: "active" },
  isPinned: { type: Boolean, default: false },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },

  deletedAt: { type: Date, default: null },
  lastOpenedAt: { type: Date, default: null },
  runCount: { type: Number, default: 0 },

  cloudRef: {
    remoteId: { type: String, default: null },
    downloadedFrom: { type: String, default: null },
    lastFetchedAt: { type: Date, default: null },
  },

  definition: {
    inputs: { type: [inputSchema], default: [] },
    engine: {
      engineType: { type: String, required: true }, // credit_card_payoff, loan_amortization, etc.
      assumptions: { type: mongoose.Schema.Types.Mixed, default: {} },
    },
  },

  // Últimos valores editados (offline-friendly)
  values: { type: mongoose.Schema.Types.Mixed, default: {} },

  // Último resultado (para gráficas “sin recalcular”)
  lastRun: {
    ranAt: { type: Date, default: null },
    metrics: { type: mongoose.Schema.Types.Mixed, default: {} },
    series: { type: mongoose.Schema.Types.Mixed, default: {} },
  },

  // Estado de sync (si aplica)
  sync: {
    state: { type: String, enum: ["synced", "dirty", "conflict"], default: "synced" },
    lastSyncedAt: { type: Date, default: null },
  },
});

simuladorSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

simuladorSchema.index({ ownerUserId: 1, simType: 1, updatedAt: -1 });

export default mongoose.model("Simulador", simuladorSchema);

Cómo “adaptas el análisis” usando este simulador unificado

En tu vista de análisis (CMS / móvil), además de KPIs financieros, puedes mostrar bloques descriptivos del uso de simuladores, sin romper nada:

“Simuladores usados en el periodo” (consulta por ownerUserId + lastRun.ranAt en rango)

Para crédito/deuda:

debt_payoff.lastRun.metrics.totalInterest, monthsToDebtFree

credit_card.lastRun.metrics.totalInterest, monthsToPayoff

Eso te permite un resumen tipo: “Tu última simulación de deuda sugiere X meses…”

Para ahorro/inversión:

savings_goal.lastRun.metrics.requiredMonthlyContribution

compound_interest.lastRun.metrics.futureValue

bonds_investment.lastRun.metrics.finalValue

No son KPIs “financieros reales” (porque son simulaciones), pero sí son descriptivos y útiles.

Si quieres, el siguiente paso es que te pase la función de cálculo mensual (Mongo aggregation) que genera AnalisisPeriodo y IndicadorKPI desde Transaccion, considerando:

excluir transferencias internas,

separar consumo vs financiero,

calcular DTI con pago_deuda,

y los totales por etiquetas + top categorías.


y con todo eso como quedaria analisis com ose harian los calculos y tal??

Perfecto: con los esquemas que ya armamos, el análisis es básicamente un “resumen por periodo” construido desde Transaccion (y opcionalmente guardado en AnalisisPeriodo / IndicadorKPI para que la vista sea rápida).

Abajo te dejo (1) reglas/fórmulas, (2) cómo se calcula con Mongo (pipeline con $facet), y (3) cómo lo consultas con filtros (rango, dti, usuario/todos).

1) Reglas del análisis (lo que SÍ cuenta y lo que NO)
Tipos de transacción

Tu Transaccion.tipoMovimiento:

ingreso → suma a ingresos del periodo

egreso → egreso de consumo (COICOP 01–13) → suma a egresosConsumo

financiero → NO es “consumo”; se separa:

financieroTipo = "pago_deuda" → suma a pagosDeuda (para DTI)

financieroTipo = "ahorro_inversion" → suma a inversiones

otros → suma a egresosFinancieros (si lo quieres)

transferencia y/o esTransferenciaInterna=true → se excluye de KPIs (no sube ingresos ni egresos netos)

Esto es justo para evitar inflar ingresos/egresos con “mover dinero” o “pagar tarjeta” como si fuera consumo.

2) Fórmulas (KPIs mínimos descriptivos)

Para un rango [desde, hasta):

IngresosTotales
sum(monto where tipoMovimiento="ingreso")

EgresosConsumo
sum(monto where tipoMovimiento="egreso")
(siempre con COICOP 01–13)

PagosDeuda
sum(monto where tipoMovimiento="financiero" and financieroTipo="pago_deuda")

Ahorro (neto de consumo)
ahorro = ingresosTotales - egresosConsumo

Tasa de ahorro
tasaAhorro = ingresosTotales > 0 ? ahorro/ingresosTotales : 0

DTI (esfuerzo de deuda)
dti = ingresosTotales > 0 ? pagosDeuda/ingresosTotales : 0

Frecuencia de registro (simple y defendible con tus datos)
diasConRegistro = count(distinct date(fecha))
frecuenciaRegistro = diasConRegistro / diasDelPeriodo (o solo diasConRegistro)

Etiquetas (para análisis)
Solo sobre egresos de consumo:

esencial vs discrecional (essential true/false)

fijo vs variable (fixed true/false)

recurrente vs no recurrente (recurrent true/false)

Top categorías
sum por categoriaCode y % = totalCategoria / egresosConsumo

3) ¿Cómo se calculan en Mongo? (pipeline recomendado)
A) Un solo pipeline con $facet para obtener TODO en una ida

Este ejemplo calcula un resumen por usuario + rango:

import Transaccion from "../models/Transaccion.js";

export async function calcularResumenRango({ usuarioId, desde, hasta }) {
  const match = {
    fecha: { $gte: desde, $lt: hasta },
    // excluye transferencias internas
    $or: [
      { esTransferenciaInterna: { $exists: false } },
      { esTransferenciaInterna: false },
    ],
    // si tú además usas tipoMovimiento="transferencia", lo excluyes así:
    tipoMovimiento: { $ne: "transferencia" },
  };
  if (usuarioId) match.usuarioId = usuarioId;

  const [agg] = await Transaccion.aggregate([
    { $match: match },

    {
      $facet: {
        // 1) Totales base
        totales: [
          {
            $group: {
              _id: null,
              ingresosTotales: {
                $sum: {
                  $cond: [{ $eq: ["$tipoMovimiento", "ingreso"] }, "$monto", 0],
                },
              },
              egresosConsumo: {
                $sum: {
                  $cond: [{ $eq: ["$tipoMovimiento", "egreso"] }, "$monto", 0],
                },
              },
              egresosFinancieros: {
                $sum: {
                  $cond: [{ $eq: ["$tipoMovimiento", "financiero"] }, "$monto", 0],
                },
              },
              pagosDeuda: {
                $sum: {
                  $cond: [
                    {
                      $and: [
                        { $eq: ["$tipoMovimiento", "financiero"] },
                        { $eq: ["$financieroTipo", "pago_deuda"] },
                      ],
                    },
                    "$monto",
                    0,
                  ],
                },
              },
              inversiones: {
                $sum: {
                  $cond: [
                    {
                      $and: [
                        { $eq: ["$tipoMovimiento", "financiero"] },
                        { $eq: ["$financieroTipo", "ahorro_inversion"] },
                      ],
                    },
                    "$monto",
                    0,
                  ],
                },
              },
              totalMovs: { $sum: 1 },
              movsIngresos: {
                $sum: { $cond: [{ $eq: ["$tipoMovimiento", "ingreso"] }, 1, 0] },
              },
              movsEgresos: {
                $sum: { $cond: [{ $eq: ["$tipoMovimiento", "egreso"] }, 1, 0] },
              },
              movsFinancieros: {
                $sum: { $cond: [{ $eq: ["$tipoMovimiento", "financiero"] }, 1, 0] },
              },
            },
          },
        ],

        // 2) Días con registro
        diasConRegistro: [
          {
            $group: {
              _id: {
                day: {
                  $dateToString: { date: "$fecha", format: "%Y-%m-%d" },
                },
              },
            },
          },
          { $count: "diasConRegistro" },
        ],

        // 3) Etiquetas (solo egresos de consumo)
        etiquetas: [
          { $match: { tipoMovimiento: "egreso" } },
          {
            $group: {
              _id: null,
              esencial: {
                $sum: {
                  $cond: [{ $eq: ["$clasificacion.essential", true] }, "$monto", 0],
                },
              },
              discrecional: {
                $sum: {
                  $cond: [{ $ne: ["$clasificacion.essential", true] }, "$monto", 0],
                },
              },
              fijo: {
                $sum: {
                  $cond: [{ $eq: ["$clasificacion.fixed", true] }, "$monto", 0],
                },
              },
              variable: {
                $sum: {
                  $cond: [{ $ne: ["$clasificacion.fixed", true] }, "$monto", 0],
                },
              },
              recurrente: {
                $sum: {
                  $cond: [{ $eq: ["$clasificacion.recurrent", true] }, "$monto", 0],
                },
              },
              noRecurrente: {
                $sum: {
                  $cond: [{ $ne: ["$clasificacion.recurrent", true] }, "$monto", 0],
                },
              },
            },
          },
        ],

        // 4) Top categorías (solo egresos de consumo)
        topCategorias: [
          { $match: { tipoMovimiento: "egreso", categoriaCode: { $ne: null } } },
          {
            $group: {
              _id: "$categoriaCode",
              total: { $sum: "$monto" },
            },
          },
          { $sort: { total: -1 } },
          { $limit: 5 },
        ],
      },
    },
  ]);

  const t = agg?.totales?.[0] ?? {};
  const dias = agg?.diasConRegistro?.[0]?.diasConRegistro ?? 0;
  const tag = agg?.etiquetas?.[0] ?? {};
  const top = agg?.topCategorias ?? [];

  const ingresosTotales = t.ingresosTotales ?? 0;
  const egresosConsumo = t.egresosConsumo ?? 0;
  const pagosDeuda = t.pagosDeuda ?? 0;

  const ahorro = ingresosTotales - egresosConsumo;
  const tasaAhorro = ingresosTotales > 0 ? ahorro / ingresosTotales : 0;
  const dti = ingresosTotales > 0 ? pagosDeuda / ingresosTotales : 0;

  // % por categoría (requiere egresosConsumo)
  const topCategoriasEgreso = top.map((x) => ({
    categoriaCode: x._id,
    total: x.total,
    porcentaje: egresosConsumo > 0 ? x.total / egresosConsumo : 0,
  }));

  return {
    resumen: {
      ingresosTotales,
      egresosConsumo,
      egresosFinancieros: t.egresosFinancieros ?? 0,
      pagosDeuda,
      inversiones: t.inversiones ?? 0,
      ahorro,
      tasaAhorro,
      dti,
    },
    desglose: {
      topCategoriasEgreso,
      totalesEtiquetas: {
        esencial: tag.esencial ?? 0,
        discrecional: tag.discrecional ?? 0,
        fijo: tag.fijo ?? 0,
        variable: tag.variable ?? 0,
        recurrente: tag.recurrente ?? 0,
        noRecurrente: tag.noRecurrente ?? 0,
      },
      conteos: {
        total: t.totalMovs ?? 0,
        ingresos: t.movsIngresos ?? 0,
        egresos: t.movsEgresos ?? 0,
        financieros: t.movsFinancieros ?? 0,
        diasConRegistro: dias,
      },
    },
  };
}


Eso ya te produce exactamente lo que guarda AnalisisPeriodo + IndicadorKPI.

4) ¿Cómo se guarda como “AnalisisPeriodo” mensual?

Para mes/año:

desde = new Date(año, mes-1, 1)

hasta = new Date(año, mes, 1)

Luego llamas calcularResumenRango({usuarioId, desde, hasta}) y haces upsert:

await AnalisisPeriodo.updateOne(
  { usuarioId, "periodo.año": año, "periodo.mes": mes },
  {
    $set: {
      usuarioId,
      periodo: { mes, año },
      rango: { desde, hasta },
      fechaAnalisis: new Date(),
      resumen: data.resumen,
      desglose: data.desglose,
    },
  },
  { upsert: true }
);


Y si quieres KPI separado, igual IndicadorKPI.updateOne(...).

5) ¿Cómo se usa en la vista con filtros?
Caso 1: Vista rápida (recomendada)

Consultas AnalisisPeriodo ya guardado:

por usuario o todos:

usuarioId = X o sin filtro

por rango:

rango.desde >= desde && rango.hasta <= hasta (si filtras por meses completos)

o “overlap” si dejas rangos raros

por DTI:

resumen.dti: { $gte: min, $lte: max }

Ejemplo query:

const q = {
  ...(usuarioId ? { usuarioId } : {}),
  "rango.desde": { $gte: desde },
  "rango.hasta": { $lte: hasta },
  ...(dtiMin != null || dtiMax != null
    ? { "resumen.dti": { ...(dtiMin != null ? { $gte: dtiMin } : {}), ...(dtiMax != null ? { $lte: dtiMax } : {}) } }
    : {}),
};
const rows = await AnalisisPeriodo.find(q).sort({ "periodo.año": 1, "periodo.mes": 1 });

Caso 2: “Rango custom” (ej. 10 Nov – 20 Dic)

Ahí NO es por meses completos: usas calcularResumenRango(...) directamente y listo (sin guardar).

6) ¿Y el análisis con simuladores (nuevo esquema unificado)?

Eso NO afecta KPIs reales, pero puedes agregar en la vista un bloque descriptivo:

“Simuladores corridos en el rango”

“Último resultado por tipo”

Query:

const sims = await Simulador.find({
  ...(usuarioId ? { ownerUserId: usuarioId } : {}),
  "lastRun.ranAt": { $gte: desde, $lt: hasta },
  deletedAt: null,
  status: "active",
}).select("simType title lastRun");


Y muestras lastRun.metrics según simType (p. ej. monthsToPayoff, totalInterest, futureValue, requiredMonthlyContribution, etc.).

7) Lo mínimo para que “calcule bien” desde ya

Con tus datos actuales, para que el análisis salga “fino”:

Guardar tipoMovimiento correctamente (ingreso/egreso/financiero/transferencia)

Para egresos: categoriaCode (01–13) + clasificacion.* (esencial/fijo/recurrente)

Para financiero: financieroTipo (al menos pago_deuda y ahorro_inversion)

Marcar esTransferenciaInterna=true en movimientos que son solo mover dinero

Si me dices si quieres que el análisis sea estrictamente mensual (mes/año) o permitirá rangos arbitrarios como filtro principal, te dejo ya armados los endpoints del backend (Express) y el DTO exacto que consume tu CMS/móvil.
