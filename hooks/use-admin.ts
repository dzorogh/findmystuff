"use client";

import { useUser } from "@/hooks/use-user";
import { useSettings } from "@/hooks/use-settings";

/**
 * Хук для проверки прав администратора
 */
export const useAdmin = () => {
  const { user } = useUser();
  const { getAdminEmails, getAdminEmail } = useSettings();

  const adminEmails = getAdminEmails();
  const isAdmin = user?.email ? adminEmails.includes(user.email.toLowerCase()) : false;

  return {
    isAdmin,
    adminEmails,
    adminEmail: getAdminEmail(), // Для обратной совместимости
  };
};
