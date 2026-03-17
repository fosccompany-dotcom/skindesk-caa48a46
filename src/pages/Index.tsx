import { useState, useMemo, useEffect, useRef } from 'react';
import { ChevronRight, ChevronDown, ChevronLeft, CalendarDays, Stethoscope, Hospital, Package, Wallet, Star, Trash2, Pencil, Check, Plus, ClipboardList, CalendarPlus, Globe } from 'lucide-react';
import BloomAvatar from '@/components/BloomAvatar';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Sheet, SheetContent } from '@/components/ui/sheet';

import { useCycles } from '@/context/CyclesContext';
import { useRecords } from '@/context/RecordsContext';
import FlowerLoader from '@/components/FlowerLoader';
import { useLanguage } from '@/i18n/LanguageContext';
import { Language, LANGUAGE_LABELS } from '@/i18n/translations';
import { TreatmentCycle, TreatmentRecord } from '@/types/skin';
import { differenceInDays, format, addDays, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isSameMonth, isSameDay, setMonth, setYear } from 'date-fns';
import { ko } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import AddTreatmentModal from '@/components/AddTreatmentModal';
import AddReservationModal from '@/components/AddReservationModal';
import ParseTreatmentModal from '@/components/ParseTreatmentModal';
import OnboardingFlow from '@/components/OnboardingFlow';
import { supabase } from '@/integrations/supabase/client';
import { useSeason, SeasonKey } from '@/context/SeasonContext';
import LoginRequiredSheet from '@/components/LoginRequiredSheet';
import { useLoginGuard } from '@/hooks/useLoginGuard';
import logoImg from '@/assets/logo.png';
import { getBloomInfo, getActiveDays, STAGES } from '@/utils/bloomLevel';

interface Reservation {
  id: string;
  date: string;
  time: string | null;
  treatment_name: string;
  clinic: string;
  memo: string | null;
  body_area: string | null;
  skin_layer: string | null;
}

const SEASON_CONFIG: Record<SeasonKey, {emoji: string;title: string;sub: string;color: string;bg: string;}> = {
  reset: { emoji: '🌵', title: 'Reset Mode', sub: '피부 리셋 모드', color: 'hsl(var(--sage))', bg: 'bg-sage-light' },
  recovery: { emoji: '🌿', title: 'Recovery Mode', sub: '회복 모드', color: 'hsl(var(--sage-dark))', bg: 'bg-sage-light' },
  maintain: { emoji: '💜', title: 'Maintain Mode', sub: '유지 모드', color: 'hsl(var(--secondary))', bg: 'bg-warm' },
  boost: { emoji: '🌹', title: 'Boost Mode', sub: '관리 끌올 모드', color: 'hsl(var(--rose))', bg: 'bg-rose-light' },
  special: { emoji: '🌸', title: 'Special Mode', sub: '스페셜 모드', color: 'hsl(var(--rose))', bg: 'bg-warm' }
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
  const { t, language, setLanguage } = useLanguage();
  const [langOpen, setLangOpen] = useState(false);
  const langDropdownRef = useRef<HTMLDivElement>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<TreatmentRecord | null>(null);
  const [parseModalOpen, setParseModalOpen] = useState(false);
  const { currentSeason, setCurrentSeason } = useSeason();
  const { nickname } = useSeason();
  const [modeDropdownOpen, setModeDropdownOpen] = useState(false);
  const { showLoginSheet, guardAction, handleLoginSuccess, handleClose: handleLoginClose } = useLoginGuard();
  const [packages, setPackages] = useState<{id: string;name: string;total_sessions: number;used_sessions: number;clinic: string;expiry_date: string | null;}[]>([]);
  const [clinicPayments, setClinicPayments] = useState<{amount: number;method: string;}[]>([]);
  const [todayCondition, setTodayCondition] = useState<number | null>(null);
  const [conditionMemo, setConditionMemo] = useState('');
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showActionPicker, setShowActionPicker] = useState(false);
  const [showHomeAddModal, setShowHomeAddModal] = useState(false);
  const [showHomeReservationModal, setShowHomeReservationModal] = useState(false);
  const [reservationRefresh, setReservationRefresh] = useState(0);
  const [calendarMonth, setCalendarMonth] = useState(TODAY);
  const [yearMonthPickerOpen, setYearMonthPickerOpen] = useState(false);

  // 언어 드롭다운 외부 클릭 닫기
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (langDropdownRef.current && !langDropdownRef.current.contains(e.target as Node)) {
        setLangOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const activeDays = getActiveDays(records);
  const bloom = getBloomInfo(activeDays);

  // Wilting: 48h+ since last record
  const lastRecordDateStr = records.length > 0
    ? records.reduce((max, r) => (r.date > max ? r.date : max), records[0].date)
    : null;
  const isWilting = lastRecordDateStr
    ? differenceInDays(TODAY, new Date(lastRecordDateStr)) >= 2
    : false;

  // Bloom progress
  const remaining = bloom.nextMilestone ? bloom.nextMilestone - activeDays : 0;
  const stageMin = STAGES[bloom.stage].min;
  const stageMax = bloom.nextMilestone || stageMin;
  const progressPct = stageMax > stageMin
    ? Math.min(((activeDays - stageMin) / (stageMax - stageMin)) * 100, 100)
    : 100;

  // Reward feedback
  const [showReward, setShowReward] = useState(false);

  useEffect(() => {
    const loadDashboard = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const [payRes, pkgRes, resRes] = await Promise.all([
        supabase.from('payment_records').select('amount,method').eq('user_id', user.id),
        supabase.from('treatment_packages').select('id,name,total_sessions,used_sessions,clinic,expiry_date').eq('user_id', user.id),
        supabase.from('reservations').select('id,date,time,treatment_name,clinic,memo,body_area,skin_layer').eq('user_id', user.id).order('date', { ascending: false }),
      ]);
      if (payRes.data) setClinicPayments(payRes.data);
      if (pkgRes.data) setPackages(pkgRes.data);
      if (resRes.data) setReservations(resRes.data as Reservation[]);
    };
    loadDashboard();
  }, [records, reservationRefresh]);

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
  const monthStart = startOfMonth(calendarMonth);
  const monthEnd = endOfMonth(calendarMonth);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const calendarDays = useMemo(() => {
    const days: Date[] = [];
    let d = calStart;
    while (d <= calEnd) {days.push(d);d = addDays(d, 1);}
    return days;
  }, [calendarMonth]);

  // Records by date for calendar dots
  const recordDateSet = useMemo(() => new Set(records.map((r) => r.date.slice(0, 10))), [records]);
  const reservationDateSet = useMemo(() => new Set(reservations.map((r) => r.date.slice(0, 10))), [reservations]);
  // Records & reservations by date
  const recordsByDate = useMemo(() => {
    const map: Record<string, TreatmentRecord[]> = {};
    records.forEach(r => { const d = r.date.slice(0, 10); if (!map[d]) map[d] = []; map[d].push(r); });
    return map;
  }, [records]);
  const reservationsByDate = useMemo(() => {
    const map: Record<string, Reservation[]> = {};
    reservations.forEach(r => { const d = r.date.slice(0, 10); if (!map[d]) map[d] = []; map[d].push(r); });
    return map;
  }, [reservations]);

  // Default selected date: most recent reservation or record date
  const defaultInfoDate = useMemo(() => {
    const recentReservation = reservations.find(r => r.date >= format(TODAY, 'yyyy-MM-dd'));
    if (recentReservation) return recentReservation.date.slice(0, 10);
    if (records.length > 0) return records[0].date.slice(0, 10);
    return null;
  }, [reservations, records]);

  const activeSelectedDate = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : defaultInfoDate;
  const selectedRecords = activeSelectedDate ? (recordsByDate[activeSelectedDate] || []) : [];
  const selectedReservations = activeSelectedDate ? (reservationsByDate[activeSelectedDate] || []) : [];
  const hasSelectedInfo = selectedRecords.length > 0 || selectedReservations.length > 0;

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

  // Expiry reminder events: 30, 20, 10 days before expiry_date
  const expiryEvents = useMemo(() => {
    const events: { date: string; name: string; expiryDate: string; daysLeft: number }[] = [];
    packages.forEach((pkg) => {
      if (!pkg.expiry_date) return;
      const remaining = (pkg.total_sessions ?? 0) - (pkg.used_sessions ?? 0);
      if (remaining <= 0) return;
      const expiry = new Date(pkg.expiry_date);
      [30, 20, 10].forEach((daysBefore) => {
        const reminderDate = addDays(expiry, -daysBefore);
        if (reminderDate >= TODAY || daysBefore <= 10) {
          const daysLeft = differenceInDays(expiry, TODAY);
          if (daysLeft >= 0 && daysLeft <= 30) {
            events.push({
              date: format(reminderDate, 'yyyy-MM-dd'),
              name: pkg.name,
              expiryDate: format(expiry, 'M월 d일'),
              daysLeft: daysBefore,
            });
          }
        }
      });
    });
    return events;
  }, [packages]);

  const expiryDateSet = useMemo(() => new Set(expiryEvents.map((e) => e.date)), [expiryEvents]);
  const expiryByDate = useMemo(() => {
    const map: Record<string, typeof expiryEvents> = {};
    expiryEvents.forEach((e) => {
      if (!map[e.date]) map[e.date] = [];
      map[e.date].push(e);
    });
    return map;
  }, [expiryEvents]);

  // Example expiry for empty state
  const exampleExpiryDate = useMemo(() => {
    if (!isEmpty) return null;
    return format(addDays(TODAY, 8), 'yyyy-MM-dd');
  }, [isEmpty]);

  const handleSave = async (record: Omit<TreatmentRecord, 'id'>) => {
    if (editRecord) {
      updateRecord(editRecord.id, record);
    } else {
      await addRecord(record);
    }
    setEditRecord(null);
    setShowReward(true);
    setTimeout(() => setShowReward(false), 2500);
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

          {/* Language selector */}
          <div className="absolute top-3 right-4 z-20" ref={langDropdownRef}>
            <button
              onClick={() => setLangOpen((prev) => !prev)}
              className="h-8 w-8 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center hover:bg-white/25 transition-colors">
              <Globe className="h-4 w-4 text-white/80" />
            </button>
            {langOpen && (
              <div className="absolute right-0 top-full mt-1 z-50 bg-popover border border-border rounded-xl shadow-lg overflow-hidden min-w-[120px]">
                {(['ko', 'en', 'zh'] as Language[]).map((lang) => (
                  <button
                    key={lang}
                    onClick={() => { setLanguage(lang); setLangOpen(false); }}
                    className={cn(
                      'w-full text-left px-4 py-2.5 text-xs font-medium transition-colors',
                      language === lang ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-muted'
                    )}>
                    {LANGUAGE_LABELS[lang]}
                  </button>
                ))}
              </div>
            )}
          </div>

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
                <p className="text-[11px] font-semibold mb-2 text-white/80">🌱 나의 Bloom</p>
                <div className="space-y-1.5 text-[11px]">
                  <p className="text-[#F2C94C] font-semibold">
                    현재: {bloom.emoji} {bloom.name} ({activeDays}건)
                  </p>
                  {bloom.nextMilestone !== null && (
                    <p className="text-white/90">
                      다음: {STAGES[bloom.stage + 1].emoji} {STAGES[bloom.stage + 1].name} ({bloom.nextMilestone}건)
                    </p>
                  )}
                  {bloom.nextMilestone === null && (
                    <p className="text-white/90">✨ 최고 등급 달성!</p>
                  )}
                </div>
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
              onClick={() => guardAction(() => setModeDropdownOpen((v) => !v))}>
              
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
      <div className="page-content space-y-4 pt-4 pb-40">

        {/* ═══ Bloom Progress Card ═══ */}
        <Card className="border-0 shadow-sm overflow-hidden">
          <CardContent className="p-4 space-y-3">
            {/* Wilting or action message */}
            {isWilting ? (
              <p className="text-sm font-semibold text-center text-muted-foreground">
                🥀 조금 시들고 있어요… 다시 기록해볼까요?
              </p>
            ) : bloom.stage === 0 ? (
              <p className="text-sm font-semibold text-center">
                🌱 첫번째 기록을 완료하면 바로 새싹이 돋아나요!
              </p>
            ) : remaining > 0 ? (
              <p className="text-sm font-semibold text-center">
                🌸 {remaining}번만 더 기록하면 {STAGES[bloom.stage + 1]?.name || 'Bloom'} 완성
              </p>
            ) : (
              <p className="text-sm font-semibold text-center">
                ✨ 축하해요! 최고 단계를 달성했어요
              </p>
            )}

            {/* Stage indicators: current + next highlighted, rest dimmed */}
            <div className="flex items-center justify-center gap-3">
              {STAGES.map((s, idx) => (
                <div
                  key={idx}
                  className={cn(
                    "flex items-center gap-1 transition-all duration-300",
                    idx === bloom.stage
                      ? "opacity-100 scale-110"
                      : idx === bloom.stage + 1
                      ? "opacity-70"
                      : "opacity-20"
                  )}
                >
                  <span className={cn("text-base", idx === bloom.stage && "text-xl")}>{s.emoji}</span>
                  {(idx === bloom.stage || idx === bloom.stage + 1) && (
                    <span className={cn(
                      "text-[10px]",
                      idx === bloom.stage ? "font-bold text-foreground" : "font-medium text-muted-foreground"
                    )}>
                      {s.name}
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* Animated progress bar with glow */}
            <div className="relative">
              <div className="relative h-3 w-full overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full rounded-full transition-all duration-1000 ease-out"
                  style={{
                    width: `${progressPct}%`,
                    background: 'linear-gradient(90deg, hsl(var(--primary)/0.6), hsl(var(--primary)), hsl(var(--rose)))',
                  }}
                />
                {/* Glow at Bloom endpoint */}
                <div
                  className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full animate-pulse"
                  style={{ background: 'radial-gradient(circle, hsl(var(--primary)/0.5), transparent)' }}
                />
              </div>
              {/* Current position dot */}
              {progressPct < 100 && (
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 shadow-sm transition-all duration-1000 ease-out"
                  style={{
                    left: `calc(${progressPct}% - 6px)`,
                    backgroundColor: 'hsl(var(--primary))',
                    borderColor: 'hsl(var(--primary-foreground))',
                    boxShadow: '0 0 6px hsl(var(--primary)/0.5)',
                  }}
                />
              )}
            </div>
          </CardContent>
        </Card>

        {/* ═══ Mini Calendar (moved to top) ═══ */}
        <Card className="border-0 shadow-sm overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <button
                onClick={() => setCalendarMonth(prev => subMonths(prev, 1))}
                className="p-1.5 rounded-lg hover:bg-muted transition-colors"
              >
                <ChevronLeft size={16} className="text-muted-foreground" />
              </button>

              <div className="relative">
                <button
                  onClick={() => setYearMonthPickerOpen(v => !v)}
                  className="text-sm font-bold text-foreground hover:text-primary transition-colors flex items-center gap-1"
                >
                  {format(calendarMonth, 'yyyy년 M월', { locale: ko })}
                  <ChevronDown size={12} className={cn("transition-transform", yearMonthPickerOpen && "rotate-180")} />
                </button>

                {yearMonthPickerOpen && (
                  <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 z-50 bg-card border border-border rounded-xl shadow-lg p-3 w-[260px]">
                    {/* Year selector */}
                    <div className="flex items-center justify-between mb-3">
                      <button onClick={() => setCalendarMonth(prev => setYear(prev, prev.getFullYear() - 1))} className="p-1 rounded hover:bg-muted">
                        <ChevronLeft size={14} />
                      </button>
                      <span className="text-sm font-bold">{calendarMonth.getFullYear()}년</span>
                      <button onClick={() => setCalendarMonth(prev => setYear(prev, prev.getFullYear() + 1))} className="p-1 rounded hover:bg-muted">
                        <ChevronRight size={14} />
                      </button>
                    </div>
                    {/* Month grid */}
                    <div className="grid grid-cols-4 gap-1.5">
                      {Array.from({ length: 12 }, (_, i) => (
                        <button
                          key={i}
                          onClick={() => {
                            setCalendarMonth(prev => setMonth(setYear(prev, calendarMonth.getFullYear()), i));
                            setYearMonthPickerOpen(false);
                          }}
                          className={cn(
                            "py-1.5 rounded-lg text-xs font-medium transition-colors",
                            calendarMonth.getMonth() === i
                              ? "bg-primary text-primary-foreground"
                              : "hover:bg-muted text-foreground"
                          )}
                        >
                          {i + 1}월
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={() => setCalendarMonth(prev => addMonths(prev, 1))}
                className="p-1.5 rounded-lg hover:bg-muted transition-colors"
              >
                <ChevronRight size={16} className="text-muted-foreground" />
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
                const inMonth = isSameMonth(day, calendarMonth);
                const isToday2 = isSameDay(day, TODAY);
                const hasRecord = recordDateSet.has(dateStr);
                const hasReservation = reservationDateSet.has(dateStr);
                const cycleLabel = cycleDateMap.get(dateStr);
                const hasExpiry = expiryDateSet.has(dateStr) || (isEmpty && dateStr === exampleExpiryDate);
                const isSelected = activeSelectedDate === dateStr;

                return (
                  <button
                    key={i}
                    onClick={() => setSelectedDate(day)}
                    className={cn(
                      "flex flex-col items-center py-1 transition-colors",
                      !inMonth && "opacity-30"
                    )}
                  >
                    <span className={cn(
                      "w-7 h-7 flex items-center justify-center rounded-full text-xs transition-all",
                      isSelected && "bg-primary text-primary-foreground font-bold",
                      !isSelected && isToday2 && "bg-primary/20 text-primary font-semibold",
                      !isSelected && hasRecord && !isToday2 && "bg-[#FF7F7F]/40",
                      !isSelected && hasExpiry && !isToday2 && !hasRecord && "bg-[hsl(var(--destructive))]/15",
                      !isSelected && cycleLabel && !isToday2 && !hasRecord && !hasExpiry && "ring-1 ring-primary/30"
                    )}>
                      {format(day, 'd')}
                    </span>
                    <div className="flex gap-0.5 mt-0.5 h-1.5 items-center">
                      {hasRecord && <div className="w-1 h-1 rounded-full bg-[#C9A96E]" />}
                      {hasReservation && <div className="w-1 h-1 rounded-full bg-info" />}
                      {hasExpiry && <div className="w-1 h-1 rounded-full bg-destructive" />}
                      {cycleLabel && inMonth && !hasRecord && !hasReservation && !hasExpiry && <div className="w-1 h-1 rounded-full bg-primary" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* ═══ Selected Date Info ═══ */}
        {activeSelectedDate && (
          <div className="space-y-2">
            <p className="text-xs font-bold text-foreground flex items-center gap-1.5 px-1">
              <CalendarDays className="h-3.5 w-3.5 text-primary" />
              {format(new Date(activeSelectedDate + 'T00:00:00'), 'M월 d일 (EEEE)', { locale: ko })}
            </p>

            {/* Expiry reminders */}
            {(expiryByDate[activeSelectedDate] || []).map((ev, idx) => (
              <Card key={`expiry-${idx}`} className="border-0 shadow-sm border-l-2 border-l-destructive">
                <CardContent className="p-3.5 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-destructive/10 flex items-center justify-center shrink-0">
                    <span className="text-base">⏰</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{ev.name}</p>
                    <p className="text-[11px] text-destructive font-medium mt-0.5">
                      {ev.expiryDate}에 유효기간 만료 (D-{ev.daysLeft})
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Example expiry for empty state */}
            {isEmpty && activeSelectedDate === exampleExpiryDate && (
              <Card className="border-0 shadow-sm border-l-2 border-l-destructive opacity-60">
                <CardContent className="p-3.5 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-destructive/10 flex items-center justify-center shrink-0">
                    <span className="text-base">⏰</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">시술권 유효기간이 곧 끝나요!</p>
                    <p className="text-[11px] text-destructive font-medium mt-0.5">
                      {format(addDays(TODAY, 8), 'M월 d일')}에 만료 예정 (예시)
                    </p>
                  </div>
                  <span className="text-[9px] font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full shrink-0">예시</span>
                </CardContent>
              </Card>
            )}

            {/* Reservations */}
            {selectedReservations.map((res) => (
              <Card key={res.id} className="border-0 shadow-sm">
                <CardContent className="p-3.5 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-info/10 flex items-center justify-center shrink-0">
                    <CalendarPlus className="h-4 w-4 text-info" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{res.treatment_name}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {res.clinic}{res.time ? ` · ${res.time}` : ''}
                    </p>
                  </div>
                  <span className="text-[10px] font-medium text-info bg-info/10 px-2 py-0.5 rounded-full shrink-0">예약</span>
                </CardContent>
              </Card>
            ))}

            {/* Treatment records */}
            {selectedRecords.map((r) => (
              <Card key={r.id} className="border-0 shadow-sm">
                <CardContent className="p-3.5 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Stethoscope className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{r.treatmentName}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{r.clinic}</p>
                  </div>
                  {r.satisfaction && (
                    <span className="text-xs text-[hsl(var(--accent))] font-medium shrink-0">
                      {'★'.repeat(r.satisfaction)}
                    </span>
                  )}
                </CardContent>
              </Card>
            ))}

            {/* Empty state for selected date */}
            {!hasSelectedInfo && selectedDate && !expiryByDate[activeSelectedDate]?.length && !(isEmpty && activeSelectedDate === exampleExpiryDate) && (
              <button
                onClick={() => guardAction(() => setShowActionPicker(true))}
                className="w-full text-left"
              >
                <div className="rounded-2xl border border-dashed border-primary/30 bg-primary/5 p-5 text-center hover:bg-primary/10 transition-colors active:scale-[0.98]">
                  <Plus className="h-5 w-5 text-primary mx-auto mb-2" />
                  <p className="text-xs font-semibold text-foreground">이 날짜에 기록이 없어요</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    탭하여 <span className="font-bold text-primary">{format(selectedDate, 'M월 d일')}</span>에 추가하세요
                  </p>
                </div>
              </button>
            )}
          </div>
        )}

        {/* ═══ Stat Cards — 2×2 below calendar ═══ */}
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
                   setShowReward(true);
                   setTimeout(() => setShowReward(false), 2500);
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

      {/* Action Picker Sheet for home calendar */}
      <Sheet open={showActionPicker} onOpenChange={setShowActionPicker}>
        <SheetContent side="bottom" className="rounded-t-3xl px-5 pb-8 pt-4">
          <div className="mx-auto w-10 h-1 rounded-full bg-muted-foreground/20 mb-5" />
          <p className="text-center text-base font-semibold mb-1">
            <span className="text-primary">{selectedDate ? format(selectedDate, 'M월 d일') : ''}</span>을 선택하셨어요
          </p>
          <p className="text-center text-sm text-muted-foreground mb-6">무엇을 추가하시겠어요?</p>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => { setShowActionPicker(false); setShowHomeReservationModal(true); }}
              className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-5 hover:bg-accent/50 active:scale-[0.97] transition-all"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-info/10">
                <CalendarPlus className="h-6 w-6 text-info" />
              </div>
              <span className="text-sm font-semibold">예약 일정 추가</span>
            </button>
            <button
              onClick={() => { setShowActionPicker(false); setShowHomeAddModal(true); }}
              className="flex flex-col items-center gap-3 rounded-2xl border border-primary/30 bg-primary/5 p-5 hover:bg-primary/10 active:scale-[0.97] transition-all"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <ClipboardList className="h-6 w-6 text-primary" />
              </div>
              <span className="text-sm font-semibold">시술 내역 추가</span>
            </button>
          </div>
        </SheetContent>
      </Sheet>

      <AddTreatmentModal
        open={showHomeAddModal}
        onClose={() => setShowHomeAddModal(false)}
        onSave={async (record) => { await addRecord(record); setShowReward(true); setTimeout(() => setShowReward(false), 2500); }}
        defaultDate={selectedDate ? format(selectedDate, 'yyyy-MM-dd') : undefined}
      />

      <AddReservationModal
        open={showHomeReservationModal}
        onClose={() => { setShowHomeReservationModal(false); setReservationRefresh(v => v + 1); }}
        defaultDate={selectedDate ? format(selectedDate, 'yyyy-MM-dd') : undefined}
      />

      {parseModalOpen && <ParseTreatmentModal onClose={() => setParseModalOpen(false)} />}
      <AddTreatmentModal
        open={modalOpen}
        onClose={() => {setModalOpen(false);setEditRecord(null);}}
        onSave={handleSave}
        editRecord={editRecord}
        onOpenParse={() => {setModalOpen(false);setParseModalOpen(true);}} />
      
      <OnboardingFlow open={onboardingOpen} onClose={handleCloseOnboarding} />

      {/* Privacy Consent Modal for OAuth users */}
      <LoginRequiredSheet
        open={showLoginSheet}
        onClose={handleLoginClose}
        onLoginSuccess={handleLoginSuccess}
      />

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
      {/* ═══ Sticky CTA ═══ */}
      <div className="fixed bottom-20 left-0 right-0 z-40 px-4 pb-2">
        <button
          onClick={() => guardAction(() => setModalOpen(true))}
          className="w-full py-3.5 rounded-2xl bg-primary text-primary-foreground text-sm font-bold shadow-lg active:scale-[0.98] transition-all"
          style={{ boxShadow: '0 -2px 20px hsl(var(--primary)/0.3)' }}
        >
          + 오늘의 Bloom 기록하기 🌱
        </button>
      </div>

      {/* ═══ Reward Feedback Overlay ═══ */}
      {showReward && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none animate-fade-in">
          <div className="bg-black/70 backdrop-blur-md text-white rounded-2xl px-8 py-6 text-center space-y-2 animate-scale-in">
            <span className="text-4xl block animate-bounce">🌱</span>
            <p className="text-sm font-semibold">좋아요, 한 걸음 더 🌱</p>
          </div>
        </div>
      )}
    </div>);

};

export default Index;
