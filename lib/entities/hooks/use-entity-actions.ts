import { useState } from "react";
import { toast } from "sonner";
import { softDeleteApi } from "@/lib/shared/api/soft-delete";

interface UseEntityActionsOptions {
  entityType: "containers" | "items" | "places" | "rooms";
  entityId: number;
  entityName: string;
  onSuccess?: () => void;
}

export const useEntityActions = ({
  entityType,
  entityId,
  entityName,
  onSuccess,
}: UseEntityActionsOptions) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`Вы уверены, что хотите удалить этот ${entityName}?`)) return;
    setIsDeleting(true);
    try {
      const response = await softDeleteApi.softDelete(entityType, entityId);
      if (response.error) throw new Error(response.error);
      toast.success(`${entityName} успешно удален`);
      onSuccess?.();
    } catch (err) {
      console.error(`Ошибка при удалении ${entityName}:`, err);
      toast.error(`Произошла ошибка при удалении ${entityName}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRestore = async () => {
    setIsRestoring(true);
    try {
      const response = await softDeleteApi.restoreDeleted(entityType, entityId);
      if (response.error) throw new Error(response.error);
      toast.success(`${entityName} успешно восстановлен`);
      onSuccess?.();
    } catch (err) {
      console.error(`Ошибка при восстановлении ${entityName}:`, err);
      toast.error(`Произошла ошибка при восстановлении ${entityName}`);
    } finally {
      setIsRestoring(false);
    }
  };

  return { isDeleting, isRestoring, handleDelete, handleRestore };
};
