"use client";

import { useState, useCallback } from "react";
import { apiClient } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { FormGroup } from "@/components/ui/form-group";
import { Divider } from "@/components/ui/divider";
import { toast } from "sonner";
import { useUser } from "@/hooks/use-user";
import { useRooms } from "@/hooks/use-rooms";
import { usePlaces } from "@/hooks/use-places";
import { useContainers } from "@/hooks/use-containers";
import LocationCombobox from "@/components/location/location-combobox";
import { ErrorMessage } from "@/components/common/error-message";
import { getEntityDisplayName } from "@/lib/entity-display-name";
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

interface MoveContainerFormProps {
  containerId: number;
  containerName: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const MoveContainerForm = ({ containerId, containerName, open, onOpenChange, onSuccess }: MoveContainerFormProps) => {
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

      const response = await apiClient.createTransition({
        container_id: containerId,
        destination_type: destinationType,
        destination_id: parseInt(selectedDestinationId),
      });

      if (response.error) {
        throw new Error(response.error);
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

      toast.success(`Контейнер успешно перемещен в ${finalDestinationName}`, {
        description: "Контейнер перемещен",
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
        err instanceof Error ? err.message : "Произошла ошибка при перемещении контейнера"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQRScanSuccess = (result: EntityQrPayload) => {
    if (result.type !== "room" && result.type !== "place" && result.type !== "container") {
      toast.error("Недопустимое местоположение", {
        description: "Контейнер можно переместить только в помещение, место или другой контейнер.",
      });
      setIsQRScannerOpen(false);
      return;
    }

    // Проверяем, существует ли выбранное местоположение
    let destinationExists = false;

    if (result.type === "container") {
      destinationExists = containers.some((c) => c.id === result.id && c.id !== containerId);
    } else if (result.type === "place") {
      destinationExists = places.some((p) => p.id === result.id);
    } else {
      destinationExists = rooms.some((r) => r.id === result.id);
    }

    if (!destinationExists) {
      toast.error("Местоположение не найдено", {
        description: `${result.type === "container" ? "Контейнер" : result.type === "place" ? "Место" : "Помещение"} с ID ${result.id} не существует${result.type === "container" ? " или это тот же контейнер" : ""}`,
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
            <SheetTitle>Переместить контейнер</SheetTitle>
            <SheetDescription>
              {getEntityDisplayName("container", containerId, containerName)}
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
                id={`move-container-${containerId}`}
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

export default MoveContainerForm;
