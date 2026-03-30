import type { SupabaseClient } from "@supabase/supabase-js";
import { loadPlaceDetail } from "@/lib/places/load-place-detail";

describe("lib/places/load-place-detail", () => {
  let supabase: jest.Mocked<SupabaseClient>;

  beforeEach(() => {
    supabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      is: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      or: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: null }),
      then: jest.fn().mockImplementation((cb) => cb({ data: [], error: null })),
    } as unknown as jest.Mocked<SupabaseClient>;
  });

  it("returns 500 on place fetch error", async () => {
    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: new Error("DB Error") }),
    });

    const res: any = await loadPlaceDetail(supabase, 1);
    expect(res.status).toBe(500);
    expect(res.error).toBe("DB Error");
  });

  it("returns 404 if place not found", async () => {
    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: null }),
    });

    const res: any = await loadPlaceDetail(supabase, 1);
    expect(res.status).toBe(404);
  });

  it("returns 500 if transitions fetch fails", async () => {
    (supabase.from as jest.Mock).mockImplementation((table) => {
      if (table === "places") {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: { id: 1, name: "Place" }, error: null }),
        };
      }
      return {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        then: (cb: any) => cb({ data: null, error: new Error("Transitions Error") }),
      };
    });

    const res: any = await loadPlaceDetail(supabase, 1);
    expect(res.status).toBe(500);
    expect(res.error).toBe("Transitions Error");
  });

  it("successfully loads place details, transitions, items and containers", async () => {
    let transitionsCallCount = 0;
    (supabase.from as jest.Mock).mockImplementation((table) => {
      if (table === "places") {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: { id: 1, name: "My Place", entity_types: { name: "Storage" } },
            error: null,
          }),
        };
      }
      if (table === "transitions") {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          order: jest.fn().mockReturnThis(),
          or: jest.fn().mockReturnThis(),
          in: jest.fn().mockReturnThis(),
          then: (cb: any) => {
             transitionsCallCount++;
             if (transitionsCallCount === 1) {
                return cb({ data: [{ id: 10, created_at: "2023-01-01", destination_type: "furniture", destination_id: 200, place_id: 1 }], error: null });
             }
             if (transitionsCallCount === 2) {
                return cb({ data: [{ item_id: 300, created_at: "2023-01-02" }, { container_id: 400, created_at: "2023-01-02" }], error: null });
             }
             return cb({ data: [
                { id: 11, created_at: "2023-01-02", destination_type: "place", destination_id: 1, container_id: 400 },
                { id: 12, created_at: "2023-01-03", destination_type: "place", destination_id: 1, item_id: 300 }
             ], error: null });
          },
        };
      }
      if (table === "furniture") {
        return {
          select: jest.fn().mockReturnThis(),
          in: jest.fn().mockReturnThis(),
          is: jest.fn().mockReturnThis(),
          then: (cb: any) => cb({ data: [{ id: 200, name: "My Furniture", room_id: 500 }], error: null }),
        };
      }
      if (table === "rooms") {
        return {
          select: jest.fn().mockReturnThis(),
          in: jest.fn().mockReturnThis(),
          is: jest.fn().mockReturnThis(),
          then: (cb: any) => cb({ data: [{ id: 500, name: "My Room" }], error: null }),
        };
      }
      if (table === "items") {
        return {
          select: jest.fn().mockReturnThis(),
          in: jest.fn().mockReturnThis(),
          is: jest.fn().mockReturnThis(),
          order: jest.fn().mockReturnThis(),
          then: (cb: any) => cb({ data: [{ id: 300, name: "Item in place" }], error: null }),
        };
      }
      if (table === "containers") {
        return {
          select: jest.fn().mockReturnThis(),
          in: jest.fn().mockReturnThis(),
          is: jest.fn().mockReturnThis(),
          order: jest.fn().mockReturnThis(),
          then: (cb: any) => cb({ data: [{ id: 400, name: "Container in place" }], error: null }),
        };
      }

      return {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        then: (cb: any) => cb({ data: [], error: null }),
      };
    });

    const res: any = await loadPlaceDetail(supabase, 1);
    
    expect(res.error).toBeUndefined(); // Success response doesn't have error prop
    expect(res.place.id).toBe(1);
    expect(res.place.entity_type?.name).toBe("Storage");
    expect(res.place.furniture_name).toBe("My Furniture");
    expect(res.place.room_name).toBe("My Room");
    expect(res.items).toHaveLength(1);
    expect(res.containers).toHaveLength(1);
    expect(res.transitions).toHaveLength(1);
  });
});
