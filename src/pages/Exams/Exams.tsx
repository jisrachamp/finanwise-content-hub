import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Eye, MoreHorizontal, RefreshCw, Trash2 } from "lucide-react";

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

import type { Exam } from "@/api/Exams/types";
import { adminExamDelete, adminExamGetById, adminExamsSearch } from "@/api/Exams/Exams.api";

type Mode = "view";

export default function Exams() {
  const qc = useQueryClient();

  const [usuarioID, setUsuarioID] = useState(""); // filtro opcional
  const [tipo, setTipo] = useState("all");
  const [tema, setTema] = useState("all");
  const [nivel, setNivel] = useState("all");
  const [from, setFrom] = useState(""); // ISO date input
  const [to, setTo] = useState("");

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // view modal
  const [open, setOpen] = useState(false);
  const [mode] = useState<Mode>("view");
  const [selected, setSelected] = useState<Exam | null>(null);

  // success modal
  const [okOpen, setOkOpen] = useState(false);
  const [okMsg, setOkMsg] = useState("Operación realizada con éxito.");

  // delete
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const queryKey = useMemo(
    () => ["admin.exams", { usuarioID, tipo, tema, nivel, from, to, page, limit }],
    [usuarioID, tipo, tema, nivel, from, to, page, limit]
  );

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey,
    queryFn: () =>
      adminExamsSearch({
        usuarioID: usuarioID.trim() || undefined,
        tipo,
        tema,
        nivel,
        from: from ? new Date(from).toISOString() : undefined,
        to: to ? new Date(to).toISOString() : undefined,
        page,
        limit,
      }),
  });

  useEffect(() => {
    if (isError) toast.error("No se pudieron cargar los exámenes. Revisa API/token.");
  }, [isError]);

  const rows: Exam[] = (data as any)?.data ?? [];
  const meta = (data as any)?.meta;

  const deleteMut = useMutation({
    mutationFn: (id: string) => adminExamDelete(id),
    onSuccess: async () => {
      setOkMsg("Examen eliminado con éxito.");
      setOkOpen(true);
      setDeleteId(null);
      await qc.invalidateQueries({ queryKey: ["admin.exams"] });
      refetch();
    },
    onError: (e: any) => toast.error(e?.message ?? "No se pudo eliminar"),
  });

  const openView = async (id: string) => {
    try {
      const ex = await adminExamGetById(id);
      setSelected(ex);
      setOpen(true);
    } catch (e: any) {
      toast.error(e?.message ?? "No se pudo cargar el examen");
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-foreground">Exámenes</h1>
          <p className="text-muted-foreground mt-1">Resultados por usuario y periodo</p>
        </div>

        <Button variant="outline" className="gap-2" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw className="h-4 w-4" />
          {isFetching ? "Actualizando..." : "Actualizar"}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="grid grid-cols-1 lg:grid-cols-6 gap-2">
            <Input
              placeholder="Filtrar por usuarioID (ObjectId)..."
              value={usuarioID}
              onChange={(e) => {
                setUsuarioID(e.target.value);
                setPage(1);
              }}
              className="lg:col-span-2"
            />

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

            <div className="grid grid-cols-2 gap-2 lg:col-span-2">
              <Input
                type="date"
                value={from}
                onChange={(e) => (setFrom(e.target.value), setPage(1))}
              />
              <Input
                type="date"
                value={to}
                onChange={(e) => (setTo(e.target.value), setPage(1))}
              />
            </div>

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
                  <TableHead>Usuario</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Tema</TableHead>
                  <TableHead>Nivel</TableHead>
                  <TableHead>Puntuación</TableHead>
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
                  rows.map((ex) => (
                    <TableRow key={ex._id}>
                      <TableCell className="font-mono text-xs">{ex.usuarioID}</TableCell>
                      <TableCell><Badge variant="outline">{ex.tipo}</Badge></TableCell>
                      <TableCell><Badge variant="outline">{ex.tema}</Badge></TableCell>
                      <TableCell><Badge variant="outline">{ex.nivel}</Badge></TableCell>
                      <TableCell className="font-medium">
                        {ex.puntuacion} / {ex.puntuacionMaximaRequerida || "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {ex.fecha ? new Date(ex.fecha).toLocaleString() : "—"}
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
                            <DropdownMenuItem onClick={() => openView(ex._id)}>
                              <Eye className="mr-2 h-4 w-4" /> Ver detalle
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive" onClick={() => setDeleteId(ex._id)}>
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

      {/* View modal */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl w-[95vw]">
          <DialogHeader>
            <DialogTitle>Detalle de Examen</DialogTitle>
            <DialogDescription>
              {mode === "view" ? "Respuestas capturadas y resultado." : ""}
            </DialogDescription>
          </DialogHeader>

          {!selected ? (
            <p className="text-sm text-muted-foreground">—</p>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <div className="rounded-md border p-3">
                  <div className="text-xs text-muted-foreground">Usuario</div>
                  <div className="font-mono text-xs mt-1">{selected.usuarioID}</div>
                </div>
                <div className="rounded-md border p-3">
                  <div className="text-xs text-muted-foreground">Clasificación</div>
                  <div className="mt-1 flex gap-2 flex-wrap">
                    <Badge variant="outline">{selected.tipo}</Badge>
                    <Badge variant="outline">{selected.tema}</Badge>
                    <Badge variant="outline">{selected.nivel}</Badge>
                  </div>
                </div>
                <div className="rounded-md border p-3">
                  <div className="text-xs text-muted-foreground">Puntuación</div>
                  <div className="font-semibold mt-1">
                    {selected.puntuacion} / {selected.puntuacionMaximaRequerida || "—"}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Mín requerida: {selected.puntuacionMinimaRequerida || 0}
                  </div>
                </div>
              </div>

              <div className="rounded-md border p-4">
                <div className="font-medium mb-2">Respuestas</div>
                {selected.preguntas?.length ? (
                  <div className="space-y-2">
                    {selected.preguntas.map((p, idx) => (
                      <div key={`${p.preguntaID}-${idx}`} className="flex items-center justify-between border rounded-md p-3">
                        <div className="space-y-1">
                          <div className="text-xs text-muted-foreground">preguntaID</div>
                          <div className="font-mono text-xs">{p.preguntaID}</div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Badge variant="outline">Resp: {p.respuestaSeleccionada.toUpperCase()}</Badge>
                          <Badge variant={p.esCorrecta ? "default" : "secondary"}>
                            {p.esCorrecta ? "Correcta" : "Incorrecta"}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Sin respuestas.</p>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setOpen(false)}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={Boolean(deleteId)} onOpenChange={(v) => !v && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar examen?</AlertDialogTitle>
            <AlertDialogDescription>
              Esto elimina el resultado capturado del usuario (no se puede deshacer).
            </AlertDialogDescription>
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
