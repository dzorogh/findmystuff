"use client";

import { useState, useEffect, useCallback } from "react";
import { flushSync } from "react-dom";
import { useParams, useRouter } from "next/navigation";
import { useCurrentPage } from "@/lib/app/contexts/current-page-context";
import { useUser } from "@/lib/users/context";
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
  isUserLoading: boolean;
  user: ReturnType<typeof useUser>["user"];
  isEditDialogOpen: boolean;
  setIsEditDialogOpen: (open: boolean) => void;
  isMoveDialogOpen: boolean;
  setIsMoveDialogOpen: (open: boolean) => void;
  handleEditSuccess: () => void;
  handleMoveSuccess: () => void;
  loadItemData: () => Promise<void>;
  entityLabel: string;
}

export const useItemDetail = (): UseItemDetailReturn => {
  const params = useParams();
  const router = useRouter();
  const itemId = parseInt(params.id as string);
  const { user, isLoading: isUserLoading } = useUser();
  const { setEntityName, setIsLoading, setEntityActions } = useCurrentPage();

  const [item, setItem] = useState<Item | null>(null);
  const [transitions, setTransitions] = useState<Transition[]>([]);
  const [isLoading, setIsPageLoading] = useState(true);
  const [isLoadingTransitions, setIsLoadingTransitions] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isMoveDialogOpen, setIsMoveDialogOpen] = useState(false);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push("/");
    }
  }, [isUserLoading, user, router]);

  const loadItemData = useCallback(async () => {
    if (!user) return;
    setIsPageLoading(true);
    setIsLoading(true);
    setError(null);
    try {
      const loadedItem = await fetchItemById(itemId);
      setItem(loadedItem);
      const nameToSet = loadedItem.name ?? `Вещь #${loadedItem.id}`;
      flushSync(() => setEntityName(nameToSet));
      setIsLoading(false);
      setIsPageLoading(false);
      setIsLoadingTransitions(true);
      try {
        const loadedTransitions = await fetchItemTransitions(itemId);
        setTransitions(loadedTransitions);
      } finally {
        setIsLoadingTransitions(false);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : LOAD_ERROR_MESSAGE;
      setError(message);
      setEntityName(null);
      setIsLoading(false);
      setIsPageLoading(false);
    }
  }, [user, itemId, setEntityName, setIsLoading]);

  useEntityDataLoader({
    user,
    isUserLoading,
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

  useEffect(() => {
    if (!item) {
      setEntityActions(null);
      return;
    }
    setEntityActions(
      <EntityActions
        isDeleted={!!item.deleted_at}
        isDeleting={isDeleting}
        isRestoring={isRestoring}
        onEdit={() => setIsEditDialogOpen(true)}
        onMove={() => setIsMoveDialogOpen(true)}
        onPrintLabel={() => printLabel(item.id, item.name)}
        onDelete={handleDelete}
        onRestore={handleRestore}
      />
    );
    return () => setEntityActions(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- handlers from hooks; re-run only when entity/loading state changes
  }, [item, isDeleting, isRestoring]);

  const handleEditSuccess = useCallback(() => {
    setIsEditDialogOpen(false);
    loadItemData();
  }, [loadItemData]);

  const handleMoveSuccess = useCallback(() => {
    setIsMoveDialogOpen(false);
    loadItemData();
  }, [loadItemData]);

  return {
    itemId,
    item,
    transitions,
    isLoading,
    isLoadingTransitions,
    error,
    isUserLoading,
    user,
    isEditDialogOpen,
    setIsEditDialogOpen,
    isMoveDialogOpen,
    setIsMoveDialogOpen,
    handleEditSuccess,
    handleMoveSuccess,
    loadItemData,
    entityLabel: ENTITY_LABEL,
  };
};
