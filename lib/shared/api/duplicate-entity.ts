import { HttpClient } from "./http-client";

export type DuplicatableEntityTable = "items" | "places" | "containers" | "rooms" | "buildings" | "furniture";

class DuplicateEntityApiClient extends HttpClient {
  async duplicate(table: DuplicatableEntityTable, id: number) {
    return this.request<{ id: number }>(`/entities/${table}/${id}/duplicate`, {
      method: "POST",
    });
  }
}

export const duplicateEntityApiClient = new DuplicateEntityApiClient();
