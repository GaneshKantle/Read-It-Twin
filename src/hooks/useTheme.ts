import { useContext } from 'react';
import { ThemeContext } from '@/app/providers/ThemeProvider';

export const themes = {
  light: 'light',
  dark: 'dark',
} as const;

export type Theme = (typeof themes)[keyof typeof themes];

export const STORAGE_THEME_KEY = 'readit-theme';

export function getPreferredTheme(): Theme {
  if (typeof window === 'undefined') {
    return themes.light;
  }

  const storedTheme = window.localStorage.getItem(STORAGE_THEME_KEY);
  if (storedTheme === themes.light || storedTheme === themes.dark) {
    return storedTheme;
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? themes.dark : themes.light;
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }

  return context;
}
