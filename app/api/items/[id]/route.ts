import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/shared/supabase/server";
import { getServerUser } from "@/lib/users/server";
import { getActiveTenantId } from "@/lib/tenants/server";
import type { ItemEntity } from "@/types/entity";

type Item = ItemEntity;

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const user = await getServerUser();
    if (!user) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }
    const tenantId = await getActiveTenantId(_request.headers);
    if (!tenantId) {
      return NextResponse.json(
        { error: "Выберите тенант или создайте склад" },
        { status: 400 }
      );
    }
    const supabase = await createClient();
    const resolvedParams = await Promise.resolve(params);
    const idString = resolvedParams.id;

    if (!idString) {
      return NextResponse.json({ error: "Неверный ID вещи" }, { status: 400 });
    }

    const itemId = parseInt(idString, 10);

    if (isNaN(itemId) || itemId <= 0) {
      return NextResponse.json({ error: "Неверный ID вещи" }, { status: 400 });
    }

    const { data: itemData, error: itemError } = await supabase
      .from("items")
      .select("id, name, created_at, deleted_at, photo_url, item_type_id, price_amount, price_currency, current_value_amount, current_value_currency, quantity, purchase_date, entity_types(name)")
      .eq("id", itemId)
      .single();

    if (itemError) {
      return NextResponse.json(
        { error: itemError.message },
        { status: 500 }
      );
    }

    if (!itemData) {
      return NextResponse.json({ error: "Вещь не найдена" }, { status: 404 });
    }

    const itemTypes = itemData.entity_types;
    const itemEntityType = Array.isArray(itemTypes) && itemTypes.length > 0
      ? itemTypes[0]
      : itemTypes && !Array.isArray(itemTypes)
        ? itemTypes
        : null;
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

    return NextResponse.json({
      data: {
        item,
      },
    });
  } catch (error) {
    console.error("Ошибка загрузки данных вещи:", error);
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
    const itemId = parseInt(resolvedParams.id, 10);

    if (isNaN(itemId) || itemId <= 0) {
      return NextResponse.json({ error: "Неверный ID вещи" }, { status: 400 });
    }

    const body = await request.json();
    const { name, photo_url, item_type_id, price_amount, price_currency, current_value_amount, current_value_currency, quantity, purchase_date } = body;

    const hasPriceAmount = price_amount != null && price_amount !== "";
    const hasPriceCurrency = price_currency != null && price_currency !== "";
    if (hasPriceAmount !== hasPriceCurrency) {
      return NextResponse.json(
        { error: "Цена и валюта должны быть указаны вместе или оба опущены" },
        { status: 400 }
      );
    }

    const hasCurrentValueAmount = current_value_amount != null && current_value_amount !== "";
    const hasCurrentValueCurrency = current_value_currency != null && current_value_currency !== "";
    if (hasCurrentValueAmount !== hasCurrentValueCurrency) {
      return NextResponse.json(
        { error: "Текущая стоимость и валюта должны быть указаны вместе или оба опущены" },
        { status: 400 }
      );
    }

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
    if (price_amount !== undefined) updateData.price_amount = hasPriceAmount ? Number(price_amount) : null;
    if (price_currency !== undefined) updateData.price_currency = hasPriceCurrency ? String(price_currency).trim() : null;
    if (current_value_amount !== undefined) updateData.current_value_amount = hasCurrentValueAmount ? Number(current_value_amount) : null;
    if (current_value_currency !== undefined) updateData.current_value_currency = hasCurrentValueCurrency ? String(current_value_currency).trim() : null;
    if (quantity !== undefined) updateData.quantity = quantity != null && quantity !== "" ? Number(quantity) : 1;
    if (purchase_date !== undefined) updateData.purchase_date = purchase_date && purchase_date.trim() ? purchase_date.trim() : null;

    if (
      updateData.price_amount != null &&
      (updateData.price_amount < 0 || !Number.isInteger(updateData.price_amount))
    ) {
      return NextResponse.json(
        { error: "Сумма цены должна быть целым неотрицательным числом в минимальных единицах" },
        { status: 400 }
      );
    }

    if (
      updateData.current_value_amount != null &&
      (updateData.current_value_amount < 0 || !Number.isInteger(updateData.current_value_amount))
    ) {
      return NextResponse.json(
        { error: "Сумма текущей стоимости должна быть целым неотрицательным числом в минимальных единицах" },
        { status: 400 }
      );
    }

    if (
      updateData.quantity != null &&
      (updateData.quantity < 1 || !Number.isInteger(updateData.quantity))
    ) {
      return NextResponse.json(
        { error: "Количество должно быть целым числом не менее 1" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("items")
      .update(updateData)
      .eq("id", itemId)
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
    console.error("Ошибка обновления вещи:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Произошла ошибка при обновлении вещи",
      },
      { status: 500 }
    );
  }
}
