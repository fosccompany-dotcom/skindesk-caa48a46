import { createContext, useContext, useState, ReactNode } from 'react';
import { TreatmentCycle } from '@/types/skin';
import { mockCycles } from '@/data/mockData';

interface CyclesContextType {
  cycles: TreatmentCycle[];
  setCycles: (cycles: TreatmentCycle[]) => void;
}

const CyclesContext = createContext<CyclesContextType | undefined>(undefined);

export function CyclesProvider({ children }: { children: ReactNode }) {
  const [cycles, setCycles] = useState<TreatmentCycle[]>(mockCycles);
  return (
    <CyclesContext.Provider value={{ cycles, setCycles }}>
      {children}
    </CyclesContext.Provider>
  );
}

export function useCycles() {
  const ctx = useContext(CyclesContext);
  if (!ctx) throw new Error('useCycles must be used within CyclesProvider');
  return ctx;
}