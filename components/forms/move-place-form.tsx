"use client";

import { useState, useCallback } from "react";
import { apiClient } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { FormGroup } from "@/components/ui/form-group";
import { Divider } from "@/components/ui/divider";
import { toast } from "sonner";
import { useUser } from "@/hooks/use-user";
import { useRooms } from "@/hooks/use-rooms";
import RoomCombobox from "@/components/location/room-combobox";
import { ErrorMessage } from "@/components/common/error-message";
import { FormFooter } from "@/components/common/form-footer";
import QRScanner from "@/components/common/qr-scanner";
import type { EntityQrPayload } from "@/lib/entity-qr-code";
import { Scan } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

interface MovePlaceFormProps {
  placeId: number;
  placeName: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const MovePlaceForm = ({ placeId, placeName, open, onOpenChange, onSuccess }: MovePlaceFormProps) => {
  const { user, isLoading } = useUser();
  const { rooms } = useRooms();
  const [selectedRoomId, setSelectedRoomId] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (!selectedRoomId) {
        setError("Выберите помещение");
        setIsSubmitting(false);
        return;
      }

      const response = await apiClient.createTransition({
        place_id: placeId,
        destination_type: "room",
        destination_id: parseInt(selectedRoomId),
      });

      if (response.error) {
        throw new Error(response.error);
      }

      const destinationName = rooms.find((r) => r.id === parseInt(selectedRoomId))?.name ?? undefined;
      const finalDestinationName = destinationName || `Помещение #${selectedRoomId}`;

      toast.success(`Место успешно перемещено в ${finalDestinationName}`, {
        description: "Место перемещено",
      });

      setSelectedRoomId("");
      
      if (onSuccess) {
        onSuccess();
      }
      
      await new Promise((resolve) => setTimeout(resolve, 200));
      onOpenChange(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Произошла ошибка при перемещении места"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQRScanSuccess = (result: EntityQrPayload) => {
    if (result.type !== "room") {
      toast.error("Некорректный QR-код", {
        description: "Для перемещения места необходимо отсканировать QR-код помещения",
      });
      setIsQRScannerOpen(false);
      return;
    }

    const roomExists = rooms.some((r) => r.id === result.id);

    if (!roomExists) {
      toast.error("Помещение не найдено", {
        description: `Помещение с ID ${result.id} не существует`,
      });
      setIsQRScannerOpen(false);
      return;
    }

    setSelectedRoomId(result.id.toString());
    setIsQRScannerOpen(false);
    
    toast.success("QR-код отсканирован", {
      description: `Выбрано: Помещение #${result.id}`,
    });
  };

  if (isLoading) {
    return null;
  }

  const handleSheetOpenChange = useCallback((newOpen: boolean) => {
    if (!newOpen && isQRScannerOpen) {
      return;
    }
    onOpenChange(newOpen);
  }, [isQRScannerOpen, onOpenChange]);

  return (
    <>
      <Sheet open={open} onOpenChange={handleSheetOpenChange}>
        <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Переместить место</SheetTitle>
            <SheetDescription>
              {placeName || `Место #${placeId}`}
            </SheetDescription>
          </SheetHeader>
          <form onSubmit={handleSubmit} className="mt-6">
            <FormGroup>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => setIsQRScannerOpen(true)}
                disabled={isSubmitting}
              >
                <Scan className="mr-2 h-4 w-4" />
                Сканировать QR-код
              </Button>

              <Divider />

              <RoomCombobox
                selectedRoomId={selectedRoomId}
                onRoomIdChange={setSelectedRoomId}
                disabled={isSubmitting}
                label="Выберите помещение"
                id={`move-place-${placeId}`}
                required
              />

              <ErrorMessage message={error || ""} />

              <FormFooter
                isSubmitting={isSubmitting}
                onCancel={() => onOpenChange(false)}
                submitLabel="Переместить"
                disabled={!selectedRoomId}
              />
            </FormGroup>
          </form>
        </SheetContent>
      </Sheet>
      {isQRScannerOpen && (
        <QRScanner
          open={isQRScannerOpen}
          onClose={() => {
            setIsQRScannerOpen(false);
          }}
          onScanSuccess={handleQRScanSuccess}
        />
      )}
    </>
  );
};

export default MovePlaceForm;
