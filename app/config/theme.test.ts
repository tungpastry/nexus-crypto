import { describe, expect, it } from "vitest";
import { DEFAULT_NEXUS_THEME, isNexusTheme, parseNexusTheme } from "./theme";

describe("Nexus theme config", () => {
  it("uses Crypto Universal as the default", () => {
    expect(DEFAULT_NEXUS_THEME).toBe("crypto-universal");
  });

  it("accepts both supported themes", () => {
    expect(isNexusTheme("crypto-universal")).toBe(true);
    expect(isNexusTheme("wikipedia-glass")).toBe(true);
    expect(parseNexusTheme("wikipedia-glass")).toBe("wikipedia-glass");
  });

  it("normalizes legacy Black Pink preferences", () => {
    expect(isNexusTheme("black-pink")).toBe(false);
    expect(parseNexusTheme("black-pink")).toBe("crypto-universal");
  });

  it("falls back safely for missing or malformed values", () => {
    expect(parseNexusTheme(undefined)).toBe(DEFAULT_NEXUS_THEME);
    expect(parseNexusTheme("light")).toBe(DEFAULT_NEXUS_THEME);
    expect(parseNexusTheme({ theme: "wikipedia-glass" })).toBe(DEFAULT_NEXUS_THEME);
    for (const value of [null, "", "toString", "constructor", "__proto__"]) {
      expect(isNexusTheme(value)).toBe(false);
      expect(parseNexusTheme(value)).toBe(DEFAULT_NEXUS_THEME);
    }
  });
});
