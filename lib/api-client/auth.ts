/**
 * API методы для работы с аутентификацией
 */

import { ApiClientBase } from "./base";
import type { User } from "@supabase/supabase-js";

export class AuthApi extends ApiClientBase {
  async getCurrentUser() {
    return this.request<{ user: User | null }>("/auth/user");
  }
}
