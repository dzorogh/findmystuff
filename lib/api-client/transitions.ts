/**
 * API методы для работы с перемещениями (transitions)
 */

import { ApiClientBase } from "./base";
import type { CreateTransitionResponse } from "@/types/entity";

export class TransitionsApi extends ApiClientBase {
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
