/**
 * API методы для работы с аутентификацией
 */

import { HttpClient } from "@/lib/shared/api/http-client";
import type { User } from "@supabase/supabase-js";

export const getCurrentUser = async () => {
  const client = new (class AuthApi extends HttpClient {
    async getCurrentUser() {
      return this.request<{ user: User | null }>("/auth/user");
    }
  })();
  return client.getCurrentUser();
};
