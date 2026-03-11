import { useState, useMemo, useEffect } from 'react';
import { Wallet, ChevronRight, AlertTriangle, CheckCircle2, Timer, CalendarDays, Layers, Package, TrendingUp, Plus, Star, Trash2, Pencil, Sparkles } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { BodyAreaBadge } from '@/components/SkinLayerBadge';

import { useCycles } from '@/context/CyclesContext';
import { useRecords } from '@/context/RecordsContext';
import { useLanguage } from '@/i18n/LanguageContext';
import { SkinLayer, SKIN_LAYER_LABELS, BODY_AREA_LABELS, TreatmentCycle, TreatmentRecord } from '@/types/skin';
import { differenceInDays, format, addDays } from 'date-fns';
import { ko } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import AddTreatmentModal from '@/components/AddTreatmentModal';
import ParseTreatmentModal from '@/components/ParseTreatmentModal';
import OnboardingFlow from '@/components/OnboardingFlow';
import { supabase } from '@/integrations/supabase/client';
import logoImg from '@/assets/logo.png';

import { ALL_TREATMENT_SEASON_DATA } from '@/data/treatmentSeasonData';
type SeasonKey = 'reset' | 'recovery' | 'maintain' | 'boost' | 'special';
const SEASON_CONFIG: Record<SeasonKey, { emoji: string; title: string; sub: string; color: string; bg: string }> = {
  reset:    { emoji: '🌵', title: 'Reset Season',    sub: '피부 리셋 시즌',  color: 'text-green-700',  bg: 'bg-green-50 border-green-200' },
  recovery: { emoji: '🌿', title: 'Recovery Season', sub: '회복 시즌',        color: 'text-sky-700',    bg: 'bg-sky-50 border-sky-200' },
  maintain: { emoji: '💜', title: 'Maintain Season', sub: '유지 시즌',        color: 'text-indigo-700', bg: 'bg-indigo-50 border-indigo-200' },
  boost:    { emoji: '🌹', title: 'Boost Season',    sub: '관리 끌올 시즌',  color: 'text-amber-700',  bg: 'bg-amber-50 border-amber-200' },
  special:  { emoji: '🌸', title: 'Special Season',  sub: '스페셜 시즌',     color: 'text-purple-700', bg: 'bg-purple-50 border-purple-200' },
};

const TODAY = new Date('2026-03-10');

const SKIN_LAYER_COLOR = {
  epidermis: 'bg-amber-500/15 text-amber-400 border-amber-500/25',
  dermis: 'bg-blue-500/15 text-blue-400 border-blue-500/25',
  subcutaneous: 'bg-purple-500/15 text-purple-400 border-purple-500/25',
};

function getCycleStatus(cycle: TreatmentCycle) {
  const lastDate = new Date(cycle.lastTreatmentDate);
  const nextDate = addDays(lastDate, cycle.cycleDays);
  const daysElapsed = differenceInDays(TODAY, lastDate);
  const daysRemaining = differenceInDays(nextDate, TODAY);
  const progress = Math.min((daysElapsed / cycle.cycleDays) * 100, 100);

  let status: 'good' | 'upcoming' | 'overdue';
  if (daysRemaining > 14) status = 'good';
  else if (daysRemaining > 0) status = 'upcoming';
  else status = 'overdue';

  return { daysElapsed, daysRemaining, progress, nextDate, status };
}

const layerOrder: SkinLayer[] = ['epidermis', 'dermis', 'subcutaneous'];

const Index = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { cycles } = useCycles();
  const { records, addRecord, updateRecord, deleteRecord } = useRecords();
  const { t } = useLanguage();
  const [modalOpen, setModalOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<TreatmentRecord | null>(null);
  const [parseModalOpen, setParseModalOpen] = useState(false);
  const [showAllRecords, setShowAllRecords] = useState(false);
  const [currentSeason, setCurrentSeason] = useState<SeasonKey | null>(null);
  const [goals, setGoals] = useState<string[]>([]);
  const [clinicBalances, setClinicBalances] = useState<{ clinic: string; balance: number }[]>([]);
  const [packages, setPackages] = useState<{ id: string; name: string; total_sessions: number; used_sessions: number; clinic: string }[]>([]);

  // 대시보드 데이터 로드
  useEffect(() => {
    const loadDashboard = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const [profileRes, balRes, pkgRes] = await Promise.all([
        supabase.from('user_profiles').select('current_season,goals' as any).eq('id', user.id).single(),
        supabase.from('clinic_balances').select('clinic,balance').eq('user_id', user.id),
        supabase.from('treatment_packages').select('id,name,total_sessions,used_sessions,clinic').eq('user_id', user.id),
      ]);
      if ((profileRes.data as any)?.current_season) setCurrentSeason((profileRes.data as any).current_season as SeasonKey);
      if ((profileRes.data as any)?.goals) setGoals((profileRes.data as any).goals as string[]);
      if (balRes.data) setClinicBalances(balRes.data);
      if (pkgRes.data) setPackages(pkgRes.data);
    };
    loadDashboard();
  }, []);

  // Onboarding
  const [onboardingOpen, setOnboardingOpen] = useState(() => searchParams.get('onboarding') === 'true');

  const handleCloseOnboarding = () => {
    setOnboardingOpen(false);
    searchParams.delete('onboarding');
    setSearchParams(searchParams, { replace: true });
  };

  const statusConfig = {
    good: { color: 'text-sage-dark', bg: 'bg-sage-light', label: t('maintaining') },
    upcoming: { color: 'text-amber', bg: 'bg-amber-light', label: t('upcoming_treatment') },
    overdue: { color: 'text-rose', bg: 'bg-rose-light', label: t('treatment_needed') },
  };

  const stats = useMemo(() => {
    const allStatuses = cycles.map(c => ({ cycle: c, ...getCycleStatus(c) }));
    const overdue = allStatuses.filter(s => s.status === 'overdue').length;
    const upcoming = allStatuses.filter(s => s.status === 'upcoming').length;
    const good = allStatuses.filter(s => s.status === 'good').length;

    let scheduleCount = 0;
    ([] as any[]).forEach((e: any) => {
      const diff = differenceInDays(new Date(e.date), TODAY);
      if (diff >= 0 && diff <= 14) scheduleCount++;
    });
    cycles.forEach(cycle => {
      const lastDate = new Date(cycle.lastTreatmentDate);
      let nextDate = addDays(lastDate, cycle.cycleDays);
      if (nextDate < TODAY) nextDate = addDays(TODAY, 7);
      const diff = differenceInDays(nextDate, TODAY);
      if (diff >= 0 && diff <= 14) scheduleCount++;
    });

    const totalRemaining = 0;

    const mostUrgent = allStatuses
      .sort((a, b) => a.daysRemaining - b.daysRemaining)
      .slice(0, 2);

    const layerSummary = layerOrder.map(layer => {
      const layerStatuses = allStatuses.filter(s => s.cycle.skinLayer === layer);
      const worstStatus = layerStatuses.some(s => s.status === 'overdue') ? 'overdue'
        : layerStatuses.some(s => s.status === 'upcoming') ? 'upcoming' : 'good';
      return { layer, count: layerStatuses.length, status: worstStatus as 'good' | 'upcoming' | 'overdue' };
    }).filter(l => l.count > 0);

    return { overdue, upcoming, good, scheduleCount, totalRemaining, mostUrgent, layerSummary };
  }, [cycles]);

  const sortedRecords = useMemo(() =>
    [...records].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [records]
  );
  const displayedRecords = showAllRecords ? sortedRecords : sortedRecords.slice(0, 3);

  const handleSave = (record: Omit<TreatmentRecord, 'id'>) => {
    if (editRecord) {
      updateRecord(editRecord.id, record);
    } else {
      addRecord(record);
    }
    setEditRecord(null);
  };

  const handleEdit = (r: TreatmentRecord) => {
    setEditRecord(r);
    setModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm(t('delete_confirm'))) deleteRecord(id);
  };

  return (
    <div className="min-h-screen bg-background">

      {/* ── Header ── */}
      <div className="safe-top relative overflow-hidden">
        <img src={logoImg} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="relative page-header-gradient pt-3 pb-3" style={{ background: 'transparent' }}>
          <div className="flex items-center justify-end">
            <div className="h-10 w-10 rounded-full bg-white/30 flex items-center justify-center backdrop-blur-sm tap-target cursor-pointer"
              onClick={() => navigate('/profile')}>
              <span className="text-base">👤</span>
            </div>
          </div>
        </div>
      </div>

      <div className="page-content space-y-4 pt-3 pb-28">
        {(() => {
          const allCycleStatuses = cycles.map(c => ({ c, ...getCycleStatus(c) }));
          const nextCycle = [...allCycleStatuses]
            .filter(s => true)
            .sort((a, b) => a.daysRemaining - b.daysRemaining)[0];

          const nextRecommended = currentSeason
            ? [...ALL_TREATMENT_SEASON_DATA]
                .filter(d => d.seasons[currentSeason!].timesPerYear > 0)
                .sort((a, b) => b.seasons[currentSeason!].timesPerYear - a.seasons[currentSeason!].timesPerYear)[0]
            : null;

          const totalBalance = clinicBalances.reduce((s, b) => s + b.balance, 0);
          const activePackages = packages.filter(p => p.total_sessions - p.used_sessions > 0);
          const nextCyclePkg = nextCycle
            ? activePackages.find(p => p.name.includes(nextCycle.c.treatmentName) || nextCycle.c.treatmentName.includes(p.name))
            : null;
          const seasonMeta = currentSeason ? SEASON_CONFIG[currentSeason] : null;

          // 2주 이내 예정 (cycles 기준)
          const upcomingIn2w = allCycleStatuses.filter(s => s.daysRemaining >= 0 && s.daysRemaining <= 14);

          return (
            <>
              {/* ════════════════════════════════════════════════════
                  BLOCK 1 — 현재 관리 상태
                  ════════════════════════════════════════════════════ */}

                {/* 현재 관리 시즌 — 풀 너비 카드 */}
                <Card className="border-0 overflow-hidden cursor-pointer" onClick={() => navigate('/profile')}>
                  <CardContent className="p-4">
                    {seasonMeta ? (
                      <div className="flex items-center gap-3">
                        <span className="text-3xl shrink-0">{seasonMeta.emoji}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] text-gray-400 mb-0.5">현재 나의 관리 시즌</p>
                          <p className={`text-base font-black leading-tight ${seasonMeta.color}`}>{seasonMeta.title}</p>
                          <p className="text-[11px] text-gray-400 mt-0.5">{seasonMeta.sub}</p>
                        </div>
                        <button
                          onClick={e => { e.stopPropagation(); navigate('/profile'); }}
                          className="shrink-0 px-3 py-1.5 rounded-full border border-gray-200 bg-white text-[11px] font-semibold text-gray-600"
                        >
                          변경
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-[10px] text-gray-400 mb-0.5">현재 나의 관리 시즌</p>
                          <p className="text-sm font-semibold text-gray-500">시즌을 설정해보세요</p>
                        </div>
                        <button
                          onClick={() => navigate('/profile')}
                          className="shrink-0 px-3 py-1.5 rounded-full border border-gray-200 bg-white text-[11px] font-semibold text-gray-600"
                        >
                          설정
                        </button>
                      </div>
                    )}
                  </CardContent>
                </Card>

              {/* 주요 관리 타깃 */}
                <Card
                  className="card-interactive cursor-pointer border-0 overflow-hidden"
                  onClick={() => navigate('/profile')}
                >
                  <CardContent className="px-4 py-3">
                    <p className="text-[10px] text-gray-400 mb-1.5">관리 타깃</p>
                    {goals.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {goals.slice(0, 4).map(g => (
                          <span key={g}
                            className="text-[11px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100 font-medium">
                            {g}
                          </span>
                        ))}
                        {goals.length > 4 && <span className="text-[10px] text-gray-400 self-center">+{goals.length - 4}</span>}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500">목표 설정 →</p>
                    )}
                  </CardContent>
                </Card>

              {/* ════════════════════════════════════════════════════
                  BLOCK 2 — 다음 해야 할 관리 (Next Skin Action)
                  ════════════════════════════════════════════════════ */}
              <div>
                <p className="text-[11px] font-bold text-gray-500 mb-2 px-0.5">다음 해야 할 관리</p>
                <div className="space-y-2">

                  {/* 다음 예정 시술 */}
                  <Card className="card-interactive cursor-pointer border-0 overflow-hidden" onClick={() => navigate('/cycles')}>
                    <CardContent className="px-4 py-3">
                      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-2">다음 예정 시술</p>
                      {nextCycle ? (
                        <div className="flex items-center gap-3">
                          <div className={`shrink-0 w-12 h-12 rounded-xl flex flex-col items-center justify-center ${
                            nextCycle.daysRemaining <= 0 ? 'bg-rose-50' :
                            nextCycle.daysRemaining <= 7 ? 'bg-amber-50' : 'bg-indigo-50'
                          }`}>
                            <span className={`text-base font-black leading-none ${
                              nextCycle.daysRemaining <= 0 ? 'text-rose-500' :
                              nextCycle.daysRemaining <= 7 ? 'text-amber-500' : 'text-indigo-500'
                            }`}>
                              {nextCycle.daysRemaining < 0 ? Math.abs(nextCycle.daysRemaining) :
                               nextCycle.daysRemaining === 0 ? '0' : nextCycle.daysRemaining}
                            </span>
                            <span className={`text-[9px] leading-none mt-0.5 ${
                              nextCycle.daysRemaining <= 0 ? 'text-rose-400' :
                              nextCycle.daysRemaining <= 7 ? 'text-amber-400' : 'text-indigo-400'
                            }`}>
                              {nextCycle.daysRemaining < 0 ? '일 초과' : nextCycle.daysRemaining === 0 ? '오늘' : '일 후'}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-bold text-foreground truncate">{nextCycle.c.treatmentName}</p>
                            {nextCyclePkg && <span className="text-[10px] text-emerald-500">🎫 시술권 보유</span>}
                          </div>
                          <button
                            onClick={e => { e.stopPropagation(); setEditRecord(null); setModalOpen(true); }}
                            className="shrink-0 px-3 py-1.5 rounded-lg bg-gray-100 text-[11px] font-semibold text-gray-600 active:bg-gray-200">
                            기록 추가
                          </button>
                        </div>
                      ) : (
                        <p className="text-[12px] text-gray-400">등록된 주기 없음</p>
                      )}
                    </CardContent>
                  </Card>

                  {/* 추천 관리 */}
                  <Card className="card-interactive cursor-pointer border-0 overflow-hidden bg-gradient-to-br from-white to-indigo-50/30"
                    onClick={() => navigate('/cycles')}>
                    <CardContent className="px-4 py-3">
                      <p className="text-[10px] font-semibold text-indigo-400 uppercase tracking-wide mb-2">추천 관리</p>
                      {nextRecommended && currentSeason ? (
                        <div className="flex items-center gap-3">
                          <div className="shrink-0 w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center">
                            <span className="text-xl">✨</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-bold text-gray-800 truncate">{nextRecommended.name}</p>
                            <p className="text-[11px] text-indigo-500 font-semibold">추천 시기 · 이번 주</p>
                            <p className="text-[10px] text-gray-400 truncate">{nextRecommended.seasons[currentSeason].label}</p>
                          </div>
                          <button
                            onClick={e => { e.stopPropagation(); setEditRecord(null); setModalOpen(true); }}
                            className="shrink-0 px-3 py-1.5 rounded-lg bg-indigo-500 text-[11px] font-semibold text-white active:bg-indigo-600">
                            기록 추가
                          </button>
                        </div>
                      ) : (
                        <p className="text-[12px] text-gray-400">시즌 설정 필요</p>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* ════════════════════════════════════════════════════
                  BLOCK 3 — 시술 자산 (시술권 + 잔액)
                  ════════════════════════════════════════════════════ */}
              <div>
                <div className="flex items-center justify-between mb-2 px-0.5">
                  <p className="text-[11px] font-bold text-gray-500">남은 시술권</p>
                  <button onClick={() => navigate('/packages')}
                    className="text-[10px] text-gray-400 flex items-center gap-0.5">
                    전체보기 <ChevronRight size={10} />
                  </button>
                </div>

                {activePackages.length > 0 ? (
                  <div className="space-y-2">
                    {activePackages.slice(0, 2).map(pkg => {
                      const remaining = pkg.total_sessions - pkg.used_sessions;
                      const pct = (pkg.used_sessions / pkg.total_sessions) * 100;
                      return (
                        <div key={pkg.id}
                          className="bg-white border border-gray-100 rounded-xl px-4 py-3 cursor-pointer active:bg-gray-50 flex items-center gap-3"
                          onClick={() => navigate('/packages')}>
                          {/* 남은 횟수 */}
                          <div className="shrink-0 w-11 h-11 rounded-xl bg-indigo-50 flex flex-col items-center justify-center">
                            <span className="text-lg font-black text-indigo-600 leading-none">{remaining}</span>
                            <span className="text-[9px] text-indigo-400 leading-none mt-0.5">회</span>
                          </div>
                          {/* 정보 */}
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-bold text-gray-800 truncate">{pkg.name}</p>
                            <p className="text-[11px] text-gray-400 mb-1.5">{pkg.clinic}</p>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-full bg-indigo-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
                              </div>
                              <span className="text-[10px] text-gray-400 shrink-0">{pkg.used_sessions}/{pkg.total_sessions}회 사용</span>
                            </div>
                          </div>
                          <ChevronRight size={14} className="text-gray-300 shrink-0" />
                        </div>
                      );
                    })}

                    {/* 전체보기 버튼 — 3개 이상일 때 */}
                    {activePackages.length > 2 && (
                      <button
                        onClick={() => navigate('/packages')}
                        className="w-full py-2.5 rounded-xl border border-dashed border-gray-200 text-[11px] font-semibold text-gray-400 flex items-center justify-center gap-1 active:bg-gray-50"
                      >
                        나머지 {activePackages.length - 2}개 시술권 보기 <ChevronRight size={11} />
                      </button>
                    )}

                    {/* 잔액 카드 */}
                    {totalBalance > 0 && (
                      <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3 cursor-pointer flex items-center gap-3"
                        onClick={() => navigate('/packages?tab=points')}>
                        <div className="shrink-0 w-11 h-11 rounded-xl bg-emerald-100 flex items-center justify-center">
                          <Wallet size={18} className="text-emerald-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] text-emerald-600 font-semibold">병원 잔액</p>
                          <p className="text-[15px] font-black text-emerald-700">{totalBalance.toLocaleString()}원</p>
                        </div>
                        <ChevronRight size={14} className="text-emerald-300 shrink-0" />
                      </div>
                    )}
                  </div>
                ) : (
                  /* 빈 상태 개선 */
                  <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-4 text-center">
                    <p className="text-sm font-semibold text-gray-500 mb-1">시술권을 등록하면</p>
                    <p className="text-[11px] text-gray-400 leading-relaxed mb-3">
                      남은 횟수와 다음 관리 시점을<br />자동으로 알려드려요!
                    </p>
                    <button
                      onClick={() => navigate('/packages')}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-gray-800 text-white text-[11px] font-semibold">
                      <Plus size={12} /> 시술권 추가
                    </button>
                  </div>
                )}
              </div>

              {/* ════════════════════════════════════════════════════
                  BLOCK 4 — 가까운 일정 (캘린더)
                  ════════════════════════════════════════════════════ */}
              <div>
                <p className="text-[11px] font-bold text-gray-500 mb-2 px-0.5">가까운 일정</p>
                {upcomingIn2w.length > 0 ? (
                  <Card className="card-interactive cursor-pointer border-0" onClick={() => navigate('/calendar')}>
                    <CardContent className="p-3">
                      <div className="space-y-2">
                        {upcomingIn2w.slice(0, 3).map(({ c, daysRemaining }) => (
                          <div key={c.id} className="flex items-center justify-between">
                            <div className="flex items-center gap-2 min-w-0">
                              <div className={`h-2 w-2 rounded-full shrink-0 ${daysRemaining <= 7 ? 'bg-amber-400' : 'bg-indigo-400'}`} />
                              <span className="text-sm font-medium truncate">{c.treatmentName}</span>
                            </div>
                            <span className={`text-sm font-bold shrink-0 ${daysRemaining <= 7 ? 'text-amber-500' : 'text-indigo-500'}`}>
                              {daysRemaining === 0 ? '오늘' : `D-${daysRemaining}`}
                            </span>
                          </div>
                        ))}
                        {upcomingIn2w.length > 3 && (
                          <p className="text-[10px] text-gray-400 text-right">+{upcomingIn2w.length - 3}건 더보기</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-5 text-center">
                    <CalendarDays size={20} className="text-gray-300 mx-auto mb-2" />
                    <p className="text-[11px] text-gray-400 leading-relaxed">
                      시술을 기록하면 자동으로<br />일정이 생성되어요!
                    </p>
                    <button
                      onClick={() => navigate('/calendar')}
                      className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-semibold text-indigo-500 hover:text-indigo-600 transition-colors"
                    >
                      일정 등록하러 가기 <ChevronRight size={13} />
                    </button>
                  </div>
                )}
              </div>

            </>
          );
        })()}

        {/* ════════════════════════════════════════════════════
            시술 기록 (Records)
            ════════════════════════════════════════════════════ */}
        <div>
          <div className="flex items-center justify-between px-1 mb-2.5">
            <h2 className="text-sm font-bold flex items-center gap-1.5">
              <Star className="h-3.5 w-3.5 text-[#C9A96E]" />
              {t('treatment_records')} ({records.length})
            </h2>
            <button onClick={() => setShowAllRecords(v => !v)} className="text-xs text-muted-foreground">
              {showAllRecords ? t('fold') : t('view_all')}
            </button>
          </div>
          <div className="space-y-2">
            {displayedRecords.map((r) => (
              <Card key={r.id} className="glass-card">
                <CardContent className="p-3.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold">{r.treatmentName}</span>
                        <span className={cn('text-[10px] px-1.5 py-0.5 rounded-full border', SKIN_LAYER_COLOR[r.skinLayer])}>
                          {r.skinLayer === 'epidermis' ? '표피' : r.skinLayer === 'dermis' ? '진피' : '피하'}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {format(new Date(r.date), 'yyyy.MM.dd')} · {r.clinic}
                      </p>
                      {r.memo && (
                        <p className="text-[11px] text-muted-foreground mt-1 line-clamp-1">{r.memo}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {r.satisfaction && (
                        <span className="text-xs text-[#C9A96E] font-medium">
                          {'★'.repeat(r.satisfaction)}
                        </span>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); handleEdit(r); }}
                        className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white/80 transition-colors"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(r.id); }}
                        className="p-1.5 rounded-lg hover:bg-rose-500/15 text-white/40 hover:text-rose-400 transition-colors"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

      </div>


      {parseModalOpen && (
        <ParseTreatmentModal onClose={() => setParseModalOpen(false)} />
      )}
      <AddTreatmentModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditRecord(null); }}
        onSave={handleSave}
        editRecord={editRecord}
        onOpenParse={() => { setModalOpen(false); setParseModalOpen(true); }}
      />

      <OnboardingFlow open={onboardingOpen} onClose={handleCloseOnboarding} />
    </div>
  );
};

export default Index;
