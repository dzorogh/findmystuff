"use client";

import { useState } from "react";
import { createItem } from "@/lib/entities/api";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import { toast } from "sonner";
import LocationCombobox from "@/components/fields/location-combobox";
import ImageUpload from "@/components/fields/image-upload";
import { ErrorMessage } from "@/components/common/error-message";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetFooter,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { FieldGroup } from "@/components/ui/field";
import { ItemTypeSelect } from "../fields/item-type-select";

interface AddItemFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const AddItemForm = ({ open, onOpenChange, onSuccess }: AddItemFormProps) => {
  const [name, setName] = useState("");
  const [itemTypeId, setItemTypeId] = useState<number | null>(null);
  const [destinationType, setDestinationType] = useState<"container" | "place" | "room" | null>(null);
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

      // Добавляем вещь
      const response = await createItem({
        name: name.trim() || undefined,
        item_type_id: itemTypeId,
        photo_url: photoUrl || undefined,
        destination_type: destinationType || undefined,
        destination_id: selectedDestinationId ? parseInt(selectedDestinationId) : undefined,
      });

      if (response.error) {
        throw new Error(response.error);
      }

      setName("");
      setItemTypeId(null);
      setDestinationType(null);
      setSelectedDestinationId("");
      setPhotoUrl(null);

      toast.success(
        destinationType && selectedDestinationId
          ? "Вещь успешно добавлена и размещена"
          : "Вещь успешно добавлена в склад",
        {
          description: "Вещь добавлена",
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
        err instanceof Error ? err.message : "Произошла ошибка при добавлении"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Добавить новую вещь</SheetTitle>
          <SheetDescription>
            Введите название вещи и при необходимости укажите местоположение
          </SheetDescription>
        </SheetHeader>
        <form onSubmit={handleSubmit}>
          <FieldGroup className="p-4">
            <ItemTypeSelect
              value={itemTypeId}
              onValueChange={value => setItemTypeId(value ? parseInt(value) : null)}
            />

            <FormField
              label="Название вещи"
              htmlFor="item-name"
              description="Поле необязательное. ID и дата создания заполнятся автоматически."
            >
              <Input
                id="item-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Введите название вещи"
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
              id="add-item-location"
            />

            <ImageUpload
              value={photoUrl}
              onChange={setPhotoUrl}
              disabled={isSubmitting}
              label="Фотография вещи (необязательно)"
            />

            <ErrorMessage message={error || ""} />
          </FieldGroup>

          <SheetFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Отмена
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              Добавить вещь
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
};

export default AddItemForm;
