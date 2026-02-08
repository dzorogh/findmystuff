"use client";

import { useCallback, useMemo } from "react";
import type { Item } from "@/types/entity";
import type { EntityActionsCallbacks } from "@/components/entity-detail/entity-actions";
import { useItemListActions } from "@/lib/entities/hooks/use-item-list-actions";
import { getEntityDisplayName } from "@/lib/entities/helpers/display-name";
import type { EntityLabels, MoveConfig } from "@/lib/app/types/entity-config";

interface UseItemsActionsParams {
  refreshList: () => void;
  basePath: string;
  labels: EntityLabels;
  move?: MoveConfig;
}

export function useItemsActions({
  refreshList,
  basePath,
  labels,
  move,
}: UseItemsActionsParams) {
  const itemListActions = useItemListActions({ refreshList });
  const moveEnabled = move?.enabled ?? false;
  const destinationTypes = useMemo(
    () => move?.destinationTypes ?? ["room", "place", "container"],
    [move?.destinationTypes]
  );

  const getRowActions = useCallback(
    (item: Item): EntityActionsCallbacks => ({
      editHref: `${basePath}/${item.id}`,
      onDelete: () => itemListActions.handleDeleteItem(item.id),
      onDuplicate: () => itemListActions.handleDuplicateItem(item.id),
      onPrintLabel: () => itemListActions.handlePrintLabel(item.id, item.name),
      onRestore: () => itemListActions.handleRestoreItem(item.id),
      moveForm: moveEnabled ? {
        title: labels.moveTitle,
        entityDisplayName: getEntityDisplayName("item", item.id, item.name),
        destinationTypes,
        buildPayload: (destinationType, destinationId) => ({
          item_id: item.id,
          destination_type: destinationType,
          destination_id: destinationId,
        }),
        getSuccessMessage: labels.moveSuccess,
        getErrorMessage: () => labels.moveError,
        onSuccess: refreshList,
      } : undefined,
    }),
    [basePath, destinationTypes, itemListActions, labels.moveError, labels.moveSuccess, labels.moveTitle, moveEnabled, refreshList]
  );

  return getRowActions;
}
