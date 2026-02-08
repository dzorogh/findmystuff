"use client";

import { useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRightLeft } from "lucide-react";
import type { Place } from "@/types/entity";
import type { EntityActionsCallbacks } from "@/lib/entities/components/entity-actions";
import { usePrintEntityLabel } from "@/lib/entities/hooks/use-print-entity-label";
import { softDeleteApi } from "@/lib/shared/api/soft-delete";
import { duplicateEntityApi } from "@/lib/shared/api/duplicate-entity";
import { toast } from "sonner";

interface UsePlacesListRowActionsParams {
  refreshList: () => void;
  setMovingId: (id: number | null) => void;
}

export function usePlacesListRowActions({
  refreshList,
  setMovingId,
}: UsePlacesListRowActionsParams) {
  const printPlace = usePrintEntityLabel("place");

  const runEntityAction = useCallback(
    async (
      entityId: number,
      action: "delete" | "restore" | "duplicate",
      messages: { confirm?: string; success: string; error: string }
    ) => {
      if (action === "delete" && messages.confirm && !confirm(messages.confirm)) return;
      try {
        const api =
          action === "delete"
            ? () => softDeleteApi.softDelete("places", entityId)
            : action === "restore"
              ? () => softDeleteApi.restoreDeleted("places", entityId)
              : () => duplicateEntityApi.duplicate("places", entityId);
        const res = await api();
        if (res.error) throw new Error(res.error);
        toast.success(messages.success);
        refreshList();
      } catch (err) {
        console.error(err);
        toast.error(messages.error);
      }
    },
    [refreshList]
  );

  const getRowActions = useCallback(
    (place: Place): EntityActionsCallbacks => ({
      editHref: `/places/${place.id}`,
      moveAction: (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setMovingId(place.id)}
          className="w-full justify-start gap-2"
        >
          <ArrowRightLeft className="h-4 w-4" />
          Переместить
        </Button>
      ),
      onDelete: () =>
        runEntityAction(place.id, "delete", {
          confirm: "Вы уверены, что хотите удалить это место?",
          success: "Место успешно удалено",
          error: "Произошла ошибка при удалении места",
        }),
      onRestore: () =>
        runEntityAction(place.id, "restore", {
          success: "Место успешно восстановлено",
          error: "Произошла ошибка при восстановлении места",
        }),
      onDuplicate: () =>
        runEntityAction(place.id, "duplicate", {
          success: "Место успешно дублировано",
          error: "Произошла ошибка при дублировании места",
        }),
      onPrintLabel: () => printPlace(place.id, place.name),
    }),
    [runEntityAction, printPlace, setMovingId]
  );

  return getRowActions;
}
