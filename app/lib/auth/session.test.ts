import { afterEach, describe, expect, it, vi } from "vitest";
import { createSessionToken, verifySessionToken } from "./session";

describe("signed session tokens", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("creates and verifies a valid token", async () => {
    vi.setSystemTime(new Date("2026-05-15T00:00:00Z"));

    const token = await createSessionToken("admin", "secret-a", 60);
    const result = await verifySessionToken(token, "secret-a");

    expect(result).toMatchObject({ ok: true, username: "admin" });
  });

  it("rejects expired tokens", async () => {
    vi.setSystemTime(new Date("2026-05-15T00:00:00Z"));
    const token = await createSessionToken("admin", "secret-a", 1);

    vi.setSystemTime(new Date("2026-05-15T00:00:02Z"));
    const result = await verifySessionToken(token, "secret-a");

    expect(result).toMatchObject({ ok: false, reason: "expired" });
  });

  it("rejects tampered payloads", async () => {
    vi.setSystemTime(new Date("2026-05-15T00:00:00Z"));
    const token = await createSessionToken("admin", "secret-a", 60);
    const [payload, signature] = token.split(".");
    const tampered = `${payload.slice(0, -1)}x.${signature}`;

    const result = await verifySessionToken(tampered, "secret-a");

    expect(result.ok).toBe(false);
  });

  it("rejects tokens signed with a different secret", async () => {
    const token = await createSessionToken("admin", "secret-a", 60);

    const result = await verifySessionToken(token, "secret-b");

    expect(result).toMatchObject({ ok: false, reason: "bad_signature" });
  });

  it("rejects malformed tokens", async () => {
    const result = await verifySessionToken("malformed", "secret-a");

    expect(result.ok).toBe(false);
  });
});
