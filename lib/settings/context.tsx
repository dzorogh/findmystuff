"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { getSettings, updateSetting as updateSettingApi, type Setting } from "@/lib/settings/api";
import { useUser } from "@/lib/users/context";
import { ThemeSync } from "@/components/theme/theme-sync";

export type { Setting };

interface SettingsContextType {
  settings: Setting[];
  isLoading: boolean;
  error: string | null;
  loadSettings: () => Promise<void>;
  updateSetting: (key: string, value: string) => Promise<{ success: boolean; error?: string }>;
  updateUserSetting: (key: string, value: string) => Promise<{ success: boolean; error?: string }>;
  getSetting: (key: string) => string | null;
  getUserSetting: (key: string) => string | null;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useUser();

  const loadSettings = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await getSettings();

      if (response.error) {
        throw new Error(response.error);
      }

      setSettings(response.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка загрузки настроек");
      setSettings([]);
    } finally {
      setIsLoading(false);
    }
  };

  const updateSetting = async (key: string, value: string) => {
    try {
      const response = await updateSettingApi(key, value, false);

      if (response.error) {
        throw new Error(response.error);
      }

      await loadSettings();
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Ошибка обновления настройки",
      };
    }
  };

  const updateUserSetting = async (key: string, value: string) => {
    if (!user?.id) {
      return {
        success: false,
        error: "Пользователь не авторизован",
      };
    }

    try {
      const response = await updateSettingApi(key, value, true);

      if (response.error) {
        throw new Error(response.error);
      }

      await loadSettings();
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Ошибка обновления настройки",
      };
    }
  };

  const getSetting = (key: string): string | null => {
    const setting = settings.find((s) => s.key === key && s.user_id === null);
    return setting?.value || null;
  };

  const getUserSetting = (key: string): string | null => {
    if (!user?.id) {
      return null;
    }
    const userSetting = settings.find((s) => s.key === key && s.user_id === user.id);
    if (userSetting) {
      return userSetting.value;
    }
    return getSetting(key);
  };

  useEffect(() => {
    if (user !== undefined) {
      loadSettings();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  return (
    <SettingsContext.Provider
      value={{
        settings,
        isLoading,
        error,
        loadSettings,
        updateSetting,
        updateUserSetting,
        getSetting,
        getUserSetting,
      }}
    >
      <ThemeSync>{children}</ThemeSync>
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
};
