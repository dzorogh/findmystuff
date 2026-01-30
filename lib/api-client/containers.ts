/**
 * API методы для работы с контейнерами (containers)
 */

import { ApiClientBase } from "./base";
import type {
  Container,
  Transition,
  Item,
  CreateContainerResponse,
} from "@/types/entity";

export class ContainersApi extends ApiClientBase {
  async getContainers(params?: { query?: string; showDeleted?: boolean }) {
    const searchParams = new URLSearchParams();
    if (params?.query) searchParams.set("query", params.query);
    if (params?.showDeleted) searchParams.set("showDeleted", "true");

    const queryString = searchParams.toString();
    // API возвращает { data: Container[] }
    // request возвращает это напрямую, поэтому response будет { data: Container[] }
    // И response.data будет Container[]
    return this.request<Container[]>(
      `/containers${queryString ? `?${queryString}` : ""}`
    );
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
    data: {
      name?: string;
      entity_type_id?: number;
      photo_url?: string;
    }
  ) {
    return this.request<Container>(`/containers/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }
}
