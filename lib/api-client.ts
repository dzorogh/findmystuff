/**
 * Общий API клиент для работы с бэкендом
 */

import type {
  Item,
  Place,
  Container,
  Room,
  Transition,
  EntityType,
  User,
  SearchResult,
  CreateItemResponse,
  CreatePlaceResponse,
  CreateContainerResponse,
  CreateRoomResponse,
  CreateTransitionResponse,
  CreateEntityTypeResponse,
  UpdateEntityTypeResponse,
} from "@/types/entity";

const API_BASE_URL = "/api";

interface ApiResponse<T> {
  data?: T;
  error?: string;
  totalCount?: number;
}

class ApiClient {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  // Items
  async getItems(params?: {
    query?: string;
    showDeleted?: boolean;
    page?: number;
    limit?: number;
    locationType?: string | null;
    roomId?: number | null;
    hasPhoto?: boolean | null;
  }) {
    const searchParams = new URLSearchParams();
    if (params?.query) searchParams.set("query", params.query);
    if (params?.showDeleted) searchParams.set("showDeleted", "true");
    if (params?.page) searchParams.set("page", params.page.toString());
    if (params?.limit) searchParams.set("limit", params.limit.toString());
    if (params?.locationType) searchParams.set("locationType", params.locationType);
    if (params?.roomId) searchParams.set("roomId", params.roomId.toString());
    if (params?.hasPhoto !== undefined && params.hasPhoto !== null) {
      searchParams.set("hasPhoto", params.hasPhoto ? "true" : "false");
    }

    const queryString = searchParams.toString();
    return this.request<{ data: Item[]; totalCount: number }>(
      `/items${queryString ? `?${queryString}` : ""}`
    );
  }

  async getItem(id: number) {
    return this.request<{ item: Item; transitions: Transition[] }>(`/items/${id}`);
  }

  // Places
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

  // Containers
  async getContainers(params?: { query?: string; showDeleted?: boolean }) {
    const searchParams = new URLSearchParams();
    if (params?.query) searchParams.set("query", params.query);
    if (params?.showDeleted) searchParams.set("showDeleted", "true");

    const queryString = searchParams.toString();
    return this.request<{ data: Container[] }>(
      `/containers${queryString ? `?${queryString}` : ""}`
    );
  }

  async getContainer(id: number) {
    return this.request<{
      container: Container;
      transitions: Transition[];
      items: Item[];
    }>(`/containers/${id}`);
  }

  // Rooms
  async getRooms(params?: { query?: string; showDeleted?: boolean }) {
    const searchParams = new URLSearchParams();
    if (params?.query) searchParams.set("query", params.query);
    if (params?.showDeleted) searchParams.set("showDeleted", "true");

    const queryString = searchParams.toString();
    return this.request<{ data: Room[] }>(
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

  // Search
  async search(query: string) {
    return this.request<{ data: SearchResult[] }>(`/search?q=${encodeURIComponent(query)}`);
  }

  // Simple lists (for hooks)
  async getPlacesSimple(includeDeleted = false) {
    return this.request<{ data: Place[] }>(`/places?showDeleted=${includeDeleted}`);
  }

  async getContainersSimple(includeDeleted = false) {
    return this.request<{ data: Container[] }>(`/containers?showDeleted=${includeDeleted}`);
  }

  async getRoomsSimple(includeDeleted = false) {
    return this.request<{ data: Room[] }>(`/rooms?showDeleted=${includeDeleted}`);
  }

  // Create operations
  async createItem(data: {
    name?: string;
    photo_url?: string;
    destination_type?: string;
    destination_id?: number;
  }) {
    return this.request<CreateItemResponse>("/items", {
      method: "POST",
      body: JSON.stringify(data),
    });
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

  async createContainer(data: {
    name?: string;
    entity_type_id?: number;
    marking_number?: string;
    photo_url?: string;
    destination_type?: string;
    destination_id?: number;
  }) {
    return this.request<CreateContainerResponse>("/containers", {
      method: "POST",
      body: JSON.stringify(data),
    });
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

  // Update operations
  async updateItem(id: number, data: { name?: string; photo_url?: string }) {
    return this.request<Item>(`/items/${id}`, {
      method: "PUT",
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

  async updateContainer(
    id: number,
    data: {
      name?: string;
      entity_type_id?: number;
      marking_number?: string;
      photo_url?: string;
    }
  ) {
    return this.request<Container>(`/containers/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async updateRoom(id: number, data: { name?: string; photo_url?: string }) {
    return this.request<Room>(`/rooms/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  // Transitions
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

  // Users
  async getUsers() {
    return this.request<{ users: User[] }>("/users");
  }

  async createUser(data: { email: string; email_confirm?: boolean }) {
    return this.request<{ user: User; password: string }>("/users", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateUser(data: { id: string; email: string }) {
    return this.request<{ user: User; password: string }>("/users", {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async deleteUser(userId: string) {
    return this.request<{ success: boolean }>(`/users?id=${userId}`, {
      method: "DELETE",
    });
  }

  // Entity Types
  async getEntityTypes(category?: string) {
    const url = category ? `/entity-types?category=${category}` : "/entity-types";
    return this.request<{ data: EntityType[] }>(url);
  }

  async createEntityType(data: {
    entity_category: "place" | "container";
    code: string;
    name: string;
  }) {
    return this.request<CreateEntityTypeResponse>("/entity-types", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateEntityType(data: {
    id: number;
    code?: string;
    name?: string;
  }) {
    return this.request<UpdateEntityTypeResponse>("/entity-types", {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async deleteEntityType(id: number) {
    return this.request<{ success: boolean }>(`/entity-types?id=${id}`, {
      method: "DELETE",
    });
  }

  // Soft Delete / Restore
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

  // Photo Upload
  async uploadPhoto(file: File) {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${API_BASE_URL}/upload-photo`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      let errorMessage = "Ошибка загрузки фото";
      try {
        const error = await response.json();
        errorMessage = error.error || errorMessage;
      } catch {
        errorMessage = `Ошибка сервера: ${response.status} ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    if (!data.url) {
      throw new Error("Сервер не вернул URL загруженного файла");
    }

    return { data: { url: data.url } };
  }
}

export const apiClient = new ApiClient();
