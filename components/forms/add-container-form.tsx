"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { useUser } from "@/hooks/use-user";
import LocationCombobox from "@/components/location/location-combobox";
import ImageUpload from "@/components/common/image-upload";
import { useEntityTypes } from "@/hooks/use-entity-types";
import { Combobox } from "@/components/ui/combobox";
import { ErrorMessage } from "@/components/common/error-message";
import { FormFooter } from "@/components/common/form-footer";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

interface AddContainerFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const AddContainerForm = ({ open, onOpenChange, onSuccess }: AddContainerFormProps) => {
  const { user, isLoading } = useUser();
  const { types: containerTypes, isLoading: isLoadingTypes } = useEntityTypes("container");
  const [name, setName] = useState("");
  const [containerTypeId, setContainerTypeId] = useState<string>("");
  const [destinationType, setDestinationType] = useState<"place" | "container" | "room" | null>(null);
  const [selectedDestinationId, setSelectedDestinationId] = useState<string>("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const supabase = createClient();
      

      // Проверяем, что если выбран тип назначения, то и ID тоже выбран
      if (destinationType && !selectedDestinationId) {
        setError("Выберите конкретное место или контейнер");
        setIsSubmitting(false);
        return;
      }

      if (!containerTypeId) {
        setError("Необходимо выбрать тип контейнера");
        setIsSubmitting(false);
        return;
      }

      // Добавляем контейнер
      const { data: newContainer, error: insertError } = await supabase
        .from("containers")
        .insert({
          name: name.trim() || null,
          entity_type_id: parseInt(containerTypeId),
          photo_url: photoUrl || null,
        })
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      // Если указано местоположение, создаем transition для контейнера
      if (destinationType && selectedDestinationId && newContainer) {
        const { error: transitionError } = await supabase
          .from("transitions")
          .insert({
            container_id: newContainer.id,
            destination_type: destinationType,
            destination_id: parseInt(selectedDestinationId),
          });

        if (transitionError) {
          console.error("Ошибка при создании transition:", transitionError);
          // Не прерываем процесс, контейнер уже добавлен
        }
      }

      setName("");
      setContainerTypeId(containerTypes[0]?.id.toString() || "");
      setDestinationType(null);
      setSelectedDestinationId("");
      setPhotoUrl(null);
      
      toast.success(
        destinationType && selectedDestinationId
          ? "Контейнер успешно добавлен и размещен"
          : "Контейнер успешно добавлен в склад",
        {
          description: "Контейнер добавлен",
        }
      );
      
      if (onSuccess) {
        onSuccess();
      }
      
      setTimeout(() => {
        onOpenChange(false);
      }, 100);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Произошла ошибка при добавлении контейнера"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Добавить новый контейнер</SheetTitle>
          <SheetDescription>
            Введите название контейнера и при необходимости укажите местоположение
          </SheetDescription>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-6">
          {isLoading || isLoadingTypes ? (
            <div className="py-8 text-center text-muted-foreground">
              Загрузка...
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="container-type">Тип контейнера</Label>
                <Combobox
                  options={containerTypes.map((type) => ({
                    value: type.id.toString(),
                    label: `${type.code} - ${type.name}`,
                  }))}
                  value={containerTypeId}
                  onValueChange={setContainerTypeId}
                  placeholder="Выберите тип контейнера..."
                  searchPlaceholder="Поиск типа контейнера..."
                  emptyText="Типы контейнеров не найдены"
                  disabled={isSubmitting}
                />
                <p className="text-xs text-muted-foreground">
                  Маркировка будет сгенерирована автоматически (например, КОР-001)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="container-name">Название контейнера (необязательно)</Label>
                <Input
                  id="container-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Введите название контейнера"
                  disabled={isSubmitting}
                />
                <p className="text-xs text-muted-foreground">
                  Дополнительное описание. ID и дата создания заполнятся автоматически.
                </p>
              </div>

      <LocationCombobox
        destinationType={destinationType}
        selectedDestinationId={selectedDestinationId}
        onDestinationTypeChange={setDestinationType}
        onDestinationIdChange={setSelectedDestinationId}
        disabled={isSubmitting}
        showRoomFirst={true}
        label="Указать местоположение (необязательно)"
        id="add-container-location"
              />

              <ImageUpload
                value={photoUrl}
                onChange={setPhotoUrl}
                disabled={isSubmitting}
                label="Фотография контейнера (необязательно)"
              />

              <ErrorMessage message={error || ""} />

              <FormFooter
                isSubmitting={isSubmitting}
                onCancel={() => onOpenChange(false)}
                submitLabel="Добавить контейнер"
                submitIcon={Plus}
              />
            </>
          )}
        </form>
      </SheetContent>
    </Sheet>
  );
};

export default AddContainerForm;
