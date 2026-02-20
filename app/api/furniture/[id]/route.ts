import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/shared/supabase/server";
import { getServerUser } from "@/lib/users/server";
import { getActiveTenantId } from "@/lib/tenants/server";
import { getPlacesWithRoomRpc } from "@/lib/furniture/api";
import type { Furniture } from "@/types/entity";

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
    const furnitureId = parseInt(resolvedParams.id, 10);

    if (isNaN(furnitureId) || furnitureId <= 0) {
      return NextResponse.json({ error: "Неверный ID мебели" }, { status: 400 });
    }

    const { data: furnitureData, error: furnitureError } = await supabase
      .from("furniture")
      .select("id, name, room_id, photo_url, created_at, deleted_at, furniture_type_id, price_amount, price_currency, current_value_amount, current_value_currency, purchase_date")
      .eq("id", furnitureId)
      .single();

    if (furnitureError || !furnitureData) {
      return NextResponse.json(
        { error: furnitureError?.message ?? "Мебель не найдена" },
        { status: 404 }
      );
    }

    let roomName: string | null = null;
    let furnitureTypeName: string | null = null;
    if (furnitureData.room_id) {
      const { data: roomRow } = await supabase
        .from("rooms")
        .select("name")
        .eq("id", furnitureData.room_id)
        .single();
      roomName = roomRow?.name ?? null;
    }
    if (furnitureData.furniture_type_id) {
      const { data: typeRow } = await supabase
        .from("entity_types")
        .select("name")
        .eq("id", furnitureData.furniture_type_id)
        .single();
      furnitureTypeName = typeRow?.name ?? null;
    }

    const furniture: Furniture = {
      id: furnitureData.id,
      name: furnitureData.name,
      photo_url: furnitureData.photo_url,
      created_at: furnitureData.created_at,
      deleted_at: furnitureData.deleted_at,
      room_id: furnitureData.room_id,
      room_name: roomName,
      furniture_type_id: furnitureData.furniture_type_id ?? null,
      furniture_type: furnitureTypeName ? { name: furnitureTypeName } : null,
      price:
        furnitureData.price_amount != null && furnitureData.price_currency
          ? { amount: furnitureData.price_amount, currency: furnitureData.price_currency }
          : null,
      currentValue:
        furnitureData.current_value_amount != null && furnitureData.current_value_currency
          ? { amount: furnitureData.current_value_amount, currency: furnitureData.current_value_currency }
          : null,
      purchaseDate: furnitureData.purchase_date ?? null,
    };

    const { data: placesData } = await getPlacesWithRoomRpc(supabase, {
      search_query: null,
      show_deleted: false,
      page_limit: 500,
      page_offset: 0,
      sort_by: "created_at",
      sort_direction: "desc",
      filter_entity_type_id: null,
      filter_room_id: null,
      filter_furniture_id: furnitureId,
    });

    const places = (placesData ?? []).map((p: { id: number; name: string | null; entity_type_id: number | null }) => ({
      id: p.id,
      name: p.name,
      entity_type_id: p.entity_type_id ?? null,
    }));

    return NextResponse.json({
      data: { furniture, places },
    });
  } catch (error) {
    console.error("Ошибка загрузки данных мебели:", error);
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
    const furnitureId = parseInt(resolvedParams.id, 10);

    if (isNaN(furnitureId) || furnitureId <= 0) {
      return NextResponse.json({ error: "Неверный ID мебели" }, { status: 400 });
    }

    const body = await request.json();
    const {
      name,
      room_id,
      furniture_type_id,
      photo_url,
      price_amount,
      price_currency,
      current_value_amount,
      current_value_currency,
      purchase_date,
    } = body;

    const hasPriceAmount = price_amount != null && price_amount !== "";
    const hasPriceCurrency = price_currency != null && price_currency !== "";
    const hasCurrentValueAmount = current_value_amount != null && current_value_amount !== "";
    const hasCurrentValueCurrency = current_value_currency != null && current_value_currency !== "";

    const updateData: {
      name?: string | null;
      room_id?: number;
      furniture_type_id?: number | null;
      photo_url?: string | null;
      price_amount?: number | null;
      price_currency?: string | null;
      current_value_amount?: number | null;
      current_value_currency?: string | null;
      purchase_date?: string | null;
    } = {};
    if (name !== undefined) updateData.name = name?.trim() || null;
    if (room_id !== undefined) updateData.room_id = Number(room_id);
    if (furniture_type_id !== undefined)
      updateData.furniture_type_id = furniture_type_id != null ? (Number(furniture_type_id) || null) : null;
    if (photo_url !== undefined) updateData.photo_url = photo_url || null;
    if (price_amount !== undefined) updateData.price_amount = hasPriceAmount ? Number(price_amount) : null;
    if (price_currency !== undefined) updateData.price_currency = hasPriceCurrency ? String(price_currency).trim() : null;
    if (current_value_amount !== undefined)
      updateData.current_value_amount = hasCurrentValueAmount ? Number(current_value_amount) : null;
    if (current_value_currency !== undefined)
      updateData.current_value_currency = hasCurrentValueCurrency ? String(current_value_currency).trim() : null;
    if (purchase_date !== undefined)
      updateData.purchase_date = purchase_date && purchase_date.trim() ? purchase_date.trim() : null;

    const { data, error } = await supabase
      .from("furniture")
      .update(updateData)
      .eq("id", furnitureId)
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
    console.error("Ошибка обновления мебели:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Произошла ошибка при обновлении мебели",
      },
      { status: 500 }
    );
  }
}
