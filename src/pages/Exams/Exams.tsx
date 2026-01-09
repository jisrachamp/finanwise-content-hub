// src/screens/Admin/Exams.tsx
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Eye, MoreHorizontal, RefreshCw, Trash2, Search as SearchIcon, Users } from "lucide-react";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import type { Exam } from "@/api/Exams/types";
import {
  adminExamDelete,
  adminExamGetById,
  adminExamsSearch,
  adminUsersList,
  userQuestionGetById,
  type CmsUser,
  type UserQuestion,
} from "@/api/Exams/Exams.api";

type Mode = "view";

type SearchParams = {
  usuarioID?: string;
  tipo?: string;
  tema?: string;
  nivel?: string;
  from?: string; // ISO
  to?: string;   // ISO
  page: number;
  limit: number;
};

export default function Exams() {
  const qc = useQueryClient();

  /** ===== Usuarios (panel izquierdo) ===== */
  const [userText, setUserText] = useState("");
  const [selectedUser, setSelectedUser] = useState<CmsUser | null>(null);

  const usersQuery = useQuery({
    queryKey: ["admin.users"],
    queryFn: adminUsersList,
  });

  const users: CmsUser[] = usersQuery.data ?? [];
  const filteredUsers = useMemo(() => {
    const t = userText.trim().toLowerCase();
    if (!t) return users;
    return users.filter((u) => {
      const s = `${u.nombre ?? ""} ${u.correo ?? ""} ${u._id}`.toLowerCase();
      return s.includes(t);
    });
  }, [users, userText]);

  /** ===== Draft filtros (NO disparan request) ===== */
  const [usuarioID, setUsuarioID] = useState("");
  const [tipo, setTipo] = useState("all");
  const [tema, setTema] = useState("all");
  const [nivel, setNivel] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [limit, setLimit] = useState(10);

  /** ===== Search params (sí disparan request) ===== */
  const [search, setSearch] = useState<SearchParams | null>(null);

  const examsQuery = useQuery({
    queryKey: ["admin.exams", search],
    enabled: Boolean(search),
    queryFn: () => {
      const s = search!;
      return adminExamsSearch({
        usuarioID: s.usuarioID,
        tipo: s.tipo,
        tema: s.tema,
        nivel: s.nivel,
        from: s.from,
        to: s.to,
        page: s.page,
        limit: s.limit,
      });
    },
  });

  const { data, isLoading, isError, refetch, isFetching } = examsQuery;

  useEffect(() => {
    if (isError) toast.error("No se pudieron cargar los exámenes. Revisa API/token.");
  }, [isError]);

  const rows: Exam[] = (data as any)?.data ?? [];
  const meta = (data as any)?.meta;

  /** ===== View modal ===== */
  const [open, setOpen] = useState(false);
  const [mode] = useState<Mode>("view");
  const [selected, setSelected] = useState<Exam | null>(null);

  // Preguntas del examen (texto)
  const questionIds = useMemo(() => {
    if (!selected?.preguntas?.length) return [];
    return Array.from(new Set(selected.preguntas.map((p) => p.preguntaID).filter(Boolean)));
  }, [selected]);

  const questionsQuery = useQuery({
    queryKey: ["exam.questions.detail", questionIds],
    enabled: open && questionIds.length > 0,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const arr = await Promise.all(
        questionIds.map(async (id) => {
          try {
            return await userQuestionGetById(id);
          } catch {
            // si alguna falla, regresamos placeholder para no romper UI
            return {
              _id: id,
              tipo: "conocimiento",
              tema: "general",
              nivel: "basico",
              pregunta: "(No se pudo cargar la pregunta)",
              respuestas: [],
            } as UserQuestion;
          }
        })
      );
      return arr;
    },
  });

  const questionsMap = useMemo(() => {
    const m = new Map<string, UserQuestion>();
    (questionsQuery.data ?? []).forEach((q) => m.set(q._id, q));
    return m;
  }, [questionsQuery.data]);

  /** ===== Success modal ===== */
  const [okOpen, setOkOpen] = useState(false);
  const [okMsg, setOkMsg] = useState("Operación realizada con éxito.");

  /** ===== delete ===== */
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const deleteMut = useMutation({
    mutationFn: (id: string) => adminExamDelete(id),
    onSuccess: async () => {
      setOkMsg("Examen eliminado con éxito.");
      setOkOpen(true);
      setDeleteId(null);
      await qc.invalidateQueries({ queryKey: ["admin.exams"] });
      await refetch();
    },
    onError: (e: any) => toast.error(e?.message ?? "No se pudo eliminar"),
  });

  const buildSearchParams = (overrides?: Partial<SearchParams>): SearchParams => {
    const base: SearchParams = {
      usuarioID: usuarioID.trim() || undefined,
      tipo,
      tema,
      nivel,
      from: from ? new Date(from).toISOString() : undefined,
      to: to ? new Date(to).toISOString() : undefined,
      page: 1,
      limit,
    };
    return { ...base, ...(overrides ?? {}) };
  };

  const onBuscar = () => {
    if (!usuarioID.trim()) return toast.error("Selecciona un usuario primero.");
    setSearch(buildSearchParams({ page: 1 }));
  };

  const onSelectUser = (u: CmsUser) => {
    // ✅ click usuario = auto buscar
    setSelectedUser(u);
    setUsuarioID(u._id);
    // disparamos búsqueda usando el id directo (sin depender del state async)
    setSearch(buildSearchParams({ usuarioID: u._id, page: 1 }));
  };

  const openView = async (id: string) => {
    try {
      const ex = await adminExamGetById(id);
      setSelected(ex);
      setOpen(true);
    } catch (e: any) {
      toast.error(e?.message ?? "No se pudo cargar el examen");
    }
  };

  const nextPage = () => {
    setSearch((s) => (s ? { ...s, page: s.page + 1 } : s));
  };
  const prevPage = () => {
    setSearch((s) => (s ? { ...s, page: Math.max(1, s.page - 1) } : s));
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-foreground">Exámenes</h1>
          <p className="text-muted-foreground mt-1">Selecciona un usuario para ver sus resultados</p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => usersQuery.refetch()}
            disabled={usersQuery.isFetching}
          >
            <Users className="h-4 w-4" />
            {usersQuery.isFetching ? "Actualizando usuarios..." : "Actualizar usuarios"}
          </Button>

          <Button variant="outline" className="gap-2" onClick={onBuscar} disabled={isFetching || !usuarioID.trim()}>
            <SearchIcon className="h-4 w-4" />
            {isFetching ? "Buscando..." : "Buscar"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Usuarios */}
        <Card className="lg:col-span-4">
          <CardHeader>
            <div className="text-lg font-semibold">Usuarios</div>
            <div className="text-sm text-muted-foreground">
              {usersQuery.isLoading ? "Cargando..." : `${users.length} usuarios`}
            </div>

            <Input
              placeholder='Filtrar (nombre, correo o id)...'
              value={userText}
              onChange={(e) => setUserText(e.target.value)}
            />
          </CardHeader>

          <CardContent>
            <div className="space-y-2 max-h-[520px] overflow-auto pr-1">
              {usersQuery.isLoading ? (
                <div className="text-sm text-muted-foreground">Cargando usuarios…</div>
              ) : usersQuery.isError ? (
                <div className="text-sm text-destructive">No se pudieron cargar usuarios.</div>
              ) : filteredUsers.length === 0 ? (
                <div className="text-sm text-muted-foreground">Sin usuarios.</div>
              ) : (
                filteredUsers.map((u) => {
                  const active = selectedUser?._id === u._id;
                  return (
                    <button
                      key={u._id}
                      onClick={() => onSelectUser(u)}
                      className={[
                        "w-full text-left rounded-md border p-3 hover:bg-muted transition",
                        active ? "bg-muted border-foreground/20" : "",
                      ].join(" ")}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <div className="font-medium truncate">{u.nombre || "(sin nombre)"}</div>
                          <div className="text-xs text-muted-foreground truncate">{u.correo || "—"}</div>
                        </div>
                        <Badge variant="outline" className="shrink-0">{u.rol || "—"}</Badge>
                      </div>
                      <div className="text-[11px] text-muted-foreground font-mono mt-2 truncate">{u._id}</div>
                    </button>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>

        {/* Exámenes */}
        <Card className="lg:col-span-8">
          <CardHeader>
            <div className="grid grid-cols-1 lg:grid-cols-6 gap-2">
              <Input
                placeholder="usuarioID (se llena al seleccionar usuario)"
                value={usuarioID}
                onChange={(e) => {
                  setUsuarioID(e.target.value);
                  setSelectedUser(null);
                }}
                className="lg:col-span-2 font-mono text-xs"
              />

              <Select value={tipo} onValueChange={(v) => setTipo(v)}>
                <SelectTrigger><SelectValue placeholder="Tipo" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tipo: todos</SelectItem>
                  <SelectItem value="conocimiento">conocimiento</SelectItem>
                  <SelectItem value="percepcion">percepción</SelectItem>
                </SelectContent>
              </Select>

              <Select value={tema} onValueChange={(v) => setTema(v)}>
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

              <Select value={nivel} onValueChange={(v) => setNivel(v)}>
                <SelectTrigger><SelectValue placeholder="Nivel" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Nivel: todos</SelectItem>
                  <SelectItem value="basico">básico</SelectItem>
                  <SelectItem value="intermedio">intermedio</SelectItem>
                  <SelectItem value="avanzado">avanzado</SelectItem>
                </SelectContent>
              </Select>

              <div className="grid grid-cols-2 gap-2 lg:col-span-2">
                <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
                <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
              </div>

              <Select value={String(limit)} onValueChange={(v) => setLimit(Number(v))}>
                <SelectTrigger><SelectValue placeholder="Limit" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                </SelectContent>
              </Select>

              <Button className="lg:col-span-1 gap-2" onClick={onBuscar} disabled={isFetching || !usuarioID.trim()}>
                <SearchIcon className="h-4 w-4" />
                {isFetching ? "Buscando..." : "Buscar"}
              </Button>

              <Button
                variant="outline"
                className="lg:col-span-1 gap-2"
                onClick={() => refetch()}
                disabled={isFetching || !search}
              >
                <RefreshCw className="h-4 w-4" />
                Actualizar
              </Button>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                {!search ? (
                  <>Selecciona un usuario (click) o escribe el usuarioID y presiona <b>Buscar</b>.</>
                ) : meta ? (
                  <>
                    Total: <span className="font-medium text-foreground">{meta.total}</span> · Página{" "}
                    <span className="font-medium text-foreground">{meta.page}</span> /{" "}
                    <span className="font-medium text-foreground">{meta.pages}</span>
                  </>
                ) : "—"}
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={prevPage} disabled={!search || isFetching || (meta ? meta.page <= 1 : true)}>
                  Anterior
                </Button>
                <Button variant="outline" onClick={nextPage} disabled={!search || isFetching || (meta ? meta.page >= meta.pages : true)}>
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
                  {!search ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-10">
                        Selecciona un usuario o presiona <b>Buscar</b>.
                      </TableCell>
                    </TableRow>
                  ) : isLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-10">
                        Cargando...
                      </TableCell>
                    </TableRow>
                  ) : rows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-10">
                        Sin resultados.
                      </TableCell>
                    </TableRow>
                  ) : (
                    rows.map((ex) => (
                      <TableRow key={ex._id}>
                        <TableCell className="font-mono text-xs">
                          {selectedUser && selectedUser._id === ex.usuarioID ? (selectedUser.nombre || ex.usuarioID) : ex.usuarioID}
                        </TableCell>
                        <TableCell><Badge variant="outline">{ex.tipo}</Badge></TableCell>
                        <TableCell><Badge variant="outline">{ex.tema}</Badge></TableCell>
                        <TableCell><Badge variant="outline">{ex.nivel}</Badge></TableCell>
                        <TableCell className="font-medium">
                          {ex.puntuacion ?? 0} / {ex.puntuacionMaximaRequerida || "—"}
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
      </div>

      {/* View modal */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl w-[95vw]">
          <DialogHeader>
            <DialogTitle>Detalle de Examen</DialogTitle>
            <DialogDescription>{mode === "view" ? "Respuestas capturadas y resultado." : ""}</DialogDescription>
          </DialogHeader>

          {!selected ? (
            <p className="text-sm text-muted-foreground">—</p>
          ) : (
            <div className="space-y-4">
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
                    {selected.puntuacion ?? 0} / {selected.puntuacionMaximaRequerida || "—"}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Mín requerida: {selected.puntuacionMinimaRequerida || 0}
                  </div>
                </div>
              </div>

              <div className="rounded-md border p-4">
                <div className="font-medium mb-2 flex items-center justify-between">
                  <span>Respuestas</span>
                  {questionsQuery.isFetching && <span className="text-xs text-muted-foreground">Cargando texto de preguntas…</span>}
                </div>

                {selected.preguntas?.length ? (
                  <div className="space-y-3">
                    {selected.preguntas.map((p, idx) => {
                      const q = questionsMap.get(p.preguntaID);
                      const selectedOpt = q?.respuestas?.find((r) => r.inciso === p.respuestaSeleccionada);
                      const correctOpt = q?.respuestas?.find((r) => r.correcta);

                      return (
                        <div key={`${p.preguntaID}-${idx}`} className="border rounded-md p-3 space-y-2">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="text-sm font-medium">
                                {q?.pregunta || "Pregunta (no disponible)"}
                              </div>
                              <div className="text-[11px] text-muted-foreground font-mono mt-1">
                                id: {p.preguntaID}
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <Badge variant="outline">
                                Resp: {p.respuestaSeleccionada.toUpperCase()}
                              </Badge>
                              <Badge variant={p.esCorrecta ? "default" : "secondary"}>
                                {p.esCorrecta ? "Correcta" : "Incorrecta"}
                              </Badge>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            <div className="rounded-md bg-muted/50 p-2">
                              <div className="text-xs text-muted-foreground">Seleccionada</div>
                              <div className="text-sm">
                                <b>{p.respuestaSeleccionada.toUpperCase()}</b>
                                {selectedOpt?.texto ? ` — ${selectedOpt.texto}` : ""}
                              </div>
                            </div>

                            <div className="rounded-md bg-muted/50 p-2">
                              <div className="text-xs text-muted-foreground">Correcta</div>
                              <div className="text-sm">
                                {correctOpt
                                  ? <><b>{correctOpt.inciso.toUpperCase()}</b> — {correctOpt.texto}</>
                                  : <span className="text-muted-foreground">—</span>}
                              </div>
                            </div>
                          </div>

                          {!!q?.respuestas?.length && (
                            <div className="pt-2">
                              <div className="text-xs text-muted-foreground mb-1">Opciones</div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {q.respuestas.map((r) => {
                                  const isSel = r.inciso === p.respuestaSeleccionada;
                                  const isCor = r.correcta;
                                  return (
                                    <div
                                      key={r.inciso}
                                      className={[
                                        "border rounded-md p-2 text-sm",
                                        isSel ? "bg-muted" : "",
                                      ].join(" ")}
                                    >
                                      <div className="flex items-center justify-between gap-2">
                                        <div className="truncate">
                                          <b>{r.inciso.toUpperCase()}.</b> {r.texto}
                                        </div>
                                        <div className="flex gap-1 shrink-0">
                                          {isSel && <Badge variant="outline">Elegida</Badge>}
                                          {isCor && <Badge>Correcta</Badge>}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
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
