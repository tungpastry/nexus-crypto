import {
  DEFAULT_NEXUS_THEME,
  NEXUS_THEMES,
  NEXUS_THEME_STORAGE_KEY,
  parseNexusTheme,
  type NexusTheme,
} from "../config/theme";

const listeners = new Set<() => void>();
let fallbackTheme: NexusTheme = DEFAULT_NEXUS_THEME;

function emitThemeChange() {
  listeners.forEach((listener) => listener());
}

function applyTheme(theme: NexusTheme) {
  fallbackTheme = theme;
  if (typeof document === "undefined") return;

  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = NEXUS_THEMES[theme].colorScheme;
}

function handleStorage(event: StorageEvent) {
  if (event.key !== NEXUS_THEME_STORAGE_KEY) return;
  applyTheme(parseNexusTheme(event.newValue));
  emitThemeChange();
}

export function getThemeSnapshot(): NexusTheme {
  if (typeof document === "undefined") return fallbackTheme;
  return parseNexusTheme(document.documentElement.dataset.theme);
}

export function getServerThemeSnapshot(): NexusTheme {
  return DEFAULT_NEXUS_THEME;
}

export function subscribeToTheme(listener: () => void) {
  listeners.add(listener);
  if (typeof window !== "undefined" && listeners.size === 1) {
    window.addEventListener("storage", handleStorage);
  }

  return () => {
    listeners.delete(listener);
    if (typeof window !== "undefined" && listeners.size === 0) {
      window.removeEventListener("storage", handleStorage);
    }
  };
}

export function setNexusTheme(theme: NexusTheme) {
  applyTheme(theme);

  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(NEXUS_THEME_STORAGE_KEY, theme);
    } catch {
      // The visual theme still applies when browser storage is unavailable.
    }
  }

  emitThemeChange();
}
