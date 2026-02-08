import { fetchRoomsList } from "@/lib/entities/rooms/list-fetch";
import { getRooms } from "@/lib/rooms/api";

jest.mock("@/lib/rooms/api");

describe("fetchRoomsList", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("возвращает данные из getRooms и применяет фильтры", async () => {
    const mockRooms = [
      { id: 1, name: "A", items_count: 2, containers_count: 0, places_count: 0 },
      { id: 2, name: "B", items_count: 0, containers_count: 0, places_count: 0 },
    ];
    (getRooms as jest.Mock).mockResolvedValue({ data: mockRooms });

    const result = await fetchRoomsList({
      filters: { showDeleted: false, hasItems: true, hasContainers: null, hasPlaces: null },
      sortBy: "name",
      sortDirection: "asc",
    });

    expect(result.data).toHaveLength(1);
    expect(result.data[0].name).toBe("A");
    expect(getRooms).toHaveBeenCalledWith(
      expect.objectContaining({ showDeleted: false, sortBy: "name" })
    );
  });
});
