"use client";

import { useState, useEffect } from "react";
import { createContainer } from "@/lib/containers/api";
import { Input } from "@/components/ui/input";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { useUser } from "@/lib/users/context";
import LocationCombobox from "@/components/fields/location-combobox";
import ImageUpload from "@/components/fields/image-upload";
import { useEntityTypes } from "@/lib/entities/hooks/use-entity-types";
import { EntityTypeSelect } from "@/components/fields/entity-type-select";
import { ErrorMessage } from "@/components/common/error-message";
import { FormFooter } from "@/components/forms/form-footer";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";

type DestinationType = "room" | "place" | "container";

interface AddContainerFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  initialDestinationType?: DestinationType | null;
  initialDestinationId?: number | null;
}

const AddContainerForm = ({
  open,
  onOpenChange,
  onSuccess,
  initialDestinationType,
  initialDestinationId,
}: AddContainerFormProps) => {
  const { isLoading } = useUser();
  const { isLoading: isLoadingTypes } = useEntityTypes("container");
  const [name, setName] = useState("");
  const [containerTypeId, setContainerTypeId] = useState<string>("");
  const [destinationType, setDestinationType] = useState<"place" | "container" | "room" | null>(null);
  const [selectedDestinationId, setSelectedDestinationId] = useState<string>("");

  useEffect(() => {
    if (open) {
      setDestinationType(initialDestinationType ?? null);
      setSelectedDestinationId(initialDestinationId?.toString() ?? "");
    }
  }, [open, initialDestinationType, initialDestinationId]);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
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

      const response = await createContainer({
        name: name.trim() || undefined,
        entity_type_id: parseInt(containerTypeId),
        photo_url: photoUrl || undefined,
        destination_type: destinationType || undefined,
        destination_id: selectedDestinationId ? parseInt(selectedDestinationId) : undefined,
      });

      if (response.error) {
        throw new Error(response.error);
      }

      setName("");
      setContainerTypeId("");
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
        <form onSubmit={handleSubmit} className="px-4">
          {isLoading || isLoadingTypes ? (
            <div className="flex flex-col gap-2 py-2">
              <div className="space-y-2">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
          ) : (
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="container-type">Тип контейнера</FieldLabel>
                <FieldDescription>
                  Маркировка будет сгенерирована автоматически (например, КОР-001)
                </FieldDescription>
                <EntityTypeSelect
                  type="container"
                  value={containerTypeId ? parseInt(containerTypeId) : null}
                  onValueChange={(v) => setContainerTypeId(v ?? "")}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="container-name">Название контейнера (необязательно)</FieldLabel>
                <FieldDescription>
                  Дополнительное описание. ID и дата создания заполнятся автоматически.
                </FieldDescription>
                <Input
                  id="container-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Введите название контейнера"
                  disabled={isSubmitting}
                />
              </Field>

              <LocationCombobox
                destinationType={destinationType}
                selectedDestinationId={selectedDestinationId}
                onDestinationTypeChange={setDestinationType}
                onDestinationIdChange={setSelectedDestinationId}
                disabled={isSubmitting}
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
            </FieldGroup>
          )}
        </form>
      </SheetContent>
    </Sheet>
  );
};

export default AddContainerForm;
