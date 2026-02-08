"use client";

import { useState, useEffect } from "react";
import { getItem, updateItem } from "@/lib/entities/api";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import { FormGroup } from "@/components/ui/form-group";
import { Combobox } from "@/components/ui/combobox";
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

interface EditItemFormProps {
  itemId: number;
  itemName: string | null;
  itemTypeId?: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const EditItemForm = ({
  itemId,
  itemName,
  itemTypeId: initialItemTypeId,
  open,
  onOpenChange,
  onSuccess,
}: EditItemFormProps) => {
  const { isLoading } = useUser();
  const { types: itemTypes } = useEntityTypes("item");
  const [name, setName] = useState(itemName || "");
  const [itemTypeId, setItemTypeId] = useState<string>(initialItemTypeId?.toString() || "");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && itemId) {
      setName(itemName || "");
      setItemTypeId(initialItemTypeId?.toString() || "");
      const loadItem = async () => {
        try {
          const response = await getItem(itemId);
          const item = response.data?.item;
          if (item) {
            setPhotoUrl(item.photo_url || null);
            if (item.item_type_id != null) setItemTypeId(item.item_type_id.toString());
          }
        } catch {
          setPhotoUrl(null);
        }
      };
      loadItem();
    }
  }, [open, itemId, itemName, initialItemTypeId]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await updateItem(itemId, {
        name: name.trim() || undefined,
        item_type_id: itemTypeId ? parseInt(itemTypeId) : null,
        photo_url: photoUrl || undefined,
      });

      if (response.error) {
        throw new Error(response.error);
      }

      // Сначала показываем toast
      toast.success("Вещь успешно обновлена");

      // Небольшая задержка перед закрытием, чтобы toast успел отобразиться
      await new Promise(resolve => setTimeout(resolve, 200));

      if (onSuccess) {
        onSuccess();
      }

      onOpenChange(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Произошла ошибка при редактировании вещи"
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
          <SheetTitle>Редактировать вещь</SheetTitle>
          <SheetDescription>Измените название вещи</SheetDescription>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="mt-6">
          <FormGroup>
            <FormField
              label="Тип вещи (необязательно)"
              htmlFor={`item-type-${itemId}`}
            >
              <Combobox
                items={[
                  { value: "", label: "Не указан" },
                  ...itemTypes.map((type) => ({
                    value: type.id.toString(),
                    label: type.name,
                  })),
                ]}
                value={itemTypeId}
                onValueChange={(v) => setItemTypeId(v ?? "")}
                disabled={isSubmitting}
              />
            </FormField>

            <FormField
              label="Название вещи"
              htmlFor={`item-name-${itemId}`}
            >
              <Input
                id={`item-name-${itemId}`}
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Введите название вещи"
                disabled={isSubmitting}
              />
            </FormField>

            <ImageUpload
              value={photoUrl}
              onChange={setPhotoUrl}
              disabled={isSubmitting}
              label="Фотография вещи (необязательно)"
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

export default EditItemForm;
