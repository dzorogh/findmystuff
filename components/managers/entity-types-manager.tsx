"use client";

import { useState, forwardRef, useImperativeHandle } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useEntityTypes, type EntityType } from "@/hooks/use-entity-types";
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

interface EntityTypesManagerProps {
  category: "place" | "container";
  title: string;
  description: string;
}

export interface EntityTypesManagerRef {
  openAddDialog: () => void;
}

export const EntityTypesManager = forwardRef<EntityTypesManagerRef, EntityTypesManagerProps>(({
  category,
  title,
  description,
}, ref) => {
  const { types, isLoading, error } = useEntityTypes(category);
  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState<number | null>(null);
  const [newCode, setNewCode] = useState("");
  const [newName, setName] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleAdd = async () => {
    if (!newCode.trim() || !newName.trim()) {
      toast.error("Заполните код и название");
      return;
    }

    setIsAdding(true);
    try {
      const response = await fetch("/api/entity-types", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entity_category: category,
          code: newCode.trim(),
          name: newName.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Ошибка добавления типа");
      }

      toast.success("Тип успешно добавлен");
      setNewCode("");
      setName("");
      setDialogOpen(false);
      window.location.reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Ошибка добавления типа");
    } finally {
      setIsAdding(false);
    }
  };

  const handleEdit = async (id: number, code: string, name: string) => {
    setIsEditing(id);
    setNewCode(code);
    setName(name);
    setDialogOpen(true);
  };

  const handleUpdate = async () => {
    if (!isEditing || !newCode.trim() || !newName.trim()) {
      toast.error("Заполните код и название");
      return;
    }

    try {
      const response = await fetch("/api/entity-types", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: isEditing,
          code: newCode.trim(),
          name: newName.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Ошибка обновления типа");
      }

      toast.success("Тип успешно обновлен");
      setNewCode("");
      setName("");
      setIsEditing(null);
      setDialogOpen(false);
      window.location.reload();
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
      const response = await fetch(`/api/entity-types?id=${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Ошибка удаления типа");
      }

      toast.success("Тип успешно удален");
      window.location.reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Ошибка удаления типа");
    }
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setNewCode("");
    setName("");
    setIsEditing(null);
  };

  useImperativeHandle(ref, () => ({
    openAddDialog: () => {
      setNewCode("");
      setName("");
      setIsEditing(null);
      setDialogOpen(true);
    },
  }));

  return (
    <div className="space-y-4">
      {isLoading && (
        <div className="text-sm text-muted-foreground">Загрузка...</div>
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
                  ? "Измените код и название типа"
                  : "Введите код и название нового типа"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="code">Код</Label>
                <Input
                  id="code"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value)}
                  placeholder="Например: Ш, КОР"
                  disabled={isAdding}
                />
              </div>
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
                  disabled={isAdding || !newCode.trim() || !newName.trim()}
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
              <TableHead>Код</TableHead>
              <TableHead>Название</TableHead>
              <TableHead className="text-right">Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {types.map((type) => (
              <TableRow key={type.id}>
                <TableCell className="font-mono">{type.code}</TableCell>
                <TableCell>{type.name}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(type.id, type.code, type.name)}
                    >
                      Редактировать
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(type.id)}
                      className="text-destructive hover:text-destructive"
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isEditing ? "Редактировать тип" : "Добавить тип"}
            </DialogTitle>
            <DialogDescription>
              {isEditing
                ? "Измените код и название типа"
                : "Введите код и название нового типа"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="code">Код</Label>
              <Input
                id="code"
                value={newCode}
                onChange={(e) => setNewCode(e.target.value)}
                placeholder="Например: Ш, КОР"
                disabled={isAdding}
              />
            </div>
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
                disabled={isAdding || !newCode.trim() || !newName.trim()}
              >
                {isAdding && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {isEditing ? "Сохранить" : "Добавить"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
});

EntityTypesManager.displayName = "EntityTypesManager";
