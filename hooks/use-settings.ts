"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export interface Setting {
  id: number;
  key: string;
  value: string;
  description: string | null;
  category: string;
  created_at: string;
  updated_at: string;
}

export const useSettings = () => {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSettings = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { data, error: fetchError } = await supabase
        .from("settings")
        .select("*")
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
      
      // Проверяем, существует ли настройка
      const { data: existing, error: checkError } = await supabase
        .from("settings")
        .select("id")
        .eq("key", key)
        .maybeSingle();

      if (checkError && checkError.code !== "PGRST116") {
        throw checkError;
      }

      if (existing) {
        // Обновляем существующую настройку
        const { error: updateError } = await supabase
          .from("settings")
          .update({ value, updated_at: new Date().toISOString() })
          .eq("key", key);

        if (updateError) {
          throw updateError;
        }
      } else {
        // Создаем новую настройку
        const { error: insertError } = await supabase
          .from("settings")
          .insert({
            key,
            value,
            category: "marking",
            description: null,
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
    const setting = settings.find((s) => s.key === key);
    return setting?.value || null;
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

  const getAdminEmail = (): string => {
    // Для обратной совместимости, возвращаем первый email из списка
    const emails = getAdminEmails();
    return emails.length > 0 ? emails[0] : "dzorogh@gmail.com";
  };

  const getAdminEmails = (): string[] => {
    const emailsJson = getSetting("admin_emails");
    if (!emailsJson) {
      // Проверяем старую настройку для обратной совместимости
      const oldEmail = getSetting("admin_email");
      if (oldEmail) {
        return [oldEmail];
      }
      return ["dzorogh@gmail.com"];
    }
    try {
      return JSON.parse(emailsJson);
    } catch {
      return ["dzorogh@gmail.com"];
    }
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
    loadSettings();
  }, []);

  return {
    settings,
    isLoading,
    error,
    loadSettings,
    updateSetting,
    getSetting,
    getContainerTypes,
    getDefaultContainerType,
    getAdminEmail,
    getAdminEmails,
    getMarkingTemplate,
    getPlaceTypes,
    getDefaultPlaceType,
    getPlaceMarkingTemplate,
  };
};
