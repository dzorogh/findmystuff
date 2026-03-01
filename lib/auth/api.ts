/**
 * API методы для работы с аутентификацией
 */

import { HttpClient } from "@/lib/shared/api/http-client";
import type { User } from "@supabase/supabase-js";
import type { UpdatePasswordResult } from "@/types/api";

export type { UpdatePasswordResult };

export const getCurrentUser = async () => {
  const client = new (class AuthApi extends HttpClient {
    async getCurrentUser() {
      return this.request<{ user: User | null }>("/auth/user");
    }
  })();
  return client.getCurrentUser();
};

export const updatePassword = async (password: string): Promise<UpdatePasswordResult> => {
  const client = new (class AuthApi extends HttpClient {
    async updatePassword(password: string) {
      return this.request<{ success?: boolean }>("/auth/update-password", {
        method: "POST",
        body: JSON.stringify({ password }),
      });
    }
  })();
  return client.updatePassword(password);
};
