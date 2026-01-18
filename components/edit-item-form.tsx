"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useUser } from "@/hooks/use-user";
import LocationSelector from "@/components/location-selector";
import ImageUpload from "@/components/image-upload";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

interface EditItemFormProps {
  itemId: number;
  itemName: string | null;
  currentLocation?: {
    destination_type: string | null;
    destination_id: number | null;
    destination_name: string | null;
  } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const EditItemForm = ({
  itemId,
  itemName,
  currentLocation,
  open,
  onOpenChange,
  onSuccess,
}: EditItemFormProps) => {
  const { user, isLoading } = useUser();
  const [name, setName] = useState(itemName || "");
  const [destinationType, setDestinationType] = useState<"container" | "place" | "room" | null>(
    currentLocation?.destination_type as "container" | "place" | "room" | null
  );
  const [selectedDestinationId, setSelectedDestinationId] = useState<string>(
    currentLocation?.destination_id?.toString() || ""
  );
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Загружаем текущее фото при открытии формы
  useEffect(() => {
    if (open && itemId) {
      const loadPhoto = async () => {
        const supabase = createClient();
        const { data } = await supabase
          .from("items")
          .select("photo_url")
          .eq("id", itemId)
          .single();
        
        if (data?.photo_url) {
          setPhotoUrl(data.photo_url);
        } else {
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
      const supabase = createClient();

      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();

      if (!currentUser || currentUser.email !== "dzorogh@gmail.com") {
        setError("У вас нет прав для редактирования вещей");
        setIsSubmitting(false);
        return;
      }

      // Обновляем название вещи и фото
      console.log("Updating item with photo_url:", photoUrl);
      const { error: updateError } = await supabase
        .from("items")
        .update({
          name: name.trim() || null,
          photo_url: photoUrl || null,
        })
        .eq("id", itemId);

      if (updateError) {
        throw updateError;
      }

      // Если указано новое местоположение, создаем transition
      if (destinationType && selectedDestinationId) {
        const { error: transitionError } = await supabase.from("transitions").insert({
          item_id: itemId,
          destination_type: destinationType,
          destination_id: parseInt(selectedDestinationId),
        });

        if (transitionError) {
          console.error("Ошибка при создании transition:", transitionError);
        }
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

  if (isLoading || !user || user.email !== "dzorogh@gmail.com") {
    return null;
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Редактировать вещь</SheetTitle>
          <SheetDescription>Измените название или местоположение</SheetDescription>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-6">
          <div className="space-y-2">
            <Label htmlFor={`item-name-${itemId}`}>Название вещи</Label>
            <Input
              id={`item-name-${itemId}`}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Введите название вещи"
              disabled={isSubmitting}
            />
          </div>

          <LocationSelector
            destinationType={destinationType}
            selectedDestinationId={selectedDestinationId}
            onDestinationTypeChange={setDestinationType}
            onDestinationIdChange={setSelectedDestinationId}
            disabled={isSubmitting}
            showRoomFirst={true}
            label="Изменить местоположение (необязательно)"
            id={`edit-item-location-${itemId}`}
          />

          <ImageUpload
            value={photoUrl}
            onChange={setPhotoUrl}
            disabled={isSubmitting}
            label="Фотография вещи (необязательно)"
          />

          {currentLocation && (
            <div className="rounded-md bg-muted p-3">
              <p className="text-xs text-muted-foreground">
                Текущее местоположение: {currentLocation.destination_name || `#${currentLocation.destination_id}`}
              </p>
            </div>
          )}

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

export default EditItemForm;
