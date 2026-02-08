"use client";

import { useCallback } from "react";
import type { Item } from "@/types/entity";
import type { EntityActionsCallbacks } from "@/lib/entities/components/entity-actions";
import { useItemListActions } from "@/lib/entities/hooks/use-item-list-actions";
import MoveEntityForm from "@/components/forms/move-entity-form";
import { getEntityDisplayName } from "@/lib/entities/helpers/display-name";
import { ITEMS_LIST_CONFIG } from "@/lib/entities/items/list-config";

interface UseItemsListRowActionsParams {
  refreshList: () => void;
}

const ITEMS_DESTINATION_TYPES = ITEMS_LIST_CONFIG.moveFormConfig.destinationTypes ?? [
  "room",
  "place",
  "container",
];

export function useItemsListRowActions({ refreshList }: UseItemsListRowActionsParams) {
  const itemListActions = useItemListActions({ refreshList });

  const getRowActions = useCallback(
    (item: Item): EntityActionsCallbacks => ({
      editHref: `/items/${item.id}`,
      onDelete: () => itemListActions.handleDeleteItem(item.id),
      onDuplicate: () => itemListActions.handleDuplicateItem(item.id),
      onPrintLabel: () => itemListActions.handlePrintLabel(item.id, item.name),
      onRestore: () => itemListActions.handleRestoreItem(item.id),
      moveAction: (
        <MoveEntityForm
          title="Переместить вещь"
          entityDisplayName={getEntityDisplayName("item", item.id, item.name)}
          destinationTypes={ITEMS_DESTINATION_TYPES}
          buildPayload={(destinationType, destinationId) => ({
            item_id: item.id,
            destination_type: destinationType,
            destination_id: destinationId,
          })}
          getSuccessMessage={(name) => `Вещь успешно перемещена в ${name}`}
          getErrorMessage={() => "Произошла ошибка при перемещении вещи"}
          onSuccess={refreshList}
        />
      ),
    }),
    [itemListActions, refreshList]
  );

  return getRowActions;
}
