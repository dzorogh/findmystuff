import type { SupabaseClient } from "@supabase/supabase-js";
import { getPlacesList, mapRpcPlaceToPlace } from "@/lib/places/get-places-list";
import { getPlacesWithRoomRpc } from "@/lib/places/api";
import type { RpcPlaceRow } from "@/types/entity";

jest.mock("@/lib/places/api", () => ({
  getPlacesWithRoomRpc: jest.fn(),
}));

describe("lib/places/get-places-list", () => {
  let supabase: jest.Mocked<SupabaseClient>;

  beforeEach(() => {
    jest.clearAllMocks();
    supabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      not: jest.fn().mockReturnThis(),
      is: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      then: jest.fn().mockImplementation((cb) => cb({ data: [], error: null })),
    } as unknown as jest.Mocked<SupabaseClient>;
  });

  describe("mapRpcPlaceToPlace", () => {
    it("maps fully populated rpc row", () => {
      const row: RpcPlaceRow = {
        id: 1,
        name: "Place A",
        entity_type_id: 2,
        entity_type_name: "Type 2",
        created_at: "2023-01-01",
        deleted_at: null,
        photo_url: "url",
        room_id: 3,
        room_name: "Room 3",
        furniture_id: 4,
        furniture_name: "Furn 4",
        items_count: 5,
        containers_count: 6,
        is_container_location: false,
        tenant_id: 1,
      };
      const res = mapRpcPlaceToPlace(row);
      expect(res.id).toBe(1);
      expect(res.entity_type?.name).toBe("Type 2");
      expect(res.room?.id).toBe(3);
      expect(res.furniture_name).toBe("Furn 4");
    });

    it("maps empty fields gracefully", () => {
      const row = {
        id: 1,
        name: null,
        created_at: "2023",
      } as unknown as RpcPlaceRow;
      const res = mapRpcPlaceToPlace(row);
      expect(res.room).toBeNull();
      expect(res.entity_type).toBeNull();
      expect(res.items_count).toBe(0);
    });
  });

  describe("getPlacesList", () => {
    const defaultParams = {
      query: null,
      showDeleted: false,
      sortBy: "name" as const,
      sortDirection: "asc" as const,
      entityTypeId: null,
      roomId: null,
      furnitureId: null,
      tenantId: 10,
    };

    it("fetches list using rpc successfully", async () => {
      (getPlacesWithRoomRpc as jest.Mock).mockResolvedValue({
        data: [{ id: 1, name: "RPC Place", created_at: "2023" }],
        error: null,
      });

      const res = await getPlacesList(supabase, defaultParams);
      expect(getPlacesWithRoomRpc).toHaveBeenCalled();
      expect(res.error).toBeNull();
      expect(res.data).toHaveLength(1);
    });

    it("returns error if rpc fails with unexpected message", async () => {
      (getPlacesWithRoomRpc as jest.Mock).mockResolvedValue({
        data: null,
        error: new Error("Random DB error"),
      });

      const res = await getPlacesList(supabase, defaultParams);
      expect(res.error).toBe("Random DB error");
    });

    it("triggers fallback if rpc fails with column error", async () => {
      (getPlacesWithRoomRpc as jest.Mock).mockResolvedValue({
        data: null,
        error: new Error('column "code" does not exist bla bla'),
      });

      // Mock fallback queries
      (supabase.from as jest.Mock).mockImplementation((table) => {
        if (table === "places") {
          return {
            select: jest.fn().mockReturnThis(),
            order: jest.fn().mockReturnThis(),
            limit: jest.fn().mockReturnThis(),
            not: jest.fn().mockReturnThis(),
            is: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            in: jest.fn().mockReturnThis(),
            then: (cb: any) =>
              cb({
                data: [
                  { id: 1, name: "Fallback Place", entity_type: null },
                  { id: 2, name: "Secret Place", entity_type: { name: "Type" } },
                ],
                error: null,
              }),
          };
        }
        if (table === "v_place_last_room_transition") {
          return {
            select: jest.fn().mockReturnThis(),
            in: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            then: (cb: any) =>
              cb({
                data: [{ place_id: 1, room_id: 100 }],
                error: null,
              }),
          };
        }
        // Rooms and counts
        return {
          select: jest.fn().mockReturnThis(),
          in: jest.fn().mockReturnThis(),
          is: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          then: (cb: any) => cb({ data: [], error: null }),
        };
      });

      const res = await getPlacesList(supabase, {
        ...defaultParams,
        query: "Secret",
        roomId: 100,
        entityTypeId: 5,
        showDeleted: true,
      });

      expect(supabase.from).toHaveBeenCalledWith("places");
      expect(res.data).toHaveLength(1);
      expect(res.data![0].name).toBe("Secret Place");
    });

    it("returns empty array when fallback yields no rows", async () => {
        (getPlacesWithRoomRpc as jest.Mock).mockResolvedValue({
            data: null,
            error: new Error('column "code" does not exist'),
        });
        
        (supabase.from as jest.Mock).mockImplementation(() => {
            return {
                select: jest.fn().mockReturnThis(),
                order: jest.fn().mockReturnThis(),
                limit: jest.fn().mockReturnThis(),
                is: jest.fn().mockReturnThis(),
                then: (cb: any) => cb({ data: [], error: null })
            }
        });

        const res = await getPlacesList(supabase, { ...defaultParams, sortBy: "created_at" });
        expect(res.data).toEqual([]);
    });

    it("returns error when fallback fails directly", async () => {
        (getPlacesWithRoomRpc as jest.Mock).mockResolvedValue({
            data: null,
            error: new Error('column "code" does not exist'),
        });
        
        (supabase.from as jest.Mock).mockImplementation(() => {
            return {
                select: jest.fn().mockReturnThis(),
                order: jest.fn().mockReturnThis(),
                limit: jest.fn().mockReturnThis(),
                is: jest.fn().mockReturnThis(),
                then: (cb: any) => cb({ data: null, error: new Error("Fallback failed") })
            }
        });

        const res = await getPlacesList(supabase, defaultParams);
        expect(res.error).toBe("Fallback failed");
    });
  });
});
