import { useContainersListPageBehavior } from "@/lib/entities/containers/use-containers-list-page-behavior";

describe("useContainersListPageBehavior", () => {
  it("возвращает fetchList, pagination и addDialog", () => {
    const result = useContainersListPageBehavior();
    expect(typeof result.fetchList).toBe("function");
    expect(result.pagination).toEqual({ pageSize: 20 });
    expect(result.addDialog).toBe(true);
  });
});
