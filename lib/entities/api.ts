/**
 * API для сущностей: items, entity-types, transitions
 */

import { HttpClient } from "@/lib/shared/api/http-client";
import type {
  Item,
  Transition,
  EntityType,
  CreateItemResponse,
  CreateEntityTypeResponse,
  UpdateEntityTypeResponse,
  CreateTransitionResponse,
} from "@/types/entity";

class EntitiesApiClient extends HttpClient {
  async getItems(params?: {
    query?: string;
    showDeleted?: boolean;
    page?: number;
    limit?: number;
    locationType?: string | null;
    roomId?: number | null;
    hasPhoto?: boolean | null;
  }) {
    const searchParams = new URLSearchParams();
    if (params?.query) searchParams.set("query", params.query);
    if (params?.showDeleted) searchParams.set("showDeleted", "true");
    if (params?.page) searchParams.set("page", params.page.toString());
    if (params?.limit) searchParams.set("limit", params.limit.toString());
    if (params?.locationType) searchParams.set("locationType", params.locationType);
    if (params?.roomId) searchParams.set("roomId", params.roomId.toString());
    if (params?.hasPhoto !== undefined && params.hasPhoto !== null) {
      searchParams.set("hasPhoto", params.hasPhoto ? "true" : "false");
    }
    const queryString = searchParams.toString();
    return this.request<Item[]>(`/items${queryString ? `?${queryString}` : ""}`);
  }

  async getItem(id: number, includeTransitions = true) {
    const url = includeTransitions ? `/items/${id}` : `/items/${id}?includeTransitions=false`;
    return this.request<{ item: Item; transitions?: Transition[] }>(url);
  }

  async getItemTransitions(id: number) {
    return this.request<Transition[]>(`/items/${id}/transitions`);
  }

  async createItem(data: {
    name?: string;
    photo_url?: string;
    destination_type?: string;
    destination_id?: number;
  }) {
    return this.request<CreateItemResponse>("/items", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateItem(id: number, data: { name?: string; photo_url?: string }) {
    return this.request<Item>(`/items/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async getEntityTypes(category?: string) {
    const url = category ? `/entity-types?category=${category}` : "/entity-types";
    return this.request<EntityType[]>(url);
  }

  async createEntityType(data: { entity_category: "place" | "container"; name: string }) {
    return this.request<CreateEntityTypeResponse>("/entity-types", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateEntityType(data: { id: number; name?: string }) {
    return this.request<UpdateEntityTypeResponse>("/entity-types", {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async deleteEntityType(id: number) {
    return this.request<{ success: boolean }>(`/entity-types?id=${id}`, {
      method: "DELETE",
    });
  }

  async createTransition(data: {
    item_id?: number;
    place_id?: number;
    container_id?: number;
    destination_type: string;
    destination_id: number;
  }) {
    return this.request<CreateTransitionResponse>("/transitions", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }
}

const entitiesApiClient = new EntitiesApiClient();

export const getItems = (params?: Parameters<EntitiesApiClient["getItems"]>[0]) =>
  entitiesApiClient.getItems(params);
export const getItem = (id: number, includeTransitions?: boolean) =>
  entitiesApiClient.getItem(id, includeTransitions);
export const getItemTransitions = (id: number) => entitiesApiClient.getItemTransitions(id);
export const createItem = (data: Parameters<EntitiesApiClient["createItem"]>[0]) =>
  entitiesApiClient.createItem(data);
export const updateItem = (id: number, data: Parameters<EntitiesApiClient["updateItem"]>[1]) =>
  entitiesApiClient.updateItem(id, data);
export const getEntityTypes = (category?: string) => entitiesApiClient.getEntityTypes(category);
export const createEntityType = (data: Parameters<EntitiesApiClient["createEntityType"]>[0]) =>
  entitiesApiClient.createEntityType(data);
export const updateEntityType = (data: Parameters<EntitiesApiClient["updateEntityType"]>[0]) =>
  entitiesApiClient.updateEntityType(data);
export const deleteEntityType = (id: number) => entitiesApiClient.deleteEntityType(id);
export const createTransition = (data: Parameters<EntitiesApiClient["createTransition"]>[0]) =>
  entitiesApiClient.createTransition(data);
