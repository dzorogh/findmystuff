import { resolveQuickMove, ENTITY_LEVEL } from "@/lib/entities/helpers/quick-move";
import type { EntityQrPayload } from "@/lib/entities/helpers/qr-code";

describe("quick-move", () => {
  describe("ENTITY_LEVEL", () => {
    it("room has lowest level (destination), item has highest (source)", () => {
      expect(ENTITY_LEVEL.room).toBe(0);
      expect(ENTITY_LEVEL.place).toBe(1);
      expect(ENTITY_LEVEL.container).toBe(2);
      expect(ENTITY_LEVEL.item).toBe(3);
    });
  });

  describe("resolveQuickMove", () => {
    it("returns null when both entities have the same type", () => {
      expect(resolveQuickMove({ type: "item", id: 1 }, { type: "item", id: 2 })).toBeNull();
      expect(resolveQuickMove({ type: "container", id: 1 }, { type: "container", id: 2 })).toBeNull();
      expect(resolveQuickMove({ type: "place", id: 1 }, { type: "place", id: 2 })).toBeNull();
      expect(resolveQuickMove({ type: "room", id: 1 }, { type: "room", id: 2 })).toBeNull();
    });

    it("item + container → move item to container", () => {
      const a: EntityQrPayload = { type: "item", id: 10 };
      const b: EntityQrPayload = { type: "container", id: 20 };
      expect(resolveQuickMove(a, b)).toEqual({
        sourceType: "item",
        sourceId: 10,
        destType: "container",
        destId: 20,
      });
      expect(resolveQuickMove(b, a)).toEqual({
        sourceType: "item",
        sourceId: 10,
        destType: "container",
        destId: 20,
      });
    });

    it("container + place → move container to place", () => {
      const a: EntityQrPayload = { type: "container", id: 5 };
      const b: EntityQrPayload = { type: "place", id: 7 };
      expect(resolveQuickMove(a, b)).toEqual({
        sourceType: "container",
        sourceId: 5,
        destType: "place",
        destId: 7,
      });
      expect(resolveQuickMove(b, a)).toEqual({
        sourceType: "container",
        sourceId: 5,
        destType: "place",
        destId: 7,
      });
    });

    it("place + room → move place to room", () => {
      const a: EntityQrPayload = { type: "place", id: 3 };
      const b: EntityQrPayload = { type: "room", id: 1 };
      expect(resolveQuickMove(a, b)).toEqual({
        sourceType: "place",
        sourceId: 3,
        destType: "room",
        destId: 1,
      });
      expect(resolveQuickMove(b, a)).toEqual({
        sourceType: "place",
        sourceId: 3,
        destType: "room",
        destId: 1,
      });
    });

    it("item + room → move item to room", () => {
      const a: EntityQrPayload = { type: "item", id: 100 };
      const b: EntityQrPayload = { type: "room", id: 2 };
      expect(resolveQuickMove(a, b)).toEqual({
        sourceType: "item",
        sourceId: 100,
        destType: "room",
        destId: 2,
      });
      expect(resolveQuickMove(b, a)).toEqual({
        sourceType: "item",
        sourceId: 100,
        destType: "room",
        destId: 2,
      });
    });

    it("item + place → move item to place", () => {
      const a: EntityQrPayload = { type: "item", id: 1 };
      const b: EntityQrPayload = { type: "place", id: 2 };
      expect(resolveQuickMove(a, b)).toEqual({
        sourceType: "item",
        sourceId: 1,
        destType: "place",
        destId: 2,
      });
    });

    it("container + room → move container to room", () => {
      const a: EntityQrPayload = { type: "container", id: 8 };
      const b: EntityQrPayload = { type: "room", id: 1 };
      expect(resolveQuickMove(a, b)).toEqual({
        sourceType: "container",
        sourceId: 8,
        destType: "room",
        destId: 1,
      });
    });

    it("place + container → move container to place", () => {
      const a: EntityQrPayload = { type: "place", id: 4 };
      const b: EntityQrPayload = { type: "container", id: 6 };
      expect(resolveQuickMove(a, b)).toEqual({
        sourceType: "container",
        sourceId: 6,
        destType: "place",
        destId: 4,
      });
      expect(resolveQuickMove(b, a)).toEqual({
        sourceType: "container",
        sourceId: 6,
        destType: "place",
        destId: 4,
      });
    });
  });
});
