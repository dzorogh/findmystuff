"use client";

import { useState, useCallback, useMemo } from "react";
import { useParams } from "next/navigation";
import { ArrowRightLeft, Printer, RotateCcw, Trash2 } from "lucide-react";
import { useTenant } from "@/contexts/tenant-context";
import { useEntityDataLoader } from "@/lib/entities/hooks/use-entity-data-loader";
import { useEntityActions } from "@/lib/entities/hooks/use-entity-actions";
import { usePrintEntityLabel } from "@/lib/entities/hooks/use-print-entity-label";
import { fetchItemById, fetchItemTransitions } from "@/lib/entities/services/item-detail";
import { EntityActions } from "@/components/entity-detail/entity-actions";
import type { Action } from "@/types/entity";
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
  const { activeTenantId } = useTenant();
  const itemId = parseInt(params.id as string);
  const [item, setItem] = useState<Item | null>(null);
  const [transitions, setTransitions] = useState<Transition[]>([]);
  const [isLoading, setIsPageLoading] = useState(true);
  const [isLoadingTransitions, setIsLoadingTransitions] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMoveDialogOpen, setIsMoveDialogOpen] = useState(false);

  const loadItemData = useCallback(
    async (options?: { silent?: boolean }) => {
      if (activeTenantId == null) return;
      const silent = options?.silent ?? false;
      if (!silent) setIsPageLoading(true);
      setError(null);
      try {
        const loadedItem = await fetchItemById(itemId, activeTenantId);
        setItem(loadedItem);
        if (!silent) setIsLoadingTransitions(true);
        try {
          const loadedTransitions = await fetchItemTransitions(itemId, activeTenantId);
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
    [itemId, activeTenantId]
  );

  useEntityDataLoader({
    entityId: itemId,
    loadData: loadItemData,
  });

  const { handleDelete, handleRestore } = useEntityActions({
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

  const headerActions = useMemo(() => {
    if (item == null) return null;
    const actions: Action[] = item.deleted_at
      ? [{ key: "restore", label: "Восстановить", icon: RotateCcw, onClick: handleRestore }]
      : [
          { key: "move", label: "Переместить", icon: ArrowRightLeft, variant: "default", onClick: () => setIsMoveDialogOpen(true) },
          { key: "printLabel", label: "Печать этикетки", icon: Printer, variant: "default", onClick: () => printLabel(item.id, item.name) },
          { key: "delete", label: "Удалить", icon: Trash2, variant: "destructive", onClick: handleDelete },
        ];
    return <EntityActions actions={actions} />;
  }, [item, handleDelete, handleRestore, printLabel]);

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
