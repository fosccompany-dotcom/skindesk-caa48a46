import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { SKIN_TRIBE_LABELS, type SkinTribe } from '@/lib/skinTribeClassifier';
import { Plus, ChevronLeft, Check, AlertTriangle, CalendarDays } from 'lucide-react';
import AddTreatmentModal from '@/components/AddTreatmentModal';
import ParseTreatmentModal from '@/components/ParseTreatmentModal';

/* ── Treatment compatibility data ── */
const MATCH_DATA: Record<SkinTribe, { good: string; caution: string; cycle: string }> = {
  desert_sensitive: {
    good: '수분주사 · 진정레이저 · RF 계열',
    caution: '고강도 박피 · 강한 레이저',
    cycle: '진정 관리 월 1회 · 리프팅 6개월',
  },
  dry_calm: {
    good: '스킨부스터 · 물광주사 · RF',
    caution: '피지 타겟 레이저',
    cycle: '수분 시술 월 1~2회',
  },
  combo_sensitive: {
    good: '부위별 분리 시술 · 진정 관리',
    caution: '전체 동일 강도 레이저',
    cycle: '부위별 2~3개월',
  },
  combo_balanced: {
    good: '리프팅 · 보톡스 · 전반 유지관리',
    caution: '특별히 없음',
    cycle: '리프팅 6개월 · 보톡스 4개월',
  },
  oily_sensitive: {
    good: '진정+피지 복합 · 저강도 레이저',
    caution: '고강도 레이저 · 강한 박피',
    cycle: '피지 관리 2~3개월',
  },
  oily_strong: {
    good: '모공 레이저 · 피지 억제 시술',
    caution: '수분 위주 시술',
    cycle: '모공 관리 3개월',
  },
};

function getAgeBracket(birthDate: string): '20s' | '30s' | '40+' | null {
  const birth = new Date(birthDate);
  const age = new Date().getFullYear() - birth.getFullYear();
  if (age < 30) return '20s';
  if (age < 40) return '30s';
  return '40+';
}

const AGE_MESSAGES: Record<string, string> = {
  '20s': '지금은 피지·모공 관리 집중 시기예요',
  '30s': '리프팅 시작 적기예요',
  '40+': '수분+리프팅 복합 관리가 필요한 시기예요',
};

export default function SkinMatch() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tribe, setTribe] = useState<SkinTribe | null>(null);
  const [ageGroup, setAgeGroup] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [parseModalOpen, setParseModalOpen] = useState(false);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    supabase
      .from('user_profiles')
      .select('skin_tribe, age_group')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        setTribe((data?.skin_tribe as SkinTribe) ?? null);
        setBirthDate(data?.birth_date ?? null);
        setLoading(false);
      });
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin" />
      </div>
    );
  }

  // No tribe → prompt quiz
  if (!tribe) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 text-center">
        <p className="text-lg font-bold text-foreground mb-2">퀴즈를 먼저 해주세요</p>
        <p className="text-sm text-muted-foreground mb-6">피부족을 알아야 시술 궁합을 알 수 있어요</p>
        <Button
          className="rounded-xl h-12 px-8 font-bold bg-accent text-accent-foreground"
          onClick={() => navigate('/quiz')}
        >
          퀴즈 시작하기
        </Button>
      </div>
    );
  }

  const info = SKIN_TRIBE_LABELS[tribe];
  const match = MATCH_DATA[tribe];
  const ageBracket = birthDate ? getAgeBracket(birthDate) : null;

  return (
    <div className="min-h-screen bg-background pb-28">
      {/* Header */}
      <div className="flex items-center px-4 pt-[calc(var(--safe-top)+12px)] pb-3">
        <button onClick={() => navigate(-1)} className="p-1 text-muted-foreground hover:text-foreground">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="flex-1 text-center text-sm font-bold text-foreground pr-6">내 시술 궁합</h1>
      </div>

      <div className="px-5 space-y-4">
        {/* Tribe badge */}
        <div className="flex items-center gap-3 bg-card border border-border rounded-2xl px-5 py-4">
          <span className="text-3xl">{info.emoji}</span>
          <div>
            <p className="text-xs text-muted-foreground">나의 피부족</p>
            <p className="text-base font-bold text-foreground">{info.name}</p>
          </div>
        </div>

        {/* Age advice */}
        {ageBracket && (
          <div className="bg-accent/10 border border-accent/20 rounded-xl px-4 py-3">
            <p className="text-sm font-medium text-foreground">
              💡 {AGE_MESSAGES[ageBracket]}
            </p>
          </div>
        )}

        {/* Good match */}
        <Card className="border-border rounded-2xl overflow-hidden">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-accent/20 flex items-center justify-center">
                <Check className="h-4 w-4 text-accent-foreground" />
              </div>
              <h2 className="text-sm font-bold text-foreground">잘 맞는 시술</h2>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed pl-9">{match.good}</p>
          </CardContent>
        </Card>

        {/* Caution */}
        <Card className="border-border rounded-2xl overflow-hidden">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-destructive/15 flex items-center justify-center">
                <AlertTriangle className="h-4 w-4 text-destructive" />
              </div>
              <h2 className="text-sm font-bold text-foreground">신중하게</h2>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed pl-9">{match.caution}</p>
          </CardContent>
        </Card>

        {/* Recommended cycle */}
        <Card className="border-border rounded-2xl overflow-hidden">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-info/15 flex items-center justify-center">
                <CalendarDays className="h-4 w-4 text-info" />
              </div>
              <h2 className="text-sm font-bold text-foreground">추천 주기</h2>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed pl-9">{match.cycle}</p>
          </CardContent>
        </Card>
      </div>

      {/* Bottom CTA */}
      <div className="fixed bottom-20 left-0 right-0 px-5 pb-[var(--safe-bottom)]">
        <Button
          className="w-full rounded-xl h-12 font-bold bg-accent text-accent-foreground hover:bg-accent/90 shadow-lg"
          onClick={() => setAddModalOpen(true)}
        >
          <Plus className="w-5 h-5 mr-2" />
          시술 기록 시작하기
        </Button>
      </div>

      {parseModalOpen && (
        <ParseTreatmentModal onClose={() => { setParseModalOpen(false); setAddModalOpen(false); }} />
      )}

      {addModalOpen && (
        <AddTreatmentModal
          open={addModalOpen}
          onClose={() => setAddModalOpen(false)}
          onSave={() => setAddModalOpen(false)}
          onOpenParse={() => { setParseModalOpen(true); setAddModalOpen(false); }}
        />
      )}
    </div>
  );
}
