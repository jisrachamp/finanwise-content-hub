import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { Plus, Search, Filter, Eye, Edit, Trash2, MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { toast } from "sonner";
import { apiFetch } from "@/api/http";

type ContentItem = {
  _id?: string;          // típico mongo
  id?: string | number;  // por si tu backend usa otro
  title: string;
  category: string;
  author: string;
  status: "Publicado" | "En Revisión" | "Borrador" | string;
  date: string; // o updatedAt/createdAt; aquí lo mostramos tal cual
};

const statusColors: Record<string, string> = {
  "Publicado": "bg-success text-white",
  "En Revisión": "bg-warning text-white",
  "Borrador": "bg-muted text-muted-foreground",
};

async function fetchContentList(): Promise<ContentItem[]> {
  // 👇 cambia la ruta si tu backend usa otra
  return apiFetch<ContentItem[]>("/api/content", { method: "GET" });
}

const Content = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const {
    data: contentItems = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["content"],
    queryFn: fetchContentList,
  });

  const handleAction = (action: string, id: string | number) => {
    toast.success(`${action} content #${id}`);
  };

  const filteredContent = useMemo(() => {
    return contentItems.filter((item) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        item.title.toLowerCase().includes(q) ||
        item.author.toLowerCase().includes(q);

      const matchesStatus =
        statusFilter === "all" || item.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [contentItems, searchQuery, statusFilter]);

  // Si falla, te aviso y te dejo botón de reintento
  if (isError) {
    // evita spamear toast en re-renders
    // (solo dispara una vez cuando entró en error)
    // Si prefieres, quítalo y maneja con UI.
    // eslint-disable-next-line react-hooks/rules-of-hooks
    // @ts-ignore
    if (!(window as any).__content_error_toast_shown) {
      (window as any).__content_error_toast_shown = true;
      toast.error("No se pudo cargar el contenido. Revisa tu API/BaseURL o el token.");
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-foreground">Biblioteca de Contenido</h1>
          <p className="text-muted-foreground mt-1">Gestionar materiales educativos y artículos</p>
        </div>
        <Button className="gap-2" onClick={() => toast.info("Crear contenido: pendiente de implementar")}>
          <Plus className="h-4 w-4" />
          Nuevo Contenido
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex-1 w-full sm:w-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por título o autor..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="flex gap-2 w-full sm:w-auto">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filtrar por estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los Estados</SelectItem>
                  <SelectItem value="Publicado">Publicado</SelectItem>
                  <SelectItem value="En Revisión">En Revisión</SelectItem>
                  <SelectItem value="Borrador">Borrador</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" onClick={() => refetch()} disabled={isLoading}>
                {isLoading ? "Cargando..." : "Recargar"}
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
                  <TableHead>Categoría</TableHead>
                  <TableHead>Autor</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Última Modificación</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      Cargando contenidos...
                    </TableCell>
                  </TableRow>
                ) : filteredContent.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      No hay resultados con esos filtros.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredContent.map((item, idx) => {
                    const rowId = (item._id ?? item.id ?? idx) as string | number;
                    const badgeClass = statusColors[item.status] ?? "bg-muted text-muted-foreground";

                    return (
                      <TableRow key={String(rowId)}>
                        <TableCell className="font-medium">{item.title}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{item.category}</Badge>
                        </TableCell>
                        <TableCell>{item.author}</TableCell>
                        <TableCell>
                          <Badge className={badgeClass}>{item.status}</Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{item.date}</TableCell>
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
                              <DropdownMenuItem onClick={() => handleAction("Ver", rowId)}>
                                <Eye className="mr-2 h-4 w-4" />
                                Ver
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleAction("Editar", rowId)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => handleAction("Eliminar", rowId)}
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
    </div>
  );
};

export default Content;
