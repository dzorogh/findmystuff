/**
 * API методы для работы с пользователями (users) и настройками (settings)
 */

import { HttpClient } from "@/lib/shared/api/http-client";
import type { User } from "@supabase/supabase-js";

export interface Setting {
  id: number;
  key: string;
  value: string;
  description: string | null;
  category: string;
  created_at: string;
  updated_at: string;
  user_id: string | null;
}

// Кэш для settings (как в старом SettingsApi)
const loadingSettingsRequest = new Map<string, Promise<{ data: Setting[]; error: string | null }>>();
const settingsRequestResult = new Map<string, { data: Setting[]; error: string | null }>();

class UsersApiClient extends HttpClient {
  async getUsers() {
    const raw = await this.request<{ users: User[] }>("/users");
    if (raw.error) return { error: raw.error };
    const users =
      (raw as { users?: User[] }).users ??
      (raw as { data?: { users?: User[] } }).data?.users ??
      [];
    return { data: { users } };
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

  async getSettings(): Promise<{ data: Setting[]; error: string | null }> {
    const requestKey = "settings";

    if (settingsRequestResult.has(requestKey)) {
      const cached = settingsRequestResult.get(requestKey)!;
      return { data: cached.data, error: cached.error };
    }

    if (loadingSettingsRequest.has(requestKey)) {
      const result = await loadingSettingsRequest.get(requestKey)!;
      return { data: result.data, error: result.error };
    }

    const requestPromise = (async () => {
      try {
        const response = await this.request<{ data: Setting[] }>("/settings");

        if (response.error) {
          const result = { data: [] as Setting[], error: response.error };
          settingsRequestResult.set(requestKey, result);
          return result;
        }

        const result = {
          data: response.data?.data || [],
          error: null,
        };
        settingsRequestResult.set(requestKey, result);
        return result;
      } catch (err) {
        const result = {
          data: [] as Setting[],
          error: err instanceof Error ? err.message : "Ошибка загрузки настроек",
        };
        settingsRequestResult.set(requestKey, result);
        return result;
      } finally {
        loadingSettingsRequest.delete(requestKey);
      }
    })();

    loadingSettingsRequest.set(requestKey, requestPromise);
    const result = await requestPromise;
    return { data: result.data, error: result.error };
  }

  async updateSetting(key: string, value: string, isUserSetting = false) {
    settingsRequestResult.delete("settings");
    loadingSettingsRequest.delete("settings");

    return this.request<{ success: boolean }>("/settings", {
      method: "PUT",
      body: JSON.stringify({ key, value, isUserSetting }),
    });
  }
}

const usersApiClient = new UsersApiClient();

export const getUsers = () => usersApiClient.getUsers();
export const createUser = (data: { email: string; email_confirm?: boolean }) =>
  usersApiClient.createUser(data);
export const updateUser = (data: { id: string; email: string }) =>
  usersApiClient.updateUser(data);
export const deleteUser = (userId: string) => usersApiClient.deleteUser(userId);
export const getSettings = () => usersApiClient.getSettings();
export const updateSetting = (key: string, value: string, isUserSetting = false) =>
  usersApiClient.updateSetting(key, value, isUserSetting);
