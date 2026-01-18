"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useUser } from "@/hooks/use-user";
import ImageUpload from "@/components/image-upload";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

interface EditRoomFormProps {
  roomId: number;
  roomName: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const EditRoomForm = ({
  roomId,
  roomName,
  open,
  onOpenChange,
  onSuccess,
}: EditRoomFormProps) => {
  const { user, isLoading } = useUser();
  const [name, setName] = useState(roomName || "");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Отслеживаем изменения photoUrl для отладки
  useEffect(() => {
    console.log("photoUrl changed:", photoUrl);
  }, [photoUrl]);

  // Загружаем текущие данные при открытии формы
  useEffect(() => {
    if (open && roomId) {
      setName(roomName || "");
      const loadPhoto = async () => {
        const supabase = createClient();
        const { data } = await supabase
          .from("rooms")
          .select("photo_url")
          .eq("id", roomId)
          .single();
        
        if (data?.photo_url) {
          setPhotoUrl(data.photo_url);
        } else {
          setPhotoUrl(null);
        }
      };
      loadPhoto();
    } else {
      // Сбрасываем форму при закрытии
      setName("");
      setPhotoUrl(null);
    }
  }, [open, roomId, roomName]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const supabase = createClient();

      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();

      if (!currentUser || currentUser.email !== "dzorogh@gmail.com") {
        setError("У вас нет прав для редактирования помещений");
        setIsSubmitting(false);
        return;
      }

      const updateData: { name: string | null; photo_url: string | null } = {
        name: name.trim() || null,
        photo_url: photoUrl || null,
      };
      
      console.log("Updating room with data:", updateData);
      
      const { error: updateError } = await supabase
        .from("rooms")
        .update(updateData)
        .eq("id", roomId);

      if (updateError) {
        console.error("Update error:", updateError);
        throw updateError;
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

  if (isLoading || !user || user.email !== "dzorogh@gmail.com") {
    return null;
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Редактировать помещение</SheetTitle>
          <SheetDescription>Измените название помещения</SheetDescription>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-6">
          <div className="space-y-2">
            <Label htmlFor={`room-name-${roomId}`}>Название помещения</Label>
            <Input
              id={`room-name-${roomId}`}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Введите название помещения"
              disabled={isSubmitting}
            />
          </div>

          <ImageUpload
            value={photoUrl}
            onChange={(url) => {
              console.log("ImageUpload onChange called with:", url);
              setPhotoUrl(url);
            }}
            disabled={isSubmitting}
            label="Фотография помещения (необязательно)"
          />

          {error && (
            <div className="rounded-md bg-destructive/10 border border-destructive/20 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          <SheetFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Отмена
            </Button>
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
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
};

export default EditRoomForm;
