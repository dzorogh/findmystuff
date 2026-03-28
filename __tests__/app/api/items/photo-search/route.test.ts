import { NextResponse } from "next/server";
import { HTTP_STATUS } from "@/lib/shared/api/http-status";

jest.mock("@/lib/shared/api/require-auth", () => ({
  requireAuthAndTenant: jest.fn(),
}));

jest.mock("@/lib/shared/supabase/server", () => ({
  createClient: jest.fn(),
}));

jest.mock("@/lib/shared/api/item-multimodal-embeddings-server", () => ({
  embedItemSearchImage: jest.fn(),
}));

jest.mock("@/lib/entities/api", () => ({
  searchItemsByEmbeddingRpc: jest.fn(),
}));

jest.mock("@/lib/shared/api/api-error-response", () => ({
  apiErrorResponse: jest.fn((error: unknown) =>
    NextResponse.json(
      { error: error instanceof Error ? error.message : "unknown error" },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    )
  ),
}));

const requireAuthAndTenant = jest.requireMock("@/lib/shared/api/require-auth")
  .requireAuthAndTenant as jest.Mock;
const createClient = jest.requireMock("@/lib/shared/supabase/server")
  .createClient as jest.Mock;
const embedItemSearchImage = jest.requireMock("@/lib/shared/api/item-multimodal-embeddings-server")
  .embedItemSearchImage as jest.Mock;
const searchItemsByEmbeddingRpc = jest.requireMock("@/lib/entities/api")
  .searchItemsByEmbeddingRpc as jest.Mock;
const apiErrorResponse = jest.requireMock("@/lib/shared/api/api-error-response")
  .apiErrorResponse as jest.Mock;

function createRequest(file: File) {
  if (typeof (file as File & { arrayBuffer?: unknown }).arrayBuffer !== "function") {
    Object.defineProperty(file, "arrayBuffer", {
      value: async () => Uint8Array.from([105, 109, 103]).buffer,
    });
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("showDeleted", "false");

  return {
    url: "http://localhost/api/items/photo-search",
    method: "POST",
    headers: new Headers(),
    formData: async () => formData,
  } as unknown as Request;
}

describe("POST /api/items/photo-search", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    apiErrorResponse.mockImplementation((error: unknown) =>
      NextResponse.json(
        { error: error instanceof Error ? error.message : "unknown error" },
        { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
      )
    );
  });

  it("возвращает 401, если пользователь не авторизован", async () => {
    requireAuthAndTenant.mockResolvedValue(
      NextResponse.json(
        { error: "Не авторизован" },
        { status: HTTP_STATUS.UNAUTHORIZED }
      )
    );

    const { POST } = await import("@/app/api/items/photo-search/route");
    const response = await POST(createRequest(new File(["img"], "query.jpg", { type: "image/jpeg" })));

    expect(response.status).toBe(HTTP_STATUS.UNAUTHORIZED);
    expect(createClient).not.toHaveBeenCalled();
  });

  it("возвращает 400, если передан не image-файл", async () => {
    requireAuthAndTenant.mockResolvedValue({ tenantId: 1 });
    createClient.mockResolvedValue({});

    const { POST } = await import("@/app/api/items/photo-search/route");
    const response = await POST(createRequest(new File(["txt"], "query.txt", { type: "text/plain" })));

    expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
    const body = await response.json();
    expect(body.error).toBe("Файл должен быть изображением");
  });

  it("возвращает найденные вещи и match metadata", async () => {
    requireAuthAndTenant.mockResolvedValue({ tenantId: 1 });
    createClient.mockResolvedValue({});
    embedItemSearchImage.mockResolvedValue({
      embedding: [0.1, 0.2, 0.3],
      model: "voyage-multimodal-3.5",
    });
    searchItemsByEmbeddingRpc.mockResolvedValue({
      data: [
        {
          id: 5,
          name: "Беспроводные наушники",
          item_type_id: 2,
          item_type_name: "Наушники",
          created_at: "2026-03-28T10:00:00.000Z",
          deleted_at: null,
          photo_url: null,
          price_amount: null,
          price_currency: null,
          current_value_amount: null,
          current_value_currency: null,
          quantity: 1,
          purchase_date: null,
          destination_type: "room",
          destination_id: 1,
          moved_at: "2026-03-28T10:00:00.000Z",
          room_id: 1,
          room_name: "Кабинет",
          similarity: 0.91,
          match_source: "text",
          total_count: 1,
        },
      ],
      error: null,
    });

    const { POST } = await import("@/app/api/items/photo-search/route");
    const response = await POST(createRequest(new File(["img"], "query.jpg", { type: "image/jpeg" })));
    const body = await response.json();

    expect(response.status).toBe(HTTP_STATUS.OK);
    expect(body.totalCount).toBe(1);
    expect(body.noSimilarFound).toBe(false);
    expect(body.data[0].name).toBe("Беспроводные наушники");
    expect(body.data[0].search_match).toEqual({
      similarity: 0.91,
      source: "text",
    });
  });

  it("возвращает noSimilarFound, если матчей нет", async () => {
    requireAuthAndTenant.mockResolvedValue({ tenantId: 1 });
    createClient.mockResolvedValue({});
    embedItemSearchImage.mockResolvedValue({
      embedding: [0.1, 0.2, 0.3],
      model: "voyage-multimodal-3.5",
    });
    searchItemsByEmbeddingRpc.mockResolvedValue({
      data: [],
      error: null,
    });

    const { POST } = await import("@/app/api/items/photo-search/route");
    const response = await POST(createRequest(new File(["img"], "query.jpg", { type: "image/jpeg" })));
    const body = await response.json();

    expect(response.status).toBe(HTTP_STATUS.OK);
    expect(body.data).toEqual([]);
    expect(body.totalCount).toBe(0);
    expect(body.noSimilarFound).toBe(true);
  });
});
