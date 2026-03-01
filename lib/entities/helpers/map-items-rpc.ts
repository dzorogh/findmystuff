/**
 * Маппинг строк RPC get_items_with_room в тип Item для GET /api/items.
 */

import type { Item, ItemsRpcRow } from "@/types/entity";

export type { ItemsRpcRow };

export function mapItemsRpcToItems(rows: ItemsRpcRow[]): Item[] {
  return rows.map((item) => {
    const hasLocation = Boolean(item.destination_type);
    const price =
      item.price_amount != null && item.price_currency
        ? { amount: item.price_amount, currency: item.price_currency }
        : null;
    const currentValue =
      item.current_value_amount != null && item.current_value_currency
        ? {
            amount: item.current_value_amount,
            currency: item.current_value_currency,
          }
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
            destination_type: item.destination_type as
              | "room"
              | "place"
              | "container"
              | "furniture"
              | null,
            destination_id: item.destination_id,
            moved_at: item.moved_at || "",
            room_name: item.room_name ?? null,
            destination_name: null,
          }
        : null,
    };
  });
}
