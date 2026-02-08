"use client";

import { useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRightLeft } from "lucide-react";
import type { Container } from "@/types/entity";
import type { EntityActionsCallbacks } from "@/lib/entities/components/entity-actions";
import { usePrintEntityLabel } from "@/lib/entities/hooks/use-print-entity-label";
import { softDeleteApi } from "@/lib/shared/api/soft-delete";
import { duplicateEntityApi } from "@/lib/shared/api/duplicate-entity";
import { toast } from "sonner";

interface UseContainersListRowActionsParams {
  refreshList: () => void;
  setMovingId: (id: number | null) => void;
}

export function useContainersListRowActions({
  refreshList,
  setMovingId,
}: UseContainersListRowActionsParams) {
  const printContainer = usePrintEntityLabel("container");

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
            ? () => softDeleteApi.softDelete("containers", entityId)
            : action === "restore"
              ? () => softDeleteApi.restoreDeleted("containers", entityId)
              : () => duplicateEntityApi.duplicate("containers", entityId);
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
    (container: Container): EntityActionsCallbacks => ({
      editHref: `/containers/${container.id}`,
      moveAction: (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setMovingId(container.id)}
          className="w-full justify-start gap-2"
        >
          <ArrowRightLeft className="h-4 w-4" />
          Переместить
        </Button>
      ),
      onDelete: () =>
        runEntityAction(container.id, "delete", {
          confirm: "Вы уверены, что хотите удалить этот контейнер?",
          success: "Контейнер успешно удалён",
          error: "Произошла ошибка при удалении контейнера",
        }),
      onRestore: () =>
        runEntityAction(container.id, "restore", {
          success: "Контейнер успешно восстановлен",
          error: "Произошла ошибка при восстановлении контейнера",
        }),
      onDuplicate: () =>
        runEntityAction(container.id, "duplicate", {
          success: "Контейнер успешно дублирован",
          error: "Произошла ошибка при дублировании контейнера",
        }),
      onPrintLabel: () => printContainer(container.id, container.name),
    }),
    [runEntityAction, printContainer, setMovingId]
  );

  return getRowActions;
}
