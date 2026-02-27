/**
 * Общий сценарий: insert сущности → при успехе создание transition → при ошибке transition откат (delete созданной сущности).
 * Используется в POST /api/items, /api/places, /api/containers.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

const TRANSITION_ID_COLUMN_BY_TABLE = {
  places: "place_id",
  containers: "container_id",
  items: "item_id",
} as const;

type EntityTable = keyof typeof TRANSITION_ID_COLUMN_BY_TABLE;

export type InsertEntityWithTransitionParams<T> = {
  supabase: SupabaseClient;
  table: EntityTable;
  insertData: Record<string, unknown>;
  transitionPayload: {
    destination_type: string;
    destination_id: number;
    tenant_id: number;
  } | null;
};

export type InsertEntityWithTransitionResult<T> =
  | { data: T; error: null }
  | { data: null; error: string };

/**
 * Вставляет запись в table, при наличии transitionPayload создаёт transition.
 * При ошибке создания transition удаляет только что созданную запись и возвращает error.
 */
export async function insertEntityWithTransition<T extends { id: number }>(
  params: InsertEntityWithTransitionParams<T>
): Promise<InsertEntityWithTransitionResult<T>> {
  const { supabase, table, insertData, transitionPayload } = params;

  const { data: newEntity, error: insertError } = await supabase
    .from(table)
    .insert(insertData)
    .select()
    .single();

  if (insertError) {
    return { data: null, error: insertError.message };
  }

  if (!newEntity) {
    return { data: null, error: "Insert не вернул данные" };
  }

  if (!transitionPayload) {
    return { data: newEntity as T, error: null };
  }

  const idColumn = TRANSITION_ID_COLUMN_BY_TABLE[table];
  const { error: transitionError } = await supabase.from("transitions").insert({
    [idColumn]: newEntity.id,
    destination_type: transitionPayload.destination_type,
    destination_id: transitionPayload.destination_id,
    tenant_id: transitionPayload.tenant_id,
  });

  if (transitionError) {
    await supabase.from(table).delete().eq("id", newEntity.id);
    return { data: null, error: transitionError.message };
  }

  return { data: newEntity as T, error: null };
}
