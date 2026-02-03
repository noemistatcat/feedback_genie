// Theme color palette - 8 distinct colors for visual differentiation
export const THEME_COLORS = [
  { bg: 'bg-blue-100', text: 'text-blue-800', fill: 'fill-blue-500', color: 'text-blue-500' },
  { bg: 'bg-emerald-100', text: 'text-emerald-800', fill: 'fill-emerald-500', color: 'text-emerald-500' },
  { bg: 'bg-purple-100', text: 'text-purple-800', fill: 'fill-purple-500', color: 'text-purple-500' },
  { bg: 'bg-amber-100', text: 'text-amber-800', fill: 'fill-amber-500', color: 'text-amber-500' },
  { bg: 'bg-rose-100', text: 'text-rose-800', fill: 'fill-rose-500', color: 'text-rose-500' },
  { bg: 'bg-cyan-100', text: 'text-cyan-800', fill: 'fill-cyan-500', color: 'text-cyan-500' },
  { bg: 'bg-orange-100', text: 'text-orange-800', fill: 'fill-orange-500', color: 'text-orange-500' },
  { bg: 'bg-indigo-100', text: 'text-indigo-800', fill: 'fill-indigo-500', color: 'text-indigo-500' },
] as const;

export type ThemeColor = typeof THEME_COLORS[number];

/**
 * Get color by theme index (cycles through palette)
 */
export function getThemeColor(index: number): ThemeColor {
  return THEME_COLORS[index % THEME_COLORS.length];
}

/**
 * Get color by theme ID from a list of themes
 * Returns the color based on the theme's position in the array
 */
export function getThemeColorById(themes: { id: string }[], themeId: string): ThemeColor {
  const index = themes.findIndex(t => t.id === themeId);
  return getThemeColor(index >= 0 ? index : 0);
}
