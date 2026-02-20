/**
 * Server-side tenant queries (for layout, middleware)
 */

import { createClient } from "@/lib/shared/supabase/server";

export async function getServerTenantCount(userId: string): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("tenant_memberships")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  if (error) return 0;
  return count ?? 0;
}
