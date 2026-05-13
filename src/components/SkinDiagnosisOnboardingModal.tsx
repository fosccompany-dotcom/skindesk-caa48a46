import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ChevronLeft, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useAllClinicBrands, useFavoriteClinics } from '@/hooks/useFavoriteClinics';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface Props {
  open: boolean;
  onSkip: () => void;
  onDontShowAgain: () => void;
}

const CONCERNS = [
  '모공/피지', '색소/톤', '탄력/리프팅', '주름',
  '트러블/여드름', '홍조/혈관', '보습/장벽', '흉터/자국',
  '다크서클', '제모', '바디컨투어링', '튼살',
];

const REGIONS = [
  '서울 강남/서초', '서울 송파/강동', '서울 마포/용산', '서울 성동/광진',
  '서울 강북권', '서울 강서권', '경기 분당/판교', '경기 일산',
  '경기 수원/용인', '인천', '부산', '대구', '대전', '광주', '제주', '기타',
];

const TOTAL_STEPS = 5;

const SkinDiagnosisOnboardingModal = ({ open, onSkip, onDontShowAgain }: Props) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { brands } = useAllClinicBrands();
  const { favoriteBrandIds, addFavorite, removeFavorite } = useFavoriteClinics();

  const [step, setStep] = useState(0); // 0 = intro, 1..5 = form
  const [nickname, setNickname] = useState('');
  const [birthYear, setBirthYear] = useState('');
  const [concerns, setConcerns] = useState<string[]>([]);
  const [regions, setRegions] = useState<string[]>([]);
  const [selectedClinicIds, setSelectedClinicIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  // prefill from existing profile
  useEffect(() => {
    if (!open || !user) return;
    supabase
      .from('user_profiles')
      .select('name, birth_date, concerns, regions')
      .eq('id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!data) return;
        if (data.name) setNickname(data.name);
        if (data.birth_date) setBirthYear(data.birth_date.slice(0, 4));
        if (data.concerns) setConcerns(data.concerns as string[]);
        if (data.regions) setRegions(data.regions as string[]);
      });
  }, [open, user]);

  useEffect(() => {
    setSelectedClinicIds(favoriteBrandIds);
  }, [favoriteBrandIds.join(',')]);

  if (!open) return null;

  const currentYear = new Date().getFullYear();
  const yearValid = /^\d{4}$/.test(birthYear) && Number(birthYear) >= 1920 && Number(birthYear) <= currentYear;

  const toggle = (arr: string[], v: string, setter: (a: string[]) => void) => {
    setter(arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v]);
  };

  const canNext = () => {
    if (step === 1) return nickname.trim().length > 0;
    if (step === 2) return yearValid;
    return true; // 3,4,5 optional
  };

  const saveAndProceed = async () => {
    if (!user) {
      navigate('/skin-quiz');
      return;
    }
    setSaving(true);
    try {
      const birthDate = `${birthYear}-01-01`;
      await supabase.from('user_profiles').upsert({
        id: user.id,
        name: nickname.trim() || null,
        birth_date: birthDate,
        concerns: concerns,
        regions: regions,
      });

      // sync favorite clinics
      const toAdd = selectedClinicIds.filter(id => !favoriteBrandIds.includes(id));
      const toRemove = favoriteBrandIds.filter(id => !selectedClinicIds.includes(id));
      await Promise.all([
        ...toAdd.map(id => addFavorite(id)),
        ...toRemove.map(id => removeFavorite(id)),
      ]);

      window.dispatchEvent(new CustomEvent('skindesk:data-changed'));
      onSkip(); // close modal
      navigate('/skin-quiz');
    } catch (e) {
      console.error(e);
      toast({ title: '저장에 실패했어요', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const next = () => {
    if (step < TOTAL_STEPS) setStep(step + 1);
    else saveAndProceed();
  };
  const back = () => setStep(Math.max(0, step - 1));

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4 bg-foreground/60">
      <div
        className="relative bg-card rounded-2xl shadow-2xl border border-border/50 w-full max-w-sm overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        {step > 0 && (
          <div className="flex items-center justify-between px-4 pt-4">
            <button onClick={back} className="p-1 -ml-1 text-muted-foreground hover:text-foreground">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-xs text-muted-foreground">{step} / {TOTAL_STEPS}</span>
            <button onClick={onSkip} className="p-1 -mr-1 text-muted-foreground hover:text-foreground">
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Step 0: Intro */}
        {step === 0 && (
          <div className="px-6 pt-7 pb-4 text-center space-y-3">
            <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-accent to-primary flex items-center justify-center shadow-lg">
              <Sparkles className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-lg font-bold text-foreground">나의 피부, 먼저 알아볼까요?</h3>
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
              {`기본 정보를 등록하고\n나만의 5축 진단을 시작해보세요.`}
            </p>
          </div>
        )}

        {/* Step 1: Nickname */}
        {step === 1 && (
          <div className="px-6 pt-4 pb-2 overflow-y-auto">
            <h3 className="text-base font-bold mb-1">닉네임을 알려주세요</h3>
            <p className="text-xs text-muted-foreground mb-4">앱 안에서 사용할 이름이에요.</p>
            <Input
              autoFocus
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="예) 보송이"
              maxLength={20}
            />
          </div>
        )}

        {/* Step 2: Birth Year */}
        {step === 2 && (
          <div className="px-6 pt-4 pb-2 overflow-y-auto">
            <h3 className="text-base font-bold mb-1">출생 연도 <span className="text-destructive">*</span></h3>
            <p className="text-xs text-muted-foreground mb-4">연령대에 맞는 추천을 위해 필요해요.</p>
            <Input
              type="number"
              inputMode="numeric"
              value={birthYear}
              onChange={(e) => setBirthYear(e.target.value.slice(0, 4))}
              placeholder="예) 1995"
            />
            {birthYear && !yearValid && (
              <p className="text-xs text-destructive mt-2">올바른 연도를 입력해주세요</p>
            )}
          </div>
        )}

        {/* Step 3: Concerns */}
        {step === 3 && (
          <div className="px-6 pt-4 pb-2 overflow-y-auto">
            <h3 className="text-base font-bold mb-1">주요 관심사</h3>
            <p className="text-xs text-muted-foreground mb-4">관심 있는 항목을 모두 선택해주세요.</p>
            <div className="flex flex-wrap gap-2">
              {CONCERNS.map(c => (
                <button
                  key={c}
                  onClick={() => toggle(concerns, c, setConcerns)}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-xs border transition-all',
                    concerns.includes(c)
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-muted text-foreground border-border'
                  )}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 4: Regions */}
        {step === 4 && (
          <div className="px-6 pt-4 pb-2 overflow-y-auto">
            <h3 className="text-base font-bold mb-1">주요 활동 지역</h3>
            <p className="text-xs text-muted-foreground mb-4">자주 방문할 지역을 선택해주세요.</p>
            <div className="flex flex-wrap gap-2">
              {REGIONS.map(r => (
                <button
                  key={r}
                  onClick={() => toggle(regions, r, setRegions)}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-xs border transition-all',
                    regions.includes(r)
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-muted text-foreground border-border'
                  )}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 5: Favorite Clinics */}
        {step === 5 && (
          <div className="px-6 pt-4 pb-2 overflow-y-auto flex-1 min-h-0">
            <h3 className="text-base font-bold mb-1">즐겨찾기 클리닉</h3>
            <p className="text-xs text-muted-foreground mb-4">관심 있는 클리닉을 선택해주세요. (선택)</p>
            <div className="space-y-1.5">
              {brands.length === 0 && (
                <p className="text-xs text-muted-foreground">등록된 클리닉이 없어요.</p>
              )}
              {brands.map(b => {
                const selected = selectedClinicIds.includes(b.id);
                return (
                  <button
                    key={b.id}
                    onClick={() => toggle(selectedClinicIds, b.id, setSelectedClinicIds)}
                    className={cn(
                      'w-full flex items-center justify-between px-3 py-2.5 rounded-xl border text-sm transition-all',
                      selected
                        ? 'bg-primary/10 border-primary text-foreground'
                        : 'bg-muted border-border text-foreground'
                    )}
                  >
                    <span>{b.name}</span>
                    {selected && <Check className="w-4 h-4 text-primary" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer actions */}
        <div className="px-5 py-4 border-t border-border/50 space-y-2 bg-card">
          {step === 0 ? (
            <>
              <Button
                className="w-full rounded-xl h-11 text-sm font-bold bg-[#F2C94C] hover:bg-[#e0b83e] text-foreground"
                onClick={() => setStep(1)}
              >
                시작하기 →
              </Button>
              <div className="flex gap-2">
                <Button variant="ghost" className="flex-1 rounded-xl h-10 text-sm text-muted-foreground" onClick={onSkip}>
                  Skip
                </Button>
                <Button variant="ghost" className="flex-1 rounded-xl h-10 text-sm text-muted-foreground" onClick={onDontShowAgain}>
                  다시 보지 않기
                </Button>
              </div>
            </>
          ) : (
            <Button
              className="w-full rounded-xl h-11 text-sm font-bold bg-[#F2C94C] hover:bg-[#e0b83e] text-foreground disabled:opacity-50"
              onClick={next}
              disabled={!canNext() || saving}
            >
              {step === TOTAL_STEPS ? (saving ? '저장 중...' : '진단 시작하기 →') : '다음'}
            </Button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default SkinDiagnosisOnboardingModal;
