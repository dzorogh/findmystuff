/**
 * API методы для поиска
 */

import { ApiClientBase } from "./base";
import type { SearchResult } from "@/types/entity";

export class SearchApi extends ApiClientBase {
  async search(query: string) {
    return this.request<{ data: SearchResult[] }>(`/search?q=${encodeURIComponent(query)}`);
  }
}
