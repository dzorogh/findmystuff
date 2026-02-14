/**
 * Единое место формирования отображаемого имени сущности (список, этикетка, заголовок и т.д.).
 * При отсутствии имени возвращается «Тип #id», например «Контейнер #3».
 */

import type { EntityTypeName } from "@/types/entity";

export type LabelEntityType = EntityTypeName;

export const ENTITY_TYPE_LABELS: Record<EntityTypeName, string> = {
  item: "Вещь",
  place: "Место",
  container: "Контейнер",
  room: "Помещение",
  building: "Здание",
  furniture: "Мебель",
};

/**
 * Возвращает отображаемое имя сущности: name, если задано и не пустое, иначе «Тип #id».
 */
export const getEntityDisplayName = (
  entityType: EntityTypeName,
  entityId: number,
  name: string | null
): string => (name != null && name.trim() !== "" ? name : `${ENTITY_TYPE_LABELS[entityType]} #${entityId}`);
