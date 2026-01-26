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

export class SettingsApi extends ApiClientBase {
  async getSettings() {
    return this.request<{ data: Setting[] }>("/settings");
  }

  async updateSetting(key: string, value: string, isUserSetting = false) {
    return this.request<{ success: boolean }>("/settings", {
      method: "PUT",
      body: JSON.stringify({ key, value, isUserSetting }),
    });
  }
}
