/**
 * Цвета для meta theme-color и PWA (manifest).
 * В meta-тегах нельзя использовать CSS-переменные — только литеральные значения.
 * Должны соответствовать --background в app/globals.css (light/dark).
 */
export const PWA_THEME_COLORS = {
  dark: "#1a1a2e",
  light: "#ffffff",
} as const;
