/**
 * Логика быстрого перемещения: определение источника и назначения по двум отсканированным сущностям.
 * Иерархия: room (верх) → place → container → item (низ). Источник — сущность ниже по иерархии.
 */

import type { EntityTypeName, DestinationType } from "@/types/entity";
import type { EntityQrPayload } from "./qr-code";

/** Уровень в иерархии: больший уровень = источник (перемещаемая сущность). */
export const ENTITY_LEVEL: Record<EntityTypeName, number> = {
  room: 0,
  place: 1,
  container: 2,
  item: 3,
};

export interface QuickMoveResult {
  sourceType: EntityTypeName;
  sourceId: number;
  destType: DestinationType;
  destId: number;
}

/**
 * Определяет, какую сущность перемещать и куда, по двум отсканированным payload.
 * Типы должны быть разными. Room всегда назначение.
 */
export const resolveQuickMove = (
  a: EntityQrPayload,
  b: EntityQrPayload
): QuickMoveResult | null => {
  if (a.type === b.type) return null;

  if (a.type === "room") {
    return { sourceType: b.type, sourceId: b.id, destType: "room", destId: a.id };
  }
  if (b.type === "room") {
    return { sourceType: a.type, sourceId: a.id, destType: "room", destId: b.id };
  }

  const levelA = ENTITY_LEVEL[a.type];
  const levelB = ENTITY_LEVEL[b.type];
  if (levelA > levelB) {
    return { sourceType: a.type, sourceId: a.id, destType: b.type as DestinationType, destId: b.id };
  }
  return { sourceType: b.type, sourceId: b.id, destType: a.type as DestinationType, destId: a.id };
};
