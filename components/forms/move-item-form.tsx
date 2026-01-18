"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useUser } from "@/hooks/use-user";
import { useRooms } from "@/hooks/use-rooms";
import { usePlaces } from "@/hooks/use-places";
import { useContainers } from "@/hooks/use-containers";
import LocationCombobox from "@/components/location/location-combobox";
import { ErrorMessage } from "@/components/common/error-message";
import { FormFooter } from "@/components/common/form-footer";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

interface MoveItemFormProps {
  itemId: number;
  itemName: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const MoveItemForm = ({ itemId, itemName, open, onOpenChange, onSuccess }: MoveItemFormProps) => {
  const { user, isLoading } = useUser();
  const { rooms } = useRooms();
  const { places } = usePlaces();
  const { containers } = useContainers();
  const [destinationType, setDestinationType] = useState<"container" | "place" | "room">("room");
  const [selectedDestinationId, setSelectedDestinationId] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (!selectedDestinationId) {
        setError("Выберите место назначения");
        setIsSubmitting(false);
        return;
      }

      const supabase = createClient();

      const { error: insertError } = await supabase.from("transitions").insert({
        item_id: itemId,
        destination_type: destinationType,
        destination_id: parseInt(selectedDestinationId),
      });

      if (insertError) {
        throw insertError;
      }

      // Получаем название места назначения для toast
      let destinationName: string | undefined;
      if (destinationType === "container") {
        destinationName = containers.find((c) => c.id === parseInt(selectedDestinationId))?.name ?? undefined;
      } else if (destinationType === "place") {
        destinationName = places.find((p) => p.id === parseInt(selectedDestinationId))?.name ?? undefined;
      } else {
        destinationName = rooms.find((r) => r.id === parseInt(selectedDestinationId))?.name ?? undefined;
      }
      
      const finalDestinationName = destinationName || 
        `${destinationType === "container" ? "Контейнер" : destinationType === "place" ? "Место" : "Помещение"} #${selectedDestinationId}`;

      toast.success(`Вещь успешно перемещена в ${finalDestinationName}`, {
        description: "Вещь перемещена",
      });

      setSelectedDestinationId("");
      
      if (onSuccess) {
        onSuccess();
      }
      
      // Небольшая задержка перед закрытием, чтобы toast был виден
      await new Promise((resolve) => setTimeout(resolve, 200));
      onOpenChange(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Произошла ошибка при перемещении вещи"
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
          <SheetTitle>Переместить вещь</SheetTitle>
          <SheetDescription>
            {itemName || `Item #${itemId}`}
          </SheetDescription>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-6">
          <LocationCombobox
            destinationType={destinationType}
            selectedDestinationId={selectedDestinationId}
            onDestinationTypeChange={(type) => {
              setDestinationType(type || "room");
              setSelectedDestinationId("");
            }}
            onDestinationIdChange={setSelectedDestinationId}
            disabled={isSubmitting}
            showRoomFirst={true}
            label="Тип назначения"
            id={`move-item-${itemId}`}
          />

          <ErrorMessage message={error || ""} />

          <FormFooter
            isSubmitting={isSubmitting}
            onCancel={() => onOpenChange(false)}
            submitLabel="Переместить"
            disabled={!selectedDestinationId}
          />
        </form>
      </SheetContent>
    </Sheet>
  );
};

export default MoveItemForm;
