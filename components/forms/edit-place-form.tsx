"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import RoomCombobox from "@/components/location/room-combobox";
import { toast } from "sonner";
import { useUser } from "@/hooks/use-user";
import { useSettings } from "@/hooks/use-settings";
import { usePlaceMarking } from "@/hooks/use-place-marking";
import { placeTypesToOptions } from "@/lib/utils";
import ImageUpload from "@/components/common/image-upload";
import { ErrorMessage } from "@/components/common/error-message";
import { FormFooter } from "@/components/common/form-footer";
import {
  Sheet,
  SheetContent,
  SheetDescription,
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
  const { getPlaceTypes, getDefaultPlaceType } = useSettings();
  const { generateMarking } = usePlaceMarking();
  const [name, setName] = useState(placeName || "");
  const [placeType, setPlaceType] = useState(initialPlaceType || getDefaultPlaceType());
  const [selectedRoomId, setSelectedRoomId] = useState<string>(currentRoomId?.toString() || "");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);


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


      const updateData: { name: string | null; place_type: string; photo_url: string | null } = {
        name: name.trim() || null,
        place_type: placeType,
        photo_url: photoUrl || null,
      };
      
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

  if (isLoading) {
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
                <RoomCombobox
                  selectedRoomId={selectedRoomId}
                  onRoomIdChange={setSelectedRoomId}
                  disabled={isSubmitting}
                  label="Выберите помещение"
                  id={`place-room-${placeId}`}
                  required
                />
                {currentRoomId && !selectedRoomId && (
                  <p className="text-xs text-muted-foreground">
                    Текущее помещение будет удалено. Выберите новое помещение.
                  </p>
                )}
              </div>

              <ImageUpload
                value={photoUrl}
                onChange={setPhotoUrl}
                disabled={isSubmitting}
                label="Фотография места (необязательно)"
              />

          <ErrorMessage message={error || ""} />

          <FormFooter
            isSubmitting={isSubmitting}
            onCancel={() => onOpenChange(false)}
            submitLabel="Сохранить"
          />
        </form>
      </SheetContent>
    </Sheet>
  );
};

export default EditPlaceForm;
