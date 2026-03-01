/**
 * Собирает объект обновления для сущностей типа place/container (name, entity_type_id, photo_url).
 * Используется в PUT /api/places/[id] и PUT /api/containers/[id].
 */

import type { PlaceLikeUpdateBody, PlaceLikeUpdateData } from "@/types/api";

export type { PlaceLikeUpdateBody, PlaceLikeUpdateData };

export const buildPlaceLikeUpdateBody = (body: PlaceLikeUpdateBody): PlaceLikeUpdateData => {
  const updateData: PlaceLikeUpdateData = {};
  if (body.name !== undefined) updateData.name = body.name?.trim() || null;
  if (body.entity_type_id !== undefined) updateData.entity_type_id = body.entity_type_id ?? null;
  if (body.photo_url !== undefined) updateData.photo_url = body.photo_url ?? null;
  return updateData;
};
