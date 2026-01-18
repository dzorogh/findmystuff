"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Plus, Loader2, Building2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
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
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [name, setName] = useState("");
  const [selectedRoomId, setSelectedRoomId] = useState<string>("");
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

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (user && user.email === "dzorogh@gmail.com") {
      loadRooms();
    }
  }, [user]);

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

      // Если указано помещение, создаем transition
      if (selectedRoomId && newPlace) {
        const { error: transitionError } = await supabase.from("transitions").insert({
          place_id: newPlace.id,
          destination_type: "room",
          destination_id: parseInt(selectedRoomId),
        });

        if (transitionError) {
          console.error("Ошибка при создании transition:", transitionError);
        }
      }

      setName("");
      setSelectedRoomId("");
      
      toast({
        title: "Место добавлено",
        description: selectedRoomId
          ? "Место успешно добавлено и размещено в помещении"
          : "Место успешно добавлено в склад",
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
            Введите название места для добавления в склад
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
                <Label htmlFor="place-name">Название места</Label>
                <Input
                  id="place-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Введите название места"
                  disabled={isSubmitting}
                />
                <p className="text-xs text-muted-foreground">
                  Поле необязательное. ID и дата создания заполнятся автоматически.
                </p>
              </div>

              {/* Выбор помещения (опционально) */}
              <div className="space-y-3 border-t pt-4">
                <div className="space-y-2">
                  <Label htmlFor="place-room-select">Указать помещение (необязательно)</Label>
                  <Select
                    id="place-room-select"
                    value={selectedRoomId}
                    onChange={(e) => setSelectedRoomId(e.target.value)}
                    disabled={isSubmitting || rooms.length === 0}
                  >
                    <option value="">-- Выберите помещение --</option>
                    {rooms.map((room) => (
                      <option key={room.id} value={room.id}>
                        {room.name || `Помещение #${room.id}`}
                      </option>
                    ))}
                  </Select>
                  {rooms.length === 0 && (
                    <p className="text-xs text-muted-foreground">
                      Помещения не найдены
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
