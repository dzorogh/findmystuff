/**
 * API для помещений (rooms)
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { HttpClient } from "@/lib/shared/api/http-client";
import { appendSortParams, type SortBy, type SortDirection } from "@/lib/shared/api/list-params";
import type {
  Room,
  Item,
  Place,
  Container,
  Furniture,
  CreateRoomResponse,
} from "@/types/entity";

/** RPC get_rooms_with_counts (вызывать из app/api). */
export function getRoomsWithCountsRpc(
  supabase: SupabaseClient,
  params: {
    search_query: string | null;
    show_deleted: boolean;
    page_limit: number;
    page_offset: number;
    sort_by: SortBy;
    sort_direction: SortDirection;
    has_items?: boolean | null;
    has_containers?: boolean | null;
    has_places?: boolean | null;
    filter_building_id?: number | null;
    filter_tenant_id?: number | null;
  }
) {
  return supabase.rpc("get_rooms_with_counts", {
    search_query: params.search_query,
    show_deleted: params.show_deleted,
    page_limit: params.page_limit,
    page_offset: params.page_offset,
    sort_by: params.sort_by,
    sort_direction: params.sort_direction,
    has_items: params.has_items ?? null,
    has_containers: params.has_containers ?? null,
    has_places: params.has_places ?? null,
    filter_building_id: params.filter_building_id ?? null,
    filter_tenant_id: params.filter_tenant_id ?? null,
  });
}

/** RPC get_item_ids_in_room (вызывать из app/api). */
export function getItemIdsInRoomRpc(supabase: SupabaseClient, roomId: number) {
  return supabase.rpc("get_item_ids_in_room", { p_room_id: roomId });
}

class RoomsApiClient extends HttpClient {
  async getRooms(params?: {
    query?: string;
    showDeleted?: boolean;
    sortBy?: SortBy;
    sortDirection?: SortDirection;
    hasItems?: boolean | null;
    hasContainers?: boolean | null;
    hasPlaces?: boolean | null;
    buildingId?: number | null;
    tenantId?: number | null;
  }) {
    const searchParams = new URLSearchParams();
    if (params?.query) searchParams.set("query", params.query);
    if (params?.showDeleted) searchParams.set("showDeleted", "true");
    if (params?.hasItems !== undefined && params?.hasItems !== null)
      searchParams.set("hasItems", String(params.hasItems));
    if (params?.hasContainers !== undefined && params?.hasContainers !== null)
      searchParams.set("hasContainers", String(params.hasContainers));
    if (params?.hasPlaces !== undefined && params?.hasPlaces !== null)
      searchParams.set("hasPlaces", String(params.hasPlaces));
    if (params?.buildingId !== undefined && params?.buildingId !== null)
      searchParams.set("buildingId", String(params.buildingId));
    appendSortParams(searchParams, params?.sortBy, params?.sortDirection);
    const queryString = searchParams.toString();
    return this.request<Room[]>(`/rooms${queryString ? `?${queryString}` : ""}`, {
      tenantId: params?.tenantId,
    });
  }

  async getRoom(id: number, tenantId?: number | null) {
    return this.request<{
      room: Room;
      items: Item[];
      places: Place[];
      containers: Container[];
      furniture?: Furniture[];
    }>(`/rooms/${id}`, { tenantId });
  }

  async getRoomsSimple(includeDeleted = false, tenantId?: number | null) {
    return this.request<Room[]>(`/rooms?showDeleted=${includeDeleted}`, {
      tenantId,
    });
  }

  async createRoom(data: {
    name?: string;
    photo_url?: string;
    room_type_id?: number | null;
    building_id?: number | null;
  }, tenantId?: number | null) {
    return this.request<CreateRoomResponse>("/rooms", {
      method: "POST",
      body: JSON.stringify(data),
      tenantId,
    });
  }

  async updateRoom(
    id: number,
    data: {
      name?: string;
      photo_url?: string | null;
      room_type_id?: number | null;
      building_id?: number | null;
    },
    tenantId?: number | null
  ) {
    return this.request<Room>(`/rooms/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
      tenantId,
    });
  }
}

const roomsApiClient = new RoomsApiClient();

export const getRooms = (params?: Parameters<RoomsApiClient["getRooms"]>[0]) =>
  roomsApiClient.getRooms(params);
export const getRoom = (id: number) => roomsApiClient.getRoom(id);
export const getRoomsSimple = (includeDeleted?: boolean) =>
  roomsApiClient.getRoomsSimple(includeDeleted);
export const createRoom = (data: Parameters<RoomsApiClient["createRoom"]>[0]) =>
  roomsApiClient.createRoom(data);
export const updateRoom = (id: number, data: Parameters<RoomsApiClient["updateRoom"]>[1]) =>
  roomsApiClient.updateRoom(id, data);
