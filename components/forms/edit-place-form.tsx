"use client";

import { useState, useEffect } from "react";
import { apiClient } from "@/lib/api-client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormField } from "@/components/ui/form-field";
import { FormGroup } from "@/components/ui/form-group";
import { toast } from "sonner";
import { useUser } from "@/hooks/use-user";
import { useEntityTypes } from "@/hooks/use-entity-types";
import { usePlaceMarking } from "@/hooks/use-place-marking";
import { Combobox } from "@/components/ui/combobox";
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
  placeTypeId?: number | null;
  markingNumber?: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const EditPlaceForm = ({
  placeId,
  placeName,
  placeTypeId: initialPlaceTypeId,
  markingNumber,
  open,
  onOpenChange,
  onSuccess,
}: EditPlaceFormProps) => {
  const { user, isLoading } = useUser();
  const { types: placeTypes, isLoading: isLoadingTypes } = useEntityTypes("place");
  const { generateMarking } = usePlaceMarking();
  const [name, setName] = useState(placeName || "");
  const [placeTypeId, setPlaceTypeId] = useState(initialPlaceTypeId?.toString() || "");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);


  useEffect(() => {
    if (open) {
      setName(placeName || "");
      setPlaceTypeId(initialPlaceTypeId?.toString() || placeTypes[0]?.id.toString() || "");
      
      // Загружаем текущее фото только при открытии формы
      const loadPhoto = async () => {
        try {
          const response = await apiClient.getPlace(placeId);
          if (response.data?.photo_url) {
            setPhotoUrl(response.data.photo_url);
          } else {
            setPhotoUrl(null);
          }
        } catch (error) {
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
      if (!initialPlaceTypeId) {
        setError("Тип места не определен");
        setIsSubmitting(false);
        return;
      }

      // Обновляем только название и фото (тип места нельзя менять)
      const response = await apiClient.updatePlace(placeId, {
        name: name.trim() || undefined,
        photo_url: photoUrl || undefined,
      });

      if (response.error) {
        throw new Error(response.error);
      }

      // Местоположение не изменяется через форму редактирования

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
        <form onSubmit={handleSubmit} className="mt-6">
          <FormGroup>
            <FormField
              label="Название места"
              htmlFor={`place-name-${placeId}`}
            >
              <Input
                id={`place-name-${placeId}`}
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Например: Ш1П1, С1П2"
                disabled={isSubmitting}
              />
            </FormField>

            {(() => {
              const selectedType = placeTypes.find(t => t.id.toString() === placeTypeId);
              const typeCode = selectedType?.code;
              const marking = typeCode && markingNumber !== null && markingNumber !== undefined
                ? generateMarking(typeCode, markingNumber)
                : null;
              
              return marking ? (
                <FormField label="Маркировка">
                  <div className="rounded-md border bg-muted px-3 py-2">
                    <p className="text-sm font-medium">{marking}</p>
                  </div>
                </FormField>
              ) : null;
            })()}

            {(() => {
              const selectedType = placeTypes.find(t => t.id.toString() === placeTypeId);
              return selectedType ? (
                <FormField
                  label="Тип места"
                  description="Тип места нельзя изменить после создания, чтобы сохранить код маркировки"
                >
                  <div className="rounded-md border bg-muted px-3 py-2">
                    <p className="text-sm font-medium">
                      {selectedType.code} - {selectedType.name}
                    </p>
                  </div>
                </FormField>
              ) : null;
            })()}

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
          </FormGroup>
        </form>
      </SheetContent>
    </Sheet>
  );
};

export default EditPlaceForm;
