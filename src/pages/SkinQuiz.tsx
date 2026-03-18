import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  classifySkinTribe,
  mapQ5ToGoal,
  mapQ6ToBirthDate,
  SKIN_TRIBE_LABELS,
  type QuizAnswers,
  type SkinTribe,
} from '@/lib/skinTribeClassifier';

/* ── Question definitions ── */
const QUESTIONS = [
  {
    id: 'q1' as const,
    question: '세안 후 아무것도 안 바르면?',
    options: [
      { key: 'A' as const, label: '금방 당기고 뻣뻣해' },
      { key: 'B' as const, label: '괜찮다가 T존만 슬슬 번들거려' },
      { key: 'C' as const, label: '꽤 빠르게 기름기 올라와' },
    ],
  },
  {
    id: 'q2' as const,
    question: '새 제품 처음 쓸 때?',
    options: [
      { key: 'A' as const, label: '자주 빨개지거나 트러블 올라와' },
      { key: 'B' as const, label: '대체로 별 반응 없어' },
    ],
  },
  {
    id: 'q3' as const,
    question: '오후 2시, 내 피부 상태는?',
    options: [
      { key: 'A' as const, label: '아직도 당기거나 그냥 평범해' },
      { key: 'B' as const, label: 'T존은 번들, 볼은 여전히 당겨' },
      { key: 'C' as const, label: '얼굴 전체가 번들거려' },
    ],
  },
  {
    id: 'q4' as const,
    question: '시술 후 회복 속도는?',
    options: [
      { key: 'A' as const, label: '남들보다 오래 빨개지고 민감해져' },
      { key: 'B' as const, label: '보통이거나 빠른 편이야' },
    ],
  },
  {
    id: 'q5' as const,
    question: '피부과 가는 주된 이유는?',
    options: [
      { key: 'A' as const, label: '탄력·리프팅·노화 관리' },
      { key: 'B' as const, label: '기미·잡티·피부톤' },
      { key: 'C' as const, label: '여드름·모공·피지' },
      { key: 'D' as const, label: '전반적인 유지관리' },
    ],
  },
  {
    id: 'q6' as const,
    question: '태어난 연도는?',
    options: [
      { key: '2000', label: '2000년대' },
      { key: '1995', label: '1995년대' },
      { key: '1990', label: '1990년대' },
      { key: '1985', label: '1985년대' },
      { key: '1980', label: '1980년대' },
      { key: '1970', label: '1970년대 이전' },
    ],
  },
] as const;

const TOTAL_STEPS = QUESTIONS.length;

/* ── Component ── */
export default function SkinQuiz() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswers>({
    q1: null, q2: null, q3: null, q4: null, q5: null, q6: null,
  });
  const [hasBirthDate, setHasBirthDate] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const [result, setResult] = useState<SkinTribe | null>(null);
  const [saving, setSaving] = useState(false);

  // Check if user already has birth_date → skip Q6
  useEffect(() => {
    if (!user) return;
    supabase
      .from('user_profiles')
      .select('birth_date')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        if (data?.birth_date) setHasBirthDate(true);
      });
  }, [user]);

  const effectiveQuestions = hasBirthDate
    ? QUESTIONS.filter((q) => q.id !== 'q6')
    : QUESTIONS;

  const currentQ = effectiveQuestions[step];
  const isFirst = step === 0;
  const isLast = step === effectiveQuestions.length - 1;

  const saveResults = useCallback(
    async (tribe: SkinTribe, ans: QuizAnswers) => {
      if (!user) return;
      setSaving(true);
      const updates: Record<string, unknown> = {
        skin_tribe: tribe,
        skin_goal: mapQ5ToGoal(ans.q5),
        quiz_completed_at: new Date().toISOString(),
      };
      if (!hasBirthDate && ans.q6) {
        updates.birth_date = mapQ6ToBirthDate(ans.q6);
      }
      const { error } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('id', user.id);

      if (error) {
        console.error('Quiz save error:', error);
        toast.error('저장에 실패했지만 결과는 확인할 수 있어요');
      }
      setSaving(false);
    },
    [user, hasBirthDate],
  );

  const handleSelect = (key: string) => {
    if (transitioning) return;
    const qId = currentQ.id as keyof QuizAnswers;
    const updated = { ...answers, [qId]: key };
    setAnswers(updated);

    // Auto-advance after 0.3s
    setTransitioning(true);
    setTimeout(() => {
      if (isLast) {
        const tribe = classifySkinTribe(updated);
        setResult(tribe);
        saveResults(tribe, updated);
        navigate('/quiz-result', { replace: true });
      } else {
        setStep((s) => s + 1);
      }
      setTransitioning(false);
    }, 300);
  };

  const handleBack = () => {
    if (step > 0) setStep((s) => s - 1);
  };

  const handleSkip = async () => {
    if (!user) { navigate('/'); return; }
    await supabase
      .from('user_profiles')
      .update({
        skin_tribe: 'combo_balanced',
        quiz_completed_at: new Date().toISOString(),
      })
      .eq('id', user.id);
    navigate('/', { replace: true });
  };

  // ── Result Screen ──
  if (result) {
    const info = SKIN_TRIBE_LABELS[result];
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 text-center">
        <div className="text-6xl mb-4 animate-bounce">{info.emoji}</div>
        <h1 className="text-xl font-bold text-foreground mb-1">나의 피부족은</h1>
        <p className="text-2xl font-extrabold text-primary mb-3">{info.name}</p>
        <p className="text-sm text-muted-foreground leading-relaxed mb-8 max-w-xs">
          {info.desc}
        </p>
        <Button
          className="w-full max-w-xs rounded-xl h-12 font-bold bg-accent text-accent-foreground hover:bg-accent/90"
          onClick={() => navigate('/', { replace: true })}
          disabled={saving}
        >
          {saving ? '저장 중...' : '홈으로 이동'}
        </Button>
      </div>
    );
  }

  // ── Quiz Screen ──
  const progressPct = ((step + 1) / effectiveQuestions.length) * 100;
  const selectedValue = answers[currentQ.id as keyof QuizAnswers];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-[calc(var(--safe-top)+12px)] pb-2">
        <div className="w-10" /> {/* spacer */}
        <span className="text-xs text-muted-foreground font-medium">
          {step + 1} / {effectiveQuestions.length}
        </span>
        <button
          onClick={handleSkip}
          className="flex items-center gap-0.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          건너뛰기 <X className="w-4 h-4" />
        </button>
      </div>

      {/* Progress bar */}
      <div className="px-4 mb-6">
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-accent rounded-full transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Question */}
      <div className="flex-1 flex flex-col px-6">
        <h2 className="text-lg font-bold text-foreground mb-1">
          Q{step + 1}.
        </h2>
        <p className="text-base font-semibold text-foreground mb-6">
          {currentQ.question}
        </p>

        {/* Options */}
        <div className="space-y-3">
          {currentQ.options.map((opt) => {
            const isSelected = selectedValue === opt.key;
            return (
              <button
                key={opt.key}
                onClick={() => handleSelect(opt.key)}
                disabled={transitioning}
                className={`w-full text-left px-5 py-4 rounded-2xl border-2 transition-all duration-200 text-sm font-medium
                  ${
                    isSelected
                      ? 'border-accent bg-accent/15 text-foreground'
                      : 'border-border bg-card text-foreground hover:border-accent/40'
                  }
                  disabled:opacity-60`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Back button */}
      <div className="px-6 pb-[calc(var(--safe-bottom)+24px)] pt-4">
        {!isFirst && (
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground"
            onClick={handleBack}
          >
            <ChevronLeft className="w-4 h-4 mr-1" /> 이전
          </Button>
        )}
      </div>
    </div>
  );
}
