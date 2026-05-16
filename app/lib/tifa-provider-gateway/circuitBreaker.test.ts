import { afterEach, describe, expect, it, vi } from "vitest";
import {
  beginGeminiCircuitAttempt,
  finalizeGeminiCircuitAttempt,
  getGeminiCircuitSnapshot,
  resetGeminiCircuitForTests,
} from "./circuitBreaker";

const ORIGINAL_ENV = { ...process.env };

describe("gemini circuit breaker", () => {
  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
    resetGeminiCircuitForTests();
    vi.useRealTimers();
  });

  it("opens after threshold failures", () => {
    process.env.GEMINI_CIRCUIT_BREAKER_ENABLED = "1";
    process.env.GEMINI_CIRCUIT_FAILURE_THRESHOLD = "3";
    process.env.GEMINI_CIRCUIT_COOLDOWN_MS = "60000";

    expect(beginGeminiCircuitAttempt().allowed).toBe(true);
    finalizeGeminiCircuitAttempt(false);
    finalizeGeminiCircuitAttempt(false);
    finalizeGeminiCircuitAttempt(false);

    const snapshot = getGeminiCircuitSnapshot();
    expect(snapshot.state).toBe("open");
    expect(snapshot.failure_count).toBeGreaterThanOrEqual(3);
  });

  it("blocks attempts while open", () => {
    process.env.GEMINI_CIRCUIT_BREAKER_ENABLED = "1";
    process.env.GEMINI_CIRCUIT_FAILURE_THRESHOLD = "1";
    process.env.GEMINI_CIRCUIT_COOLDOWN_MS = "60000";

    finalizeGeminiCircuitAttempt(false);
    const attempt = beginGeminiCircuitAttempt();
    expect(attempt.allowed).toBe(false);
    if (!attempt.allowed) {
      expect(attempt.reason).toBe("GEMINI_CIRCUIT_OPEN");
    }
  });

  it("moves to half-open after cooldown and closes on success", () => {
    vi.useFakeTimers();
    process.env.GEMINI_CIRCUIT_BREAKER_ENABLED = "1";
    process.env.GEMINI_CIRCUIT_FAILURE_THRESHOLD = "1";
    process.env.GEMINI_CIRCUIT_COOLDOWN_MS = "1000";

    finalizeGeminiCircuitAttempt(false, Date.now());
    expect(getGeminiCircuitSnapshot(Date.now()).state).toBe("open");

    vi.advanceTimersByTime(1001);
    const attempt = beginGeminiCircuitAttempt(Date.now());
    expect(attempt.allowed).toBe(true);
    finalizeGeminiCircuitAttempt(true, Date.now());
    expect(getGeminiCircuitSnapshot(Date.now()).state).toBe("closed");
  });

  it("returns to open when half-open probe fails", () => {
    vi.useFakeTimers();
    process.env.GEMINI_CIRCUIT_BREAKER_ENABLED = "1";
    process.env.GEMINI_CIRCUIT_FAILURE_THRESHOLD = "1";
    process.env.GEMINI_CIRCUIT_COOLDOWN_MS = "1000";

    finalizeGeminiCircuitAttempt(false, Date.now());
    vi.advanceTimersByTime(1001);
    beginGeminiCircuitAttempt(Date.now());
    finalizeGeminiCircuitAttempt(false, Date.now());

    expect(getGeminiCircuitSnapshot(Date.now()).state).toBe("open");
  });
});
