"use client";

import { useState, useEffect } from "react";
import { getContainer, updateContainer } from "@/lib/containers/api";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import { FormGroup } from "@/components/ui/form-group";
import { toast } from "sonner";
import { useUser } from "@/lib/users/context";
import ImageUpload from "@/components/common/image-upload";
import { useEntityTypes } from "@/lib/entities/hooks/use-entity-types";
import { ErrorMessage } from "@/components/common/error-message";
import { FormFooter } from "@/components/common/form-footer";
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
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const EditContainerForm = ({
  containerId,
  containerName,
  containerTypeId: initialContainerTypeId,
  open,
  onOpenChange,
  onSuccess,
}: EditContainerFormProps) => {
  const { isLoading } = useUser();
  const { types: containerTypes } = useEntityTypes("container");
  const [name, setName] = useState(containerName || "");
  const [containerTypeId] = useState(initialContainerTypeId?.toString() || "");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

      // Загружаем текущее фото при открытии формы
      useEffect(() => {
        if (open && containerId) {
          const loadPhoto = async () => {
            try {
              const response = await getContainer(containerId);
              if (response.data?.container?.photo_url) {
                setPhotoUrl(response.data.container.photo_url);
              } else {
                setPhotoUrl(null);
              }
            } catch {
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
      // Обновляем только название и фото (тип контейнера нельзя менять)
      const response = await updateContainer(containerId, {
        name: name.trim() || undefined,
        photo_url: photoUrl || undefined,
      });

      if (response.error) {
        throw new Error(response.error);
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
          <SheetDescription>Измените название контейнера</SheetDescription>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="mt-6">
          <FormGroup>
            <FormField
              label="Название контейнера"
              htmlFor={`container-name-${containerId}`}
            >
              <Input
                id={`container-name-${containerId}`}
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Введите название контейнера"
                disabled={isSubmitting}
              />
            </FormField>

            <FormField
              label="Тип контейнера"
              htmlFor={`container-type-${containerId}`}
              description="Тип контейнера нельзя изменить после создания"
            >
              <div className="rounded-md border bg-muted px-3 py-2">
                {(() => {
                  const selectedType = containerTypes.find(t => t.id.toString() === containerTypeId);
                  return (
                    <p className="text-sm font-medium">
                      {selectedType ? selectedType.name : "Тип не выбран"}
                    </p>
                  );
                })()}
              </div>
            </FormField>

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
              submitLabel="Сохранить"
            />
          </FormGroup>
        </form>
      </SheetContent>
    </Sheet>
  );
};

export default EditContainerForm;
