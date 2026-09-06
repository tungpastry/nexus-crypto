import { afterEach, describe, expect, it } from "vitest";
import { NEXUS_THEME_STORAGE_KEY } from "../config/theme";
import { getThemeSnapshot, setNexusTheme, subscribeToTheme } from "./themeStore";

function installBrowserStubs() {
  const data = new Map<string, string>();
  const documentElement = { dataset: {} as Record<string, string>, style: {} as Record<string, string> };
  let storageListener: ((event: StorageEvent) => void) | undefined;

  globalThis.document = { documentElement } as unknown as Document;
  globalThis.window = {
    localStorage: {
      getItem: (key: string) => data.get(key) ?? null,
      setItem: (key: string, value: string) => data.set(key, value),
    },
    addEventListener: (type: string, listener: (event: StorageEvent) => void) => {
      if (type === "storage") storageListener = listener;
    },
    removeEventListener: (type: string, listener: (event: StorageEvent) => void) => {
      if (type === "storage" && storageListener === listener) storageListener = undefined;
    },
  } as unknown as Window & typeof globalThis;

  return {
    data,
    documentElement,
    dispatchStorage: (newValue: string | null) =>
      storageListener?.({ key: NEXUS_THEME_STORAGE_KEY, newValue } as StorageEvent),
  };
}

describe("theme store", () => {
  afterEach(() => {
    Reflect.deleteProperty(globalThis, "document");
    Reflect.deleteProperty(globalThis, "window");
  });

  it("applies and persists the selected theme", () => {
    const { data, documentElement } = installBrowserStubs();

    setNexusTheme("wikipedia-glass");

    expect(documentElement.dataset.theme).toBe("wikipedia-glass");
    expect(documentElement.style.colorScheme).toBe("light");
    expect(data.get(NEXUS_THEME_STORAGE_KEY)).toBe("wikipedia-glass");
    expect(getThemeSnapshot()).toBe("wikipedia-glass");
  });

  it("keeps working when browser storage rejects writes", () => {
    const { documentElement } = installBrowserStubs();
    Object.defineProperty(globalThis.window, "localStorage", {
      configurable: true,
      value: {
        setItem: () => {
          throw new Error("storage blocked");
        },
      } as unknown as Storage,
    });

    expect(() => setNexusTheme("black-pink")).not.toThrow();
    expect(documentElement.dataset.theme).toBe("black-pink");
  });

  it("synchronizes theme changes received from another tab", () => {
    const { dispatchStorage, documentElement } = installBrowserStubs();
    let notifications = 0;
    const unsubscribe = subscribeToTheme(() => {
      notifications += 1;
    });

    dispatchStorage("wikipedia-glass");

    expect(documentElement.dataset.theme).toBe("wikipedia-glass");
    expect(notifications).toBe(1);
    unsubscribe();
  });
});
