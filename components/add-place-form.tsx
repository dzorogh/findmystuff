"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useUser } from "@/hooks/use-user";
import { useRooms } from "@/hooks/use-rooms";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface AddPlaceFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const AddPlaceForm = ({ open, onOpenChange, onSuccess }: AddPlaceFormProps) => {
  const { user, isLoading } = useUser();
  const { rooms } = useRooms();
  const [name, setName] = useState("");
  const [selectedRoomId, setSelectedRoomId] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const supabase = createClient();
      
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();

      if (!currentUser) {
        setError("Вы не авторизованы");
        setIsSubmitting(false);
        return;
      }

      if (currentUser.email !== "dzorogh@gmail.com") {
        setError("У вас нет прав для добавления мест");
        setIsSubmitting(false);
        return;
      }

      const { data: newPlace, error: insertError } = await supabase
        .from("places")
        .insert({
          name: name.trim() || null,
        })
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      // Помещение обязательно
      if (!selectedRoomId) {
        setError("Необходимо выбрать помещение");
        setIsSubmitting(false);
        return;
      }

      // Создаем transition для помещения
      if (newPlace) {
        const { error: transitionError } = await supabase.from("transitions").insert({
          place_id: newPlace.id,
          destination_type: "room",
          destination_id: parseInt(selectedRoomId),
        });

        if (transitionError) {
          throw transitionError;
        }
      }

      setName("");
      setSelectedRoomId("");
      
      toast.success("Место успешно добавлено и размещено в помещении", {
        description: "Место добавлено",
      });
      
      if (onSuccess) {
        onSuccess();
      }
      
      setTimeout(() => {
        onOpenChange(false);
      }, 100);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Произошла ошибка при добавлении места"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Добавить новое место</DialogTitle>
          <DialogDescription>
            Введите название места. Рекомендуемый формат: Ш1П1 (Шкаф 1 Полка 1), С1П1 (Стеллаж 1 Полка 1)
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {isLoading ? (
            <div className="py-8 text-center text-muted-foreground">
              Загрузка...
            </div>
          ) : !user || user.email !== "dzorogh@gmail.com" ? (
            <div className="py-8 text-center text-destructive">
              У вас нет прав для добавления мест
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="place-name">Название места (маркировка)</Label>
                <Input
                  id="place-name"
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
                  <Label htmlFor="place-room-select">
                    Выберите помещение <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    id="place-room-select"
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
                      Добавление...
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Добавить место
                    </>
                  )}
                </Button>
              </DialogFooter>
            </>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddPlaceForm;
