/**
 * Серверные функции распознавания предмета по фото через OpenAI Vision.
 * Вызываются из app/api/recognize-item-photo/route.ts.
 * Использует Responses API.
 * @see https://developers.openai.com/api/docs/guides/images-vision
 * @see https://developers.openai.com/api/docs/guides/migrate-to-responses
 */

import OpenAI from "openai";

const SYSTEM_PROMPT =
  "На изображении показан предмет. Верни краткое конкретное название на русском. По возможности укажи бренд или модель, если их можно определить. Примеры: Sony WH-1000XM5, Чашка Starbucks, Книга «Мастер и Маргарита», Стул IKEA Poäng. Без пояснений, только название. Если бренд/модель неизвестны — укажи общий тип предмета.";

export async function recognizeItemFromPhoto(
  apiKey: string,
  imageBuffer: Buffer,
  mimeType: string
): Promise<{ itemName: string | null; error?: string }> {
  const base64 = imageBuffer.toString("base64");
  const mediaType = mimeType || "image/jpeg";
  const dataUrl = `data:${mediaType};base64,${base64}`;

  try {
    const openai = new OpenAI({ apiKey });
    const response = await openai.responses.create({
      model: "gpt-5-mini",
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: SYSTEM_PROMPT,
            },
            {
              type: "input_image",
              image_url: dataUrl,
              detail: "high",
            },
          ],
        },
      ]
    });

    const itemName = response.output_text?.trim() ?? null;

    return { itemName };
  } catch (err) {
    const msg =
      err instanceof Error ? err.message : "Ошибка распознавания изображения";
    return { itemName: null, error: msg };
  }
}
