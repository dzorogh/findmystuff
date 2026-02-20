import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/shared/supabase/server";
import { getServerUser } from "@/lib/users/server";
import { getActiveTenantId } from "@/lib/tenants/server";
import type { Transition } from "@/types/entity";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const user = await getServerUser();
    if (!user) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }
    const tenantId = await getActiveTenantId(request.headers);
    if (!tenantId) {
      return NextResponse.json(
        { error: "Выберите тенант или создайте склад" },
        { status: 400 }
      );
    }
    const supabase = await createClient();
    const resolvedParams = await Promise.resolve(params);
    const idString = resolvedParams.id;

    if (!idString) {
      return NextResponse.json({ error: "Неверный ID вещи" }, { status: 400 });
    }

    const itemId = parseInt(idString, 10);

    if (isNaN(itemId) || itemId <= 0) {
      return NextResponse.json({ error: "Неверный ID вещи" }, { status: 400 });
    }

    // Загружаем все transitions для этой вещи
    const { data: transitionsData, error: transitionsError } = await supabase
      .from("transitions")
      .select("*")
      .eq("item_id", itemId)
      .order("created_at", { ascending: false });

    if (transitionsError) {
      return NextResponse.json(
        { error: transitionsError.message },
        { status: 500 }
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

    // Сначала загружаем контейнеры, чтобы получить их transitions и узнать места
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

    const lastContainerTransitions = new Map<number, Transition>();
    (containersTransitionsData || []).forEach((t) => {
      if (t.container_id && !lastContainerTransitions.has(t.container_id)) {
        lastContainerTransitions.set(t.container_id, t);
      }
    });

    // Добавляем места из transitions контейнеров к списку мест
    const containerPlaceIds = Array.from(lastContainerTransitions.values())
      .filter((t) => t.destination_type === "place" && t.destination_id)
      .map((t) => t.destination_id);
    const allPlaceIds = Array.from(new Set([...placeIds, ...containerPlaceIds]));

    const [placesData, roomsData] = await Promise.all([
      allPlaceIds.length > 0
        ? supabase
            .from("places")
            .select("id, name")
            .in("id", allPlaceIds)
            .is("deleted_at", null)
        : { data: [] },
      roomIds.length > 0
        ? supabase
            .from("rooms")
            .select("id, name")
            .in("id", roomIds)
            .is("deleted_at", null)
        : { data: [] },
    ]);

    const placesMap = new Map(
      (placesData.data || []).map((p) => [p.id, p.name])
    );
    const roomsMap = new Map(
      (roomsData.data || []).map((r) => [r.id, r.name])
    );

    // Для мест получаем их помещения
    const { data: placesTransitionsData } = allPlaceIds.length > 0
      ? await supabase
          .from("transitions")
          .select("*")
          .eq("destination_type", "room")
          .in("place_id", allPlaceIds)
          .order("created_at", { ascending: false })
      : { data: [] };

    const lastPlaceTransitions = new Map<number, Transition>();
    (placesTransitionsData || []).forEach((t) => {
      if (t.place_id && !lastPlaceTransitions.has(t.place_id)) {
        lastPlaceTransitions.set(t.place_id, t);
      }
    });

    const placeRoomIds = Array.from(lastPlaceTransitions.values())
      .map((t) => t.destination_id)
      .filter((id) => id !== null);

    const { data: placeRoomsData } = placeRoomIds.length > 0
      ? await supabase
          .from("rooms")
          .select("id, name")
          .in("id", placeRoomIds)
          .is("deleted_at", null)
      : { data: [] };

    const placeRoomsMap = new Map(
      (placeRoomsData || []).map((r) => [r.id, r.name])
    );

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
        const placeTransition = lastPlaceTransitions.get(t.destination_id);
        if (placeTransition?.destination_id) {
          transition.room_name = placeRoomsMap.get(placeTransition.destination_id) || null;
        }
      } else if (t.destination_type === "container" && t.destination_id) {
        transition.destination_name = containersMap.get(t.destination_id) || null;
        const containerTransition = lastContainerTransitions.get(t.destination_id);
        if (containerTransition) {
          if (containerTransition.destination_type === "place" && containerTransition.destination_id) {
            const placeName = placesMap.get(containerTransition.destination_id);
            transition.place_name = placeName || null;
            const placeTransition = lastPlaceTransitions.get(containerTransition.destination_id);
            if (placeTransition?.destination_id) {
              transition.room_name = placeRoomsMap.get(placeTransition.destination_id) || null;
            }
          } else if (containerTransition.destination_type === "room" && containerTransition.destination_id) {
            transition.room_name = roomsMap.get(containerTransition.destination_id) || null;
          }
        }
      } else if (t.destination_type === "room" && t.destination_id) {
        transition.destination_name = roomsMap.get(t.destination_id) || null;
      }

      return transition;
    });

    return NextResponse.json({
      data: transitionsWithNames,
    });
  } catch (error) {
    console.error("Ошибка загрузки transitions вещи:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Произошла ошибка при загрузке transitions",
      },
      { status: 500 }
    );
  }
}
