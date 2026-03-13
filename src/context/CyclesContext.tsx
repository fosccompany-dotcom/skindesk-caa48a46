import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { TreatmentCycle } from '@/types/skin';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

interface CyclesContextType {
  cycles: TreatmentCycle[];
  setCycles: (cycles: TreatmentCycle[]) => void;
  isLoading: boolean;
  refreshCycles: () => Promise<void>;
}

const CyclesContext = createContext<CyclesContextType | undefined>(undefined);

export function CyclesProvider({ children }: { children: ReactNode }) {
  const [cycles, setCycles] = useState<TreatmentCycle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  const fetchCycles = useCallback(async () => {
    if (!user) { setCycles([]); setIsLoading(false); return; }
    try {
      const { data, error } = await supabase
        .from('treatment_cycles').select('*').eq('user_id', user.id);
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
      setCycles(mapped);
    } catch (err) {
      console.error('Failed to fetch cycles:', err);
      setCycles([]);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user) { setCycles([]); setIsLoading(false); return; }
    setIsLoading(true);
    fetchCycles();
    const channel = supabase
      .channel(`cycles_${user.id}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'treatment_cycles',
        filter: `user_id=eq.${user.id}`,
      }, () => { fetchCycles(); })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, fetchCycles]);

  return (
    <CyclesContext.Provider value={{ cycles, setCycles, isLoading, refreshCycles: fetchCycles }}>
      {children}
    </CyclesContext.Provider>
  );
}

export function useCycles() {
  const ctx = useContext(CyclesContext);
  if (!ctx) throw new Error('useCycles must be used within CyclesProvider');
  return ctx;
}