import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/shared/supabase/server";
import { normalizeSortParams } from "@/lib/shared/api/list-params";
import { validateItemMoney } from "@/lib/shared/api/validate-item-money";
import { getItemsWithRoomRpc } from "@/lib/entities/api";
import { requireAuthAndTenant } from "@/lib/shared/api/require-auth";
import { apiErrorResponse } from "@/lib/shared/api/api-error-response";
import { parseOptionalInt } from "@/lib/shared/api/parse-optional-int";
import type { Item } from "@/types/entity";

/**
 * Retrieve a paginated, optionally filtered and sorted list of items including each item's last known location and the total matching count.
 *
 * Expects query parameters: `query`, `showDeleted`, `page`, `limit`, `locationType`, `roomId`, `hasPhoto`, `sortBy`, and `sortDirection`. Requires an authenticated user; responds with 401 if not authenticated.
 *
 * @param request - Incoming NextRequest containing the query parameters described above
 * @returns An object with `data` and `totalCount`:
 *  - `data`: an array of items where each item includes `id`, `name`, `item_type_id`, optional `item_type` (with `name`), `created_at`, `deleted_at`, `photo_url`, `room_id`, `room_name`, and `last_location` (object with `destination_type`, `destination_id`, `moved_at`, `room_name` or `null` if no location).
 *  - `totalCount`: the total number of items matching the query
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuthAndTenant(request);
    if (auth instanceof NextResponse) return auth;
    const { tenantId } = auth;
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query") || null;
    const showDeleted = searchParams.get("showDeleted") === "true";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const locationType = searchParams.get("locationType") || null;
    const roomId = parseOptionalInt(searchParams.get("roomId"));
    const placeId = parseOptionalInt(searchParams.get("placeId"));
    const containerId = parseOptionalInt(searchParams.get("containerId"));
    const furnitureId = parseOptionalInt(searchParams.get("furnitureId"));
    const hasPhoto = searchParams.get("hasPhoto") === "true" ? true : searchParams.get("hasPhoto") === "false" ? false : null;
    const { sortBy, sortDirection } = normalizeSortParams(
      searchParams.get("sortBy"),
      searchParams.get("sortDirection")
    );

    const from = (page - 1) * limit;

    const { data: itemsData, error: itemsError } = await getItemsWithRoomRpc(supabase, {
      search_query: query?.trim() || null,
      show_deleted: showDeleted,
      page_limit: limit,
      page_offset: from,
      location_type: locationType,
      room_id: roomId,
      place_id: placeId,
      container_id: containerId,
      furniture_id: furnitureId,
      has_photo: hasPhoto,
      sort_by: sortBy,
      sort_direction: sortDirection,
      filter_tenant_id: tenantId,
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
      item_type_id: number | null;
      item_type_name: string | null;
      created_at: string;
      deleted_at: string | null;
      photo_url: string | null;
      price_amount: number | null;
      price_currency: string | null;
      current_value_amount: number | null;
      current_value_currency: string | null;
      quantity: number | null;
      purchase_date: string | null;
      destination_type: string | null;
      destination_id: number | null;
      moved_at: string | null;
      room_name: string | null;
      room_id: number | null;
    }) => {
      const hasLocation = Boolean(item.destination_type);
      const price =
        item.price_amount != null && item.price_currency
          ? { amount: item.price_amount, currency: item.price_currency }
          : null;
      const currentValue =
        item.current_value_amount != null && item.current_value_currency
          ? { amount: item.current_value_amount, currency: item.current_value_currency }
          : null;

      return {
        id: item.id,
        name: item.name,
        item_type_id: item.item_type_id ?? null,
        item_type: item.item_type_name ? { name: item.item_type_name } : null,
        created_at: item.created_at,
        deleted_at: item.deleted_at,
        photo_url: item.photo_url,
        price,
        currentValue,
        quantity: item.quantity ?? null,
        purchaseDate: item.purchase_date ?? null,
        room_id: item.room_id ?? null,
        room_name: item.room_name ?? null,
        last_location: hasLocation
          ? {
              destination_type: item.destination_type as "room" | "place" | "container" | "furniture" | null,
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
    return apiErrorResponse(error, {
      context: "Ошибка загрузки списка вещей:",
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
      photo_url,
      destination_type,
      destination_id,
      item_type_id,
      quantity,
      purchase_date,
    } = body;

    const moneyValidation = validateItemMoney(body);
    if (moneyValidation instanceof NextResponse) return moneyValidation;

    const insertItemData: {
      name: string | null;
      photo_url: string | null;
      item_type_id: number | null;
      price_amount: number | null;
      price_currency: string | null;
      current_value_amount: number | null;
      current_value_currency: string | null;
      quantity: number | null;
      purchase_date: string | null;
      tenant_id: number;
    } = {
      name: name?.trim() || null,
      photo_url: photo_url || null,
      item_type_id: item_type_id != null ? (Number(item_type_id) || null) : null,
      price_amount: moneyValidation.price_amount,
      price_currency: moneyValidation.price_currency,
      current_value_amount: moneyValidation.current_value_amount,
      current_value_currency: moneyValidation.current_value_currency,
      quantity: quantity != null && quantity !== "" ? Number(quantity) : 1,
      purchase_date: purchase_date && purchase_date.trim() ? purchase_date.trim() : null,
      tenant_id: tenantId,
    };

    if (
      insertItemData.quantity != null &&
      (insertItemData.quantity < 1 || !Number.isInteger(insertItemData.quantity))
    ) {
      return NextResponse.json(
        { error: "Количество должно быть целым числом не менее 1" },
        { status: 400 }
      );
    }

    const { data: newItem, error: insertError } = await supabase
      .from("items")
      .insert(insertItemData)
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
          tenant_id: tenantId,
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
    return apiErrorResponse(error, {
      context: "Ошибка создания вещи:",
      defaultMessage: "Произошла ошибка при создании вещи",
    });
  }
}