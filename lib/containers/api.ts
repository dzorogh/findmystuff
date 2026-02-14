/**
 * API для контейнеров (containers)
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { HttpClient } from "@/lib/shared/api/http-client";
import { appendSortParams, type SortBy, type SortDirection } from "@/lib/shared/api/list-params";
import type {
  Container,
  Transition,
  Item,
  CreateContainerResponse,
} from "@/types/entity";

/** RPC get_containers_with_location (вызывать из app/api). */
export function getContainersWithLocationRpc(
  supabase: SupabaseClient,
  params: {
    search_query: string | null;
    show_deleted: boolean;
    page_limit: number;
    page_offset: number;
    sort_by: SortBy;
    sort_direction: SortDirection;
    p_entity_type_id?: number | null;
    p_has_items?: boolean | null;
    p_destination_type?: string | null;
    p_place_id?: number | null;
  }
) {
  return supabase.rpc("get_containers_with_location", params);
}

class ContainersApiClient extends HttpClient {
  async getContainers(params?: {
    query?: string;
    showDeleted?: boolean;
    sortBy?: SortBy;
    sortDirection?: SortDirection;
    entityTypeId?: number | null;
    hasItems?: boolean | null;
    locationType?: string | null;
    placeId?: number | null;
  }) {
    const searchParams = new URLSearchParams();
    if (params?.query) searchParams.set("query", params.query);
    if (params?.showDeleted) searchParams.set("showDeleted", "true");
    appendSortParams(searchParams, params?.sortBy, params?.sortDirection);
    if (params?.entityTypeId != null) searchParams.set("entityTypeId", String(params.entityTypeId));
    if (params?.hasItems != null) searchParams.set("hasItems", String(params.hasItems));
    if (params?.locationType != null && params.locationType !== "all")
      searchParams.set("locationType", params.locationType);
    if (params?.placeId != null) searchParams.set("placeId", String(params.placeId));
    const queryString = searchParams.toString();
    return this.request<Container[]>(`/containers${queryString ? `?${queryString}` : ""}`);
  }

  async getContainer(id: number) {
    return this.request<{
      container: Container;
      transitions: Transition[];
      items: Item[];
    }>(`/containers/${id}`);
  }

  async getContainersSimple(includeDeleted = false) {
    return this.request<Container[]>(`/containers?showDeleted=${includeDeleted}`);
  }

  async createContainer(data: {
    name?: string;
    entity_type_id?: number;
    photo_url?: string;
    destination_type?: string;
    destination_id?: number;
  }) {
    return this.request<CreateContainerResponse>("/containers", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateContainer(
    id: number,
    data: { name?: string; entity_type_id?: number | null; photo_url?: string | null }
  ) {
    return this.request<Container>(`/containers/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }
}

const containersApiClient = new ContainersApiClient();

export const getContainers = (params?: Parameters<ContainersApiClient["getContainers"]>[0]) =>
  containersApiClient.getContainers(params);
export const getContainer = (id: number) => containersApiClient.getContainer(id);
export const getContainersSimple = (includeDeleted?: boolean) =>
  containersApiClient.getContainersSimple(includeDeleted);
export const createContainer = (data: Parameters<ContainersApiClient["createContainer"]>[0]) =>
  containersApiClient.createContainer(data);
export const updateContainer = (
  id: number,
  data: Parameters<ContainersApiClient["updateContainer"]>[1]
) => containersApiClient.updateContainer(id, data);
