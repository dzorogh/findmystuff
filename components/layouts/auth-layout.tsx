"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import Sidebar from "@/components/navigation/sidebar";

interface AuthLayoutProps {
  children: React.ReactNode;
}

export const AuthLayout = ({ children }: AuthLayoutProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    const getUser = async () => {
      try {
        const {
          data: { user: currentUser },
        } = await supabase.auth.getUser();
        setUser(currentUser);
      } catch (error) {
        console.error("Ошибка получения пользователя:", error);
      } finally {
        setIsLoading(false);
      }
    };

    getUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Для неавторизованных пользователей - layout без sidebar и отступов
  if (!isLoading && !user) {
    return (
      <main className="h-screen bg-background overflow-y-auto pt-14 md:pt-0">
        {children}
      </main>
    );
  }

  // Во время загрузки и для авторизованных - layout с отступом
  // Во время загрузки sidebar не рендерится, но отступ применяется для предотвращения скачка
  return (
    <>
      {!isLoading && user && <Sidebar />}
      <main className="h-screen bg-background overflow-y-auto pt-14 md:ml-64 md:pt-0">
        {children}
      </main>
    </>
  );
};
