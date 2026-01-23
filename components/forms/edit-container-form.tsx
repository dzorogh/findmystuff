"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormField } from "@/components/ui/form-field";
import { FormGroup } from "@/components/ui/form-group";
import { toast } from "sonner";
import { useUser } from "@/hooks/use-user";
import ImageUpload from "@/components/common/image-upload";
import { useEntityTypes } from "@/hooks/use-entity-types";
import { useContainerMarking } from "@/hooks/use-container-marking";
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
  markingNumber?: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const EditContainerForm = ({
  containerId,
  containerName,
  containerTypeId: initialContainerTypeId,
  markingNumber,
  open,
  onOpenChange,
  onSuccess,
}: EditContainerFormProps) => {
  const { user, isLoading } = useUser();
  const { types: containerTypes, isLoading: isLoadingTypes } = useEntityTypes("container");
  const { generateMarking } = useContainerMarking();
  const [name, setName] = useState(containerName || "");
  const [containerTypeId, setContainerTypeId] = useState(initialContainerTypeId?.toString() || "");
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


      // Обновляем только название и фото (тип контейнера нельзя менять)
      const { error: updateError } = await supabase
        .from("containers")
        .update({
          name: name.trim() || null,
          photo_url: photoUrl || null,
        })
        .eq("id", containerId);

      if (updateError) {
        throw updateError;
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

            {(() => {
              const selectedType = containerTypes.find(t => t.id.toString() === containerTypeId);
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

            <FormField
              label="Тип контейнера"
              htmlFor={`container-type-${containerId}`}
              description="Тип контейнера нельзя изменить после создания, чтобы сохранить код маркировки"
            >
              <div className="rounded-md border bg-muted px-3 py-2">
                {(() => {
                  const selectedType = containerTypes.find(t => t.id.toString() === containerTypeId);
                  return (
                    <p className="text-sm font-medium">
                      {selectedType ? `${selectedType.code} - ${selectedType.name}` : "Тип не выбран"}
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
