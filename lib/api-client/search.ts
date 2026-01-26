/**
 * API методы для поиска
 */

import { ApiClientBase } from "./base";
import type { SearchResult } from "@/types/entity";

export class SearchApi extends ApiClientBase {
  async search(query: string) {
    // API возвращает { data: SearchResult[] }
    // request возвращает это напрямую, поэтому response будет { data: SearchResult[] }
    // И response.data будет SearchResult[]
    return this.request<SearchResult[]>(`/search?q=${encodeURIComponent(query)}`);
  }
}
