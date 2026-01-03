import { useMemo, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from "@/components/ui/tabs";

import { RefreshCw, TrendingUp, TrendingDown, Minus, Filter, BarChart3 } from "lucide-react";

import {
  ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend,
  PieChart, Pie, Cell,
  BarChart, Bar,
} from "recharts";

import type { KPI } from "@/api/Analytics/types";
import {
  analyticsDashboard,
  analyticsKPIsLatest,
  analyticsSerieTemporal,
  analyticsComposicionCategorias,
  analyticsResumen,
  analyticsRacha,
  analyticsDTI,
  analyticsVariacionMensual,
  adminCohortes,
  adminSegmentacion,
} from "@/api/Analisis/Analisis.api";

function asNumber(n: any, fb = 0) {
  const x = Number(n);
  return Number.isFinite(x) ? x : fb;
}

function fmtMoney(n: number) {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(n);
}
function fmtPct01(n01: number) {
  return `${new Intl.NumberFormat("es-MX", { maximumFractionDigits: 2 }).format(n01 * 100)}%`;
}
function fmtPctMaybe(n: number | null) {
  if (n == null) return "—";
  return `${new Intl.NumberFormat("es-MX", { maximumFractionDigits: 2 }).format(n * 100)}%`;
}
function isoFromDateInput(d: string, endOfDay = false) {
  if (!d) return undefined;
  const t = endOfDay ? "T23:59:59.999Z" : "T00:00:00.000Z";
  return new Date(d + t).toISOString();
}

const PIE_COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff7f7f", "#7fd3ff", "#c5a3ff", "#aaa"];

function tendenciaBadge(t?: KPI["tendenciaActual"]) {
  if (t === "positiva") return { icon: <TrendingUp className="h-4 w-4" />, label: "positiva" };
  if (t === "negativa") return { icon: <TrendingDown className="h-4 w-4" />, label: "negativa" };
  return { icon: <Minus className="h-4 w-4" />, label: "estable" };
}

export default function Analytics() {
  // ====== filtros generales (usuario-scoped)
  const [usuarioId, setUsuarioId] = useState<string>(""); // opcional para admin o debug
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");

  // composicion
  const [top, setTop] = useState<number>(5);

  // variacion
  const now = new Date();
  const [año, setAño] = useState<number>(now.getFullYear());
  const [mes, setMes] = useState<number>(now.getMonth() + 1);
  const [allowZeroBase, setAllowZeroBase] = useState<boolean>(false);
  const [presupuesto, setPresupuesto] = useState<string>(""); // input string

  // admin rangos
  const [adminFrom, setAdminFrom] = useState<string>("");
  const [adminTo, setAdminTo] = useState<string>("");

  const rangeParams = useMemo(() => {
    const p: any = {
      usuarioId: usuarioId.trim() || undefined,
      from: isoFromDateInput(from, false),
      to: isoFromDateInput(to, true),
    };
    return p;
  }, [usuarioId, from, to]);

  // ====== Queries (usuario)
  const dashboardKey = useMemo(() => ["analytics.dashboard", usuarioId.trim() || "me"], [usuarioId]);
  const kpisKey = useMemo(() => ["analytics.kpis.latest", usuarioId.trim() || "me"], [usuarioId]);

  const serieKey = useMemo(() => ["analytics.serie", rangeParams], [rangeParams]);
  const compKey = useMemo(() => ["analytics.composicion", { ...rangeParams, top }], [rangeParams, top]);
  const resumenKey = useMemo(() => ["analytics.resumen", rangeParams], [rangeParams]);
  const rachaKey = useMemo(() => ["analytics.racha", rangeParams], [rangeParams]);
  const dtiKey = useMemo(() => ["analytics.dti", rangeParams], [rangeParams]);

  const variacionKey = useMemo(
    () => [
      "analytics.variacion",
      {
        usuarioId: usuarioId.trim() || undefined,
        año,
        mes,
        allowZeroBase,
        presupuesto: presupuesto.trim() ? Number(presupuesto) : null,
      },
    ],
    [usuarioId, año, mes, allowZeroBase, presupuesto]
  );

  const { data: dashboard, isFetching: dashFetching, isError: dashError, refetch: refetchDash } =
    useQuery({
      queryKey: dashboardKey,
      queryFn: () => analyticsDashboard(usuarioId.trim() || undefined),
    });

  const { data: kpiLatest, isFetching: kpiFetching, isError: kpiError, refetch: refetchKpi } =
    useQuery({
      queryKey: kpisKey,
      queryFn: () => analyticsKPIsLatest(usuarioId.trim() || undefined),
    });

  const { data: serie, isFetching: serieFetching, isError: serieError, refetch: refetchSerie } =
    useQuery({
      queryKey: serieKey,
      queryFn: () => analyticsSerieTemporal(rangeParams),
    });

  const { data: comp, isFetching: compFetching, isError: compError, refetch: refetchComp } =
    useQuery({
      queryKey: compKey,
      queryFn: () => analyticsComposicionCategorias({ ...rangeParams, top }),
    });

  const { data: resumen, isFetching: resFetching, isError: resError, refetch: refetchResumen } =
    useQuery({
      queryKey: resumenKey,
      queryFn: () => analyticsResumen(rangeParams),
    });

  const { data: racha, isFetching: rachaFetching, isError: rachaError, refetch: refetchRacha } =
    useQuery({
      queryKey: rachaKey,
      queryFn: () => analyticsRacha(rangeParams),
    });

  const { data: dti, isFetching: dtiFetching, isError: dtiError, refetch: refetchDti } =
    useQuery({
      queryKey: dtiKey,
      queryFn: () => analyticsDTI(rangeParams),
    });

  const { data: variacion, isFetching: varFetching, isError: varError, refetch: refetchVar } =
    useQuery({
      queryKey: variacionKey,
      queryFn: () =>
        analyticsVariacionMensual({
          usuarioId: usuarioId.trim() || undefined,
          año,
          mes,
          allowZeroBase,
          presupuesto: presupuesto.trim() ? Number(presupuesto) : null,
        }),
    });

  // ====== Queries (admin)
  const adminRange = useMemo(() => {
    const fromIso = isoFromDateInput(adminFrom, false);
    const toIso = isoFromDateInput(adminTo, true);
    return { from: fromIso, to: toIso };
  }, [adminFrom, adminTo]);

  const cohortesKey = useMemo(() => ["admin.cohortes", adminRange], [adminRange]);
  const segKey = useMemo(() => ["admin.segmentacion", adminRange], [adminRange]);

  const { data: cohortes, isFetching: cohFetching, isError: cohError, refetch: refetchCoh } =
    useQuery({
      queryKey: cohortesKey,
      queryFn: () => adminCohortes({ from: adminRange.from!, to: adminRange.to! }),
      enabled: Boolean(adminRange.from && adminRange.to),
    });

  const { data: segmentacion, isFetching: segFetching, isError: segError, refetch: refetchSeg } =
    useQuery({
      queryKey: segKey,
      queryFn: () => adminSegmentacion({ from: adminRange.from!, to: adminRange.to! }),
      enabled: Boolean(adminRange.from && adminRange.to),
    });

  useEffect(() => {
    if (dashError) toast.error("No se pudo cargar dashboard (KPIs historial).");
    if (kpiError) toast.error("No se pudo cargar KPI latest.");
    if (serieError) toast.error("No se pudo cargar serie temporal.");
    if (compError) toast.error("No se pudo cargar composición por categorías.");
    if (resError) toast.error("No se pudo cargar resumen.");
    if (rachaError) toast.error("No se pudo cargar racha.");
    if (dtiError) toast.error("No se pudo cargar DTI.");
    if (varError) toast.error("No se pudo cargar variación mensual.");
    if (cohError) toast.error("No se pudo cargar cohortes admin.");
    if (segError) toast.error("No se pudo cargar segmentación admin.");
  }, [dashError, kpiError, serieError, compError, resError, rachaError, dtiError, varError, cohError, segError]);

  const refreshing =
    dashFetching || kpiFetching || serieFetching || compFetching || resFetching || rachaFetching || dtiFetching || varFetching;

  const serieChart = (serie?.serie ?? []).map((p) => ({
    label: `${String(p.mes).padStart(2, "0")}/${p.año}`,
    ingresos: asNumber(p.ingresos),
    egresos: asNumber(p.egresos),
    ahorro: asNumber(p.ahorro),
  }));

  const compItems = comp?.items ?? [];
  const compPie = [
    ...compItems.map((it) => ({ name: it.nombre, value: asNumber(it.total) })),
    ...(asNumber(comp?.otros) > 0 ? [{ name: "Otros", value: asNumber(comp?.otros) }] : []),
  ];

  const { icon: tendIcon, label: tendLabel } = tendenciaBadge(kpiLatest?.tendenciaActual);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-foreground">Analíticas</h1>
          <p className="text-muted-foreground mt-1">
            Dashboard usuario + herramientas admin (cohortes / segmentación)
          </p>
        </div>

        <Button
          variant="outline"
          className="gap-2"
          onClick={() => {
            refetchDash();
            refetchKpi();
            refetchSerie();
            refetchComp();
            refetchResumen();
            refetchRacha();
            refetchDti();
            refetchVar();
            if (adminRange.from && adminRange.to) {
              refetchCoh();
              refetchSeg();
            }
          }}
          disabled={refreshing}
        >
          <RefreshCw className="h-4 w-4" />
          {refreshing ? "Actualizando..." : "Actualizar"}
        </Button>
      </div>

      {/* Controles */}
      <Card>
        <CardHeader className="pb-2">
          <div className="font-medium flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            Filtros
          </div>
          <div className="text-sm text-muted-foreground">
            Si dejas <b>usuarioId</b> vacío, varios endpoints usan <code>req.user.id</code>.
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <Input
            placeholder="usuarioId (opcional)"
            value={usuarioId}
            onChange={(e) => setUsuarioId(e.target.value)}
          />
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          <Select
            value={String(top)}
            onValueChange={(v) => setTop(Number(v))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Top categorías" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3">Top 3</SelectItem>
              <SelectItem value="5">Top 5</SelectItem>
              <SelectItem value="8">Top 8</SelectItem>
              <SelectItem value="12">Top 12</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Tabs defaultValue="usuario">
        <TabsList>
          <TabsTrigger value="usuario">Usuario</TabsTrigger>
          <TabsTrigger value="admin">Admin</TabsTrigger>
        </TabsList>

        {/* ===================== USUARIO ===================== */}
        <TabsContent value="usuario" className="space-y-6">
          {/* KPIs + Resumen */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <div className="font-medium">KPI (último cálculo)</div>
                <div className="text-xs text-muted-foreground">
                  {kpiLatest?.fechaCalculo ? new Date(kpiLatest.fechaCalculo).toLocaleString("es-MX") : "—"}
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Tendencia</span>
                  <Badge variant="outline" className="gap-2">
                    {tendIcon} {tendLabel}
                  </Badge>
                </div>
                <div className="text-sm flex items-center justify-between">
                  <span className="text-muted-foreground">Frecuencia registro</span>
                  <span className="font-medium">{asNumber(kpiLatest?.frecuenciaRegistro)} / periodo</span>
                </div>
                <div className="text-sm flex items-center justify-between">
                  <span className="text-muted-foreground">Inversiones</span>
                  <span className="font-medium">{fmtMoney(asNumber(kpiLatest?.inversiones))}</span>
                </div>
                <div className="text-sm flex items-center justify-between">
                  <span className="text-muted-foreground">Endeudamiento</span>
                  <span className="font-medium">{fmtMoney(asNumber(kpiLatest?.endeudamiento))}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2"><div className="font-medium">Resumen (rango)</div></CardHeader>
              <CardContent className="space-y-2">
                <div className="text-sm flex items-center justify-between">
                  <span className="text-muted-foreground">Ingresos</span>
                  <span className="font-medium">{fmtMoney(asNumber(resumen?.ingresos))}</span>
                </div>
                <div className="text-sm flex items-center justify-between">
                  <span className="text-muted-foreground">Egresos</span>
                  <span className="font-medium">{fmtMoney(asNumber(resumen?.egresos))}</span>
                </div>
                <div className="text-sm flex items-center justify-between">
                  <span className="text-muted-foreground">Ahorro</span>
                  <Badge variant={asNumber(resumen?.ahorro) < 0 ? "destructive" : "outline"}>
                    {fmtMoney(asNumber(resumen?.ahorro))}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2"><div className="font-medium">DTI (placeholder)</div></CardHeader>
              <CardContent className="text-2xl font-semibold">
                {fmtPct01(asNumber(dti?.dti))}
                <div className="text-xs text-muted-foreground mt-1">
                  Nota: tu backend usa egresos totales como aproximación a deuda.
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2"><div className="font-medium">Racha registro</div></CardHeader>
              <CardContent className="text-2xl font-semibold">
                {asNumber(racha?.rachaMaxima)} días
                <div className="text-xs text-muted-foreground mt-1">
                  Días consecutivos con al menos 1 transacción.
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Serie temporal */}
          <Card>
            <CardHeader className="pb-2">
              <div className="font-medium flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
                Serie temporal mensual (ingresos/egresos/ahorro)
              </div>
              <div className="text-sm text-muted-foreground">Agrupado por mes con $group</div>
            </CardHeader>
            <CardContent className="h-[320px]">
              {serieChart.length === 0 ? (
                <div className="text-sm text-muted-foreground">Sin datos para graficar.</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={serieChart}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="label" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="ingresos" />
                    <Line type="monotone" dataKey="egresos" />
                    <Line type="monotone" dataKey="ahorro" />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Composición categorías */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            <Card className="xl:col-span-1">
              <CardHeader className="pb-2">
                <div className="font-medium">Composición egresos (Top {top})</div>
                <div className="text-sm text-muted-foreground">
                  Total egresos: <span className="font-medium text-foreground">{fmtMoney(asNumber(comp?.totalEgresos))}</span>
                </div>
              </CardHeader>
              <CardContent className="h-[320px]">
                {compPie.length === 0 ? (
                  <div className="text-sm text-muted-foreground">Sin datos.</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Tooltip />
                      <Legend />
                      <Pie data={compPie} dataKey="value" nameKey="name" outerRadius={110}>
                        {compPie.map((_, idx) => (
                          <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card className="xl:col-span-2">
              <CardHeader className="pb-2">
                <div className="font-medium">Detalle categorías</div>
                <div className="text-sm text-muted-foreground">Con porcentaje respecto al total egresos del rango.</div>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Categoría</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead className="text-right">%</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {compItems.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                            Sin resultados
                          </TableCell>
                        </TableRow>
                      ) : (
                        compItems.map((it, idx) => (
                          <TableRow key={it.categoriaId ?? idx}>
                            <TableCell className="font-medium">{it.nombre}</TableCell>
                            <TableCell className="text-right">{fmtMoney(asNumber(it.total))}</TableCell>
                            <TableCell className="text-right">{fmtPct01(asNumber(it.porcentaje))}</TableCell>
                          </TableRow>
                        ))
                      )}

                      {asNumber(comp?.otros) > 0 ? (
                        <TableRow>
                          <TableCell className="font-medium">Otros</TableCell>
                          <TableCell className="text-right">{fmtMoney(asNumber(comp?.otros))}</TableCell>
                          <TableCell className="text-right">—</TableCell>
                        </TableRow>
                      ) : null}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Variación mensual */}
          <Card>
            <CardHeader className="pb-2">
              <div className="font-medium">Variación mensual (egresos/ingresos/ahorro) + vs presupuesto</div>
              <div className="text-sm text-muted-foreground">
                Compara mes seleccionado vs mes anterior. Si no envías presupuesto, backend intenta deducirlo desde Meta.
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
                <Input
                  type="number"
                  placeholder="Año"
                  value={String(año)}
                  onChange={(e) => setAño(Number(e.target.value || 0))}
                />
                <Select value={String(mes)} onValueChange={(v) => setMes(Number(v))}>
                  <SelectTrigger><SelectValue placeholder="Mes" /></SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 12 }).map((_, i) => {
                      const m = i + 1;
                      return <SelectItem key={m} value={String(m)}>{m}</SelectItem>;
                    })}
                  </SelectContent>
                </Select>

                <Input
                  placeholder="Presupuesto manual (opcional)"
                  value={presupuesto}
                  onChange={(e) => setPresupuesto(e.target.value)}
                />

                <Select
                  value={allowZeroBase ? "true" : "false"}
                  onValueChange={(v) => setAllowZeroBase(v === "true")}
                >
                  <SelectTrigger><SelectValue placeholder="Zero base" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="false">allowZeroBase: false</SelectItem>
                    <SelectItem value="true">allowZeroBase: true</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  variant="outline"
                  onClick={() => refetchVar()}
                  disabled={varFetching}
                >
                  {varFetching ? "Calculando..." : "Recalcular"}
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-2"><div className="font-medium">Actual</div></CardHeader>
                  <CardContent className="space-y-1 text-sm">
                    <div className="flex justify-between"><span className="text-muted-foreground">Ingresos</span><span className="font-medium">{fmtMoney(asNumber(variacion?.actual?.ingresos))}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Egresos</span><span className="font-medium">{fmtMoney(asNumber(variacion?.actual?.egresos))}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Ahorro</span><span className="font-medium">{fmtMoney(asNumber(variacion?.actual?.ahorro))}</span></div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2"><div className="font-medium">Anterior</div></CardHeader>
                  <CardContent className="space-y-1 text-sm">
                    <div className="flex justify-between"><span className="text-muted-foreground">Ingresos</span><span className="font-medium">{fmtMoney(asNumber(variacion?.anterior?.ingresos))}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Egresos</span><span className="font-medium">{fmtMoney(asNumber(variacion?.anterior?.egresos))}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Ahorro</span><span className="font-medium">{fmtMoney(asNumber(variacion?.anterior?.ahorro))}</span></div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2"><div className="font-medium">Variaciones</div></CardHeader>
                  <CardContent className="space-y-1 text-sm">
                    <div className="flex justify-between"><span className="text-muted-foreground">Ingresos</span><span className="font-medium">{fmtPctMaybe(variacion?.variacionIngresos ?? null)}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Egresos</span><span className="font-medium">{fmtPctMaybe(variacion?.variacionEgresos ?? null)}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Ahorro</span><span className="font-medium">{fmtPctMaybe(variacion?.variacionAhorro ?? null)}</span></div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2"><div className="font-medium">Vs Presupuesto</div></CardHeader>
                  <CardContent className="space-y-2">
                    <div className="text-2xl font-semibold">
                      {fmtPctMaybe(variacion?.vsPresupuestoEgresos ?? null)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      (egresos - presupuesto) / presupuesto
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>

          {/* Historial KPI (12) */}
          <Card>
            <CardHeader className="pb-2">
              <div className="font-medium">Historial KPIs (últimos 12)</div>
              <div className="text-sm text-muted-foreground">IndicadorKPI.find().sort(-fechaCalculo).limit(12)</div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead className="text-right">Ingresos</TableHead>
                      <TableHead className="text-right">Egresos</TableHead>
                      <TableHead className="text-right">Ahorro</TableHead>
                      <TableHead className="text-right">Frecuencia</TableHead>
                      <TableHead>Tendencia</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(dashboard?.items ?? []).length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                          Sin KPIs calculados
                        </TableCell>
                      </TableRow>
                    ) : (
                      (dashboard?.items ?? []).map((k) => {
                        const tb = tendenciaBadge(k.tendenciaActual);
                        return (
                          <TableRow key={k._id}>
                            <TableCell className="text-muted-foreground">
                              {k.fechaCalculo ? new Date(k.fechaCalculo).toLocaleString("es-MX") : "—"}
                            </TableCell>
                            <TableCell className="text-right">{fmtMoney(asNumber(k.ingresos))}</TableCell>
                            <TableCell className="text-right">{fmtMoney(asNumber(k.egresos))}</TableCell>
                            <TableCell className="text-right">
                              <Badge variant={asNumber(k.ahorro) < 0 ? "destructive" : "outline"}>
                                {fmtMoney(asNumber(k.ahorro))}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">{asNumber(k.frecuenciaRegistro)}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="gap-2">
                                {tb.icon} {tb.label}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===================== ADMIN ===================== */}
        <TabsContent value="admin" className="space-y-6">
          <Card>
            <CardHeader className="pb-2">
              <div className="font-medium">Admin: rango para cohortes y segmentación</div>
              <div className="text-sm text-muted-foreground">
                Estos endpoints requieren <code>from</code> y <code>to</code>.
              </div>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <Input type="date" value={adminFrom} onChange={(e) => setAdminFrom(e.target.value)} />
              <Input type="date" value={adminTo} onChange={(e) => setAdminTo(e.target.value)} />
              <Button
                variant="outline"
                onClick={() => {
                  if (!adminFrom || !adminTo) {
                    toast.error("Define adminFrom y adminTo");
                    return;
                  }
                  refetchCoh();
                  refetchSeg();
                }}
                disabled={!adminFrom || !adminTo || cohFetching || segFetching}
              >
                {(cohFetching || segFetching) ? "Cargando..." : "Consultar"}
              </Button>
            </CardContent>
          </Card>

          {/* Cohortes */}
          <Card>
            <CardHeader className="pb-2">
              <div className="font-medium">Cohortes (usuarios por mes de registro + actividad en periodo)</div>
              <div className="text-sm text-muted-foreground">
                Tasa = activosPeriodo / usuarios
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2"><div className="font-medium">Usuarios (total)</div></CardHeader>
                  <CardContent className="text-2xl font-semibold">{asNumber(cohortes?.totales?.usuarios)}</CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2"><div className="font-medium">Activos (total)</div></CardHeader>
                  <CardContent className="text-2xl font-semibold">{asNumber(cohortes?.totales?.activosPeriodo)}</CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2"><div className="font-medium">Tasa global</div></CardHeader>
                  <CardContent className="text-2xl font-semibold">
                    {cohortes?.totales?.usuarios
                      ? fmtPct01(asNumber(cohortes?.totales?.activosPeriodo) / asNumber(cohortes?.totales?.usuarios))
                      : "—"}
                  </CardContent>
                </Card>
              </div>

              <div className="h-[280px]">
                {(cohortes?.cohorts ?? []).length === 0 ? (
                  <div className="text-sm text-muted-foreground">Sin datos.</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={(cohortes?.cohorts ?? []).map((c) => ({
                        label: `${String(c.mes).padStart(2, "0")}/${c.año}`,
                        usuarios: c.usuarios,
                        activos: c.activosPeriodo,
                        tasa: c.tasaActividad,
                      }))}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="label" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="usuarios" />
                      <Bar dataKey="activos" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Mes</TableHead>
                      <TableHead className="text-right">Usuarios</TableHead>
                      <TableHead className="text-right">Activos</TableHead>
                      <TableHead className="text-right">Tasa</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(cohortes?.cohorts ?? []).length === 0 ? (
                      <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">Sin datos</TableCell></TableRow>
                    ) : (
                      (cohortes?.cohorts ?? []).map((c, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="font-medium">{String(c.mes).padStart(2,"0")}/{c.año}</TableCell>
                          <TableCell className="text-right">{c.usuarios}</TableCell>
                          <TableCell className="text-right">{c.activosPeriodo}</TableCell>
                          <TableCell className="text-right">{fmtPct01(c.tasaActividad)}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Segmentación */}
          <Card>
            <CardHeader className="pb-2">
              <div className="font-medium">Segmentación (incomeTier + ahorroRate)</div>
              <div className="text-sm text-muted-foreground">
                incomeTier se basa en perfil.ingresosMensuales (si existe) o ingresos del periodo.
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2"><div className="font-medium">AhorroRate promedio por tier</div></CardHeader>
                  <CardContent className="h-[260px]">
                    {(segmentacion?.grupos ?? []).length === 0 ? (
                      <div className="text-sm text-muted-foreground">Sin datos.</div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={(segmentacion?.grupos ?? []).map((g) => ({
                            tier: g.incomeTier,
                            usuarios: g.usuarios,
                            ahorroRate: g.ahorroRatePromedio,
                          }))}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="tier" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="usuarios" />
                          <Bar dataKey="ahorroRate" />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2"><div className="font-medium">Distribución usuarios por tier</div></CardHeader>
                  <CardContent className="h-[260px]">
                    {(segmentacion?.grupos ?? []).length === 0 ? (
                      <div className="text-sm text-muted-foreground">Sin datos.</div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Tooltip />
                          <Legend />
                          <Pie
                            data={(segmentacion?.grupos ?? []).map((g) => ({ name: g.incomeTier, value: g.usuarios }))}
                            dataKey="value"
                            nameKey="name"
                            outerRadius={95}
                          >
                            {(segmentacion?.grupos ?? []).map((_, idx) => (
                              <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tier</TableHead>
                      <TableHead className="text-right">Usuarios</TableHead>
                      <TableHead className="text-right">AhorroRate Prom</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(segmentacion?.grupos ?? []).length === 0 ? (
                      <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-8">Sin datos</TableCell></TableRow>
                    ) : (
                      (segmentacion?.grupos ?? []).map((g, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="font-medium">{g.incomeTier}</TableCell>
                          <TableCell className="text-right">{g.usuarios}</TableCell>
                          <TableCell className="text-right">{fmtPct01(asNumber(g.ahorroRatePromedio))}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              <div className="text-xs text-muted-foreground">
                Si quieres, luego te hago paginación/virtualización para <code>detalles</code> (pueden ser muchos).
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
