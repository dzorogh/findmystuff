"use client";

import { useCallback } from "react";
import type { Furniture } from "@/types/entity";
import type { EntityActionsCallbacks } from "@/components/entity-detail/entity-actions";
import { usePrintEntityLabel } from "@/lib/entities/hooks/use-print-entity-label";
import { softDeleteApi } from "@/lib/shared/api/soft-delete";
import { duplicateEntityApi } from "@/lib/shared/api/duplicate-entity";
import { toast } from "sonner";
import type { EntityLabels, TableName } from "@/lib/app/types/entity-config";

interface UseFurnitureActionsParams {
  refreshList: () => void;
  basePath: string;
  apiTable: TableName;
  labels: EntityLabels;
}

export function useFurnitureActions({
  refreshList,
  basePath,
  apiTable,
  labels,
}: UseFurnitureActionsParams) {
  const printFurniture = usePrintEntityLabel("furniture");
  const singularLower = labels.singular.toLowerCase();

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
    (furniture: Furniture): EntityActionsCallbacks => ({
      editHref: `${basePath}/${furniture.id}`,
      onDelete: () =>
        runEntityAction(furniture.id, "delete", {
          confirm: labels.deleteConfirm ?? `Вы уверены, что хотите удалить ${singularLower}?`,
          success: labels.deleteSuccess ?? `${labels.singular} успешно удалена`,
          error: `Произошла ошибка при удалении ${singularLower}`,
        }),
      onRestore: () =>
        runEntityAction(furniture.id, "restore", {
          success: labels.restoreSuccess ?? `${labels.singular} успешно восстановлена`,
          error: `Произошла ошибка при восстановлении ${singularLower}`,
        }),
      onDuplicate: () =>
        runEntityAction(furniture.id, "duplicate", {
          success: labels.duplicateSuccess ?? `${labels.singular} успешно дублирована`,
          error: `Произошла ошибка при дублировании ${singularLower}`,
        }),
      onPrintLabel: () => printFurniture(furniture.id, furniture.name),
    }),
    [basePath, labels.deleteConfirm, labels.deleteSuccess, labels.duplicateSuccess, labels.restoreSuccess, labels.singular, printFurniture, runEntityAction, singularLower]
  );

  return getRowActions;
}
