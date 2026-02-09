"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/shared/supabase/client";
import { getClientUser } from "@/lib/users/api";
import { toast } from "sonner";

interface UserContextType {
  user: User | null;
  isLoading: boolean;
}

const UserContext = createContext<UserContextType>({
  user: null,
  isLoading: true,
});

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    let isActive = true;

    const refreshUser = async () => {
      try {
        const currentUser = await getClientUser();
        if (!isActive) return;
        setUser(currentUser);
      } catch (err) {
        if (!isActive) return;
        console.error("Error getting client user:", err);
        toast.error(err instanceof Error ? err.message : "Не удалось получить пользователя");
        setUser(null);
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    void refreshUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      setIsLoading(true);
      void refreshUser();
    });

    return () => {
      isActive = false;
      subscription?.unsubscribe();
    };
  }, []);

  return (
    <UserContext.Provider value={{ user, isLoading }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};
