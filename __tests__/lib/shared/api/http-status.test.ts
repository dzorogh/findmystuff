import { HTTP_STATUS } from "@/lib/shared/api/http-status";

describe("HTTP_STATUS", () => {
  it("содержит основные коды ответа", () => {
    expect(HTTP_STATUS.OK).toBe(200);
    expect(HTTP_STATUS.CREATED).toBe(201);
    expect(HTTP_STATUS.BAD_REQUEST).toBe(400);
    expect(HTTP_STATUS.UNAUTHORIZED).toBe(401);
    expect(HTTP_STATUS.FORBIDDEN).toBe(403);
    expect(HTTP_STATUS.NOT_FOUND).toBe(404);
    expect(HTTP_STATUS.INTERNAL_SERVER_ERROR).toBe(500);
    expect(HTTP_STATUS.SERVICE_UNAVAILABLE).toBe(503);
  });
});

