import { logError, logErrorOnly } from "@/lib/shared/logger";

describe("logger", () => {
  const originalEnv = process.env.NODE_ENV;
  const originalError = console.error;

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
    console.error = originalError;
  });

  it("logError вызывает console.error в development", () => {
    process.env.NODE_ENV = "development";
    console.error = jest.fn();
    logError("test message", new Error("err"));
    expect(console.error).toHaveBeenCalledWith("test message", expect.any(Error));
  });

  it("logError только с message в development", () => {
    process.env.NODE_ENV = "development";
    console.error = jest.fn();
    logError("only message");
    expect(console.error).toHaveBeenCalledWith("only message");
  });

  it("logErrorOnly вызывает console.error в development", () => {
    process.env.NODE_ENV = "development";
    console.error = jest.fn();
    logErrorOnly(new Error("e"));
    expect(console.error).toHaveBeenCalledWith(expect.any(Error));
  });

  it("не вызывает console.error в production", () => {
    process.env.NODE_ENV = "production";
    console.error = jest.fn();
    logError("msg", new Error("e"));
    logErrorOnly("x");
    expect(console.error).not.toHaveBeenCalled();
  });
});
