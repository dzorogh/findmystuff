import {
  mapItemsRpcToItems,
  type ItemsRpcRow,
} from "@/lib/entities/helpers/map-items-rpc";

describe("mapItemsRpcToItems", () => {
  it("маппирует строку RPC с местоположением в Item", () => {
    const row: ItemsRpcRow = {
      id: 1,
      name: "Стол",
      item_type_id: 2,
      item_type_name: "Мебель",
      created_at: "2024-01-01T00:00:00Z",
      deleted_at: null,
      photo_url: null,
      price_amount: 1000,
      price_currency: "RUB",
      current_value_amount: 800,
      current_value_currency: "RUB",
      quantity: 1,
      purchase_date: "2023-06-01",
      destination_type: "place",
      destination_id: 10,
      moved_at: "2024-02-01T12:00:00Z",
      room_name: "Гостиная",
      room_id: 5,
    };

    const items = mapItemsRpcToItems([row]);

    expect(items).toHaveLength(1);
    expect(items[0].id).toBe(1);
    expect(items[0].name).toBe("Стол");
    expect(items[0].item_type).toEqual({ name: "Мебель" });
    expect(items[0].price).toEqual({ amount: 1000, currency: "RUB" });
    expect(items[0].currentValue).toEqual({ amount: 800, currency: "RUB" });
    expect(items[0].last_location).not.toBeNull();
    expect(items[0].last_location?.destination_type).toBe("place");
    expect(items[0].last_location?.destination_id).toBe(10);
    expect(items[0].last_location?.moved_at).toBe("2024-02-01T12:00:00Z");
    expect(items[0].last_location?.room_name).toBe("Гостиная");
  });

  it("маппирует строку без местоположения и без цены", () => {
    const row: ItemsRpcRow = {
      id: 2,
      name: "Книга",
      item_type_id: null,
      item_type_name: null,
      created_at: "2024-01-02T00:00:00Z",
      deleted_at: null,
      photo_url: null,
      price_amount: null,
      price_currency: null,
      current_value_amount: null,
      current_value_currency: null,
      quantity: null,
      purchase_date: null,
      destination_type: null,
      destination_id: null,
      moved_at: null,
      room_name: null,
      room_id: null,
    };

    const items = mapItemsRpcToItems([row]);

    expect(items[0].last_location).toBeNull();
    expect(items[0].price).toBeNull();
    expect(items[0].currentValue).toBeNull();
    expect(items[0].item_type).toBeNull();
    expect(items[0].room_id).toBeNull();
    expect(items[0].room_name).toBeNull();
  });

  it("подставляет пустую строку для moved_at при отсутствии", () => {
    const row: ItemsRpcRow = {
      id: 3,
      name: "X",
      item_type_id: null,
      item_type_name: null,
      created_at: "2024-01-01T00:00:00Z",
      deleted_at: null,
      photo_url: null,
      price_amount: null,
      price_currency: null,
      current_value_amount: null,
      current_value_currency: null,
      quantity: null,
      purchase_date: null,
      destination_type: "room",
      destination_id: 1,
      moved_at: null,
      room_name: null,
      room_id: null,
    };

    const items = mapItemsRpcToItems([row]);

    expect(items[0].last_location?.moved_at).toBe("");
  });
});
