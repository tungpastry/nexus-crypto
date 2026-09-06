"use client";

import { createContext, useCallback, useContext, useMemo, useSyncExternalStore } from "react";
import type { ReactNode } from "react";
import type { NexusTheme } from "../../config/theme";
import {
  getServerThemeSnapshot,
  getThemeSnapshot,
  setNexusTheme,
  subscribeToTheme,
} from "../../lib/themeStore";

type ThemeContextValue = {
  theme: NexusTheme;
  setTheme: (theme: NexusTheme) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export default function ThemeProvider({ children }: { children: ReactNode }) {
  const theme = useSyncExternalStore(
    subscribeToTheme,
    getThemeSnapshot,
    getServerThemeSnapshot
  );
  const setTheme = useCallback((nextTheme: NexusTheme) => setNexusTheme(nextTheme), []);
  const value = useMemo(() => ({ theme, setTheme }), [setTheme, theme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useNexusTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useNexusTheme must be used within ThemeProvider");
  }
  return context;
}
