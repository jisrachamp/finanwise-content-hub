import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

import { Plus, Search, Filter, Eye, Edit, Trash2, MoreHorizontal, RefreshCw } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { toast } from "sonner";

import type { Capsule, CapsuleUpsertPayload, QuizQuestion } from "@/api/contenido/types";
import {
  adminCreateContent,
  adminDeleteContent,
  adminUpdateContent,
  educationGetById,
  educationSearch,
} from "@/api/contenido/contenido.api";

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

type UpsertMode = "create" | "edit" | "view";

type UpsertState = {
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

function makeEmptyState(): UpsertState {
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

function fromCapsule(c: Capsule): UpsertState {
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

function toPayload(s: UpsertState): CapsuleUpsertPayload {
  const temas = splitCsv(s.temasCsv);
  const etiquetas = splitCsv(s.etiquetasCsv);

  // Si el usuario no llenó quiz, no lo mandamos (para no forzar estructura)
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

const Content = () => {
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

  const rows: Capsule[] = data?.data ?? [];
  const meta = data?.meta;

  const filteredRows = useMemo(() => {
    return rows.filter((r) => {
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
    setOpen(true);
  };

  const openView = async (id: string) => {
    try {
      const item = await educationGetById(id);
      setMode("view");
      setForm(fromCapsule(item));
      setOpen(true);
    } catch (e: any) {
      toast.error(e?.message ?? "No se pudo cargar el contenido");
    }
  };

  const openEdit = async (id: string) => {
    try {
      const item = await educationGetById(id);
      setMode("edit");
      setForm(fromCapsule(item));
      setOpen(true);
    } catch (e: any) {
      toast.error(e?.message ?? "No se pudo cargar el contenido");
    }
  };

  const submitUpsert = async () => {
    const payload = toPayload(form);

    if (!payload.titulo || !payload.cuerpo) {
      toast.error("Título y cuerpo son obligatorios");
      return;
    }

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

  if (isError) {
    toast.error("No se pudo cargar el contenido (search/list). Revisa tu API/BaseURL o token.");
  }

  return (
    <div className="p-6 space-y-6">
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
                  <SelectItem value="capsula">capsula</SelectItem>
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

              <Select value={String(limit)} onValueChange={(v) => { setLimit(Number(v)); setPage(1); }}>
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
                  filteredRows.map((item) => {
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

                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => setDeleteId(rowId)}
                              >
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
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {mode === "create" ? "Nuevo Contenido" : mode === "edit" ? "Editar Contenido" : "Ver Contenido"}
            </DialogTitle>
            <DialogDescription>
              {mode === "create"
                ? "Crea una cápsula educativa."
                : mode === "edit"
                ? "Edita los campos necesarios y guarda."
                : "Vista previa del registro."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Título</label>
              <Input
                value={form.titulo}
                onChange={(e) => setForm((s) => ({ ...s, titulo: e.target.value }))}
                disabled={disabled}
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Tipo</label>
                <Select
                  value={form.tipo}
                  onValueChange={(v) => setForm((s) => ({ ...s, tipo: v }))}
                  disabled={disabled}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="capsula">capsula</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Nivel</label>
                <Select
                  value={form.nivel}
                  onValueChange={(v) => setForm((s) => ({ ...s, nivel: v }))}
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
              </div>
            </div>

            <div className="md:col-span-2 space-y-2">
              <label className="text-sm font-medium">Cuerpo</label>
              <Textarea
                value={form.cuerpo}
                onChange={(e) => setForm((s) => ({ ...s, cuerpo: e.target.value }))}
                disabled={disabled}
                rows={6}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Temas (coma-separado)</label>
              <Input
                value={form.temasCsv}
                onChange={(e) => setForm((s) => ({ ...s, temasCsv: e.target.value }))}
                disabled={disabled}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Etiquetas (coma-separado)</label>
              <Input
                value={form.etiquetasCsv}
                onChange={(e) => setForm((s) => ({ ...s, etiquetasCsv: e.target.value }))}
                disabled={disabled}
              />
            </div>

            {/* Quiz */}
            <div className="md:col-span-2 mt-2 rounded-md border p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="font-medium">Quiz (opcional)</div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Intentos máx:</span>
                  <Input
                    type="number"
                    className="w-24"
                    value={form.intentosMax}
                    onChange={(e) => setForm((s) => ({ ...s, intentosMax: Number(e.target.value || 0) }))}
                    disabled={disabled}
                  />
                </div>
              </div>

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
                    <label className="text-sm font-medium">Enunciado</label>
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
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Explicación correcta</label>
                    <Input
                      value={p.explicacionCorrecta ?? ""}
                      onChange={(e) =>
                        setForm((s) => {
                          const next = [...s.preguntas];
                          next[pIdx] = { ...next[pIdx], explicacionCorrecta: e.target.value };
                          return { ...s, preguntas: next };
                        })
                      }
                      disabled={disabled}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="text-sm font-medium">Opciones</div>

                    {p.opciones.map((o, oIdx) => (
                      <div key={oIdx} className="flex gap-2 items-center">
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
            </div>
          </div>

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
};

export default Content;
