import { afterEach, describe, expect, it } from "vitest";
import { assertTifaRuntimeSafe, getTifaRuntimeConfig } from "./config";

const ORIGINAL_ENV = { ...process.env };

describe("tifa runtime config", () => {
  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  it("loads defaults when env is missing", () => {
    delete process.env.TIFA_RUNTIME_DIR;
    delete process.env.TIFA_PROMPT_PATH;
    delete process.env.GEMINI_TIMEOUT_MS;

    const config = getTifaRuntimeConfig();

    expect(config.runtimeDir).toBe("runtime");
    expect(config.promptPath).toBe("prompts/TIFA_NEXUS_CRYPTO_RUNTIME.md");
    expect(config.gemini.timeoutMs).toBe(20_000);
  });

  it("throws for unsafe output token config", () => {
    process.env.GEMINI_MAX_OUTPUT_TOKENS = "32";

    const config = getTifaRuntimeConfig();
    expect(() => assertTifaRuntimeSafe(config)).toThrow(
      /GEMINI_MAX_OUTPUT_TOKENS/
    );
  });
});
