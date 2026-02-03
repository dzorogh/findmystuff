import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/shared/supabase/server";
import type { SearchResult } from "@/types/entity";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");

    if (!query || !query.trim()) {
      return NextResponse.json({ data: [] });
    }

    const searchQuery = query.trim();

    // Поиск по вещам, местам, контейнерам и помещениям параллельно
    const [itemsResult, placesResult, containersResult, roomsResult] = await Promise.all([
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
    ]);

    const results: SearchResult[] = [];

    // Добавляем вещи с их местоположениями
    if (itemsResult.data) {
      const itemIds = itemsResult.data.map((item) => item.id);

      // Получаем последние переходы для найденных вещей
      const { data: transitions } = await supabase
        .from("transitions")
        .select("*")
        .in("item_id", itemIds)
        .order("created_at", { ascending: false });

      // Группируем по item_id и берем последний
      const lastTransitions = new Map<number, {
        item_id: number;
        destination_type: string;
        destination_id: number;
      }>();
      transitions?.forEach((t: { item_id: number; destination_type: string; destination_id: number }) => {
        if (t.item_id && !lastTransitions.has(t.item_id)) {
          lastTransitions.set(t.item_id, t);
        }
      });

      // Получаем названия мест, контейнеров и помещений
      const placeIds = Array.from(lastTransitions.values())
        .filter((t) => t.destination_type === "place")
        .map((t) => t.destination_id);
      const containerIds = Array.from(lastTransitions.values())
        .filter((t) => t.destination_type === "container")
        .map((t) => t.destination_id);
      const roomIds = Array.from(lastTransitions.values())
        .filter((t) => t.destination_type === "room")
        .map((t) => t.destination_id);

      const [placesData, containersData, roomsData] = await Promise.all([
        placeIds.length > 0
          ? supabase.from("places").select("id, name").in("id", placeIds)
          : { data: [] },
        containerIds.length > 0
          ? supabase.from("containers").select("id, name").in("id", containerIds)
          : { data: [] },
        roomIds.length > 0
          ? supabase.from("rooms").select("id, name").in("id", roomIds)
          : { data: [] },
      ]);

      const placesMap = new Map(
        (placesData.data || []).map((p) => [p.id, p.name])
      );
      const containersMap = new Map(
        (containersData.data || []).map((c) => [c.id, c.name])
      );
      const roomsMap = new Map(
        (roomsData.data || []).map((r) => [r.id, r.name])
      );

      itemsResult.data.forEach((item) => {
        const transition = lastTransitions.get(item.id);
        let location: string | undefined;
        let locationType: "place" | "container" | "room" | undefined;

        if (transition) {
          if (transition.destination_type === "place") {
            location = placesMap.get(transition.destination_id) || undefined;
            locationType = "place";
          } else if (transition.destination_type === "container") {
            location = containersMap.get(transition.destination_id) || undefined;
            locationType = "container";
          } else if (transition.destination_type === "room") {
            location = roomsMap.get(transition.destination_id) || undefined;
            locationType = "room";
          }
        }

        results.push({
          type: "item" as const,
          id: item.id,
          name: item.name,
          location: location || undefined,
          locationType: locationType,
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

    return NextResponse.json({ data: results });
  } catch (error) {
    console.error("Ошибка поиска:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Произошла ошибка при поиске",
      },
      { status: 500 }
    );
  }
}
