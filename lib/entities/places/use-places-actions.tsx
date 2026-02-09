"use client";

import { useCallback, useMemo } from "react";
import type { Place } from "@/types/entity";
import type { EntityActionsCallbacks } from "@/components/entity-detail/entity-actions";
import { usePrintEntityLabel } from "@/lib/entities/hooks/use-print-entity-label";
import { softDeleteApi } from "@/lib/shared/api/soft-delete";
import { duplicateEntityApi } from "@/lib/shared/api/duplicate-entity";
import { toast } from "sonner";
import type { EntityLabels, MoveConfig, TableName } from "@/lib/app/types/entity-config";
import { getEntityDisplayName } from "@/lib/entities/helpers/display-name";

interface UsePlacesActionsParams {
  refreshList: () => void;
  basePath: string;
  apiTable: TableName;
  labels: EntityLabels;
  move?: MoveConfig;
}

export function usePlacesActions({
  refreshList,
  basePath,
  apiTable,
  labels,
  move,
}: UsePlacesActionsParams) {
  const printPlace = usePrintEntityLabel("place");
  const singularLower = labels.singular.toLowerCase();
  const moveEnabled = move?.enabled ?? false;
  const destinationTypes = useMemo(
    () => move?.destinationTypes ?? ["room", "container"],
    [move?.destinationTypes]
  );

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
    (place: Place): EntityActionsCallbacks => ({
      editHref: `${basePath}/${place.id}`,
      moveForm: moveEnabled ? {
        title: labels.moveTitle,
        entityDisplayName: getEntityDisplayName("place", place.id, place.name),
        destinationTypes,
        buildPayload: (destinationType, destinationId) => ({
          place_id: place.id,
          destination_type: destinationType,
          destination_id: destinationId,
        }),
        getSuccessMessage: labels.moveSuccess,
        getErrorMessage: () => labels.moveError,
        onSuccess: refreshList,
      } : undefined,
      onDelete: () =>
        runEntityAction(place.id, "delete", {
          confirm: labels.deleteConfirm ?? `Вы уверены, что хотите удалить ${singularLower}?`,
          success: labels.deleteSuccess ?? `${labels.singular} успешно удалено`,
          error: `Произошла ошибка при удалении ${singularLower}`,
        }),
      onRestore: () =>
        runEntityAction(place.id, "restore", {
          success: labels.restoreSuccess ?? `${labels.singular} успешно восстановлено`,
          error: `Произошла ошибка при восстановлении ${singularLower}`,
        }),
      onDuplicate: () =>
        runEntityAction(place.id, "duplicate", {
          success: labels.duplicateSuccess ?? `${labels.singular} успешно дублировано`,
          error: `Произошла ошибка при дублировании ${singularLower}`,
        }),
      onPrintLabel: () => printPlace(place.id, place.name),
    }),
    [basePath, destinationTypes, labels.deleteConfirm, labels.deleteSuccess, labels.duplicateSuccess, labels.moveError, labels.moveSuccess, labels.moveTitle, labels.restoreSuccess, labels.singular, moveEnabled, printPlace, refreshList, runEntityAction, singularLower]
  );

  return getRowActions;
}
