import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import {
  Plus,
  ChevronLeft,
  AlertTriangle,
  Sparkles,
  Target,
  Info,
} from 'lucide-react';
import AddTreatmentModal from '@/components/AddTreatmentModal';
import ParseTreatmentModal from '@/components/ParseTreatmentModal';
import { AXIS_META, type AxisKey, type FiveAxisScores } from '@/lib/skinDiagnosis';
import { recommendByScores } from '@/lib/skinRecommendation';
import { ALL_TREATMENT_SEASON_DATA } from '@/data/treatmentSeasonData';

const AGE_MESSAGES: Record<string, string> = {
  '20s': '지금 기록을 시작하면, 내 피부 패턴이 보이기 시작해요 🌱',
  '30s': '꾸준히 기록한 사람이 10년 후에도 탄력을 유지해요 📈',
  '40s': '관리 이력이 쌓일수록 시술 효과가 달라져요 💡',
  '50s_plus':
    '내 피부를 가장 잘 아는 건 결국 나예요. 기록으로 나를 더 잘 알 수 있어요 🌸',
};

const AXES: AxisKey[] = ['p', 'o', 'i', 'h', 'a'];

export default function SkinMatch() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [scores, setScores] = useState<FiveAxisScores | null>(null);
  const [ageGroup, setAgeGroup] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [parseModalOpen, setParseModalOpen] = useState(false);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    supabase
      .from('user_profiles')
      .select('score_p, score_o, score_i, score_h, score_a, age_group')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        if (
          data &&
          (data.score_p !== null ||
            data.score_o !== null ||
            data.score_i !== null ||
            data.score_h !== null ||
            data.score_a !== null)
        ) {
          setScores({
            p: data.score_p ?? 0,
            o: data.score_o ?? 0,
            i: data.score_i ?? 0,
            h: data.score_h ?? 0,
            a: data.score_a ?? 0,
          });
        }
        setAgeGroup(data?.age_group ?? null);
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

  if (!scores) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 text-center">
        <p className="text-lg font-bold text-foreground mb-2">진단 결과가 없어요</p>
        <p className="text-sm text-muted-foreground mb-6">
          먼저 피부 진단 퀴즈를 진행해주세요
        </p>
        <Button
          className="rounded-xl h-12 px-8 font-bold bg-accent text-accent-foreground"
          onClick={() => navigate('/quiz')}
        >
          퀴즈 시작하기
        </Button>
      </div>
    );
  }

  const recommendation = recommendByScores(scores);
  const getTreatmentName = (id: string) =>
    ALL_TREATMENT_SEASON_DATA.find((t) => t.id === id)?.name ?? id;

  return (
    <div className="min-h-screen bg-background pb-28">
      {/* Header */}
      <div className="flex items-center px-4 pt-[calc(var(--safe-top)+12px)] pb-3">
        <button
          onClick={() => navigate(-1)}
          className="p-1 text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="flex-1 text-center text-sm font-bold text-foreground pr-6">
          내 시술 궁합
        </h1>
      </div>

      <div className="px-5 space-y-4">
        {/* 5축 점수 요약 */}
        <Card className="border-border rounded-2xl">
          <CardContent className="p-4">
            <p className="text-[10px] text-muted-foreground font-medium mb-2">
              나의 피부 5축 진단
            </p>
            <div className="grid grid-cols-5 gap-2">
              {AXES.map((axis) => {
                const meta = AXIS_META[axis];
                const score = scores[axis];
                const isFocus = score >= 7;
                return (
                  <div
                    key={axis}
                    className={`flex flex-col items-center rounded-lg px-2 py-2 ${
                      isFocus ? 'bg-rose-50' : 'bg-muted/30'
                    }`}
                  >
                    <span className="text-base mb-0.5">{meta.emoji}</span>
                    <span className={`text-base font-black ${meta.color}`}>
                      {score}
                    </span>
                    <span className="text-[9px] text-muted-foreground">
                      {axis.toUpperCase()}
                    </span>
                  </div>
                );
              })}
            </div>
            <button
              onClick={() => navigate('/quiz-result')}
              className="mt-3 text-[10px] text-muted-foreground underline hover:text-foreground"
            >
              상세 결과 보기 →
            </button>
          </CardContent>
        </Card>

        {/* 연령대 메시지 */}
        {ageGroup && AGE_MESSAGES[ageGroup] && (
          <div className="bg-accent/10 border border-accent/20 rounded-xl px-4 py-3">
            <p className="text-sm font-medium text-foreground">
              💡 {AGE_MESSAGES[ageGroup]}
            </p>
          </div>
        )}

        {/* 모든 축 양호 */}
        {recommendation.allGood && (
          <Card className="border-border rounded-2xl">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-4 w-4 text-amber-500" />
                <h2 className="text-sm font-bold text-foreground">
                  피부 상태가 양호해요!
                </h2>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                특별한 집중 케어보다는 꾸준한 유지관리가 좋아요. 기본 수분·진정
                시술로 컨디션 유지를 권장합니다.
              </p>
            </CardContent>
          </Card>
        )}

        {/* 지금 집중 관리할 부분 (점수 ≥ 7) */}
        {recommendation.focus.length > 0 && (
          <Card className="border-rose-200 rounded-2xl bg-rose-50/50">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-rose-200/50 flex items-center justify-center">
                  <Target className="h-4 w-4 text-rose-700" />
                </div>
                <h2 className="text-sm font-bold text-foreground">
                  지금 집중 관리할 부분
                </h2>
              </div>
              {recommendation.focus.map((rec) => {
                const meta = AXIS_META[rec.axis];
                return (
                  <div
                    key={rec.axis}
                    className="bg-white rounded-xl px-3 py-2.5 border border-rose-100"
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-base">{meta.emoji}</span>
                      <span className={`text-xs font-bold ${meta.color}`}>
                        {meta.label}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        ({meta.description})
                      </span>
                      <span className="ml-auto text-xs font-black text-rose-700">
                        {rec.score}/10
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {rec.treatmentIds.map((id) => (
                        <span
                          key={id}
                          className="text-[10px] px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 border border-rose-200"
                        >
                          {getTreatmentName(id)}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        {/* 꾸준히 관리할 부분 (점수 4~6) */}
        {recommendation.maintain.length > 0 && (
          <Card className="border-border rounded-2xl">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-amber-100 flex items-center justify-center">
                  <Sparkles className="h-4 w-4 text-amber-600" />
                </div>
                <h2 className="text-sm font-bold text-foreground">
                  꾸준히 관리할 부분
                </h2>
              </div>
              {recommendation.maintain.map((rec) => {
                const meta = AXIS_META[rec.axis];
                return (
                  <div
                    key={rec.axis}
                    className="bg-muted/30 rounded-xl px-3 py-2.5"
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-base">{meta.emoji}</span>
                      <span className={`text-xs font-bold ${meta.color}`}>
                        {meta.label}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        ({meta.description})
                      </span>
                      <span className="ml-auto text-xs font-black text-amber-600">
                        {rec.score}/10
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {rec.treatmentIds.map((id) => (
                        <span
                          key={id}
                          className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200"
                        >
                          {getTreatmentName(id)}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        {/* 신중하게 (I축 ≥ 7) */}
        {recommendation.cautionIds.length > 0 && (
          <Card className="border-border rounded-2xl">
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-destructive/15 flex items-center justify-center">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                </div>
                <h2 className="text-sm font-bold text-foreground">신중하게</h2>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                피부 염증·민감도가 높은 상태예요. 다음 고에너지 시술은 피부 상태가
                안정된 후에 진행하세요.
              </p>
              <div className="flex flex-wrap gap-1 mt-1">
                {recommendation.cautionIds.map((id) => (
                  <span
                    key={id}
                    className="text-[10px] px-2 py-0.5 rounded-full bg-destructive/10 text-destructive border border-destructive/20"
                  >
                    {getTreatmentName(id)}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 추천 안내 */}
        <div className="bg-muted/30 border border-border rounded-xl px-4 py-3 flex gap-2 items-start">
          <Info className="w-3.5 h-3.5 mt-0.5 shrink-0 text-muted-foreground" />
          <p className="text-[10px] text-muted-foreground leading-relaxed">
            추천 시술은 5축 진단 점수를 기반으로 한 일반 가이드라인입니다. 개인 피부
            상태에 따라 결과가 다를 수 있으니, 정확한 케어는 피부과 전문의와
            상담하세요.
          </p>
        </div>
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
        <ParseTreatmentModal
          onClose={() => {
            setParseModalOpen(false);
            setAddModalOpen(false);
          }}
        />
      )}

      {addModalOpen && (
        <AddTreatmentModal
          open={addModalOpen}
          onClose={() => setAddModalOpen(false)}
          onSave={() => setAddModalOpen(false)}
          onOpenParse={() => {
            setParseModalOpen(true);
            setAddModalOpen(false);
          }}
        />
      )}
    </div>
  );
}
