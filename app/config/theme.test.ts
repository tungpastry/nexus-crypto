import { describe, expect, it } from "vitest";
import { DEFAULT_NEXUS_THEME, isNexusTheme, parseNexusTheme } from "./theme";

describe("Nexus theme config", () => {
  it("keeps Black Pink as the default", () => {
    expect(DEFAULT_NEXUS_THEME).toBe("black-pink");
  });

  it("accepts both supported themes", () => {
    expect(isNexusTheme("black-pink")).toBe(true);
    expect(isNexusTheme("wikipedia-glass")).toBe(true);
  });

  it("falls back safely for missing or malformed values", () => {
    expect(parseNexusTheme(undefined)).toBe(DEFAULT_NEXUS_THEME);
    expect(parseNexusTheme("light")).toBe(DEFAULT_NEXUS_THEME);
    expect(parseNexusTheme({ theme: "wikipedia-glass" })).toBe(DEFAULT_NEXUS_THEME);
  });
});
