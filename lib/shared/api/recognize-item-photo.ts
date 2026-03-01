/**
 * API клиент для распознавания названия предмета по фото через OpenAI Vision.
 * Конвенция именования: *ApiClient (см. CONTRIBUTING.md).
 */

import type { RecognizeItemPhotoResponse } from "@/types/api";

export type { RecognizeItemPhotoResponse };

export class RecognizeItemPhotoApiClient {
  async recognize(file: File): Promise<RecognizeItemPhotoResponse> {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/recognize-item-photo", {
      method: "POST",
      body: formData,
    });

    const data = (await response.json()) as RecognizeItemPhotoResponse & {
      error?: string;
    };

    if (!response.ok) {
      throw new Error(data.error ?? `HTTP error! status: ${response.status}`);
    }

    return data;
  }
}

export const recognizeItemPhotoApiClient = new RecognizeItemPhotoApiClient();

/** @deprecated Используйте recognizeItemPhotoApiClient.recognize(file). */
export async function recognizeItemPhotoApi(
  file: File
): Promise<RecognizeItemPhotoResponse> {
  return recognizeItemPhotoApiClient.recognize(file);
}
