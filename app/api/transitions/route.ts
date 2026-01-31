import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/shared/supabase/server";
import type { DestinationType } from "@/types/entity";

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
    const { item_id, place_id, container_id, destination_type, destination_id } = body;

    if (!destination_type || !destination_id) {
      return NextResponse.json(
        { error: "Необходимы destination_type и destination_id" },
        { status: 400 }
      );
    }

    // Проверяем, что указан хотя бы один из item_id, place_id, container_id
    if (!item_id && !place_id && !container_id) {
      return NextResponse.json(
        { error: "Необходим хотя бы один из: item_id, place_id, container_id" },
        { status: 400 }
      );
    }

    const transitionData: {
      destination_type: DestinationType;
      destination_id: number;
      item_id?: number;
      place_id?: number;
      container_id?: number;
    } = {
      destination_type: destination_type as DestinationType,
      destination_id: parseInt(destination_id),
    };

    if (item_id) transitionData.item_id = parseInt(item_id);
    if (place_id) transitionData.place_id = parseInt(place_id);
    if (container_id) transitionData.container_id = parseInt(container_id);

    const { data, error } = await supabase
      .from("transitions")
      .insert(transitionData)
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
    console.error("Ошибка создания transition:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Произошла ошибка при создании transition",
      },
      { status: 500 }
    );
  }
}
