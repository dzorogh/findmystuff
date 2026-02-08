"use client";

import { useState } from "react";
import { createRoom } from "@/lib/rooms/api";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import { FormGroup } from "@/components/ui/form-group";
import { Combobox } from "@/components/ui/combobox";
import { Plus } from "lucide-react";
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
import { Skeleton } from "@/components/ui/skeleton";

interface AddRoomFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const AddRoomForm = ({ open, onOpenChange, onSuccess }: AddRoomFormProps) => {
  const { isLoading } = useUser();
  const { types: roomTypes, isLoading: isLoadingTypes } = useEntityTypes("room");
  const [name, setName] = useState("");
  const [roomTypeId, setRoomTypeId] = useState<string>("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await createRoom({
        name: name.trim() || undefined,
        room_type_id: roomTypeId ? parseInt(roomTypeId) : null,
        photo_url: photoUrl || undefined,
      });

      if (response.error) {
        throw new Error(response.error);
      }

      setName("");
      setRoomTypeId("");
      setPhotoUrl(null);

      toast.success("Помещение успешно добавлено в склад", {
        description: "Помещение добавлено",
      });

      if (onSuccess) {
        onSuccess();
      }

      setTimeout(() => {
        onOpenChange(false);
      }, 100);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Произошла ошибка при добавлении помещения"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Добавить новое помещение</SheetTitle>
          <SheetDescription>
            Введите название помещения
          </SheetDescription>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="mt-6">
          {isLoading || isLoadingTypes ? (
            <div className="space-y-4 py-4">
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
            <FormGroup>
              <FormField
                label="Тип помещения (необязательно)"
                htmlFor="room-type"
              >
                <Combobox
                  items={[
                    { value: "", label: "Не указан" },
                    ...roomTypes.map((type) => ({
                      value: type.id.toString(),
                      label: type.name,
                    })),
                  ]}
                  value={roomTypeId}
                  onValueChange={(v) => setRoomTypeId(v ?? "")}
                  disabled={isSubmitting}
                />
              </FormField>

              <FormField
                label="Название помещения"
                htmlFor="room-name"
                description="Поле необязательное. ID и дата создания заполнятся автоматически."
              >
                <Input
                  id="room-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Введите название помещения"
                  disabled={isSubmitting}
                />
              </FormField>

              <ImageUpload
                value={photoUrl}
                onChange={setPhotoUrl}
                disabled={isSubmitting}
                label="Фотография помещения (необязательно)"
              />

              <ErrorMessage message={error || ""} />

              <FormFooter
                isSubmitting={isSubmitting}
                onCancel={() => onOpenChange(false)}
                submitLabel="Добавить помещение"
                submitIcon={Plus}
              />
            </FormGroup>
          )}
        </form>
      </SheetContent>
    </Sheet>
  );
};

export default AddRoomForm;
