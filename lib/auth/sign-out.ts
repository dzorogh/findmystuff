import { createClient } from "@/lib/shared/supabase/client";

export const signOut = async (): Promise<void> => {
  try {
    const supabase = createClient();
    await supabase.auth.signOut();
  } finally {
    if (typeof window !== "undefined") {
      window.location.replace("/auth/login");
    }
  }
};
