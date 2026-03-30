import type { SupabaseClient } from "@supabase/supabase-js";
import {
  syncEntitySearchDocumentsByItemId,
  backfillEntitySearchDocuments,
  syncSearchDocumentsByEntityId,
} from "@/lib/search/search-index-server";
import { fetchWithTimeout } from "@/lib/shared/api/fetch-with-timeout";
import {
  embedSearchImage,
  embedSearchText,
  isSearchMultimodalConfigured,
} from "@/lib/shared/api/item-multimodal-embeddings-server";
import { logError } from "@/lib/shared/logger";

jest.mock("@/lib/shared/api/fetch-with-timeout", () => ({
  fetchWithTimeout: jest.fn(),
}));

jest.mock("@/lib/shared/api/item-multimodal-embeddings-server", () => ({
  embedSearchImage: jest.fn(),
  embedSearchText: jest.fn(),
  isSearchMultimodalConfigured: jest.fn(),
}));

jest.mock("@/lib/shared/logger", () => ({
  logError: jest.fn(),
}));

describe("search-index-server", () => {
  let supabase: jest.Mocked<SupabaseClient>;

  beforeEach(() => {
    jest.clearAllMocks();

    supabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      gt: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
      insert: jest.fn().mockResolvedValue({ error: null }),
      delete: jest.fn().mockResolvedValue({ error: null }),
    } as unknown as jest.Mocked<SupabaseClient>;
  });

  describe("syncSearchDocumentsByEntityId", () => {
    it("returns early if multimodal is not configured", async () => {
      (isSearchMultimodalConfigured as jest.Mock).mockReturnValue(false);

      await syncSearchDocumentsByEntityId(supabase, "item", 1, 10);
      expect(supabase.from).not.toHaveBeenCalled();
    });

    it("deletes documents if entity not found or is deleted", async () => {
      (isSearchMultimodalConfigured as jest.Mock).mockReturnValue(true);
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
        delete: jest.fn().mockReturnThis(),
      });

      await syncEntitySearchDocumentsByItemId(supabase, 1, 10);
      expect(supabase.from).toHaveBeenCalledWith("items");
      expect(supabase.from("items").delete).toHaveBeenCalled();
    });

    it("builds and replaces search documents for valid text-only item", async () => {
      (isSearchMultimodalConfigured as jest.Mock).mockReturnValue(true);

      const chain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({
          data: {
            id: 1,
            name: "Test Item",
            tenant_id: 10,
            deleted_at: null,
            entity_types: { name: "test_type" }
          },
          error: null,
        }),
        delete: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
      };
      (supabase.from as jest.Mock).mockReturnValue(chain);

      (embedSearchText as jest.Mock).mockResolvedValue({
        model: "text-model",
        embedding: [0.1, 0.2, 0.3],
      });

      await syncEntitySearchDocumentsByItemId(supabase, 1, 10);

      expect(embedSearchText).toHaveBeenCalledWith("Test Item, test_type");
      expect(chain.delete).toHaveBeenCalled();
      expect(chain.insert).toHaveBeenCalledWith([
        expect.objectContaining({
          content: "Test Item, test_type",
          embedding: [0.1, 0.2, 0.3],
        }),
      ]);
    });

    it("builds and replaces search documents for item with image", async () => {
        (isSearchMultimodalConfigured as jest.Mock).mockReturnValue(true);
  
        const chain = {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          maybeSingle: jest.fn().mockResolvedValue({
            data: {
              id: 1,
              name: "Photo Item",
              photo_url: "http://example.com/photo.jpg",
              tenant_id: 10,
              deleted_at: null,
              entity_types: { name: "photo_type" }
            },
            error: null,
          }),
          delete: jest.fn().mockReturnThis(),
          insert: jest.fn().mockReturnThis(),
        };
        (supabase.from as jest.Mock).mockReturnValue(chain);
  
        (embedSearchText as jest.Mock).mockResolvedValue({
          model: "text-model",
          embedding: [0.1],
        });
        
        const mockArrayBuffer = new ArrayBuffer(8);
        (fetchWithTimeout as jest.Mock).mockResolvedValue({
            ok: true,
            headers: { get: () => "image/jpeg" },
            arrayBuffer: jest.fn().mockResolvedValue(mockArrayBuffer)
        });

        (embedSearchImage as jest.Mock).mockResolvedValue({
            model: "image-model",
            embedding: [0.9]
        });

        await syncEntitySearchDocumentsByItemId(supabase, 1, 10);
  
        expect(embedSearchImage).toHaveBeenCalled();
        expect(chain.insert).toHaveBeenCalledWith(expect.arrayContaining([
            expect.objectContaining({ source_type: "text", embedding: [0.1] }),
            expect.objectContaining({ source_type: "image", photo_url: "http://example.com/photo.jpg", embedding: [0.9] })
        ]));
      });

      it("logs error gracefully when image fetch fails", async () => {
        (isSearchMultimodalConfigured as jest.Mock).mockReturnValue(true);
  
        const chain = {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          maybeSingle: jest.fn().mockResolvedValue({
            data: {
              id: 1,
              photo_url: "http://example.com/bad.jpg",
              tenant_id: 10,
            },
            error: null,
          }),
          delete: jest.fn().mockReturnThis(),
          insert: jest.fn().mockReturnThis(),
        };
        (supabase.from as jest.Mock).mockReturnValue(chain);
  
        (fetchWithTimeout as jest.Mock).mockResolvedValue({
            ok: false,
            status: 404
        });

        await syncEntitySearchDocumentsByItemId(supabase, 1, 10);
  
        expect(logError).toHaveBeenCalledWith(
            expect.stringContaining("Не удалось построить image embedding"),
            expect.any(Error)
        );
        // Should still insert what it could (even just empty text if no name)
      });
  });

  describe("backfillEntitySearchDocuments", () => {
    it("throws if multimodal is not configured", async () => {
      (isSearchMultimodalConfigured as jest.Mock).mockReturnValue(false);
      await expect(backfillEntitySearchDocuments(supabase, 10)).rejects.toThrow();
    });

    it("processes items until exhausted, then container, then done", async () => {
      (isSearchMultimodalConfigured as jest.Mock).mockReturnValue(true);

      const chain = {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          gt: jest.fn().mockReturnThis(),
          order: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnThis(),
          maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
          delete: jest.fn().mockReturnThis()
      };
      
      let itemsCalled = 0;

      
      const selectMock = jest.fn((table) => {
         if (table === "items") {
             itemsCalled++;
             if (itemsCalled === 1) return { error: null, data: [{id: 1}, {id: 2}] };
             if (itemsCalled === 2) return { error: null, data: [] }; // done array
         }
         return { error: null, data: [] }; // container done immediately
      });

      Object.assign(chain, {
          then: jest.fn().mockImplementation((cb) => {
              // Hacky way to simulate the select
              return cb({ error: null, data: [{id: 1}] });
          })
      });
      
      // Need real promise resolution for query inside loop
      (supabase.from as jest.Mock).mockImplementation((table) => ({
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          gt: jest.fn().mockReturnThis(),
          order: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnThis(),
          then: jest.fn().mockImplementation((cb) => cb(selectMock(table))),
          maybeSingle: jest.fn().mockResolvedValue({data: null}),
          delete: jest.fn().mockReturnThis()
      }));

      const res1 = await backfillEntitySearchDocuments(supabase, 10, { cursor: { entityType: "item", afterId: 0 } });
      expect(res1.processed).toBe(2);
      expect(res1.nextCursor).toEqual({ entityType: "item", afterId: 2 });
      
      const res2 = await backfillEntitySearchDocuments(supabase, 10, { cursor: res1.nextCursor });
      // items array is now [], so it switches to containers
      expect(res2.processed).toBe(0);
      expect(res2.nextCursor).toBeNull(); // container array also [], so returns null
    });
  });
});
