import {
  DEFAULT_NEXUS_THEME,
  LEGACY_NEXUS_THEME,
  NEXUS_THEMES,
  NEXUS_THEME_STORAGE_KEY,
  parseNexusTheme,
} from "../config/theme";

export function getThemeBootstrapScript() {
  // Compile the shared parser's supported values into a pre-hydration allowlist.
  const values = [...Object.keys(NEXUS_THEMES), LEGACY_NEXUS_THEME];
  const normalized = Object.fromEntries(values.map((value) => [value, parseNexusTheme(value)]));
  return `(()=>{const key=${JSON.stringify(NEXUS_THEME_STORAGE_KEY)};const themes=${JSON.stringify(NEXUS_THEMES)};const values=${JSON.stringify(normalized)};let saved=null;try{saved=localStorage.getItem(key)}catch{}const theme=typeof saved==="string"&&Object.prototype.hasOwnProperty.call(values,saved)?values[saved]:${JSON.stringify(DEFAULT_NEXUS_THEME)};document.documentElement.dataset.theme=theme;document.documentElement.style.colorScheme=themes[theme].colorScheme;if(saved===${JSON.stringify(LEGACY_NEXUS_THEME)}){try{localStorage.setItem(key,theme)}catch{}}})();`;
}
