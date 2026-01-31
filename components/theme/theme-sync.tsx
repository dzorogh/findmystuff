"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { useSettings } from "@/lib/settings/context";
import { useUser } from "@/lib/users/context";

export const ThemeSync = ({ children }: { children: React.ReactNode }) => {
  const { theme, setTheme } = useTheme();
  const { getUserSetting, updateUserSetting } = useSettings();
  const { user } = useUser();
  const [isInitialized, setIsInitialized] = React.useState(false);
  const [isLoadingFromSettings, setIsLoadingFromSettings] = React.useState(false);

  // Загружаем сохраненную тему из настроек при инициализации
  React.useEffect(() => {
    if (!user || isInitialized || isLoadingFromSettings) {
      return;
    }

    setIsLoadingFromSettings(true);
    const savedTheme = getUserSetting("theme");
    if (savedTheme && (savedTheme === "light" || savedTheme === "dark" || savedTheme === "system")) {
      setTheme(savedTheme);
    }
    setIsInitialized(true);
    setIsLoadingFromSettings(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Сохраняем тему при изменении (только если не загружаем из настроек)
  React.useEffect(() => {
    if (!user || !isInitialized || isLoadingFromSettings || !theme) {
      return;
    }

    const savedTheme = getUserSetting("theme");
    if (savedTheme !== theme) {
      updateUserSetting("theme", theme);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme]);

  return <>{children}</>;
};
