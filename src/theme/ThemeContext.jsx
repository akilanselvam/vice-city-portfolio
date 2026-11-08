import { createContext, useContext, useLayoutEffect, useMemo, useState } from 'react';
import { DEFAULT_THEME, THEMES, THEME_ORDER } from './themes.js';
import { stops as baseStops } from '../data/portfolio.js';
import { ensureThemeFonts } from './fonts.js';

const STORAGE_KEY = 'portfolio-theme';
const ThemeContext = createContext(null);

export function initialTheme() {
  const fromUrl = new URLSearchParams(window.location.search).get('theme');
  if (fromUrl && THEMES[fromUrl]) return fromUrl;
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved && THEMES[saved]) return saved;
  } catch {
    // Storage can be blocked; fall back to the default
  }
  return DEFAULT_THEME;
}

export function ThemeProvider({ children }) {
  const [id, setId] = useState(initialTheme);

  useLayoutEffect(() => {
    ensureThemeFonts(id);
    document.documentElement.dataset.theme = id;
    try {
      window.localStorage.setItem(STORAGE_KEY, id);
    } catch {
      // Not fatal: the choice just won't persist
    }
  }, [id]);

  const value = useMemo(() => {
    const copy = THEMES[id];
    return {
      id,
      copy,
      // Stops with this theme's location names
      stops: baseStops.map((st) => ({ ...st, ...copy.areas[st.id] })),
      next: THEME_ORDER[(THEME_ORDER.indexOf(id) + 1) % THEME_ORDER.length],
      setTheme: setId,
    };
  }, [id]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const value = useContext(ThemeContext);
  if (!value) throw new Error('useTheme must be used inside ThemeProvider');
  return value;
}
