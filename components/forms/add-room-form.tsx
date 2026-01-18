"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { useUser } from "@/hooks/use-user";
import { useAdmin } from "@/hooks/use-admin";
import ImageUpload from "@/components/image-upload";
import { ErrorMessage } from "@/components/common/error-message";
import { FormFooter } from "@/components/common/form-footer";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

interface AddRoomFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const AddRoomForm = ({ open, onOpenChange, onSuccess }: AddRoomFormProps) => {
  const { user, isLoading } = useUser();
  const { isAdmin } = useAdmin();
  const [name, setName] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const supabase = createClient();
      
      if (!isAdmin) {
        setError("У вас нет прав для добавления помещений");
        setIsSubmitting(false);
        return;
      }

      const insertData: { name: string | null; photo_url: string | null } = {
        name: name.trim() || null,
        photo_url: photoUrl || null,
      };
      
      console.log("Inserting room with data:", insertData);
      
      const { error: insertError } = await supabase
        .from("rooms")
        .insert(insertData);

      if (insertError) {
        console.error("Insert error:", insertError);
        throw insertError;
      }

      setName("");
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
        <form onSubmit={handleSubmit} className="space-y-4 mt-6">
          {isLoading ? (
            <div className="py-8 text-center text-muted-foreground">
              Загрузка...
            </div>
          ) : !isAdmin ? (
            <div className="py-8 text-center text-destructive">
              У вас нет прав для добавления помещений
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="room-name">Название помещения</Label>
                <Input
                  id="room-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Введите название помещения"
                  disabled={isSubmitting}
                />
                <p className="text-xs text-muted-foreground">
                  Поле необязательное. ID и дата создания заполнятся автоматически.
                </p>
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

              <ErrorMessage message={error || ""} />

              <FormFooter
                isSubmitting={isSubmitting}
                onCancel={() => onOpenChange(false)}
                submitLabel="Добавить помещение"
                submitIcon={Plus}
              />
            </>
          )}
        </form>
      </SheetContent>
    </Sheet>
  );
};

export default AddRoomForm;
