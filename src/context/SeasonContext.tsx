import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type SeasonKey = 'reset' | 'recovery' | 'maintain' | 'boost' | 'special';

interface SeasonCtx {
  currentSeason: SeasonKey | null;
  setCurrentSeason: (s: SeasonKey) => void;
  seasonLoaded: boolean;
  nickname: string;
  setNickname: (n: string) => void;
}

const SeasonContext = createContext<SeasonCtx | null>(null);

export function SeasonProvider({ children }: { children: ReactNode }) {
  const [currentSeason, _setCurrentSeason] = useState<SeasonKey | null>(null);
  const [seasonLoaded, setSeasonLoaded] = useState(false);
  const [nickname, _setNickname] = useState('');
  const userIdRef = useRef<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setSeasonLoaded(true); return; }
      userIdRef.current = user.id;
      const { data } = await supabase
        .from('user_profiles')
        .select('current_season, name')
        .eq('id', user.id)
        .single();
      if (data?.current_season) {
        _setCurrentSeason(data.current_season as SeasonKey);
      }
      if (data?.name) {
        _setNickname(data.name);
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

  const setNickname = (name: string) => {
    _setNickname(name);
    // DB 저장은 Profile 페이지의 디바운스 자동저장에서 처리
  };

  return (
    <SeasonContext.Provider value={{ currentSeason, setCurrentSeason, seasonLoaded, nickname, setNickname }}>
      {children}
    </SeasonContext.Provider>
  );
}

export function useSeason() {
  const ctx = useContext(SeasonContext);
  if (!ctx) throw new Error('useSeason must be used inside SeasonProvider');
  return ctx;
}
