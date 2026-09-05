import { afterEach, describe, expect, it } from "vitest";
import {
  resetGeminiCircuitForTests,
  resetLlmCircuitForTests,
} from "./circuitBreaker";
import { getTifaProviderHealth } from "./gateway";

const ORIGINAL_ENV = { ...process.env };

describe("tifa provider gateway", () => {
  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
    resetGeminiCircuitForTests();
    resetLlmCircuitForTests();
  });

  it("reports disabled configuration when API key is missing", () => {
    process.env.TIFA_ASSISTANT_ENABLED = "1";
    process.env.TIFA_LLM_PROVIDER = "gemini";
    delete process.env.GEMINI_API_KEY;
    const health = getTifaProviderHealth();
    expect(health.provider).toBe("gemini");
    expect(health.configured).toBe(false);
    expect(health.reason).toContain("GEMINI_API_KEY");
    expect(health.circuit).toBeTruthy();
    expect(typeof health.stream_enabled).toBe("boolean");
  });

  it("reports ollama configuration from env", () => {
    process.env.TIFA_ASSISTANT_ENABLED = "1";
    process.env.TIFA_LLM_PROVIDER = "ollama";
    process.env.OLLAMA_HOST = "http://192.168.1.7:11434";
    process.env.OLLAMA_MODEL = "gemma4:e4b-it-qat";
    const health = getTifaProviderHealth();
    expect(health.provider).toBe("ollama");
    expect(health.configured).toBe(true);
    expect(health.model).toBe("gemma4:e4b-it-qat");
    expect(health.circuit).toBeTruthy();
  });

  it("reports unconfigured ollama when model is missing", () => {
    process.env.TIFA_LLM_PROVIDER = "ollama";
    process.env.OLLAMA_HOST = "http://192.168.1.7:11434";
    process.env.OLLAMA_MODEL = "";
    const health = getTifaProviderHealth();
    expect(health.provider).toBe("ollama");
    expect(health.configured).toBe(false);
    expect(health.reason).toContain("OLLAMA_MODEL");
  });
});
