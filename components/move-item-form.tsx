"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/hooks/use-user";
import { useRooms } from "@/hooks/use-rooms";
import { usePlaces } from "@/hooks/use-places";
import { useContainers } from "@/hooks/use-containers";
import LocationSelector from "@/components/location-selector";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
  const { toast } = useToast();

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
      const destinationName = 
        destinationType === "container" 
          ? containers.find((c) => c.id === parseInt(selectedDestinationId))?.name
          : destinationType === "place"
          ? places.find((p) => p.id === parseInt(selectedDestinationId))?.name
          : rooms.find((r) => r.id === parseInt(selectedDestinationId))?.name ||
        `${destinationType === "container" ? "Контейнер" : destinationType === "place" ? "Место" : "Помещение"} #${selectedDestinationId}`;

      toast({
        title: "Вещь перемещена",
        description: `Вещь успешно перемещена в ${destinationName}`,
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

  if (isLoading || !user || user.email !== "dzorogh@gmail.com") {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Переместить вещь</DialogTitle>
          <DialogDescription>
            {itemName || `Item #${itemId}`}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <LocationSelector
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

          {error && (
            <div className="rounded-md bg-destructive/10 border border-destructive/20 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Отмена
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !selectedDestinationId}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Перемещение...
                </>
              ) : (
                "Переместить"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default MoveItemForm;
