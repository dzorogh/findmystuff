const originalEnv = process.env;

describe("lib/shared/storage", () => {
  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("uploadToS3 выбрасывает ошибку при отсутствии S3 credentials", async () => {
    delete process.env.S3_ACCESS_KEY_ID;
    delete process.env.S3_SECRET_ACCESS_KEY;
    const { uploadToS3 } = await import("@/lib/shared/storage/index");
    await expect(uploadToS3(Buffer.from("x"), "f", "text/plain")).rejects.toThrow(
      "S3 credentials"
    );
  });
});
