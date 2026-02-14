"use client";

import { useCallback, useMemo } from "react";
import type { Room } from "@/types/entity";
import type { EntityActionsCallbacks } from "@/components/entity-detail/entity-actions";
import { usePrintEntityLabel } from "@/lib/entities/hooks/use-print-entity-label";
import { softDeleteApi } from "@/lib/shared/api/soft-delete";
import { duplicateEntityApi } from "@/lib/shared/api/duplicate-entity";
import { toast } from "sonner";
import type { EntityLabels, MoveConfig, TableName } from "@/lib/app/types/entity-config";
import { getEntityDisplayName } from "@/lib/entities/helpers/display-name";

interface UseRoomsActionsParams {
  refreshList: () => void;
  basePath: string;
  apiTable: TableName;
  labels: EntityLabels;
  move?: MoveConfig;
}

export function useRoomsActions({
  refreshList,
  basePath,
  apiTable,
  labels,
  move,
}: UseRoomsActionsParams) {
  const printRoom = usePrintEntityLabel("room");
  const singularLower = labels.singular.toLowerCase();
  const moveEnabled = move?.enabled ?? false;

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
            ? () => softDeleteApi.softDelete(apiTable, entityId)
            : action === "restore"
              ? () => softDeleteApi.restoreDeleted(apiTable, entityId)
              : () => duplicateEntityApi.duplicate(apiTable, entityId);
        const res = await api();
        if (res.error) throw new Error(res.error);
        toast.success(messages.success);
        refreshList();
      } catch (err) {
        console.error(err);
        toast.error(messages.error);
      }
    },
    [apiTable, refreshList]
  );

  const getRowActions = useCallback(
    (room: Room): EntityActionsCallbacks => ({
      editHref: `${basePath}/${room.id}`,
      moveRoomForm: moveEnabled
        ? {
            title: labels.moveTitle,
            entityDisplayName: getEntityDisplayName("room", room.id, room.name),
            roomId: room.id,
            getSuccessMessage: labels.moveSuccess,
            getErrorMessage: () => labels.moveError,
            onSuccess: refreshList,
          }
        : undefined,
      onDelete: () =>
        runEntityAction(room.id, "delete", {
          confirm: labels.deleteConfirm ?? `Вы уверены, что хотите удалить ${singularLower}?`,
          success: labels.deleteSuccess ?? `${labels.singular} успешно удалено`,
          error: `Произошла ошибка при удалении ${singularLower}`,
        }),
      onRestore: () =>
        runEntityAction(room.id, "restore", {
          success: labels.restoreSuccess ?? `${labels.singular} успешно восстановлено`,
          error: `Произошла ошибка при восстановлении ${singularLower}`,
        }),
      onDuplicate: () =>
        runEntityAction(room.id, "duplicate", {
          success: labels.duplicateSuccess ?? `${labels.singular} успешно дублировано`,
          error: `Произошла ошибка при дублировании ${singularLower}`,
        }),
      onPrintLabel: () => printRoom(room.id, room.name),
    }),
    [basePath, labels.deleteConfirm, labels.deleteSuccess, labels.duplicateSuccess, labels.moveError, labels.moveSuccess, labels.moveTitle, labels.restoreSuccess, labels.singular, moveEnabled, printRoom, refreshList, runEntityAction, singularLower]
  );

  return getRowActions;
}
