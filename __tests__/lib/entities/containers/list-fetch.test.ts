import { fetchContainersList } from "@/lib/entities/containers/list-fetch";
import { getContainers } from "@/lib/containers/api";

jest.mock("@/lib/containers/api");

describe("fetchContainersList", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("возвращает данные из getContainers", async () => {
    (getContainers as jest.Mock).mockResolvedValue({ data: [] });

    const result = await fetchContainersList({
      filters: {
        showDeleted: false,
        entityTypeId: null,
        hasItems: null,
        locationType: null,
      },
      sortBy: "name",
      sortDirection: "asc",
    });

    expect(result.data).toEqual([]);
    expect(getContainers).toHaveBeenCalled();
  });
});
