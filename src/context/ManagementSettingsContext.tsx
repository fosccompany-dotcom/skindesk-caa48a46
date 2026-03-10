// src/context/ManagementSettingsContext.tsx
import { createContext, useContext, useState, ReactNode } from 'react';
import { ManagementLevel, BodyZone } from '@/data/treatmentCycles';

export type BodyZoneSettings = Record<BodyZone, ManagementLevel>;

const DEFAULT_SETTINGS: BodyZoneSettings = {
  face:      'maintain',
  neck:      'maintain',
  arms_legs: 'none',
  body:      'none',
};

interface ManagementSettingsCtx {
  settings: BodyZoneSettings;
  setZone: (zone: BodyZone, level: ManagementLevel) => void;
  getLevelForZone: (zone: BodyZone) => ManagementLevel;
}

const ManagementSettingsContext = createContext<ManagementSettingsCtx | null>(null);

// localStorage 기반 영속화
function loadSettings(): BodyZoneSettings {
  try {
    const raw = localStorage.getItem('sd_mgmt_settings');
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {}
  return DEFAULT_SETTINGS;
}

export function ManagementSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<BodyZoneSettings>(loadSettings);

  const setZone = (zone: BodyZone, level: ManagementLevel) => {
    setSettings(prev => {
      const next = { ...prev, [zone]: level };
      try { localStorage.setItem('sd_mgmt_settings', JSON.stringify(next)); } catch {}
      return next;
    });
  };

  const getLevelForZone = (zone: BodyZone) => settings[zone];

  return (
    <ManagementSettingsContext.Provider value={{ settings, setZone, getLevelForZone }}>
      {children}
    </ManagementSettingsContext.Provider>
  );
}

export function useManagementSettings() {
  const ctx = useContext(ManagementSettingsContext);
  if (!ctx) throw new Error('useManagementSettings must be used inside ManagementSettingsProvider');
  return ctx;
}
