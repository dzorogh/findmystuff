import { createClient } from "@/lib/supabase/client";

export const softDelete = async (table: string, id: number): Promise<void> => {
  const supabase = createClient();
  const { error } = await supabase
    .from(table)
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    throw error;
  }
};

export const restoreDeleted = async (table: string, id: number): Promise<void> => {
  const supabase = createClient();
  const { error } = await supabase
    .from(table)
    .update({ deleted_at: null })
    .eq("id", id);

  if (error) {
    throw error;
  }
};
