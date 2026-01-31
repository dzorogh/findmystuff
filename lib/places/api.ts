/**
 * API для мест (places)
 */

import { HttpClient } from "@/lib/shared/api/http-client";
import type {
  Place,
  Transition,
  Item,
  Container,
  CreatePlaceResponse,
} from "@/types/entity";

class PlacesApiClient extends HttpClient {
  async getPlaces(params?: { query?: string; showDeleted?: boolean }) {
    const searchParams = new URLSearchParams();
    if (params?.query) searchParams.set("query", params.query);
    if (params?.showDeleted) searchParams.set("showDeleted", "true");
    const queryString = searchParams.toString();
    return this.request<Place[]>(`/places${queryString ? `?${queryString}` : ""}`);
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
    return this.request<Place[]>(`/places?showDeleted=${includeDeleted}`);
  }

  async createPlace(data: {
    name?: string;
    entity_type_id?: number;
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
    data: { name?: string; entity_type_id?: number; photo_url?: string }
  ) {
    return this.request<Place>(`/places/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }
}

const placesApiClient = new PlacesApiClient();

export const getPlaces = (params?: Parameters<PlacesApiClient["getPlaces"]>[0]) =>
  placesApiClient.getPlaces(params);
export const getPlace = (id: number) => placesApiClient.getPlace(id);
export const getPlacesSimple = (includeDeleted?: boolean) =>
  placesApiClient.getPlacesSimple(includeDeleted);
export const createPlace = (data: Parameters<PlacesApiClient["createPlace"]>[0]) =>
  placesApiClient.createPlace(data);
export const updatePlace = (
  id: number,
  data: Parameters<PlacesApiClient["updatePlace"]>[1]
) => placesApiClient.updatePlace(id, data);
