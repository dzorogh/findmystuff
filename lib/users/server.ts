import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/shared/supabase/server";

export const getServerUser = async (): Promise<User | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
};
