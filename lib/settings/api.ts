/**
 * API методов для настроек (settings)
 */

import { HttpClient } from "@/lib/shared/api/http-client";

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

const loadingSettingsRequest = new Map<string, Promise<{ data: Setting[]; error: string | null }>>();
const settingsRequestResult = new Map<string, { data: Setting[]; error: string | null }>();

class SettingsApiClient extends HttpClient {
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

const settingsApiClient = new SettingsApiClient();

export const getSettings = () => settingsApiClient.getSettings();
export const updateSetting = (key: string, value: string, isUserSetting = false) =>
  settingsApiClient.updateSetting(key, value, isUserSetting);
