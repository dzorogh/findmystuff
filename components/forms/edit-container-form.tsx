"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useUser } from "@/hooks/use-user";
import LocationCombobox from "@/components/location/location-combobox";
import ImageUpload from "@/components/common/image-upload";
import { useEntityTypes } from "@/hooks/use-entity-types";
import { useContainerMarking } from "@/hooks/use-container-marking";
import { Combobox } from "@/components/ui/combobox";
import { ErrorMessage } from "@/components/common/error-message";
import { FormFooter } from "@/components/common/form-footer";
import { MarkingDisplay } from "@/components/common/marking-display";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

interface EditContainerFormProps {
  containerId: number;
  containerName: string | null;
  containerTypeId?: number | null;
  markingNumber?: number | null;
  currentLocation?: {
    destination_type: string | null;
    destination_id: number | null;
    destination_name: string | null;
  } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const EditContainerForm = ({
  containerId,
  containerName,
  containerTypeId: initialContainerTypeId,
  markingNumber,
  currentLocation,
  open,
  onOpenChange,
  onSuccess,
}: EditContainerFormProps) => {
  const { user, isLoading } = useUser();
  const { types: containerTypes, isLoading: isLoadingTypes } = useEntityTypes("container");
  const { generateMarking } = useContainerMarking();
  const [name, setName] = useState(containerName || "");
  const [containerTypeId, setContainerTypeId] = useState(initialContainerTypeId?.toString() || "");
  const [destinationType, setDestinationType] = useState<"place" | "container" | "room" | null>(
    currentLocation?.destination_type as "place" | "container" | "room" | null
  );
  const [selectedDestinationId, setSelectedDestinationId] = useState<string>(
    currentLocation?.destination_id?.toString() || ""
  );
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Загружаем текущее фото при открытии формы
  useEffect(() => {
    if (open && containerId) {
      const loadPhoto = async () => {
        const supabase = createClient();
        const { data } = await supabase
          .from("containers")
          .select("photo_url")
          .eq("id", containerId)
          .single();
        
        if (data?.photo_url) {
          setPhotoUrl(data.photo_url);
        } else {
          setPhotoUrl(null);
        }
      };
      loadPhoto();
    }
  }, [open, containerId]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const supabase = createClient();


      // Обновляем название, тип контейнера и фото
      const { error: updateError } = await supabase
        .from("containers")
        .update({
          name: name.trim() || null,
          entity_type_id: containerTypeId ? parseInt(containerTypeId) : null,
          photo_url: photoUrl || null,
        })
        .eq("id", containerId);

      if (updateError) {
        throw updateError;
      }

      // Если указано новое местоположение, создаем transition
      if (destinationType && selectedDestinationId) {
        const { error: transitionError } = await supabase.from("transitions").insert({
          container_id: containerId,
          destination_type: destinationType,
          destination_id: parseInt(selectedDestinationId),
        });

        if (transitionError) {
          console.error("Ошибка при создании transition:", transitionError);
        }
      }

      toast.success("Контейнер успешно обновлен");

      // Небольшая задержка перед закрытием, чтобы toast успел отобразиться
      await new Promise(resolve => setTimeout(resolve, 200));

      if (onSuccess) {
        onSuccess();
      }
      
      onOpenChange(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Произошла ошибка при редактировании контейнера"
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
          <SheetTitle>Редактировать контейнер</SheetTitle>
          <SheetDescription>Измените название или местоположение</SheetDescription>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-6">
          {(() => {
            const selectedType = containerTypes.find(t => t.id.toString() === containerTypeId);
            const typeCode = selectedType?.code;
            return (
              <MarkingDisplay
                typeCode={typeCode}
                markingNumber={markingNumber}
                generateMarking={generateMarking}
              />
            );
          })()}

          <div className="space-y-2">
            <Label htmlFor={`container-type-${containerId}`}>Тип контейнера</Label>
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
          </div>

          <div className="space-y-2">
            <Label htmlFor={`container-name-${containerId}`}>Название контейнера (необязательно)</Label>
            <Input
              id={`container-name-${containerId}`}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Введите название контейнера"
              disabled={isSubmitting}
            />
          </div>

          <LocationCombobox
            destinationType={destinationType}
            selectedDestinationId={selectedDestinationId}
            onDestinationTypeChange={setDestinationType}
            onDestinationIdChange={setSelectedDestinationId}
            disabled={isSubmitting}
            showRoomFirst={true}
            label="Изменить местоположение (необязательно)"
            id={`edit-container-location-${containerId}`}
          />

          <ImageUpload
            value={photoUrl}
            onChange={setPhotoUrl}
            disabled={isSubmitting}
            label="Фотография контейнера (необязательно)"
          />

          {currentLocation && (
            <div className="rounded-md bg-muted p-3">
              <p className="text-xs text-muted-foreground">
                Текущее местоположение: {currentLocation.destination_name || `#${currentLocation.destination_id}`}
              </p>
            </div>
          )}

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

export default EditContainerForm;
