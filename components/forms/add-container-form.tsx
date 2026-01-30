"use client";

import { useState } from "react";
import { apiClient } from "@/lib/api-client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormField } from "@/components/ui/form-field";
import { FormGroup } from "@/components/ui/form-group";
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
import { Skeleton } from "@/components/ui/skeleton";

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

      const response = await apiClient.createContainer({
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
        <form onSubmit={handleSubmit} className="mt-6">
          {isLoading || isLoadingTypes ? (
            <div className="space-y-6 py-4">
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
            <FormGroup>
              <FormField
                label="Тип контейнера"
                htmlFor="container-type"
                description="Маркировка будет сгенерирована автоматически (например, КОР-001)"
              >
                <Combobox
                  options={containerTypes.map((type) => ({
                    value: type.id.toString(),
                    label: type.name,
                  }))}
                  value={containerTypeId}
                  onValueChange={setContainerTypeId}
                  placeholder="Выберите тип контейнера..."
                  searchPlaceholder="Поиск типа контейнера..."
                  emptyText="Типы контейнеров не найдены"
                  disabled={isSubmitting}
                />
              </FormField>

              <FormField
                label="Название контейнера (необязательно)"
                htmlFor="container-name"
                description="Дополнительное описание. ID и дата создания заполнятся автоматически."
              >
                <Input
                  id="container-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Введите название контейнера"
                  disabled={isSubmitting}
                />
              </FormField>

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
            </FormGroup>
          )}
        </form>
      </SheetContent>
    </Sheet>
  );
};

export default AddContainerForm;
