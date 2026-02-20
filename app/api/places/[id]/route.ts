import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/shared/supabase/server";
import { getServerUser } from "@/lib/users/server";
import { getActiveTenantId } from "@/lib/tenants/server";
import type { Transition, Location, Item, Container, DestinationType } from "@/types/entity";

interface TransitionRow {
  id: number;
  created_at: string;
  item_id?: number | null;
  container_id?: number | null;
  place_id?: number | null;
  destination_type: string;
  destination_id: number | null;
}

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
    const placeId = parseInt(resolvedParams.id, 10);

    if (isNaN(placeId) || placeId <= 0) {
      return NextResponse.json({ error: "Неверный ID места" }, { status: 400 });
    }

    // Загружаем место
    const { data: placeData, error: placeError } = await supabase
      .from("places")
      .select("id, name, entity_type_id, photo_url, created_at, deleted_at, entity_types(name)")
      .eq("id", placeId)
      .single();

    if (placeError) {
      return NextResponse.json(
        { error: placeError.message },
        { status: 500 }
      );
    }

    if (!placeData) {
      return NextResponse.json({ error: "Место не найдено" }, { status: 404 });
    }

    // Загружаем все transitions для этого места
    const { data: transitionsData, error: transitionsError } = await supabase
      .from("transitions")
      .select("*")
      .eq("place_id", placeId)
      .order("created_at", { ascending: false });

    if (transitionsError) {
      return NextResponse.json(
        { error: transitionsError.message },
        { status: 500 }
      );
    }

    // Места могут быть только в мебели
    const furnitureIds = (transitionsData || [])
      .filter((t) => t.destination_type === "furniture" && t.destination_id)
      .map((t) => t.destination_id);

    const furnitureResult =
      furnitureIds.length > 0
        ? await supabase.from("furniture").select("id, name, room_id").in("id", furnitureIds).is("deleted_at", null)
        : { data: [] };

    const furnitureMap = new Map(
      (furnitureResult.data || []).map((f: { id: number; name: string | null }) => [f.id, f.name ?? null])
    );
    const furnitureRoomIds = (furnitureResult.data || [])
      .map((f: { room_id: number }) => f.room_id)
      .filter(Boolean);
    const furnitureRoomsResult = furnitureRoomIds.length > 0
      ? await supabase.from("rooms").select("id, name").in("id", furnitureRoomIds).is("deleted_at", null)
      : { data: [] };
    const roomNameByRoomId = new Map(
      (furnitureRoomsResult.data || []).map((r: { id: number; name: string }) => [r.id, r.name])
    );

    // Формируем transitions с названиями
    const transitionsWithNames = (transitionsData || []).map((t): Transition => {
      const transition: Transition = {
        id: t.id,
        created_at: t.created_at,
        destination_type: t.destination_type,
        destination_id: t.destination_id,
      };

      if (t.destination_type === "furniture" && t.destination_id) {
        transition.destination_name = furnitureMap.get(t.destination_id) || null;
      }

      return transition;
    });

    // Определяем последнее местоположение
    const lastTransition = transitionsWithNames[0];
    const lastLocation: Location | null = lastTransition
      ? {
          destination_type: lastTransition.destination_type,
          destination_id: lastTransition.destination_id,
          destination_name: lastTransition.destination_name || null,
          moved_at: lastTransition.created_at,
        }
      : null;

    let entityType: { name: string } | null = null;
    if (placeData.entity_types) {
      if (Array.isArray(placeData.entity_types) && placeData.entity_types.length > 0) {
        entityType = placeData.entity_types[0];
      } else if (!Array.isArray(placeData.entity_types)) {
        entityType = placeData.entity_types;
      }
    }

    let furniture_id: number | null = null;
    let furniture_name: string | null = null;
    let room_id: number | null = null;
    let room_name: string | null = null;

    if (lastTransition?.destination_type === "furniture" && lastTransition.destination_id) {
      furniture_id = lastTransition.destination_id;
      furniture_name = furnitureMap.get(furniture_id) || null;
      const furnitureRow = (furnitureResult.data || []).find(
        (f: { id: number; room_id: number }) => f.id === furniture_id
      );
      if (furnitureRow?.room_id != null) {
        room_id = furnitureRow.room_id;
        room_name = roomNameByRoomId.get(furnitureRow.room_id) || null;
      }
    }

    const place = {
      id: placeData.id,
      name: placeData.name,
      entity_type_id: placeData.entity_type_id || null,
      entity_type: entityType,
      photo_url: placeData.photo_url,
      created_at: placeData.created_at,
      deleted_at: placeData.deleted_at,
      last_location: lastLocation,
      furniture_id,
      furniture_name,
      room_id,
      room_name,
      room: room_id ? { room_id, room_name } : null,
    };

    // Загружаем вещи и контейнеры в этом месте
    const { data: allTransitionsData } = await supabase
      .from("transitions")
      .select("item_id, container_id, created_at")
      .eq("destination_type", "place")
      .eq("destination_id", placeId)
      .order("created_at", { ascending: false });

    // Используем Set для хранения ID, так как нам не нужны полные объекты Transition
    const itemIdsSet = new Set<number>();
    const containerIdsSet = new Set<number>();

    (allTransitionsData || []).forEach((t) => {
      if (t.item_id) {
        itemIdsSet.add(t.item_id);
      }
      if (t.container_id) {
        containerIdsSet.add(t.container_id);
      }
    });

    const itemIds = Array.from(itemIdsSet);
    const containerIds = Array.from(containerIdsSet);

    let placeItems: Item[] = [];
    let placeContainers: Container[] = [];

    if (itemIds.length > 0 || containerIds.length > 0) {
      let allTransitionsQuery = supabase
        .from("transitions")
        .select("*")
        .order("created_at", { ascending: false });

      if (itemIds.length > 0 && containerIds.length > 0) {
        allTransitionsQuery = allTransitionsQuery.or(
          `item_id.in.(${itemIds.join(',')}),container_id.in.(${containerIds.join(',')})`
        );
      } else if (itemIds.length > 0) {
        allTransitionsQuery = allTransitionsQuery.in("item_id", itemIds);
      } else if (containerIds.length > 0) {
        allTransitionsQuery = allTransitionsQuery.in("container_id", containerIds);
      }

      const { data: allTransitionsData } = await allTransitionsQuery;

      const lastItemTransitions = new Map<number, Transition>();
      const lastContainerTransitions = new Map<number, Transition>();

      (allTransitionsData || []).forEach((t: TransitionRow) => {
        // Преобразуем данные из базы в тип Transition
        const transition: Transition = {
          id: t.id,
          created_at: t.created_at,
          item_id: t.item_id ?? null,
          container_id: t.container_id ?? null,
          place_id: t.place_id ?? null,
          destination_type: (t.destination_type ?? null) as DestinationType | null,
          destination_id: t.destination_id ?? null,
        };

        if (t.item_id && !lastItemTransitions.has(t.item_id)) {
          lastItemTransitions.set(t.item_id, transition);
        }
        if (t.container_id && !lastContainerTransitions.has(t.container_id)) {
          lastContainerTransitions.set(t.container_id, transition);
        }
      });

      const itemsInPlace = Array.from(lastItemTransitions.entries())
        .filter(([, transition]) => 
          transition.destination_type === "place" && 
          transition.destination_id === placeId
        )
        .map(([itemId]) => itemId);

      if (itemsInPlace.length > 0) {
        const { data: itemsData } = await supabase
          .from("items")
          .select("id, name, photo_url, created_at, deleted_at")
          .in("id", itemsInPlace)
          .is("deleted_at", null)
          .order("created_at", { ascending: false });

        placeItems = itemsData || [];
      }

      const containersInPlace = Array.from(lastContainerTransitions.entries())
        .filter(([, transition]) => 
          transition.destination_type === "place" && 
          transition.destination_id === placeId
        )
        .map(([containerId]) => containerId);

      if (containersInPlace.length > 0) {
        const { data: containersData } = await supabase
          .from("containers")
          .select("id, name, photo_url, created_at, deleted_at, entity_type_id")
          .in("id", containersInPlace)
          .is("deleted_at", null)
          .order("created_at", { ascending: false });

        placeContainers = containersData || [];
      }
    }

    return NextResponse.json({
      data: {
        place,
        transitions: transitionsWithNames,
        items: placeItems,
        containers: placeContainers,
      },
    });
  } catch (error) {
    console.error("Ошибка загрузки данных места:", error);
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
    const placeId = parseInt(resolvedParams.id, 10);

    if (isNaN(placeId) || placeId <= 0) {
      return NextResponse.json({ error: "Неверный ID места" }, { status: 400 });
    }

    const body = await request.json();
    const { name, entity_type_id, photo_url } = body;

    const updateData: {
      name?: string | null;
      entity_type_id?: number | null;
      photo_url?: string | null;
    } = {};
    if (name !== undefined) updateData.name = name?.trim() || null;
    if (entity_type_id !== undefined) updateData.entity_type_id = entity_type_id || null;
    if (photo_url !== undefined) updateData.photo_url = photo_url || null;

    const { data, error } = await supabase
      .from("places")
      .update(updateData)
      .eq("id", placeId)
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
    console.error("Ошибка обновления места:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Произошла ошибка при обновлении места",
      },
      { status: 500 }
    );
  }
}
