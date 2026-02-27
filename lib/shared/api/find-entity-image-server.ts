/**
 * Серверные функции для генерации изображений сущностей через OpenAI DALL-E.
 * Вызываются из app/api/find-entity-image/route.ts.
 */

import OpenAI from "openai";
import { MAX_UPLOAD_FILE_SIZE_BYTES } from "./constants";

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
    place: "место хранения, полка, ячейка",
    room: "комната или помещение или область/зона или пространство на улице",
    container: "контейнер, коробка, ящик",
  };
  const typeHint = entityType ? typeHints[entityType] ?? "" : "";
  const prompt = `Professional photograph of "${entityName}" (${typeHint}), clean white background, high quality, realistic. No text on background.`

  try {
    const openai = new OpenAI({ apiKey });
    const response = await openai.images.generate({
      model: "gpt-image-1.5",
      prompt,
      n: 1,
      size: "1536x1024",
      quality: "low"
    });

    const b64 = response.data?.[0]?.b64_json;
    if (!b64) {
      return { error: "OpenAI не вернул изображение" };
    }

    const buffer = Buffer.from(b64, "base64");
    const maxSize = MAX_UPLOAD_FILE_SIZE_BYTES;
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
