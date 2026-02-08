import { fetchItemsList } from "@/lib/entities/items/list-fetch";
import { getItems } from "@/lib/entities/api";

jest.mock("@/lib/entities/api");

describe("fetchItemsList", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("возвращает data и totalCount из getItems", async () => {
    (getItems as jest.Mock).mockResolvedValue({ data: [], totalCount: 0 });

    const result = await fetchItemsList({
      filters: {
        showDeleted: false,
        locationType: null,
        hasPhoto: null,
        roomId: null,
      },
      sortBy: "name",
      sortDirection: "asc",
      page: 1,
    });

    expect(result.data).toEqual([]);
    expect(result.totalCount).toBe(0);
    expect(getItems).toHaveBeenCalled();
  });
});
