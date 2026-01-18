"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { useUser } from "@/hooks/use-user";
import { useSettings } from "@/hooks/use-settings";
import { placeTypesToOptions } from "@/lib/utils";
import { Combobox } from "@/components/ui/combobox";
import RoomCombobox from "@/components/location/room-combobox";
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
                <Combobox
                  options={placeTypesToOptions(getPlaceTypes())}
                  value={placeType}
                  onValueChange={setPlaceType}
                  placeholder="Выберите тип места..."
                  searchPlaceholder="Поиск типа места..."
                  emptyText="Типы мест не найдены"
                  disabled={isSubmitting}
                />
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
                <RoomCombobox
                  selectedRoomId={selectedRoomId}
                  onRoomIdChange={setSelectedRoomId}
                  disabled={isSubmitting}
                  label="Выберите помещение"
                  id="place-room-select"
                  required
                />
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
