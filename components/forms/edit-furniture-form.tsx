"use client";

import { useState, useEffect } from "react";
import { updateFurniture } from "@/lib/furniture/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import ImageUpload from "@/components/fields/image-upload";
import { ErrorMessage } from "@/components/common/error-message";
import RoomCombobox from "@/components/fields/room-combobox";
import { EntityTypeSelect } from "@/components/fields/entity-type-select";
import { PriceInput, type PriceValue } from "@/components/fields/price-input";
import { DatePicker } from "@/components/fields/date-picker";
import type { Furniture } from "@/types/entity";

interface EditFurnitureFormProps {
  furniture: Furniture;
  onSuccess?: () => void;
}

export function EditFurnitureForm({ furniture, onSuccess }: EditFurnitureFormProps) {
  const [name, setName] = useState(furniture.name ?? "");
  const [roomId, setRoomId] = useState(furniture.room_id?.toString() ?? "");
  const [furnitureTypeId, setFurnitureTypeId] = useState(
    furniture.furniture_type_id?.toString() ?? ""
  );
  const [photoUrl, setPhotoUrl] = useState<string | null>(furniture.photo_url ?? null);
  const [price, setPrice] = useState<PriceValue | null>(
    furniture.price?.amount != null && furniture.price?.currency
      ? { amount: furniture.price.amount, currency: furniture.price.currency }
      : null
  );
  const [currentValue, setCurrentValue] = useState<PriceValue | null>(
    furniture.currentValue?.amount != null && furniture.currentValue?.currency
      ? { amount: furniture.currentValue.amount, currency: furniture.currentValue.currency }
      : null
  );
  const [purchaseDate, setPurchaseDate] = useState<string>(furniture.purchaseDate ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setName(furniture.name ?? "");
    setRoomId(furniture.room_id?.toString() ?? "");
    setFurnitureTypeId(furniture.furniture_type_id?.toString() ?? "");
    setPhotoUrl(furniture.photo_url ?? null);
    setPrice(
      furniture.price?.amount != null && furniture.price?.currency
        ? { amount: furniture.price.amount, currency: furniture.price.currency }
        : null
    );
    setCurrentValue(
      furniture.currentValue?.amount != null && furniture.currentValue?.currency
        ? { amount: furniture.currentValue.amount, currency: furniture.currentValue.currency }
        : null
    );
    setPurchaseDate(furniture.purchaseDate ?? "");
  }, [furniture]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const res = await updateFurniture(furniture.id, {
        name: name.trim() || undefined,
        room_id: roomId ? parseInt(roomId) : undefined,
        furniture_type_id: furnitureTypeId ? parseInt(furnitureTypeId) : null,
        photo_url: photoUrl ?? null,
        price_amount: price?.amount ?? null,
        price_currency: price?.currency ?? null,
        current_value_amount: currentValue?.amount ?? null,
        current_value_currency: currentValue?.currency ?? null,
        purchase_date: purchaseDate.trim() || null,
      });
      if (res.error) throw new Error(res.error);
      toast.success("Мебель успешно обновлена");
      onSuccess?.();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Произошла ошибка при сохранении"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor={`furniture-name-${furniture.id}`}>Название мебели</FieldLabel>
          <Input
            id={`furniture-name-${furniture.id}`}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Введите название мебели"
            disabled={isSubmitting}
          />
        </Field>

        <RoomCombobox
          selectedRoomId={roomId}
          onRoomIdChange={setRoomId}
          disabled={isSubmitting}
          label="Помещение"
          id={`furniture-room-${furniture.id}`}
          required
        />

        <EntityTypeSelect
          type="furniture"
          value={furnitureTypeId ? parseInt(furnitureTypeId) : null}
          onValueChange={(v) => setFurnitureTypeId(v ?? "")}
        />

        <PriceInput
          value={price}
          onChange={setPrice}
          disabled={isSubmitting}
          id={`furniture-price-${furniture.id}`}
          label="Стоимость покупки (необязательно)"
        />

        <PriceInput
          value={currentValue}
          onChange={setCurrentValue}
          id={`furniture-current-value-${furniture.id}`}
          label="Текущая оценочная стоимость (необязательно)"
          disabled={isSubmitting}
        />

        <DatePicker
          value={purchaseDate}
          onChange={setPurchaseDate}
          id={`furniture-purchase-date-${furniture.id}`}
          label="Дата покупки"
          placeholder="Выберите дату"
          disabled={isSubmitting}
        />

        <ImageUpload
          value={photoUrl}
          onChange={setPhotoUrl}
          disabled={isSubmitting}
          label="Фотография мебели (необязательно)"
        />

        <ErrorMessage message={error ?? ""} />

        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Сохранение...
              </>
            ) : (
              "Сохранить"
            )}
          </Button>
        </div>
      </FieldGroup>
    </form>
  );
}
