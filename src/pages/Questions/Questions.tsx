import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Search, Edit, Eye, Trash2, MoreHorizontal, RefreshCw } from "lucide-react";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

import type { Question, QuestionUpsertPayload } from "@/api/Questions/types";
import {
  adminQuestionCreate,
  adminQuestionDelete,
  adminQuestionGetById,
  adminQuestionUpdate,
  adminQuestionsSearch,
} from "@/api/Questions/Questions.api";

type Mode = "create" | "edit" | "view";

function emptyQuestion(): QuestionUpsertPayload {
  return {
    tipo: "conocimiento",
    tema: "general",
    nivel: "basico",
    dimension: "",
    pregunta: "",
    respuestas: [
      { inciso: "a", texto: "", correcta: true },
      { inciso: "b", texto: "", correcta: false },
    ],
    estado: "activa",
  };
}

export default function Questions() {
  const qc = useQueryClient();

  // filters
  const [text, setText] = useState("");
  const [tipo, setTipo] = useState("all");
  const [tema, setTema] = useState("all");
  const [nivel, setNivel] = useState("all");
  const [estado, setEstado] = useState("all");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // modals
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("create");
  const [form, setForm] = useState<QuestionUpsertPayload>(() => emptyQuestion());
  const [editId, setEditId] = useState<string | null>(null);

  // success modal
  const [okOpen, setOkOpen] = useState(false);
  const [okMsg, setOkMsg] = useState("Operación realizada con éxito.");

  // delete
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const queryKey = useMemo(
    () => ["admin.questions", { text, tipo, tema, nivel, estado, page, limit }],
    [text, tipo, tema, nivel, estado, page, limit]
  );

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey,
    queryFn: () =>
      adminQuestionsSearch({ text, tipo, tema, nivel, estado, page, limit }),
  });

  useEffect(() => {
    if (isError) toast.error("No se pudieron cargar las preguntas. Revisa API/token.");
  }, [isError]);

  const rows = (data as any)?.data ?? [];
  const meta = (data as any)?.meta;

  const createMut = useMutation({
    mutationFn: (payload: QuestionUpsertPayload) => adminQuestionCreate(payload),
    onSuccess: async () => {
      setOkMsg("Pregunta creada con éxito.");
      setOkOpen(true);
      setOpen(false);
      await qc.invalidateQueries({ queryKey: ["admin.questions"] });
      refetch();
    },
    onError: (e: any) => toast.error(e?.message ?? "No se pudo crear"),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: QuestionUpsertPayload }) =>
      adminQuestionUpdate(id, payload),
    onSuccess: async () => {
      setOkMsg("Pregunta actualizada con éxito.");
      setOkOpen(true);
      setOpen(false);
      await qc.invalidateQueries({ queryKey: ["admin.questions"] });
      refetch();
    },
    onError: (e: any) => toast.error(e?.message ?? "No se pudo actualizar"),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => adminQuestionDelete(id),
    onSuccess: async () => {
      setOkMsg("Pregunta eliminada con éxito.");
      setOkOpen(true);
      setDeleteId(null);
      await qc.invalidateQueries({ queryKey: ["admin.questions"] });
      refetch();
    },
    onError: (e: any) => toast.error(e?.message ?? "No se pudo eliminar"),
  });

  const openCreate = () => {
    setMode("create");
    setEditId(null);
    setForm(emptyQuestion());
    setOpen(true);
  };

  const openView = async (id: string) => {
    try {
      const q = await adminQuestionGetById(id);
      setMode("view");
      setEditId(id);
      setForm({
        tipo: q.tipo,
        tema: q.tema,
        nivel: q.nivel,
        dimension: q.dimension ?? "",
        pregunta: q.pregunta,
        respuestas: q.respuestas,
        estado: q.estado,
      });
      setOpen(true);
    } catch (e: any) {
      toast.error(e?.message ?? "No se pudo cargar");
    }
  };

  const openEdit = async (id: string) => {
    try {
      const q = await adminQuestionGetById(id);
      setMode("edit");
      setEditId(id);
      setForm({
        tipo: q.tipo,
        tema: q.tema,
        nivel: q.nivel,
        dimension: q.dimension ?? "",
        pregunta: q.pregunta,
        respuestas: q.respuestas,
        estado: q.estado,
      });
      setOpen(true);
    } catch (e: any) {
      toast.error(e?.message ?? "No se pudo cargar");
    }
  };

  const disabled = mode === "view" || createMut.isPending || updateMut.isPending;

  const submit = () => {
    // validación mínima (no meter muro)
    const p = (form.pregunta ?? "").trim();
    if (p.length < 5) return toast.error("La pregunta debe tener al menos 5 caracteres.");
    if (!form.respuestas || form.respuestas.length < 2) return toast.error("Mínimo 2 respuestas.");
    if (!form.respuestas.some((r) => r.correcta)) return toast.error("Debe existir al menos 1 correcta.");

    if (mode === "create") return createMut.mutate(form);
    if (mode === "edit") {
      if (!editId) return toast.error("Falta id para editar.");
      return updateMut.mutate({ id: editId, payload: form });
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-foreground">Preguntas</h1>
          <p className="text-muted-foreground mt-1">Gestión de banco de preguntas (exámenes)</p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className="h-4 w-4" />
            {isFetching ? "Actualizando..." : "Actualizar"}
          </Button>
          <Button className="gap-2" onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Nueva pregunta
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col lg:flex-row gap-3 items-start lg:items-center justify-between">
            <div className="flex-1 w-full">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder='Buscar por texto (ej: "tasa")...'
                  value={text}
                  onChange={(e) => {
                    setText(e.target.value);
                    setPage(1);
                  }}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 w-full lg:w-auto">
              <Select value={tipo} onValueChange={(v) => (setTipo(v), setPage(1))}>
                <SelectTrigger><SelectValue placeholder="Tipo" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tipo: todos</SelectItem>
                  <SelectItem value="conocimiento">conocimiento</SelectItem>
                  <SelectItem value="percepcion">percepción</SelectItem>
                </SelectContent>
              </Select>

              <Select value={tema} onValueChange={(v) => (setTema(v), setPage(1))}>
                <SelectTrigger><SelectValue placeholder="Tema" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tema: todos</SelectItem>
                  <SelectItem value="ahorro">ahorro</SelectItem>
                  <SelectItem value="inversion">inversión</SelectItem>
                  <SelectItem value="credito">crédito</SelectItem>
                  <SelectItem value="control-gastos">control-gastos</SelectItem>
                  <SelectItem value="general">general</SelectItem>
                </SelectContent>
              </Select>

              <Select value={nivel} onValueChange={(v) => (setNivel(v), setPage(1))}>
                <SelectTrigger><SelectValue placeholder="Nivel" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Nivel: todos</SelectItem>
                  <SelectItem value="basico">básico</SelectItem>
                  <SelectItem value="intermedio">intermedio</SelectItem>
                  <SelectItem value="avanzado">avanzado</SelectItem>
                </SelectContent>
              </Select>

              <Select value={estado} onValueChange={(v) => (setEstado(v), setPage(1))}>
                <SelectTrigger><SelectValue placeholder="Estado" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Estado: todos</SelectItem>
                  <SelectItem value="activa">activa</SelectItem>
                  <SelectItem value="inactiva">inactiva</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={String(limit)}
                onValueChange={(v) => {
                  setLimit(Number(v));
                  setPage(1);
                }}
              >
                <SelectTrigger><SelectValue placeholder="Limit" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {meta ? (
                <>
                  Total: <span className="font-medium text-foreground">{meta.total}</span> · Página{" "}
                  <span className="font-medium text-foreground">{meta.page}</span> /{" "}
                  <span className="font-medium text-foreground">{meta.pages}</span>
                </>
              ) : "—"}
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1 || isFetching}
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                onClick={() => setPage((p) => p + 1)}
                disabled={isFetching || (meta ? page >= meta.pages : true)}
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
                  <TableHead>Pregunta</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Tema</TableHead>
                  <TableHead>Nivel</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      Cargando...
                    </TableCell>
                  </TableRow>
                ) : rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      Sin resultados.
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((q: Question) => (
                    <TableRow key={q._id}>
                      <TableCell className="font-medium max-w-[520px] truncate">
                        {q.pregunta}
                      </TableCell>
                      <TableCell><Badge variant="outline">{q.tipo}</Badge></TableCell>
                      <TableCell><Badge variant="outline">{q.tema}</Badge></TableCell>
                      <TableCell><Badge variant="outline">{q.nivel}</Badge></TableCell>
                      <TableCell>
                        <Badge variant={q.estado === "activa" ? "default" : "secondary"}>
                          {q.estado}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {q.fechaCreacion ? new Date(q.fechaCreacion).toLocaleString() : "—"}
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
                            <DropdownMenuItem onClick={() => openView(q._id)}>
                              <Eye className="mr-2 h-4 w-4" /> Ver
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openEdit(q._id)}>
                              <Edit className="mr-2 h-4 w-4" /> Editar
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive" onClick={() => setDeleteId(q._id)}>
                              <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Modal Create/Edit/View */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl w-[95vw]">
          <DialogHeader>
            <DialogTitle>
              {mode === "create" ? "Nueva Pregunta" : mode === "edit" ? "Editar Pregunta" : "Ver Pregunta"}
            </DialogTitle>
            <DialogDescription>
              {mode === "view" ? "Vista de la pregunta." : "Completa los campos y guarda cambios."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Select value={form.tipo} onValueChange={(v: any) => setForm((s) => ({ ...s, tipo: v }))} disabled={disabled}>
              <SelectTrigger><SelectValue placeholder="Tipo" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="conocimiento">conocimiento</SelectItem>
                <SelectItem value="percepcion">percepción</SelectItem>
              </SelectContent>
            </Select>

            <Select value={form.tema} onValueChange={(v: any) => setForm((s) => ({ ...s, tema: v }))} disabled={disabled}>
              <SelectTrigger><SelectValue placeholder="Tema" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ahorro">ahorro</SelectItem>
                <SelectItem value="inversion">inversión</SelectItem>
                <SelectItem value="credito">crédito</SelectItem>
                <SelectItem value="control-gastos">control-gastos</SelectItem>
                <SelectItem value="general">general</SelectItem>
              </SelectContent>
            </Select>

            <Select value={form.nivel} onValueChange={(v: any) => setForm((s) => ({ ...s, nivel: v }))} disabled={disabled}>
              <SelectTrigger><SelectValue placeholder="Nivel" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="basico">básico</SelectItem>
                <SelectItem value="intermedio">intermedio</SelectItem>
                <SelectItem value="avanzado">avanzado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Input
            placeholder="Dimensión (opcional)"
            value={form.dimension ?? ""}
            onChange={(e) => setForm((s) => ({ ...s, dimension: e.target.value }))}
            disabled={disabled}
          />

          <Input
            placeholder="Texto de la pregunta"
            value={form.pregunta}
            onChange={(e) => setForm((s) => ({ ...s, pregunta: e.target.value }))}
            disabled={disabled}
          />

          <div className="rounded-md border p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="font-medium">Respuestas</div>
              {mode !== "view" && form.respuestas.length < 4 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setForm((s) => {
                      const nextIncisos = ["a", "b", "c", "d"] as const;
                      const used = new Set(s.respuestas.map((r) => r.inciso));
                      const next = nextIncisos.find((x) => !used.has(x))!;
                      return { ...s, respuestas: [...s.respuestas, { inciso: next, texto: "", correcta: false }] };
                    })
                  }
                >
                  + Agregar
                </Button>
              )}
            </div>

            {form.respuestas.map((r, idx) => (
              <div key={r.inciso} className="grid grid-cols-1 md:grid-cols-6 gap-2 items-center">
                <div className="md:col-span-1">
                  <Badge variant="outline">{r.inciso.toUpperCase()}</Badge>
                </div>

                <div className="md:col-span-4">
                  <Input
                    placeholder="Texto de la respuesta"
                    value={r.texto}
                    onChange={(e) =>
                      setForm((s) => {
                        const next = [...s.respuestas];
                        next[idx] = { ...next[idx], texto: e.target.value };
                        return { ...s, respuestas: next };
                      })
                    }
                    disabled={disabled}
                  />
                </div>

                <div className="md:col-span-1 flex gap-2 justify-end">
                  <Select
                    value={r.correcta ? "true" : "false"}
                    onValueChange={(v) =>
                      setForm((s) => {
                        const next = [...s.respuestas];
                        next[idx] = { ...next[idx], correcta: v === "true" };
                        return { ...s, respuestas: next };
                      })
                    }
                    disabled={disabled}
                  >
                    <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="false">Incorrecta</SelectItem>
                      <SelectItem value="true">Correcta</SelectItem>
                    </SelectContent>
                  </Select>

                  {mode !== "view" && form.respuestas.length > 2 && (
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setForm((s) => ({ ...s, respuestas: s.respuestas.filter((_, i) => i !== idx) }))}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <Select
            value={form.estado}
            onValueChange={(v: any) => setForm((s) => ({ ...s, estado: v }))}
            disabled={disabled}
          >
            <SelectTrigger><SelectValue placeholder="Estado" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="activa">activa</SelectItem>
              <SelectItem value="inactiva">inactiva</SelectItem>
            </SelectContent>
          </Select>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cerrar</Button>
            {mode !== "view" && (
              <Button onClick={submit} disabled={createMut.isPending || updateMut.isPending}>
                {mode === "create"
                  ? createMut.isPending ? "Creando..." : "Crear"
                  : updateMut.isPending ? "Guardando..." : "Guardar cambios"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={Boolean(deleteId)} onOpenChange={(v) => !v && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar pregunta?</AlertDialogTitle>
            <AlertDialogDescription>Esta acción no se puede deshacer.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMut.isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMut.mutate(deleteId)}
              disabled={deleteMut.isPending}
            >
              {deleteMut.isPending ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Success modal */}
      <Dialog open={okOpen} onOpenChange={setOkOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Operación exitosa</DialogTitle>
            <DialogDescription>{okMsg}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setOkOpen(false)}>OK</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
