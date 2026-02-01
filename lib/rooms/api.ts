/**
 * API для помещений (rooms)
 */

import { HttpClient } from "@/lib/shared/api/http-client";
import type {
  Room,
  Item,
  Place,
  Container,
  CreateRoomResponse,
} from "@/types/entity";

class RoomsApiClient extends HttpClient {
  async getRooms(params?: { query?: string; showDeleted?: boolean }) {
    const searchParams = new URLSearchParams();
    if (params?.query) searchParams.set("query", params.query);
    if (params?.showDeleted) searchParams.set("showDeleted", "true");
    const queryString = searchParams.toString();
    return this.request<Room[]>(`/rooms${queryString ? `?${queryString}` : ""}`);
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

  async createRoom(data: { name?: string; photo_url?: string; room_type_id?: number | null }) {
    return this.request<CreateRoomResponse>("/rooms", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateRoom(id: number, data: { name?: string; photo_url?: string; room_type_id?: number | null }) {
    return this.request<Room>(`/rooms/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }
}

const roomsApiClient = new RoomsApiClient();

export const getRooms = (params?: Parameters<RoomsApiClient["getRooms"]>[0]) =>
  roomsApiClient.getRooms(params);
export const getRoom = (id: number) => roomsApiClient.getRoom(id);
export const getRoomsSimple = (includeDeleted?: boolean) =>
  roomsApiClient.getRoomsSimple(includeDeleted);
export const createRoom = (data: Parameters<RoomsApiClient["createRoom"]>[0]) =>
  roomsApiClient.createRoom(data);
export const updateRoom = (id: number, data: Parameters<RoomsApiClient["updateRoom"]>[1]) =>
  roomsApiClient.updateRoom(id, data);
