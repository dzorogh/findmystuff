import { HttpClient } from "./http-client";

export type DuplicatableEntityTable = "items" | "places" | "containers" | "rooms" | "buildings";

class DuplicateEntityApi extends HttpClient {
  async duplicate(table: DuplicatableEntityTable, id: number) {
    return this.request<{ id: number }>(`/entities/${table}/${id}/duplicate`, {
      method: "POST",
    });
  }
}

export const duplicateEntityApi = new DuplicateEntityApi();
