/**
 * Печать этикетки для сущности с QR-кодом (тип сущности + id).
 * Печать выполняется через отдельную страницу приложения, открываемую в новом окне.
 */

import type { EntityTypeName } from "@/types/entity";

const PRINT_POPUP_BLOCKED_ERROR_MESSAGE =
  "Браузер заблокировал окно печати. Разрешите всплывающие окна и попробуйте снова.";
const LABEL_PRINT_ENDPOINT = "/print/label";

const buildPrintUrl = (
  entityType: EntityTypeName,
  entityId: number,
  name: string | null,
  createdAt: string
): string => {
  const params = new URLSearchParams({
    entityType,
    entityId: String(entityId),
    createdAt,
  });

  if (name && name.trim()) {
    params.set("name", name.trim());
  }

  return `${LABEL_PRINT_ENDPOINT}?${params.toString()}`;
};

/** Печатает этикетку в отдельном окне через `/print/label`. */
export const printEntityLabel = async (
  entityType: EntityTypeName,
  entityId: number,
  name: string | null
): Promise<void> => {
  if (typeof window === "undefined") return;

  const createdAt = new Date().toLocaleDateString("ru-RU", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  const printUrl = buildPrintUrl(entityType, entityId, name, createdAt);
  const printWindow = window.open(printUrl, "_blank");

  if (!printWindow) {
    throw new Error(PRINT_POPUP_BLOCKED_ERROR_MESSAGE);
  }

  printWindow.focus();
};
