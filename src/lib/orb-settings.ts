import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type OrbType = 'siri' | 'elevenlabs' | 'elevenlabs-official';

export interface OrbColors {
  idle: {
    primary: string;
    secondary: string;
  };
  listening: {
    primary: string;
    secondary: string;
  };
  speaking: {
    primary: string;
    secondary: string;
  };
}

// Default color schemes
export const defaultOrbColors: OrbColors = {
  idle: {
    primary: '#6B7280',
    secondary: '#9CA3AF',
  },
  listening: {
    primary: '#3B82F6',
    secondary: '#06B6D4',
  },
  speaking: {
    primary: '#A855F7',
    secondary: '#EC4899',
  },
};

interface OrbSettingsState {
  selectedOrb: OrbType;
  setSelectedOrb: (orb: OrbType) => void;
  colors: OrbColors;
  setColors: (colors: OrbColors) => void;
  resetColors: () => void;
}

export const useOrbSettings = create<OrbSettingsState>()(
  persist(
    (set) => ({
      selectedOrb: 'siri',
      setSelectedOrb: (orb: OrbType) => set({ selectedOrb: orb }),
      colors: defaultOrbColors,
      setColors: (colors: OrbColors) => set({ colors }),
      resetColors: () => set({ colors: defaultOrbColors }),
    }),
    {
      name: 'orb-settings',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
