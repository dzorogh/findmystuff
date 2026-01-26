/**
 * API методы для загрузки фотографий
 */

import { ApiClientBase } from "./base";

export class PhotoApi extends ApiClientBase {
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
}
