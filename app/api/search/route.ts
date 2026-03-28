import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/shared/supabase/server";
import { requireAuthAndTenant } from "@/lib/shared/api/require-auth";
import { apiErrorResponse } from "@/lib/shared/api/api-error-response";
import type { SearchResult } from "@/types/entity";

type SearchTransitionRow = {
  item_id?: number | null;
  container_id?: number | null;
  place_id?: number | null;
  destination_type: SearchResult["locationType"] | null;
  destination_id: number | null;
};

type NamedRow = {
  id: number;
  name: string | null;
};

type FurnitureRow = NamedRow & {
  room_id: number | null;
};

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuthAndTenant(request);
    if (auth instanceof NextResponse) return auth;
    const { tenantId: _tenantId } = auth;
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");

    if (!query || !query.trim()) {
      return NextResponse.json({ data: [] });
    }

    const searchQuery = query.trim();

    // Поиск по вещам, местам, контейнерам, мебели и помещениям параллельно
    const [itemsResult, placesResult, containersResult, roomsResult, furnitureResult] = await Promise.all([
      supabase
        .from("items")
        .select("id, name")
        .ilike("name", `%${searchQuery}%`)
        .is("deleted_at", null)
        .limit(10),
      supabase
        .from("places")
        .select("id, name")
        .ilike("name", `%${searchQuery}%`)
        .is("deleted_at", null)
        .limit(10),
      supabase
        .from("containers")
        .select("id, name")
        .ilike("name", `%${searchQuery}%`)
        .is("deleted_at", null)
        .limit(10),
      supabase
        .from("rooms")
        .select("id, name")
        .ilike("name", `%${searchQuery}%`)
        .is("deleted_at", null)
        .limit(10),
      supabase
        .from("furniture")
        .select("id, name")
        .ilike("name", `%${searchQuery}%`)
        .is("deleted_at", null)
        .limit(10),
    ]);

    const results: SearchResult[] = [];

    // Добавляем вещи с их местоположениями
    if (itemsResult.data) {
      const itemIds = itemsResult.data.map((item) => item.id);

      // Получаем последние переходы для найденных вещей
      const { data: transitions } = itemIds.length > 0
        ? await supabase
            .from("transitions")
            .select("item_id, destination_type, destination_id")
            .in("item_id", itemIds)
            .order("created_at", { ascending: false })
        : { data: [] };

      // Группируем по item_id и берем последний
      const lastTransitions = new Map<number, SearchTransitionRow>();
      transitions?.forEach((t: SearchTransitionRow) => {
        if (t.item_id && !lastTransitions.has(t.item_id)) {
          lastTransitions.set(t.item_id, t);
        }
      });

      // Получаем прямые назначения вещей
      const placeIds = Array.from(lastTransitions.values())
        .filter((t) => t.destination_type === "place")
        .map((t) => t.destination_id);
      const containerIds = Array.from(lastTransitions.values())
        .filter((t) => t.destination_type === "container")
        .map((t) => t.destination_id);
      const roomIds = Array.from(lastTransitions.values())
        .filter((t) => t.destination_type === "room")
        .map((t) => t.destination_id);
      const furnitureIds = Array.from(lastTransitions.values())
        .filter((t) => t.destination_type === "furniture")
        .map((t) => t.destination_id);

      const directPlaceIds = placeIds.filter((id): id is number => id != null);
      const directContainerIds = containerIds.filter((id): id is number => id != null);
      const directRoomIds = roomIds.filter((id): id is number => id != null);
      const directFurnitureIds = furnitureIds.filter((id): id is number => id != null);

      const [placesData, containersData, directRoomsData] = await Promise.all([
        directPlaceIds.length > 0
          ? supabase.from("places").select("id, name").in("id", directPlaceIds)
          : { data: [] },
        directContainerIds.length > 0
          ? supabase.from("containers").select("id, name").in("id", directContainerIds)
          : { data: [] },
        directRoomIds.length > 0
          ? supabase.from("rooms").select("id, name").in("id", directRoomIds)
          : { data: [] },
      ]);

      const placesMap = new Map((placesData.data || []).map((place: NamedRow) => [place.id, place.name]));
      const containersMap = new Map((containersData.data || []).map((container: NamedRow) => [container.id, container.name]));

      const { data: containerTransitions } = directContainerIds.length > 0
        ? await supabase
            .from("transitions")
            .select("container_id, destination_type, destination_id")
            .in("container_id", directContainerIds)
            .order("created_at", { ascending: false })
        : { data: [] };

      const lastContainerTransitions = new Map<number, SearchTransitionRow>();
      (containerTransitions || []).forEach((transition: SearchTransitionRow) => {
        if (transition.container_id && !lastContainerTransitions.has(transition.container_id)) {
          lastContainerTransitions.set(transition.container_id, transition);
        }
      });

      const containerPlaceIds = Array.from(lastContainerTransitions.values())
        .filter((transition) => transition.destination_type === "place" && transition.destination_id != null)
        .map((transition) => transition.destination_id as number);
      const containerRoomIds = Array.from(lastContainerTransitions.values())
        .filter((transition) => transition.destination_type === "room" && transition.destination_id != null)
        .map((transition) => transition.destination_id as number);
      const containerFurnitureIds = Array.from(lastContainerTransitions.values())
        .filter((transition) => transition.destination_type === "furniture" && transition.destination_id != null)
        .map((transition) => transition.destination_id as number);

      const allPlaceIds = Array.from(new Set([...directPlaceIds, ...containerPlaceIds]));
      const missingPlaceIds = allPlaceIds.filter((id) => !placesMap.has(id));

      if (missingPlaceIds.length > 0) {
        const { data: extraPlacesData } = await supabase
          .from("places")
          .select("id, name")
          .in("id", missingPlaceIds);
        (extraPlacesData || []).forEach((place: NamedRow) => {
          placesMap.set(place.id, place.name);
        });
      }

      const { data: placeTransitions } = allPlaceIds.length > 0
        ? await supabase
            .from("transitions")
            .select("place_id, destination_type, destination_id")
            .in("place_id", allPlaceIds)
            .order("created_at", { ascending: false })
        : { data: [] };

      const lastPlaceTransitions = new Map<number, SearchTransitionRow>();
      (placeTransitions || []).forEach((transition: SearchTransitionRow) => {
        if (transition.place_id && !lastPlaceTransitions.has(transition.place_id)) {
          lastPlaceTransitions.set(transition.place_id, transition);
        }
      });

      const placeFurnitureIds = Array.from(lastPlaceTransitions.values())
        .filter((transition) => transition.destination_type === "furniture" && transition.destination_id != null)
        .map((transition) => transition.destination_id as number);
      const placeRoomIds = Array.from(lastPlaceTransitions.values())
        .filter((transition) => transition.destination_type === "room" && transition.destination_id != null)
        .map((transition) => transition.destination_id as number);

      const allFurnitureIds = Array.from(
        new Set([...directFurnitureIds, ...containerFurnitureIds, ...placeFurnitureIds])
      );
      const { data: furnitureData } = allFurnitureIds.length > 0
        ? await supabase
            .from("furniture")
            .select("id, name, room_id")
            .in("id", allFurnitureIds)
        : { data: [] };

      const furnitureMap = new Map(
        (furnitureData || []).map((furniture: FurnitureRow) => [furniture.id, furniture])
      );

      const furnitureRoomIds = (furnitureData || [])
        .map((furniture: FurnitureRow) => furniture.room_id)
        .filter((id): id is number => id != null);
      const allRoomIds = Array.from(
        new Set([...directRoomIds, ...containerRoomIds, ...placeRoomIds, ...furnitureRoomIds])
      );

      const roomsData = allRoomIds.length > 0
        ? await supabase.from("rooms").select("id, name").in("id", allRoomIds)
        : { data: [] };

      const roomsMap = new Map(
        ((roomsData.data || directRoomsData.data || []) as NamedRow[]).map((room) => [room.id, room.name])
      );

      const resolveFurnitureHierarchy = (furnitureId: number) => {
        const furniture = furnitureMap.get(furnitureId);
        const roomName = furniture?.room_id != null
          ? roomsMap.get(furniture.room_id) ?? null
          : null;

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
          const furnitureHierarchy = resolveFurnitureHierarchy(placeTransition.destination_id);
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
          const furnitureHierarchy = resolveFurnitureHierarchy(containerTransition.destination_id);
          hierarchy.furniture_name = furnitureHierarchy.furniture_name;
          hierarchy.room_name = furnitureHierarchy.room_name;
          return hierarchy;
        }

        if (containerTransition.destination_type === "room") {
          hierarchy.room_name = roomsMap.get(containerTransition.destination_id) ?? null;
        }

        return hierarchy;
      };

      itemsResult.data.forEach((item) => {
        const transition = lastTransitions.get(item.id);
        let location: string | undefined;
        let locationType: "place" | "container" | "room" | "furniture" | undefined;
        let container_name: string | null = null;
        let place_name: string | null = null;
        let furniture_name: string | null = null;
        let room_name: string | null = null;

        if (transition) {
          if (transition.destination_type === "place" && transition.destination_id) {
            const placeHierarchy = resolvePlaceHierarchy(transition.destination_id);
            location = placeHierarchy.place_name || undefined;
            locationType = "place";
            place_name = placeHierarchy.place_name;
            furniture_name = placeHierarchy.furniture_name;
            room_name = placeHierarchy.room_name;
          } else if (transition.destination_type === "container" && transition.destination_id) {
            const containerHierarchy = resolveContainerHierarchy(transition.destination_id);
            location = containerHierarchy.container_name || undefined;
            locationType = "container";
            container_name = containerHierarchy.container_name;
            place_name = containerHierarchy.place_name;
            furniture_name = containerHierarchy.furniture_name;
            room_name = containerHierarchy.room_name;
          } else if (transition.destination_type === "room" && transition.destination_id) {
            location = roomsMap.get(transition.destination_id) || undefined;
            locationType = "room";
            room_name = roomsMap.get(transition.destination_id) ?? null;
          } else if (transition.destination_type === "furniture" && transition.destination_id) {
            const furnitureHierarchy = resolveFurnitureHierarchy(transition.destination_id);
            location = furnitureHierarchy.furniture_name || undefined;
            locationType = "furniture";
            furniture_name = furnitureHierarchy.furniture_name;
            room_name = furnitureHierarchy.room_name;
          }
        }

        results.push({
          type: "item" as const,
          id: item.id,
          name: item.name,
          location: location || undefined,
          locationType: locationType,
          container_name,
          place_name,
          furniture_name,
          room_name,
        });
      });
    }

    // Добавляем места
    if (placesResult.data) {
      placesResult.data.forEach((place) => {
        results.push({
          type: "place" as const,
          id: place.id,
          name: place.name,
        });
      });
    }

    // Добавляем контейнеры
    if (containersResult.data) {
      containersResult.data.forEach((container) => {
        results.push({
          type: "container" as const,
          id: container.id,
          name: container.name,
        });
      });
    }

    // Добавляем помещения
    if (roomsResult.data) {
      roomsResult.data.forEach((room) => {
        results.push({
          type: "room" as const,
          id: room.id,
          name: room.name,
        });
      });
    }

    // Добавляем мебель
    if (furnitureResult.data) {
      furnitureResult.data.forEach((furniture) => {
        results.push({
          type: "furniture" as const,
          id: furniture.id,
          name: furniture.name,
        });
      });
    }

    return NextResponse.json({ data: results });
  } catch (error) {
    return apiErrorResponse(error, {
      context: "Ошибка поиска:",
      defaultMessage: "Произошла ошибка при поиске",
    });
  }
}
