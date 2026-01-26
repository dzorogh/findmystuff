/**
 * API методы для мягкого удаления и восстановления сущностей
 */

import { ApiClientBase } from "./base";

export class SoftDeleteApi extends ApiClientBase {
  async softDelete(table: "items" | "places" | "containers" | "rooms", id: number) {
    return this.request<{ success: boolean }>(`/entities/${table}/${id}`, {
      method: "DELETE",
    });
  }

  async restoreDeleted(table: "items" | "places" | "containers" | "rooms", id: number) {
    return this.request<{ success: boolean }>(`/entities/${table}/${id}`, {
      method: "POST",
    });
  }
}
