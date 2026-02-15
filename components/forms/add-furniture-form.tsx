"use client";

import { useState } from "react";
import { createFurniture } from "@/lib/furniture/api";
import { Input } from "@/components/ui/input";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { useUser } from "@/lib/users/context";
import { useEntityTypes } from "@/lib/entities/hooks/use-entity-types";
import RoomCombobox from "@/components/fields/room-combobox";
import ImageUpload from "@/components/fields/image-upload";
import { PriceInput, type PriceValue } from "@/components/fields/price-input";
import { DatePicker } from "@/components/fields/date-picker";
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
import { EntityTypeSelect } from "../fields/entity-type-select";

interface AddFurnitureFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const AddFurnitureForm = ({ open, onOpenChange, onSuccess }: AddFurnitureFormProps) => {
  const { isLoading } = useUser();
  const { types: _furnitureTypes, isLoading: isLoadingTypes } = useEntityTypes("furniture");
  const [name, setName] = useState("");
  const [roomId, setRoomId] = useState<string>("");
  const [furnitureTypeId, setFurnitureTypeId] = useState<string>("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [price, setPrice] = useState<PriceValue | null>(null);
  const [currentValue, setCurrentValue] = useState<PriceValue | null>(null);
  const [purchaseDate, setPurchaseDate] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (!roomId) {
        setError("Необходимо выбрать помещение");
        setIsSubmitting(false);
        return;
      }

      const response = await createFurniture({
        name: name.trim() || undefined,
        room_id: parseInt(roomId),
        furniture_type_id: furnitureTypeId ? parseInt(furnitureTypeId) : null,
        photo_url: photoUrl || undefined,
        price_amount: price?.amount ?? null,
        price_currency: price?.currency ?? null,
        current_value_amount: currentValue?.amount ?? null,
        current_value_currency: currentValue?.currency ?? null,
        purchase_date: purchaseDate.trim() || undefined,
      });

      if (response.error) {
        throw new Error(response.error);
      }

      setName("");
      setRoomId("");
      setFurnitureTypeId("");
      setPhotoUrl(null);
      setPrice(null);
      setCurrentValue(null);
      setPurchaseDate("");

      toast.success("Мебель успешно добавлена", {
        description: "Мебель добавлена",
      });

      if (onSuccess) {
        onSuccess();
      }

      setTimeout(() => onOpenChange(false), 100);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Произошла ошибка при добавлении мебели"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Добавить мебель</SheetTitle>
          <SheetDescription>
            Введите название мебели и выберите помещение
          </SheetDescription>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="px-6">
          {isLoading || isLoadingTypes ? (
            <div className="flex flex-col gap-2 py-2">
              <div className="space-y-2">
                <Skeleton className="h-4 w-28" />
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
                <FieldLabel htmlFor="furniture-name">Название мебели</FieldLabel>
                <FieldDescription>
                  Поле необязательное. Например: Шкаф 1, Стеллаж, Полка
                </FieldDescription>
                <Input
                  id="furniture-name"
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
                id="furniture-room-select"
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
                label="Стоимость покупки (необязательно)"
              />

              <PriceInput
                value={currentValue}
                onChange={setCurrentValue}
                id="add-furniture-current-value"
                label="Текущая оценочная стоимость (необязательно)"
                disabled={isSubmitting}
              />

              <DatePicker
                value={purchaseDate}
                onChange={setPurchaseDate}
                id="add-furniture-purchase-date"
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

              <ErrorMessage message={error || ""} />

              <FormFooter
                isSubmitting={isSubmitting}
                onCancel={() => onOpenChange(false)}
                submitLabel="Добавить мебель"
                submitIcon={Plus}
              />
            </FieldGroup>
          )}
        </form>
      </SheetContent>
    </Sheet>
  );
};

export default AddFurnitureForm;
