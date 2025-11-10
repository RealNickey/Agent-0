import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type OrbType = 'siri' | 'elevenlabs';

interface OrbSettingsState {
  selectedOrb: OrbType;
  setSelectedOrb: (orb: OrbType) => void;
}

export const useOrbSettings = create<OrbSettingsState>()(
  persist(
    (set) => ({
      selectedOrb: 'siri',
      setSelectedOrb: (orb: OrbType) => set({ selectedOrb: orb }),
    }),
    {
      name: 'orb-settings',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
