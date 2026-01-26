/**
 * Общий API клиент для работы с бэкендом
 * Объединяет все модули API в единый интерфейс
 */

import { ApiClientBase } from "./api-client/base";
import { ItemsApi } from "./api-client/items";
import { PlacesApi } from "./api-client/places";
import { ContainersApi } from "./api-client/containers";
import { RoomsApi } from "./api-client/rooms";
import { TransitionsApi } from "./api-client/transitions";
import { UsersApi } from "./api-client/users";
import { EntityTypesApi } from "./api-client/entity-types";
import { SearchApi } from "./api-client/search";
import { SoftDeleteApi } from "./api-client/soft-delete";
import { PhotoApi } from "./api-client/photo";
import { SettingsApi } from "./api-client/settings";
import { AuthApi } from "./api-client/auth";

/**
 * Главный класс API клиента, объединяющий все модули
 */
class ApiClient extends ApiClientBase {
  private readonly itemsApi = new ItemsApi();
  private readonly placesApi = new PlacesApi();
  private readonly containersApi = new ContainersApi();
  private readonly roomsApi = new RoomsApi();
  private readonly transitionsApi = new TransitionsApi();
  private readonly usersApi = new UsersApi();
  private readonly entityTypesApi = new EntityTypesApi();
  private readonly searchApi = new SearchApi();
  private readonly softDeleteApi = new SoftDeleteApi();
  private readonly photoApi = new PhotoApi();
  private readonly settingsApi = new SettingsApi();
  private readonly authApi = new AuthApi();

  // Items
  async getItems(params?: Parameters<ItemsApi["getItems"]>[0]) {
    return this.itemsApi.getItems(params);
  }

  async getItem(id: number) {
    return this.itemsApi.getItem(id);
  }

  async createItem(data: Parameters<ItemsApi["createItem"]>[0]) {
    return this.itemsApi.createItem(data);
  }

  async updateItem(id: number, data: Parameters<ItemsApi["updateItem"]>[1]) {
    return this.itemsApi.updateItem(id, data);
  }

  // Places
  async getPlaces(params?: Parameters<PlacesApi["getPlaces"]>[0]) {
    return this.placesApi.getPlaces(params);
  }

  async getPlace(id: number) {
    return this.placesApi.getPlace(id);
  }

  async getPlacesSimple(includeDeleted = false) {
    return this.placesApi.getPlacesSimple(includeDeleted);
  }

  async createPlace(data: Parameters<PlacesApi["createPlace"]>[0]) {
    return this.placesApi.createPlace(data);
  }

  async updatePlace(id: number, data: Parameters<PlacesApi["updatePlace"]>[1]) {
    return this.placesApi.updatePlace(id, data);
  }

  // Containers
  async getContainers(params?: Parameters<ContainersApi["getContainers"]>[0]) {
    return this.containersApi.getContainers(params);
  }

  async getContainer(id: number) {
    return this.containersApi.getContainer(id);
  }

  async getContainersSimple(includeDeleted = false) {
    return this.containersApi.getContainersSimple(includeDeleted);
  }

  async createContainer(data: Parameters<ContainersApi["createContainer"]>[0]) {
    return this.containersApi.createContainer(data);
  }

  async updateContainer(id: number, data: Parameters<ContainersApi["updateContainer"]>[1]) {
    return this.containersApi.updateContainer(id, data);
  }

  // Rooms
  async getRooms(params?: Parameters<RoomsApi["getRooms"]>[0]) {
    return this.roomsApi.getRooms(params);
  }

  async getRoom(id: number) {
    return this.roomsApi.getRoom(id);
  }

  async getRoomsSimple(includeDeleted = false) {
    return this.roomsApi.getRoomsSimple(includeDeleted);
  }

  async createRoom(data: Parameters<RoomsApi["createRoom"]>[0]) {
    return this.roomsApi.createRoom(data);
  }

  async updateRoom(id: number, data: Parameters<RoomsApi["updateRoom"]>[1]) {
    return this.roomsApi.updateRoom(id, data);
  }

  // Transitions
  async createTransition(data: Parameters<TransitionsApi["createTransition"]>[0]) {
    return this.transitionsApi.createTransition(data);
  }

  // Users
  async getUsers() {
    return this.usersApi.getUsers();
  }

  async createUser(data: Parameters<UsersApi["createUser"]>[0]) {
    return this.usersApi.createUser(data);
  }

  async updateUser(data: Parameters<UsersApi["updateUser"]>[0]) {
    return this.usersApi.updateUser(data);
  }

  async deleteUser(userId: string) {
    return this.usersApi.deleteUser(userId);
  }

  // Entity Types
  async getEntityTypes(category?: string) {
    return this.entityTypesApi.getEntityTypes(category);
  }

  async createEntityType(data: Parameters<EntityTypesApi["createEntityType"]>[0]) {
    return this.entityTypesApi.createEntityType(data);
  }

  async updateEntityType(data: Parameters<EntityTypesApi["updateEntityType"]>[0]) {
    return this.entityTypesApi.updateEntityType(data);
  }

  async deleteEntityType(id: number) {
    return this.entityTypesApi.deleteEntityType(id);
  }

  // Search
  async search(query: string) {
    return this.searchApi.search(query);
  }

  // Soft Delete / Restore
  async softDelete(table: "items" | "places" | "containers" | "rooms", id: number) {
    return this.softDeleteApi.softDelete(table, id);
  }

  async restoreDeleted(table: "items" | "places" | "containers" | "rooms", id: number) {
    return this.softDeleteApi.restoreDeleted(table, id);
  }

  // Photo Upload
  async uploadPhoto(file: File) {
    return this.photoApi.uploadPhoto(file);
  }

  // Settings
  async getSettings() {
    return this.settingsApi.getSettings();
  }

  async updateSetting(key: string, value: string, isUserSetting = false) {
    return this.settingsApi.updateSetting(key, value, isUserSetting);
  }

  // Auth
  async getCurrentUser() {
    return this.authApi.getCurrentUser();
  }
}

export const apiClient = new ApiClient();
