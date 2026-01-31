/**
 * API методы для поиска
 */

import { HttpClient } from "./http-client";
import type { SearchResult } from "@/types/entity";

export class SearchApi extends HttpClient {
  async search(query: string) {
    return this.request<SearchResult[]>(`/search?q=${encodeURIComponent(query)}`);
  }
}

export const searchApi = new SearchApi();
