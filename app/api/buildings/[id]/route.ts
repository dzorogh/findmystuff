import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/shared/supabase/server";
import { getServerUser } from "@/lib/users/server";
import type { Building } from "@/types/entity";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const user = await getServerUser();
    if (!user) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }
    const supabase = await createClient();
    const resolvedParams = await Promise.resolve(params);
    const buildingId = parseInt(resolvedParams.id, 10);

    if (isNaN(buildingId) || buildingId <= 0) {
      return NextResponse.json({ error: "Неверный ID здания" }, { status: 400 });
    }

    const { data: buildingData, error: buildingError } = await supabase
      .from("buildings")
      .select("id, name, photo_url, created_at, deleted_at, building_type_id, entity_types(name)")
      .eq("id", buildingId)
      .single();

    if (buildingError || !buildingData) {
      return NextResponse.json(
        { error: buildingError?.message ?? "Здание не найдено" },
        { status: 404 }
      );
    }

    const entityTypes = buildingData.entity_types;
    const entityType = Array.isArray(entityTypes) && entityTypes.length > 0
      ? entityTypes[0]
      : entityTypes && !Array.isArray(entityTypes)
        ? entityTypes
        : null;

    const building: Building = {
      id: buildingData.id,
      name: buildingData.name,
      photo_url: buildingData.photo_url,
      created_at: buildingData.created_at,
      deleted_at: buildingData.deleted_at,
      building_type_id: buildingData.building_type_id ?? null,
      building_type: entityType?.name ? { name: entityType.name } : null,
    };

    const { data: roomsData } = await supabase
      .from("rooms")
      .select("id, name, room_type_id")
      .eq("building_id", buildingId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    const rooms = (roomsData ?? []).map((r) => ({
      id: r.id,
      name: r.name,
      room_type_id: r.room_type_id ?? null,
    }));

    return NextResponse.json({
      data: { building, rooms },
    });
  } catch (error) {
    console.error("Ошибка загрузки данных здания:", error);
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
    const supabase = await createClient();
    const resolvedParams = await Promise.resolve(params);
    const buildingId = parseInt(resolvedParams.id, 10);

    if (isNaN(buildingId) || buildingId <= 0) {
      return NextResponse.json({ error: "Неверный ID здания" }, { status: 400 });
    }

    const body = await request.json();
    const { name, photo_url, building_type_id } = body;

    const updateData: {
      name?: string | null;
      photo_url?: string | null;
      building_type_id?: number | null;
    } = {};
    if (name !== undefined) updateData.name = name?.trim() || null;
    if (photo_url !== undefined) updateData.photo_url = photo_url || null;
    if (building_type_id !== undefined)
      updateData.building_type_id = building_type_id != null ? (Number(building_type_id) || null) : null;

    const { data, error } = await supabase
      .from("buildings")
      .update(updateData)
      .eq("id", buildingId)
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
    console.error("Ошибка обновления здания:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Произошла ошибка при обновлении здания",
      },
      { status: 500 }
    );
  }
}
