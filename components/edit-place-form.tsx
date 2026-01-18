"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Loader2, Building2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface EditPlaceFormProps {
  placeId: number;
  placeName: string | null;
  currentRoomId?: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const EditPlaceForm = ({
  placeId,
  placeName,
  currentRoomId,
  open,
  onOpenChange,
  onSuccess,
}: EditPlaceFormProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [name, setName] = useState(placeName || "");
  const [selectedRoomId, setSelectedRoomId] = useState<string>(currentRoomId?.toString() || "");
  const [rooms, setRooms] = useState<Array<{ id: number; name: string | null }>>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const supabase = createClient();

    const getUser = async () => {
      try {
        const {
          data: { user: currentUser },
        } = await supabase.auth.getUser();
        setUser(currentUser);
      } catch (error) {
        console.error("Ошибка получения пользователя:", error);
      } finally {
        setIsLoading(false);
      }
    };

    getUser();
  }, []);

  useEffect(() => {
    if (user && user.email === "dzorogh@gmail.com") {
      loadRooms();
    }
  }, [user]);

  useEffect(() => {
    // Обновляем selectedRoomId при изменении currentRoomId или открытии формы
    if (open) {
      if (currentRoomId) {
        setSelectedRoomId(currentRoomId.toString());
      } else {
        // Если форма открыта, но помещения нет - сбрасываем выбор
        setSelectedRoomId("");
      }
    }
  }, [currentRoomId, open]);

  const loadRooms = async () => {
    try {
      const supabase = createClient();
      const { data, error: fetchError } = await supabase
        .from("rooms")
        .select("id, name")
        .is("deleted_at", null)
        .order("name", { ascending: true, nullsFirst: false });

      if (fetchError) throw fetchError;
      setRooms(data || []);
    } catch (err) {
      console.error("Ошибка загрузки помещений:", err);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const supabase = createClient();

      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();

      if (!currentUser || currentUser.email !== "dzorogh@gmail.com") {
        setError("У вас нет прав для редактирования мест");
        setIsSubmitting(false);
        return;
      }

      const { error: updateError } = await supabase
        .from("places")
        .update({
          name: name.trim() || null,
        })
        .eq("id", placeId);

      if (updateError) {
        throw updateError;
      }

      // Помещение обязательно
      if (!selectedRoomId) {
        setError("Необходимо выбрать помещение");
        setIsSubmitting(false);
        return;
      }

      // Создаем transition для помещения (всегда создаем новую запись, даже если помещение не изменилось)
      const { error: transitionError } = await supabase.from("transitions").insert({
        place_id: placeId,
        destination_type: "room",
        destination_id: parseInt(selectedRoomId),
      });

      if (transitionError) {
        throw transitionError;
      }

      toast({
        title: "Место обновлено",
        description: "Место успешно обновлено",
      });

      if (onSuccess) {
        onSuccess();
      }
      
      setTimeout(() => {
        onOpenChange(false);
      }, 100);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Произошла ошибка при редактировании места"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || !user || user.email !== "dzorogh@gmail.com") {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Редактировать место</DialogTitle>
          <DialogDescription>Измените название места</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor={`place-name-${placeId}`}>Название места (маркировка)</Label>
            <Input
              id={`place-name-${placeId}`}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Например: Ш1П1, С1П2"
              disabled={isSubmitting}
            />
            <div className="rounded-md bg-muted p-3 space-y-2">
              <p className="text-xs font-medium text-foreground">Система маркировки:</p>
              <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                <li><strong>Ш1П1</strong> - Шкаф 1, Полка 1</li>
                <li><strong>Ш1П2</strong> - Шкаф 1, Полка 2</li>
                <li><strong>С1П1</strong> - Стеллаж 1, Полка 1</li>
                <li><strong>С1П2</strong> - Стеллаж 1, Полка 2</li>
              </ul>
              <p className="text-xs text-muted-foreground pt-1">
                Формат: [Ш/С][номер][П][номер полки]
              </p>
            </div>
          </div>

              {/* Выбор помещения (обязательно) */}
              <div className="space-y-3 border-t pt-4">
                <div className="space-y-2">
                  <Label htmlFor={`place-room-select-${placeId}`}>
                    Выберите помещение <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    id={`place-room-select-${placeId}`}
                    value={selectedRoomId}
                    onChange={(e) => setSelectedRoomId(e.target.value)}
                    disabled={isSubmitting || rooms.length === 0}
                    required
                  >
                    <option value="">-- Выберите помещение --</option>
                    {rooms.map((room) => (
                      <option key={room.id} value={room.id}>
                        {room.name || `Помещение #${room.id}`}
                      </option>
                    ))}
                  </Select>
                  {rooms.length === 0 && (
                    <p className="text-xs text-destructive">
                      Помещения не найдены. Сначала создайте помещение.
                    </p>
                  )}
                  {currentRoomId && !selectedRoomId && (
                    <p className="text-xs text-muted-foreground">
                      Текущее помещение будет удалено. Выберите новое помещение.
                    </p>
                  )}
                </div>
              </div>

          {error && (
            <div className="rounded-md bg-destructive/10 border border-destructive/20 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Отмена
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Сохранение...
                </>
              ) : (
                "Сохранить"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditPlaceForm;
