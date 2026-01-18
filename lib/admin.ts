"use client";

import { createClient } from "@/lib/supabase/client";

/**
 * Получает список email администраторов из настроек
 * Используется для проверки прав доступа
 */
export const getAdminEmails = async (): Promise<string[]> => {
  try {
    const supabase = createClient();
    
    // Пытаемся получить новую настройку admin_emails
    const { data: newData, error: newError } = await supabase
      .from("settings")
      .select("value")
      .eq("key", "admin_emails")
      .single();

    if (!newError && newData) {
      try {
        return JSON.parse(newData.value);
      } catch {
        return ["dzorogh@gmail.com"];
      }
    }

    // Если новой настройки нет, проверяем старую admin_email для обратной совместимости
    const { data: oldData, error: oldError } = await supabase
      .from("settings")
      .select("value")
      .eq("key", "admin_email")
      .single();

    if (!oldError && oldData && oldData.value) {
      return [oldData.value];
    }

    // Возвращаем значение по умолчанию при ошибке
    return ["dzorogh@gmail.com"];
  } catch {
    return ["dzorogh@gmail.com"];
  }
};

/**
 * Получает первый email администратора (для обратной совместимости)
 */
export const getAdminEmail = async (): Promise<string> => {
  const emails = await getAdminEmails();
  return emails.length > 0 ? emails[0] : "dzorogh@gmail.com";
};

/**
 * Проверяет, является ли пользователь администратором
 */
export const isAdmin = async (userEmail: string | null | undefined): Promise<boolean> => {
  if (!userEmail) {
    return false;
  }

  const adminEmails = await getAdminEmails();
  return adminEmails.map(e => e.toLowerCase()).includes(userEmail.toLowerCase());
};
