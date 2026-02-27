/**
 * Серверные хелперы для получения имён сущностей при генерации metadata.
 * Используются в generateMetadata для динамических страниц.
 */

import type { Metadata } from "next";
import { createClient } from "@/lib/shared/supabase/server";
import { getServerUser } from "@/lib/users/server";

/** Совпадает с EntityKind из entity-config и EntityTypeName из types/entity. */
export type EntityType = "item" | "place" | "container" | "room" | "building" | "furniture";

const TABLE_MAP: Record<EntityType, string> = {
  item: "items",
  place: "places",
  container: "containers",
  room: "rooms",
  building: "buildings",
  furniture: "furniture",
};

const FALLBACK_LABELS: Record<EntityType, string> = {
  item: "Вещь",
  place: "Место",
  container: "Контейнер",
  room: "Помещение",
  building: "Здание",
  furniture: "Мебель",
};

export async function getEntityNameForMetadata(
  entityType: EntityType,
  id: number
): Promise<string> {
  const user = await getServerUser();
  if (!user) return FALLBACK_LABELS[entityType];

  const supabase = await createClient();
  const table = TABLE_MAP[entityType];

  const { data, error } = await supabase
    .from(table)
    .select("id, name")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) {
    return FALLBACK_LABELS[entityType];
  }

  return data.name?.trim() || `${FALLBACK_LABELS[entityType]} #${id}`;
}

export async function generateEntityDetailMetadata(
  entityType: EntityType,
  params: Promise<{ id: string }>
): Promise<Metadata> {
  const { id } = await params;
  const entityId = parseInt(id, 10);
  const baseTitle =
    Number.isNaN(entityId) || entityId <= 0
      ? FALLBACK_LABELS[entityType]
      : await getEntityNameForMetadata(entityType, entityId);
  return { title: baseTitle };
}
