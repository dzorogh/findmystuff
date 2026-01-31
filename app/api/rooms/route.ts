import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/shared/supabase/server";
import type { Room } from "@/types/entity";

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

    const { data: roomsData, error: fetchError } = await supabase.rpc(
      "get_rooms_with_counts",
      {
        search_query: query?.trim() || null,
        show_deleted: showDeleted,
        page_limit: 2000,
        page_offset: 0,
      }
    );

    if (fetchError) {
      return NextResponse.json(
        { error: fetchError.message },
        { status: 500 }
      );
    }

    if (!roomsData || roomsData.length === 0) {
      return NextResponse.json({
        data: [],
      });
    }

    const rooms: Room[] = roomsData.map((room: {
      id: number;
      name: string | null;
      created_at: string;
      deleted_at: string | null;
      photo_url: string | null;
      items_count: number;
      places_count: number;
      containers_count: number;
    }) => ({
      id: room.id,
      name: room.name,
      created_at: room.created_at,
      deleted_at: room.deleted_at,
      photo_url: room.photo_url,
      items_count: room.items_count ?? 0,
      places_count: room.places_count ?? 0,
      containers_count: room.containers_count ?? 0,
    }));

    return NextResponse.json({
      data: rooms,
    });
  } catch (error) {
    console.error("Ошибка загрузки списка помещений:", error);
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
    const { name, photo_url } = body;

    const insertData: {
      name: string | null;
      photo_url: string | null;
    } = {
      name: name?.trim() || null,
      photo_url: photo_url || null,
    };

    const { data: newRoom, error: insertError } = await supabase
      .from("rooms")
      .insert(insertData)
      .select()
      .single();

    if (insertError) {
      return NextResponse.json(
        { error: insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: newRoom });
  } catch (error) {
    console.error("Ошибка создания помещения:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Произошла ошибка при создании помещения",
      },
      { status: 500 }
    );
  }
}
