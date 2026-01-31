import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/shared/supabase/server";
import type { Item } from "@/types/entity";

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
    const query = searchParams.get("query") || null;
    const showDeleted = searchParams.get("showDeleted") === "true";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const locationType = searchParams.get("locationType") || null;
    const roomId = searchParams.get("roomId") ? parseInt(searchParams.get("roomId")!, 10) : null;
    const hasPhoto = searchParams.get("hasPhoto") === "true" ? true : searchParams.get("hasPhoto") === "false" ? false : null;

    const from = (page - 1) * limit;

    const { data: itemsData, error: itemsError } = await supabase.rpc("get_items_with_room", {
      search_query: query?.trim() || null,
      show_deleted: showDeleted,
      page_limit: limit,
      page_offset: from,
      location_type: locationType,
      room_id: roomId,
      has_photo: hasPhoto,
    });

    if (itemsError) {
      return NextResponse.json(
        { error: itemsError.message },
        { status: 500 }
      );
    }

    if (!itemsData || itemsData.length === 0) {
      return NextResponse.json({
        data: [],
        totalCount: 0,
      });
    }

    const totalCount = itemsData[0]?.total_count ?? 0;

    const items: Item[] = itemsData.map((item: {
      id: number;
      name: string | null;
      created_at: string;
      deleted_at: string | null;
      photo_url: string | null;
      destination_type: string | null;
      destination_id: number | null;
      moved_at: string | null;
      room_name: string | null;
      room_id: number | null;
    }) => {
      const hasLocation = Boolean(item.destination_type);

      return {
        id: item.id,
        name: item.name,
        created_at: item.created_at,
        deleted_at: item.deleted_at,
        photo_url: item.photo_url,
        room_id: item.room_id ?? null,
        room_name: item.room_name ?? null,
        last_location: hasLocation
          ? {
              destination_type: item.destination_type as "room" | "place" | "container" | null,
              destination_id: item.destination_id,
              moved_at: item.moved_at || "",
              room_name: item.room_name ?? null,
            }
          : null,
      };
    });

    return NextResponse.json({
      data: items,
      totalCount,
    });
  } catch (error) {
    console.error("Ошибка загрузки списка вещей:", error);
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

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    const body = await request.json();
    const { name, photo_url, destination_type, destination_id } = body;

    // Добавляем вещь
    const { data: newItem, error: insertError } = await supabase
      .from("items")
      .insert({
        name: name?.trim() || null,
        photo_url: photo_url || null,
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json(
        { error: insertError.message },
        { status: 500 }
      );
    }

    // Если указано местоположение, создаем transition
    if (destination_type && destination_id && newItem) {
      const { error: transitionError } = await supabase
        .from("transitions")
        .insert({
          item_id: newItem.id,
          destination_type,
          destination_id: parseInt(destination_id),
        });

      if (transitionError) {
        // Удаляем созданную вещь, если не удалось создать transition
        await supabase.from("items").delete().eq("id", newItem.id);
        return NextResponse.json(
          { error: transitionError.message },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ data: newItem });
  } catch (error) {
    console.error("Ошибка создания вещи:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Произошла ошибка при создании вещи",
      },
      { status: 500 }
    );
  }
}
