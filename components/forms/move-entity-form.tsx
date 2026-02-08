"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { createTransition } from "@/lib/entities/api";
import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import { Divider } from "@/components/ui/divider";
import { toast } from "sonner";
import { useUser } from "@/lib/users/context";
import { useRooms } from "@/lib/rooms/hooks/use-rooms";
import { usePlaces } from "@/lib/places/hooks/use-places";
import { useContainers } from "@/lib/containers/hooks/use-containers";
import LocationCombobox, { type DestinationType } from "@/components/fields/location-combobox";
import { ErrorMessage } from "@/components/common/error-message";
import { FormFooter } from "@/components/forms/form-footer";
import type { EntityQrPayload } from "@/lib/entities/helpers/qr-code";
import { ArrowRightLeft, Scan } from "lucide-react";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import QRScanner from "@/components/common/qr-scanner";

export type TransitionPayload = {
  destination_type: string;
  destination_id: number;
  item_id?: number;
  place_id?: number;
  container_id?: number;
};

const DESTINATION_TYPE_LABELS: Record<DestinationType, string> = {
  room: "Помещение",
  place: "Место",
  container: "Контейнер",
};

const DESTINATION_TYPE_LABELS_LOWER: Record<DestinationType, string> = {
  room: "помещение",
  place: "место",
  container: "контейнер",
};

export interface MoveEntityFormProps {
  title: string;
  entityDisplayName: string;
  destinationTypes: DestinationType[];
  buildPayload: (destinationType: string, destinationId: number) => TransitionPayload;
  getSuccessMessage: (destinationName: string) => string;
  getErrorMessage: () => string;
  /** Исключить этот id из списка контейнеров (например при перемещении контейнера — не выбирать тот же). */
  excludeContainerId?: number;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSuccess?: () => void;
  trigger?: React.ReactElement;
}

/** Тело формы — монтируется только при открытом Sheet. */
function MoveEntityFormBody({
  title,
  entityDisplayName,
  destinationTypes,
  buildPayload,
  getSuccessMessage,
  getErrorMessage,
  excludeContainerId,
  onSuccess,
  onClose,
  onBlockCloseChange,
}: {
  title: string;
  entityDisplayName: string;
  destinationTypes: DestinationType[];
  buildPayload: (destinationType: string, destinationId: number) => TransitionPayload;
  getSuccessMessage: (destinationName: string) => string;
  getErrorMessage: () => string;
  excludeContainerId?: number;
  onSuccess?: () => void;
  onClose: () => void;
  onBlockCloseChange?: (block: boolean) => void;
}) {
  const { rooms } = useRooms();
  const { places } = usePlaces();
  const { containers } = useContainers();
  const defaultType = destinationTypes[0] ?? "room";
  const [destinationType, setDestinationType] = useState<DestinationType | null>(defaultType);
  const [selectedDestinationId, setSelectedDestinationId] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);

  useEffect(() => {
    onBlockCloseChange?.(isQRScannerOpen);
  }, [isQRScannerOpen, onBlockCloseChange]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (!selectedDestinationId || !destinationType) {
        setError("Выберите место назначения");
        setIsSubmitting(false);
        return;
      }

      const payload = buildPayload(destinationType, parseInt(selectedDestinationId));
      const response = await createTransition(payload);

      if (response.error) {
        throw new Error(response.error);
      }

      let destinationName: string | undefined;
      if (destinationType === "container") {
        destinationName = containers.find((c) => c.id === parseInt(selectedDestinationId))?.name ?? undefined;
      } else if (destinationType === "place") {
        destinationName = places.find((p) => p.id === parseInt(selectedDestinationId))?.name ?? undefined;
      } else {
        destinationName = rooms.find((r) => r.id === parseInt(selectedDestinationId))?.name ?? undefined;
      }
      const typeLabel = DESTINATION_TYPE_LABELS[destinationType];
      const finalDestinationName = destinationName || `${typeLabel} #${selectedDestinationId}`;

      toast.success(getSuccessMessage(finalDestinationName));

      setSelectedDestinationId("");
      onSuccess?.();
      await new Promise((resolve) => setTimeout(resolve, 200));
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : getErrorMessage());
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQRScanSuccess = (result: EntityQrPayload) => {
    const validTypes: DestinationType[] = ["room", "place", "container"];
    if (!validTypes.includes(result.type as DestinationType)) {
      toast.error("Недопустимое местоположение");
      setIsQRScannerOpen(false);
      return;
    }
    if (!destinationTypes.includes(result.type as DestinationType)) {
      const allowed = destinationTypes
        .map((t) => DESTINATION_TYPE_LABELS_LOWER[t])
        .join(", ");
      toast.error("Недопустимое местоположение", {
        description: `Необходимо отсканировать QR-код: ${allowed}.`,
      });
      setIsQRScannerOpen(false);
      return;
    }

    let destinationExists = false;
    if (result.type === "container") {
      destinationExists = containers.some(
        (c) => c.id === result.id && (excludeContainerId == null || c.id !== excludeContainerId)
      );
    } else if (result.type === "place") {
      destinationExists = places.some((p) => p.id === result.id);
    } else {
      destinationExists = rooms.some((r) => r.id === result.id);
    }

    if (!destinationExists) {
      const typeLabel = DESTINATION_TYPE_LABELS[result.type as DestinationType];
      const extra =
        result.type === "container" && excludeContainerId != null && result.id === excludeContainerId
          ? " или это тот же контейнер"
          : "";
      toast.error("Местоположение не найдено", {
        description: `${typeLabel} с ID ${result.id} не существует${extra}`,
      });
      setIsQRScannerOpen(false);
      return;
    }

    setDestinationType(result.type as DestinationType);
    setSelectedDestinationId(result.id.toString());
    setIsQRScannerOpen(false);
    toast.success("QR-код отсканирован", {
      description: `Выбрано: ${DESTINATION_TYPE_LABELS[result.type as DestinationType]} #${result.id}`,
    });
  };

  return (
    <>
      <SheetHeader>
        <SheetTitle>{title}</SheetTitle>
        <SheetDescription>{entityDisplayName}</SheetDescription>
      </SheetHeader>
      <form onSubmit={handleSubmit}>
        <div className="p-2">
          <FieldGroup>
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
                setDestinationType(type);
                setSelectedDestinationId("");
              }}
              onDestinationIdChange={setSelectedDestinationId}
              disabled={isSubmitting}
              showRoomFirst={true}
              allowedTypes={destinationTypes}
              excludeContainerId={excludeContainerId}
              label="Тип назначения"
              id="move-entity-destination"
            />

            <ErrorMessage message={error || ""} />
          </FieldGroup>
        </div>
        <FormFooter
          isSubmitting={isSubmitting}
          onCancel={onClose}
          submitLabel="Переместить"
          disabled={!selectedDestinationId}
        />
      </form>
      {isQRScannerOpen && (
        <QRScanner
          open={isQRScannerOpen}
          onClose={() => setIsQRScannerOpen(false)}
          onScanSuccess={handleQRScanSuccess}
        />
      )}
    </>
  );
}

export default function MoveEntityForm({
  title,
  entityDisplayName,
  destinationTypes,
  buildPayload,
  getSuccessMessage,
  getErrorMessage,
  excludeContainerId,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  onSuccess,
  trigger,
}: MoveEntityFormProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined && controlledOnOpenChange !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = useMemo(
    () => (isControlled ? (controlledOnOpenChange ?? (() => { })) : setInternalOpen),
    [isControlled, controlledOnOpenChange]
  );

  const [blockClose, setBlockClose] = useState(false);

  const handleSheetOpenChange = useCallback(
    (newOpen: boolean) => {
      if (!newOpen && blockClose) return;
      setOpen(newOpen);
      if (!newOpen) setBlockClose(false);
    },
    [blockClose, setOpen]
  );

  const { isLoading } = useUser();

  if (isLoading) {
    return null;
  }

  const defaultTrigger = (
    <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Переместить">
      <ArrowRightLeft className="h-4 w-4" />
    </Button>
  );

  return (
    <Sheet open={open} onOpenChange={handleSheetOpenChange}>
      {!isControlled && (
        <SheetTrigger render={trigger ?? defaultTrigger} />
      )}
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
        {open && destinationTypes.length > 0 ? (
          <MoveEntityFormBody
            title={title}
            entityDisplayName={entityDisplayName}
            destinationTypes={destinationTypes}
            buildPayload={buildPayload}
            getSuccessMessage={getSuccessMessage}
            getErrorMessage={getErrorMessage}
            excludeContainerId={excludeContainerId}
            onSuccess={onSuccess}
            onClose={() => setOpen(false)}
            onBlockCloseChange={setBlockClose}
          />
        ) : (
          <>
            <SheetHeader>
              <SheetTitle>{title}</SheetTitle>
              <SheetDescription>{entityDisplayName}</SheetDescription>
            </SheetHeader>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
