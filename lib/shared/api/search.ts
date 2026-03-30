/**
 * API методы для поиска
 */

import { HttpClient } from "./http-client";
import type { SearchResponse, SearchResponseMeta } from "@/lib/search/types";

export class SearchApiClient extends HttpClient {
  async searchText(
    query: string,
    options?: { signal?: AbortSignal }
  ): Promise<SearchResponse> {
    const rawResponse = await this.request<SearchResponse["data"]>(
      `/search?q=${encodeURIComponent(query)}`,
      {
        signal: options?.signal,
      }
    );

    const response = rawResponse as unknown as SearchResponse;

    return {
      data: Array.isArray(response.data) ? response.data : [],
      totalCount: typeof response.totalCount === "number" ? response.totalCount : 0,
      meta:
        response.meta ?? {
          mode: "text",
          scope: "global",
          query,
          totalCount: typeof response.totalCount === "number" ? response.totalCount : 0,
          noMatches: !Array.isArray(response.data) || response.data.length === 0,
        },
    };
  }

  async searchByPhoto(file: File): Promise<SearchResponse> {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${this.apiBaseUrl}/search`, {
      method: "POST",
      body: formData,
    });

    const data = (await response.json().catch(() => null)) as
      | SearchResponse
      | { error?: string }
      | null;

    if (!response.ok) {
      throw new Error(
        data && "error" in data ? data.error || "Ошибка поиска по фото" : "Ошибка поиска по фото"
      );
    }

    const parsed = data as Partial<SearchResponse> | null;

    return {
      data: Array.isArray(parsed?.data) ? parsed.data : [],
      totalCount: typeof parsed?.totalCount === "number" ? parsed.totalCount : 0,
      meta:
        parsed?.meta ?? ({
          mode: "image",
          scope: "global",
          totalCount: typeof parsed?.totalCount === "number" ? parsed.totalCount : 0,
          noMatches: !Array.isArray(parsed?.data) || parsed.data.length === 0,
        } as SearchResponseMeta),
    };
  }

  async search(query: string): Promise<SearchResponse> {
    return this.searchText(query);
  }
}

export const searchApiClient = new SearchApiClient();
