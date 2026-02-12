"use client";

import { useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { useEntityDataLoader } from "@/lib/entities/hooks/use-entity-data-loader";
import { useEntityActions } from "@/lib/entities/hooks/use-entity-actions";
import { usePrintEntityLabel } from "@/lib/entities/hooks/use-print-entity-label";
import { fetchItemById, fetchItemTransitions } from "@/lib/entities/services/item-detail";
import { EntityActions } from "@/components/entity-detail/entity-actions";
import type { Item, Transition } from "@/types/entity";

const ENTITY_LABEL = "Вещь";
const LOAD_ERROR_MESSAGE = "Произошла ошибка при загрузке данных";

export interface UseItemDetailReturn {
  itemId: number;
  item: Item | null;
  transitions: Transition[];
  isLoading: boolean;
  isLoadingTransitions: boolean;
  error: string | null;
  isMoveDialogOpen: boolean;
  setIsMoveDialogOpen: (open: boolean) => void;
  handleEditSuccess: () => void;
  handleMoveSuccess: () => void;
  loadItemData: () => Promise<void>;
  entityLabel: string;
  headerActions: React.ReactNode;
}

export const useItemDetail = (): UseItemDetailReturn => {
  const params = useParams();
  const itemId = parseInt(params.id as string);
  const [item, setItem] = useState<Item | null>(null);
  const [transitions, setTransitions] = useState<Transition[]>([]);
  const [isLoading, setIsPageLoading] = useState(true);
  const [isLoadingTransitions, setIsLoadingTransitions] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMoveDialogOpen, setIsMoveDialogOpen] = useState(false);

  const loadItemData = useCallback(
    async (options?: { silent?: boolean }) => {
      const silent = options?.silent ?? false;
      if (!silent) setIsPageLoading(true);
      setError(null);
      try {
        const loadedItem = await fetchItemById(itemId);
        setItem(loadedItem);
        if (!silent) setIsLoadingTransitions(true);
        try {
          const loadedTransitions = await fetchItemTransitions(itemId);
          setTransitions(loadedTransitions);
        } finally {
          if (!silent) setIsLoadingTransitions(false);
        }
        if (!silent) setIsPageLoading(false);
      } catch (err) {
        const message = err instanceof Error ? err.message : LOAD_ERROR_MESSAGE;
        setError(message);
        if (!silent) setIsPageLoading(false);
      }
    },
    [itemId]
  );

  useEntityDataLoader({
    entityId: itemId,
    loadData: loadItemData,
  });

  const { isDeleting, isRestoring, handleDelete, handleRestore } = useEntityActions({
    entityType: "items",
    entityId: itemId,
    entityName: ENTITY_LABEL,
    onSuccess: loadItemData,
  });

  const printLabel = usePrintEntityLabel("item");

  const handleEditSuccess = useCallback(() => {
    loadItemData({ silent: true });
  }, [loadItemData]);

  const handleMoveSuccess = useCallback(() => {
    setIsMoveDialogOpen(false);
    loadItemData();
  }, [loadItemData]);

  const headerActions =
    item != null ? (
      <EntityActions
        actions={{
          actions: ["move", "printLabel", "delete"],
          showRestoreWhenDeleted: true,
        }}
        callbacks={{
          onMove: () => setIsMoveDialogOpen(true),
          onPrintLabel: () => printLabel(item.id, item.name),
          onDelete: handleDelete,
          onRestore: handleRestore,
        }}
        isDeleted={!!item.deleted_at}
        disabled={isDeleting || isRestoring}
        buttonVariant="default"
      />
    ) : null;

  return {
    itemId,
    item,
    transitions,
    isLoading,
    isLoadingTransitions,
    error,
    isMoveDialogOpen,
    setIsMoveDialogOpen,
    handleEditSuccess,
    handleMoveSuccess,
    loadItemData,
    entityLabel: ENTITY_LABEL,
    headerActions,
  };
};
