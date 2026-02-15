"use client";

import { useState, useEffect } from "react";
import { createPlace } from "@/lib/places/api";
import { Input } from "@/components/ui/input";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { useUser } from "@/lib/users/context";
import { useEntityTypes } from "@/lib/entities/hooks/use-entity-types";
import FurnitureCombobox from "@/components/fields/furniture-combobox";
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
import { Skeleton } from "@/components/ui/skeleton";
import { EntityTypeSelect } from "@/components/fields/entity-type-select";

interface AddPlaceFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  initialFurnitureId?: number;
}

const AddPlaceForm = ({ open, onOpenChange, onSuccess, initialFurnitureId }: AddPlaceFormProps) => {
  const { isLoading } = useUser();
  const { types: placeTypes, isLoading: isLoadingTypes } = useEntityTypes("place");
  const [name, setName] = useState("");
  const [placeTypeId, setPlaceTypeId] = useState<string>("");
  const [selectedFurnitureId, setSelectedFurnitureId] = useState<string>("");

  useEffect(() => {
    if (open) {
      setSelectedFurnitureId(initialFurnitureId?.toString() ?? "");
    }
  }, [open, initialFurnitureId]);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (!placeTypeId) {
        setError("Необходимо выбрать тип места");
        setIsSubmitting(false);
        return;
      }

      // Мебель обязательна
      if (!selectedFurnitureId) {
        setError("Необходимо выбрать мебель");
        setIsSubmitting(false);
        return;
      }

      const response = await createPlace({
        name: name.trim() || undefined,
        entity_type_id: parseInt(placeTypeId),
        photo_url: photoUrl || undefined,
        destination_type: "furniture",
        destination_id: parseInt(selectedFurnitureId),
      });

      if (response.error) {
        throw new Error(response.error);
      }

      setName("");
      setPlaceTypeId(placeTypes[0]?.id.toString() || "");
      setSelectedFurnitureId("");
      setPhotoUrl(null);

      toast.success("Место успешно добавлено и размещено в мебели", {
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
        <form onSubmit={handleSubmit} className="px-6">
          {isLoading || isLoadingTypes ? (
            <div className="flex flex-col gap-2 py-2">
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
          ) : (
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="place-name">Название места</FieldLabel>
                <Input
                  id="place-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Введите название места"
                  disabled={isSubmitting}
                />
              </Field>

              <EntityTypeSelect
                type="place"
                value={placeTypeId ? parseInt(placeTypeId) : null}
                onValueChange={(v) => setPlaceTypeId(v ?? "")}
              />

              <FurnitureCombobox
                selectedFurnitureId={selectedFurnitureId}
                onFurnitureIdChange={setSelectedFurnitureId}
                disabled={isSubmitting}
                label="Выберите мебель"
                id="place-furniture-select"
                required
              />

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
            </FieldGroup>
          )}
        </form>
      </SheetContent>
    </Sheet>
  );
};

export default AddPlaceForm;
