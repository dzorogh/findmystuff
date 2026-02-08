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
import type { EntityLabels, MoveConfig, TableName } from "@/lib/app/types/entity-config";
import MoveEntityForm from "@/components/forms/move-entity-form";
import { getEntityDisplayName } from "@/lib/entities/helpers/display-name";

interface UseContainersActionsParams {
  refreshList: () => void;
  basePath: string;
  apiTable: TableName;
  labels: EntityLabels;
  move?: MoveConfig;
}

export function useContainersActions({
  refreshList,
  basePath,
  apiTable,
  labels,
  move,
}: UseContainersActionsParams) {
  const printContainer = usePrintEntityLabel("container");
  const singularLower = labels.singular.toLowerCase();
  const moveEnabled = move?.enabled ?? false;
  const destinationTypes = move?.destinationTypes ?? ["room", "place", "container"];

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
    (container: Container): EntityActionsCallbacks => ({
      editHref: `${basePath}/${container.id}`,
      moveAction: moveEnabled ? (
        <MoveEntityForm
          title={labels.moveTitle}
          entityDisplayName={getEntityDisplayName("container", container.id, container.name)}
          destinationTypes={destinationTypes}
          buildPayload={(destinationType, destinationId) => ({
            container_id: container.id,
            destination_type: destinationType,
            destination_id: destinationId,
          })}
          getSuccessMessage={labels.moveSuccess}
          getErrorMessage={() => labels.moveError}
          excludeContainerId={container.id}
          onSuccess={refreshList}
          trigger={
            <Button variant="ghost" size="sm" className="w-full justify-start gap-2">
              <ArrowRightLeft className="h-4 w-4" />
              Переместить
            </Button>
          }
        />
      ) : undefined,
      onDelete: () =>
        runEntityAction(container.id, "delete", {
          confirm: labels.deleteConfirm ?? `Вы уверены, что хотите удалить ${singularLower}?`,
          success: labels.deleteSuccess ?? `${labels.singular} успешно удалено`,
          error: `Произошла ошибка при удалении ${singularLower}`,
        }),
      onRestore: () =>
        runEntityAction(container.id, "restore", {
          success: labels.restoreSuccess ?? `${labels.singular} успешно восстановлено`,
          error: `Произошла ошибка при восстановлении ${singularLower}`,
        }),
      onDuplicate: () =>
        runEntityAction(container.id, "duplicate", {
          success: labels.duplicateSuccess ?? `${labels.singular} успешно дублировано`,
          error: `Произошла ошибка при дублировании ${singularLower}`,
        }),
      onPrintLabel: () => printContainer(container.id, container.name),
    }),
    [basePath, destinationTypes, labels.deleteConfirm, labels.deleteSuccess, labels.duplicateSuccess, labels.moveError, labels.moveSuccess, labels.moveTitle, labels.restoreSuccess, labels.singular, moveEnabled, printContainer, refreshList, runEntityAction, singularLower]
  );

  return getRowActions;
}
