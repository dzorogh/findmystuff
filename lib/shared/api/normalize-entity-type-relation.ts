/**
 * Нормализация связи entity_type из Supabase: select может вернуть один объект или массив.
 * Используется в [id]-маршрутах (items, places, containers, rooms, buildings).
 */

export interface EntityTypeRelation {
  name?: string | null;
}

/**
 * Приводит entity_types / entity_type к одному объекту или null.
 */
export function normalizeEntityTypeRelation<T extends EntityTypeRelation>(
  relation: T | T[] | null | undefined
): T | null {
  if (relation == null) return null;
  return Array.isArray(relation) ? (relation[0] ?? null) : relation;
}
