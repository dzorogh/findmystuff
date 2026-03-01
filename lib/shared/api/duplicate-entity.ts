import { HttpClient } from "./http-client";
import type { EntityTypeName } from "@/types/entity";

class DuplicateEntityApiClient extends HttpClient {
  async duplicate(table: EntityTypeName, id: number) {
    return this.request<{ id: number }>(`/entities/${table}/${id}/duplicate`, {
      method: "POST",
    });
  }
}

export const duplicateEntityApiClient = new DuplicateEntityApiClient();
