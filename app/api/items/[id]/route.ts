import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/shared/supabase/server";
import { requireAuthAndTenant } from "@/lib/shared/api/require-auth";
import { requireIdParam } from "@/lib/shared/api/require-id-param";
import { apiErrorResponse } from "@/lib/shared/api/api-error-response";
import { HTTP_STATUS } from "@/lib/shared/api/http-status";
import { validateItemMoney } from "@/lib/shared/api/validate-item-money";
import { normalizeEntityTypeRelation } from "@/lib/shared/api/normalize-entity-type-relation";
import type { Item } from "@/types/entity";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const auth = await requireAuthAndTenant(request);
    if (auth instanceof NextResponse) return auth;
    const { tenantId } = auth;
    const idResult = await requireIdParam(params, { entityLabel: "вещи" });
    if (idResult instanceof NextResponse) return idResult;
    const itemId = idResult.id;
    const supabase = await createClient();

    const { data: itemData, error: itemError } = await supabase
      .from("items")
      .select("id, name, created_at, deleted_at, photo_url, item_type_id, price_amount, price_currency, current_value_amount, current_value_currency, quantity, purchase_date, entity_types(name)")
      .eq("id", itemId)
      .eq("tenant_id", tenantId)
      .single();

    if (itemError) {
      return NextResponse.json(
        { error: itemError.message },
        { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
      );
    }

    if (!itemData) {
      const body: { error: string; debug?: { itemId: number; tenantId: number } } = { error: "Вещь не найдена" };
      if (process.env.NODE_ENV === "development") {
        body.debug = { itemId, tenantId };
      }
      return NextResponse.json(body, { status: HTTP_STATUS.NOT_FOUND });
    }

    const itemEntityType = normalizeEntityTypeRelation(itemData.entity_types);
    const { entity_types: _et, price_amount, price_currency, current_value_amount, current_value_currency, quantity, purchase_date, ...restItemData } = itemData;
    const item: Item = {
      ...restItemData,
      item_type_id: itemData.item_type_id ?? null,
      item_type: itemEntityType?.name ? { name: itemEntityType.name } : null,
      price:
        price_amount != null && price_currency
          ? { amount: price_amount, currency: price_currency }
          : null,
      currentValue:
        current_value_amount != null && current_value_currency
          ? { amount: current_value_amount, currency: current_value_currency }
          : null,
      quantity: quantity ?? null,
      purchaseDate: purchase_date ?? null,
    };

    return NextResponse.json({ data: item });
  } catch (error) {
    return apiErrorResponse(error, {
      context: "Ошибка загрузки данных вещи:",
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
    const { tenantId } = auth;
    const idResult = await requireIdParam(params, { entityLabel: "вещи" });
    if (idResult instanceof NextResponse) return idResult;
    const itemId = idResult.id;
    const supabase = await createClient();

    const body = await request.json();
    const { name, photo_url, item_type_id, quantity, purchase_date } = body;

    const moneyValidation = validateItemMoney(body);
    if (moneyValidation instanceof NextResponse) return moneyValidation;

    const updateData: {
      name?: string | null;
      photo_url?: string | null;
      item_type_id?: number | null;
      price_amount?: number | null;
      price_currency?: string | null;
      current_value_amount?: number | null;
      current_value_currency?: string | null;
      quantity?: number | null;
      purchase_date?: string | null;
    } = {};
    if (name !== undefined) updateData.name = name?.trim() || null;
    if (photo_url !== undefined) updateData.photo_url = photo_url || null;
    if (item_type_id !== undefined) updateData.item_type_id = item_type_id != null ? (Number(item_type_id) || null) : null;
    if (body.price_amount !== undefined) updateData.price_amount = moneyValidation.price_amount;
    if (body.price_currency !== undefined) updateData.price_currency = moneyValidation.price_currency;
    if (body.current_value_amount !== undefined) updateData.current_value_amount = moneyValidation.current_value_amount;
    if (body.current_value_currency !== undefined) updateData.current_value_currency = moneyValidation.current_value_currency;
    if (quantity !== undefined) updateData.quantity = quantity != null && quantity !== "" ? Number(quantity) : 1;
    if (purchase_date !== undefined) updateData.purchase_date = purchase_date && purchase_date.trim() ? purchase_date.trim() : null;

    if (
      updateData.quantity != null &&
      (updateData.quantity < 1 || !Number.isInteger(updateData.quantity))
    ) {
      return NextResponse.json(
        { error: "Количество должно быть целым числом не менее 1" },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    const { data, error } = await supabase
      .from("items")
      .update(updateData)
      .eq("id", itemId)
      .eq("tenant_id", tenantId)
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
      context: "Ошибка обновления вещи:",
      defaultMessage: "Произошла ошибка при обновлении вещи",
    });
  }
}
