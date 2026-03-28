/**
 * Серверные функции распознавания предмета по фото через OpenAI Vision.
 * Вызываются из app/api/recognize-item-photo/route.ts.
 * Использует Responses API.
 * @see https://developers.openai.com/api/docs/guides/images-vision
 * @see https://developers.openai.com/api/docs/guides/migrate-to-responses
 */

import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";

export interface RecognizeItemTypeOption {
  id: number;
  name: string;
}

const recognitionResultSchema = z.object({
  itemName: z.string().nullable(),
  itemTypeId: z.number().int().nullable(),
});

const buildPrompt = (itemTypes: RecognizeItemTypeOption[]) => {
  const basePrompt = [
    "На изображении показан предмет.",
    "Верни краткое конкретное название на русском.",
    "По возможности укажи бренд или модель, если их можно определить.",
    "Примеры: Sony WH-1000XM5, Чашка Starbucks, Книга «Мастер и Маргарита», Стул IKEA Poäng.",
    "Если бренд или модель неизвестны, укажи общий тип предмета.",
  ];

  if (itemTypes.length === 0) {
    return [
      ...basePrompt,
      'Поле itemTypeId обязательно верни как null.',
    ].join(" ");
  }

  const itemTypesList = itemTypes.map(({ id, name }) => `${id}: ${name}`).join("; ");

  return [
    ...basePrompt,
    "Дополнительно выбери одну наиболее подходящую категорию только из списка ниже.",
    "Если по фото нельзя уверенно выбрать одну категорию, верни itemTypeId как null.",
    "Никогда не придумывай id и не используй значения вне списка.",
    `Список категорий: ${itemTypesList}.`,
  ].join(" ");
};

export async function recognizeItemFromPhoto(
  apiKey: string,
  imageBuffer: Buffer,
  mimeType: string,
  itemTypes: RecognizeItemTypeOption[] = []
): Promise<{ itemName: string | null; itemTypeId: number | null; error?: string }> {
  const base64 = imageBuffer.toString("base64");
  const mediaType = mimeType || "image/jpeg";
  const dataUrl = `data:${mediaType};base64,${base64}`;

  try {
    const openai = new OpenAI({ apiKey });
    const response = await openai.responses.parse({
      model: "gpt-5-mini",
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: buildPrompt(itemTypes),
            },
            {
              type: "input_image",
              image_url: dataUrl,
              detail: "high",
            },
          ],
        },
      ],
      text: {
        format: zodTextFormat(
          recognitionResultSchema,
          "item_photo_recognition"
        ),
        verbosity: "low",
      },
    });

    const parsed = response.output_parsed;
    if (!parsed) {
      return {
        itemName: null,
        itemTypeId: null,
        error: "Не удалось разобрать ответ распознавания изображения",
      };
    }

    const itemName = parsed.itemName?.trim() || null;
    const allowedTypeIds = new Set(itemTypes.map(({ id }) => id));
    const itemTypeId =
      parsed.itemTypeId != null && allowedTypeIds.has(parsed.itemTypeId)
        ? parsed.itemTypeId
        : null;

    return { itemName, itemTypeId };
  } catch (err) {
    const msg =
      err instanceof Error ? err.message : "Ошибка распознавания изображения";
    return { itemName: null, itemTypeId: null, error: msg };
  }
}
