/**
 * API методы для загрузки фотографий
 */

import { HttpClient } from "./http-client";

export class PhotoApiClient extends HttpClient {
  async uploadPhoto(file: File) {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${this.apiBaseUrl}/upload-photo`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      let errorMessage = "Ошибка загрузки фото";
      try {
        const error = await response.json();
        errorMessage = error.error || errorMessage;
      } catch {
        errorMessage = `Ошибка сервера: ${response.status} ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    if (!data.url) {
      throw new Error("Сервер не вернул URL загруженного файла");
    }

    return { data: { url: data.url } };
  }

  async findEntityImage(params: { name: string; entityType?: string }) {
    const response = await fetch(`${this.apiBaseUrl}/find-entity-image`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: params.name,
        entityType: params.entityType,
      }),
    });

    if (!response.ok) {
      let errorMessage = "Ошибка поиска изображения";
      try {
        const error = await response.json();
        errorMessage = error.error || errorMessage;
      } catch {
        errorMessage = `Ошибка сервера: ${response.status} ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    if (!data.url) {
      throw new Error("Сервер не вернул URL изображения");
    }

    return { data: { url: data.url } };
  }
}


export const photoApiClient = new PhotoApiClient();
