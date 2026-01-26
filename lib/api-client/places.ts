/**
 * API методы для работы с местами (places)
 */

import { ApiClientBase } from "./base";
import type {
  Place,
  Transition,
  Item,
  Container,
  CreatePlaceResponse,
} from "@/types/entity";

export class PlacesApi extends ApiClientBase {
  async getPlaces(params?: { query?: string; showDeleted?: boolean }) {
    const searchParams = new URLSearchParams();
    if (params?.query) searchParams.set("query", params.query);
    if (params?.showDeleted) searchParams.set("showDeleted", "true");

    const queryString = searchParams.toString();
    return this.request<{ data: Place[] }>(
      `/places${queryString ? `?${queryString}` : ""}`
    );
  }

  async getPlace(id: number) {
    return this.request<{
      place: Place;
      transitions: Transition[];
      items: Item[];
      containers: Container[];
    }>(`/places/${id}`);
  }

  async getPlacesSimple(includeDeleted = false) {
    return this.request<{ data: Place[] }>(`/places?showDeleted=${includeDeleted}`);
  }

  async createPlace(data: {
    name?: string;
    entity_type_id?: number;
    marking_number?: string;
    photo_url?: string;
    destination_type?: string;
    destination_id?: number;
  }) {
    return this.request<CreatePlaceResponse>("/places", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updatePlace(
    id: number,
    data: {
      name?: string;
      entity_type_id?: number;
      marking_number?: string;
      photo_url?: string;
    }
  ) {
    return this.request<Place>(`/places/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }
}
