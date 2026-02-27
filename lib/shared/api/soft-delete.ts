/**
 * API методы для мягкого удаления и восстановления сущностей
 */

import { HttpClient } from "./http-client";

export class SoftDeleteApiClient extends HttpClient {
  async softDelete(table: "items" | "places" | "containers" | "rooms" | "buildings" | "furniture", id: number) {
    return this.request<{ success: boolean }>(`/entities/${table}/${id}`, {
      method: "DELETE",
    });
  }

  async restoreDeleted(table: "items" | "places" | "containers" | "rooms" | "buildings" | "furniture", id: number) {
    return this.request<{ success: boolean }>(`/entities/${table}/${id}`, {
      method: "POST",
    });
  }
}

export const softDeleteApiClient = new SoftDeleteApiClient();
