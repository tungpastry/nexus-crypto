import { afterEach, describe, expect, it } from "vitest";
import {
  buildLoginRateLimitKey,
  checkLoginRateLimit,
  clearLoginFailures,
  clearLoginRateLimitForTests,
  recordLoginFailure,
} from "./rateLimit";

const config = {
  maxAttempts: 2,
  windowSeconds: 60,
  lockSeconds: 300,
};

describe("login rate limit", () => {
  afterEach(() => {
    clearLoginRateLimitForTests();
  });

  it("builds stable keys from ip and normalized username", () => {
    expect(buildLoginRateLimitKey("127.0.0.1", " Admin ")).toBe(
      "127.0.0.1:admin"
    );
    expect(buildLoginRateLimitKey("", "")).toBe("unknown:unknown");
  });

  it("locks after the configured threshold", () => {
    const key = "127.0.0.1:admin";

    recordLoginFailure(key, config, 1_000);
    expect(checkLoginRateLimit(key, config, 1_001)).toEqual({ limited: false });

    recordLoginFailure(key, config, 1_002);
    expect(checkLoginRateLimit(key, config, 1_003)).toEqual({
      limited: true,
      retryAfterSeconds: 300,
    });
  });

  it("clears failures after successful login", () => {
    const key = "127.0.0.1:admin";

    recordLoginFailure(key, config, 1_000);
    clearLoginFailures(key);

    expect(checkLoginRateLimit(key, config, 1_001)).toEqual({ limited: false });
  });

  it("resets after the window expires", () => {
    const key = "127.0.0.1:admin";

    recordLoginFailure(key, config, 1_000);

    expect(checkLoginRateLimit(key, config, 62_000)).toEqual({ limited: false });
    recordLoginFailure(key, config, 62_001);
    expect(checkLoginRateLimit(key, config, 62_002)).toEqual({ limited: false });
  });
});
