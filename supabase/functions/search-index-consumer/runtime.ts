import OpenAI from "npm:openai@6.21.0";
import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2";
import type {
  SearchIndexEntityType,
  SearchIndexJobPayload,
} from "../../../lib/search/search-index-queue.ts";
import { runSearchIndexJob } from "../../../lib/search/search-index-job-runner.ts";
import { normalizeSearchIndexQueueMessages } from "../../../lib/search/search-index-queue-server.ts";
import {
  deleteSearchIndexQueueMessages,
  type SearchIndexQueueRpcClient,
} from "../../../lib/shared/api/search-index-queue.ts";

const OPENAI_EMBEDDING_MODEL =
  getEnv("OPENAI_EMBEDDING_MODEL") || "text-embedding-3-large";
const OPENAI_VISION_MODEL = getEnv("OPENAI_VISION_MODEL") || "gpt-5-mini";
const OPENAI_EMBEDDING_DIMENSION = 1024;
const SEARCH_IMAGE_FETCH_TIMEOUT_MS = 30_000;

type SearchIndexEntityRow = {
  id: number;
  name: string | null;
  photo_url: string | null;
  tenant_id: number;
  deleted_at: string | null;
  type_name: string | null;
};

type SearchDocumentInsert = {
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
};

type ItemSearchDocumentInsert = {
  item_id: number;
  tenant_id: number;
  source_type: "text" | "image";
  content: string | null;
  photo_url: string | null;
  embedding_model: string;
  embedding: number[];
};

let supabaseAdmin: SupabaseClient | null = null;
let openAiClient: OpenAI | null = null;

function getEnv(name: string): string | null {
  if (typeof Deno !== "undefined") {
    return Deno.env.get(name) ?? null;
  }

  return process.env[name] ?? null;
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

function getSupabaseAdmin(): SupabaseClient {
  if (supabaseAdmin) {
    return supabaseAdmin;
  }

  const supabaseUrl = getEnv("SUPABASE_URL");
  const serviceRoleKey = getEnv("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Отсутствуют SUPABASE_URL или SUPABASE_SERVICE_ROLE_KEY");
  }

  supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return supabaseAdmin;
}

function getOpenAiClient(): OpenAI {
  if (openAiClient) {
    return openAiClient;
  }

  const apiKey = getEnv("OPENAI_API_KEY");
  if (!apiKey) {
    throw new Error("Мультимодальный поиск не настроен: отсутствует OPENAI_API_KEY");
  }

  openAiClient = new OpenAI({ apiKey });
  return openAiClient;
}

function assertEmbedding(embedding: number[] | undefined): number[] {
  if (!Array.isArray(embedding) || embedding.length !== OPENAI_EMBEDDING_DIMENSION) {
    throw new Error("Провайдер embeddings вернул вектор неверной размерности");
  }

  return embedding;
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary);
}

async function embedSearchText(text: string): Promise<{ model: string; embedding: number[] }> {
  const normalizedText = text.trim();
  if (!normalizedText) {
    throw new Error("Нельзя построить embedding для пустого текста");
  }

  const response = await getOpenAiClient().embeddings.create({
    model: OPENAI_EMBEDDING_MODEL,
    input: normalizedText,
    dimensions: OPENAI_EMBEDDING_DIMENSION,
  });

  return {
    model: OPENAI_EMBEDDING_MODEL,
    embedding: assertEmbedding(response.data?.[0]?.embedding),
  };
}

async function describeImageForSearch(
  imageBytes: Uint8Array,
  mimeType: string
): Promise<string> {
  const imageDataUrl = `data:${mimeType};base64,${bytesToBase64(imageBytes)}`;
  const response = await getOpenAiClient().responses.create({
    model: OPENAI_VISION_MODEL,
    input: [
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: [
              "Определи, какой предмет показан на фотографии вещи или контейнера из домашнего инвентаря.",
              "Верни краткое описание для поиска на русском языке: тип предмета, материал, цвет, бренд, модель и назначение, если это можно понять.",
              "Без лишних пояснений, только итоговый текст описания."
            ].join(" "),
          },
          {
            type: "input_image",
            image_url: imageDataUrl,
            detail: "high",
          },
        ],
      },
    ],
  });

  const description = response.output_text?.trim();
  if (!description) {
    throw new Error("OpenAI не вернул описание изображения для поиска");
  }

  return description;
}

async function embedSearchImage(
  imageBytes: Uint8Array,
  mimeType: string
): Promise<{ model: string; embedding: number[] }> {
  const description = await describeImageForSearch(imageBytes, mimeType);
  const embedding = await embedSearchText(description);

  return {
    ...embedding,
    model: `${OPENAI_VISION_MODEL}+${OPENAI_EMBEDDING_MODEL}`,
  };
}

async function fetchRemoteImage(
  photoUrl: string
): Promise<{ bytes: Uint8Array; mimeType: string }> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), SEARCH_IMAGE_FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(photoUrl, { signal: controller.signal });
    if (!response.ok) {
      throw new Error(`Не удалось загрузить фото для индексации: ${response.status}`);
    }

    const mimeType = response.headers.get("content-type") || "image/jpeg";
    if (!mimeType.startsWith("image/")) {
      throw new Error("Удалённый файл для индексации не является изображением");
    }

    return {
      bytes: new Uint8Array(await response.arrayBuffer()),
      mimeType,
    };
  } finally {
    clearTimeout(timeoutId);
  }
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

async function loadSearchIndexEntityRow(
  supabase: SupabaseClient,
  entityType: SearchIndexEntityType,
  entityId: number,
  tenantId: number
): Promise<SearchIndexEntityRow | null> {
  const tableName = entityType === "item" ? "items" : "containers";
  const typeColumn = entityType === "item" ? "item_type_id" : "entity_type_id";

  const { data, error } = await supabase
    .from(tableName)
    .select(`id, name, photo_url, tenant_id, deleted_at, ${typeColumn}, entity_types(name)`)
    .eq("id", entityId)
    .eq("tenant_id", tenantId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  const relation = Array.isArray(data.entity_types) ? data.entity_types[0] : data.entity_types;

  return {
    id: Number(data.id),
    name: data.name ?? null,
    photo_url: data.photo_url ?? null,
    tenant_id: Number(data.tenant_id),
    deleted_at: data.deleted_at ?? null,
    type_name: relation?.name?.trim() || null,
  };
}

async function loadItemSearchRow(
  supabase: SupabaseClient,
  itemId: number,
  tenantId: number
): Promise<SearchIndexEntityRow | null> {
  const { data, error } = await supabase
    .from("items")
    .select("id, name, photo_url, tenant_id, deleted_at, entity_types(name)")
    .eq("id", itemId)
    .eq("tenant_id", tenantId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  const relation = Array.isArray(data.entity_types)
    ? data.entity_types[0]
    : data.entity_types;

  return {
    id: Number(data.id),
    name: data.name ?? null,
    photo_url: data.photo_url ?? null,
    tenant_id: Number(data.tenant_id),
    deleted_at: data.deleted_at ?? null,
    type_name: relation?.name?.trim() || null,
  };
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

  if (documents.length === 0) {
    return;
  }

  const { error: insertError } = await supabase
    .from("item_search_documents")
    .insert(documents);

  if (insertError) {
    throw new Error(insertError.message);
  }
}

async function buildSearchDocuments(
  entityType: SearchIndexEntityType,
  entity: SearchIndexEntityRow
): Promise<SearchDocumentInsert[]> {
  const documents: SearchDocumentInsert[] = [];
  const searchableText = buildSearchableText(entity.name, entity.type_name);

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
      const { bytes, mimeType } = await fetchRemoteImage(entity.photo_url);
      const imageEmbedding = await embedSearchImage(bytes, mimeType);
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
      console.error(
        `Не удалось построить image embedding для ${entityType} #${entity.id}:`,
        error
      );
    }
  }

  return documents;
}

async function buildItemSearchDocuments(
  item: SearchIndexEntityRow
): Promise<ItemSearchDocumentInsert[]> {
  const documents: ItemSearchDocumentInsert[] = [];
  const searchableText = buildSearchableText(item.name, item.type_name);

  if (searchableText) {
    const textEmbedding = await embedSearchText(searchableText);
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
      const { bytes, mimeType } = await fetchRemoteImage(item.photo_url);
      const imageEmbedding = await embedSearchImage(bytes, mimeType);
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
      console.error(
        `Не удалось построить image embedding для item #${item.id}:`,
        error
      );
    }
  }

  return documents;
}

async function syncSearchDocumentsByEntityId(
  supabase: SupabaseClient,
  entityType: SearchIndexEntityType,
  entityId: number,
  tenantId: number
): Promise<void> {
  const entity = await loadSearchIndexEntityRow(supabase, entityType, entityId, tenantId);

  if (!entity || entity.deleted_at) {
    await deleteSearchDocuments(supabase, entityType, entityId, tenantId);
    return;
  }

  const documents = await buildSearchDocuments(entityType, entity);
  await replaceSearchDocuments(supabase, entityType, entityId, tenantId, documents);
}

async function syncItemSearchDocumentsByItemId(
  supabase: SupabaseClient,
  itemId: number,
  tenantId: number
): Promise<void> {
  const item = await loadItemSearchRow(supabase, itemId, tenantId);
  if (!item) {
    return;
  }

  const documents = await buildItemSearchDocuments(item);
  await replaceItemSearchDocuments(supabase, itemId, tenantId, documents);
}

export async function authorizeSearchIndexConsumerRequest(
  request: Request
): Promise<Response | null> {
  const expectedToken = getEnv("SEARCH_INDEX_CONSUMER_BEARER_TOKEN");
  if (!expectedToken) {
    return jsonResponse(
      { error: "Missing SEARCH_INDEX_CONSUMER_BEARER_TOKEN" },
      503
    );
  }

  const authorizationHeader = request.headers.get("authorization") || "";
  if (authorizationHeader !== `Bearer ${expectedToken}`) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }

  return null;
}

export async function readSearchIndexQueueMessages(options: {
  batchSize: number;
  visibilityTimeoutSeconds: number;
}): Promise<ReturnType<typeof normalizeSearchIndexQueueMessages>> {
  const supabase = getSupabaseAdmin() as unknown as SearchIndexQueueRpcClient;
  const { data, error } = await supabase.rpc("read_search_index_jobs", {
    batch_size: options.batchSize,
    visibility_timeout_seconds: options.visibilityTimeoutSeconds,
  });

  if (error) {
    throw new Error(error.message);
  }

  return normalizeSearchIndexQueueMessages(data);
}

export async function deleteSearchIndexQueueMessageBatch(
  messageIds: number[]
): Promise<number> {
  const supabase = getSupabaseAdmin() as unknown as SearchIndexQueueRpcClient;
  return deleteSearchIndexQueueMessages(supabase, messageIds);
}

export async function syncSearchIndexJob(
  payload: SearchIndexJobPayload
): Promise<void> {
  const supabase = getSupabaseAdmin();

  await runSearchIndexJob(payload, {
    syncEntitySearchDocuments: (entityType, entityId, tenantId) =>
      syncSearchDocumentsByEntityId(supabase, entityType, entityId, tenantId),
    syncItemSearchDocuments: (itemId, tenantId) =>
      syncItemSearchDocumentsByItemId(supabase, itemId, tenantId),
  });
}
