import type { SupabaseClient } from "@supabase/supabase-js";
import {
  getItemSearchProjectionByIds,
  searchItemsByNameProjection,
  getContainerSearchProjectionByIds,
} from "@/lib/entities/items/search-projection-server";

describe("search-projection-server", () => {
  let supabase: jest.Mocked<SupabaseClient>;

  beforeEach(() => {
    supabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      not: jest.fn().mockReturnThis(),
      is: jest.fn().mockReturnThis(),
      ilike: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockImplementation(() => Promise.resolve({ data: null, error: null })),
      then: jest.fn().mockImplementation((cb) => cb({ data: [], error: null })),
    } as unknown as jest.Mocked<SupabaseClient>;
  });

  describe("getItemSearchProjectionByIds", () => {
    it("returns empty array when itemIds is empty", async () => {
      const res = await getItemSearchProjectionByIds(supabase, 1, []);
      expect(res).toEqual([]);
    });

    it("can process items with no transitions", async () => {
      const chain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        is: jest.fn().mockReturnThis(),
        not: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
      };

      (supabase.from as jest.Mock).mockImplementation((table) => {
        if (table === "items") {
          return {
            ...chain,
            then: (cb: any) =>
              cb({
                data: [
                  {
                    id: 1,
                    name: "Item 1",
                    photo_url: "url1",
                    item_type_id: 10,
                    entity_types: { name: "type1" },
                  },
                ],
                error: null,
              }),
          };
        }
        if (table === "transitions") {
           return {
            ...chain,
            then: (cb: any) => cb({ data: [], error: null }),
           }
        }
        return {
          ...chain,
          then: (cb: any) => cb({ data: [], error: null }),
        };
      });

      const res = await getItemSearchProjectionByIds(supabase, 1, [1], { showDeleted: true });
      expect(res).toHaveLength(1);
      expect(res[0].name).toBe("Item 1");
      expect(res[0].item_type_name).toBe("type1");
      expect(res[0].place_name).toBeNull();
    });

    it("can process items with place transition", async () => {
        const chain = {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          in: jest.fn().mockReturnThis(),
          is: jest.fn().mockReturnThis(),
          order: jest.fn().mockReturnThis(),
        };
  
        (supabase.from as jest.Mock).mockImplementation((table) => {
          if (table === "items") {
            return {
              ...chain,
              then: (cb: any) =>
                cb({
                  data: [
                    {
                      id: 1,
                      name: "Item 1",
                      entity_types: [{ name: "type1" }],
                    },
                  ],
                  error: null,
                }),
            };
          }
          if (table === "transitions") {
             return {
              ...chain,
              then: (cb: any) => cb({ data: [{ item_id: 1, destination_type: "place", destination_id: 100 }], error: null }),
             }
          }
          if (table === "places") {
             return {
              ...chain,
              then: (cb: any) => cb({ data: [{ id: 100, name: "My Place" }], error: null }),
             }
          }
          return {
            ...chain,
            then: (cb: any) => cb({ data: [], error: null }),
          };
        });
  
        const res = await getItemSearchProjectionByIds(supabase, 1, [1]);
        expect(res).toHaveLength(1);
        expect(res[0].place_name).toBe("My Place");
      });
  });

  describe("searchItemsByNameProjection", () => {
    it("returns empty array for empty query", async () => {
      const res = await searchItemsByNameProjection(supabase, 1, "   ");
      expect(res).toEqual([]);
    });

    it("queries items and fetches projections", async () => {
        const chain = {
            select: jest.fn().mockReturnThis(),
            ilike: jest.fn().mockReturnThis(),
            is: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            in: jest.fn().mockReturnThis(),
            or: jest.fn().mockReturnThis(),
            order: jest.fn().mockReturnThis(),
            limit: jest.fn().mockReturnThis(),
            in: jest.fn().mockReturnThis(),
            order: jest.fn().mockReturnThis(),
        };
    
        (supabase.from as jest.Mock).mockImplementation((table) => {
            if (table === "items") {
              // searchItems return vs projection return
              return {
                ...chain,
                then: (cb: any) => cb({ data: [{ id: 99, name: "Test Item", entity_types: null }], error: null }),
              };
            }
            return {
                ...chain,
                then: (cb: any) => cb({ data: [], error: null }),
            };
        });

        const res = await searchItemsByNameProjection(supabase, 1, "test");
        expect(res).toHaveLength(1);
        expect(res[0].id).toBe(99);
    });
  });

  describe("getContainerSearchProjectionByIds", () => {
     it("processes empty ids", async () => {
         const res = await getContainerSearchProjectionByIds(supabase, 1, []);
         expect(res).toEqual([]);
     });

     it("processes missing transitions", async () => {
        const chain = {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            in: jest.fn().mockReturnThis(),
            is: jest.fn().mockReturnThis(),
            not: jest.fn().mockReturnThis(),
            order: jest.fn().mockReturnThis(),
            limit: jest.fn().mockReturnThis(),
            maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
          };
    
          (supabase.from as jest.Mock).mockImplementation((table) => {
            if (table === "containers") {
              return {
                ...chain,
                then: (cb: any) => cb({ data: [{ id: 1, name: "Root Container", entity_types: null }], error: null }),
              };
            }
            return {
                ...chain,
                then: (cb: any) => cb({ data: [], error: null }),
            };
          });

          const res = await getContainerSearchProjectionByIds(supabase, 1, [1]);
          expect(res).toHaveLength(1);
          expect(res[0].name).toBe("Root Container");
     });
  });

  describe("searchContainersByNameProjection", () => {
    it("returns correctly formed projections for containers search", async () => {
      const { searchContainersByNameProjection } = await import("@/lib/entities/items/search-projection-server");
      (supabase.from as jest.Mock).mockImplementation((table) => {
        if (table === "containers") {
          return {
            select: jest.fn().mockReturnThis(),
            ilike: jest.fn().mockReturnThis(),
            is: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            in: jest.fn().mockReturnThis(),
            or: jest.fn().mockReturnThis(),
            order: jest.fn().mockReturnThis(),
            limit: jest.fn().mockReturnThis(),
            then: (cb: any) => cb({ data: [{ id: 404, name: "Found Container" }], error: null }),
          };
        }
        return {
          select: jest.fn().mockReturnThis(),
          in: jest.fn().mockReturnThis(),
          is: jest.fn().mockReturnThis(),
          or: jest.fn().mockReturnThis(),
          order: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnThis(),
          maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
          then: (cb: any) => cb({ data: [], error: null }),
        };
      });

      const res = await searchContainersByNameProjection(supabase, 1, "query");
      expect(res).toBeDefined();
    });
  });
});
