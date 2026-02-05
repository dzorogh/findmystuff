/**
 * API для контейнеров (containers)
 */

import { HttpClient } from "@/lib/shared/api/http-client";
import { appendSortParams, type SortBy, type SortDirection } from "@/lib/shared/api/list-params";
import type {
  Container,
  Transition,
  Item,
  CreateContainerResponse,
} from "@/types/entity";

class ContainersApiClient extends HttpClient {
  async getContainers(params?: {
    query?: string;
    showDeleted?: boolean;
    sortBy?: SortBy;
    sortDirection?: SortDirection;
  }) {
    const searchParams = new URLSearchParams();
    if (params?.query) searchParams.set("query", params.query);
    if (params?.showDeleted) searchParams.set("showDeleted", "true");
    appendSortParams(searchParams, params?.sortBy, params?.sortDirection);
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
    data: { name?: string; entity_type_id?: number | null; photo_url?: string }
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
