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

import { ALL_TREATMENT_SEASON_DATA } from '@/data/treatmentSeasonData';
type SeasonKey = 'reset' | 'recovery' | 'maintain' | 'boost' | 'special';
const SEASON_CONFIG: Record<SeasonKey, { emoji: string; title: string; sub: string; color: string; bg: string }> = {
  reset:    { emoji: '🌿', title: 'Reset Season',    sub: '피부 리셋 시즌',  color: 'text-green-700',  bg: 'bg-green-50 border-green-200' },
  recovery: { emoji: '💧', title: 'Recovery Season', sub: '회복 시즌',        color: 'text-sky-700',    bg: 'bg-sky-50 border-sky-200' },
  maintain: { emoji: '✨', title: 'Maintain Season', sub: '유지 시즌',        color: 'text-indigo-700', bg: 'bg-indigo-50 border-indigo-200' },
  boost:    { emoji: '⚡', title: 'Boost Season',    sub: '관리 끌올 시즌',  color: 'text-amber-700',  bg: 'bg-amber-50 border-amber-200' },
  special:  { emoji: '💫', title: 'Special Season',  sub: '스페셜 시즌',     color: 'text-purple-700', bg: 'bg-purple-50 border-purple-200' },
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
  const [fabOpen, setFabOpen] = useState(false);
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
        supabase.from('user_profiles').select('current_season,goals').eq('id', user.id).single(),
        supabase.from('clinic_balances').select('clinic,balance').eq('user_id', user.id),
        supabase.from('treatment_packages').select('id,name,total_sessions,used_sessions,clinic').eq('user_id', user.id),
      ]);
      if (profileRes.data?.current_season) setCurrentSeason(profileRes.data.current_season as SeasonKey);
      if (profileRes.data?.goals) setGoals(profileRes.data.goals as string[]);
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
      {/* Header */}
      <div className="gradient-sage safe-top">
        <div className="page-header-gradient pt-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-70 font-light">{t('hello')}</p>
              <h1 className="mt-0.5 text-xl font-bold">{t('my_skin_care')}</h1>
            </div>
            <div className="h-10 w-10 rounded-full bg-white/15 flex items-center justify-center backdrop-blur-sm tap-target cursor-pointer" onClick={() => navigate('/profile')}>
              <span className="text-base">👤</span>
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <span className="text-[11px] opacity-60 bg-white/10 px-3 py-1.5 rounded-full backdrop-blur-sm">
              {t('my_skin')}
            </span>
            <span className="text-[11px] opacity-60 bg-white/10 px-3 py-1.5 rounded-full backdrop-blur-sm">
              내 시술 기록 관리
            </span>
          </div>
        </div>
      </div>

      {/* 현재 관리 시즌 배너 */}
      {currentSeason && (() => {
        const s = SEASON_CONFIG[currentSeason];
        return (
          <div className={`mx-4 mt-3 flex items-center gap-3 px-4 py-3 rounded-2xl border ${s.bg} cursor-pointer`}
            onClick={() => navigate('/profile')}>
            <span className="text-xl shrink-0">{s.emoji}</span>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-gray-400 font-medium mb-0.5">현재 나의 관리 시즌</p>
              <p className={`text-sm font-bold ${s.color}`}>{s.title}</p>
              <p className="text-[10px] text-gray-500">{s.sub}</p>
            </div>
            <ChevronRight size={14} className="text-gray-400 shrink-0" />
          </div>
        );
      })()}

      <div className="page-content space-y-4 pt-4 pb-28">
      <div className="page-content space-y-3 pt-4 pb-28">
        {/* ── 6-Cell 대시보드 ────────────────────────────────────────── */}
        {(() => {
          // 다음 예정 시술 (cycles 중 가장 빨리 도래하는 것)
          const allCycleStatuses = cycles.map(c => ({ c, ...getCycleStatus(c) }));
          const nextCycle = [...allCycleStatuses].sort((a, b) => a.daysRemaining - b.daysRemaining)[0];

          // 다음 추천 시술 (현재 시즌 기준, 연간 추천 횟수 가장 높은 시술)
          const nextRecommended = currentSeason
            ? [...ALL_TREATMENT_SEASON_DATA]
                .filter(d => d.seasons[currentSeason].timesPerYear > 0)
                .sort((a, b) => b.seasons[currentSeason!].timesPerYear - a.seasons[currentSeason!].timesPerYear)[0]
            : null;

          // 잔액 합계
          const totalBalance = clinicBalances.reduce((s, b) => s + b.balance, 0);

          // 남은 시술권 (미사용 잔여 있는 것만)
          const activePackages = packages.filter(p => p.total_sessions - p.used_sessions > 0);

          // 시술권 보유 여부 체크 (다음 예정 시술 이름 포함 여부)
          const nextCyclePkg = nextCycle
            ? activePackages.find(p => p.name.includes(nextCycle.c.name) || nextCycle.c.name.includes(p.name))
            : null;

          const seasonMeta = currentSeason ? SEASON_CONFIG[currentSeason] : null;

          return (
            <>
              {/* Row 1: 현재 관리 모드 + 주요 관리 타깃 */}
              <div className="grid grid-cols-2 gap-2">
                {/* 현재 관리 모드 */}
                <Card className="card-interactive cursor-pointer border-0 overflow-hidden" onClick={() => navigate('/profile')}>
                  <CardContent className="p-3">
                    <p className="text-[9px] font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">현재 관리 모드</p>
                    {seasonMeta ? (
                      <>
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="text-lg">{seasonMeta.emoji}</span>
                          <p className={`text-[11px] font-black leading-tight ${seasonMeta.color}`}>{seasonMeta.title}</p>
                        </div>
                        <p className="text-[10px] text-gray-400">{seasonMeta.sub}</p>
                      </>
                    ) : (
                      <p className="text-xs text-gray-400">미설정</p>
                    )}
                  </CardContent>
                </Card>

                {/* 주요 관리 타깃 */}
                <Card className="card-interactive cursor-pointer border-0 overflow-hidden" onClick={() => navigate('/profile')}>
                  <CardContent className="p-3">
                    <p className="text-[9px] font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">주요 관리 타깃</p>
                    {goals.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {goals.slice(0, 3).map(g => (
                          <span key={g} className="text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100 font-medium">{g}</span>
                        ))}
                        {goals.length > 3 && <span className="text-[10px] text-gray-400">+{goals.length - 3}</span>}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400">미설정</p>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Row 2: 다음 예정 시술 + 다음 추천 시술 */}
              <div className="grid grid-cols-2 gap-2">
                {/* 다음 예정 시술 */}
                <Card className="card-interactive cursor-pointer border-0 overflow-hidden" onClick={() => navigate('/cycles')}>
                  <CardContent className="p-3">
                    <p className="text-[9px] font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">다음 예정 시술</p>
                    {nextCycle ? (
                      <>
                        <p className="text-[12px] font-bold text-gray-800 leading-tight truncate">{nextCycle.c.name}</p>
                        <p className={`text-[11px] font-semibold mt-0.5 ${
                          nextCycle.daysRemaining <= 0 ? 'text-rose-500' :
                          nextCycle.daysRemaining <= 14 ? 'text-amber-500' : 'text-indigo-500'
                        }`}>
                          {nextCycle.daysRemaining <= 0 ? `${Math.abs(nextCycle.daysRemaining)}일 초과` :
                           nextCycle.daysRemaining === 0 ? '오늘' : `${nextCycle.daysRemaining}일 후`}
                        </p>
                        {nextCyclePkg && (
                          <p className="text-[9px] text-emerald-500 mt-0.5">🎫 시술권 보유</p>
                        )}
                      </>
                    ) : (
                      <p className="text-[11px] text-gray-400">등록된 주기 없음</p>
                    )}
                  </CardContent>
                </Card>

                {/* 다음 추천 시술 */}
                <Card className="card-interactive cursor-pointer border-0 overflow-hidden" onClick={() => navigate('/cycles?tab=season')}>
                  <CardContent className="p-3">
                    <p className="text-[9px] font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">다음 추천 시술</p>
                    {nextRecommended && currentSeason ? (
                      <>
                        <p className="text-[12px] font-bold text-gray-800 leading-tight truncate">{nextRecommended.name}</p>
                        <p className="text-[10px] text-amber-500 font-semibold mt-0.5">
                          {nextRecommended.seasons[currentSeason].intervalDays > 0
                            ? `${nextRecommended.seasons[currentSeason].intervalDays}일 간격`
                            : '추천'}
                        </p>
                        <p className="text-[9px] text-gray-400 mt-0.5 truncate">{nextRecommended.seasons[currentSeason].label}</p>
                      </>
                    ) : (
                      <p className="text-[11px] text-gray-400">시즌 설정 필요</p>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Row 3: 남은 시술금액 */}
              <Card className="card-interactive cursor-pointer border-0" onClick={() => navigate('/points')}>
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wide mb-1">남은 시술금액</p>
                      <p className="text-lg font-black text-gray-800">
                        {totalBalance > 0 ? `${totalBalance.toLocaleString()}원` : '—'}
                      </p>
                    </div>
                    <div className="flex flex-col gap-1 items-end">
                      {clinicBalances.length > 0 ? clinicBalances.map(b => (
                        <div key={b.clinic} className="flex items-center gap-1.5">
                          <span className="text-[9px] text-gray-400">{b.clinic}</span>
                          <span className="text-[10px] font-semibold text-gray-600">{b.balance.toLocaleString()}원</span>
                        </div>
                      )) : (
                        <span className="text-[10px] text-gray-400">잔액 없음</span>
                      )}
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground ml-2 shrink-0" />
                  </div>
                </CardContent>
              </Card>

              {/* Row 4: 남은 시술권 */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-bold text-gray-700">남은 시술권</p>
                  <button onClick={() => navigate('/packages')} className="text-[10px] text-gray-400 flex items-center gap-0.5">
                    전체보기 <ChevronRight size={10} />
                  </button>
                </div>
                {activePackages.length > 0 ? (
                  <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                    {activePackages.map(pkg => {
                      const remaining = pkg.total_sessions - pkg.used_sessions;
                      const pct = (pkg.used_sessions / pkg.total_sessions) * 100;
                      return (
                        <div key={pkg.id} className="shrink-0 bg-white border border-gray-100 rounded-xl px-3 py-2.5 min-w-[120px] cursor-pointer"
                          onClick={() => navigate('/packages')}>
                          <p className="text-[11px] font-bold text-gray-800 truncate mb-0.5">{pkg.name}</p>
                          <p className="text-[10px] text-gray-400 mb-1.5">{pkg.clinic}</p>
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="text-sm font-black text-indigo-600">{remaining}</span>
                            <span className="text-[10px] text-gray-400">/ {pkg.total_sessions}회</span>
                          </div>
                          <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-400 rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-4 text-[11px] text-gray-400 bg-gray-50 rounded-xl">
                    등록된 시술권이 없습니다
                  </div>
                )}
              </div>
            </>
          );
        })()}

        {/* Urgent treatments */}
        {stats.mostUrgent.length > 0 && (
          <Card className="card-interactive" onClick={() => navigate('/cycles')}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-bold flex items-center gap-1.5">
                  <TrendingUp className="h-3.5 w-3.5 text-rose" />
                  {t('urgent_treatments')}
                </h2>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="space-y-2">
                {stats.mostUrgent.map(({ cycle, daysRemaining, status }) => {
                  const config = statusConfig[status];
                  return (
                    <div key={cycle.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className={`h-2 w-2 rounded-full ${status === 'overdue' ? 'bg-rose' : status === 'upcoming' ? 'bg-amber' : 'bg-sage-dark'}`} />
                        <span className="text-sm font-medium truncate">{cycle.treatmentName}</span>
                        <span className="text-[10px] text-muted-foreground">{BODY_AREA_LABELS[cycle.bodyArea]}</span>
                      </div>
                      <span className={`text-sm font-bold ${config.color} shrink-0`}>
                        {daysRemaining > 0 ? `D-${daysRemaining}` : daysRemaining === 0 ? 'D-Day' : `D+${Math.abs(daysRemaining)}`}
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 2-week schedule */}
        <Card className="card-interactive" onClick={() => navigate('/calendar')}>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-info-light">
              <CalendarDays className="h-4.5 w-4.5 text-info" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] text-muted-foreground">{t('schedule_in_2weeks')}</p>
              <p className="text-lg font-bold tracking-tight">{stats.scheduleCount}건</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
          </CardContent>
        </Card>

        {/* Skin layer status */}
        <Card className="card-interactive" onClick={() => navigate('/cycles')}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5 text-info" />
                {t('skin_layer_status')}
              </h2>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="space-y-2.5">
              {stats.layerSummary.map(({ layer, count, status }) => {
                const config = statusConfig[status];
                return (
                  <div key={layer} className="flex items-center gap-3">
                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${config.bg}`}>
                      <span className="text-[10px] font-bold">{SKIN_LAYER_LABELS[layer].charAt(0)}</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{SKIN_LAYER_LABELS[layer]}</p>
                      <p className="text-[10px] text-muted-foreground">{count}개 시술 관리 중</p>
                    </div>
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${config.bg} ${config.color}`}>
                      {config.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Remaining vouchers */}
        <Card className="card-interactive" onClick={() => navigate('/packages')}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold flex items-center gap-1.5">
                <Package className="h-3.5 w-3.5 text-accent-foreground" />
                {t('remaining_vouchers')}
              </h2>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              {([] as any[]).map((pkg) => {
                const remaining = pkg.totalSessions - pkg.usedSessions;
                const progress = (pkg.usedSessions / pkg.totalSessions) * 100;
                return (
                  <div key={pkg.id} className="p-2.5 rounded-xl bg-muted/50">
                    <p className="text-xs font-semibold truncate">{pkg.name}</p>
                    <div className="flex items-end justify-between mt-1.5">
                      <p className="text-lg font-bold text-primary">{remaining}<span className="text-[10px] font-normal text-muted-foreground">회</span></p>
                      <BodyAreaBadge area={pkg.bodyArea} />
                    </div>
                    <Progress value={progress} className="h-1 mt-1.5" />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Treatment records */}
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

      {/* FAB */}
      {fabOpen && (
        <div className="fixed bottom-36 right-4 z-40 flex flex-col gap-2 items-end">
          <button
            onClick={() => { setFabOpen(false); setParseModalOpen(true); }}
            className="flex items-center gap-2 bg-[#1a1a1a] border border-[#C9A96E]/40 text-white text-xs font-semibold px-4 py-2.5 rounded-full shadow-lg"
          >
            <Sparkles size={14} className="text-[#C9A96E]" />
            문자/카톡으로 등록
          </button>
          <button
            onClick={() => { setFabOpen(false); setEditRecord(null); setModalOpen(true); }}
            className="flex items-center gap-2 bg-[#1a1a1a] border border-white/20 text-white text-xs font-semibold px-4 py-2.5 rounded-full shadow-lg"
          >
            <Plus size={14} />
            직접 입력
          </button>
        </div>
      )}
      {fabOpen && (
        <div className="fixed inset-0 z-30" onClick={() => setFabOpen(false)} />
      )}
      <button
        onClick={() => setFabOpen(v => !v)}
        className="fixed bottom-20 right-4 z-40 h-14 w-14 rounded-full bg-[#C9A96E] shadow-lg shadow-[#C9A96E]/30 flex items-center justify-center active:scale-95 transition-transform"
      >
        <Plus size={24} className={`text-black transition-transform duration-200 ${fabOpen ? "rotate-45" : ""}`} strokeWidth={2.5} />
      </button>
      </div>

      {parseModalOpen && (
        <ParseTreatmentModal onClose={() => setParseModalOpen(false)} />
      )}
      <AddTreatmentModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditRecord(null); }}
        onSave={handleSave}
        editRecord={editRecord}
      />

      <OnboardingFlow open={onboardingOpen} onClose={handleCloseOnboarding} />
    </div>
  );
};

export default Index;
