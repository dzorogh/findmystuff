"use client";

import { useCallback } from "react";
import type { Room } from "@/types/entity";
import type { EntityActionsCallbacks } from "@/lib/entities/components/entity-actions";
import { usePrintEntityLabel } from "@/lib/entities/hooks/use-print-entity-label";
import { softDeleteApi } from "@/lib/shared/api/soft-delete";
import { duplicateEntityApi } from "@/lib/shared/api/duplicate-entity";
import { toast } from "sonner";

interface UseRoomsListRowActionsParams {
  refreshList: () => void;
}

export function useRoomsListRowActions({ refreshList }: UseRoomsListRowActionsParams) {
  const printRoom = usePrintEntityLabel("room");

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
            ? () => softDeleteApi.softDelete("rooms", entityId)
            : action === "restore"
              ? () => softDeleteApi.restoreDeleted("rooms", entityId)
              : () => duplicateEntityApi.duplicate("rooms", entityId);
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
    (room: Room): EntityActionsCallbacks => ({
      editHref: `/rooms/${room.id}`,
      onDelete: () =>
        runEntityAction(room.id, "delete", {
          confirm: "Вы уверены, что хотите удалить это помещение?",
          success: "Помещение успешно удалено",
          error: "Произошла ошибка при удалении помещения",
        }),
      onRestore: () =>
        runEntityAction(room.id, "restore", {
          success: "Помещение успешно восстановлено",
          error: "Произошла ошибка при восстановлении помещения",
        }),
      onDuplicate: () =>
        runEntityAction(room.id, "duplicate", {
          success: "Помещение успешно дублировано",
          error: "Произошла ошибка при дублировании помещения",
        }),
      onPrintLabel: () => printRoom(room.id, room.name),
    }),
    [runEntityAction, printRoom]
  );

  return getRowActions;
}
