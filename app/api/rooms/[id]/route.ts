import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/shared/supabase/server";
import type { Item, Place, Container, Transition } from "@/types/entity";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    const resolvedParams = await Promise.resolve(params);
    const roomId = parseInt(resolvedParams.id, 10);

    if (isNaN(roomId) || roomId <= 0) {
      return NextResponse.json({ error: "Неверный ID помещения" }, { status: 400 });
    }

    // Волна 1: параллельно загружаем комнату, id вещей и transitions в комнату
    const [roomResult, itemIdsResult, transitionsResult] = await Promise.all([
      supabase
        .from("rooms")
        .select("id, name, photo_url, created_at, deleted_at")
        .eq("id", roomId)
        .single(),
      supabase.rpc("get_item_ids_in_room", { p_room_id: roomId }),
      supabase
        .from("transitions")
        .select("place_id, container_id, destination_type, destination_id, created_at")
        .eq("destination_type", "room")
        .eq("destination_id", roomId)
        .order("created_at", { ascending: false }),
    ]);

    const { data: roomData, error: roomError } = roomResult;
    if (roomError) {
      return NextResponse.json(
        { error: roomError.message },
        { status: 500 }
      );
    }
    if (!roomData) {
      return NextResponse.json({ error: "Помещение не найдено" }, { status: 404 });
    }

    const room = {
      id: roomData.id,
      name: roomData.name,
      photo_url: roomData.photo_url,
      created_at: roomData.created_at,
      deleted_at: roomData.deleted_at,
    };

    const itemIds: number[] = Array.isArray(itemIdsResult.data)
      ? itemIdsResult.data
          .map((row: { item_id?: number }) => Number(row?.item_id ?? 0))
          .filter((id) => id > 0)
      : [];

    const allTransitionsData = transitionsResult.data ?? [];
    const placeTransitionsMap = new Map<number, Transition>();
    const containerTransitionsMap = new Map<number, Transition>();
    allTransitionsData.forEach((t) => {
      if (t.place_id && !placeTransitionsMap.has(t.place_id)) {
        placeTransitionsMap.set(t.place_id, t as Transition);
      }
      if (t.container_id && !containerTransitionsMap.has(t.container_id)) {
        containerTransitionsMap.set(t.container_id, t as Transition);
      }
    });

    const placeIds = Array.from(placeTransitionsMap.keys());
    const containerIds = Array.from(containerTransitionsMap.keys());

    // Волна 2: параллельно вещи, последние transitions мест, последние transitions контейнеров
    const transitionColumns = "place_id, container_id, destination_type, destination_id, created_at";
    const [itemsResult, placeTransitionsResult, containerTransitionsResult] = await Promise.all([
      itemIds.length > 0
        ? supabase
            .from("items")
            .select("id, name, photo_url, created_at, deleted_at")
            .in("id", itemIds)
            .is("deleted_at", null)
            .order("created_at", { ascending: false })
        : Promise.resolve({ data: [] }),
      placeIds.length > 0
        ? supabase
            .from("transitions")
            .select(transitionColumns)
            .in("place_id", placeIds)
            .order("created_at", { ascending: false })
        : Promise.resolve({ data: [] }),
      containerIds.length > 0
        ? supabase
            .from("transitions")
            .select(transitionColumns)
            .in("container_id", containerIds)
            .order("created_at", { ascending: false })
        : Promise.resolve({ data: [] }),
    ]);

    const roomItems: Item[] = (itemsResult.data ?? []) as Item[];

    const lastPlaceTransitions = new Map<number, Transition>();
    (placeTransitionsResult.data || []).forEach((t) => {
      if (t.place_id && !lastPlaceTransitions.has(t.place_id)) {
        lastPlaceTransitions.set(t.place_id, t as Transition);
      }
    });
    const placesInRoom = Array.from(lastPlaceTransitions.entries())
      .filter(
        ([, transition]) =>
          transition.destination_type === "room" && transition.destination_id === roomId
      )
      .map(([placeId]) => placeId);

    const lastContainerTransitions = new Map<number, Transition>();
    (containerTransitionsResult.data || []).forEach((t) => {
      if (t.container_id && !lastContainerTransitions.has(t.container_id)) {
        lastContainerTransitions.set(t.container_id, t as Transition);
      }
    });
    const containersInRoom = Array.from(lastContainerTransitions.entries())
      .filter(
        ([, transition]) =>
          transition.destination_type === "room" && transition.destination_id === roomId
      )
      .map(([containerId]) => containerId);

    // Волна 3: параллельно места и контейнеры по id
    const [placesResult, containersResult] = await Promise.all([
      placesInRoom.length > 0
        ? supabase
            .from("places")
            .select("id, name, photo_url, created_at, deleted_at, entity_type_id")
            .in("id", placesInRoom)
            .is("deleted_at", null)
            .order("created_at", { ascending: false })
        : Promise.resolve({ data: [] }),
      containersInRoom.length > 0
        ? supabase
            .from("containers")
            .select("id, name, photo_url, created_at, deleted_at, entity_type_id")
            .in("id", containersInRoom)
            .is("deleted_at", null)
            .order("created_at", { ascending: false })
        : Promise.resolve({ data: [] }),
    ]);

    const roomPlaces: Place[] = (placesResult.data ?? []) as Place[];
    const roomContainers: Container[] = (containersResult.data ?? []) as Container[];

    return NextResponse.json({
      data: {
        room,
        items: roomItems,
        places: roomPlaces,
        containers: roomContainers,
      },
    });
  } catch (error) {
    console.error("Ошибка загрузки данных помещения:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Произошла ошибка при загрузке данных",
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    const resolvedParams = await Promise.resolve(params);
    const roomId = parseInt(resolvedParams.id, 10);

    if (isNaN(roomId) || roomId <= 0) {
      return NextResponse.json({ error: "Неверный ID помещения" }, { status: 400 });
    }

    const body = await request.json();
    const { name, photo_url } = body;

    const updateData: {
      name?: string | null;
      photo_url?: string | null;
    } = {};
    if (name !== undefined) updateData.name = name?.trim() || null;
    if (photo_url !== undefined) updateData.photo_url = photo_url || null;

    const { data, error } = await supabase
      .from("rooms")
      .update(updateData)
      .eq("id", roomId)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error("Ошибка обновления помещения:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Произошла ошибка при обновлении помещения",
      },
      { status: 500 }
    );
  }
}
