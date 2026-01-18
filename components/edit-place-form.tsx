"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useUser } from "@/hooks/use-user";
import { useAdmin } from "@/hooks/use-admin";
import { useRooms } from "@/hooks/use-rooms";
import { useSettings } from "@/hooks/use-settings";
import { usePlaceMarking } from "@/hooks/use-place-marking";
import { placeTypesToOptions } from "@/lib/utils";
import ImageUpload from "@/components/image-upload";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

interface EditPlaceFormProps {
  placeId: number;
  placeName: string | null;
  placeType?: string | null;
  markingNumber?: number | null;
  currentRoomId?: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const EditPlaceForm = ({
  placeId,
  placeName,
  placeType: initialPlaceType,
  markingNumber,
  currentRoomId,
  open,
  onOpenChange,
  onSuccess,
}: EditPlaceFormProps) => {
  const { user, isLoading } = useUser();
  const { isAdmin } = useAdmin();
  const { rooms } = useRooms();
  const { getPlaceTypes, getDefaultPlaceType } = useSettings();
  const { generateMarking } = usePlaceMarking();
  const [name, setName] = useState(placeName || "");
  const [placeType, setPlaceType] = useState(initialPlaceType || getDefaultPlaceType());
  const [selectedRoomId, setSelectedRoomId] = useState<string>(currentRoomId?.toString() || "");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Отслеживаем изменения photoUrl для отладки
  useEffect(() => {
    console.log("photoUrl changed:", photoUrl);
  }, [photoUrl]);

  useEffect(() => {
    if (open) {
      setName(placeName || "");
      setPlaceType(initialPlaceType || getDefaultPlaceType());
      if (currentRoomId) {
        setSelectedRoomId(currentRoomId.toString());
      } else {
        setSelectedRoomId("");
      }
      
      // Загружаем текущее фото только при открытии формы
      const loadPhoto = async () => {
        const supabase = createClient();
        const { data } = await supabase
          .from("places")
          .select("photo_url")
          .eq("id", placeId)
          .single();
        
        if (data?.photo_url) {
          setPhotoUrl(data.photo_url);
        } else {
          setPhotoUrl(null);
        }
      };
      loadPhoto();
    } else {
      // Сбрасываем форму при закрытии
      setName("");
      setPhotoUrl(null);
    }
    // Убираем зависимости, которые могут вызывать повторную загрузку фото
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, placeId]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const supabase = createClient();

      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();

      if (!currentUser || !isAdmin) {
        setError("У вас нет прав для редактирования мест");
        setIsSubmitting(false);
        return;
      }

      const updateData: { name: string | null; place_type: string; photo_url: string | null } = {
        name: name.trim() || null,
        place_type: placeType,
        photo_url: photoUrl || null,
      };
      
      console.log("Updating place with data:", updateData);
      
      const { error: updateError } = await supabase
        .from("places")
        .update(updateData)
        .eq("id", placeId);

      if (updateError) {
        console.error("Update error:", updateError);
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

      toast.success("Место успешно обновлено");

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

  if (isLoading || !user || !isAdmin) {
    return null;
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Редактировать место</SheetTitle>
          <SheetDescription>Измените название места</SheetDescription>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-6">
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

              <ImageUpload
                value={photoUrl}
                onChange={(url) => {
                  console.log("ImageUpload onChange called with:", url);
                  setPhotoUrl(url);
                }}
                disabled={isSubmitting}
                label="Фотография места (необязательно)"
              />

          {error && (
            <div className="rounded-md bg-destructive/10 border border-destructive/20 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          <SheetFooter className="mt-6">
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
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
};

export default EditPlaceForm;
