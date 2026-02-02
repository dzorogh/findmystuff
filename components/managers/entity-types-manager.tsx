"use client";

import { useState, forwardRef, useImperativeHandle } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2, Loader2, Pencil } from "lucide-react";
import { toast } from "sonner";
import {
  createEntityType,
  updateEntityType,
  deleteEntityType,
} from "@/lib/entities/api";
import { useEntityTypes } from "@/lib/entities/hooks/use-entity-types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";

interface EntityTypesManagerProps {
  category: "place" | "container" | "room" | "item";
}

export interface EntityTypesManagerRef {
  openAddDialog: () => void;
}

export const EntityTypesManager = forwardRef<EntityTypesManagerRef, EntityTypesManagerProps>(({
  category,
}, ref) => {
  const { types, isLoading, error, refetch } = useEntityTypes(category);
  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState<number | null>(null);
  const [newName, setName] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleAdd = async () => {
    if (!newName.trim()) {
      toast.error("Заполните название");
      return;
    }

    setIsAdding(true);
    try {
      const response = await createEntityType({
        entity_category: category,
        name: newName.trim(),
      });

      if (response.error) {
        throw new Error(response.error);
      }

      toast.success("Тип успешно добавлен");
      setName("");
      setDialogOpen(false);
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Ошибка добавления типа");
    } finally {
      setIsAdding(false);
    }
  };

  const handleEdit = async (id: number, name: string) => {
    setIsEditing(id);
    setName(name);
    setDialogOpen(true);
  };

  const handleUpdate = async () => {
    if (!isEditing || !newName.trim()) {
      toast.error("Заполните название");
      return;
    }

    try {
      const response = await updateEntityType({
        id: isEditing,
        name: newName.trim(),
      });

      if (response.error) {
        throw new Error(response.error);
      }

      toast.success("Тип успешно обновлен");
      setName("");
      setIsEditing(null);
      setDialogOpen(false);
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Ошибка обновления типа");
    } finally {
      setIsEditing(null);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Вы уверены, что хотите удалить этот тип?")) {
      return;
    }

    try {
      const response = await deleteEntityType(id);

      if (response.error) {
        throw new Error(response.error);
      }

      toast.success("Тип успешно удален");
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Ошибка удаления типа");
    }
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setName("");
    setIsEditing(null);
  };

  useImperativeHandle(ref, () => ({
    openAddDialog: () => {
      setName("");
      setIsEditing(null);
      setDialogOpen(true);
    },
  }));

  return (
    <div className="space-y-4">
      {isLoading && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Название</TableHead>
              <TableHead className="text-right">Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[1, 2, 3].map((i) => (
              <TableRow key={i}>
                <TableCell>
                  <Skeleton className="h-5 w-24" />
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Skeleton className="h-8 w-8 rounded-md" />
                    <Skeleton className="h-8 w-8 rounded-md" />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {error && (
        <div className="text-sm text-destructive">
          Ошибка: {error}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {isEditing ? "Редактировать тип" : "Добавить тип"}
              </DialogTitle>
              <DialogDescription>
                {isEditing
                  ? "Измените название типа"
                  : "Введите название нового типа"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Название</Label>
                <Input
                  id="name"
                  value={newName}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Например: Шкаф, Коробка"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={handleDialogClose}>
                  Отмена
                </Button>
                <Button
                  onClick={isEditing ? handleUpdate : handleAdd}
                  disabled={isAdding || !newName.trim()}
                >
                  {isAdding && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {isEditing ? "Сохранить" : "Добавить"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

      {!isLoading && !error && types.length === 0 ? (
        <p className="text-sm text-muted-foreground">Типы не найдены</p>
      ) : !isLoading && !error && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Название</TableHead>
              <TableHead className="text-right">Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {types.map((type) => (
              <TableRow key={type.id}>
                <TableCell>{type.name}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleEdit(type.id, type.name)}
                      aria-label="Редактировать"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => handleDelete(type.id)}
                      aria-label="Удалить"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
});

EntityTypesManager.displayName = "EntityTypesManager";
