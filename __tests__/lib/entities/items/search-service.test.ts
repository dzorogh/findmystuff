import type { SupabaseClient } from "@supabase/supabase-js";
import {
  searchGlobalItemsByText,
  searchGlobalItemsByImage,
} from "@/lib/entities/items/search-service";
import {
  embedItemSearchText,
  embedItemSearchImage,
  isItemMultimodalSearchConfigured,
} from "@/lib/shared/api/item-multimodal-embeddings-server";
import { searchItemsByEmbeddingRpc } from "@/lib/entities/api";
import {
  searchItemsByNameProjection,
  getItemSearchProjectionByIds,
} from "@/lib/entities/items/search-projection-server";
import { logError } from "@/lib/shared/logger";

jest.mock("@/lib/shared/api/item-multimodal-embeddings-server", () => ({
  embedItemSearchText: jest.fn(),
  embedItemSearchImage: jest.fn(),
  isItemMultimodalSearchConfigured: jest.fn(),
}));

jest.mock("@/lib/entities/api", () => ({
  searchItemsByEmbeddingRpc: jest.fn(),
}));

jest.mock("@/lib/entities/items/search-projection-server", () => ({
  searchItemsByNameProjection: jest.fn(),
  getItemSearchProjectionByIds: jest.fn(),
}));

jest.mock("@/lib/shared/logger", () => ({
  logError: jest.fn(),
}));

describe("search-service", () => {
  let supabase: jest.Mocked<SupabaseClient>;

  beforeEach(() => {
    jest.clearAllMocks();
    supabase = {} as any;
  });

  describe("searchGlobalItemsByText", () => {
    it("returns empty structure for empty query", async () => {
      const result = await searchGlobalItemsByText(supabase, 1, "   ");
      expect(result.data).toEqual([]);
      expect(result.totalCount).toBe(0);
      expect(result.meta.noMatches).toBe(true);
    });

    it("uses keyword fallback when multimodal is not configured", async () => {
      (isItemMultimodalSearchConfigured as jest.Mock).mockReturnValue(false);
      
      const mockProjections = [
        { id: 1, name: "Keyword Match", item_type_name: "Type" }
      ];
      (searchItemsByNameProjection as jest.Mock).mockResolvedValue(mockProjections);

      const result = await searchGlobalItemsByText(supabase, 1, "test");
      
      expect(result.data).toHaveLength(1);
      expect(result.data[0].entityId).toBe(1);
      expect(result.data[0].match?.source).toBe("keyword");
      expect(embedItemSearchText).not.toHaveBeenCalled();
    });

    it("combines semantic and keyword searches", async () => {
      (isItemMultimodalSearchConfigured as jest.Mock).mockReturnValue(true);
      (embedItemSearchText as jest.Mock).mockResolvedValue({ embedding: [0.1, 0.2] });

      (searchItemsByNameProjection as jest.Mock).mockResolvedValue([
        { id: 2, name: "Keyword Only" }
      ]);

      (searchItemsByEmbeddingRpc as jest.Mock).mockResolvedValue({
        data: [{ id: 1, similarity: 0.9, match_source: "text", total_count: 1 }],
        error: null,
      });

      (getItemSearchProjectionByIds as jest.Mock).mockResolvedValue([
        { id: 1, name: "Semantic Match" }
      ]);

      const result = await searchGlobalItemsByText(supabase, 1, "query");

      expect(searchItemsByEmbeddingRpc).toHaveBeenCalled();
      expect(result.data).toHaveLength(2); // Semantic (1) + Keyword (2)
      
      const ids = result.data.map(d => d.entityId);
      expect(ids).toContain(1);
      expect(ids).toContain(2);
    });

    it("falls back to keyword if semantic matching throws", async () => {
      (isItemMultimodalSearchConfigured as jest.Mock).mockReturnValue(true);
      (embedItemSearchText as jest.Mock).mockRejectedValue(new Error("Network Error"));

      (searchItemsByNameProjection as jest.Mock).mockResolvedValue([
        { id: 99, name: "Fallback Keyword" }
      ]);

      const result = await searchGlobalItemsByText(supabase, 1, "query");

      expect(logError).toHaveBeenCalled();
      expect(result.data).toHaveLength(1);
      expect(result.data[0].entityId).toBe(99);
      expect(result.data[0].match?.source).toBe("keyword");
    });
  });

  describe("searchGlobalItemsByImage", () => {
    it("returns search hits from image embedding projection", async () => {
      (embedItemSearchImage as jest.Mock).mockResolvedValue({ embedding: [0.5, 0.5] });

      (searchItemsByEmbeddingRpc as jest.Mock).mockResolvedValue({
        data: [{ id: 10, similarity: 0.8, match_source: "image", total_count: 1 }],
        error: null,
      });

      (getItemSearchProjectionByIds as jest.Mock).mockResolvedValue([
        { id: 10, name: "Visual Match" }
      ]);

      const result = await searchGlobalItemsByImage(supabase, 1, {
        buffer: Buffer.from("fake"),
        mimeType: "image/png"
      });

      expect(embedItemSearchImage).toHaveBeenCalled();
      expect(searchItemsByEmbeddingRpc).toHaveBeenCalled();
      expect(getItemSearchProjectionByIds).toHaveBeenCalledWith(supabase, 1, [10], { showDeleted: false });
      
      expect(result.data).toHaveLength(1);
      expect(result.data[0].entityId).toBe(10);
      expect(result.totalCount).toBe(1);
    });
    
    it("handles rpc errors throwing correctly", async () => {
      (embedItemSearchImage as jest.Mock).mockResolvedValue({ embedding: [0.5] });

      (searchItemsByEmbeddingRpc as jest.Mock).mockResolvedValue({
        data: null,
        error: new Error("RPC failure"),
      });

      await expect(searchGlobalItemsByImage(supabase, 1, {
        buffer: Buffer.from("fake"),
        mimeType: "image/png"
      })).rejects.toThrow("RPC failure");
    });

    it("handles empty RPC data returning 0 hits", async () => {
      (embedItemSearchImage as jest.Mock).mockResolvedValue({ embedding: [0.5] });

      (searchItemsByEmbeddingRpc as jest.Mock).mockResolvedValue({
        data: [],
        error: null,
      });

      const result = await searchGlobalItemsByImage(supabase, 1, {
        buffer: Buffer.from("fake"),
        mimeType: "image/png"
      });

      expect(result.data).toHaveLength(0);
      expect(result.totalCount).toBe(0);
      expect(getItemSearchProjectionByIds).not.toHaveBeenCalled();
    });
  });
});
