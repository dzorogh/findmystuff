import React from "react";
import { renderHook } from "@testing-library/react";
import { useItemDetail } from "@/lib/entities/hooks/use-item-detail";

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
  fetchItemById: jest.fn().mockResolvedValue({ id: 1, name: "Item" }),
  fetchItemTransitions: jest.fn().mockResolvedValue([]),
}));

describe("useItemDetail", () => {
  it("возвращает объект с itemId, item, isLoading, error и методами", () => {
    const { result } = renderHook(() => useItemDetail());
    expect(result.current.itemId).toBe(1);
    expect(typeof result.current.loadItemData).toBe("function");
    expect(result.current.entityLabel).toBe("Вещь");
  });
});
