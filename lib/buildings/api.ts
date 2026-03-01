/**
 * API для зданий (buildings)
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { HttpClient } from "@/lib/shared/api/http-client";
import { appendSortParams } from "@/lib/shared/api/list-params";
import type { SortBy, SortDirection } from "@/types/api";
import type { Building, CreateBuildingResponse } from "@/types/entity";

/** RPC get_buildings_with_counts (вызывать из app/api). */
export function getBuildingsWithCountsRpc(
  supabase: SupabaseClient,
  params: {
    search_query: string | null;
    show_deleted: boolean;
    page_limit: number;
    page_offset: number;
    sort_by: SortBy;
    sort_direction: SortDirection;
    filter_tenant_id?: number | null;
  }
) {
  return supabase.rpc("get_buildings_with_counts", {
    search_query: params.search_query,
    show_deleted: params.show_deleted,
    page_limit: params.page_limit,
    page_offset: params.page_offset,
    sort_by: params.sort_by,
    sort_direction: params.sort_direction,
    filter_tenant_id: params.filter_tenant_id ?? null,
  });
}

class BuildingsApiClient extends HttpClient {
  async getBuildings(params?: {
    query?: string;
    showDeleted?: boolean;
    sortBy?: SortBy;
    sortDirection?: SortDirection;
    tenantId?: number | null;
  }) {
    const searchParams = new URLSearchParams();
    if (params?.query) searchParams.set("query", params.query);
    if (params?.showDeleted) searchParams.set("showDeleted", "true");
    appendSortParams(searchParams, params?.sortBy, params?.sortDirection);
    const queryString = searchParams.toString();
    return this.request<Building[]>(`/buildings${queryString ? `?${queryString}` : ""}`, {
      tenantId: params?.tenantId,
    });
  }

  async getBuilding(id: number, tenantId?: number | null) {
    return this.request<{
      building: Building;
      rooms: Array<{ id: number; name: string | null; room_type_id: number | null }>;
    }>(`/buildings/${id}`, { tenantId });
  }

  async getBuildingsSimple(includeDeleted = false, tenantId?: number | null) {
    return this.request<Building[]>(`/buildings?showDeleted=${includeDeleted}`, {
      tenantId,
    });
  }

  async createBuilding(data: {
    name?: string;
    photo_url?: string;
    building_type_id?: number | null;
  }, tenantId?: number | null) {
    return this.request<CreateBuildingResponse>("/buildings", {
      method: "POST",
      body: JSON.stringify(data),
      tenantId,
    });
  }

  async updateBuilding(
    id: number,
    data: { name?: string; photo_url?: string | null; building_type_id?: number | null },
    tenantId?: number | null
  ) {
    return this.request<Building>(`/buildings/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
      tenantId,
    });
  }
}

const buildingsApiClient = new BuildingsApiClient();

export const getBuildings = (params?: Parameters<BuildingsApiClient["getBuildings"]>[0]) =>
  buildingsApiClient.getBuildings(params);
export const getBuilding = (id: number) => buildingsApiClient.getBuilding(id);
export const getBuildingsSimple = (includeDeleted?: boolean) =>
  buildingsApiClient.getBuildingsSimple(includeDeleted);
export const createBuilding = (data: Parameters<BuildingsApiClient["createBuilding"]>[0]) =>
  buildingsApiClient.createBuilding(data);
export const updateBuilding = (
  id: number,
  data: Parameters<BuildingsApiClient["updateBuilding"]>[1]
) => buildingsApiClient.updateBuilding(id, data);
