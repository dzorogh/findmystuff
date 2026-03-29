import OpenAI from "openai";
import { z } from "zod";
import { zodTextFormat } from "openai/helpers/zod";
import { MAX_UPLOAD_FILE_SIZE_BYTES } from "@/lib/shared/api/constants";

const OPENAI_EMBEDDING_MODEL =
  process.env.OPENAI_EMBEDDING_MODEL || "text-embedding-3-large";
const OPENAI_VISION_MODEL = process.env.OPENAI_VISION_MODEL || "gpt-5-mini";
const OPENAI_EMBEDDING_DIMENSION = 1024;

const imageSearchDescriptionSchema = z.object({
  summary: z.string().min(1),
});

interface MultimodalEmbeddingResult {
  embedding: number[];
  model: string;
}

function getOpenAiApiKey(): string | null {
  return process.env.OPENAI_API_KEY?.trim() || null;
}

function assertOpenAiConfigured(): string {
  const apiKey = getOpenAiApiKey();
  if (!apiKey) {
    throw new Error("Мультимодальный поиск не настроен: отсутствует OPENAI_API_KEY");
  }
  return apiKey;
}

function assertEmbedding(embedding: number[] | undefined): number[] {
  if (
    !Array.isArray(embedding) ||
    embedding.length !== OPENAI_EMBEDDING_DIMENSION
  ) {
    throw new Error("Провайдер embeddings вернул вектор неверной размерности");
  }
  return embedding;
}

function createImageDataUrl(imageBuffer: Buffer, mimeType: string): string {
  if (!mimeType.startsWith("image/")) {
    throw new Error("Для embeddings поддерживаются только изображения");
  }
  if (imageBuffer.byteLength > MAX_UPLOAD_FILE_SIZE_BYTES) {
    throw new Error("Размер изображения для embeddings не должен превышать 10MB");
  }
  return `data:${mimeType};base64,${imageBuffer.toString("base64")}`;
}

function createOpenAiClient(): OpenAI {
  return new OpenAI({
    apiKey: assertOpenAiConfigured(),
  });
}

async function requestTextEmbedding(
  text: string
): Promise<MultimodalEmbeddingResult> {
  const openai = createOpenAiClient();
  const response = await openai.embeddings.create({
    model: OPENAI_EMBEDDING_MODEL,
    input: text,
    dimensions: OPENAI_EMBEDDING_DIMENSION,
  });

  const embedding = assertEmbedding(response.data?.[0]?.embedding);
  return {
    embedding,
    model: OPENAI_EMBEDDING_MODEL,
  };
}

export function isItemMultimodalSearchConfigured(): boolean {
  return getOpenAiApiKey() != null;
}

export function isSearchMultimodalConfigured(): boolean {
  return isItemMultimodalSearchConfigured();
}

export async function embedSearchText(text: string): Promise<MultimodalEmbeddingResult> {
  const normalizedText = text.trim();
  if (!normalizedText) {
    throw new Error("Нельзя построить embedding для пустого текста");
  }

  return requestTextEmbedding(normalizedText);
}

export async function embedItemSearchText(text: string): Promise<MultimodalEmbeddingResult> {
  return embedSearchText(text);
}

async function describeImageForSearch(
  imageBuffer: Buffer,
  mimeType: string,
  inputType: "query" | "document"
): Promise<string> {
  const openai = createOpenAiClient();
  const imageDataUrl = createImageDataUrl(imageBuffer, mimeType || "image/jpeg");
  const instruction =
    inputType === "query"
      ? [
          "Определи, какой предмет показан на фотографии, чтобы по нему можно было найти похожие вещи в домашнем инвентаре.",
          "Верни короткое описание для поиска на русском языке: тип предмета, возможный бренд, модель, материал, цвет и назначение, если это можно понять по фото.",
          "Без лишних пояснений, только краткое описание предмета для поиска."
        ].join(" ")
      : [
          "Определи, какой предмет показан на фотографии вещи из домашнего инвентаря.",
          "Верни краткое описание для поиска на русском языке: тип предмета, возможный бренд, модель, материал, цвет и назначение, если они различимы.",
          "Без лишних пояснений, только текст описания."
        ].join(" ");

  const response = await openai.responses.parse({
    model: OPENAI_VISION_MODEL,
    input: [
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: instruction,
          },
          {
            type: "input_image",
            image_url: imageDataUrl,
            detail: "high",
          },
        ],
      },
    ],
    text: {
      format: zodTextFormat(
        imageSearchDescriptionSchema,
        "item_search_image_description"
      ),
      verbosity: "low",
    },
  });

  const parsed = response.output_parsed;
  const summary = parsed?.summary?.trim();
  if (!summary) {
    throw new Error("OpenAI не вернул описание изображения для поиска");
  }

  return summary;
}

export async function embedItemSearchImage(
  imageBuffer: Buffer,
  mimeType: string,
  inputType: "query" | "document" = "document"
): Promise<MultimodalEmbeddingResult> {
  const description = await describeImageForSearch(imageBuffer, mimeType, inputType);
  const embedding = await requestTextEmbedding(description);
  return {
    ...embedding,
    model: `${OPENAI_VISION_MODEL}+${OPENAI_EMBEDDING_MODEL}`,
  };
}

export async function embedSearchImage(
  imageBuffer: Buffer,
  mimeType: string,
  inputType: "query" | "document" = "document"
): Promise<MultimodalEmbeddingResult> {
  return embedItemSearchImage(imageBuffer, mimeType, inputType);
}
