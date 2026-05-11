import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  DIAGNOSIS_QUESTIONS,
  AGE_QUESTION,
  GOAL_QUESTION,
  calculateScores,
  mapScoresToTribe,
  mapGoalToSkinGoal,
  type DiagnosisAnswers,
  type AgeGroup,
  type SkinGoalKey,
  type ScoreValue,
  type FiveAxisQuestionId,
} from '@/lib/skinDiagnosis';

const QUESTIONS_WITH_AGE = [...DIAGNOSIS_QUESTIONS, AGE_QUESTION, GOAL_QUESTION];
const QUESTIONS_NO_AGE = [...DIAGNOSIS_QUESTIONS, GOAL_QUESTION];

export default function SkinQuiz() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<DiagnosisAnswers>({
    p1: null, p2: null,
    o1: null, o2: null,
    i1: null, i2: null,
    h1: null, h2: null,
    a1: null, a2: null,
  });
  const [ageGroup, setAgeGroup] = useState<AgeGroup | null>(null);
  const [goalSelections, setGoalSelections] = useState<SkinGoalKey[]>([]);
  const [hasAgeGroup, setHasAgeGroup] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const [saving, setSaving] = useState(false);

  // age_group 있으면 연령대 문항 skip
  useEffect(() => {
    if (!user) return;
    supabase
      .from('user_profiles')
      .select('age_group')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        if (data?.age_group) {
          setHasAgeGroup(true);
          setAgeGroup(data.age_group as AgeGroup);
        }
      });
  }, [user]);

  const effectiveQuestions = useMemo(
    () => (hasAgeGroup ? QUESTIONS_NO_AGE : QUESTIONS_WITH_AGE),
    [hasAgeGroup],
  );

  const currentQ = effectiveQuestions[step];
  const isFirst = step === 0;
  const isLast = step === effectiveQuestions.length - 1;
  const isAgeQ = currentQ.id === 'age';
  const isGoalQ = currentQ.id === 'goal';

  const saveResults = useCallback(
    async (
      finalAnswers: DiagnosisAnswers,
      finalAge: AgeGroup | null,
      finalGoals: SkinGoalKey[],
    ) => {
      if (!user) return;
      setSaving(true);

      const scores = calculateScores(finalAnswers, finalAge);
      const tribe = mapScoresToTribe(scores);
      const skinGoal = mapGoalToSkinGoal(finalGoals);

      // 1. user_profiles UPDATE
      const updates: Record<string, unknown> = {
        score_p: scores.p,
        score_o: scores.o,
        score_i: scores.i,
        score_h: scores.h,
        score_a: scores.a,
        diagnosis_updated_at: new Date().toISOString(),
        skin_tribe: tribe,
        skin_goal: skinGoal,
        quiz_completed_at: new Date().toISOString(),
      };
      if (!hasAgeGroup && finalAge) {
        updates.age_group = finalAge;
      }

      const { error: updateError } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('id', user.id);

      if (updateError) {
        console.error('Quiz save error (user_profiles):', updateError);
        toast.error('저장에 실패했지만 결과는 확인할 수 있어요');
      }

      // 2. diagnosis_snapshots INSERT
      const { error: snapshotError } = await supabase
        .from('diagnosis_snapshots')
        .insert({
          user_id: user.id,
          score_p: scores.p,
          score_o: scores.o,
          score_i: scores.i,
          score_h: scores.h,
          score_a: scores.a,
          source: 'quiz',
        });

      if (snapshotError) {
        console.error('Quiz save error (diagnosis_snapshots):', snapshotError);
      }

      setSaving(false);
    },
    [user, hasAgeGroup],
  );

  const handleSelect = (key: string) => {
    if (transitioning || saving) return;

    // 연령대 (단일선택)
    if (isAgeQ) {
      setAgeGroup(key as AgeGroup);
      setTransitioning(true);
      setTimeout(() => {
        setStep((s) => s + 1);
        setTransitioning(false);
      }, 300);
      return;
    }

    // skin_goal (멀티선택, 자동 진행 X)
    if (isGoalQ) {
      setGoalSelections((prev) =>
        prev.includes(key as SkinGoalKey)
          ? prev.filter((k) => k !== key)
          : [...prev, key as SkinGoalKey],
      );
      return;
    }

    // 5축 문항 (단일선택, 자동 진행)
    const opt = currentQ.options.find((o) => o.key === key);
    if (!opt) return;
    const updated: DiagnosisAnswers = {
      ...answers,
      [currentQ.id as FiveAxisQuestionId]: opt.score as ScoreValue,
    };
    setAnswers(updated);

    setTransitioning(true);
    setTimeout(() => {
      setStep((s) => s + 1);
      setTransitioning(false);
    }, 300);
  };

  const handleGoalComplete = async () => {
    if (goalSelections.length === 0) return;
    setTransitioning(true);
    await saveResults(answers, ageGroup, goalSelections);
    setTransitioning(false);
    navigate('/quiz-result', { replace: true });
  };

  const handleBack = () => {
    if (step > 0) setStep((s) => s - 1);
  };

  const handleSkip = async () => {
    if (!user) {
      navigate('/');
      return;
    }
    await supabase
      .from('user_profiles')
      .update({
        quiz_completed_at: new Date().toISOString(),
      })
      .eq('id', user.id);
    navigate('/', { replace: true });
  };

  const selectedValue: string | null = (() => {
    if (isAgeQ) return ageGroup;
    if (isGoalQ) return null;
    const score = answers[currentQ.id as FiveAxisQuestionId];
    if (score === null || score === undefined) return null;
    return currentQ.options.find((o) => o.score === score)?.key ?? null;
  })();

  const progressPct = ((step + 1) / effectiveQuestions.length) * 100;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-[calc(var(--safe-top)+12px)] pb-2">
        <button
          onClick={() => (step > 0 ? handleBack() : navigate(-1))}
          className="p-1 text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
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
        <h2 className="text-lg font-bold text-foreground mb-1">Q{step + 1}.</h2>
        <p className="text-base font-semibold text-foreground mb-6">
          {currentQ.question}
        </p>

        {/* Options */}
        <div className="space-y-3">
          {currentQ.options.map((opt) => {
            const isSelected = isGoalQ
              ? goalSelections.includes(opt.key as SkinGoalKey)
              : selectedValue === opt.key;
            return (
              <button
                key={opt.key}
                onClick={() => handleSelect(opt.key)}
                disabled={transitioning || saving}
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

        {/* 멀티선택 완료 버튼 (goal 문항) */}
        {isGoalQ && goalSelections.length > 0 && (
          <div className="mt-4">
            <Button
              className="w-full rounded-xl h-12 font-bold bg-accent text-accent-foreground hover:bg-accent/90"
              onClick={handleGoalComplete}
              disabled={transitioning || saving}
            >
              {saving ? '저장 중...' : `완료 (${goalSelections.length}개 선택)`}
            </Button>
          </div>
        )}
      </div>

      {/* Back button */}
      <div className="px-6 pb-[calc(var(--safe-bottom)+24px)] pt-4">
        {!isFirst && !isLast && (
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground"
            onClick={handleBack}
            disabled={transitioning || saving}
          >
            <ChevronLeft className="w-4 h-4 mr-1" /> 이전
          </Button>
        )}
      </div>
    </div>
  );
}
