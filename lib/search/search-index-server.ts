import type { SupabaseClient } from "@supabase/supabase-js";
import { fetchWithTimeout } from "@/lib/shared/api/fetch-with-timeout";
import {
  embedSearchImage,
  embedSearchText,
  isSearchMultimodalConfigured,
} from "@/lib/shared/api/item-multimodal-embeddings-server";
import { logError } from "@/lib/shared/logger";

const SEARCH_IMAGE_FETCH_TIMEOUT_MS = 30_000;
const DEFAULT_BACKFILL_BATCH_SIZE = 20;

export type SearchIndexEntityType = "item" | "container";

export interface SearchIndexBackfillCursor {
  entityType: SearchIndexEntityType;
  afterId: number;
}

type SearchIndexEntityRow = {
  id: number;
  name: string | null;
  photo_url: string | null;
  tenant_id: number;
  deleted_at: string | null;
  type_name: string | null;
};

interface SearchDocumentInsert {
  entity_type: SearchIndexEntityType;
  entity_id: number;
  tenant_id: number;
  source_type: "text" | "image";
  name: string | null;
  entity_type_name: string | null;
  content: string | null;
  photo_url: string | null;
  embedding_model: string;
  embedding: number[];
}

function buildSearchableText(
  entityName: string | null,
  entityTypeName: string | null
): string | null {
  const parts = [entityName?.trim(), entityTypeName?.trim()].filter(
    (value): value is string => Boolean(value)
  );

  if (parts.length === 0) {
    return null;
  }

  return parts.join(", ");
}

async function fetchRemoteImage(
  photoUrl: string
): Promise<{ buffer: Buffer; mimeType: string }> {
  const response = await fetchWithTimeout(SEARCH_IMAGE_FETCH_TIMEOUT_MS, photoUrl);

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

async function loadSearchIndexEntityRow(
  supabase: SupabaseClient,
  entityType: SearchIndexEntityType,
  entityId: number,
  tenantId: number
): Promise<SearchIndexEntityRow | null> {
  const table = entityType === "item" ? "items" : "containers";
  
  const { data, error } = await supabase
    .from(table)
    .select("id, name, photo_url, tenant_id, deleted_at, entity_types(name)")
    .eq("id", entityId)
    .eq("tenant_id", tenantId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  const entityTypeRelation =
    Array.isArray(data.entity_types) ? data.entity_types[0] : data.entity_types;

  return {
    id: data.id,
    name: data.name,
    photo_url: data.photo_url,
    tenant_id: data.tenant_id,
    deleted_at: data.deleted_at,
    type_name: entityTypeRelation?.name?.trim() || null,
  };
}

async function buildSearchDocuments(
  entityType: SearchIndexEntityType,
  entity: SearchIndexEntityRow
): Promise<SearchDocumentInsert[]> {
  const searchableText = buildSearchableText(entity.name, entity.type_name);
  const documents: SearchDocumentInsert[] = [];

  if (searchableText) {
    const textEmbedding = await embedSearchText(searchableText);
    documents.push({
      entity_type: entityType,
      entity_id: entity.id,
      tenant_id: entity.tenant_id,
      source_type: "text",
      name: entity.name,
      entity_type_name: entity.type_name,
      content: searchableText,
      photo_url: null,
      embedding_model: textEmbedding.model,
      embedding: textEmbedding.embedding,
    });
  }

  if (entity.photo_url) {
    try {
      const { buffer, mimeType } = await fetchRemoteImage(entity.photo_url);
      const imageEmbedding = await embedSearchImage(buffer, mimeType, "document");
      documents.push({
        entity_type: entityType,
        entity_id: entity.id,
        tenant_id: entity.tenant_id,
        source_type: "image",
        name: entity.name,
        entity_type_name: entity.type_name,
        content: null,
        photo_url: entity.photo_url,
        embedding_model: imageEmbedding.model,
        embedding: imageEmbedding.embedding,
      });
    } catch (error) {
      logError(
        `Не удалось построить image embedding для ${entityType} #${entity.id}:`,
        error
      );
    }
  }

  return documents;
}

async function deleteSearchDocuments(
  supabase: SupabaseClient,
  entityType: SearchIndexEntityType,
  entityId: number,
  tenantId: number
): Promise<void> {
  const { error } = await supabase
    .from("entity_search_documents")
    .delete()
    .eq("entity_type", entityType)
    .eq("entity_id", entityId)
    .eq("tenant_id", tenantId);

  if (error) {
    throw new Error(error.message);
  }
}

async function replaceSearchDocuments(
  supabase: SupabaseClient,
  entityType: SearchIndexEntityType,
  entityId: number,
  tenantId: number,
  documents: SearchDocumentInsert[]
): Promise<void> {
  await deleteSearchDocuments(supabase, entityType, entityId, tenantId);

  if (documents.length === 0) {
    return;
  }

  const { error } = await supabase.from("entity_search_documents").insert(documents);

  if (error) {
    throw new Error(error.message);
  }
}

export async function syncSearchDocumentsByEntityId(
  supabase: SupabaseClient,
  entityType: SearchIndexEntityType,
  entityId: number,
  tenantId: number
): Promise<void> {
  if (!isSearchMultimodalConfigured()) {
    return;
  }

  const entity = await loadSearchIndexEntityRow(supabase, entityType, entityId, tenantId);

  if (!entity || entity.deleted_at) {
    await deleteSearchDocuments(supabase, entityType, entityId, tenantId);
    return;
  }

  const documents = await buildSearchDocuments(entityType, entity);
  await replaceSearchDocuments(supabase, entityType, entityId, tenantId, documents);
}



async function loadBackfillBatchIds(
  supabase: SupabaseClient,
  entityType: SearchIndexEntityType,
  tenantId: number,
  afterId: number,
  limit: number
): Promise<number[]> {
  const query =
    entityType === "item"
      ? supabase
          .from("items")
          .select("id")
          .eq("tenant_id", tenantId)
          .gt("id", afterId)
          .order("id", { ascending: true })
          .limit(limit)
      : supabase
          .from("containers")
          .select("id")
          .eq("tenant_id", tenantId)
          .gt("id", afterId)
          .order("id", { ascending: true })
          .limit(limit);

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return ((data as Array<{ id: number }> | null) ?? []).map((row) => row.id);
}

export async function backfillEntitySearchDocuments(
  supabase: SupabaseClient,
  tenantId: number,
  options?: {
    cursor?: SearchIndexBackfillCursor | null;
    limit?: number;
  }
): Promise<{ processed: number; nextCursor: SearchIndexBackfillCursor | null }> {
  if (!isSearchMultimodalConfigured()) {
    throw new Error("Мультимодальный поиск не настроен: отсутствует OPENAI_API_KEY");
  }

  const limit = options?.limit ?? DEFAULT_BACKFILL_BATCH_SIZE;
  let cursor = options?.cursor ?? { entityType: "item" as const, afterId: 0 };

  while (true) {
    const ids = await loadBackfillBatchIds(
      supabase,
      cursor.entityType,
      tenantId,
      cursor.afterId,
      limit
    );

    if (ids.length === 0) {
      if (cursor.entityType === "item") {
        cursor = { entityType: "container", afterId: 0 };
        continue;
      }

      return {
        processed: 0,
        nextCursor: null,
      };
    }

    for (const entityId of ids) {
      await syncSearchDocumentsByEntityId(
        supabase,
        cursor.entityType,
        entityId,
        tenantId
      );
    }

    return {
      processed: ids.length,
      nextCursor: {
        entityType: cursor.entityType,
        afterId: ids[ids.length - 1] ?? cursor.afterId,
      },
    };
  }
}
