/**
 * Серверные функции для генерации изображений сущностей через OpenAI DALL-E.
 * Вызываются из app/api/find-entity-image/route.ts.
 */

import OpenAI from "openai";

export async function generateEntityImage(
  apiKey: string,
  entityName: string,
  entityType?: string
): Promise<
  | { buffer: Buffer; contentType: string }
  | { error: string }
> {
  const typeHints: Record<string, string> = {
    item: "предмет, вещь",
    place: "место, локация",
    room: "комната, помещение",
    container: "контейнер, коробка, ящик",
  };
  const typeHint = entityType ? typeHints[entityType] ?? "" : "";
  const prompt =
    typeHint.length > 0
      ? `Professional product photograph of "${entityName}" (${typeHint}), clean white background, high quality, realistic`
      : `Professional product photograph of "${entityName}", clean white background, high quality, realistic`;

  try {
    const openai = new OpenAI({ apiKey });
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt,
      n: 1,
      size: "1792x1024", // 16:9 widescreen
      response_format: "b64_json",
      quality: "standard",
    });

    const b64 = response.data?.[0]?.b64_json;
    if (!b64) {
      return { error: "OpenAI не вернул изображение" };
    }

    const buffer = Buffer.from(b64, "base64");
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (buffer.length > maxSize) {
      return { error: "Изображение слишком большое" };
    }

    return { buffer, contentType: "image/png" };
  } catch (err) {
    const msg =
      err instanceof Error ? err.message : "Ошибка генерации изображения";
    return { error: msg };
  }
}
