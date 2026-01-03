import { Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function ContentFilters(props: {
  text: string;
  setText: (v: string) => void;

  idFilter: string;
  setIdFilter: (v: string) => void;

  tipo: string;
  setTipo: (v: string) => void;

  nivel: string;
  setNivel: (v: string) => void;

  page: number;
  setPage: (v: number | ((p: number) => number)) => void;

  limit: number;
  setLimit: (v: number) => void;

  meta?: { total: number; page: number; limit: number; pages: number } | null;

  isFetching: boolean;
  onRefresh: () => void;
}) {
  const {
    text,
    setText,
    idFilter,
    setIdFilter,
    tipo,
    setTipo,
    nivel,
    setNivel,
    page,
    setPage,
    limit,
    setLimit,
    meta,
    isFetching,
    onRefresh,
  } = props;

  const idActive = Boolean(idFilter.trim());

  return (
    <div className="space-y-4">
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

          <Button variant="outline" onClick={onRefresh} disabled={isFetching}>
            {isFetching ? "Actualizando..." : "Actualizar"}
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between">
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
            disabled={page <= 1 || idActive || isFetching}
          >
            Anterior
          </Button>
          <Button
            variant="outline"
            onClick={() => setPage((p) => p + 1)}
            disabled={idActive || isFetching || (meta ? page >= meta.pages : true)}
          >
            Siguiente
          </Button>
        </div>
      </div>
    </div>
  );
}
