/**
 * API методы для работы с пользователями (users)
 */
import type { User, SupabaseClient } from "@supabase/supabase-js";
import { HttpClient } from "@/lib/shared/api/http-client";

/** Получить текущего пользователя из Supabase (для server-side). Вызывать только из lib. */
export async function getAuthUser(supabase: SupabaseClient): Promise<User | null> {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

class UsersApiClient extends HttpClient {
  async getUsers() {
    const raw = await this.request<{ users: User[] }>("/users");
    if (raw.error) return { error: raw.error };
    const users =
      (raw as { users?: User[] }).users ??
      (raw as { data?: { users?: User[] } }).data?.users ??
      [];
    return { data: { users } };
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

  /** Текущий пользователь через GET /api/auth/user (для контекста на клиенте). */
  async getCurrentUser(): Promise<User | null> {
    const res = await this.request<{ user: User | null }>("/auth/user");
    if (res.error) return null;
    return res.data?.user ?? null;
  }
}

const usersApiClient = new UsersApiClient();

export const getUsers = () => usersApiClient.getUsers();
/** Получить текущего пользователя на клиенте через API (для контекста). */
export const getClientUser = () => usersApiClient.getCurrentUser();
export const createUser = (data: { email: string; email_confirm?: boolean }) =>
  usersApiClient.createUser(data);
export const updateUser = (data: { id: string; email: string }) =>
  usersApiClient.updateUser(data);
export const deleteUser = (userId: string) => usersApiClient.deleteUser(userId);
