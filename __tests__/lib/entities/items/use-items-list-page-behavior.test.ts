import { useItemsListPageBehavior } from "@/lib/entities/items/use-items-list-page-behavior";

describe("useItemsListPageBehavior", () => {
  it("возвращает fetchList, pagination и addDialog", () => {
    const result = useItemsListPageBehavior();
    expect(typeof result.fetchList).toBe("function");
    expect(result.pagination).toEqual({ pageSize: 20 });
    expect(result.addDialog).toBe(true);
  });
});
