import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Link2, RefreshCw, ArrowRight, ChevronLeft, Info } from 'lucide-react';
import { toast } from 'sonner';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from 'recharts';
import {
  AXIS_META,
  interpretScore,
  type AxisKey,
  type FiveAxisScores,
} from '@/lib/skinDiagnosis';

interface DiagnosisSnapshot {
  id: string;
  score_p: number | null;
  score_o: number | null;
  score_i: number | null;
  score_h: number | null;
  score_a: number | null;
  snapshot_at: string;
  source: string | null;
}

const AXES: AxisKey[] = ['p', 'o', 'i', 'h', 'a'];

export default function QuizResult() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [scores, setScores] = useState<FiveAxisScores | null>(null);
  const [history, setHistory] = useState<DiagnosisSnapshot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const load = async () => {
      const [profileRes, snapshotRes] = await Promise.all([
        supabase
          .from('user_profiles')
          .select('score_p, score_o, score_i, score_h, score_a')
          .eq('id', user.id)
          .single(),
        supabase
          .from('diagnosis_snapshots')
          .select('id, score_p, score_o, score_i, score_h, score_a, snapshot_at, source')
          .eq('user_id', user.id)
          .order('snapshot_at', { ascending: false })
          .limit(5),
      ]);

      const profile = profileRes.data;
      if (
        profile &&
        (profile.score_p !== null ||
          profile.score_o !== null ||
          profile.score_i !== null ||
          profile.score_h !== null ||
          profile.score_a !== null)
      ) {
        setScores({
          p: profile.score_p ?? 0,
          o: profile.score_o ?? 0,
          i: profile.score_i ?? 0,
          h: profile.score_h ?? 0,
          a: profile.score_a ?? 0,
        });
      }

      setHistory(snapshotRes.data ?? []);
      setLoading(false);
    };
    load();
  }, [user]);

  // 페이지 타이틀
  useEffect(() => {
    document.title = '내 피부 진단 결과 | Bloom Log';
    return () => {
      document.title = 'Bloom Log';
    };
  }, []);

  const handleShare = async () => {
    const text = '내 피부 5축 진단 결과 확인하기! bloomlog.kr/quiz';
    try {
      if (navigator.share) {
        await navigator.share({ text, url: 'https://bloomlog.kr/quiz' });
      } else {
        await navigator.clipboard.writeText(text);
        toast.success('링크가 복사되었어요!');
      }
    } catch {
      try {
        await navigator.clipboard.writeText(text);
        toast.success('링크가 복사되었어요!');
      } catch {
        toast.error('공유에 실패했어요');
      }
    }
  };

  const handleRetakeQuiz = async () => {
    if (!user) return;
    await supabase
      .from('user_profiles')
      .update({ quiz_completed_at: null })
      .eq('id', user.id);
    navigate('/quiz', { replace: true });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!scores) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background px-6 text-center">
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

  const chartData = AXES.map((axisKey) => ({
    axis: axisKey.toUpperCase(),
    score: scores[axisKey],
    fullMark: 10,
  }));

  return (
    <div className="min-h-screen bg-background flex flex-col pb-10">
      {/* Header */}
      <div className="flex items-center px-4 pt-[calc(var(--safe-top)+12px)] pb-3">
        <button
          onClick={() => navigate('/')}
          className="p-1 text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="flex-1 text-center text-sm font-bold text-foreground pr-6">
          내 피부 진단 결과
        </h1>
      </div>

      {/* 레이더 차트 */}
      <div className="px-4 pt-2 pb-4">
        <div className="bg-card border border-border rounded-2xl px-3 py-4">
          <h2 className="text-center text-xs text-muted-foreground font-medium mb-2">
            나의 피부 5축 프로필
          </h2>
          <div className="w-full h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={chartData} outerRadius="72%">
                <PolarGrid stroke="#e5e7eb" />
                <PolarAngleAxis
                  dataKey="axis"
                  tick={{ fontSize: 13, fill: '#374151', fontWeight: 700 }}
                />
                <PolarRadiusAxis
                  angle={90}
                  domain={[0, 10]}
                  tick={{ fontSize: 10, fill: '#9ca3af' }}
                />
                <Radar
                  name="현재"
                  dataKey="score"
                  stroke="hsl(var(--accent))"
                  fill="hsl(var(--accent))"
                  fillOpacity={0.4}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 5축 점수 카드 */}
      <div className="px-4 space-y-2">
        {AXES.map((axisKey) => {
          const meta = AXIS_META[axisKey];
          const score = scores[axisKey];
          const interpretation = interpretScore(axisKey, score);
          return (
            <div
              key={axisKey}
              className="bg-card border border-border rounded-2xl px-4 py-3 flex items-center gap-3"
            >
              <span className="text-2xl shrink-0">{meta.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-1.5">
                  <span className={`text-sm font-bold ${meta.color}`}>{meta.label}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {meta.description}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                  {interpretation}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className={`text-2xl font-black ${meta.color}`}>{score}</p>
                <p className="text-[9px] text-muted-foreground leading-tight">/ 10</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* 진단 히스토리 (2개 이상일 때만) */}
      {history.length >= 2 && (
        <div className="px-4 mt-4">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
            진단 히스토리
          </h3>
          <div className="bg-card border border-border rounded-2xl px-4 py-3 space-y-2">
            {history.map((snap, idx) => {
              const date = new Date(snap.snapshot_at);
              const dateStr = `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
              return (
                <div
                  key={snap.id}
                  className={`flex items-center justify-between text-xs ${
                    idx === 0 ? 'text-foreground font-semibold' : 'text-muted-foreground'
                  }`}
                >
                  <span>
                    {dateStr} {idx === 0 && '(최신)'}
                  </span>
                  <span className="font-mono text-[10px]">
                    P{snap.score_p ?? '-'} O{snap.score_o ?? '-'} I{snap.score_i ?? '-'} H{snap.score_h ?? '-'} A{snap.score_a ?? '-'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* BSTI 근거 문구 */}
      <div className="px-4 mt-4">
        <div className="bg-muted/30 border border-border rounded-xl px-4 py-3 flex gap-2 items-start">
          <Info className="w-3.5 h-3.5 mt-0.5 shrink-0 text-muted-foreground" />
          <div className="text-[10px] text-muted-foreground leading-relaxed">
            <p>
              이 진단은 미국 피부과 전문의 Dr. Leslie Baumann이 개발한{' '}
              <span className="font-semibold">Baumann Skin Type Indicator (BSTI)</span> 시스템을 기반으로 합니다.
              한국에서도 2016년 임상 연구로 피부과 전문의 진단과 동일한 정확도가 입증되었어요.
            </p>
            <p className="mt-1.5">
              단, 자기 진단의 한계가 있으므로 정확한 케어를 위해서는 피부과 전문의 상담을 권장합니다.
            </p>
          </div>
        </div>
      </div>

      {/* CTAs */}
      <div className="px-4 mt-5 space-y-3">
        <Button
          className="w-full rounded-xl h-12 text-sm font-bold bg-accent text-accent-foreground hover:bg-accent/90 shadow-md"
          onClick={handleShare}
        >
          <Link2 className="w-4 h-4 mr-2" />
          내 결과 공유하기
        </Button>

        <Button
          variant="ghost"
          className="w-full rounded-xl h-11 text-sm text-muted-foreground hover:text-foreground"
          onClick={() => navigate('/skin-match')}
        >
          내 시술 궁합 보러가기 <ArrowRight className="w-4 h-4 ml-1" />
        </Button>

        <Button
          variant="outline"
          className="w-full rounded-xl h-10 text-xs text-muted-foreground border-border"
          onClick={handleRetakeQuiz}
        >
          <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
          퀴즈 다시 하기
        </Button>

        <button
          onClick={() => navigate('/')}
          className="w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors py-2"
        >
          다음에 하기
        </button>
      </div>
    </div>
  );
}
