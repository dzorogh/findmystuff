import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/shared/supabase/server";
import { requireAuthAndTenant } from "@/lib/shared/api/require-auth";
import { requireIdParam } from "@/lib/shared/api/require-id-param";
import { validateItemMoney } from "@/lib/shared/api/validate-item-money";
import {
  FURNITURE_DETAIL_PLACES_LIMIT,
  FURNITURE_DETAIL_CHILDREN_LIMIT,
} from "@/lib/shared/api/constants";
import { apiErrorResponse } from "@/lib/shared/api/api-error-response";
import { HTTP_STATUS } from "@/lib/shared/api/http-status";
import { getPlacesWithRoomRpc } from "@/lib/places/api";
import { getItemsWithRoomRpc } from "@/lib/entities/api";
import { getContainersWithLocationRpc } from "@/lib/containers/api";
import type { Furniture } from "@/types/entity";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const auth = await requireAuthAndTenant(request);
    if (auth instanceof NextResponse) return auth;
    const { tenantId } = auth;
    const idResult = await requireIdParam(params, { entityLabel: "мебели" });
    if (idResult instanceof NextResponse) return idResult;
    const furnitureId = idResult.id;
    const supabase = await createClient();

    const { data: furnitureData, error: furnitureError } = await supabase
      .from("furniture")
      .select("id, name, room_id, photo_url, created_at, deleted_at, furniture_type_id, price_amount, price_currency, current_value_amount, current_value_currency, purchase_date")
      .eq("id", furnitureId)
      .eq("tenant_id", tenantId)
      .single();

    if (furnitureError || !furnitureData) {
      return NextResponse.json(
        { error: furnitureError?.message ?? "Мебель не найдена" },
        { status: HTTP_STATUS.NOT_FOUND }
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
      room: furnitureData.room_id != null ? { id: furnitureData.room_id, name: roomName ?? null } : null,
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
      page_limit: FURNITURE_DETAIL_PLACES_LIMIT,
      page_offset: 0,
      sort_by: "created_at",
      sort_direction: "desc",
      filter_entity_type_id: null,
      filter_room_id: null,
      filter_furniture_id: furnitureId,
      filter_tenant_id: tenantId,
    });

    const places = (placesData ?? []).map((p: { id: number; name: string | null; entity_type_id: number | null }) => ({
      id: p.id,
      name: p.name,
      entity_type_id: p.entity_type_id ?? null,
    }));

    const [{ data: itemsData }, { data: containersData }] = await Promise.all([
      getItemsWithRoomRpc(supabase, {
        search_query: null,
        show_deleted: false,
        page_limit: FURNITURE_DETAIL_CHILDREN_LIMIT,
        page_offset: 0,
        location_type: "furniture",
        room_id: null,
        place_id: null,
        container_id: null,
        furniture_id: furnitureId,
        has_photo: null,
        sort_by: "created_at",
        sort_direction: "desc",
        filter_tenant_id: tenantId,
      }),
      getContainersWithLocationRpc(supabase, {
        search_query: null,
        show_deleted: false,
        page_limit: FURNITURE_DETAIL_CHILDREN_LIMIT,
        page_offset: 0,
        sort_by: "created_at",
        sort_direction: "desc",
        p_entity_type_id: null,
        p_has_items: null,
        p_destination_type: "furniture",
        filter_tenant_id: tenantId,
        p_furniture_id: furnitureId,
      }),
    ]);

    const items = (itemsData ?? []).map((item: { id: number; name: string | null; photo_url: string | null; created_at: string }) => ({
      id: item.id,
      name: item.name,
      photo_url: item.photo_url,
      created_at: item.created_at,
    }));
    const containers = (containersData ?? []).map((c: { id: number; name: string | null; photo_url: string | null; created_at: string }) => ({
      id: c.id,
      name: c.name,
      photo_url: c.photo_url,
      created_at: c.created_at,
    }));

    return NextResponse.json({
      data: { furniture, places, items, containers },
    });
  } catch (error) {
    return apiErrorResponse(error, {
      context: "Ошибка загрузки данных мебели:",
      defaultMessage: "Произошла ошибка при загрузке данных",
    });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const auth = await requireAuthAndTenant(request);
    if (auth instanceof NextResponse) return auth;
    const idResult = await requireIdParam(params, { entityLabel: "мебели" });
    if (idResult instanceof NextResponse) return idResult;
    const furnitureId = idResult.id;
    const supabase = await createClient();

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

    const moneyValidation = validateItemMoney(body);
    if (moneyValidation instanceof NextResponse) return moneyValidation;

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
    if (price_amount !== undefined) updateData.price_amount = moneyValidation.price_amount;
    if (price_currency !== undefined) updateData.price_currency = moneyValidation.price_currency;
    if (current_value_amount !== undefined)
      updateData.current_value_amount = moneyValidation.current_value_amount;
    if (current_value_currency !== undefined)
      updateData.current_value_currency = moneyValidation.current_value_currency;
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
        { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
      );
    }

    return NextResponse.json({ data });
  } catch (error) {
    return apiErrorResponse(error, {
      context: "Ошибка обновления мебели:",
      defaultMessage: "Произошла ошибка при обновлении мебели",
    });
  }
}
