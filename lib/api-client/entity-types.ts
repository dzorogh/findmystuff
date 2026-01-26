/**
 * API методы для работы с типами сущностей (entity types)
 */

import { ApiClientBase } from "./base";
import type {
  EntityType,
  CreateEntityTypeResponse,
  UpdateEntityTypeResponse,
} from "@/types/entity";

export class EntityTypesApi extends ApiClientBase {
  async getEntityTypes(category?: string) {
    const url = category ? `/entity-types?category=${category}` : "/entity-types";
    // API возвращает { data: EntityType[] }
    // request возвращает это напрямую, поэтому response будет { data: EntityType[] }
    // И response.data будет EntityType[]
    return this.request<EntityType[]>(url);
  }

  async createEntityType(data: {
    entity_category: "place" | "container";
    code: string;
    name: string;
  }) {
    return this.request<CreateEntityTypeResponse>("/entity-types", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateEntityType(data: {
    id: number;
    code?: string;
    name?: string;
  }) {
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
}
