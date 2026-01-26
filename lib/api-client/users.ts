/**
 * API методы для работы с пользователями (users)
 */

import { ApiClientBase } from "./base";
import type { User } from "@supabase/supabase-js";

export class UsersApi extends ApiClientBase {
  async getUsers() {
    // API возвращает { users: User[] } где User - это тип из Supabase
    // request возвращает jsonData напрямую, поэтому response будет { users: User[] }
    // Но ApiResponse<T> означает, что response.data будет T
    // Поэтому используем тип User[], чтобы response.data был User[]
    // Но на самом деле API возвращает { users: User[] }, поэтому нужно использовать правильный тип
    return this.request<{ users: User[] }>("/users");
  }

  async createUser(data: { email: string; email_confirm?: boolean }) {
    return this.request<{ user: User; password: string }>("/users", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateUser(data: { id: string; email: string }) {
    return this.request<{ user: User; password: string }>("/users", {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async deleteUser(userId: string) {
    return this.request<{ success: boolean }>(`/users?id=${userId}`, {
      method: "DELETE",
    });
  }
}
