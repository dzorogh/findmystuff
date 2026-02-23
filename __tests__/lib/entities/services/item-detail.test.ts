import { fetchItemById, fetchItemTransitions } from "@/lib/entities/services/item-detail";

jest.mock("@/lib/entities/api", () => ({
  getItem: jest.fn(),
  getItemTransitions: jest.fn(),
}));

const { getItem, getItemTransitions } = require("@/lib/entities/api");

describe("item-detail service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("fetchItemById", () => {
    it("возвращает item при успешном ответе", async () => {
      (getItem as jest.Mock).mockResolvedValue({
        data: { item: { id: 1, name: "Item 1" } },
        error: null,
      });

      const result = await fetchItemById(1);

      expect(getItem).toHaveBeenCalledWith(1);
      expect(result).toEqual({ id: 1, name: "Item 1" });
    });

    it("выбрасывает ошибку при response.error", async () => {
      (getItem as jest.Mock).mockResolvedValue({ data: null, error: "Not found" });

      await expect(fetchItemById(1)).rejects.toThrow("Not found");
    });

    it("выбрасывает ошибку при отсутствии item в data", async () => {
      (getItem as jest.Mock).mockResolvedValue({ data: {}, error: null });

      await expect(fetchItemById(1)).rejects.toThrow("Вещь не найдена");
    });
  });

  describe("fetchItemTransitions", () => {
    it("возвращает массив transitions", async () => {
      (getItemTransitions as jest.Mock).mockResolvedValue({
        data: [{ id: 1 }, { id: 2 }],
        error: null,
      });

      const result = await fetchItemTransitions(1);

      expect(getItemTransitions).toHaveBeenCalledWith(1);
      expect(result).toEqual([{ id: 1 }, { id: 2 }]);
    });

    it("возвращает [] при response.error", async () => {
      (getItemTransitions as jest.Mock).mockResolvedValue({
        data: null,
        error: "Error",
      });

      const result = await fetchItemTransitions(1);

      expect(result).toEqual([]);
    });

    it("возвращает [] при исключении", async () => {
      (getItemTransitions as jest.Mock).mockRejectedValue(new Error("Network error"));

      const result = await fetchItemTransitions(1);

      expect(result).toEqual([]);
    });
  });
});
