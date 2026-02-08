import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/shared/supabase/server";
import { getAuthUser } from "@/lib/users/api";

export async function getServerUser(): Promise<User | null> {
  const supabase = await createClient();
  return getAuthUser(supabase);
}
