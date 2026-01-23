"use client";

import { useUser } from "@/hooks/use-user";
import Sidebar from "@/components/navigation/sidebar";

interface AuthLayoutProps {
  children: React.ReactNode;
}

export const AuthLayout = ({ children }: AuthLayoutProps) => {
  const { user, isLoading } = useUser();

  // Для неавторизованных пользователей - layout без sidebar и отступов
  if (!isLoading && !user) {
    return (
      <main className="h-screen bg-background overflow-y-auto">
        {children}
      </main>
    );
  }

  // Во время загрузки и для авторизованных - layout с отступом
  // Sidebar рендерится всегда, но сам проверяет наличие пользователя
  return (
    <>
      <Sidebar />
      <main className="h-screen bg-background overflow-y-auto md:ml-64">
        {children}
      </main>
    </>
  );
};
