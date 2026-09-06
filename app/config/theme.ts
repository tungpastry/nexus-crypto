export const NEXUS_THEME_STORAGE_KEY = "nexus-ui-theme";

export const NEXUS_THEMES = {
  "black-pink": {
    label: "Black Pink",
    shortLabel: "Black Pink",
    colorScheme: "dark",
  },
  "wikipedia-glass": {
    label: "Wikipedia Glass",
    shortLabel: "Wiki Glass",
    colorScheme: "light",
  },
} as const;

export type NexusTheme = keyof typeof NEXUS_THEMES;

export const DEFAULT_NEXUS_THEME: NexusTheme = "black-pink";

export function isNexusTheme(value: unknown): value is NexusTheme {
  return typeof value === "string" && value in NEXUS_THEMES;
}

export function parseNexusTheme(value: unknown): NexusTheme {
  return isNexusTheme(value) ? value : DEFAULT_NEXUS_THEME;
}

// Retained for compatibility with earlier visual configuration imports.
export const NEXUS_THEME = {
  background: "#0b0713",
  surface: "#171121",
  surfaceSoft: "#21182e",
  card: "rgba(255, 255, 255, 0.075)",
  cardHover: "rgba(255, 255, 255, 0.115)",
  border: "rgba(255, 255, 255, 0.12)",
  pink: "#ff5fa2",
  pinkSoft: "#ff8fbd",
  pinkMuted: "#d96c9f",
  pinkGlow: "rgba(255, 95, 162, 0.28)",
  cyan: "#7dd3fc",
  mint: "#5eead4",
  red: "#fb7185",
  amber: "#fbbf24",
  text: "#f8f5ff",
  muted: "#c9bed6",
  soft: "#9689a6",
};
