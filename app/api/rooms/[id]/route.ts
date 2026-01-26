import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
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

    // Загружаем помещение
    const { data: roomData, error: roomError } = await supabase
      .from("rooms")
      .select("id, name, photo_url, created_at, deleted_at")
      .eq("id", roomId)
      .single();

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

    // Загружаем все transitions для этого помещения
    const { data: allTransitionsData } = await supabase
      .from("transitions")
      .select("item_id, place_id, container_id, created_at")
      .eq("destination_type", "room")
      .eq("destination_id", roomId)
      .order("created_at", { ascending: false });

    const itemTransitionsMap = new Map<number, {
      item_id: number;
      created_at: string;
    }>();
    const placeTransitionsMap = new Map<number, {
      place_id: number;
      created_at: string;
    }>();
    const containerTransitionsMap = new Map<number, {
      container_id: number;
      created_at: string;
    }>();

    (allTransitionsData || []).forEach((t) => {
      if (t.item_id && !itemTransitionsMap.has(t.item_id)) {
        itemTransitionsMap.set(t.item_id, t);
      }
      if (t.place_id && !placeTransitionsMap.has(t.place_id)) {
        placeTransitionsMap.set(t.place_id, t);
      }
      if (t.container_id && !containerTransitionsMap.has(t.container_id)) {
        containerTransitionsMap.set(t.container_id, t);
      }
    });

    // Обрабатываем вещи
    const itemIds = Array.from(itemTransitionsMap.keys());
    let roomItems: Item[] = [];
    if (itemIds.length > 0) {
      const { data: allItemTransitionsData } = await supabase
        .from("transitions")
        .select("*")
        .in("item_id", itemIds)
        .order("created_at", { ascending: false });

      const lastItemTransitions = new Map<number, Transition>();
      (allItemTransitionsData || []).forEach((t) => {
        if (t.item_id && !lastItemTransitions.has(t.item_id)) {
          lastItemTransitions.set(t.item_id, t);
        }
      });

      const itemsInRoom = Array.from(lastItemTransitions.entries())
        .filter(([itemId, transition]) => 
          transition.destination_type === "room" && 
          transition.destination_id === roomId
        )
        .map(([itemId]) => itemId);

      if (itemsInRoom.length > 0) {
        const { data: itemsData } = await supabase
          .from("items")
          .select("id, name, photo_url, created_at")
          .in("id", itemsInRoom)
          .is("deleted_at", null)
          .order("created_at", { ascending: false });

        roomItems = itemsData || [];
      }
    }

    // Обрабатываем места
    const placeIds = Array.from(placeTransitionsMap.keys());
    let roomPlaces: Place[] = [];
    if (placeIds.length > 0) {
      const { data: allPlaceTransitionsData } = await supabase
        .from("transitions")
        .select("*")
        .in("place_id", placeIds)
        .order("created_at", { ascending: false });

      const lastPlaceTransitions = new Map<number, Transition>();
      (allPlaceTransitionsData || []).forEach((t) => {
        if (t.place_id && !lastPlaceTransitions.has(t.place_id)) {
          lastPlaceTransitions.set(t.place_id, t);
        }
      });

      const placesInRoom = Array.from(lastPlaceTransitions.entries())
        .filter(([placeId, transition]) => 
          transition.destination_type === "room" && 
          transition.destination_id === roomId
        )
        .map(([placeId]) => placeId);

      if (placesInRoom.length > 0) {
        const { data: placesData } = await supabase
          .from("places")
          .select("id, name, photo_url, created_at")
          .in("id", placesInRoom)
          .is("deleted_at", null)
          .order("created_at", { ascending: false });

        roomPlaces = placesData || [];
      }
    }

    // Обрабатываем контейнеры
    const containerIds = Array.from(containerTransitionsMap.keys());
    let roomContainers: Container[] = [];
    if (containerIds.length > 0) {
      const { data: allContainerTransitionsData } = await supabase
        .from("transitions")
        .select("*")
        .in("container_id", containerIds)
        .order("created_at", { ascending: false });

      const lastContainerTransitions = new Map<number, Transition>();
      (allContainerTransitionsData || []).forEach((t) => {
        if (t.container_id && !lastContainerTransitions.has(t.container_id)) {
          lastContainerTransitions.set(t.container_id, t);
        }
      });

      const containersInRoom = Array.from(lastContainerTransitions.entries())
        .filter(([containerId, transition]) => 
          transition.destination_type === "room" && 
          transition.destination_id === roomId
        )
        .map(([containerId]) => containerId);

      if (containersInRoom.length > 0) {
        const { data: containersData } = await supabase
          .from("containers")
          .select("id, name, photo_url, created_at")
          .in("id", containersInRoom)
          .is("deleted_at", null)
          .order("created_at", { ascending: false });

        roomContainers = containersData || [];
      }
    }

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
