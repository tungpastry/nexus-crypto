import { runInNewContext } from "node:vm";
import { describe, expect, it } from "vitest";
import { NEXUS_THEMES, NEXUS_THEME_STORAGE_KEY, parseNexusTheme } from "../config/theme";
import { getThemeBootstrapScript } from "./themeBootstrap";

function bootstrap(saved: string | null, blocked?: "read" | "write" | "access") {
  const documentElement = { dataset: {} as Record<string, string>, style: {} as Record<string, string> };
  const writes: Array<[string, string]> = [];
  const sandbox = {
    document: { documentElement },
    get localStorage() {
      if (blocked === "access") throw new Error("storage blocked");
      return {
        getItem: () => {
          if (blocked === "read") throw new Error("read blocked");
          return saved;
        },
        setItem: (key: string, value: string) => {
          if (blocked === "write") throw new Error("write blocked");
          writes.push([key, value]);
        },
      };
    },
  };
  runInNewContext(getThemeBootstrapScript(), sandbox);
  return { documentElement, writes };
}

describe("pre-hydration theme bootstrap", () => {
  it.each([null, "", "black-pink", "crypto-universal", "wikipedia-glass", "toString", "constructor", "__proto__", "invalid"])(
    "shares parser normalization for %s before hydration", (saved) => {
      const { documentElement, writes } = bootstrap(saved);
      const theme = parseNexusTheme(saved);
      expect(documentElement.dataset.theme).toBe(theme);
      expect(documentElement.style.colorScheme).toBe(NEXUS_THEMES[theme].colorScheme);
      expect(writes).toEqual(saved === "black-pink" ? [[NEXUS_THEME_STORAGE_KEY, "crypto-universal"]] : []);
    }
  );

  it.each(["read", "write", "access"] as const)("survives blocked storage %s", (blocked) => {
    const { documentElement } = bootstrap("black-pink", blocked);
    expect(documentElement.dataset.theme).toBe("crypto-universal");
    expect(documentElement.style.colorScheme).toBe("dark");
  });
});
