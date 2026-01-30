import {
  encodeEntityQrPayload,
  parseEntityQrPayload,
  type EntityQrPayload,
} from "@/lib/entity-qr-code";

describe("entity-qr-code", () => {
  describe("encodeEntityQrPayload", () => {
    it("кодирует item и id", () => {
      expect(encodeEntityQrPayload("item", 42)).toBe("item:42");
    });

    it("кодирует place, container, room", () => {
      expect(encodeEntityQrPayload("place", 1)).toBe("place:1");
      expect(encodeEntityQrPayload("container", 100)).toBe("container:100");
      expect(encodeEntityQrPayload("room", 5)).toBe("room:5");
    });
  });

  describe("parseEntityQrPayload", () => {
    it("разбирает формат type:id для всех типов", () => {
      expect(parseEntityQrPayload("item:123")).toEqual({ type: "item", id: 123 });
      expect(parseEntityQrPayload("place:456")).toEqual({ type: "place", id: 456 });
      expect(parseEntityQrPayload("container:789")).toEqual({ type: "container", id: 789 });
      expect(parseEntityQrPayload("room:1")).toEqual({ type: "room", id: 1 });
    });

    it("разбирает JSON { type, id } для обратной совместимости", () => {
      expect(parseEntityQrPayload('{"type":"room","id":10}')).toEqual({ type: "room", id: 10 });
      expect(parseEntityQrPayload('{"type":"item","id":1}')).toEqual({ type: "item", id: 1 });
    });

    it("возвращает null для пустой строки", () => {
      expect(parseEntityQrPayload("")).toBeNull();
      expect(parseEntityQrPayload("   ")).toBeNull();
    });

    it("возвращает null для неизвестного типа", () => {
      expect(parseEntityQrPayload("unknown:1")).toBeNull();
      expect(parseEntityQrPayload("box:5")).toBeNull();
    });

    it("возвращает null для нечислового id", () => {
      expect(parseEntityQrPayload("item:abc")).toBeNull();
      expect(parseEntityQrPayload("item:")).toBeNull();
    });

    it("допускает пробелы вокруг строки", () => {
      expect(parseEntityQrPayload("  item:42  ")).toEqual({ type: "item", id: 42 });
    });
  });

  describe("roundtrip", () => {
    it("encode -> parse даёт исходные данные", () => {
      const cases: Array<EntityQrPayload> = [
        { type: "item", id: 1 },
        { type: "place", id: 99 },
        { type: "container", id: 1000 },
        { type: "room", id: 5 },
      ];
      for (const payload of cases) {
        const encoded = encodeEntityQrPayload(payload.type, payload.id);
        const parsed = parseEntityQrPayload(encoded);
        expect(parsed).toEqual(payload);
      }
    });
  });
});
