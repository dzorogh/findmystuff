"use client";

import { useState, useEffect } from "react";
import { getPlace, updatePlace } from "@/lib/places/api";
import { Input } from "@/components/ui/input";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { toast } from "sonner";
import { useUser } from "@/lib/users/context";
import { useEntityTypes } from "@/lib/entities/hooks/use-entity-types";
import ImageUpload from "@/components/fields/image-upload";
import { ErrorMessage } from "@/components/common/error-message";
import { FormFooter } from "@/components/forms/form-footer";
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
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const EditPlaceForm = ({
  placeId,
  placeName,
  placeTypeId: initialPlaceTypeId,
  open,
  onOpenChange,
  onSuccess,
}: EditPlaceFormProps) => {
  const { isLoading } = useUser();
  const { types: placeTypes } = useEntityTypes("place");
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
          const response = await getPlace(placeId);
          if (response.data?.place?.photo_url) {
            setPhotoUrl(response.data.place.photo_url);
          } else {
            setPhotoUrl(null);
          }
        } catch {
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
      const response = await updatePlace(placeId, {
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
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor={`place-name-${placeId}`}>Название места</FieldLabel>
              <Input
                id={`place-name-${placeId}`}
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Например: Ш1П1, С1П2"
                disabled={isSubmitting}
              />
            </Field>

            {(() => {
              const selectedType = placeTypes.find(t => t.id.toString() === placeTypeId);
              return selectedType ? (
                <Field
                >
                  <FieldLabel>Тип места</FieldLabel>
                  <FieldDescription>
                    Тип места нельзя изменить после создания
                  </FieldDescription>
                  <div className="rounded-md border bg-muted px-3 py-2">
                    <p className="text-sm font-medium">
                      {selectedType.name}
                    </p>
                  </div>
                </Field>
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
          </FieldGroup>
        </form>
      </SheetContent>
    </Sheet>
  );
};

export default EditPlaceForm;
