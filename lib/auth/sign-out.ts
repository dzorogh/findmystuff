import { createClient } from "@/lib/shared/supabase/client";

export const signOut = async (): Promise<void> => {
  const supabase = createClient();
  await supabase.auth.signOut();
};
