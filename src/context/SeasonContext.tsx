import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type SeasonKey = 'reset' | 'recovery' | 'maintain' | 'boost' | 'special';

interface SeasonCtx {
  currentSeason: SeasonKey | null;
  setCurrentSeason: (s: SeasonKey) => void;
  seasonLoaded: boolean;
}

const SeasonContext = createContext<SeasonCtx | null>(null);

export function SeasonProvider({ children }: { children: ReactNode }) {
  const [currentSeason, _setCurrentSeason] = useState<SeasonKey | null>(null);
  const [seasonLoaded, setSeasonLoaded] = useState(false);
  const userIdRef = useRef<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setSeasonLoaded(true); return; }
      userIdRef.current = user.id;
      const { data } = await supabase
        .from('user_profiles')
        .select('current_season')
        .eq('id', user.id)
        .single();
      if (data?.current_season) {
        _setCurrentSeason(data.current_season as SeasonKey);
      }
      setSeasonLoaded(true);
    };
    load();
  }, []);

  const setCurrentSeason = async (season: SeasonKey) => {
    _setCurrentSeason(season);
    const userId = userIdRef.current;
    if (userId) {
      const { error } = await supabase
        .from('user_profiles')
        .update({ current_season: season, updated_at: new Date().toISOString() })
        .eq('id', userId);
      if (error) console.error('관리모드 저장 실패:', error);
    }
  };

  return (
    <SeasonContext.Provider value={{ currentSeason, setCurrentSeason, seasonLoaded }}>
      {children}
    </SeasonContext.Provider>
  );
}

export function useSeason() {
  const ctx = useContext(SeasonContext);
  if (!ctx) throw new Error('useSeason must be used inside SeasonProvider');
  return ctx;
}
