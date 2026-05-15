import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createSessionToken } from "./session";
import { requireApiAuth } from "./api";

const ORIGINAL_ENV = process.env;

function request(headers?: HeadersInit) {
  return new NextRequest("http://localhost/api/crypto-price?symbol=BTCUSDT", {
    headers,
  });
}

describe("requireApiAuth", () => {
  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
    vi.useRealTimers();
  });

  it("allows protected APIs when auth is disabled", async () => {
    process.env.NEXUS_AUTH_ENABLED = "0";

    const result = await requireApiAuth(request());

    expect(result).toEqual({ ok: true, via: "disabled" });
  });

  it("rejects protected APIs without session or bearer token", async () => {
    process.env.NEXUS_AUTH_ENABLED = "1";
    process.env.NEXUS_AUTH_USERNAME = "admin";
    process.env.NEXUS_AUTH_PASSWORD_HASH = "scrypt:salt:hash";
    process.env.NEXUS_AUTH_SECRET = "secret-a";

    const result = await requireApiAuth(request());

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.response.status).toBe(401);
      await expect(result.response.json()).resolves.toMatchObject({
        error: { code: "AUTH_REQUIRED" },
      });
    }
  });

  it("allows protected APIs with a valid bearer smoke token", async () => {
    process.env.NEXUS_AUTH_ENABLED = "1";
    process.env.NEXUS_AUTH_USERNAME = "admin";
    process.env.NEXUS_AUTH_PASSWORD_HASH = "scrypt:salt:hash";
    process.env.NEXUS_AUTH_SECRET = "secret-a";
    process.env.NEXUS_SMOKE_AUTH_TOKEN = "smoke-secret";

    const result = await requireApiAuth(
      request({ Authorization: "Bearer smoke-secret" })
    );

    expect(result).toEqual({ ok: true, via: "bearer" });
  });

  it("rejects invalid bearer smoke tokens", async () => {
    process.env.NEXUS_AUTH_ENABLED = "1";
    process.env.NEXUS_AUTH_USERNAME = "admin";
    process.env.NEXUS_AUTH_PASSWORD_HASH = "scrypt:salt:hash";
    process.env.NEXUS_AUTH_SECRET = "secret-a";
    process.env.NEXUS_SMOKE_AUTH_TOKEN = "smoke-secret";

    const result = await requireApiAuth(
      request({ Authorization: "Bearer wrong-secret" })
    );

    expect(result.ok).toBe(false);
  });

  it("does not allow bearer auth when no smoke token is configured", async () => {
    process.env.NEXUS_AUTH_ENABLED = "1";
    process.env.NEXUS_AUTH_USERNAME = "admin";
    process.env.NEXUS_AUTH_PASSWORD_HASH = "scrypt:salt:hash";
    process.env.NEXUS_AUTH_SECRET = "secret-a";
    delete process.env.NEXUS_SMOKE_AUTH_TOKEN;

    const result = await requireApiAuth(
      request({ Authorization: "Bearer any-token" })
    );

    expect(result.ok).toBe(false);
  });

  it("allows protected APIs with a valid session cookie", async () => {
    vi.setSystemTime(new Date("2026-05-15T00:00:00Z"));
    process.env.NEXUS_AUTH_ENABLED = "1";
    process.env.NEXUS_AUTH_USERNAME = "admin";
    process.env.NEXUS_AUTH_PASSWORD_HASH = "scrypt:salt:hash";
    process.env.NEXUS_AUTH_SECRET = "secret-a";
    process.env.NEXUS_AUTH_COOKIE_NAME = "nexus_session";
    const token = await createSessionToken("admin", "secret-a", 60);

    const result = await requireApiAuth(
      request({ Cookie: `nexus_session=${token}` })
    );

    expect(result).toEqual({ ok: true, via: "session" });
  });
});
