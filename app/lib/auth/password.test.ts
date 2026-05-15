import { describe, expect, it } from "vitest";
import { hashPassword, isValidPasswordHashFormat, verifyPassword } from "./password";

describe("password hashing", () => {
  it("creates a valid scrypt hash", async () => {
    const hash = await hashPassword("test-password");

    expect(hash).toMatch(/^scrypt:[a-f0-9]+:[a-f0-9]+$/);
    expect(isValidPasswordHashFormat(hash)).toBe(true);
  });

  it("verifies the correct password", async () => {
    const hash = await hashPassword("test-password");

    await expect(verifyPassword("test-password", hash)).resolves.toBe(true);
  });

  it("rejects the wrong password", async () => {
    const hash = await hashPassword("test-password");

    await expect(verifyPassword("wrong-password", hash)).resolves.toBe(false);
  });

  it("rejects malformed hashes without throwing", async () => {
    await expect(verifyPassword("test-password", "not-a-hash")).resolves.toBe(false);
    expect(isValidPasswordHashFormat("not-a-hash")).toBe(false);
  });
});
