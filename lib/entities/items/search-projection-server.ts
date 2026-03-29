import type { SupabaseClient } from "@supabase/supabase-js";
import type { ItemSearchProjection } from "@/lib/search/types";

type SearchTransitionRow = {
  item_id?: number | null;
  container_id?: number | null;
  place_id?: number | null;
  destination_type: "place" | "container" | "room" | "furniture" | null;
  destination_id: number | null;
};

type NamedRow = {
  id: number;
  name: string | null;
};

type ItemProjectionRow = NamedRow & {
  photo_url: string | null;
  item_type_id: number | null;
  entity_types: { name: string | null } | Array<{ name: string | null }> | null;
};

type FurnitureRow = NamedRow & {
  room_id: number | null;
};

function normalizeEntityTypeName(
  relation: ItemProjectionRow["entity_types"]
): string | null {
  if (Array.isArray(relation)) {
    return relation[0]?.name?.trim() || null;
  }

  return relation?.name?.trim() || null;
}

export async function getItemSearchProjectionByIds(
  supabase: SupabaseClient,
  tenantId: number,
  itemIds: number[],
  options?: { showDeleted?: boolean }
): Promise<ItemSearchProjection[]> {
  if (itemIds.length === 0) {
    return [];
  }

  const uniqueItemIds = Array.from(new Set(itemIds));
  const showDeleted = options?.showDeleted === true;

  const itemsQuery = supabase
    .from("items")
    .select("id, name, photo_url, item_type_id, entity_types(name)")
    .eq("tenant_id", tenantId)
    .in("id", uniqueItemIds);

  if (showDeleted) {
    itemsQuery.not("deleted_at", "is", null);
  } else {
    itemsQuery.is("deleted_at", null);
  }

  const { data: itemsData, error: itemsError } = await itemsQuery;

  if (itemsError) {
    throw new Error(itemsError.message);
  }

  const items = (itemsData as ItemProjectionRow[] | null) ?? [];
  if (items.length === 0) {
    return [];
  }

  const { data: transitions, error: transitionsError } = await supabase
    .from("transitions")
    .select("item_id, destination_type, destination_id")
    .in("item_id", items.map((item) => item.id))
    .order("created_at", { ascending: false });

  if (transitionsError) {
    throw new Error(transitionsError.message);
  }

  const lastTransitions = new Map<number, SearchTransitionRow>();
  (transitions as SearchTransitionRow[] | null)?.forEach((transition) => {
    if (transition.item_id && !lastTransitions.has(transition.item_id)) {
      lastTransitions.set(transition.item_id, transition);
    }
  });

  const directPlaceIds = Array.from(lastTransitions.values())
    .filter(
      (transition): transition is SearchTransitionRow & {
        destination_type: "place";
        destination_id: number;
      } => transition.destination_type === "place" && transition.destination_id != null
    )
    .map((transition) => transition.destination_id);

  const directContainerIds = Array.from(lastTransitions.values())
    .filter(
      (transition): transition is SearchTransitionRow & {
        destination_type: "container";
        destination_id: number;
      } =>
        transition.destination_type === "container" &&
        transition.destination_id != null
    )
    .map((transition) => transition.destination_id);

  const directRoomIds = Array.from(lastTransitions.values())
    .filter(
      (transition): transition is SearchTransitionRow & {
        destination_type: "room";
        destination_id: number;
      } => transition.destination_type === "room" && transition.destination_id != null
    )
    .map((transition) => transition.destination_id);

  const directFurnitureIds = Array.from(lastTransitions.values())
    .filter(
      (transition): transition is SearchTransitionRow & {
        destination_type: "furniture";
        destination_id: number;
      } =>
        transition.destination_type === "furniture" &&
        transition.destination_id != null
    )
    .map((transition) => transition.destination_id);

  const [placesData, containersData, directRoomsData] = await Promise.all([
    directPlaceIds.length > 0
      ? supabase.from("places").select("id, name").in("id", directPlaceIds)
      : Promise.resolve({ data: [] as NamedRow[], error: null }),
    directContainerIds.length > 0
      ? supabase.from("containers").select("id, name").in("id", directContainerIds)
      : Promise.resolve({ data: [] as NamedRow[], error: null }),
    directRoomIds.length > 0
      ? supabase.from("rooms").select("id, name").in("id", directRoomIds)
      : Promise.resolve({ data: [] as NamedRow[], error: null }),
  ]);

  if (placesData.error) throw new Error(placesData.error.message);
  if (containersData.error) throw new Error(containersData.error.message);
  if (directRoomsData.error) throw new Error(directRoomsData.error.message);

  const placesMap = new Map(
    ((placesData.data as NamedRow[] | null) ?? []).map((place) => [place.id, place.name])
  );
  const containersMap = new Map(
    ((containersData.data as NamedRow[] | null) ?? []).map((container) => [
      container.id,
      container.name,
    ])
  );

  const { data: containerTransitions, error: containerTransitionsError } =
    directContainerIds.length > 0
      ? await supabase
          .from("transitions")
          .select("container_id, destination_type, destination_id")
          .in("container_id", directContainerIds)
          .order("created_at", { ascending: false })
      : { data: [] as SearchTransitionRow[], error: null };

  if (containerTransitionsError) {
    throw new Error(containerTransitionsError.message);
  }

  const lastContainerTransitions = new Map<number, SearchTransitionRow>();
  (containerTransitions as SearchTransitionRow[] | null)?.forEach((transition) => {
    if (
      transition.container_id &&
      !lastContainerTransitions.has(transition.container_id)
    ) {
      lastContainerTransitions.set(transition.container_id, transition);
    }
  });

  const containerPlaceIds = Array.from(lastContainerTransitions.values())
    .filter(
      (transition): transition is SearchTransitionRow & {
        destination_type: "place";
        destination_id: number;
      } => transition.destination_type === "place" && transition.destination_id != null
    )
    .map((transition) => transition.destination_id);

  const containerRoomIds = Array.from(lastContainerTransitions.values())
    .filter(
      (transition): transition is SearchTransitionRow & {
        destination_type: "room";
        destination_id: number;
      } => transition.destination_type === "room" && transition.destination_id != null
    )
    .map((transition) => transition.destination_id);

  const containerFurnitureIds = Array.from(lastContainerTransitions.values())
    .filter(
      (transition): transition is SearchTransitionRow & {
        destination_type: "furniture";
        destination_id: number;
      } =>
        transition.destination_type === "furniture" &&
        transition.destination_id != null
    )
    .map((transition) => transition.destination_id);

  const allPlaceIds = Array.from(
    new Set([...directPlaceIds, ...containerPlaceIds])
  );
  const missingPlaceIds = allPlaceIds.filter((id) => !placesMap.has(id));

  if (missingPlaceIds.length > 0) {
    const { data: extraPlacesData, error: extraPlacesError } = await supabase
      .from("places")
      .select("id, name")
      .in("id", missingPlaceIds);

    if (extraPlacesError) {
      throw new Error(extraPlacesError.message);
    }

    (extraPlacesData as NamedRow[] | null)?.forEach((place) => {
      placesMap.set(place.id, place.name);
    });
  }

  const { data: placeTransitions, error: placeTransitionsError } =
    allPlaceIds.length > 0
      ? await supabase
          .from("transitions")
          .select("place_id, destination_type, destination_id")
          .in("place_id", allPlaceIds)
          .order("created_at", { ascending: false })
      : { data: [] as SearchTransitionRow[], error: null };

  if (placeTransitionsError) {
    throw new Error(placeTransitionsError.message);
  }

  const lastPlaceTransitions = new Map<number, SearchTransitionRow>();
  (placeTransitions as SearchTransitionRow[] | null)?.forEach((transition) => {
    if (transition.place_id && !lastPlaceTransitions.has(transition.place_id)) {
      lastPlaceTransitions.set(transition.place_id, transition);
    }
  });

  const placeFurnitureIds = Array.from(lastPlaceTransitions.values())
    .filter(
      (transition): transition is SearchTransitionRow & {
        destination_type: "furniture";
        destination_id: number;
      } =>
        transition.destination_type === "furniture" &&
        transition.destination_id != null
    )
    .map((transition) => transition.destination_id);

  const placeRoomIds = Array.from(lastPlaceTransitions.values())
    .filter(
      (transition): transition is SearchTransitionRow & {
        destination_type: "room";
        destination_id: number;
      } => transition.destination_type === "room" && transition.destination_id != null
    )
    .map((transition) => transition.destination_id);

  const allFurnitureIds = Array.from(
    new Set([
      ...directFurnitureIds,
      ...containerFurnitureIds,
      ...placeFurnitureIds,
    ])
  );

  const { data: furnitureData, error: furnitureError } =
    allFurnitureIds.length > 0
      ? await supabase
          .from("furniture")
          .select("id, name, room_id")
          .in("id", allFurnitureIds)
      : { data: [] as FurnitureRow[], error: null };

  if (furnitureError) {
    throw new Error(furnitureError.message);
  }

  const furnitureMap = new Map(
    ((furnitureData as FurnitureRow[] | null) ?? []).map((furniture) => [
      furniture.id,
      furniture,
    ])
  );

  const furnitureRoomIds = ((furnitureData as FurnitureRow[] | null) ?? [])
    .map((furniture) => furniture.room_id)
    .filter((roomId): roomId is number => roomId != null);

  const allRoomIds = Array.from(
    new Set([
      ...directRoomIds,
      ...containerRoomIds,
      ...placeRoomIds,
      ...furnitureRoomIds,
    ])
  );

  const { data: roomsData, error: roomsError } =
    allRoomIds.length > 0
      ? await supabase.from("rooms").select("id, name").in("id", allRoomIds)
      : { data: [] as NamedRow[], error: null };

  if (roomsError) {
    throw new Error(roomsError.message);
  }

  const roomsMap = new Map(
    [
      ...(((roomsData as NamedRow[] | null) ?? []) as NamedRow[]),
      ...(((directRoomsData.data as NamedRow[] | null) ?? []) as NamedRow[]),
    ].map((room) => [room.id, room.name])
  );

  const resolveFurnitureHierarchy = (furnitureId: number) => {
    const furniture = furnitureMap.get(furnitureId);
    const roomName =
      furniture?.room_id != null ? roomsMap.get(furniture.room_id) ?? null : null;

    return {
      furniture_name: furniture?.name ?? null,
      room_name: roomName,
    };
  };

  const resolvePlaceHierarchy = (placeId: number) => {
    const placeTransition = lastPlaceTransitions.get(placeId);
    const hierarchy = {
      place_name: placesMap.get(placeId) ?? null,
      furniture_name: null as string | null,
      room_name: null as string | null,
    };

    if (!placeTransition?.destination_id) {
      return hierarchy;
    }

    if (placeTransition.destination_type === "furniture") {
      const furnitureHierarchy = resolveFurnitureHierarchy(
        placeTransition.destination_id
      );
      hierarchy.furniture_name = furnitureHierarchy.furniture_name;
      hierarchy.room_name = furnitureHierarchy.room_name;
      return hierarchy;
    }

    if (placeTransition.destination_type === "room") {
      hierarchy.room_name = roomsMap.get(placeTransition.destination_id) ?? null;
    }

    return hierarchy;
  };

  const resolveContainerHierarchy = (containerId: number) => {
    const containerTransition = lastContainerTransitions.get(containerId);
    const hierarchy = {
      container_name: containersMap.get(containerId) ?? null,
      place_name: null as string | null,
      furniture_name: null as string | null,
      room_name: null as string | null,
    };

    if (!containerTransition?.destination_id) {
      return hierarchy;
    }

    if (containerTransition.destination_type === "place") {
      const placeHierarchy = resolvePlaceHierarchy(containerTransition.destination_id);
      hierarchy.place_name = placeHierarchy.place_name;
      hierarchy.furniture_name = placeHierarchy.furniture_name;
      hierarchy.room_name = placeHierarchy.room_name;
      return hierarchy;
    }

    if (containerTransition.destination_type === "furniture") {
      const furnitureHierarchy = resolveFurnitureHierarchy(
        containerTransition.destination_id
      );
      hierarchy.furniture_name = furnitureHierarchy.furniture_name;
      hierarchy.room_name = furnitureHierarchy.room_name;
      return hierarchy;
    }

    if (containerTransition.destination_type === "room") {
      hierarchy.room_name = roomsMap.get(containerTransition.destination_id) ?? null;
    }

    return hierarchy;
  };

  const itemsMap = new Map(items.map((item) => [item.id, item]));

  return itemIds
    .map((itemId) => {
      const item = itemsMap.get(itemId);
      if (!item) {
        return null;
      }

      const transition = lastTransitions.get(item.id);
      let container_name: string | null = null;
      let place_name: string | null = null;
      let furniture_name: string | null = null;
      let room_name: string | null = null;

      if (transition?.destination_type === "place" && transition.destination_id) {
        const placeHierarchy = resolvePlaceHierarchy(transition.destination_id);
        place_name = placeHierarchy.place_name;
        furniture_name = placeHierarchy.furniture_name;
        room_name = placeHierarchy.room_name;
      } else if (
        transition?.destination_type === "container" &&
        transition.destination_id
      ) {
        const containerHierarchy = resolveContainerHierarchy(
          transition.destination_id
        );
        container_name = containerHierarchy.container_name;
        place_name = containerHierarchy.place_name;
        furniture_name = containerHierarchy.furniture_name;
        room_name = containerHierarchy.room_name;
      } else if (
        transition?.destination_type === "furniture" &&
        transition.destination_id
      ) {
        const furnitureHierarchy = resolveFurnitureHierarchy(
          transition.destination_id
        );
        furniture_name = furnitureHierarchy.furniture_name;
        room_name = furnitureHierarchy.room_name;
      } else if (
        transition?.destination_type === "room" &&
        transition.destination_id
      ) {
        room_name = roomsMap.get(transition.destination_id) ?? null;
      }

      return {
        id: item.id,
        name: item.name,
        photo_url: item.photo_url,
        item_type_name: normalizeEntityTypeName(item.entity_types),
        room_name,
        furniture_name,
        place_name,
        container_name,
      } satisfies ItemSearchProjection;
    })
    .filter((item): item is ItemSearchProjection => item != null);
}

export async function searchItemsByNameProjection(
  supabase: SupabaseClient,
  tenantId: number,
  query: string,
  options?: { limit?: number; showDeleted?: boolean }
): Promise<ItemSearchProjection[]> {
  const trimmedQuery = query.trim();
  if (!trimmedQuery) {
    return [];
  }

  const limit = options?.limit ?? 10;
  const showDeleted = options?.showDeleted === true;

  const itemsQuery = supabase
    .from("items")
    .select("id")
    .eq("tenant_id", tenantId)
    .ilike("name", `%${trimmedQuery}%`)
    .limit(limit);

  if (showDeleted) {
    itemsQuery.not("deleted_at", "is", null);
  } else {
    itemsQuery.is("deleted_at", null);
  }

  const { data, error } = await itemsQuery;

  if (error) {
    throw new Error(error.message);
  }

  const itemIds = ((data as Array<{ id: number }> | null) ?? []).map(
    (item) => item.id
  );

  return getItemSearchProjectionByIds(supabase, tenantId, itemIds, {
    showDeleted,
  });
}
