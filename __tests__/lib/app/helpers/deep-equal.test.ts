import { deepEqual } from "@/lib/app/helpers/deep-equal";

describe("deepEqual", () => {
  it("возвращает true для одинаковых примитивов", () => {
    expect(deepEqual(1, 1)).toBe(true);
    expect(deepEqual("a", "a")).toBe(true);
    expect(deepEqual(true, true)).toBe(true);
    expect(deepEqual(null, null)).toBe(true);
    expect(deepEqual(undefined, undefined)).toBe(true);
    expect(deepEqual(NaN, NaN)).toBe(true);
  });

  it("возвращает false для разных примитивов", () => {
    expect(deepEqual(1, 2)).toBe(false);
    expect(deepEqual("a", "b")).toBe(false);
    expect(deepEqual(true, false)).toBe(false);
  });

  it("возвращает true для null и undefined при сравнении друг с другом", () => {
    expect(deepEqual(null, undefined)).toBe(false);
  });

  it("возвращает false когда один null/undefined", () => {
    expect(deepEqual(null, {})).toBe(false);
    expect(deepEqual(undefined, [])).toBe(false);
  });

  it("сравнивает массивы по значению", () => {
    expect(deepEqual([1, 2, 3], [1, 2, 3])).toBe(true);
    expect(deepEqual([], [])).toBe(true);
    expect(deepEqual([1], [2])).toBe(false);
    expect(deepEqual([1, 2], [1, 2, 3])).toBe(false);
  });

  it("сравнивает вложенные массивы", () => {
    expect(deepEqual([[1], [2]], [[1], [2]])).toBe(true);
    expect(deepEqual([[1]], [[2]])).toBe(false);
  });

  it("возвращает false при сравнении массива с объектом", () => {
    expect(deepEqual([], {})).toBe(false);
    expect(deepEqual({ length: 0 }, [])).toBe(false);
  });

  it("сравнивает объекты по значению", () => {
    expect(deepEqual({ a: 1 }, { a: 1 })).toBe(true);
    expect(deepEqual({ a: 1, b: 2 }, { b: 2, a: 1 })).toBe(true);
    expect(deepEqual({}, {})).toBe(true);
    expect(deepEqual({ a: 1 }, { a: 2 })).toBe(false);
    expect(deepEqual({ a: 1 }, { a: 1, b: 2 })).toBe(false);
  });

  it("сравнивает вложенные объекты", () => {
    expect(deepEqual({ a: { b: 1 } }, { a: { b: 1 } })).toBe(true);
    expect(deepEqual({ a: { b: 1 } }, { a: { b: 2 } })).toBe(false);
  });
});
