/**
 * API методы для работы с пользователями (users)
 */

import { ApiClientBase } from "./base";
import type { User } from "@/types/entity";

export class UsersApi extends ApiClientBase {
  async getUsers() {
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
