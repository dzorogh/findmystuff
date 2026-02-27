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
  firstScan: EntityQrPayload,
  secondScan: EntityQrPayload
): QuickMoveResult | null => {
  if (firstScan.type === secondScan.type) return null;
  if (firstScan.type === "building" || secondScan.type === "building") return null;

  if (firstScan.type === "room") {
    if (secondScan.type === "place") return null;
    return {
      sourceType: secondScan.type,
      sourceId: secondScan.id,
      destType: "room",
      destId: firstScan.id,
    };
  }
  if (secondScan.type === "room") {
    if (firstScan.type === "place") return null;
    return {
      sourceType: firstScan.type,
      sourceId: firstScan.id,
      destType: "room",
      destId: secondScan.id,
    };
  }
  if (firstScan.type === "furniture") {
    return {
      sourceType: secondScan.type,
      sourceId: secondScan.id,
      destType: "furniture",
      destId: firstScan.id,
    };
  }
  if (secondScan.type === "furniture") {
    return {
      sourceType: firstScan.type,
      sourceId: firstScan.id,
      destType: "furniture",
      destId: secondScan.id,
    };
  }

  const levelFirst = ENTITY_LEVEL[firstScan.type];
  const levelSecond = ENTITY_LEVEL[secondScan.type];
  if (levelFirst > levelSecond) {
    return {
      sourceType: firstScan.type,
      sourceId: firstScan.id,
      destType: secondScan.type as DestinationType,
      destId: secondScan.id,
    };
  }
  return {
    sourceType: secondScan.type,
    sourceId: secondScan.id,
    destType: firstScan.type as DestinationType,
    destId: firstScan.id,
  };
};
