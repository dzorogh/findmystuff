"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";
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

interface AddItemFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const AddItemForm = ({ open, onOpenChange, onSuccess }: AddItemFormProps) => {
  const { user, isLoading } = useUser();
  const [name, setName] = useState("");
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
      const supabase = createClient();
      
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();

      if (!currentUser) {
        setError("Вы не авторизованы");
        setIsSubmitting(false);
        return;
      }

      if (currentUser.email !== "dzorogh@gmail.com") {
        setError("У вас нет прав для добавления вещей");
        setIsSubmitting(false);
        return;
      }

      // Проверяем, что если выбран тип назначения, то и ID тоже выбран
      if (destinationType && !selectedDestinationId) {
        setError("Выберите конкретное место или контейнер");
        setIsSubmitting(false);
        return;
      }

      // Добавляем вещь
      console.log("Adding item with photo_url:", photoUrl);
      const { data: newItem, error: insertError } = await supabase
        .from("items")
        .insert({
          name: name.trim() || null,
          photo_url: photoUrl || null,
        })
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      // Если указано местоположение, создаем transition
      if (destinationType && selectedDestinationId && newItem) {
        const { error: transitionError } = await supabase
          .from("transitions")
          .insert({
            item_id: newItem.id,
            destination_type: destinationType,
            destination_id: parseInt(selectedDestinationId),
          });

        if (transitionError) {
          console.error("Ошибка при создании transition:", transitionError);
          // Не прерываем процесс, вещь уже добавлена
        }
      }

      setName("");
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
        <form onSubmit={handleSubmit} className="space-y-4 mt-6">
          {isLoading ? (
            <div className="py-8 text-center text-muted-foreground">
              Загрузка...
            </div>
          ) : !user || user.email !== "dzorogh@gmail.com" ? (
            <div className="py-8 text-center text-destructive">
              У вас нет прав для добавления вещей
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="item-name">Название вещи</Label>
                <Input
                  id="item-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Введите название вещи"
                  disabled={isSubmitting}
                />
                <p className="text-xs text-muted-foreground">
                  Поле необязательное. ID и дата создания заполнятся автоматически.
                </p>
              </div>

              <LocationSelector
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
                      Добавление...
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Добавить вещь
                    </>
                  )}
                </Button>
              </SheetFooter>
            </>
          )}
        </form>
      </SheetContent>
    </Sheet>
  );
};

export default AddItemForm;
