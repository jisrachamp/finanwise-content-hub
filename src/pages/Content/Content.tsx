import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import {
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  MoreHorizontal,
  RefreshCw,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { toast } from "sonner";

import type {
  Capsule,
  CapsuleUpsertPayload,
  QuizQuestion,
} from "@/api/Content/types";
import {
  adminCreateContent,
  adminDeleteContent,
  adminUpdateContent,
  educationGetById,
  educationSearch,
} from "@/api/Content/Content.api";

/** =============== helpers =============== */

function isProbablyMongoId(s: string) {
  return /^[a-fA-F0-9]{24}$/.test(s.trim());
}

function splitCsv(s: string) {
  return s
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
}

function joinCsv(arr: string[] | undefined) {
  return (arr ?? []).join(", ");
}

function isValidUrl(s: string) {
  try {
    // Joi.string().uri() acepta muchas variantes; esto cubre la mayoría
    // (si quieres ser más estricto, valida protocolo http/https).
    // eslint-disable-next-line no-new
    new URL(s);
    return true;
  } catch {
    return false;
  }
}

type Fuente = { titulo: string; url: string };
type Paso = { titulo: string; descripcion?: string; duracionMinutos?: number };

type UpsertMode = "create" | "edit" | "view";

type UpsertState = {
  _id?: string;

  // schema
  titulo: string;
  cuerpo: string; // allow('')
  categoria: string;
  nivel: "básico" | "intermedio" | "avanzado";
  url: string;
  tipo: "concepto" | "faq" | "capsula" | "guia";
  temasCsv: string;
  etiquetasCsv: string;
  fuentes: Fuente[];

  // capsula
  intentosMax: number;
  preguntas: QuizQuestion[];

  // guia
  pasos: Paso[];
};

type FormErrors = Record<string, string>;

const statusColors: Record<string, string> = {
  Publicado: "bg-success text-white",
  "En Revisión": "bg-warning text-white",
  Borrador: "bg-muted text-muted-foreground",
};

function makeEmptyState(): UpsertState {
  return {
    titulo: "",
    cuerpo: "",
    categoria: "",
    nivel: "básico",
    url: "",
    tipo: "concepto",
    temasCsv: "",
    etiquetasCsv: "",
    fuentes: [],

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

    pasos: [
      { titulo: "", descripcion: "", duracionMinutos: undefined },
    ],
  };
}

function fromCapsule(c: Capsule): UpsertState {
  // OJO: algunos campos pueden no existir en tu tipo Capsule; por eso uso fallback.
  return {
    _id: (c as any)._id ?? (c as any).id,
    titulo: (c as any).titulo ?? "",
    cuerpo: (c as any).cuerpo ?? "",
    categoria: (c as any).categoria ?? "",
    nivel: ((c as any).nivel ?? "básico") as any,
    url: (c as any).url ?? "",
    tipo: ((c as any).tipo ?? "concepto") as any,
    temasCsv: joinCsv((c as any).temas),
    etiquetasCsv: joinCsv((c as any).etiquetas),
    fuentes: Array.isArray((c as any).fuentes) ? (c as any).fuentes : [],

    intentosMax: (c as any).quiz?.intentosMax ?? 3,
    preguntas:
      (c as any).quiz?.preguntas?.length
        ? (c as any).quiz.preguntas.map((q: any) => ({
            _id: q._id,
            enunciado: q.enunciado ?? "",
            explicacionCorrecta: q.explicacionCorrecta ?? "",
            opciones: (q.opciones ?? []).map((o: any) => ({
              _id: o._id,
              texto: o.texto ?? "",
              correcta: Boolean(o.correcta),
            })),
          }))
        : makeEmptyState().preguntas,

    pasos: Array.isArray((c as any).pasos) && (c as any).pasos.length
      ? (c as any).pasos.map((p: any) => ({
          titulo: p.titulo ?? "",
          descripcion: p.descripcion ?? "",
          duracionMinutos: p.duracionMinutos,
        }))
      : makeEmptyState().pasos,
  };
}

function validateForm(s: UpsertState): FormErrors {
  const e: FormErrors = {};

  // titulo required min 3 max 150
  const t = s.titulo.trim();
  if (!t) e.titulo = "El título es obligatorio.";
  else if (t.length < 3) e.titulo = "Mínimo 3 caracteres.";
  else if (t.length > 150) e.titulo = "Máximo 150 caracteres.";

  // cuerpo allow '' optional => no error

  // categoria optional max 80
  const cat = s.categoria.trim();
  if (cat && cat.length > 80) e.categoria = "Máximo 80 caracteres.";

  // nivel enum
  if (!["básico", "intermedio", "avanzado"].includes(s.nivel)) {
    e.nivel = "Nivel inválido.";
  }

  // url optional uri
  const u = s.url.trim();
  if (u && !isValidUrl(u)) e.url = "URL inválida (debe ser una URI válida).";

  // tipo enum
  if (!["concepto", "faq", "capsula", "guia"].includes(s.tipo)) {
    e.tipo = "Tipo inválido.";
  }

  // temas / etiquetas (array string max length)
  const temas = splitCsv(s.temasCsv);
  const etiquetas = splitCsv(s.etiquetasCsv);

  const temaLargo = temas.find((x) => x.length > 60);
  if (temaLargo) e.temasCsv = "Cada tema debe ser ≤ 60 caracteres.";

  const etiquetaLarga = etiquetas.find((x) => x.length > 40);
  if (etiquetaLarga) e.etiquetasCsv = "Cada etiqueta debe ser ≤ 40 caracteres.";

  // fuentes optional: items { titulo min2 required, url uri required }
  if (s.fuentes?.length) {
    for (let i = 0; i < s.fuentes.length; i++) {
      const f = s.fuentes[i];
      const ft = (f?.titulo ?? "").trim();
      const fu = (f?.url ?? "").trim();
      if (!ft || ft.length < 2) {
        e[`fuentes.${i}.titulo`] = "Título de fuente: mínimo 2 caracteres.";
      }
      if (!fu || !isValidUrl(fu)) {
        e[`fuentes.${i}.url`] = "URL de fuente inválida.";
      }
    }
  }

  // capsula => quiz REQUIRED
  if (s.tipo === "capsula") {
    // intentosMax 1..10
    if (!Number.isInteger(s.intentosMax) || s.intentosMax < 1 || s.intentosMax > 10) {
      e.intentosMax = "Intentos máx debe ser entre 1 y 10.";
    }

    if (!s.preguntas || s.preguntas.length < 1) {
      e.quiz = "El quiz es obligatorio para tipo cápsula (mínimo 1 pregunta).";
    } else {
      for (let pIdx = 0; pIdx < s.preguntas.length; pIdx++) {
        const p = s.preguntas[pIdx];
        const en = (p?.enunciado ?? "").trim();
        if (!en || en.length < 5) {
          e[`quiz.preguntas.${pIdx}.enunciado`] = "Enunciado: mínimo 5 caracteres.";
        }

        const opciones = p?.opciones ?? [];
        if (opciones.length < 2) {
          e[`quiz.preguntas.${pIdx}.opciones`] = "Debe haber al menos 2 opciones.";
        } else if (opciones.length > 6) {
          e[`quiz.preguntas.${pIdx}.opciones`] = "Máximo 6 opciones.";
        } else {
          let correctas = 0;
          for (let oIdx = 0; oIdx < opciones.length; oIdx++) {
            const o = opciones[oIdx];
            const txt = (o?.texto ?? "").trim();
            if (!txt) {
              e[`quiz.preguntas.${pIdx}.opciones.${oIdx}.texto`] =
                "Texto de opción requerido.";
            }
            if (o?.correcta) correctas++;
          }
          if (correctas === 0) {
            e[`quiz.preguntas.${pIdx}.correcta`] =
              "Debe existir al menos una opción correcta.";
          }
        }
      }
    }
  } else {
    // tipo != capsula => quiz forbidden
    const hasQuizText = s.preguntas?.some(
      (p) => (p.enunciado ?? "").trim() || (p.opciones ?? []).some((o) => (o.texto ?? "").trim())
    );
    if (hasQuizText) {
      e.quiz = "El quiz solo se permite si el tipo es 'capsula'.";
    }
  }

  // guia => pasos REQUIRED
  if (s.tipo === "guia") {
    if (!s.pasos || s.pasos.length < 1) {
      e.pasos = "Los pasos son obligatorios para tipo guía (mínimo 1 paso).";
    } else {
      for (let i = 0; i < s.pasos.length; i++) {
        const paso = s.pasos[i];
        const pt = (paso?.titulo ?? "").trim();
        if (!pt || pt.length < 3) {
          e[`pasos.${i}.titulo`] = "Título del paso: mínimo 3 caracteres.";
        }
        const dm = paso?.duracionMinutos;
        if (dm !== undefined && dm !== null) {
          const n = Number(dm);
          if (!Number.isInteger(n) || n < 1 || n > 600) {
            e[`pasos.${i}.duracionMinutos`] = "Duración: 1 a 600 minutos.";
          }
        }
      }
    }
  } else {
    // tipo != guia => pasos forbidden
    const hasAnyPaso = s.pasos?.some(
      (p) => (p.titulo ?? "").trim() || (p.descripcion ?? "").trim()
    );
    if (hasAnyPaso) {
      e.pasos = "Los pasos solo se permiten si el tipo es 'guia'.";
    }
  }

  return e;
}

function toPayload(s: UpsertState): CapsuleUpsertPayload {
  const temas = splitCsv(s.temasCsv);
  const etiquetas = splitCsv(s.etiquetasCsv);

  const payload: any = {
    titulo: s.titulo.trim(),
    cuerpo: s.cuerpo ?? "",
    categoria: s.categoria.trim() || undefined,
    nivel: s.nivel,
    url: s.url.trim() || undefined,
    tipo: s.tipo,
    temas,
    etiquetas,
    fuentes: (s.fuentes ?? []).map((f) => ({
      titulo: (f.titulo ?? "").trim(),
      url: (f.url ?? "").trim(),
    })),
  };

  if (s.tipo === "capsula") {
    payload.quiz = {
      intentosMax: s.intentosMax,
      preguntas: (s.preguntas ?? []).map((p) => ({
        enunciado: p.enunciado ?? "",
        explicacionCorrecta: p.explicacionCorrecta ?? "",
        opciones: (p.opciones ?? []).map((o) => ({
          texto: o.texto ?? "",
          correcta: Boolean(o.correcta),
        })),
      })),
    };
  }

  if (s.tipo === "guia") {
    payload.pasos = (s.pasos ?? []).map((p) => ({
      titulo: p.titulo ?? "",
      descripcion: p.descripcion ?? "",
      duracionMinutos: p.duracionMinutos,
    }));
  }

  return payload as CapsuleUpsertPayload;
}

/** =============== component =============== */

export default function Content() {
  const qc = useQueryClient();

  // filtros
  const [text, setText] = useState("");
  const [idFilter, setIdFilter] = useState("");
  const [nivel, setNivel] = useState("all");
  const [tipo, setTipo] = useState("all");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // modal state
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<UpsertMode>("create");
  const [form, setForm] = useState<UpsertState>(() => makeEmptyState());
  const [errors, setErrors] = useState<FormErrors>({});

  // delete confirm
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const queryKey = useMemo(
    () => ["education.search", { text, page, limit, idFilter }],
    [text, page, limit, idFilter]
  );

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey,
    queryFn: async () => {
      const id = idFilter.trim();
      if (id && isProbablyMongoId(id)) {
        const one = await educationGetById(id);
        return {
          data: [one],
          meta: { total: 1, page: 1, limit, pages: 1 },
        };
      }
      return educationSearch({ text, page, limit });
    },
  });

  useEffect(() => {
    if (isError) {
      toast.error("No se pudo cargar el contenido (search/list). Revisa tu API/BaseURL o token.");
    }
  }, [isError]);

  const rows: Capsule[] = (data as any)?.data ?? [];
  const meta = (data as any)?.meta;

  const filteredRows = useMemo(() => {
    return rows.filter((r: any) => {
      const okNivel = nivel === "all" || (r.nivel ?? "") === nivel;
      const okTipo = tipo === "all" || (r.tipo ?? "") === tipo;
      return okNivel && okTipo;
    });
  }, [rows, nivel, tipo]);

  const createMut = useMutation({
    mutationFn: (payload: CapsuleUpsertPayload) => adminCreateContent(payload),
    onSuccess: async () => {
      toast.success("Contenido creado");
      setOpen(false);
      await qc.invalidateQueries({ queryKey: ["education.search"] });
      refetch();
    },
    onError: (e: any) => toast.error(e?.message ?? "No se pudo crear"),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: CapsuleUpsertPayload }) =>
      adminUpdateContent(id, payload),
    onSuccess: async () => {
      toast.success("Contenido actualizado");
      setOpen(false);
      await qc.invalidateQueries({ queryKey: ["education.search"] });
      refetch();
    },
    onError: (e: any) => toast.error(e?.message ?? "No se pudo actualizar"),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => adminDeleteContent(id),
    onSuccess: async () => {
      toast.success("Contenido eliminado");
      setDeleteId(null);
      await qc.invalidateQueries({ queryKey: ["education.search"] });
      refetch();
    },
    onError: (e: any) => toast.error(e?.message ?? "No se pudo eliminar"),
  });

  const openCreate = () => {
    setMode("create");
    setForm(makeEmptyState());
    setErrors({});
    setOpen(true);
  };

  const openView = async (id: string) => {
    try {
      const item = await educationGetById(id);
      setMode("view");
      setForm(fromCapsule(item as any));
      setErrors({});
      setOpen(true);
    } catch (e: any) {
      toast.error(e?.message ?? "No se pudo cargar el contenido");
    }
  };

  const openEdit = async (id: string) => {
    try {
      const item = await educationGetById(id);
      setMode("edit");
      setForm(fromCapsule(item as any));
      setErrors({});
      setOpen(true);
    } catch (e: any) {
      toast.error(e?.message ?? "No se pudo cargar el contenido");
    }
  };

  const submitUpsert = async () => {
    const nextErrors = validateForm(form);
    setErrors(nextErrors);

    const firstError = Object.values(nextErrors)[0];
    if (firstError) {
      toast.error(firstError);
      return;
    }

    const payload = toPayload(form);

    if (mode === "create") {
      createMut.mutate(payload);
      return;
    }

    if (mode === "edit") {
      if (!form._id) {
        toast.error("Falta _id para editar");
        return;
      }
      updateMut.mutate({ id: form._id, payload });
    }
  };

  const disabled = mode === "view" || createMut.isPending || updateMut.isPending;

  const showCapsula = form.tipo === "capsula";
  const showGuia = form.tipo === "guia";

  const Err = ({ name }: { name: string }) =>
    errors[name] ? (
      <p className="text-xs text-destructive mt-1">{errors[name]}</p>
    ) : null;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-foreground">Biblioteca de Contenido</h1>
          <p className="text-muted-foreground mt-1">Gestionar cápsulas educativas</p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className="h-4 w-4" />
            {isFetching ? "Actualizando..." : "Actualizar"}
          </Button>

          <Button className="gap-2" onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Nuevo Contenido
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div className="flex-1 w-full">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder='Buscar por texto (ej: "interes")...'
                  value={text}
                  onChange={(e) => {
                    setText(e.target.value);
                    setPage(1);
                  }}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
              <Input
                placeholder="Filtrar por ID (24 hex)..."
                value={idFilter}
                onChange={(e) => {
                  setIdFilter(e.target.value);
                  setPage(1);
                }}
                className="sm:w-[220px]"
              />

              <Select value={tipo} onValueChange={setTipo}>
                <SelectTrigger className="w-full sm:w-[170px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tipo: todos</SelectItem>
                  <SelectItem value="concepto">concepto</SelectItem>
                  <SelectItem value="faq">faq</SelectItem>
                  <SelectItem value="capsula">capsula</SelectItem>
                  <SelectItem value="guia">guia</SelectItem>
                </SelectContent>
              </Select>

              <Select value={nivel} onValueChange={setNivel}>
                <SelectTrigger className="w-full sm:w-[170px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Nivel" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Nivel: todos</SelectItem>
                  <SelectItem value="básico">básico</SelectItem>
                  <SelectItem value="intermedio">intermedio</SelectItem>
                  <SelectItem value="avanzado">avanzado</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={String(limit)}
                onValueChange={(v) => {
                  setLimit(Number(v));
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-full sm:w-[120px]">
                  <SelectValue placeholder="Limit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* paginación */}
          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {meta ? (
                <>
                  Total: <span className="font-medium text-foreground">{meta.total}</span> · Página{" "}
                  <span className="font-medium text-foreground">{meta.page}</span> /{" "}
                  <span className="font-medium text-foreground">{meta.pages}</span>
                </>
              ) : (
                "—"
              )}
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1 || Boolean(idFilter.trim()) || isFetching}
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                onClick={() => setPage((p) => p + 1)}
                disabled={
                  Boolean(idFilter.trim()) ||
                  isFetching ||
                  (meta ? page >= meta.pages : true)
                }
              >
                Siguiente
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Nivel</TableHead>
                  <TableHead>Likes</TableHead>
                  <TableHead>Dislikes</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      Cargando contenidos...
                    </TableCell>
                  </TableRow>
                ) : filteredRows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      No hay resultados con esos filtros.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRows.map((item: any) => {
                    const rowId = item._id;
                    return (
                      <TableRow key={rowId}>
                        <TableCell className="font-medium">{item.titulo}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{item.tipo}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{item.nivel}</Badge>
                        </TableCell>
                        <TableCell>{item.likes}</TableCell>
                        <TableCell>{item.dislikes}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {item.fechaCreacion ? new Date(item.fechaCreacion).toLocaleString() : "—"}
                        </TableCell>

                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>

                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                              <DropdownMenuSeparator />

                              <DropdownMenuItem onClick={() => openView(rowId)}>
                                <Eye className="mr-2 h-4 w-4" />
                                Ver
                              </DropdownMenuItem>

                              <DropdownMenuItem onClick={() => openEdit(rowId)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Editar
                              </DropdownMenuItem>

                              <DropdownMenuSeparator />

                              <DropdownMenuItem className="text-destructive" onClick={() => setDeleteId(rowId)}>
                                <Trash2 className="mr-2 h-4 w-4" />
                                Eliminar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
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

      {/* ===== Modal Create/Edit/View ===== */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl w-[95vw] p-0 overflow-hidden flex flex-col max-h-[90vh]">
          {/* Header fijo */}
          <div className="px-6 pt-6 pb-3 shrink-0 border-b">
            <DialogHeader>
              <DialogTitle>
                {mode === "create" ? "Nuevo Contenido" : mode === "edit" ? "Editar Contenido" : "Ver Contenido"}
              </DialogTitle>
              <DialogDescription>
                {mode === "create"
                  ? "Crea contenido educativo siguiendo la validación del backend."
                  : mode === "edit"
                  ? "Edita los campos necesarios y guarda."
                  : "Vista previa del registro."}
              </DialogDescription>
            </DialogHeader>
          </div>

          {/* Body con scroll interno */}
          <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Título */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Título *</label>
                <Input
                  value={form.titulo}
                  onChange={(e) => {
                    setForm((s) => ({ ...s, titulo: e.target.value }));
                    if (errors.titulo) setErrors((x) => ({ ...x, titulo: "" }));
                  }}
                  disabled={disabled}
                />
                <Err name="titulo" />
              </div>

              {/* Categoria */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Categoría</label>
                <Input
                  value={form.categoria}
                  onChange={(e) => setForm((s) => ({ ...s, categoria: e.target.value }))}
                  disabled={disabled}
                />
                <Err name="categoria" />
              </div>

              {/* Tipo / Nivel */}
              <div className="grid grid-cols-2 gap-2 md:col-span-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Tipo</label>
                  <Select
                    value={form.tipo}
                    onValueChange={(v: any) => {
                      setForm((s) => ({ ...s, tipo: v }));
                      setErrors({});
                    }}
                    disabled={disabled}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="concepto">concepto</SelectItem>
                      <SelectItem value="faq">faq</SelectItem>
                      <SelectItem value="capsula">capsula</SelectItem>
                      <SelectItem value="guia">guia</SelectItem>
                    </SelectContent>
                  </Select>
                  <Err name="tipo" />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Nivel</label>
                  <Select
                    value={form.nivel}
                    onValueChange={(v: any) => setForm((s) => ({ ...s, nivel: v }))}
                    disabled={disabled}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="nivel" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="básico">básico</SelectItem>
                      <SelectItem value="intermedio">intermedio</SelectItem>
                      <SelectItem value="avanzado">avanzado</SelectItem>
                    </SelectContent>
                  </Select>
                  <Err name="nivel" />
                </div>
              </div>

              {/* URL */}
              <div className="md:col-span-2 space-y-2">
                <label className="text-sm font-medium">URL (opcional)</label>
                <Input
                  value={form.url}
                  onChange={(e) => setForm((s) => ({ ...s, url: e.target.value }))}
                  disabled={disabled}
                />
                <Err name="url" />
              </div>

              {/* Cuerpo */}
              <div className="md:col-span-2 space-y-2">
                <label className="text-sm font-medium">Cuerpo</label>
                <Textarea
                  value={form.cuerpo}
                  onChange={(e) => setForm((s) => ({ ...s, cuerpo: e.target.value }))}
                  disabled={disabled}
                  rows={6}
                />
              </div>

              {/* Temas / Etiquetas */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Temas (coma-separado)</label>
                <Input
                  value={form.temasCsv}
                  onChange={(e) => setForm((s) => ({ ...s, temasCsv: e.target.value }))}
                  disabled={disabled}
                />
                <Err name="temasCsv" />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Etiquetas (coma-separado)</label>
                <Input
                  value={form.etiquetasCsv}
                  onChange={(e) => setForm((s) => ({ ...s, etiquetasCsv: e.target.value }))}
                  disabled={disabled}
                />
                <Err name="etiquetasCsv" />
              </div>

              {/* Fuentes */}
              <div className="md:col-span-2 rounded-md border p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="font-medium">Fuentes (opcional)</div>
                  {mode !== "view" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setForm((s) => ({
                          ...s,
                          fuentes: [...(s.fuentes ?? []), { titulo: "", url: "" }],
                        }))
                      }
                    >
                      + Agregar fuente
                    </Button>
                  )}
                </div>

                {(form.fuentes ?? []).length === 0 ? (
                  <p className="text-sm text-muted-foreground">Sin fuentes.</p>
                ) : (
                  form.fuentes.map((f, i) => (
                    <div key={i} className="grid grid-cols-1 md:grid-cols-2 gap-2 items-start">
                      <div>
                        <Input
                          placeholder="Título de la fuente"
                          value={f.titulo}
                          onChange={(e) =>
                            setForm((s) => {
                              const next = [...(s.fuentes ?? [])];
                              next[i] = { ...next[i], titulo: e.target.value };
                              return { ...s, fuentes: next };
                            })
                          }
                          disabled={disabled}
                        />
                        <Err name={`fuentes.${i}.titulo`} />
                      </div>

                      <div className="flex gap-2 items-start">
                        <div className="flex-1">
                          <Input
                            placeholder="URL de la fuente"
                            value={f.url}
                            onChange={(e) =>
                              setForm((s) => {
                                const next = [...(s.fuentes ?? [])];
                                next[i] = { ...next[i], url: e.target.value };
                                return { ...s, fuentes: next };
                              })
                            }
                            disabled={disabled}
                          />
                          <Err name={`fuentes.${i}.url`} />
                        </div>

                        {mode !== "view" && (
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() =>
                              setForm((s) => ({
                                ...s,
                                fuentes: (s.fuentes ?? []).filter((_, idx) => idx !== i),
                              }))
                            }
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Quiz (solo capsula) */}
              <div className="md:col-span-2 rounded-md border p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="font-medium">
                    Quiz {showCapsula ? "(obligatorio)" : "(solo para tipo capsula)"}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Intentos máx:</span>
                    <Input
                      type="number"
                      className="w-24"
                      value={form.intentosMax}
                      onChange={(e) =>
                        setForm((s) => ({ ...s, intentosMax: Number(e.target.value || 0) }))
                      }
                      disabled={disabled || !showCapsula}
                    />
                  </div>
                </div>

                <Err name="quiz" />
                <Err name="intentosMax" />

                {!showCapsula ? (
                  <p className="text-sm text-muted-foreground">
                    Cambia el tipo a <b>capsula</b> para habilitar y enviar quiz.
                  </p>
                ) : (
                  <>
                    {form.preguntas.map((p, pIdx) => (
                      <div key={pIdx} className="rounded-md border p-3 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="font-medium text-sm">Pregunta #{pIdx + 1}</div>
                          {mode !== "view" && form.preguntas.length > 1 && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                setForm((s) => ({
                                  ...s,
                                  preguntas: s.preguntas.filter((_, i) => i !== pIdx),
                                }))
                              }
                            >
                              Quitar
                            </Button>
                          )}
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium">Enunciado *</label>
                          <Input
                            value={p.enunciado}
                            onChange={(e) =>
                              setForm((s) => {
                                const next = [...s.preguntas];
                                next[pIdx] = { ...next[pIdx], enunciado: e.target.value };
                                return { ...s, preguntas: next };
                              })
                            }
                            disabled={disabled}
                          />
                          <Err name={`quiz.preguntas.${pIdx}.enunciado`} />
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium">Explicación correcta</label>
                          <Input
                            value={p.explicacionCorrecta ?? ""}
                            onChange={(e) =>
                              setForm((s) => {
                                const next = [...s.preguntas];
                                next[pIdx] = {
                                  ...next[pIdx],
                                  explicacionCorrecta: e.target.value,
                                };
                                return { ...s, preguntas: next };
                              })
                            }
                            disabled={disabled}
                          />
                        </div>

                        <div className="space-y-2">
                          <div className="text-sm font-medium">Opciones *</div>
                          <Err name={`quiz.preguntas.${pIdx}.opciones`} />
                          <Err name={`quiz.preguntas.${pIdx}.correcta`} />

                          {p.opciones.map((o, oIdx) => (
                            <div key={oIdx} className="flex gap-2 items-center">
                              <div className="flex-1">
                                <Input
                                  value={o.texto}
                                  onChange={(e) =>
                                    setForm((s) => {
                                      const next = [...s.preguntas];
                                      const q = { ...next[pIdx] };
                                      const ops = [...q.opciones];
                                      ops[oIdx] = { ...ops[oIdx], texto: e.target.value };
                                      q.opciones = ops;
                                      next[pIdx] = q;
                                      return { ...s, preguntas: next };
                                    })
                                  }
                                  disabled={disabled}
                                />
                                <Err name={`quiz.preguntas.${pIdx}.opciones.${oIdx}.texto`} />
                              </div>

                              <Select
                                value={o.correcta ? "true" : "false"}
                                onValueChange={(v) =>
                                  setForm((s) => {
                                    const next = [...s.preguntas];
                                    const q = { ...next[pIdx] };
                                    const ops = [...q.opciones];
                                    ops[oIdx] = { ...ops[oIdx], correcta: v === "true" };
                                    q.opciones = ops;
                                    next[pIdx] = q;
                                    return { ...s, preguntas: next };
                                  })
                                }
                                disabled={disabled}
                              >
                                <SelectTrigger className="w-[140px]">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="false">Incorrecta</SelectItem>
                                  <SelectItem value="true">Correcta</SelectItem>
                                </SelectContent>
                              </Select>

                              {mode !== "view" && p.opciones.length > 2 && (
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() =>
                                    setForm((s) => {
                                      const next = [...s.preguntas];
                                      const q = { ...next[pIdx] };
                                      q.opciones = q.opciones.filter((_, i) => i !== oIdx);
                                      next[pIdx] = q;
                                      return { ...s, preguntas: next };
                                    })
                                  }
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          ))}

                          {mode !== "view" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                setForm((s) => {
                                  const next = [...s.preguntas];
                                  const q = { ...next[pIdx] };
                                  q.opciones = [...q.opciones, { texto: "", correcta: false }];
                                  next[pIdx] = q;
                                  return { ...s, preguntas: next };
                                })
                              }
                            >
                              + Agregar opción
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}

                    {mode !== "view" && (
                      <Button
                        variant="outline"
                        onClick={() =>
                          setForm((s) => ({
                            ...s,
                            preguntas: [
                              ...s.preguntas,
                              {
                                enunciado: "",
                                explicacionCorrecta: "",
                                opciones: [
                                  { texto: "", correcta: false },
                                  { texto: "", correcta: true },
                                ],
                              },
                            ],
                          }))
                        }
                      >
                        + Agregar pregunta
                      </Button>
                    )}
                  </>
                )}
              </div>

              {/* Pasos (solo guia) */}
              <div className="md:col-span-2 rounded-md border p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="font-medium">
                    Pasos {showGuia ? "(obligatorio)" : "(solo para tipo guia)"}
                  </div>
                  {mode !== "view" && showGuia && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setForm((s) => ({
                          ...s,
                          pasos: [...(s.pasos ?? []), { titulo: "", descripcion: "", duracionMinutos: undefined }],
                        }))
                      }
                    >
                      + Agregar paso
                    </Button>
                  )}
                </div>

                <Err name="pasos" />

                {!showGuia ? (
                  <p className="text-sm text-muted-foreground">
                    Cambia el tipo a <b>guia</b> para habilitar y enviar pasos.
                  </p>
                ) : (
                  (form.pasos ?? []).map((p, i) => (
                    <div key={i} className="rounded-md border p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-medium">Paso #{i + 1}</div>
                        {mode !== "view" && (form.pasos ?? []).length > 1 && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setForm((s) => ({
                                ...s,
                                pasos: (s.pasos ?? []).filter((_, idx) => idx !== i),
                              }))
                            }
                          >
                            Quitar
                          </Button>
                        )}
                      </div>

                      <div>
                        <label className="text-sm font-medium">Título *</label>
                        <Input
                          value={p.titulo}
                          onChange={(e) =>
                            setForm((s) => {
                              const next = [...(s.pasos ?? [])];
                              next[i] = { ...next[i], titulo: e.target.value };
                              return { ...s, pasos: next };
                            })
                          }
                          disabled={disabled}
                        />
                        <Err name={`pasos.${i}.titulo`} />
                      </div>

                      <div>
                        <label className="text-sm font-medium">Descripción</label>
                        <Textarea
                          rows={3}
                          value={p.descripcion ?? ""}
                          onChange={(e) =>
                            setForm((s) => {
                              const next = [...(s.pasos ?? [])];
                              next[i] = { ...next[i], descripcion: e.target.value };
                              return { ...s, pasos: next };
                            })
                          }
                          disabled={disabled}
                        />
                      </div>

                      <div>
                        <label className="text-sm font-medium">Duración (minutos)</label>
                        <Input
                          type="number"
                          value={p.duracionMinutos ?? ""}
                          onChange={(e) =>
                            setForm((s) => {
                              const next = [...(s.pasos ?? [])];
                              const raw = e.target.value;
                              next[i] = {
                                ...next[i],
                                duracionMinutos: raw === "" ? undefined : Number(raw),
                              };
                              return { ...s, pasos: next };
                            })
                          }
                          disabled={disabled}
                        />
                        <Err name={`pasos.${i}.duracionMinutos`} />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="h-4" />
          </div>

          {/* Footer fijo */}
          <div className="px-6 pb-6 pt-4 border-t shrink-0">
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cerrar
              </Button>

              {mode !== "view" && (
                <Button onClick={submitUpsert} disabled={createMut.isPending || updateMut.isPending}>
                  {mode === "create"
                    ? createMut.isPending
                      ? "Creando..."
                      : "Crear"
                    : updateMut.isPending
                    ? "Guardando..."
                    : "Guardar cambios"}
                </Button>
              )}
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* ===== Delete confirm ===== */}
      <AlertDialog open={Boolean(deleteId)} onOpenChange={(v) => !v && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar contenido?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará el documento de la colección.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMut.isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!deleteId) return;
                deleteMut.mutate(deleteId);
              }}
              disabled={deleteMut.isPending}
            >
              {deleteMut.isPending ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
