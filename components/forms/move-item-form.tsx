"use client";

import { useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { FormGroup } from "@/components/ui/form-group";
import { toast } from "sonner";
import { useUser } from "@/hooks/use-user";
import { useRooms } from "@/hooks/use-rooms";
import { usePlaces } from "@/hooks/use-places";
import { useContainers } from "@/hooks/use-containers";
import LocationCombobox from "@/components/location/location-combobox";
import { ErrorMessage } from "@/components/common/error-message";
import { FormFooter } from "@/components/common/form-footer";
import QRScanner from "@/components/common/qr-scanner";
import { Camera } from "lucide-react";
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
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);

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

  const handleQRScanSuccess = (result: { type: "room" | "place" | "container"; id: number }) => {
    // Проверяем, существует ли выбранное местоположение
    let destinationExists = false;
    
    if (result.type === "container") {
      destinationExists = containers.some((c) => c.id === result.id);
    } else if (result.type === "place") {
      destinationExists = places.some((p) => p.id === result.id);
    } else {
      destinationExists = rooms.some((r) => r.id === result.id);
    }

    if (!destinationExists) {
      toast.error("Местоположение не найдено", {
        description: `${result.type === "container" ? "Контейнер" : result.type === "place" ? "Место" : "Помещение"} с ID ${result.id} не существует`,
      });
      setIsQRScannerOpen(false);
      return;
    }

    setDestinationType(result.type);
    setSelectedDestinationId(result.id.toString());
    setIsQRScannerOpen(false);
    
    toast.success("QR-код отсканирован", {
      description: `Выбрано: ${result.type === "container" ? "Контейнер" : result.type === "place" ? "Место" : "Помещение"} #${result.id}`,
    });
  };

  if (isLoading) {
    return null;
  }

  const handleSheetOpenChange = useCallback((newOpen: boolean) => {
    // Предотвращаем закрытие Sheet только если открыт QRScanner И это попытка закрыть Sheet
    // Но позволяем закрыть Sheet, если пользователь явно хочет его закрыть (например, через кнопку отмены)
    if (!newOpen && isQRScannerOpen) {
      // Игнорируем попытку закрыть Sheet, если открыт QRScanner
      // Это предотвращает автоматическое закрытие Sheet при закрытии QRScanner
      return;
    }
    onOpenChange(newOpen);
  }, [isQRScannerOpen, onOpenChange]);

  return (
    <>
      <Sheet open={open} onOpenChange={handleSheetOpenChange}>
        <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Переместить вещь</SheetTitle>
            <SheetDescription>
              {itemName || `Item #${itemId}`}
            </SheetDescription>
          </SheetHeader>
          <form onSubmit={handleSubmit} className="mt-6">
            <FormGroup>
              <FormField label="Способ выбора местоположения">
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => setIsQRScannerOpen(true)}
                    disabled={isSubmitting}
                  >
                    <Camera className="mr-2 h-4 w-4" />
                    Сканировать QR-код
                  </Button>
                </div>
              </FormField>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">или</span>
                </div>
              </div>

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
            </FormGroup>
          </form>
        </SheetContent>
      </Sheet>
      {isQRScannerOpen && (
        <QRScanner
          open={isQRScannerOpen}
          onClose={() => {
            // Убеждаемся, что закрытие сканера не влияет на Sheet
            setIsQRScannerOpen(false);
          }}
          onScanSuccess={handleQRScanSuccess}
        />
      )}
    </>
  );
};

export default MoveItemForm;
