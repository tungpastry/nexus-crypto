import { describe, expect, it, vi } from "vitest";
import { withProviderRetry } from "./providerRetry";

describe("provider retry", () => {
  it("retries a 429 once and honors Retry-After", async () => {
    const operation = vi
      .fn<() => Promise<string>>()
      .mockRejectedValueOnce({ response: { status: 429, headers: { "retry-after": "2" } } })
      .mockResolvedValueOnce("ok");
    const sleep = vi.fn(async () => undefined);

    await expect(withProviderRetry(operation, sleep)).resolves.toBe("ok");
    expect(operation).toHaveBeenCalledTimes(2);
    expect(sleep).toHaveBeenCalledWith(2_000);
  });

  it("does not retry a non-provider validation error", async () => {
    const operation = vi.fn<() => Promise<string>>().mockRejectedValue(new Error("invalid"));
    await expect(withProviderRetry(operation)).rejects.toThrow("invalid");
    expect(operation).toHaveBeenCalledTimes(1);
  });
});
