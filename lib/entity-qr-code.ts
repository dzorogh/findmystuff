/**
 * Формат QR-кода для сущностей приложения (используется при печати этикеток и сканировании).
 * Payload: "entityType:entityId", например "item:123", "place:456", "container:789", "room:1".
 */

import type { EntityTypeName } from "@/types/entity";

const VALID_TYPES: EntityTypeName[] = ["item", "place", "container", "room"];
const TYPE_PATTERN = VALID_TYPES.join("|");
const PAYLOAD_REGEX = new RegExp(`^(${TYPE_PATTERN}):(\\d+)$`);

export type EntityQrPayload = {
  type: EntityTypeName;
  id: number;
};

/**
 * Кодирует тип сущности и id в строку для QR-кода (формат этикеток).
 */
export const encodeEntityQrPayload = (
  entityType: EntityTypeName,
  entityId: number
): string => {
  return `${entityType}:${entityId}`;
};

/**
 * Разбирает строку, считанную из QR-кода, в тип сущности и id.
 * Поддерживает формат этикеток "type:id" и JSON { type, id } (обратная совместимость).
 */
export const parseEntityQrPayload = (raw: string): EntityQrPayload | null => {
  const trimmed = raw.trim();
  if (!trimmed) {
    return null;
  }

  const match = trimmed.match(PAYLOAD_REGEX);
  if (match) {
    const type = match[1] as EntityTypeName;
    const id = parseInt(match[2], 10);
    if (Number.isNaN(id)) {
      return null;
    }
    return { type, id };
  }

  try {
    const parsed = JSON.parse(trimmed);
    if (
      parsed &&
      typeof parsed.type === "string" &&
      VALID_TYPES.includes(parsed.type as EntityTypeName) &&
      typeof parsed.id === "number" &&
      Number.isInteger(parsed.id)
    ) {
      return {
        type: parsed.type as EntityTypeName,
        id: parsed.id,
      };
    }
  } catch {
    // не JSON — игнорируем
  }

  return null;
};
