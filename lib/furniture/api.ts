/**
 * API для мебели (furniture)
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { HttpClient } from "@/lib/shared/api/http-client";
import { appendSortParams } from "@/lib/shared/api/list-params";
import type { SortBy, SortDirection } from "@/types/api";
import type { Furniture, CreateFurnitureResponse } from "@/types/entity";

/** RPC get_furniture_with_counts (вызывать из app/api). */
export function getFurnitureWithCountsRpc(
  supabase: SupabaseClient,
  params: {
    search_query: string | null;
    show_deleted: boolean;
    page_limit: number;
    page_offset: number;
    sort_by: SortBy;
    sort_direction: SortDirection;
    filter_room_id?: number | null;
    filter_tenant_id?: number | null;
  }
) {
  return supabase.rpc("get_furniture_with_counts", {
    search_query: params.search_query,
    show_deleted: params.show_deleted,
    page_limit: params.page_limit,
    page_offset: params.page_offset,
    sort_by: params.sort_by,
    sort_direction: params.sort_direction,
    filter_room_id: params.filter_room_id ?? null,
    filter_tenant_id: params.filter_tenant_id ?? null,
  });
}

class FurnitureApiClient extends HttpClient {
  async getFurniture(params?: {
    query?: string;
    showDeleted?: boolean;
    sortBy?: SortBy;
    sortDirection?: SortDirection;
    roomId?: number | null;
    tenantId?: number | null;
  }) {
    const searchParams = new URLSearchParams();
    if (params?.query) searchParams.set("query", params.query);
    if (params?.showDeleted) searchParams.set("showDeleted", "true");
    if (params?.roomId != null) searchParams.set("roomId", String(params.roomId));
    appendSortParams(searchParams, params?.sortBy, params?.sortDirection);
    const queryString = searchParams.toString();
    return this.request<Furniture[]>(`/furniture${queryString ? `?${queryString}` : ""}`, {
      tenantId: params?.tenantId,
    });
  }

  async getFurnitureItem(id: number, tenantId?: number | null) {
    return this.request<{
      furniture: Furniture;
      places: Array<{ id: number; name: string | null; entity_type_id: number | null }>;
      items: Array<{ id: number; name: string | null; photo_url: string | null; created_at: string }>;
      containers: Array<{ id: number; name: string | null; photo_url: string | null; created_at: string }>;
    }>(`/furniture/${id}`, { tenantId });
  }

  async getFurnitureSimple(includeDeleted = false, tenantId?: number | null) {
    return this.request<Furniture[]>(`/furniture?showDeleted=${includeDeleted}`, {
      tenantId,
    });
  }

  async createFurniture(data: {
    name?: string;
    room_id: number;
    furniture_type_id?: number | null;
    photo_url?: string | null;
    price_amount?: number | null;
    price_currency?: string | null;
    current_value_amount?: number | null;
    current_value_currency?: string | null;
    purchase_date?: string | null;
  }, tenantId?: number | null) {
    return this.request<CreateFurnitureResponse>("/furniture", {
      method: "POST",
      body: JSON.stringify(data),
      tenantId,
    });
  }

  async updateFurniture(
    id: number,
    data: {
      name?: string;
      room_id?: number;
      furniture_type_id?: number | null;
      photo_url?: string | null;
      price_amount?: number | null;
      price_currency?: string | null;
      current_value_amount?: number | null;
      current_value_currency?: string | null;
      purchase_date?: string | null;
    },
    tenantId?: number | null
  ) {
    return this.request<Furniture>(`/furniture/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
      tenantId,
    });
  }
}

const furnitureApiClient = new FurnitureApiClient();

export const getFurniture = (params?: Parameters<FurnitureApiClient["getFurniture"]>[0]) =>
  furnitureApiClient.getFurniture(params);
export const getFurnitureItem = (id: number) => furnitureApiClient.getFurnitureItem(id);
export const getFurnitureSimple = (includeDeleted?: boolean) =>
  furnitureApiClient.getFurnitureSimple(includeDeleted);
export const createFurniture = (data: Parameters<FurnitureApiClient["createFurniture"]>[0]) =>
  furnitureApiClient.createFurniture(data);
export const updateFurniture = (
  id: number,
  data: Parameters<FurnitureApiClient["updateFurniture"]>[1]
) => furnitureApiClient.updateFurniture(id, data);
