import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/shared/supabase/server";
import { normalizeSortParams } from "@/lib/shared/api/list-params";
import { getFurnitureWithCountsRpc } from "@/lib/furniture/api";
import { requireAuthAndTenant } from "@/lib/shared/api/require-auth";
import { apiErrorResponse } from "@/lib/shared/api/api-error-response";
import { parseOptionalInt } from "@/lib/shared/api/parse-optional-int";
import { DEFAULT_PAGE_LIMIT } from "@/lib/shared/api/constants";
import type { Furniture } from "@/types/entity";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuthAndTenant(request);
    if (auth instanceof NextResponse) return auth;
    const { tenantId } = auth;
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query") || null;
    const showDeleted = searchParams.get("showDeleted") === "true";
    const roomId = parseOptionalInt(searchParams.get("roomId"));
    const { sortBy, sortDirection } = normalizeSortParams(
      searchParams.get("sortBy"),
      searchParams.get("sortDirection")
    );

    const { data: furnitureData, error: fetchError } = await getFurnitureWithCountsRpc(supabase, {
      search_query: query?.trim() || null,
      show_deleted: showDeleted,
      page_limit: DEFAULT_PAGE_LIMIT,
      page_offset: 0,
      sort_by: sortBy,
      sort_direction: sortDirection,
      filter_room_id: roomId,
      filter_tenant_id: tenantId,
    });

    if (fetchError) {
      return NextResponse.json(
        { error: fetchError.message },
        { status: 500 }
      );
    }

    type FurnitureRow = {
      id: number;
      name: string | null;
      room_id: number;
      room_name: string | null;
      furniture_type_id: number | null;
      furniture_type_name: string | null;
      created_at: string;
      deleted_at: string | null;
      photo_url: string | null;
      places_count: number;
      total_count?: number;
    };

    if (!furnitureData || furnitureData.length === 0) {
      return NextResponse.json({
        data: [],
        totalCount: 0,
      });
    }

    const rows = furnitureData as FurnitureRow[];
    const totalCount =
      rows[0]?.total_count != null ? Number(rows[0].total_count) : rows.length;

    const furniture: Furniture[] = rows.map((f) => ({
      id: f.id,
      name: f.name,
      room_id: f.room_id,
      room: f.room_id != null ? { id: f.room_id, name: f.room_name ?? null } : null,
      furniture_type_id: f.furniture_type_id ?? null,
      furniture_type: f.furniture_type_name ? { name: f.furniture_type_name } : null,
      created_at: f.created_at,
      deleted_at: f.deleted_at,
      photo_url: f.photo_url,
      places_count: f.places_count ?? 0,
    }));

    return NextResponse.json({
      data: furniture,
      totalCount,
    });
  } catch (error) {
    return apiErrorResponse(error, {
      context: "Ошибка загрузки списка мебели:",
      defaultMessage: "Произошла ошибка при загрузке данных",
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuthAndTenant(request);
    if (auth instanceof NextResponse) return auth;
    const { tenantId } = auth;
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

    if (room_id == null || room_id === "") {
      return NextResponse.json(
        { error: "Необходимо указать помещение" },
        { status: 400 }
      );
    }

    const hasPriceAmount = price_amount != null && price_amount !== "";
    const hasPriceCurrency = price_currency != null && price_currency !== "";
    const hasCurrentValueAmount = current_value_amount != null && current_value_amount !== "";
    const hasCurrentValueCurrency = current_value_currency != null && current_value_currency !== "";

    const insertData: {
      name: string | null;
      room_id: number;
      furniture_type_id: number | null;
      photo_url: string | null;
      tenant_id: number;
      price_amount?: number | null;
      price_currency?: string | null;
      current_value_amount?: number | null;
      current_value_currency?: string | null;
      purchase_date?: string | null;
    } = {
      name: name?.trim() || null,
      room_id: Number(room_id),
      tenant_id: tenantId,
      furniture_type_id: furniture_type_id != null ? (Number(furniture_type_id) || null) : null,
      photo_url: photo_url || null,
      price_amount: hasPriceAmount ? Number(price_amount) : null,
      price_currency: hasPriceCurrency ? String(price_currency).trim() : null,
      current_value_amount: hasCurrentValueAmount ? Number(current_value_amount) : null,
      current_value_currency: hasCurrentValueCurrency ? String(current_value_currency).trim() : null,
      purchase_date: purchase_date && purchase_date.trim() ? purchase_date.trim() : null,
    };

    const { data: newFurniture, error: insertError } = await supabase
      .from("furniture")
      .insert(insertData)
      .select()
      .single();

    if (insertError) {
      return NextResponse.json(
        { error: insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: newFurniture });
  } catch (error) {
    return apiErrorResponse(error, {
      context: "Ошибка создания мебели:",
      defaultMessage: "Произошла ошибка при создании мебели",
    });
  }
}
