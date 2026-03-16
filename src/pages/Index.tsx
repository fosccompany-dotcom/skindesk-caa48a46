import { useState, useMemo, useEffect } from 'react';
import { ChevronRight, ChevronDown, CalendarDays, Stethoscope, Hospital, Package, Wallet, Star, Trash2, Pencil, Check } from 'lucide-react';
import BloomAvatar from '@/components/BloomAvatar';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

import { useCycles } from '@/context/CyclesContext';
import { useRecords } from '@/context/RecordsContext';
import FlowerLoader from '@/components/FlowerLoader';
import { useLanguage } from '@/i18n/LanguageContext';
import { TreatmentCycle, TreatmentRecord } from '@/types/skin';
import { differenceInDays, format, addDays, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isSameMonth, isSameDay } from 'date-fns';
import { ko } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import AddTreatmentModal from '@/components/AddTreatmentModal';
import ParseTreatmentModal from '@/components/ParseTreatmentModal';
import OnboardingFlow from '@/components/OnboardingFlow';
import { supabase } from '@/integrations/supabase/client';
import { useSeason, SeasonKey } from '@/context/SeasonContext';
import logoImg from '@/assets/logo.png';
import { getBloomInfo, getActiveDays } from '@/utils/bloomLevel';

const SEASON_CONFIG: Record<SeasonKey, {emoji: string;title: string;sub: string;color: string;bg: string;}> = {
  reset: { emoji: '🌵', title: 'Reset Mode', sub: '피부 리셋 모드', color: '#7EC8A0', bg: 'bg-green-50' },
  recovery: { emoji: '🌿', title: 'Recovery Mode', sub: '회복 모드', color: '#A8D5A2', bg: 'bg-sky-50' },
  maintain: { emoji: '💜', title: 'Maintain Mode', sub: '유지 모드', color: '#C9A8E0', bg: 'bg-indigo-50' },
  boost: { emoji: '🌹', title: 'Boost Mode', sub: '관리 끌올 모드', color: '#E8A0A0', bg: 'bg-amber-50' },
  special: { emoji: '🌸', title: 'Special Mode', sub: '스페셜 모드', color: '#F0B8D8', bg: 'bg-purple-50' }
};

const TODAY = new Date('2026-03-10');
const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

const CONDITION_OPTIONS = [
{ emoji: '✨', label: '좋음', value: 5 },
{ emoji: '😊', label: '보통', value: 4 },
{ emoji: '😐', label: '그저그럭', value: 3 },
{ emoji: '😣', label: '별로', value: 2 },
{ emoji: '😰', label: '안좋음', value: 1 }];


function getCycleStatus(cycle: TreatmentCycle) {
  const lastDate = new Date(cycle.lastTreatmentDate);
  const nextDate = addDays(lastDate, cycle.cycleDays);
  const daysElapsed = differenceInDays(TODAY, lastDate);
  const daysRemaining = differenceInDays(nextDate, TODAY);
  const progress = Math.min(daysElapsed / cycle.cycleDays * 100, 100);
  let status: 'good' | 'upcoming' | 'overdue';
  if (daysRemaining > 14) status = 'good';else
  if (daysRemaining > 0) status = 'upcoming';else
  status = 'overdue';
  return { daysElapsed, daysRemaining, progress, nextDate, status };
}

const Index = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { cycles } = useCycles();
  const { records, loading, addRecord, updateRecord, deleteRecord } = useRecords();
  const { t } = useLanguage();
  const [modalOpen, setModalOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<TreatmentRecord | null>(null);
  const [parseModalOpen, setParseModalOpen] = useState(false);
  const { currentSeason, setCurrentSeason } = useSeason();
  const { nickname } = useSeason();
  const [modeDropdownOpen, setModeDropdownOpen] = useState(false);
  const [packages, setPackages] = useState<{id: string;name: string;total_sessions: number;used_sessions: number;clinic: string;}[]>([]);
  const [clinicPayments, setClinicPayments] = useState<{amount: number;method: string;}[]>([]);
  const [todayCondition, setTodayCondition] = useState<number | null>(null);
  const [conditionMemo, setConditionMemo] = useState('');

  // Bloom info
  const activeDays = getActiveDays(records);
  const bloom = getBloomInfo(activeDays);

  useEffect(() => {
    const loadDashboard = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const [payRes, pkgRes] = await Promise.all([
      supabase.from('payment_records').select('amount,method').eq('user_id', user.id),
      supabase.from('treatment_packages').select('id,name,total_sessions,used_sessions,clinic').eq('user_id', user.id)]
      );
      if (payRes.data) setClinicPayments(payRes.data);
      if (pkgRes.data) setPackages(pkgRes.data);
    };
    loadDashboard();
  }, []);

  // Season change handler
  const handleSeasonChange = (season: SeasonKey) => {
    setCurrentSeason(season);
    setModeDropdownOpen(false);
  };

  // Privacy consent for OAuth users
  const [privacyConsentOpen, setPrivacyConsentOpen] = useState(false);
  const [privacyAgreePolicy, setPrivacyAgreePolicy] = useState(false);
  const [privacyAgreeAge, setPrivacyAgreeAge] = useState(false);

  useEffect(() => {
    const checkPrivacyConsent = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('user_profiles')
        .select('privacy_agreed_at')
        .eq('id', user.id)
        .maybeSingle();
      if (!data?.privacy_agreed_at) {
        setPrivacyConsentOpen(true);
      }
    };
    checkPrivacyConsent();
  }, []);

  const handlePrivacyConsent = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('user_profiles').upsert({
      id: user.id,
      privacy_agreed_at: new Date().toISOString(),
    });
    setPrivacyConsentOpen(false);
  };

  // Onboarding
  const [onboardingOpen, setOnboardingOpen] = useState(() => {
    if (searchParams.get('onboarding') === 'true') return true;
    const done = localStorage.getItem('skindesk_onboarding_done');
    return !done;
  });
  const handleCloseOnboarding = () => {
    setOnboardingOpen(false);
    localStorage.setItem('skindesk_onboarding_done', 'true');
    searchParams.delete('onboarding');
    setSearchParams(searchParams, { replace: true });
  };

  // Stats
  const allCycleStatuses = useMemo(() => cycles.map((c) => ({ c, ...getCycleStatus(c) })), [cycles]);
  const upcomingIn2w = allCycleStatuses.filter((s) => s.daysRemaining >= 0 && s.daysRemaining <= 14);
  const uniqueClinics = useMemo(() => new Set(cycles.map((c) => c.clinic)).size, [cycles]);
  const activePackages = useMemo(() => packages.filter((p) => (p.total_sessions ?? 0) - (p.used_sessions ?? 0) > 0), [packages]);
  const totalRemainingSessions = useMemo(() => activePackages.reduce((s, p) => s + ((p.total_sessions ?? 0) - (p.used_sessions ?? 0)), 0), [activePackages]);
  const totalBalance = useMemo(() => {
    const charged = clinicPayments.filter((p) => p.method === 'charge').reduce((s, p) => s + p.amount, 0);
    const spent = clinicPayments.filter((p) => p.method !== 'charge').reduce((s, p) => s + p.amount, 0);
    return charged - spent;
  }, [clinicPayments]);

  // Mini calendar
  const monthStart = startOfMonth(TODAY);
  const monthEnd = endOfMonth(TODAY);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const calendarDays = useMemo(() => {
    const days: Date[] = [];
    let d = calStart;
    while (d <= calEnd) {days.push(d);d = addDays(d, 1);}
    return days;
  }, []);

  // Records by date for calendar dots
  const recordDateSet = useMemo(() => new Set(records.map((r) => r.date.slice(0, 10))), [records]);
  // Upcoming cycle dates
  const cycleDateMap = useMemo(() => {
    const map = new Map<string, string>();
    cycles.forEach((c) => {
      const next = addDays(new Date(c.lastTreatmentDate), c.cycleDays);
      map.set(format(next, 'yyyy-MM-dd'), c.treatmentName);
    });
    return map;
  }, [cycles]);

  // Example data for empty state
  const isEmpty = cycles.length === 0 && records.length === 0;
  const exampleUpcoming = isEmpty ? [{ name: '울쎄라 리프팅', daysRemaining: 12 }] : null;

  const handleSave = (record: Omit<TreatmentRecord, 'id'>) => {
    if (editRecord) {
      updateRecord(editRecord.id, record);
    } else {
      addRecord(record);
    }
    setEditRecord(null);
  };

  const seasonMeta = currentSeason ? SEASON_CONFIG[currentSeason] : null;

  if (loading) return <FlowerLoader />;

  return (
    <div className="min-h-screen bg-background">

      {/* ── HEADER with logo background ── */}
      <div className="safe-top relative">
        <img src={logoImg} alt="" className="absolute inset-0 w-full h-full object-cover overflow-hidden" style={{ clipPath: 'inset(0)' }} />
        <div className="absolute inset-0 bg-black/50" style={{ clipPath: 'inset(0)' }} />
        <div className="relative px-5 pt-10 pb-5 space-y-4">

          {/* Row 1: Avatar + Nickname's Bloom Log */}
          <div className="flex items-center gap-3">
            <Popover>
              <PopoverTrigger asChild>
                <button className="focus:outline-none"><BloomAvatar size="md" showDays={false} /></button>
              </PopoverTrigger>
              <PopoverContent
                side="bottom"
                align="start"
                className="w-52 rounded-xl border-0 bg-black/70 backdrop-blur-md text-white p-3 shadow-xl"
              >
                <p className="text-[11px] font-semibold mb-2 text-white/80">🌱 등급 기준</p>
                <ul className="space-y-1 text-[11px]">
                  <li>🌱 씨앗 — 0일</li>
                  <li>🌿 새싹 — 1~7일</li>
                  <li>🌼 봉오리 — 8~30일</li>
                  <li>🌸 반개화 — 31~90일</li>
                  <li>🌺 Bloom — 91일+</li>
                </ul>
                <p className="mt-2 text-[10px] text-white/50">기록한 고유 날짜 수 기준</p>
              </PopoverContent>
            </Popover>
            <div className="flex-1 min-w-0">
              <p className="text-white/60 text-[10px] tracking-wide">It's ​Blooming day!  </p>
              <h1
                className="text-white text-lg font-bold tracking-tight leading-tight"
                style={{ fontFamily: "'Noto Sans KR', sans-serif" }}>
                
                {nickname || '회원'}님의 <span className="text-[hsl(var(--accent))]">Bloom Log</span>
              </h1>
            </div>
          </div>


          {/* Row 3: Management Mode selector */}
          <div className="relative">
            <div
              className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-xl px-3 py-2 cursor-pointer active:bg-white/20 transition-colors"
              onClick={() => setModeDropdownOpen((v) => !v)}>
              
              <span className="text-lg">{seasonMeta?.emoji || '⚙️'}</span>
              <div className="flex-1 min-w-0">
                <p className="text-white/50 text-[10px]">관리 모드</p>
                <p className="text-white text-xs font-semibold">
                  {seasonMeta ? seasonMeta.title : '모드를 선택하세요'}
                </p>
              </div>
              <ChevronDown size={14} className={cn("text-white/40 transition-transform", modeDropdownOpen && "rotate-180")} />
            </div>

            {/* Dropdown */}
            {modeDropdownOpen &&
            <div className="absolute left-0 right-0 top-full mt-1 bg-card/95 backdrop-blur-md rounded-xl shadow-lg border border-border/50 z-50 overflow-hidden">
                {(Object.entries(SEASON_CONFIG) as [SeasonKey, typeof SEASON_CONFIG[SeasonKey]][]).map(([key, cfg]) =>
              <button
                key={key}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50",
                  currentSeason === key && "bg-muted"
                )}
                onClick={() => handleSeasonChange(key)}>
                
                    <span className="text-xl">{cfg.emoji}</span>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-foreground">{cfg.title}</p>
                      <p className="text-[10px] text-muted-foreground">{cfg.sub}</p>
                    </div>
                    {currentSeason === key && <Check size={16} className="text-primary shrink-0" />}
                  </button>
              )}
              </div>
            }
          </div>
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div className="page-content space-y-4 pt-4 pb-28">

        {/* ═══ Stat Cards — 2×2 above calendar ═══ */}
        <div className="grid grid-cols-2 gap-3">
          <Card
            className="border-0 shadow-sm cursor-pointer active:scale-[0.98] transition-transform"
            onClick={() => navigate('/calendar?tab=history')}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[hsl(260,60%,94%)] flex items-center justify-center">
                <span className="text-lg">💉</span>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground">관리중인 시술</p>
                <p className="text-lg font-black text-foreground leading-tight">
                  {cycles.length > 0 ? cycles.length : <span className="opacity-40">0</span>}
                  <span className="text-xs font-medium text-muted-foreground ml-0.5">개</span>
                </p>
              </div>
            </CardContent>
          </Card>

          <Card
            className="border-0 shadow-sm cursor-pointer active:scale-[0.98] transition-transform"
            onClick={() => navigate('/calendar?tab=history')}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[hsl(150,50%,92%)] flex items-center justify-center">
                <span className="text-lg">🏥</span>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground">이용중인 병원</p>
                <p className="text-lg font-black text-foreground leading-tight">
                  {uniqueClinics > 0 ? uniqueClinics : <span className="opacity-40">0</span>}
                  <span className="text-xs font-medium text-muted-foreground ml-0.5">곳</span>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Card
            className="border-0 shadow-sm cursor-pointer active:scale-[0.98] transition-transform"
            onClick={() => navigate('/packages?tab=packages')}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[hsl(30,90%,92%)] flex items-center justify-center">
                <span className="text-lg">🎟️</span>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground">남은 시술 횟수</p>
                <p className="text-lg font-black text-foreground leading-tight">
                  {totalRemainingSessions > 0 ? totalRemainingSessions : <span className="opacity-40">0</span>}
                  <span className="text-xs font-medium text-muted-foreground ml-0.5">회</span>
                </p>
              </div>
            </CardContent>
          </Card>

          <Card
            className="border-0 shadow-sm cursor-pointer active:scale-[0.98] transition-transform"
            onClick={() => navigate('/packages?tab=points')}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[hsl(340,60%,92%)] flex items-center justify-center">
                <span className="text-lg">💰</span>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground">잔여 포인트</p>
                <p className="text-lg font-black text-foreground leading-tight">
                  {totalBalance > 0 ? `${totalBalance.toLocaleString()}` : <span className="opacity-40">0</span>}
                  <span className="text-xs font-medium text-muted-foreground ml-0.5">원</span>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ═══ Mini Calendar ═══ */}
        <Card className="border-0 shadow-sm overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-bold text-foreground">{format(TODAY, 'yyyy년 M월', { locale: ko })}</p>
              <button
                onClick={() => navigate('/calendar')}
                className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                전체보기 <ChevronRight size={10} />
              </button>
            </div>

            <div className="grid grid-cols-7 mb-1">
              {WEEKDAYS.map((d) =>
              <div key={d} className="text-center text-[10px] text-muted-foreground font-medium py-1">{d}</div>
              )}
            </div>

            <div className="grid grid-cols-7">
              {calendarDays.map((day, i) => {
                const dateStr = format(day, 'yyyy-MM-dd');
                const inMonth = isSameMonth(day, TODAY);
                const isToday2 = isSameDay(day, TODAY);
                const hasRecord = recordDateSet.has(dateStr);
                const cycleLabel = cycleDateMap.get(dateStr);

                return (
                  <div key={i} className="flex flex-col items-center py-1">
                    <span className={cn(
                      "w-7 h-7 flex items-center justify-center rounded-full text-xs",
                      !inMonth && "opacity-30",
                      isToday2 && "bg-primary text-primary-foreground font-bold",
                      hasRecord && !isToday2 && "bg-[#FF7F7F]/40",
                      cycleLabel && !isToday2 && !hasRecord && "ring-1 ring-primary/30"
                    )}>
                      {format(day, 'd')}
                    </span>
                    {cycleLabel && inMonth &&
                    <div className="w-1 h-1 rounded-full bg-primary mt-0.5" />
                    }
                  </div>);
              })}
            </div>

            {upcomingIn2w.length > 0 ?
            <div className="mt-3 space-y-1.5 border-t border-border/50 pt-3">
                {upcomingIn2w.slice(0, 3).map(({ c, daysRemaining }) =>
              <div key={c.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={cn("h-2 w-2 rounded-full shrink-0",
                  daysRemaining <= 7 ? 'bg-amber-400' : 'bg-primary'
                  )} />
                      <span className="text-xs font-medium truncate text-foreground">{c.treatmentName}</span>
                    </div>
                    <span className={cn("text-xs font-bold shrink-0",
                daysRemaining <= 7 ? 'text-amber-500' : 'text-primary'
                )}>
                      {daysRemaining === 0 ? '오늘' : `D-${daysRemaining}`}
                    </span>
                  </div>
              )}
              </div> :
            exampleUpcoming ?
            <div className="mt-3 space-y-1.5 border-t border-border/50 pt-3 opacity-50">
                {exampleUpcoming.map((item, i) =>
              <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-primary" />
                      <span className="text-xs font-medium text-foreground">{item.name}</span>
                    </div>
                    <span className="text-xs font-bold text-primary">D-{item.daysRemaining}</span>
                  </div>
              )}
                <p className="text-[10px] text-muted-foreground">예시 · 시술을 기록하면 자동 생성돼요</p>
              </div> :
            null}
          </CardContent>
        </Card>

        {/* ═══ Today's Condition Log ═══ */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <p className="text-sm font-bold text-foreground mb-3">오늘의 컨디션 기록</p>
            <p className="text-[10px] text-muted-foreground mb-3">
              {format(TODAY, 'M월 d일 (EEEE)', { locale: ko })} · 오늘 피부 컨디션은 어떤가요?
            </p>

            {/* Condition emoji selector */}
            <div className="flex items-center justify-between gap-1 mb-3">
              {CONDITION_OPTIONS.map((opt) =>
              <button
                key={opt.value}
                className={cn(
                  "flex-1 flex flex-col items-center gap-1 py-2.5 rounded-xl transition-all text-center",
                  todayCondition === opt.value ?
                  "bg-primary/10 ring-2 ring-primary/30 scale-105" :
                  "bg-muted/50 hover:bg-muted"
                )}
                onClick={() => setTodayCondition(todayCondition === opt.value ? null : opt.value)}>
                
                  <span className="text-xl">{opt.emoji}</span>
                  <span className="text-[10px] font-medium text-foreground">{opt.label}</span>
                </button>
              )}
            </div>

            {/* Memo + Save */}
            {todayCondition &&
            <div className="space-y-2">
                <textarea
                className="w-full text-xs bg-muted/30 border border-border/50 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-primary/30"
                placeholder="오늘 피부 상태 메모 (선택)"
                rows={2}
                value={conditionMemo}
                onChange={(e) => setConditionMemo(e.target.value)} />
              
                <button
                className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold active:scale-[0.98] transition-transform"
                onClick={async () => {
                  // Save as treatment record with type "condition"
                  await addRecord({
                    date: format(TODAY, 'yyyy-MM-dd'),
                    treatmentName: '컨디션 기록',
                    treatmentId: undefined,
                    packageId: '',
                    skinLayer: 'epidermis',
                    bodyArea: 'face',
                    clinic: '-',
                    satisfaction: todayCondition as 1 | 2 | 3 | 4 | 5,
                    memo: conditionMemo || `컨디션: ${CONDITION_OPTIONS.find((o) => o.value === todayCondition)?.label}`,
                    notes: '일일 컨디션 기록'
                  });
                  setTodayCondition(null);
                  setConditionMemo('');
                }}>
                
                  컨디션 기록하기
                </button>
              </div>
            }
          </CardContent>
        </Card>

        {/* ═══ Recent Records ═══ */}
        {records.length > 0 &&
        <div>
            <div className="flex items-center justify-between px-1 mb-2.5">
              <h2 className="text-sm font-bold flex items-center gap-1.5">
                <Star className="h-3.5 w-3.5 text-[hsl(var(--accent))]" />
                최근 기록
              </h2>
              <button onClick={() => navigate('/calendar?tab=history')} className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                전체보기 <ChevronRight size={10} />
              </button>
            </div>
            <div className="space-y-2">
              {records.slice(0, 3).map((r) =>
            <Card key={r.id} className="glass-card">
                  <CardContent className="p-3.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-semibold text-foreground">{r.treatmentName}</span>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {format(new Date(r.date), 'yyyy.MM.dd')} · {r.clinic}
                        </p>
                        {r.memo && <p className="text-[11px] text-muted-foreground mt-1 line-clamp-1">{r.memo}</p>}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {r.satisfaction &&
                    <span className="text-xs text-[hsl(var(--accent))] font-medium">
                            {'★'.repeat(r.satisfaction)}
                          </span>
                    }
                      </div>
                    </div>
                  </CardContent>
                </Card>
            )}
            </div>
          </div>
        }
      </div>

      {parseModalOpen && <ParseTreatmentModal onClose={() => setParseModalOpen(false)} />}
      <AddTreatmentModal
        open={modalOpen}
        onClose={() => {setModalOpen(false);setEditRecord(null);}}
        onSave={handleSave}
        editRecord={editRecord}
        onOpenParse={() => {setModalOpen(false);setParseModalOpen(true);}} />
      
      <OnboardingFlow open={onboardingOpen} onClose={handleCloseOnboarding} />

      {/* Privacy Consent Modal for OAuth users */}
      {privacyConsentOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="bg-background rounded-2xl p-6 w-full max-w-sm space-y-4 shadow-xl">
            <div className="text-center space-y-1">
              <div className="text-2xl">🌸</div>
              <h2 className="font-bold text-base">{t('privacy_title') || '서비스 이용 전 확인해주세요'}</h2>
              <p className="text-xs text-muted-foreground">
                {t('privacy_subtitle') || 'Bloomlog는 시술 기록을 안전하게 보관합니다'}
              </p>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed border rounded-lg p-3 bg-muted/30">
              {t('privacy_sensitive_notice') || '시술 기록은 건강에 관한 민감정보입니다. 본인 동의 하에만 수집되며, 서비스 제공 외 목적으로 사용되지 않습니다.'}
            </p>
            <div className="space-y-3">
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={privacyAgreePolicy}
                  onChange={e => setPrivacyAgreePolicy(e.target.checked)}
                  className="mt-0.5 accent-primary"
                />
                <span className="text-xs leading-relaxed">
                  {t('privacy_agree_policy') || '[필수] 개인정보처리방침에 동의합니다'}
                  {' '}
                  <a href="/privacy" target="_blank" className="underline text-primary">
                    {t('privacy_view_full') || '전문 보기'}
                  </a>
                </span>
              </label>
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={privacyAgreeAge}
                  onChange={e => setPrivacyAgreeAge(e.target.checked)}
                  className="mt-0.5 accent-primary"
                />
                <span className="text-xs">{t('privacy_agree_age') || '[필수] 만 14세 이상입니다'}</span>
              </label>
            </div>
            <button
              onClick={handlePrivacyConsent}
              disabled={!privacyAgreePolicy || !privacyAgreeAge}
              className="w-full py-3 rounded-xl text-sm font-semibold bg-primary text-primary-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
            >
              {t('privacy_start') || '동의하고 시작하기'}
            </button>
          </div>
        </div>
      )}
    </div>);

};

export default Index;
