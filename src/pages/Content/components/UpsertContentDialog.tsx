import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import type { UpsertMode, UpsertState } from "@/pages/Content/utils/contentForm";

export function UpsertContentDialog(props: {
  open: boolean;
  onOpenChange: (v: boolean) => void;

  mode: UpsertMode;
  form: UpsertState;
  setForm: (updater: (prev: UpsertState) => UpsertState) => void;

  onSubmit: () => void;
  submitting: boolean;
}) {
  const { open, onOpenChange, mode, form, setForm, onSubmit, submitting } = props;

  const isView = mode === "view";
  const disabled = isView || submitting;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl p-0 overflow-hidden">
        {/* Header fijo */}
        <div className="p-6 pb-0">
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
        </div>

        {/* Body con scroll */}
        <ScrollArea className="max-h-[70vh] px-6 py-4">
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

                    {!isView && form.preguntas.length > 1 && (
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

                        {!isView && p.opciones.length > 2 && (
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

                    {!isView && (
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

              {!isView && (
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
        </ScrollArea>

        {/* Footer fijo */}
        <div className="p-6 pt-0">
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cerrar
            </Button>

            {!isView && (
              <Button onClick={onSubmit} disabled={submitting}>
                {submitting ? "Guardando..." : mode === "create" ? "Crear" : "Guardar cambios"}
              </Button>
            )}
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
