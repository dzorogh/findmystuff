"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/use-user";
import { ThemeSync } from "@/components/theme/theme-sync";

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

interface SettingsContextType {
  settings: Setting[];
  isLoading: boolean;
  error: string | null;
  loadSettings: () => Promise<void>;
  updateSetting: (key: string, value: string) => Promise<{ success: boolean; error?: string }>;
  updateUserSetting: (key: string, value: string) => Promise<{ success: boolean; error?: string }>;
  getSetting: (key: string) => string | null;
  getUserSetting: (key: string) => string | null;
  getContainerTypes: () => string[];
  getDefaultContainerType: () => string;
  getMarkingTemplate: () => string;
  getPlaceTypes: () => string[];
  getDefaultPlaceType: () => string;
  getPlaceMarkingTemplate: () => string;
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
      const supabase = createClient();
      
      // Загружаем персональные настройки пользователя и глобальные (где user_id IS NULL)
      let query = supabase
        .from("settings")
        .select("*");

      if (user?.id) {
        query = query.or(`user_id.eq.${user.id},user_id.is.null`);
      } else {
        query = query.is("user_id", null);
      }

      const { data, error: fetchError } = await query
        .order("category", { ascending: true })
        .order("key", { ascending: true });

      if (fetchError) {
        throw fetchError;
      }

      setSettings(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка загрузки настроек");
      setSettings([]);
    } finally {
      setIsLoading(false);
    }
  };

  const updateSetting = async (key: string, value: string) => {
    try {
      const supabase = createClient();
      
      // Проверяем, существует ли глобальная настройка (user_id IS NULL)
      const { data: existing, error: checkError } = await supabase
        .from("settings")
        .select("id")
        .eq("key", key)
        .is("user_id", null)
        .maybeSingle();

      if (checkError && checkError.code !== "PGRST116") {
        throw checkError;
      }

      if (existing) {
        // Обновляем существующую глобальную настройку
        // updated_at обновляется автоматически через триггер
        const { error: updateError } = await supabase
          .from("settings")
          .update({ value })
          .eq("key", key)
          .is("user_id", null);

        if (updateError) {
          throw updateError;
        }
      } else {
        // Создаем новую глобальную настройку
        const { error: insertError } = await supabase
          .from("settings")
          .insert({
            key,
            value,
            category: "marking",
            description: null,
            user_id: null,
          });

        if (insertError) {
          throw insertError;
        }
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
      const supabase = createClient();
      
      // Проверяем, существует ли персональная настройка пользователя
      const { data: existing, error: checkError } = await supabase
        .from("settings")
        .select("id")
        .eq("key", key)
        .eq("user_id", user.id)
        .maybeSingle();

      if (checkError && checkError.code !== "PGRST116") {
        throw checkError;
      }

      if (existing) {
        // Обновляем существующую персональную настройку
        // updated_at обновляется автоматически через триггер
        const { error: updateError } = await supabase
          .from("settings")
          .update({ value })
          .eq("key", key)
          .eq("user_id", user.id);

        if (updateError) {
          throw updateError;
        }
      } else {
        // Создаем новую персональную настройку
        const { error: insertError } = await supabase
          .from("settings")
          .insert({
            key,
            value,
            category: "account",
            description: null,
            user_id: user.id,
          });

        if (insertError) {
          throw insertError;
        }
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
    // Возвращаем глобальную настройку (user_id IS NULL)
    const setting = settings.find((s) => s.key === key && s.user_id === null);
    return setting?.value || null;
  };

  const getUserSetting = (key: string): string | null => {
    if (!user?.id) {
      return null;
    }
    // Возвращаем персональную настройку пользователя, если есть, иначе глобальную
    const userSetting = settings.find((s) => s.key === key && s.user_id === user.id);
    if (userSetting) {
      return userSetting.value;
    }
    // Если персональной нет, возвращаем глобальную
    return getSetting(key);
  };

  const getContainerTypes = (): string[] => {
    const typesJson = getSetting("container_types");
    if (!typesJson) {
      return ["КОР", "ПЛА", "ЯЩ", "МЕТ", "СУМ", "ПАК", "ДРУ"];
    }
    try {
      return JSON.parse(typesJson);
    } catch {
      return ["КОР", "ПЛА", "ЯЩ", "МЕТ", "СУМ", "ПАК", "ДРУ"];
    }
  };

  const getDefaultContainerType = (): string => {
    return getSetting("container_type_default") || "КОР";
  };

  const getMarkingTemplate = (): string => {
    return getSetting("container_marking_template") || "{TYPE}-{NUMBER}";
  };

  const getPlaceTypes = (): string[] => {
    const typesJson = getSetting("place_types");
    if (!typesJson) {
      return ["Ш", "С", "П", "Я", "К", "ДРУ"];
    }
    try {
      return JSON.parse(typesJson);
    } catch {
      return ["Ш", "С", "П", "Я", "К", "ДРУ"];
    }
  };

  const getDefaultPlaceType = (): string => {
    return getSetting("place_type_default") || "Ш";
  };

  const getPlaceMarkingTemplate = (): string => {
    return getSetting("place_marking_template") || "{TYPE}{NUMBER}";
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
        getContainerTypes,
        getDefaultContainerType,
        getMarkingTemplate,
        getPlaceTypes,
        getDefaultPlaceType,
        getPlaceMarkingTemplate,
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
