"use client";

import { useCallback } from "react";
import { toast } from "sonner";
import { printEntityLabel } from "@/lib/label-print";
import type { LabelEntityType } from "@/lib/entity-display-name";

const PRINT_ERROR_MESSAGE = "Не удалось открыть окно печати";

/**
 * Возвращает функцию печати этикетки для заданного типа сущности.
 * Ошибки показываются через toast — не нужно дублировать try/catch в компонентах.
 */
export const usePrintEntityLabel = (entityType: LabelEntityType) => {
  const printLabel = useCallback(
    async (entityId: number, name: string | null): Promise<void> => {
      try {
        await printEntityLabel(entityType, entityId, name);
      } catch (err) {
        console.error("Ошибка печати этикетки:", err);
        toast.error(err instanceof Error ? err.message : PRINT_ERROR_MESSAGE);
      }
    },
    [entityType]
  );

  return printLabel;
};
