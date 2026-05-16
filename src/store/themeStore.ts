import { create } from 'zustand';
import { STORAGE_KEYS } from '@/constants';
import { readJSON, writeJSON } from '@/utils/storage';

type Mode = 'light' | 'dark';

interface ThemeState {
  mode: Mode;
  setMode: (m: Mode) => void;
  toggle: () => void;
}

function initialMode(): Mode {
  const stored = readJSON<Mode | null>(STORAGE_KEYS.theme, null);
  if (stored === 'light' || stored === 'dark') return stored;
  return typeof window !== 'undefined' &&
    window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

function applyMode(mode: Mode) {
  const root = document.documentElement;
  if (mode === 'dark') root.classList.add('dark');
  else root.classList.remove('dark');
  writeJSON(STORAGE_KEYS.theme, mode);
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  mode: initialMode(),
  setMode: (mode) => {
    applyMode(mode);
    set({ mode });
  },
  toggle: () => {
    const next: Mode = get().mode === 'dark' ? 'light' : 'dark';
    applyMode(next);
    set({ mode: next });
  },
}));

if (typeof window !== 'undefined') {
  applyMode(initialMode());
}
