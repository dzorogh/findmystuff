/**
 * API методы для работы с настройками (settings)
 */

import { ApiClientBase } from "./base";

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

// Глобальный кэш для предотвращения дублирования запросов на уровне API клиента
const loadingSettingsRequest = new Map<string, Promise<{ data: Setting[]; error: string | null }>>();
const settingsRequestResult = new Map<string, { data: Setting[]; error: string | null }>();

export class SettingsApi extends ApiClientBase {
  async getSettings() {
    // Используем статический ключ, так как настройки загружаются одинаково для всех пользователей
    // (настройки включают и глобальные, и пользовательские)
    const requestKey = "settings";

    // Проверяем кэш
    if (settingsRequestResult.has(requestKey)) {
      const cached = settingsRequestResult.get(requestKey)!;
      return {
        data: cached.data,
        error: cached.error,
      };
    }

    // Проверяем активный запрос
    if (loadingSettingsRequest.has(requestKey)) {
      const result = await loadingSettingsRequest.get(requestKey)!;
      return {
        data: result.data,
        error: result.error,
      };
    }

    // Создаем новый запрос
    const requestPromise = (async () => {
      try {
        // API возвращает { data: Setting[] }
        // request возвращает это напрямую, поэтому response будет { data: Setting[] }
        // И response.data будет { data: Setting[] }
        const response = await this.request<{ data: Setting[] }>("/settings");

        if (response.error) {
          const result = { data: [], error: response.error };
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
          data: [],
          error: err instanceof Error ? err.message : "Ошибка загрузки настроек",
        };
        settingsRequestResult.set(requestKey, result);
        return result;
      } finally {
        loadingSettingsRequest.delete(requestKey);
      }
    })();

    // КРИТИЧНО: Добавляем промис в Map ДО того, как он начнет выполняться
    loadingSettingsRequest.set(requestKey, requestPromise);

    const result = await requestPromise;
    return {
      data: result.data,
      error: result.error,
    };
  }

  async updateSetting(key: string, value: string, isUserSetting = false) {
    // Очищаем кэш при обновлении
    const requestKey = "settings";
    settingsRequestResult.delete(requestKey);
    loadingSettingsRequest.delete(requestKey);

    return this.request<{ success: boolean }>("/settings", {
      method: "PUT",
      body: JSON.stringify({ key, value, isUserSetting }),
    });
  }
}
