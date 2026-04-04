import {
  embedSearchText,
  embedSearchImage,
  isSearchMultimodalConfigured,
  embedItemSearchText,
  embedItemSearchImage,
  isItemMultimodalSearchConfigured,
} from "@/lib/shared/api/item-multimodal-embeddings-server";

if (!global.structuredClone) {
  global.structuredClone = (val: any) => JSON.parse(JSON.stringify(val));
}

const mockEmbeddingsCreate = jest.fn().mockResolvedValue({
  data: [{ embedding: new Array(1024).fill(0.1) }],
});

const mockResponsesParse = jest.fn().mockResolvedValue({
  output_parsed: {
    summary: "A nice descriptive summary of the image",
  },
});

jest.mock("openai", () => {
  return jest.fn().mockImplementation(() => {
    return {
      embeddings: {
        create: mockEmbeddingsCreate,
      },
      responses: {
        parse: mockResponsesParse,
      },
    };
  });
});


describe("item-multimodal-embeddings-server", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe("isItemMultimodalSearchConfigured", () => {
    it("returns true if OPENAI_API_KEY is present", () => {
      process.env.OPENAI_API_KEY = "test-key";
      expect(isItemMultimodalSearchConfigured()).toBe(true);
      expect(isSearchMultimodalConfigured()).toBe(true);
    });

    it("returns false if OPENAI_API_KEY is missing", () => {
      delete process.env.OPENAI_API_KEY;
      expect(isItemMultimodalSearchConfigured()).toBe(false);
      expect(isSearchMultimodalConfigured()).toBe(false);
    });
  });

  describe("embedSearchText", () => {
    it("throws if API key not configured", async () => {
      delete process.env.OPENAI_API_KEY;
      await expect(embedSearchText("test text")).rejects.toThrow("отсутствует OPENAI_API_KEY");
    });

    it("throws if text is empty", async () => {
      process.env.OPENAI_API_KEY = "test-key";
      await expect(embedSearchText("   ")).rejects.toThrow("пустого текста");
    });

    it("calls OpenAI embeddings and returns vector", async () => {
      process.env.OPENAI_API_KEY = "test-key";
      const result = await embedSearchText("valid text");
      expect(mockEmbeddingsCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          input: "valid text",
          dimensions: 1024,
        })
      );
      expect(result.embedding).toHaveLength(1024);
      expect(result.model).toContain("text-embedding");
      
      // Aliases
      const resultItem = await embedItemSearchText("valid text");
      expect(resultItem.embedding).toHaveLength(1024);
    });
  });

  describe("embedSearchImage", () => {
    let mockBuffer: Buffer;

    beforeEach(() => {
      mockBuffer = Buffer.from("fake-image");
    });

    it("throws if API key not configured", async () => {
      delete process.env.OPENAI_API_KEY;
      await expect(embedSearchImage(mockBuffer, "image/jpeg")).rejects.toThrow("отсутствует OPENAI_API_KEY");
    });

    it("throws if MIME type is not image", async () => {
      process.env.OPENAI_API_KEY = "test-key";
      await expect(embedSearchImage(mockBuffer, "text/plain")).rejects.toThrow("только изображения");
    });

    it("calls OpenAI vision and then embeddings", async () => {
      process.env.OPENAI_API_KEY = "test-key";

      const result = await embedSearchImage(mockBuffer, "image/png", "query");
      
      expect(mockResponsesParse).toHaveBeenCalledWith(
        expect.objectContaining({
          input: expect.arrayContaining([
            expect.objectContaining({
              content: expect.arrayContaining([
                expect.objectContaining({
                  type: "input_image",
                  image_url: expect.stringContaining("data:image/png;base64,")
                })
              ])
            })
          ])
        })
      );
      
      expect(mockEmbeddingsCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          input: "A nice descriptive summary of the image",
          dimensions: 1024,
        })
      );

      expect(result.embedding).toHaveLength(1024);
      expect(result.model).toContain("+"); // Model combines vision+embedding

      // Alias
      const itemResult = await embedItemSearchImage(mockBuffer, "image/png", "document");
      expect(itemResult.model).toContain("+");
    });
  });
});
