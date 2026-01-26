"use client";

import { useState, useEffect } from "react";
import { apiClient } from "@/lib/api-client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormField } from "@/components/ui/form-field";
import { FormGroup } from "@/components/ui/form-group";
import { toast } from "sonner";
import { useUser } from "@/hooks/use-user";
import ImageUpload from "@/components/common/image-upload";
import { ErrorMessage } from "@/components/common/error-message";
import { FormFooter } from "@/components/common/form-footer";
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
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const EditItemForm = ({
  itemId,
  itemName,
  open,
  onOpenChange,
  onSuccess,
}: EditItemFormProps) => {
  const { user, isLoading } = useUser();
  const [name, setName] = useState(itemName || "");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Загружаем текущее фото при открытии формы
  useEffect(() => {
    if (open && itemId) {
      const loadPhoto = async () => {
        try {
          const response = await apiClient.getItem(itemId);
          if (response.data?.photo_url) {
            setPhotoUrl(response.data.photo_url);
          } else {
            setPhotoUrl(null);
          }
        } catch (error) {
          setPhotoUrl(null);
        }
      };
      loadPhoto();
    }
  }, [open, itemId]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      // Обновляем только название вещи и фото
      const response = await apiClient.updateItem(itemId, {
        name: name.trim() || undefined,
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
