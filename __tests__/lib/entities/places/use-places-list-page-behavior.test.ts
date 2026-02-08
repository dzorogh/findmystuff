import { usePlacesListPageBehavior } from "@/lib/entities/places/use-places-list-page-behavior";

describe("usePlacesListPageBehavior", () => {
  it("возвращает fetchList и addDialog", () => {
    const result = usePlacesListPageBehavior();
    expect(typeof result.fetchList).toBe("function");
    expect(result.addDialog).toBe(true);
  });
});
