/**
 * API методы для работы с помещениями (rooms)
 */

import { ApiClientBase } from "./base";
import type {
  Room,
  Item,
  Place,
  Container,
  CreateRoomResponse,
} from "@/types/entity";

export class RoomsApi extends ApiClientBase {
  async getRooms(params?: { query?: string; showDeleted?: boolean }) {
    const searchParams = new URLSearchParams();
    if (params?.query) searchParams.set("query", params.query);
    if (params?.showDeleted) searchParams.set("showDeleted", "true");

    const queryString = searchParams.toString();
    // API возвращает { data: Room[] }
    // request возвращает это напрямую, поэтому response будет { data: Room[] }
    // И response.data будет Room[]
    return this.request<Room[]>(
      `/rooms${queryString ? `?${queryString}` : ""}`
    );
  }

  async getRoom(id: number) {
    return this.request<{
      room: Room;
      items: Item[];
      places: Place[];
      containers: Container[];
    }>(`/rooms/${id}`);
  }

  async getRoomsSimple(includeDeleted = false) {
    return this.request<Room[]>(`/rooms?showDeleted=${includeDeleted}`);
  }

  async createRoom(data: {
    name?: string;
    photo_url?: string;
  }) {
    return this.request<CreateRoomResponse>("/rooms", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateRoom(id: number, data: { name?: string; photo_url?: string }) {
    return this.request<Room>(`/rooms/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }
}
