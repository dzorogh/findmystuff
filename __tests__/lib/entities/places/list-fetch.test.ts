import { fetchPlacesList } from "@/lib/entities/places/list-fetch";
import { getPlaces } from "@/lib/places/api";

jest.mock("@/lib/places/api");

describe("fetchPlacesList", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("возвращает данные из getPlaces", async () => {
    (getPlaces as jest.Mock).mockResolvedValue({ data: [{ id: 1, name: "Shelf" }] });

    const result = await fetchPlacesList({
      filters: { showDeleted: false, entityTypeId: null, roomId: null },
      sortBy: "name",
      sortDirection: "asc",
    });

    expect(result.data).toHaveLength(1);
    expect(getPlaces).toHaveBeenCalled();
  });
});
