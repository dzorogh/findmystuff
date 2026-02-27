import { toast } from "sonner";
import { softDeleteApiClient } from "@/lib/shared/api/soft-delete";
import { duplicateEntityApiClient } from "@/lib/shared/api/duplicate-entity";
import { logErrorOnly } from "@/lib/shared/logger";
import type { TableName } from "@/lib/app/types/entity-config";
import type { EntityLabels } from "@/lib/app/types/entity-config";

export interface EntityListHandlers {
  handleDelete: (id: number) => void;
  handleRestore: (id: number) => void;
  handleDuplicate: (id: number) => void;
}

export function createEntityListHandlers(
  apiTable: TableName,
  labels: EntityLabels,
  refreshList: () => void
): EntityListHandlers {
  const singularLower = labels.singular.toLowerCase();

  const runAction = async (
    entityId: number,
    action: "delete" | "restore" | "duplicate",
    messages: { confirm?: string; success: string; error: string }
  ) => {
    if (action === "delete" && messages.confirm && !confirm(messages.confirm)) return;
    try {
      const res = await (() => {
        switch (action) {
          case "delete":
            return softDeleteApiClient.softDelete(apiTable, entityId);
          case "restore":
            return softDeleteApiClient.restoreDeleted(apiTable, entityId);
          case "duplicate":
            return duplicateEntityApiClient.duplicate(apiTable, entityId);
        }
      })();
      if (res.error) throw new Error(res.error);
      toast.success(messages.success);
      refreshList();
    } catch (err) {
      logErrorOnly(err);
      toast.error(messages.error);
    }
  };

  return {
    handleDelete: (id) =>
      runAction(id, "delete", {
        confirm: labels.deleteConfirm ?? `Вы уверены, что хотите удалить ${singularLower}?`,
        success: labels.deleteSuccess ?? `${labels.singular} успешно удалено`,
        error: labels.deleteError ?? `Произошла ошибка при удалении ${singularLower}`,
      }),
    handleRestore: (id) =>
      runAction(id, "restore", {
        success: labels.restoreSuccess ?? `${labels.singular} успешно восстановлено`,
        error: labels.restoreError ?? `Произошла ошибка при восстановлении ${singularLower}`,
      }),
    handleDuplicate: (id) =>
      runAction(id, "duplicate", {
        success: labels.duplicateSuccess ?? `${labels.singular} успешно дублировано`,
        error: labels.duplicateError ?? `Произошла ошибка при дублировании ${singularLower}`,
      }),
  };
}
