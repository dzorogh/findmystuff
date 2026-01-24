"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

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
    const log = (message: string, details?: unknown) => {
      const suffix = details ? ` ${JSON.stringify(details)}` : "";
      console.log(`[auth][user-context] ${message}${suffix}`);
    };

    const getUser = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        log("getSession", session?.user?.id || null);
        if (session?.user) {
          setUser(session.user);
        }

        const {
          data: { user: currentUser },
        } = await supabase.auth.getUser();
        log("getUser", currentUser?.id || null);
        setUser(currentUser ?? session?.user ?? null);
      } catch (error) {
        console.error("Ошибка получения пользователя:", error);
        log("getUser error", error);
      } finally {
        setIsLoading(false);
      }
    };

    getUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      log("onAuthStateChange", { event: _event, userId: session?.user?.id || null });
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
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
