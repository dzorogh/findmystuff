"use client";

import { useState, useEffect } from "react";
import { getRoom, updateRoom } from "@/lib/rooms/api";
import { Input } from "@/components/ui/input";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
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

interface EditRoomFormProps {
  roomId: number;
  roomName: string | null;
  roomTypeId?: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const EditRoomForm = ({
  roomId,
  roomName,
  roomTypeId: initialRoomTypeId,
  open,
  onOpenChange,
  onSuccess,
}: EditRoomFormProps) => {
  const { isLoading } = useUser();
  const { types: roomTypes } = useEntityTypes("room");
  const [name, setName] = useState(roomName || "");
  const [roomTypeId, setRoomTypeId] = useState<string>(initialRoomTypeId?.toString() || "");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && roomId) {
      setName(roomName || "");
      setRoomTypeId(initialRoomTypeId?.toString() || "");
      const loadRoom = async () => {
        try {
          const response = await getRoom(roomId);
          const room = response.data?.room;
          if (room) {
            if (room.photo_url) setPhotoUrl(room.photo_url);
            else setPhotoUrl(null);
            if (room.room_type_id != null) setRoomTypeId(room.room_type_id.toString());
          }
        } catch {
          setPhotoUrl(null);
        }
      };
      loadRoom();
    } else {
      setName("");
      setRoomTypeId("");
      setPhotoUrl(null);
    }
  }, [open, roomId, roomName, initialRoomTypeId]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await updateRoom(roomId, {
        name: name.trim() || undefined,
        room_type_id: roomTypeId ? parseInt(roomTypeId) : null,
        photo_url: photoUrl || undefined,
      });

      if (response.error) {
        throw new Error(response.error);
      }

      toast.success("Помещение успешно обновлено");

      // Небольшая задержка перед закрытием, чтобы toast успел отобразиться
      await new Promise(resolve => setTimeout(resolve, 200));

      if (onSuccess) {
        onSuccess();
      }

      onOpenChange(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Произошла ошибка при редактировании помещения"
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
          <SheetTitle>Редактировать помещение</SheetTitle>
          <SheetDescription>Измените название помещения</SheetDescription>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="mt-6">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor={`room-type-${roomId}`}>Тип помещения (необязательно)</FieldLabel>
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
            </Field>

            <Field>
              <FieldLabel htmlFor={`room-name-${roomId}`}>Название помещения</FieldLabel>
              <Input
                id={`room-name-${roomId}`}
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Введите название помещения"
                disabled={isSubmitting}
              />
            </Field>

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
              submitLabel="Сохранить"
            />
          </FieldGroup>
        </form>
      </SheetContent>
    </Sheet>
  );
};

export default EditRoomForm;
