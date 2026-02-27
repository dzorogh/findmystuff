"use client";

import { useCallback } from "react";
import { toast } from "sonner";
import { softDeleteApiClient } from "@/lib/shared/api/soft-delete";
import { duplicateEntityApiClient } from "@/lib/shared/api/duplicate-entity";
import { usePrintEntityLabel } from "@/lib/entities/hooks/use-print-entity-label";
import { logError } from "@/lib/shared/logger";

interface UseItemListActionsParams {
  refreshList: () => void;
}

export function useItemListActions({ refreshList }: UseItemListActionsParams) {
  const handlePrintLabel = usePrintEntityLabel("item");
  const runItemAction = useCallback(
    async (
      itemId: number,
      options: {
        confirm?: boolean;
        api: () => Promise<{ error?: string }>;
        successMsg: string;
        errorMsg: string;
      }
    ) => {
      if (options.confirm && !confirm("Вы уверены, что хотите удалить эту вещь?")) return;
      try {
        const response = await options.api();
        if (response.error) throw new Error(response.error);
        toast.success(options.successMsg);
        refreshList();
      } catch (err) {
        logError(`Ошибка ${options.errorMsg}:`, err);
        toast.error(`Произошла ошибка ${options.errorMsg}`);
      }
    },
    [refreshList]
  );

  const handleDeleteItem = useCallback(
    (itemId: number) =>
      runItemAction(itemId, {
        confirm: true,
        api: () => softDeleteApiClient.softDelete("items", itemId),
        successMsg: "Вещь успешно удалена",
        errorMsg: "при удалении вещи",
      }),
    [runItemAction]
  );

  const handleRestoreItem = useCallback(
    (itemId: number) =>
      runItemAction(itemId, {
        api: () => softDeleteApiClient.restoreDeleted("items", itemId),
        successMsg: "Вещь успешно восстановлена",
        errorMsg: "при восстановлении вещи",
      }),
    [runItemAction]
  );

  const handleDuplicateItem = useCallback(
    (itemId: number) =>
      runItemAction(itemId, {
        api: () => duplicateEntityApiClient.duplicate("items", itemId),
        successMsg: "Вещь успешно дублирована",
        errorMsg: "при дублировании вещи",
      }),
    [runItemAction]
  );

  return { handleDeleteItem, handleRestoreItem, handleDuplicateItem, handlePrintLabel };
}
