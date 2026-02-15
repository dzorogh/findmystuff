"use client";

import { useState, useCallback, useMemo } from "react";
import { createTransition } from "@/lib/entities/api";
import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import { toast } from "sonner";
import { useUser } from "@/lib/users/context";
import { useFurniture } from "@/lib/furniture/hooks/use-furniture";
import FurnitureCombobox from "@/components/fields/furniture-combobox";
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

export interface MovePlaceFormProps {
  title: string;
  entityDisplayName: string;
  placeId: number;
  getSuccessMessage: (destinationName: string) => string;
  getErrorMessage: () => string;
  onSuccess?: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactElement;
}

function MovePlaceFormBody({
  title,
  entityDisplayName,
  placeId,
  getSuccessMessage,
  getErrorMessage,
  onSuccess,
  onClose,
}: {
  title: string;
  entityDisplayName: string;
  placeId: number;
  getSuccessMessage: (destinationName: string) => string;
  getErrorMessage: () => string;
  onSuccess?: () => void;
  onClose: () => void;
}) {
  const { furniture } = useFurniture();
  const [selectedFurnitureId, setSelectedFurnitureId] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const furnitureId = selectedFurnitureId ? parseInt(selectedFurnitureId, 10) : null;
      if (!furnitureId) {
        setError("Выберите мебель назначения");
        setIsSubmitting(false);
        return;
      }

      const response = await createTransition({
        place_id: placeId,
        destination_type: "furniture",
        destination_id: furnitureId,
      });

      if (response.error) {
        throw new Error(response.error);
      }

      const destinationName =
        furniture.find((f) => f.id === furnitureId)?.name || `Мебель #${furnitureId}`;

      toast.success(getSuccessMessage(destinationName));

      setSelectedFurnitureId("");
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
            <FurnitureCombobox
              selectedFurnitureId={selectedFurnitureId}
              onFurnitureIdChange={setSelectedFurnitureId}
              disabled={isSubmitting}
              label="Мебель назначения"
              id="move-place-furniture"
              required
            />

            <ErrorMessage message={error || ""} />
          </FieldGroup>
        </div>
        <FormFooter
          isSubmitting={isSubmitting}
          onCancel={onClose}
          submitLabel="Переместить"
          disabled={!selectedFurnitureId}
        />
      </form>
    </>
  );
}

export default function MovePlaceForm({
  title,
  entityDisplayName,
  placeId,
  getSuccessMessage,
  getErrorMessage,
  onSuccess,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  trigger,
}: MovePlaceFormProps) {
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
          <MovePlaceFormBody
            title={title}
            entityDisplayName={entityDisplayName}
            placeId={placeId}
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
