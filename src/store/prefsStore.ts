import { create } from 'zustand';
import { STORAGE_KEYS } from '@/constants';
import { readJSON, writeJSON } from '@/utils/storage';

interface Preferences {
  displayName: string;
  role: string;
  density: 'comfortable' | 'compact';
  reduceMotion: boolean;
  showAiConfidence: boolean;
  defaultLevel: 'Beginner' | 'Intermediate' | 'Advanced';
}

const DEFAULTS: Preferences = {
  displayName: 'New Joiner',
  role: 'Software Engineer',
  density: 'comfortable',
  reduceMotion: false,
  showAiConfidence: true,
  defaultLevel: 'Beginner',
};

interface PrefsState extends Preferences {
  update: (patch: Partial<Preferences>) => void;
  resetPreferences: () => void;
}

const initial = { ...DEFAULTS, ...readJSON<Partial<Preferences>>(STORAGE_KEYS.preferences, {}) };

export const usePrefsStore = create<PrefsState>((set, get) => ({
  ...(initial as Preferences),
  update: (patch) => {
    const next = { ...get(), ...patch };
    const persistable: Preferences = {
      displayName: next.displayName,
      role: next.role,
      density: next.density,
      reduceMotion: next.reduceMotion,
      showAiConfidence: next.showAiConfidence,
      defaultLevel: next.defaultLevel,
    };
    writeJSON(STORAGE_KEYS.preferences, persistable);
    set(patch);
  },
  resetPreferences: () => {
    writeJSON(STORAGE_KEYS.preferences, DEFAULTS);
    set(DEFAULTS);
  },
}));
