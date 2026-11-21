import { useState, useEffect, useCallback } from 'react';

export type ThemeMode = 'dark' | 'light';

const STORAGE_KEY = 'viking_theme';
const THEME_EVENT = 'viking-theme-change';

const applyThemeToDom = (mode: ThemeMode) => {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (mode === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }

  const themeMeta = document.querySelector('meta[name="theme-color"]');
  if (themeMeta) {
    themeMeta.setAttribute('content', mode === 'dark' ? '#0A0A0C' : '#F4F1EA');
  }
};

export function useTheme() {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    if (typeof window === 'undefined') return 'dark';
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'light' || saved === 'dark') return saved;
    } catch {
      // Ignore storage errors
    }
    return 'dark';
  });

  useEffect(() => {
    applyThemeToDom(theme);
  }, [theme]);

  useEffect(() => {
    const handleSync = (e: Event) => {
      const next = (e as CustomEvent<ThemeMode>).detail;
      if (next === 'dark' || next === 'light') {
        setThemeState(next);
      }
    };
    window.addEventListener(THEME_EVENT, handleSync);
    return () => window.removeEventListener(THEME_EVENT, handleSync);
  }, []);

  const setTheme = useCallback((next: ThemeMode) => {
    setThemeState(next);
    applyThemeToDom(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Ignore storage errors
    }
    window.dispatchEvent(new CustomEvent(THEME_EVENT, { detail: next }));
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  }, [theme, setTheme]);

  return { theme, setTheme, toggleTheme };
}
