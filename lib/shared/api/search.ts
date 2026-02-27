/**
 * API методы для поиска
 */

import { HttpClient } from "./http-client";
import type { SearchResult } from "@/types/entity";

export class SearchApiClient extends HttpClient {
  async search(query: string) {
    return this.request<SearchResult[]>(`/search?q=${encodeURIComponent(query)}`);
  }
}

export const searchApiClient = new SearchApiClient();
