import React from "react";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useItemDetail } from "@/lib/entities/hooks/use-item-detail";
import { fetchItemById } from "@/lib/entities/services/item-detail";
import type { Item } from "@/types/entity";

const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useParams: () => ({ id: "1" }),
  useRouter: () => ({ push: mockPush }),
}));
jest.mock("@/lib/app/contexts/current-page-context", () => ({
  useCurrentPage: () => ({
    setEntityName: jest.fn(),
    setIsLoading: jest.fn(),
    setEntityActions: jest.fn(),
  }),
}));
jest.mock("@/lib/users/context", () => ({
  useUser: () => ({ user: { id: "u1" }, isLoading: false }),
}));
jest.mock("@/lib/entities/hooks/use-entity-data-loader", () => ({
  useEntityDataLoader: () => ({}),
}));
jest.mock("@/lib/entities/hooks/use-entity-actions", () => ({
  useEntityActions: () => ({}),
}));
jest.mock("@/lib/entities/hooks/use-print-entity-label", () => ({
  usePrintEntityLabel: () => jest.fn(),
}));
jest.mock("@/lib/entities/services/item-detail", () => ({
  fetchItemById: jest.fn(),
  fetchItemTransitions: jest.fn().mockResolvedValue([]),
}));

describe("useItemDetail", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("обновляет loadItemData, item, isLoading и error при загрузке через fetchItemById", async () => {
    const mockPayload: Item = {
      id: 1,
      name: "Item",
      created_at: "2025-01-01",
      deleted_at: null,
      photo_url: null,
    };
    let resolveFetch: (value: Item) => void;
    const fetchPromise = new Promise<Item>((resolve) => {
      resolveFetch = resolve;
    });
    jest.mocked(fetchItemById).mockReturnValue(fetchPromise);

    const { result } = renderHook(() => useItemDetail());

    expect(result.current.itemId).toBe(1);
    expect(result.current.entityLabel).toBe("Вещь");
    expect(typeof result.current.loadItemData).toBe("function");

    await act(async () => {
      result.current.loadItemData();
    });

    expect(result.current.isLoading).toBe(true);

    act(() => {
      resolveFetch(mockPayload);
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(result.current.item).toEqual(mockPayload);
      expect(result.current.error).toBeNull();
    });
  });
});
