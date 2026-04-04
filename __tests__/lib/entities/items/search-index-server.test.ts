import type { SupabaseClient } from "@supabase/supabase-js";
import {
  syncItemSearchDocumentsByItemId,
  syncItemSearchDocumentsForEntityType,
  backfillItemSearchDocuments,
} from "@/lib/entities/items/search-index-server";
import { fetchWithTimeout } from "@/lib/shared/api/fetch-with-timeout";
import {
  embedItemSearchImage,
  embedItemSearchText,
  isItemMultimodalSearchConfigured,
} from "@/lib/shared/api/item-multimodal-embeddings-server";

import { logError } from "@/lib/shared/logger";

jest.mock("@/lib/shared/api/fetch-with-timeout", () => ({
  fetchWithTimeout: jest.fn(),
}));

jest.mock("@/lib/shared/api/item-multimodal-embeddings-server", () => ({
  embedItemSearchImage: jest.fn(),
  embedItemSearchText: jest.fn(),
  isItemMultimodalSearchConfigured: jest.fn(),
}));

jest.mock("@/lib/shared/logger", () => ({
  logError: jest.fn(),
}));

describe("lib/entities/items/search-index-server", () => {
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

  describe("syncItemSearchDocumentsByItemId", () => {
    it("returns early if not configured", async () => {
      (isItemMultimodalSearchConfigured as jest.Mock).mockReturnValue(false);
      await syncItemSearchDocumentsByItemId(supabase, 1, 10);
      expect(supabase.from).not.toHaveBeenCalled();
    });

    it("returns early if item is not found", async () => {
      (isItemMultimodalSearchConfigured as jest.Mock).mockReturnValue(true);
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
      });
      await syncItemSearchDocumentsByItemId(supabase, 1, 10);
      expect(embedItemSearchText).not.toHaveBeenCalled();
    });

    it("throws error if item fetch fails", async () => {
      (isItemMultimodalSearchConfigured as jest.Mock).mockReturnValue(true);
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({ data: null, error: new Error("DB error") }),
      });
      await expect(syncItemSearchDocumentsByItemId(supabase, 1, 10)).rejects.toThrow("DB error");
    });

    it("builds and saves search documents with photo", async () => {
      (isItemMultimodalSearchConfigured as jest.Mock).mockReturnValue(true);

      const chain: any = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({
          data: {
            id: 1,
            name: "Test Name",
            photo_url: "https://photo.com/1",
            tenant_id: 10,
            item_type_id: 2,
            entity_types: [{ name: "Test Type" }],
          },
          error: null,
        }),
        delete: jest.fn().mockReturnThis(),
        insert: jest.fn().mockResolvedValue({ error: null }),
      };
      chain.then = jest.fn((cb) => cb({ data: null, error: null }));
      (supabase.from as jest.Mock).mockReturnValue(chain);

      (embedItemSearchText as jest.Mock).mockResolvedValue({
        embedding: [0.1],
        model: "text",
      });

      const mockArrayBuffer = new ArrayBuffer(8);
      (fetchWithTimeout as jest.Mock).mockResolvedValue({
        ok: true,
        headers: { get: () => "image/png" },
        arrayBuffer: jest.fn().mockResolvedValue(mockArrayBuffer),
      });

      (embedItemSearchImage as jest.Mock).mockResolvedValue({
        embedding: [0.5],
        model: "vision",
      });

      await syncItemSearchDocumentsByItemId(supabase, 1, 10);

      expect(chain.delete).toHaveBeenCalled();
      expect(chain.insert).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ source_type: "text", content: "Test Name, Test Type" }),
          expect.objectContaining({ source_type: "image", photo_url: "https://photo.com/1" }),
        ])
      );
    });

    it("handles remote fetch failure and still inserts text document", async () => {
      (isItemMultimodalSearchConfigured as jest.Mock).mockReturnValue(true);

      const chain: any = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({
          data: {
            id: 1,
            name: "Test Name",
            photo_url: "badurl",
            tenant_id: 10,
          },
          error: null,
        }),
        delete: jest.fn().mockReturnThis(),
        insert: jest.fn().mockResolvedValue({ error: null }),
      };
      chain.then = jest.fn((cb) => cb({ data: null, error: null }));
      (supabase.from as jest.Mock).mockReturnValue(chain);

      (embedItemSearchText as jest.Mock).mockResolvedValue({
        embedding: [0.1],
        model: "text",
      });

      (fetchWithTimeout as jest.Mock).mockResolvedValue({
        ok: false,
        status: 404,
      });

      await syncItemSearchDocumentsByItemId(supabase, 1, 10);
      expect(logError).toHaveBeenCalled();
      expect(chain.insert).toHaveBeenCalledWith([
        expect.objectContaining({ source_type: "text" })
      ]);
    });
    
    it("handles wrong content-type in image fetch", async () => {
        (isItemMultimodalSearchConfigured as jest.Mock).mockReturnValue(true);
  
        const chain: any = {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          maybeSingle: jest.fn().mockResolvedValue({
            data: { id: 1, name: "Test Name", photo_url: "badurl", tenant_id: 10 },
            error: null,
          }),
          delete: jest.fn().mockReturnThis(),
          insert: jest.fn().mockResolvedValue({ error: null }),
        };
        chain.then = jest.fn((cb) => cb({ data: null, error: null }));
        (supabase.from as jest.Mock).mockReturnValue(chain);
  
        (embedItemSearchText as jest.Mock).mockResolvedValue({ embedding: [0.1], model: "text" });
  
        (fetchWithTimeout as jest.Mock).mockResolvedValue({
          ok: true,
          headers: { get: () => "text/html" },
        }); // Throws image type error
  
        await syncItemSearchDocumentsByItemId(supabase, 1, 10);
        expect(logError).toHaveBeenCalledWith(
            expect.stringContaining("Не удалось построить image embedding"),
            expect.any(Error)
        );
      });
  });

  describe("syncItemSearchDocumentsForEntityType", () => {
    it("returns 0 if not configured", async () => {
      (isItemMultimodalSearchConfigured as jest.Mock).mockReturnValue(false);
      expect(await syncItemSearchDocumentsForEntityType(supabase, 10, 2)).toBe(0);
    });

    it("throws on db error", async () => {
      (isItemMultimodalSearchConfigured as jest.Mock).mockReturnValue(true);
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        then: jest.fn().mockImplementation((cb) => cb({ data: null, error: new Error("DB select error") })),
      });
      // We must mock the actual promise execution, so we cast and override
      supabase.from = jest.fn((table) => {
          return {
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnThis(),
              then: (cb: any) => cb({ data: null, error: new Error("DB select error") })
          } as any;
      });

      await expect(syncItemSearchDocumentsForEntityType(supabase, 10, 2)).rejects.toThrow("DB select error");
    });

    it("syncs each returned item", async () => {
      (isItemMultimodalSearchConfigured as jest.Mock).mockReturnValue(true);
      
      let callCount = 0;
      supabase.from = jest.fn((table) => {
        if (table === "items" && callCount === 0) {
            callCount++;
            return {
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                then: (cb: any) => cb({ data: [{ id: 101 }, { id: 102 }], error: null })
            } as any;
        }
        return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
            delete: jest.fn().mockReturnThis(),
            then: (cb: any) => cb({ data: null, error: null }),
        } as any;
      });

      const res = await syncItemSearchDocumentsForEntityType(supabase, 10, 2);
      expect(res).toBe(2);
    });
  });

  describe("backfillItemSearchDocuments", () => {
    it("throws if not configured", async () => {
      (isItemMultimodalSearchConfigured as jest.Mock).mockReturnValue(false);
      await expect(backfillItemSearchDocuments(supabase, 10)).rejects.toThrow("не настроен");
    });

    it("returns processed count and next cursor", async () => {
      (isItemMultimodalSearchConfigured as jest.Mock).mockReturnValue(true);
      
      let callCount = 0;
      supabase.from = jest.fn((table) => {
        if (table === "items" && callCount === 0) {
            callCount++;
            return {
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                gt: jest.fn().mockReturnThis(),
                order: jest.fn().mockReturnThis(),
                limit: jest.fn().mockReturnThis(),
                then: (cb: any) => cb({ data: [{ id: 5 }, { id: 8 }], error: null })
            } as any;
        }
        return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
            delete: jest.fn().mockReturnThis(),
            then: (cb: any) => cb({ data: null, error: null }),
        } as any;
      });

      const res = await backfillItemSearchDocuments(supabase, 10, { afterId: 1, limit: 10 });
      expect(res.processed).toBe(2);
      expect(res.nextAfterId).toBe(8);
    });

    it("throws on db error during backfill", async () => {
        (isItemMultimodalSearchConfigured as jest.Mock).mockReturnValue(true);
        
        supabase.from = jest.fn((table) => {
            return {
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                gt: jest.fn().mockReturnThis(),
                order: jest.fn().mockReturnThis(),
                limit: jest.fn().mockReturnThis(),
                then: (cb: any) => cb({ data: null, error: new Error("DB Error") })
            } as any;
        });
  
        await expect(backfillItemSearchDocuments(supabase, 10)).rejects.toThrow("DB Error");
      });
  });
});
