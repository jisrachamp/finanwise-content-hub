import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MoreHorizontal, Eye, Edit, Trash2 } from "lucide-react";

import type { Capsule } from "@/api/Content/types";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function ContentTable(props: {
  rows: Capsule[];
  isLoading: boolean;
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const { rows, isLoading, onView, onEdit, onDelete } = props;

  return (
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
          ) : rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                No hay resultados con esos filtros.
              </TableCell>
            </TableRow>
          ) : (
            rows.map((item) => (
              <TableRow key={item._id}>
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

                      <DropdownMenuItem onClick={() => onView(item._id)}>
                        <Eye className="mr-2 h-4 w-4" />
                        Ver
                      </DropdownMenuItem>

                      <DropdownMenuItem onClick={() => onEdit(item._id)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Editar
                      </DropdownMenuItem>

                      <DropdownMenuSeparator />

                      <DropdownMenuItem className="text-destructive" onClick={() => onDelete(item._id)}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Eliminar
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
  );
}
