"use client";

import { usePathname } from "next/navigation";
import { useUser } from "@/hooks/use-user";
import Sidebar from "@/components/navigation/sidebar";
import TopBar from "@/components/navigation/top-bar";

interface AuthLayoutProps {
  children: React.ReactNode;
}

export const AuthLayout = ({ children }: AuthLayoutProps) => {
  const pathname = usePathname();
  const { user, isLoading } = useUser();
  const isAuthenticated = Boolean(user);
  const isHomePage = pathname === "/";
  const isSettingsPage = pathname === "/settings";
  const baseMainClasses =
    "h-[100svh] h-[100dvh] bg-background overflow-y-auto overscroll-y-auto [-webkit-overflow-scrolling:touch]";
  const mobileTopPadding = isAuthenticated && !isHomePage && !isSettingsPage
    ? "pt-[calc(var(--app-safe-top)+var(--app-header-height))]"
    : "pt-[var(--app-safe-top)]";
  const mobileBottomPadding = isAuthenticated
    ? "pb-[calc(var(--app-safe-bottom)+var(--app-bottom-nav-height))] md:pb-[var(--app-safe-bottom)]"
    : "pb-[var(--app-safe-bottom)]";
  const mainClassName = `${baseMainClasses} ${mobileTopPadding} ${mobileBottomPadding}`;

  // Для неавторизованных пользователей - layout без sidebar и отступов
  if (!isLoading && !user) {
    return (
      <main className={mainClassName}>
        {children}
      </main>
    );
  }

  // Во время загрузки и для авторизованных - layout с отступом
  // Во время загрузки sidebar не рендерится, но отступ применяется для предотвращения скачка
  return (
    <>
      {!isLoading && user && !isHomePage && <TopBar />}
      {!isLoading && user && <Sidebar />}
      <main className={`${mainClassName} md:ml-64`}>
        {children}
      </main>
    </>
  );
};
