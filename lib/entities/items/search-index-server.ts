import type { SupabaseClient } from "@supabase/supabase-js";
import { fetchWithTimeout } from "@/lib/shared/api/fetch-with-timeout";
import {
  embedItemSearchImage,
  embedItemSearchText,
  isItemMultimodalSearchConfigured,
} from "@/lib/shared/api/item-multimodal-embeddings-server";
import { logError } from "@/lib/shared/logger";

const ITEM_SEARCH_IMAGE_FETCH_TIMEOUT_MS = 30_000;
const DEFAULT_BACKFILL_BATCH_SIZE = 20;

interface SearchIndexItemRow {
  id: number;
  name: string | null;
  photo_url: string | null;
  tenant_id: number;
  item_type_id: number | null;
  entity_types: { name: string | null } | Array<{ name: string | null }> | null;
}

interface ItemSearchDocumentInsert {
  item_id: number;
  tenant_id: number;
  source_type: "text" | "image";
  content: string | null;
  photo_url: string | null;
  embedding_model: string;
  embedding: number[];
}

function normalizeEntityTypeName(
  relation: SearchIndexItemRow["entity_types"]
): string | null {
  if (Array.isArray(relation)) {
    return relation[0]?.name?.trim() || null;
  }
  return relation?.name?.trim() || null;
}

function buildSearchableText(
  itemName: string | null,
  itemTypeName: string | null
): string | null {
  const parts = [itemName?.trim(), itemTypeName?.trim()].filter(
    (value): value is string => Boolean(value)
  );

  if (parts.length === 0) return null;
  return parts.join(", ");
}

async function loadItemSearchRow(
  supabase: SupabaseClient,
  itemId: number,
  tenantId: number
): Promise<SearchIndexItemRow | null> {
  const { data, error } = await supabase
    .from("items")
    .select("id, name, photo_url, tenant_id, item_type_id, entity_types(name)")
    .eq("id", itemId)
    .eq("tenant_id", tenantId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data as SearchIndexItemRow | null) ?? null;
}

async function fetchRemoteImage(
  photoUrl: string
): Promise<{ buffer: Buffer; mimeType: string }> {
  const response = await fetchWithTimeout(
    ITEM_SEARCH_IMAGE_FETCH_TIMEOUT_MS,
    photoUrl
  );

  if (!response.ok) {
    throw new Error(`Не удалось загрузить фото для индексации: ${response.status}`);
  }

  const mimeType = response.headers.get("content-type") || "image/jpeg";
  if (!mimeType.startsWith("image/")) {
    throw new Error("Удалённый файл для индексации не является изображением");
  }

  const arrayBuffer = await response.arrayBuffer();
  return {
    buffer: Buffer.from(arrayBuffer),
    mimeType,
  };
}

async function buildItemSearchDocuments(
  item: SearchIndexItemRow
): Promise<ItemSearchDocumentInsert[]> {
  const itemTypeName = normalizeEntityTypeName(item.entity_types);
  const searchableText = buildSearchableText(item.name, itemTypeName);
  const documents: ItemSearchDocumentInsert[] = [];

  if (searchableText) {
    const textEmbedding = await embedItemSearchText(searchableText);
    documents.push({
      item_id: item.id,
      tenant_id: item.tenant_id,
      source_type: "text",
      content: searchableText,
      photo_url: null,
      embedding_model: textEmbedding.model,
      embedding: textEmbedding.embedding,
    });
  }

  if (item.photo_url) {
    try {
      const { buffer, mimeType } = await fetchRemoteImage(item.photo_url);
      const imageEmbedding = await embedItemSearchImage(buffer, mimeType, "document");
      documents.push({
        item_id: item.id,
        tenant_id: item.tenant_id,
        source_type: "image",
        content: null,
        photo_url: item.photo_url,
        embedding_model: imageEmbedding.model,
        embedding: imageEmbedding.embedding,
      });
    } catch (error) {
      logError(
        `Не удалось построить image embedding для item #${item.id}:`,
        error
      );
    }
  }

  return documents;
}

async function replaceItemSearchDocuments(
  supabase: SupabaseClient,
  itemId: number,
  tenantId: number,
  documents: ItemSearchDocumentInsert[]
): Promise<void> {
  const { error: deleteError } = await supabase
    .from("item_search_documents")
    .delete()
    .eq("item_id", itemId)
    .eq("tenant_id", tenantId);

  if (deleteError) {
    throw new Error(deleteError.message);
  }

  if (documents.length === 0) return;

  const { error: insertError } = await supabase
    .from("item_search_documents")
    .insert(documents);

  if (insertError) {
    throw new Error(insertError.message);
  }
}

export async function syncItemSearchDocumentsByItemId(
  supabase: SupabaseClient,
  itemId: number,
  tenantId: number
): Promise<void> {
  if (!isItemMultimodalSearchConfigured()) return;

  const item = await loadItemSearchRow(supabase, itemId, tenantId);
  if (!item) return;

  const documents = await buildItemSearchDocuments(item);
  await replaceItemSearchDocuments(supabase, itemId, tenantId, documents);
}

export async function syncItemSearchDocumentsForEntityType(
  supabase: SupabaseClient,
  tenantId: number,
  itemTypeId: number
): Promise<number> {
  if (!isItemMultimodalSearchConfigured()) return 0;

  const { data, error } = await supabase
    .from("items")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("item_type_id", itemTypeId);

  if (error) {
    throw new Error(error.message);
  }

  const items = Array.isArray(data) ? data : [];
  for (const item of items) {
    await syncItemSearchDocumentsByItemId(supabase, item.id, tenantId);
  }

  return items.length;
}

export async function backfillItemSearchDocuments(
  supabase: SupabaseClient,
  tenantId: number,
  options?: {
    afterId?: number;
    limit?: number;
  }
): Promise<{ processed: number; nextAfterId: number | null }> {
  if (!isItemMultimodalSearchConfigured()) {
    throw new Error("Мультимодальный поиск не настроен: отсутствует OPENAI_API_KEY");
  }

  const afterId = options?.afterId ?? 0;
  const limit = options?.limit ?? DEFAULT_BACKFILL_BATCH_SIZE;

  const { data, error } = await supabase
    .from("items")
    .select("id")
    .eq("tenant_id", tenantId)
    .gt("id", afterId)
    .order("id", { ascending: true })
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  const items = Array.isArray(data) ? data : [];
  for (const item of items) {
    await syncItemSearchDocumentsByItemId(supabase, item.id, tenantId);
  }

  return {
    processed: items.length,
    nextAfterId: items.length > 0 ? items[items.length - 1]!.id : null,
  };
}
