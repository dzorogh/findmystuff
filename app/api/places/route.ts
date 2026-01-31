import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { Place } from "@/types/entity";

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

    const { data: placesData, error: fetchError } = await supabase.rpc(
      "get_places_with_room",
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

    if (!placesData || placesData.length === 0) {
      return NextResponse.json({
        data: [],
      });
    }

    const places: Place[] = placesData.map((place: {
      id: number;
      name: string | null;
      entity_type_id: number | null;
      entity_type_name: string | null;
      created_at: string;
      deleted_at: string | null;
      photo_url: string | null;
      room_id: number | null;
      room_name: string | null;
      items_count: number;
      containers_count: number;
    }) => ({
      id: place.id,
      name: place.name,
      entity_type_id: place.entity_type_id || null,
      entity_type: place.entity_type_name
        ? { name: place.entity_type_name }
        : null,
      created_at: place.created_at,
      deleted_at: place.deleted_at,
      photo_url: place.photo_url,
      room: place.room_id
        ? {
            room_id: place.room_id,
            room_name: place.room_name || null,
          }
        : null,
      items_count: place.items_count ?? 0,
      containers_count: place.containers_count ?? 0,
    }));

    return NextResponse.json({
      data: places,
    });
  } catch (error) {
    console.error("Ошибка загрузки списка мест:", error);
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
    const { name, entity_type_id, photo_url, destination_type, destination_id } = body;

    const insertData: {
      name: string | null;
      entity_type_id: number | null;
      photo_url: string | null;
    } = {
      name: name?.trim() || null,
      entity_type_id: entity_type_id || null,
      photo_url: photo_url || null,
    };

    const { data: newPlace, error: insertError } = await supabase
      .from("places")
      .insert(insertData)
      .select()
      .single();

    if (insertError) {
      return NextResponse.json(
        { error: insertError.message },
        { status: 500 }
      );
    }

    // Если указано местоположение, создаем transition
    if (destination_type && destination_id && newPlace) {
      const { error: transitionError } = await supabase
        .from("transitions")
        .insert({
          place_id: newPlace.id,
          destination_type,
          destination_id: parseInt(destination_id),
        });

      if (transitionError) {
        // Удаляем созданное место, если не удалось создать transition
        await supabase.from("places").delete().eq("id", newPlace.id);
        return NextResponse.json(
          { error: transitionError.message },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ data: newPlace });
  } catch (error) {
    console.error("Ошибка создания места:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Произошла ошибка при создании места",
      },
      { status: 500 }
    );
  }
}
