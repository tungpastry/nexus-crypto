import { afterEach, describe, expect, it } from "vitest";
import { resetGeminiCircuitForTests } from "./circuitBreaker";
import { getTifaProviderHealth } from "./gateway";

const ORIGINAL_ENV = { ...process.env };

describe("tifa provider gateway", () => {
  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
    resetGeminiCircuitForTests();
  });

  it("reports disabled configuration when API key is missing", () => {
    process.env.TIFA_ASSISTANT_ENABLED = "1";
    delete process.env.GEMINI_API_KEY;
    const health = getTifaProviderHealth();
    expect(health.configured).toBe(false);
    expect(health.reason).toContain("GEMINI_API_KEY");
    expect(health.circuit).toBeTruthy();
    expect(typeof health.stream_enabled).toBe("boolean");
  });
});
