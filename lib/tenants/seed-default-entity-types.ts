/**
 * Создаёт дефолтные entity_types для нового тенанта из config/default-entity-types.json
 */

import { readFile } from "fs/promises";
import { join } from "path";
import type { SupabaseClient } from "@supabase/supabase-js";

const ENTITY_CATEGORIES = [
  "building",
  "container",
  "room",
  "place",
  "furniture",
  "item",
] as const;

export type DefaultEntityTypesConfig = Partial<
  Record<(typeof ENTITY_CATEGORIES)[number], string[]>
>;

async function loadDefaultEntityTypes(): Promise<DefaultEntityTypesConfig> {
  const configPath = join(process.cwd(), "config/default-entity-types.json");
  const content = await readFile(configPath, "utf-8");
  return JSON.parse(content) as DefaultEntityTypesConfig;
}

export async function seedDefaultEntityTypesForTenant(
  supabase: SupabaseClient,
  tenantId: number
): Promise<void> {
  const config = await loadDefaultEntityTypes();

  const rows: { tenant_id: number; entity_category: string; name: string }[] = [];

  for (const category of ENTITY_CATEGORIES) {
    const names = config[category];
    if (!Array.isArray(names)) continue;
    for (const name of names) {
      if (typeof name === "string" && name.trim()) {
        rows.push({
          tenant_id: tenantId,
          entity_category: category,
          name: name.trim(),
        });
      }
    }
  }

  if (rows.length === 0) return;

  const { error } = await supabase.from("entity_types").insert(rows);

  if (error) {
    throw new Error(`Ошибка создания дефолтных типов: ${error.message}`);
  }
}
