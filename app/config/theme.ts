export const NEXUS_THEME_STORAGE_KEY = "nexus-ui-theme";

export const NEXUS_THEMES = {
  "crypto-universal": {
    label: "Crypto Universal 2026",
    shortLabel: "Universal",
    colorScheme: "dark",
  },
  "wikipedia-glass": {
    label: "Wikipedia Glass",
    shortLabel: "Wiki Glass",
    colorScheme: "light",
  },
} as const;

export type NexusTheme = keyof typeof NEXUS_THEMES;

export const DEFAULT_NEXUS_THEME: NexusTheme = "crypto-universal";

export const LEGACY_NEXUS_THEME = "black-pink";

export function isNexusTheme(value: unknown): value is NexusTheme {
  return typeof value === "string" && Object.prototype.hasOwnProperty.call(NEXUS_THEMES, value);
}

export function parseNexusTheme(value: unknown): NexusTheme {
  if (value === LEGACY_NEXUS_THEME) return "crypto-universal";
  return isNexusTheme(value) ? value : DEFAULT_NEXUS_THEME;
}

// Retained for compatibility with earlier visual configuration imports.
export const NEXUS_THEME = {
  background: "#080D18",
  surface: "#101827",
  surfaceSoft: "#172235",
  card: "#172235",
  cardHover: "#1D2C43",
  border: "rgba(148, 163, 184, 0.18)",
  pink: "#60A5FA",
  pinkSoft: "#60A5FA",
  pinkMuted: "#93C5FD",
  pinkGlow: "rgba(96, 165, 250, 0.16)",
  cyan: "#67E8F9",
  mint: "#34D399",
  red: "#fb7185",
  amber: "#fbbf24",
  text: "#F3F7FC",
  muted: "#BCC8D9",
  soft: "#8F9FB5",
};
