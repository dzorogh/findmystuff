import { HttpClient } from "./http-client";
import type { ApiTableName } from "@/types/entity";

class DuplicateEntityApiClient extends HttpClient {
  async duplicate(table: ApiTableName, id: number) {
    return this.request<{ id: number }>(`/entities/${table}/${id}/duplicate`, {
      method: "POST",
    });
  }
}

export const duplicateEntityApiClient = new DuplicateEntityApiClient();
