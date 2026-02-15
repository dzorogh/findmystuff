"use client";

import { useState, useCallback, useMemo } from "react";
import { updateRoom } from "@/lib/rooms/api";
import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import { toast } from "sonner";
import { useUser } from "@/lib/users/context";
import { useBuildings } from "@/lib/buildings/hooks/use-buildings";
import BuildingCombobox from "@/components/fields/building-combobox";
import { ErrorMessage } from "@/components/common/error-message";
import { FormFooter } from "@/components/forms/form-footer";
import { ArrowRightLeft } from "lucide-react";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

export interface MoveRoomFormProps {
  title: string;
  entityDisplayName: string;
  roomId: number;
  getSuccessMessage: (destinationName: string) => string;
  getErrorMessage: () => string;
  onSuccess?: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactElement;
}

function MoveRoomFormBody({
  title,
  entityDisplayName,
  roomId,
  getSuccessMessage,
  getErrorMessage,
  onSuccess,
  onClose,
}: {
  title: string;
  entityDisplayName: string;
  roomId: number;
  getSuccessMessage: (destinationName: string) => string;
  getErrorMessage: () => string;
  onSuccess?: () => void;
  onClose: () => void;
}) {
  const { buildings } = useBuildings();
  const [selectedBuildingId, setSelectedBuildingId] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const buildingId = selectedBuildingId ? parseInt(selectedBuildingId, 10) : null;
      const response = await updateRoom(roomId, {
        building_id: buildingId,
      });

      if (response.error) {
        throw new Error(response.error);
      }

      const destinationName = buildingId
        ? (buildings.find((b) => b.id === buildingId)?.name || `Здание #${buildingId}`)
        : "без здания";

      toast.success(getSuccessMessage(destinationName));

      setSelectedBuildingId("");
      onSuccess?.();
      await new Promise((resolve) => setTimeout(resolve, 200));
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : getErrorMessage());
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <SheetHeader>
        <SheetTitle>{title}</SheetTitle>
        <SheetDescription>{entityDisplayName}</SheetDescription>
      </SheetHeader>
      <form onSubmit={handleSubmit}>
        <div className="px-4">
          <FieldGroup>
            <BuildingCombobox
              selectedBuildingId={selectedBuildingId}
              onBuildingIdChange={setSelectedBuildingId}
              disabled={isSubmitting}
              label="Здание назначения"
              id="move-room-building"
            />

            <ErrorMessage message={error || ""} />
          </FieldGroup>
        </div>
        <FormFooter
          isSubmitting={isSubmitting}
          onCancel={onClose}
          submitLabel="Переместить"
          disabled={false}
        />
      </form>
    </>
  );
}

export default function MoveRoomForm({
  title,
  entityDisplayName,
  roomId,
  getSuccessMessage,
  getErrorMessage,
  onSuccess,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  trigger,
}: MoveRoomFormProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined && controlledOnOpenChange !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = useMemo(
    () => (isControlled ? (controlledOnOpenChange ?? (() => { })) : setInternalOpen),
    [isControlled, controlledOnOpenChange]
  );

  const handleSheetOpenChange = useCallback(
    (newOpen: boolean) => {
      setOpen(newOpen);
    },
    [setOpen]
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
        {open ? (
          <MoveRoomFormBody
            title={title}
            entityDisplayName={entityDisplayName}
            roomId={roomId}
            getSuccessMessage={getSuccessMessage}
            getErrorMessage={getErrorMessage}
            onSuccess={onSuccess}
            onClose={() => setOpen(false)}
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
