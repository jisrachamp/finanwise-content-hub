import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";

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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { MoreHorizontal, Plus, Search, Shield, User, UserCog, Trash2, Edit, Eye } from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/auth/useAuth";
import type { Usuario, UserRole, UsuarioCreatePayload, UsuarioUpdatePayload } from "@/api/Users/types";
import { usersCreate, usersDelete, usersList, usersUpdate } from "@/api/Users/Users.api";

type Mode = "create" | "edit" | "view";

type FormErrors = Partial<Record<
  | "nombre"
  | "correo"
  | "password"
  | "rol"
  | "edad"
  | "ingresosMensuales"
  | "nivelEndeudamiento"
  | "nivelEducativo",
  string
>>;

type FormState = {
  _id?: string;

  nombre: string;
  correo: string;
  password: string; // requerido solo en create; opcional en edit
  rol: UserRole;

  // perfil
  edad: string;
  ingresosMensuales: string;
  nivelEndeudamiento: string;
  nivelEducativo: string;

  // preferencias
  notificaciones: boolean;
  temasFavoritosCsv: string;
};

function splitCsv(s: string) {
  return s
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
}

function joinCsv(arr?: string[]) {
  return (arr ?? []).join(", ");
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function roleLabel(r: UserRole) {
  return r === "administrador" ? "Administrador" : "Usuario";
}

const roleIconMap: Record<string, any> = {
  Administrador: Shield,
  Usuario: User,
};

const roleColors: Record<string, string> = {
  Administrador: "bg-primary text-primary-foreground",
  Usuario: "bg-muted text-muted-foreground",
};

function emptyForm(): FormState {
  return {
    nombre: "",
    correo: "",
    password: "",
    rol: "usuario",

    edad: "",
    ingresosMensuales: "",
    nivelEndeudamiento: "",
    nivelEducativo: "",

    notificaciones: true,
    temasFavoritosCsv: "",
  };
}

function fromUser(u: Usuario): FormState {
  return {
    _id: u._id,
    nombre: u.nombre ?? "",
    correo: u.correo ?? "",
    password: "", // nunca precargar

    rol: (u.rol ?? "usuario") as UserRole,

    edad: u.perfil?.edad !== undefined ? String(u.perfil.edad) : "",
    ingresosMensuales: u.perfil?.ingresosMensuales !== undefined ? String(u.perfil.ingresosMensuales) : "",
    nivelEndeudamiento: u.perfil?.nivelEndeudamiento !== undefined ? String(u.perfil.nivelEndeudamiento) : "",
    nivelEducativo: u.perfil?.nivelEducativo ?? "",

    notificaciones: u.preferencias?.notificaciones ?? true,
    temasFavoritosCsv: joinCsv(u.preferencias?.temasFavoritos),
  };
}

function validateForm(mode: Mode, s: FormState): FormErrors {
  const e: FormErrors = {};

  const nombre = s.nombre.trim();
  const correo = s.correo.trim().toLowerCase();

  if (!nombre) e.nombre = "El nombre es obligatorio.";
  else if (nombre.length < 2) e.nombre = "El nombre es muy corto.";

  if (!correo) e.correo = "El correo es obligatorio.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) e.correo = "Formato de correo inválido.";

  if (!s.rol) e.rol = "El rol es obligatorio.";

  // password: requerido en create
  if (mode === "create") {
    if (!s.password) e.password = "La contraseña es obligatoria.";
    else if (s.password.length < 6) e.password = "La contraseña debe tener al menos 6 caracteres.";
  } else {
    // edit: opcional, pero si viene, mínimo
    if (s.password && s.password.length < 6) e.password = "La contraseña debe tener al menos 6 caracteres.";
  }

  // numéricos opcionales pero si vienen, validar
  const nEdad = s.edad.trim();
  if (nEdad) {
    const v = Number(nEdad);
    if (Number.isNaN(v) || v < 0 || v > 120) e.edad = "Edad inválida.";
  }

  const nIng = s.ingresosMensuales.trim();
  if (nIng) {
    const v = Number(nIng);
    if (Number.isNaN(v) || v < 0) e.ingresosMensuales = "Ingresos inválidos.";
  }

  const nEnd = s.nivelEndeudamiento.trim();
  if (nEnd) {
    const v = Number(nEnd);
    if (Number.isNaN(v) || v < 0 || v > 100) e.nivelEndeudamiento = "Endeudamiento inválido (0–100).";
  }

  const edu = s.nivelEducativo.trim();
  if (edu && edu.length < 2) e.nivelEducativo = "Nivel educativo muy corto.";

  return e;
}

function buildCreatePayload(s: FormState): UsuarioCreatePayload {
  const temas = splitCsv(s.temasFavoritosCsv);

  const payload: UsuarioCreatePayload = {
    nombre: s.nombre.trim(),
    correo: s.correo.trim().toLowerCase(),
    password: s.password,
    rol: s.rol,

    perfil: {},
    preferencias: {
      notificaciones: s.notificaciones,
      temasFavoritos: temas,
    },
  };

  if (s.edad.trim()) payload.perfil!.edad = Number(s.edad);
  if (s.ingresosMensuales.trim()) payload.perfil!.ingresosMensuales = Number(s.ingresosMensuales);
  if (s.nivelEndeudamiento.trim()) payload.perfil!.nivelEndeudamiento = Number(s.nivelEndeudamiento);
  if (s.nivelEducativo.trim()) payload.perfil!.nivelEducativo = s.nivelEducativo.trim();

  // si perfil quedó vacío, quítalo
  if (payload.perfil && Object.keys(payload.perfil).length === 0) delete payload.perfil;

  // si no hay temas y notificaciones viene por defecto, se puede dejar igual
  return payload;
}

function buildUpdatePayload(s: FormState): UsuarioUpdatePayload {
  const temas = splitCsv(s.temasFavoritosCsv);

  const payload: UsuarioUpdatePayload = {
    nombre: s.nombre.trim(),
    correo: s.correo.trim().toLowerCase(),
    rol: s.rol,

    perfil: {},
    preferencias: {
      notificaciones: s.notificaciones,
      temasFavoritos: temas,
    },
  };

  if (s.password) payload.password = s.password;

  if (s.edad.trim()) payload.perfil!.edad = Number(s.edad);
  if (s.ingresosMensuales.trim()) payload.perfil!.ingresosMensuales = Number(s.ingresosMensuales);
  if (s.nivelEndeudamiento.trim()) payload.perfil!.nivelEndeudamiento = Number(s.nivelEndeudamiento);
  if (s.nivelEducativo.trim()) payload.perfil!.nivelEducativo = s.nivelEducativo.trim();

  if (payload.perfil && Object.keys(payload.perfil).length === 0) delete payload.perfil;

  return payload;
}

export default function Users() {
  const qc = useQueryClient();
  const { user: me } = useAuth(); // 🔥 para bloquear “delete a mí mismo”

  // filtros UI
  const [q, setQ] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | UserRole>("all");

  // modal CRUD
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("create");
  const [form, setForm] = useState<FormState>(() => emptyForm());
  const [errors, setErrors] = useState<FormErrors>({});

  // delete confirm
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // resultado (éxito/error)
  const [resultOpen, setResultOpen] = useState(false);
  const [resultType, setResultType] = useState<"success" | "error">("success");
  const [resultTitle, setResultTitle] = useState("");
  const [resultMessage, setResultMessage] = useState("");

  function showResultModal(type: "success" | "error", title: string, message = "") {
    setResultType(type);
    setResultTitle(title);
    setResultMessage(message);
    setResultOpen(true);
  }

  const { data: users = [], isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["users.list"],
    queryFn: usersList,
  });

  useEffect(() => {
    if (isError) toast.error("No se pudo cargar /usuarios. Revisa tu API/BaseURL o token.");
  }, [isError]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return users.filter((u) => {
      const okRole = roleFilter === "all" || u.rol === roleFilter;
      if (!s) return okRole;
      const match =
        (u.nombre ?? "").toLowerCase().includes(s) ||
        (u.correo ?? "").toLowerCase().includes(s) ||
        (u._id ?? "").toLowerCase().includes(s);
      return okRole && match;
    });
  }, [users, q, roleFilter]);

  const stats = useMemo(() => {
    const total = users.length;
    const admins = users.filter((u) => u.rol === "administrador").length;
    const normales = users.filter((u) => u.rol === "usuario").length;
    const notifOn = users.filter((u) => u.preferencias?.notificaciones !== false).length;
    return { total, admins, normales, notifOn };
  }, [users]);

  const createMut = useMutation({
    mutationFn: (payload: UsuarioCreatePayload) => usersCreate(payload),
    onSuccess: async () => {
      setOpen(false);
      await qc.invalidateQueries({ queryKey: ["users.list"] });
      showResultModal("success", "✅ Usuario creado", "Se creó correctamente.");
    },
    onError: (e: any) => {
      const msg = e?.message ?? "No se pudo crear el usuario";
      showResultModal("error", "❌ Error al crear usuario", msg);
    },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UsuarioUpdatePayload }) =>
      usersUpdate(id, payload),
    onSuccess: async () => {
      setOpen(false);
      await qc.invalidateQueries({ queryKey: ["users.list"] });
      showResultModal("success", "✅ Usuario actualizado", "Cambios guardados correctamente.");
    },
    onError: (e: any) => {
      const msg = e?.message ?? "No se pudo actualizar el usuario";
      showResultModal("error", "❌ Error al actualizar usuario", msg);
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => usersDelete(id),
    onSuccess: async () => {
      setDeleteId(null);
      await qc.invalidateQueries({ queryKey: ["users.list"] });
      showResultModal("success", "✅ Usuario eliminado", "El usuario fue eliminado.");
    },
    onError: (e: any) => {
      const msg = e?.message ?? "No se pudo eliminar el usuario";
      showResultModal("error", "❌ Error al eliminar usuario", msg);
    },
  });

  const busy = createMut.isPending || updateMut.isPending;

  function openCreate() {
    setMode("create");
    setForm(emptyForm());
    setErrors({});
    setOpen(true);
  }

  function openView(u: Usuario) {
    setMode("view");
    setForm(fromUser(u));
    setErrors({});
    setOpen(true);
  }

  function openEdit(u: Usuario) {
    setMode("edit");
    setForm(fromUser(u));
    setErrors({});
    setOpen(true);
  }

  function submit() {
    const nextErrors = validateForm(mode, form);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      toast.error("Revisa los campos marcados.");
      return;
    }

    if (mode === "create") {
      createMut.mutate(buildCreatePayload(form));
      return;
    }

    if (mode === "edit") {
      if (!form._id) {
        toast.error("Falta el _id del usuario.");
        return;
      }
      updateMut.mutate({ id: form._id, payload: buildUpdatePayload(form) });
    }
  }

  const disabled = mode === "view" || busy;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-foreground">Gestión de Usuarios</h1>
          <p className="text-muted-foreground mt-1">Administrar cuentas y permisos</p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
            {isFetching ? "Actualizando..." : "Actualizar"}
          </Button>

          <Button className="gap-2" onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Agregar Usuario
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Administradores</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.admins}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Usuarios</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.normales}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Notificaciones ON</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.notifOn}</div>
          </CardContent>
        </Card>
      </div>

      {/* List */}
      <Card>
        <CardHeader>
          <CardTitle>Usuarios</CardTitle>
          <CardDescription>Buscar, ver, editar y eliminar usuarios</CardDescription>

          <div className="mt-4 flex flex-col md:flex-row gap-2 md:items-center md:justify-between">
            <div className="relative w-full md:w-[420px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="pl-10"
                placeholder="Buscar por nombre, correo o id..."
              />
            </div>

            <div className="w-full md:w-[220px]">
              <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v as any)}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por rol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="usuario">usuario</SelectItem>
                  <SelectItem value="administrador">administrador</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Correo</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Notificaciones</TableHead>
                  <TableHead>Registro</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      Cargando usuarios...
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      No hay resultados.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((u) => {
                    const label = roleLabel(u.rol);
                    const RoleIcon = roleIconMap[label] ?? UserCog;

                    const canDelete = u._id !== me?._id; // ✅ no puedes borrarte
                    const notifOn = u.preferencias?.notificaciones !== false;

                    return (
                      <TableRow key={u._id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                {getInitials(u.nombre)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                              <span className="font-medium">{u.nombre}</span>
                              <span className="text-xs text-muted-foreground">{u._id}</span>
                            </div>
                          </div>
                        </TableCell>

                        <TableCell className="text-muted-foreground">{u.correo}</TableCell>

                        <TableCell>
                          <Badge className={roleColors[label] ?? "bg-muted text-muted-foreground"}>
                            <RoleIcon className="h-3 w-3 mr-1" />
                            {label}
                          </Badge>
                        </TableCell>

                        <TableCell>
                          <Badge variant={notifOn ? "default" : "secondary"}>
                            {notifOn ? "ON" : "OFF"}
                          </Badge>
                        </TableCell>

                        <TableCell className="text-muted-foreground text-sm">
                          {u.fechaRegistro ? new Date(u.fechaRegistro).toLocaleString() : "—"}
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

                              <DropdownMenuItem onClick={() => openView(u)}>
                                <Eye className="mr-2 h-4 w-4" />
                                Ver
                              </DropdownMenuItem>

                              <DropdownMenuItem onClick={() => openEdit(u)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Editar
                              </DropdownMenuItem>

                              <DropdownMenuSeparator />

                              <DropdownMenuItem
                                className={!canDelete ? "opacity-50 pointer-events-none" : "text-destructive"}
                                onClick={() => {
                                  if (!canDelete) {
                                    toast.error("No puedes eliminar tu propia cuenta.");
                                    return;
                                  }
                                  setDeleteId(u._id);
                                }}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Eliminar
                              </DropdownMenuItem>

                              {!canDelete ? (
                                <div className="px-2 pb-2 pt-1 text-xs text-muted-foreground">
                                  * No puedes eliminar tu propia cuenta.
                                </div>
                              ) : null}
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

      {/* ===== Modal Create/Edit/View (con scroll interno) ===== */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl w-[95vw] p-0 overflow-hidden flex flex-col max-h-[90vh]">
          {/* Header fijo */}
          <div className="px-6 pt-6 pb-2 shrink-0">
            <DialogHeader>
              <DialogTitle>
                {mode === "create" ? "Crear usuario" : mode === "edit" ? "Editar usuario" : "Ver usuario"}
              </DialogTitle>
              <DialogDescription>
                {mode === "create"
                  ? "Crea una cuenta (usuario o administrador)."
                  : mode === "edit"
                  ? "Edita los datos necesarios y guarda."
                  : "Consulta la información del usuario."}
              </DialogDescription>
            </DialogHeader>
          </div>

          {/* Body con scroll */}
          <ScrollArea className="flex-1 min-h-0 px-6">
            <div className="py-4 space-y-5">
              {/* Básicos */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Nombre *</label>
                  <Input
                    value={form.nombre}
                    onChange={(e) => setForm((s) => ({ ...s, nombre: e.target.value }))}
                    disabled={disabled}
                    placeholder="Nombre completo"
                  />
                  {errors.nombre ? <p className="text-xs text-destructive">{errors.nombre}</p> : null}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Correo *</label>
                  <Input
                    value={form.correo}
                    onChange={(e) => setForm((s) => ({ ...s, correo: e.target.value }))}
                    disabled={disabled}
                    placeholder="correo@dominio.com"
                  />
                  {errors.correo ? <p className="text-xs text-destructive">{errors.correo}</p> : null}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Contraseña {mode === "create" ? "*" : "(opcional)"}
                  </label>
                  <Input
                    type="password"
                    value={form.password}
                    onChange={(e) => setForm((s) => ({ ...s, password: e.target.value }))}
                    disabled={disabled}
                    placeholder={mode === "create" ? "Mínimo 6 caracteres" : "Deja vacío para no cambiarla"}
                  />
                  {errors.password ? <p className="text-xs text-destructive">{errors.password}</p> : null}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Rol *</label>
                  <Select
                    value={form.rol}
                    onValueChange={(v) => setForm((s) => ({ ...s, rol: v as UserRole }))}
                    disabled={disabled}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona rol" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="usuario">usuario</SelectItem>
                      <SelectItem value="administrador">administrador</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.rol ? <p className="text-xs text-destructive">{errors.rol}</p> : null}
                </div>
              </div>

              {/* Preferencias */}
              <div className="rounded-md border p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Preferencias</div>
                    <div className="text-xs text-muted-foreground">Datos opcionales</div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Notificaciones</span>
                    <Switch
                      checked={form.notificaciones}
                      onCheckedChange={(v) => setForm((s) => ({ ...s, notificaciones: v }))}
                      disabled={disabled}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Temas favoritos (coma-separado)</label>
                  <Input
                    value={form.temasFavoritosCsv}
                    onChange={(e) => setForm((s) => ({ ...s, temasFavoritosCsv: e.target.value }))}
                    disabled={disabled}
                    placeholder="ahorro, inversión, crédito..."
                  />
                </div>
              </div>

              {/* Perfil */}
              <div className="rounded-md border p-4 space-y-3">
                <div>
                  <div className="font-medium">Perfil</div>
                  <div className="text-xs text-muted-foreground">Datos opcionales</div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Edad</label>
                    <Input
                      value={form.edad}
                      onChange={(e) => setForm((s) => ({ ...s, edad: e.target.value }))}
                      disabled={disabled}
                      placeholder="Ej: 25"
                    />
                    {errors.edad ? <p className="text-xs text-destructive">{errors.edad}</p> : null}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Ingresos mensuales</label>
                    <Input
                      value={form.ingresosMensuales}
                      onChange={(e) => setForm((s) => ({ ...s, ingresosMensuales: e.target.value }))}
                      disabled={disabled}
                      placeholder="Ej: 15000"
                    />
                    {errors.ingresosMensuales ? (
                      <p className="text-xs text-destructive">{errors.ingresosMensuales}</p>
                    ) : null}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Nivel de endeudamiento (0–100)</label>
                    <Input
                      value={form.nivelEndeudamiento}
                      onChange={(e) => setForm((s) => ({ ...s, nivelEndeudamiento: e.target.value }))}
                      disabled={disabled}
                      placeholder="Ej: 35"
                    />
                    {errors.nivelEndeudamiento ? (
                      <p className="text-xs text-destructive">{errors.nivelEndeudamiento}</p>
                    ) : null}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Nivel educativo</label>
                    <Input
                      value={form.nivelEducativo}
                      onChange={(e) => setForm((s) => ({ ...s, nivelEducativo: e.target.value }))}
                      disabled={disabled}
                      placeholder="Ej: Licenciatura"
                    />
                    {errors.nivelEducativo ? (
                      <p className="text-xs text-destructive">{errors.nivelEducativo}</p>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="h-2" />
            </div>
          </ScrollArea>

          {/* Footer fijo */}
          <div className="px-6 pb-6 pt-3 border-t shrink-0">
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cerrar
              </Button>

              {mode !== "view" ? (
                <Button onClick={submit} disabled={busy}>
                  {mode === "create" ? (createMut.isPending ? "Creando..." : "Crear") : updateMut.isPending ? "Guardando..." : "Guardar cambios"}
                </Button>
              ) : null}
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* ===== Confirm delete ===== */}
      <AlertDialog open={Boolean(deleteId)} onOpenChange={(v) => !v && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar usuario?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará el usuario permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMut.isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!deleteId) return;
                if (deleteId === me?._id) {
                  toast.error("No puedes eliminar tu propia cuenta.");
                  setDeleteId(null);
                  return;
                }
                deleteMut.mutate(deleteId);
              }}
              disabled={deleteMut.isPending}
            >
              {deleteMut.isPending ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ===== Modal resultado (éxito / error) ===== */}
      <Dialog open={resultOpen} onOpenChange={setResultOpen}>
        <DialogContent className="max-w-md w-[95vw]">
          <DialogHeader>
            <DialogTitle>{resultTitle}</DialogTitle>
            {resultMessage ? <DialogDescription>{resultMessage}</DialogDescription> : null}
          </DialogHeader>

          <div className="flex justify-end gap-2">
            <Button
              variant={resultType === "error" ? "destructive" : "default"}
              onClick={() => setResultOpen(false)}
            >
              OK
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
