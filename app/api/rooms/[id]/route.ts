import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/shared/supabase/server";
import { getItemIdsInRoomRpc } from "@/lib/rooms/api";
import { getServerUser } from "@/lib/users/server";
import { getActiveTenantId } from "@/lib/tenants/server";
import type { Item, Place, Container, Transition, Furniture } from "@/types/entity";

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
    const roomId = parseInt(resolvedParams.id, 10);

    if (isNaN(roomId) || roomId <= 0) {
      return NextResponse.json({ error: "Неверный ID помещения" }, { status: 400 });
    }

    // Волна 1: загружаем комнату, id вещей, transitions контейнеров в комнату, места через mv, мебель
    const [roomResult, itemIdsResult, transitionsResult, placesInRoomMv, furnitureResult] = await Promise.all([
      supabase
        .from("rooms")
        .select("id, name, photo_url, created_at, deleted_at, room_type_id, building_id, entity_types(name), buildings(name)")
        .eq("id", roomId)
        .single(),
      getItemIdsInRoomRpc(supabase, roomId),
      supabase
        .from("transitions")
        .select("place_id, container_id, destination_type, destination_id, created_at")
        .eq("destination_type", "room")
        .eq("destination_id", roomId)
        .order("created_at", { ascending: false }),
      supabase
        .from("v_place_last_room_transition")
        .select("place_id")
        .eq("room_id", roomId),
      supabase
        .from("furniture")
        .select("id, name, photo_url, created_at, deleted_at, room_id, furniture_type_id")
        .eq("room_id", roomId)
        .is("deleted_at", null)
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

    const roomTypes = roomData.entity_types;
    const entityType = Array.isArray(roomTypes) && roomTypes.length > 0
      ? roomTypes[0]
      : roomTypes && !Array.isArray(roomTypes)
        ? roomTypes
        : null;
    const buildingsData = roomData.buildings;
    const buildingData = Array.isArray(buildingsData) && buildingsData.length > 0
      ? buildingsData[0]
      : buildingsData && !Array.isArray(buildingsData)
        ? buildingsData
        : null;
    const room = {
      id: roomData.id,
      name: roomData.name,
      photo_url: roomData.photo_url,
      created_at: roomData.created_at,
      deleted_at: roomData.deleted_at,
      room_type_id: roomData.room_type_id ?? null,
      room_type: entityType?.name ? { name: entityType.name } : null,
      building_id: roomData.building_id ?? null,
      building_name: buildingData?.name ?? null,
    };

    const itemIds: number[] = Array.isArray(itemIdsResult.data)
      ? itemIdsResult.data
          .map((row: { item_id?: number }) => Number(row?.item_id ?? 0))
          .filter((id) => id > 0)
      : [];

    const allTransitionsData = transitionsResult.data ?? [];
    const placeIdsFromMv = (placesInRoomMv.data ?? []).map((r: { place_id: number }) => r.place_id);
    const _placeTransitionsMap = new Map<number, Transition>();
    const containerTransitionsMap = new Map<number, Transition>();
    allTransitionsData.forEach((t) => {
      if (t.container_id && !containerTransitionsMap.has(t.container_id)) {
        containerTransitionsMap.set(t.container_id, t as Transition);
      }
    });
    const placeIds = placeIdsFromMv.length > 0 ? placeIdsFromMv : [];
    const containerIds = Array.from(containerTransitionsMap.keys());

    // Волна 2: параллельно вещи и последние transitions контейнеров
    const transitionColumns = "place_id, container_id, destination_type, destination_id, created_at";
    const [itemsResult, containerTransitionsResult] = await Promise.all([
      itemIds.length > 0
        ? supabase
            .from("items")
            .select("id, name, photo_url, created_at, deleted_at")
            .in("id", itemIds)
            .is("deleted_at", null)
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

    const placesInRoom = placeIds;

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

    const furnitureRows = furnitureResult.data ?? [];
    const roomFurniture: Furniture[] = furnitureRows.map((f: {
      id: number;
      name: string | null;
      photo_url: string | null;
      created_at: string;
      deleted_at: string | null;
      room_id: number;
      furniture_type_id: number | null;
    }) => ({
      id: f.id,
      name: f.name,
      photo_url: f.photo_url,
      created_at: f.created_at,
      deleted_at: f.deleted_at,
      room_id: f.room_id,
      furniture_type_id: f.furniture_type_id ?? null,
    }));

    return NextResponse.json({
      data: {
        room,
        items: roomItems,
        places: roomPlaces,
        containers: roomContainers,
        furniture: roomFurniture,
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
    const roomId = parseInt(resolvedParams.id, 10);

    if (isNaN(roomId) || roomId <= 0) {
      return NextResponse.json({ error: "Неверный ID помещения" }, { status: 400 });
    }

    const body = await request.json();
    const { name, photo_url, room_type_id, building_id } = body;

    const updateData: {
      name?: string | null;
      photo_url?: string | null;
      room_type_id?: number | null;
      building_id?: number | null;
    } = {};
    if (name !== undefined) updateData.name = name?.trim() || null;
    if (photo_url !== undefined) updateData.photo_url = photo_url || null;
    if (room_type_id !== undefined) updateData.room_type_id = room_type_id != null ? (Number(room_type_id) || null) : null;
    if (building_id !== undefined) updateData.building_id = building_id != null ? (Number(building_id) || null) : null;

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
