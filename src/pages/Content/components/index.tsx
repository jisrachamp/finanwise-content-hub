import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus } from "lucide-react";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import type { Capsule, CapsuleUpsertPayload } from "@/api/Content/types";
import { adminCreateContent, adminDeleteContent, adminUpdateContent, educationGetById } from "@/api/Content/Content.api";

import { useContentQuery } from "@/pages/Content/hooks/useContentQuery";
import { ContentFilters } from "@/pages/Content/components/ContentFilters";
import { ContentTable } from "@/pages/Content/components/ContentTable";
import { UpsertContentDialog } from "@/pages/Content/components/UpsertContentDialog";
import { DeleteContentDialog } from "@/pages/Content/components/DeleteContentDialog";

import { makeEmptyState, fromCapsule, toPayload, type UpsertMode, type UpsertState } from "@/pages/Content/utils/contentForm";

export default function ContentPage() {
  const qc = useQueryClient();

  // filtros
  const [text, setText] = useState("");
  const [idFilter, setIdFilter] = useState("");
  const [nivel, setNivel] = useState("all");
  const [tipo, setTipo] = useState("all");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // modal
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<UpsertMode>("create");
  const [form, setFormState] = useState<UpsertState>(() => makeEmptyState());

  const setForm = (updater: (prev: UpsertState) => UpsertState) => {
    setFormState((prev) => updater(prev));
  };

  // delete confirm
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading, isFetching, refetch } = useContentQuery({ text, idFilter, page, limit });

  const rows: Capsule[] = data?.data ?? [];
  const meta = data?.meta ?? null;

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
    setFormState(makeEmptyState());
    setOpen(true);
  };

  const openView = async (id: string) => {
    try {
      const item = await educationGetById(id);
      setMode("view");
      setFormState(fromCapsule(item));
      setOpen(true);
    } catch (e: any) {
      toast.error(e?.message ?? "No se pudo cargar el contenido");
    }
  };

  const openEdit = async (id: string) => {
    try {
      const item = await educationGetById(id);
      setMode("edit");
      setFormState(fromCapsule(item));
      setOpen(true);
    } catch (e: any) {
      toast.error(e?.message ?? "No se pudo cargar el contenido");
    }
  };

  const submitUpsert = () => {
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

  const submitting = createMut.isPending || updateMut.isPending;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-foreground">Biblioteca de Contenido</h1>
          <p className="text-muted-foreground mt-1">Gestionar cápsulas educativas</p>
        </div>

        <Button className="gap-2" onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Nuevo Contenido
        </Button>
      </div>

      <Card>
        <CardHeader>
          <ContentFilters
            text={text}
            setText={setText}
            idFilter={idFilter}
            setIdFilter={setIdFilter}
            tipo={tipo}
            setTipo={setTipo}
            nivel={nivel}
            setNivel={setNivel}
            page={page}
            setPage={setPage}
            limit={limit}
            setLimit={setLimit}
            meta={meta}
            isFetching={isFetching}
            onRefresh={() => refetch()}
          />
        </CardHeader>

        <CardContent>
          <ContentTable
            rows={filteredRows}
            isLoading={isLoading}
            onView={openView}
            onEdit={openEdit}
            onDelete={(id) => setDeleteId(id)}
          />
        </CardContent>
      </Card>

      <UpsertContentDialog
        open={open}
        onOpenChange={setOpen}
        mode={mode}
        form={form}
        setForm={setForm}
        onSubmit={submitUpsert}
        submitting={submitting}
      />

      <DeleteContentDialog
        open={Boolean(deleteId)}
        onOpenChange={(v) => !v && setDeleteId(null)}
        onConfirm={() => deleteId && deleteMut.mutate(deleteId)}
        loading={deleteMut.isPending}
      />
    </div>
  );
}
