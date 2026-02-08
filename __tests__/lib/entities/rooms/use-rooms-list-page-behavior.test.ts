import { useRoomsListPageBehavior } from "@/lib/entities/rooms/use-rooms-list-page-behavior";

describe("useRoomsListPageBehavior", () => {
  it("возвращает fetchList и addDialog", () => {
    const result = useRoomsListPageBehavior();
    expect(typeof result.fetchList).toBe("function");
    expect(result.addDialog).toBe(true);
  });
});
