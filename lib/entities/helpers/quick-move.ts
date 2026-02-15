/**
 * Логика быстрого перемещения: определение источника и назначения по двум отсканированным сущностям.
 * Иерархия: room (верх) → furniture → place → container → item (низ). Источник — сущность ниже по иерархии.
 */

import type { EntityTypeName, DestinationType } from "@/types/entity";
import type { EntityQrPayload } from "./qr-code";

/** Уровень в иерархии: больший уровень = источник (перемещаемая сущность). */
export const ENTITY_LEVEL: Record<EntityTypeName, number> = {
  building: -1,
  room: 0,
  furniture: 1,
  place: 2,
  container: 3,
  item: 4,
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
  // Building не поддерживается как назначение при быстром перемещении
  if (a.type === "building" || b.type === "building") return null;

  // Места можно перемещать только в мебель, не в помещения
  if (a.type === "room") {
    if (b.type === "place") return null;
    return { sourceType: b.type, sourceId: b.id, destType: "room", destId: a.id };
  }
  if (b.type === "room") {
    if (a.type === "place") return null;
    return { sourceType: a.type, sourceId: a.id, destType: "room", destId: b.id };
  }
  if (a.type === "furniture") {
    return { sourceType: b.type, sourceId: b.id, destType: "furniture", destId: a.id };
  }
  if (b.type === "furniture") {
    return { sourceType: a.type, sourceId: a.id, destType: "furniture", destId: b.id };
  }

  const levelA = ENTITY_LEVEL[a.type];
  const levelB = ENTITY_LEVEL[b.type];
  if (levelA > levelB) {
    return { sourceType: a.type, sourceId: a.id, destType: b.type as DestinationType, destId: b.id };
  }
  return { sourceType: b.type, sourceId: b.id, destType: a.type as DestinationType, destId: a.id };
};
