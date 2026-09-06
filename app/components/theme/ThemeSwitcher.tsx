"use client";

import { BookOpen, MoonStar } from "lucide-react";
import { NEXUS_THEMES, type NexusTheme } from "../../config/theme";
import { useNexusTheme } from "./ThemeProvider";

const OPTIONS: Array<{ theme: NexusTheme; icon: typeof MoonStar }> = [
  { theme: "black-pink", icon: MoonStar },
  { theme: "wikipedia-glass", icon: BookOpen },
];

export default function ThemeSwitcher() {
  const { theme, setTheme } = useNexusTheme();

  return (
    <div
      className="nexus-control-surface inline-flex w-fit items-center gap-1 rounded-xl border border-[var(--border-soft)] p-1 shadow-[var(--shadow-soft)]"
      role="group"
      aria-label="Dashboard theme"
    >
      {OPTIONS.map(({ theme: option, icon: Icon }) => {
        const selected = theme === option;
        return (
          <button
            key={option}
            type="button"
            onClick={() => setTheme(option)}
            aria-pressed={selected}
            title={`Use ${NEXUS_THEMES[option].label} theme`}
            className={`inline-flex min-h-9 items-center justify-center gap-2 rounded-lg px-2.5 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] sm:px-3 ${
              selected
                ? "nexus-theme-option-active text-[var(--theme-option-active-text)] shadow-[var(--shadow-accent)]"
                : "text-[var(--text-muted)] hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-main)]"
            }`}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">{NEXUS_THEMES[option].shortLabel}</span>
            <span className="sr-only sm:hidden">{NEXUS_THEMES[option].label}</span>
          </button>
        );
      })}
    </div>
  );
}
