import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemeId = 'dark' | 'light' | 'aurora';

export interface Theme {
  id: ThemeId;
  label: string;
  preview: string;
}

export const THEMES: Theme[] = [
  {
    id: 'dark',
    label: 'Midnight',
    preview: 'radial-gradient(ellipse at top left, #1e1b4b, #0f172a)',
  },
  {
    id: 'light',
    label: 'Daylight',
    preview: 'radial-gradient(ellipse at top, #e0e7ff, #f8fafc)',
  },
  {
    id: 'aurora',
    label: 'Aurora',
    preview: 'radial-gradient(ellipse at top left, #064e3b, #020617)',
  },
];

interface ThemeState {
  activeTheme: ThemeId;
  setTheme: (id: ThemeId) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      activeTheme: 'dark',
      setTheme: (id) => {
        document.documentElement.setAttribute('data-theme', id === 'dark' ? '' : id);
        set({ activeTheme: id });
      },
    }),
    { name: 'ghalibos-theme' }
  )
);
