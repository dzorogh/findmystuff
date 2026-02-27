import { PLACE_DESTINATION_FURNITURE_ONLY } from "@/lib/places/validation-messages";

describe("validation messages for places", () => {
  it("экспортирует корректное сообщение PLACE_DESTINATION_FURNITURE_ONLY", () => {
    expect(PLACE_DESTINATION_FURNITURE_ONLY).toBe(
      "Места можно привязывать только к мебели",
    );
  });
});

