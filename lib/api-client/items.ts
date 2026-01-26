/**
 * API методы для работы с вещами (items)
 */

import { ApiClientBase } from "./base";
import type {
  Item,
  Transition,
  CreateItemResponse,
} from "@/types/entity";

export class ItemsApi extends ApiClientBase {
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
    // API возвращает { data: Item[], totalCount: number }
    // request возвращает это напрямую как jsonData
    // Так что response будет { data: Item[], totalCount: number }
    // И response.data будет Item[]
    return this.request<Item[]>(
      `/items${queryString ? `?${queryString}` : ""}`
    );
  }

  async getItem(id: number, includeTransitions = true) {
    const url = includeTransitions 
      ? `/items/${id}` 
      : `/items/${id}?includeTransitions=false`;
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
}
