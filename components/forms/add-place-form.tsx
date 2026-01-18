"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { useUser } from "@/hooks/use-user";
import { useRooms } from "@/hooks/use-rooms";
import { useSettings } from "@/hooks/use-settings";
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

interface AddPlaceFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const AddPlaceForm = ({ open, onOpenChange, onSuccess }: AddPlaceFormProps) => {
  const { user, isLoading } = useUser();
  const { rooms } = useRooms();
  const { getPlaceTypes, getDefaultPlaceType } = useSettings();
  const [name, setName] = useState("");
  const [placeType, setPlaceType] = useState(getDefaultPlaceType());
  const [selectedRoomId, setSelectedRoomId] = useState<string>("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const supabase = createClient();
      

      const insertData: { name: string | null; place_type: string; photo_url: string | null } = {
        name: name.trim() || null,
        place_type: placeType,
        photo_url: photoUrl || null,
      };
      
      const { data: newPlace, error: insertError } = await supabase
        .from("places")
        .insert(insertData)
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
      setPlaceType(getDefaultPlaceType());
      setSelectedRoomId("");
      setPhotoUrl(null);
      
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
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Добавить новое место</SheetTitle>
          <SheetDescription>
            Введите название места. Рекомендуемый формат: Ш1П1 (Шкаф 1 Полка 1), С1П1 (Стеллаж 1 Полка 1)
          </SheetDescription>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-6">
          {isLoading ? (
            <div className="py-8 text-center text-muted-foreground">
              Загрузка...
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="place-type">Тип места</Label>
                <Select
                  id="place-type"
                  value={placeType}
                  onChange={(e) => setPlaceType(e.target.value)}
                  disabled={isSubmitting}
                >
                  {placeTypesToOptions(getPlaceTypes()).map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </Select>
                <p className="text-xs text-muted-foreground">
                  Маркировка будет сгенерирована автоматически (например, Ш1)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="place-name">Название места (необязательно)</Label>
                <Input
                  id="place-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Введите название места"
                  disabled={isSubmitting}
                />
                <p className="text-xs text-muted-foreground">
                  Дополнительное описание. ID и дата создания заполнятся автоматически.
                </p>
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
                submitLabel="Добавить место"
                submitIcon={Plus}
              />
            </>
          )}
        </form>
      </SheetContent>
    </Sheet>
  );
};

export default AddPlaceForm;
