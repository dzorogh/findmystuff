import { getPaginationPages } from "@/lib/app/helpers/pagination";

describe("getPaginationPages", () => {
  it("возвращает все страницы если totalPages <= 7", () => {
    expect(getPaginationPages(1, 5)).toEqual([1, 2, 3, 4, 5]);
    expect(getPaginationPages(3, 7)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it("возвращает начальный диапазон с ellipsis при currentPage <= 3", () => {
    expect(getPaginationPages(1, 10)).toEqual([1, 2, 3, 4, "ellipsis", 10]);
  });

  it("возвращает конечный диапазон при currentPage >= totalPages - 2", () => {
    expect(getPaginationPages(10, 10)).toEqual([1, "ellipsis", 7, 8, 9, 10]);
  });

  it("возвращает средний диапазон с ellipsis по краям", () => {
    expect(getPaginationPages(5, 10)).toEqual([
      1,
      "ellipsis",
      4,
      5,
      6,
      "ellipsis",
      10,
    ]);
  });
});
