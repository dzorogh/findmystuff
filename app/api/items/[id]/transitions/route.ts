import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/shared/supabase/server";
import { requireAuthAndTenant } from "@/lib/shared/api/require-auth";
import { requireIdParam } from "@/lib/shared/api/require-id-param";
import { apiErrorResponse } from "@/lib/shared/api/api-error-response";
import { HTTP_STATUS } from "@/lib/shared/api/http-status";
import type { Transition } from "@/types/entity";

type TransitionRow = {
  id: number;
  created_at: string;
  item_id?: number | null;
  container_id?: number | null;
  place_id?: number | null;
  destination_type: Transition["destination_type"];
  destination_id: number | null;
};

type NamedRow = {
  id: number;
  name: string | null;
};

type FurnitureRow = NamedRow & {
  room_id: number | null;
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const auth = await requireAuthAndTenant(request);
    if (auth instanceof NextResponse) return auth;
    const supabase = await createClient();
    const idResult = await requireIdParam(params, { entityLabel: "вещи" });
    if (idResult instanceof NextResponse) return idResult;
    const itemId = idResult.id;

    // Загружаем все transitions для этой вещи
    const { data: transitionsData, error: transitionsError } = await supabase
      .from("transitions")
      .select("*")
      .eq("item_id", itemId)
      .order("created_at", { ascending: false });

    if (transitionsError) {
      return NextResponse.json(
        { error: transitionsError.message },
        { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
      );
    }

    // Загружаем названия мест назначения
    const placeIds = (transitionsData || [])
      .filter((t) => t.destination_type === "place" && t.destination_id)
      .map((t) => t.destination_id);
    const containerIds = (transitionsData || [])
      .filter((t) => t.destination_type === "container" && t.destination_id)
      .map((t) => t.destination_id);
    const roomIds = (transitionsData || [])
      .filter((t) => t.destination_type === "room" && t.destination_id)
      .map((t) => t.destination_id);
    const furnitureIds = (transitionsData || [])
      .filter((t) => t.destination_type === "furniture" && t.destination_id)
      .map((t) => t.destination_id);

    // Сначала загружаем контейнеры, чтобы получить их transitions и узнать их иерархию
    const containersData = containerIds.length > 0
      ? await supabase
          .from("containers")
          .select("id, name")
          .in("id", containerIds)
          .is("deleted_at", null)
      : { data: [] };

    const containersMap = new Map(
      (containersData.data || []).map((c) => [c.id, c.name])
    );

    // Получаем transitions для контейнеров, чтобы узнать их места
    const allContainerIds = Array.from(containersMap.keys());
    const { data: containersTransitionsData } = allContainerIds.length > 0
      ? await supabase
          .from("transitions")
          .select("*")
          .in("container_id", allContainerIds)
          .order("created_at", { ascending: false })
      : { data: [] };

    const lastContainerTransitions = new Map<number, TransitionRow>();
    (containersTransitionsData || []).forEach((t) => {
      if (t.container_id && !lastContainerTransitions.has(t.container_id)) {
        lastContainerTransitions.set(t.container_id, t);
      }
    });

    // Добавляем места из transitions контейнеров к списку мест
    const containerPlaceIds = Array.from(lastContainerTransitions.values())
      .filter((t) => t.destination_type === "place" && t.destination_id)
      .map((t) => t.destination_id);
    const containerRoomIds = Array.from(lastContainerTransitions.values())
      .filter((t) => t.destination_type === "room" && t.destination_id)
      .map((t) => t.destination_id);
    const containerFurnitureIds = Array.from(lastContainerTransitions.values())
      .filter((t) => t.destination_type === "furniture" && t.destination_id)
      .map((t) => t.destination_id);
    const allPlaceIds = Array.from(new Set([...placeIds, ...containerPlaceIds]));

    const { data: placeTransitionsData } = allPlaceIds.length > 0
      ? await supabase
          .from("transitions")
          .select("place_id, destination_type, destination_id")
          .in("place_id", allPlaceIds)
          .order("created_at", { ascending: false })
      : { data: [] };

    const lastPlaceTransitions = new Map<number, Partial<TransitionRow>>();
    (placeTransitionsData || []).forEach((t: Partial<TransitionRow>) => {
      if (t.place_id && !lastPlaceTransitions.has(t.place_id)) {
        lastPlaceTransitions.set(t.place_id, t);
      }
    });

    const placeFurnitureIds = Array.from(lastPlaceTransitions.values())
      .filter((t) => t.destination_type === "furniture" && t.destination_id)
      .map((t) => t.destination_id as number);
    const placeRoomIds = Array.from(lastPlaceTransitions.values())
      .filter((t) => t.destination_type === "room" && t.destination_id)
      .map((t) => t.destination_id as number);

    const allFurnitureIds = Array.from(
      new Set([...furnitureIds, ...containerFurnitureIds, ...placeFurnitureIds])
    );

    const [placesData, furnitureData] = await Promise.all([
      allPlaceIds.length > 0
        ? supabase
            .from("places")
            .select("id, name")
            .in("id", allPlaceIds)
            .is("deleted_at", null)
        : { data: [] },
      allFurnitureIds.length > 0
        ? supabase
            .from("furniture")
            .select("id, name, room_id")
            .in("id", allFurnitureIds)
            .is("deleted_at", null)
        : { data: [] },
    ]);

    const placesMap = new Map(
      (placesData.data || []).map((p: NamedRow) => [p.id, p.name])
    );
    const furnitureMap = new Map(
      (furnitureData.data || []).map((f: FurnitureRow) => [f.id, f])
    );

    const furnitureRoomIds = (furnitureData.data || [])
      .map((f: FurnitureRow) => f.room_id)
      .filter((id): id is number => id != null);
    const allRoomIds = Array.from(
      new Set([...roomIds, ...containerRoomIds, ...placeRoomIds, ...furnitureRoomIds])
    );

    const { data: roomsData } = allRoomIds.length > 0
      ? await supabase
          .from("rooms")
          .select("id, name")
          .in("id", allRoomIds)
          .is("deleted_at", null)
      : { data: [] };

    const roomsMap = new Map(
      (roomsData || []).map((r: NamedRow) => [r.id, r.name])
    );

    const resolveFurnitureHierarchy = (furnitureId: number) => {
      const furniture = furnitureMap.get(furnitureId);
      const roomName = furniture?.room_id != null
        ? roomsMap.get(furniture.room_id) || null
        : null;

      return {
        furniture_name: furniture?.name ?? null,
        room_name: roomName,
      };
    };

    const resolvePlaceHierarchy = (placeId: number) => {
      const hierarchy = {
        place_name: placesMap.get(placeId) || null,
        furniture_name: null as string | null,
        room_name: null as string | null,
      };
      const placeTransition = lastPlaceTransitions.get(placeId);

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
        hierarchy.room_name = roomsMap.get(placeTransition.destination_id) || null;
      }

      return hierarchy;
    };

    // Формируем transitions с названиями
    const transitionsWithNames = (transitionsData || []).map((t): Transition => {
      const transition: Transition = {
        id: t.id,
        created_at: t.created_at,
        destination_type: t.destination_type,
        destination_id: t.destination_id,
      };

      if (t.destination_type === "place" && t.destination_id) {
        transition.destination_name = placesMap.get(t.destination_id) || null;
        const placeHierarchy = resolvePlaceHierarchy(t.destination_id);
        transition.furniture_name = placeHierarchy.furniture_name;
        transition.room_name = placeHierarchy.room_name;
      } else if (t.destination_type === "container" && t.destination_id) {
        transition.destination_name = containersMap.get(t.destination_id) || null;
        const containerTransition = lastContainerTransitions.get(t.destination_id);
        if (containerTransition) {
          if (containerTransition.destination_type === "place" && containerTransition.destination_id) {
            const placeHierarchy = resolvePlaceHierarchy(containerTransition.destination_id);
            transition.place_name = placeHierarchy.place_name;
            transition.furniture_name = placeHierarchy.furniture_name;
            transition.room_name = placeHierarchy.room_name;
          } else if (containerTransition.destination_type === "furniture" && containerTransition.destination_id) {
            const furnitureHierarchy = resolveFurnitureHierarchy(containerTransition.destination_id);
            transition.furniture_name = furnitureHierarchy.furniture_name;
            transition.room_name = furnitureHierarchy.room_name;
          } else if (containerTransition.destination_type === "room" && containerTransition.destination_id) {
            transition.room_name = roomsMap.get(containerTransition.destination_id) || null;
          }
        }
      } else if (t.destination_type === "room" && t.destination_id) {
        transition.destination_name = roomsMap.get(t.destination_id) || null;
      } else if (t.destination_type === "furniture" && t.destination_id) {
        const furnitureHierarchy = resolveFurnitureHierarchy(t.destination_id);
        transition.destination_name = furnitureHierarchy.furniture_name;
        transition.room_name = furnitureHierarchy.room_name;
      }

      return transition;
    });

    return NextResponse.json({
      data: transitionsWithNames,
    });
  } catch (error) {
    return apiErrorResponse(error, {
      context: "Ошибка загрузки transitions вещи:",
      defaultMessage: "Произошла ошибка при загрузке transitions",
    });
  }
}
