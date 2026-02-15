"use client";

import { useState, useEffect } from "react";
import { createItem } from "@/lib/entities/api";
import { Input } from "@/components/ui/input";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
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
import { EntityTypeSelect } from "@/components/fields/entity-type-select";
import { PriceInput, type PriceValue } from "@/components/fields/price-input";
import { DatePicker } from "@/components/fields/date-picker";

type DestinationType = "room" | "place" | "container";

interface AddItemFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  initialName?: string | null;
  initialPhotoUrl?: string | null;
  initialDestinationType?: DestinationType | null;
  initialDestinationId?: number | null;
}

const AddItemForm = ({
  open,
  onOpenChange,
  onSuccess,
  initialName,
  initialPhotoUrl,
  initialDestinationType,
  initialDestinationId,
}: AddItemFormProps) => {
  const [name, setName] = useState("");
  const [itemTypeId, setItemTypeId] = useState<number | null>(null);
  const [destinationType, setDestinationType] = useState<"container" | "place" | "room" | null>(null);
  const [selectedDestinationId, setSelectedDestinationId] = useState<string>("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [price, setPrice] = useState<PriceValue | null>(null);
  const [currentValue, setCurrentValue] = useState<PriceValue | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [purchaseDate, setPurchaseDate] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setName(initialName?.trim() ?? "");
      setPhotoUrl(initialPhotoUrl ?? null);
      setItemTypeId(null);
      setDestinationType(initialDestinationType ?? null);
      setSelectedDestinationId(initialDestinationId?.toString() ?? "");
      setPrice(null);
      setCurrentValue(null);
      setQuantity(1);
      setPurchaseDate("");
      setError(null);
    }
  }, [open, initialName, initialPhotoUrl, initialDestinationType, initialDestinationId]);

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
        price_amount: price?.amount,
        price_currency: price?.currency,
        current_value_amount: currentValue?.amount,
        current_value_currency: currentValue?.currency,
        quantity: quantity >= 1 ? quantity : 1,
        purchase_date: purchaseDate.trim() || undefined,
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
      setPrice(null);
      setCurrentValue(null);
      setQuantity(1);
      setPurchaseDate("");

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
      <SheetContent side="right" className="h-full flex flex-col overflow-y-auto no-scrollbar">
        <SheetHeader>
          <SheetTitle>Добавить новую вещь</SheetTitle>
          <SheetDescription>
            Введите название вещи и при необходимости укажите местоположение
          </SheetDescription>
        </SheetHeader>
        <form onSubmit={handleSubmit}>
          <div className="px-4">
            <FieldGroup>
              <EntityTypeSelect
                type="item"
                value={itemTypeId}
                onValueChange={value => setItemTypeId(value ? parseInt(value) : null)}
              />

              <Field>
                <FieldLabel htmlFor="item-name">Название вещи</FieldLabel>
                <FieldDescription>
                  Поле необязательное. ID и дата создания заполнятся автоматически.
                </FieldDescription>
                <Input
                  id="item-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Введите название вещи"
                  disabled={isSubmitting}
                />
              </Field>

              <PriceInput
                value={price}
                onChange={setPrice}
                disabled={isSubmitting}
              />

              <PriceInput
                value={currentValue}
                onChange={setCurrentValue}
                id="add-item-current-value"
                label="Текущая оценочная стоимость (необязательно)"
                disabled={isSubmitting}
              />

              <Field>
                <FieldLabel htmlFor="add-item-quantity">Количество</FieldLabel>
                <Input
                  id="add-item-quantity"
                  type="number"
                  min={1}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  disabled={isSubmitting}
                />
              </Field>

              <DatePicker
                value={purchaseDate}
                onChange={setPurchaseDate}
                id="add-item-purchase-date"
                label="Дата покупки"
                placeholder="Выберите дату"
                disabled={isSubmitting}
              />

              <LocationCombobox
                destinationType={destinationType}
                selectedDestinationId={selectedDestinationId}
                onDestinationTypeChange={setDestinationType}
                onDestinationIdChange={setSelectedDestinationId}
                disabled={isSubmitting}
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
          </div>

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
