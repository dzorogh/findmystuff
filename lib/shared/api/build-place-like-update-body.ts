/**
 * Собирает объект обновления для сущностей типа place/container (name, entity_type_id, photo_url).
 * Используется в PUT /api/places/[id] и PUT /api/containers/[id].
 */

export type PlaceLikeUpdateBody = {
  name?: string | null;
  entity_type_id?: number | null;
  photo_url?: string | null;
};

export type PlaceLikeUpdateData = {
  name?: string | null;
  entity_type_id?: number | null;
  photo_url?: string | null;
};

export const buildPlaceLikeUpdateBody = (body: PlaceLikeUpdateBody): PlaceLikeUpdateData => {
  const updateData: PlaceLikeUpdateData = {};
  if (body.name !== undefined) updateData.name = body.name?.trim() || null;
  if (body.entity_type_id !== undefined) updateData.entity_type_id = body.entity_type_id ?? null;
  if (body.photo_url !== undefined) updateData.photo_url = body.photo_url ?? null;
  return updateData;
};
