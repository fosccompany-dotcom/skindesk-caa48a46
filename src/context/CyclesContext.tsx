import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { TreatmentCycle } from '@/types/skin';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

interface CyclesContextType {
  cycles: TreatmentCycle[];
  setCycles: (cycles: TreatmentCycle[]) => void;
  isLoading: boolean;
}

const CyclesContext = createContext<CyclesContextType | undefined>(undefined);

export function CyclesProvider({ children }: { children: ReactNode }) {
  const [cycles, setCycles] = useState<TreatmentCycle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      setCycles([]);
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    setIsLoading(true);

    const fetchCycles = async () => {
      try {
        const { data, error } = await supabase
          .from('treatment_cycles')
          .select('*')
          .eq('user_id', user.id);

        if (error) throw error;

        const mapped: TreatmentCycle[] = (data ?? []).map((row) => ({
          id: row.id,
          treatmentName: row.treatment_name,
          skinLayer: (row.skin_layer as TreatmentCycle['skinLayer']) ?? 'epidermis',
          bodyArea: (row.body_area as TreatmentCycle['bodyArea']) ?? 'face',
          cycleDays: row.cycle_days,
          lastTreatmentDate: row.last_treatment_date,
          isCustomCycle: row.is_custom_cycle ?? false,
          clinic: row.clinic,
          product: row.product ?? undefined,
          notes: row.notes ?? undefined,
        }));

        if (isMounted) setCycles(mapped);
      } catch (err) {
        console.error('Failed to fetch cycles:', err);
        if (isMounted) setCycles([]);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchCycles();

    return () => { isMounted = false; };
  }, [user]);

  return (
    <CyclesContext.Provider value={{ cycles, setCycles, isLoading }}>
      {children}
    </CyclesContext.Provider>
  );
}

export function useCycles() {
  const ctx = useContext(CyclesContext);
  if (!ctx) throw new Error('useCycles must be used within CyclesProvider');
  return ctx;
}
