import { describe, expect, it } from "vitest";
import { sanitizeTifaContext, validateTifaChatInput } from "./validation";

describe("tifa widget validation", () => {
  it("validates request body and trims message", () => {
    const payload = validateTifaChatInput({
      message: "  hello tifa  ",
      context: { page: "/", assetId: "bitcoin", timeframe: "1h" },
    });

    expect(payload.message).toBe("hello tifa");
    expect(payload.context?.assetId).toBe("bitcoin");
  });

  it("rejects empty message", () => {
    expect(() => validateTifaChatInput({ message: "   " })).toThrow(/Message/);
  });

  it("sanitizes invalid context safely", () => {
    expect(sanitizeTifaContext(null)).toBeUndefined();
    expect(sanitizeTifaContext({ page: 123 })).toEqual({
      page: undefined,
      assetId: undefined,
      timeframe: undefined,
    });
  });
});
