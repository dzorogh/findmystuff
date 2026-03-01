/**
 * API для мест (places)
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { HttpClient } from "@/lib/shared/api/http-client";
import { appendSortParams } from "@/lib/shared/api/list-params";
import type { SortBy, SortDirection } from "@/types/api";
import type {
  Place,
  Transition,
  Item,
  Container,
  CreatePlaceResponse,
} from "@/types/entity";

/** RPC get_places_with_room (вызывать из app/api). */
export function getPlacesWithRoomRpc(
  supabase: SupabaseClient,
  params: {
    search_query: string | null;
    show_deleted: boolean;
    page_limit: number;
    page_offset: number;
    sort_by: SortBy;
    sort_direction: SortDirection;
    filter_entity_type_id?: number | null;
    filter_room_id?: number | null;
    filter_furniture_id?: number | null;
    filter_tenant_id?: number | null;
  }
) {
  return supabase.rpc("get_places_with_room", {
    ...params,
    filter_tenant_id: params.filter_tenant_id ?? null,
  });
}

class PlacesApiClient extends HttpClient {
  async getPlaces(params?: {
    query?: string;
    showDeleted?: boolean;
    sortBy?: SortBy;
    sortDirection?: SortDirection;
    entityTypeId?: number | null;
    roomId?: number | null;
    furnitureId?: number | null;
    tenantId?: number | null;
  }) {
    const searchParams = new URLSearchParams();
    if (params?.query) searchParams.set("query", params.query);
    if (params?.showDeleted) searchParams.set("showDeleted", "true");
    if (params?.entityTypeId != null) searchParams.set("entityTypeId", String(params.entityTypeId));
    if (params?.roomId != null) searchParams.set("roomId", String(params.roomId));
    if (params?.furnitureId != null) searchParams.set("furnitureId", String(params.furnitureId));
    appendSortParams(searchParams, params?.sortBy, params?.sortDirection);
    const queryString = searchParams.toString();
    return this.request<Place[]>(`/places${queryString ? `?${queryString}` : ""}`, {
      tenantId: params?.tenantId,
    });
  }

  async getPlace(id: number, tenantId?: number | null) {
    return this.request<{
      place: Place;
      transitions: Transition[];
      items: Item[];
      containers: Container[];
    }>(`/places/${id}`, { tenantId });
  }

  async getPlacesSimple(includeDeleted = false, tenantId?: number | null) {
    return this.request<Place[]>(`/places?showDeleted=${includeDeleted}`, {
      tenantId,
    });
  }

  async createPlace(data: {
    name?: string;
    entity_type_id?: number;
    photo_url?: string;
    destination_type?: string;
    destination_id?: number;
  }, tenantId?: number | null) {
    return this.request<CreatePlaceResponse>("/places", {
      method: "POST",
      body: JSON.stringify(data),
      tenantId,
    });
  }

  async updatePlace(
    id: number,
    data: { name?: string; entity_type_id?: number; photo_url?: string | null },
    tenantId?: number | null
  ) {
    return this.request<Place>(`/places/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
      tenantId,
    });
  }
}

const placesApiClient = new PlacesApiClient();

export const getPlaces = (params?: Parameters<PlacesApiClient["getPlaces"]>[0]) =>
  placesApiClient.getPlaces(params);
export const getPlace = (id: number) => placesApiClient.getPlace(id);
export const getPlacesSimple = (includeDeleted?: boolean) =>
  placesApiClient.getPlacesSimple(includeDeleted);
export const createPlace = (data: Parameters<PlacesApiClient["createPlace"]>[0]) =>
  placesApiClient.createPlace(data);
export const updatePlace = (
  id: number,
  data: Parameters<PlacesApiClient["updatePlace"]>[1]
) => placesApiClient.updatePlace(id, data);
