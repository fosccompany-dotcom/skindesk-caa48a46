import { useState, useMemo, useEffect, useRef } from "react";
import {
  ChevronRight,
  ChevronDown,
  ChevronLeft,
  CalendarDays,
  Stethoscope,
  Hospital,
  Package,
  Wallet,
  Star,
  Trash2,
  Pencil,

  Plus,
  ClipboardList,
  CalendarPlus,
  Globe } from
"lucide-react";
import BloomAvatar from "@/components/BloomAvatar";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Sheet, SheetContent } from "@/components/ui/sheet";

import { useCycles } from "@/context/CyclesContext";
import { useRecords } from "@/context/RecordsContext";
import FlowerLoader from "@/components/FlowerLoader";
import { useLanguage } from "@/i18n/LanguageContext";
import { Language, LANGUAGE_LABELS } from "@/i18n/translations";
import { TreatmentCycle, TreatmentRecord } from "@/types/skin";
import {
  differenceInDays,
  format,
  addDays,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  isSameMonth,
  isSameDay,
  setMonth,
  setYear } from
"date-fns";
import { ko as koLocale } from "date-fns/locale";
import { enUS as enLocale } from "date-fns/locale";
import { zhCN as zhLocale } from "date-fns/locale";
import { cn } from "@/lib/utils";
import AddTreatmentModal from "@/components/AddTreatmentModal";
import AddReservationModal from "@/components/AddReservationModal";
import EditReservationSheet from "@/components/EditReservationSheet";
import ParseTreatmentModal from "@/components/ParseTreatmentModal";
import OnboardingFlow from "@/components/OnboardingFlow";
import { supabase } from "@/integrations/supabase/client";
import { useSeason } from "@/context/SeasonContext";
import LoginRequiredSheet from "@/components/LoginRequiredSheet";
import { useLoginGuard } from "@/hooks/useLoginGuard";
import { useAuth } from "@/context/AuthContext";

import logoImg from "@/assets/logo.png";
import { getBloomInfo, getActiveDays, STAGES } from "@/utils/bloomLevel";

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


const TODAY = new Date();
const CONDITION_KEYS = [
{ emoji: "🏭", key: "condition_oily" as const, value: 5 },
{ emoji: "🌊", key: "condition_moist" as const, value: 4 },
{ emoji: "🌤️", key: "condition_clear" as const, value: 3 },
{ emoji: "🌵", key: "condition_dry" as const, value: 2 },
{ emoji: "🏜️", key: "condition_desert" as const, value: 1 }];


function getCycleStatus(cycle: TreatmentCycle) {
  const lastDate = new Date(cycle.lastTreatmentDate);
  const nextDate = addDays(lastDate, cycle.cycleDays);
  const daysElapsed = differenceInDays(TODAY, lastDate);
  const daysRemaining = differenceInDays(nextDate, TODAY);
  const progress = Math.min(daysElapsed / cycle.cycleDays * 100, 100);
  let status: "good" | "upcoming" | "overdue";
  if (daysRemaining > 14) status = "good";else
  if (daysRemaining > 0) status = "upcoming";else
  status = "overdue";
  return { daysElapsed, daysRemaining, progress, nextDate, status };
}

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // quiz_completed_at이 NULL이면 퀴즈로 리다이렉트
  useEffect(() => {
    if (!user) return;
    supabase.
    from('user_profiles').
    select('quiz_completed_at').
    eq('id', user.id).
    single().
    then(({ data }) => {
      if (data && !data.quiz_completed_at) {
        navigate('/quiz', { replace: true });
      }
    });
  }, [user, navigate]);
  const [searchParams, setSearchParams] = useSearchParams();
  const { cycles } = useCycles();
  const { records, loading, addRecord, updateRecord, deleteRecord } = useRecords();
  const { t, language, setLanguage } = useLanguage();
  const dateLocale = language === "en" ? enLocale : language === "zh" ? zhLocale : koLocale;
  const WEEKDAYS = [t("weekday_sun"), t("weekday_mon"), t("weekday_tue"), t("weekday_wed"), t("weekday_thu"), t("weekday_fri"), t("weekday_sat")];
  const CONDITION_OPTIONS = CONDITION_KEYS.map((c) => ({ ...c, label: t(c.key) }));
  const [langOpen, setLangOpen] = useState(false);
  const langDropdownRef = useRef<HTMLDivElement>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<TreatmentRecord | null>(null);
  const [parseModalOpen, setParseModalOpen] = useState(false);
  const { nickname } = useSeason();

  const { showLoginSheet, guardAction, handleLoginSuccess, handleClose: handleLoginClose } = useLoginGuard();
  const [packages, setPackages] = useState<
    {
      id: string;
      name: string;
      total_sessions: number;
      used_sessions: number;
      clinic: string;
      expiry_date: string | null;
    }[]>(
    []);
  const [clinicPayments, setClinicPayments] = useState<{amount: number;method: string;}[]>([]);
  const [todayCondition, setTodayCondition] = useState<number | null>(null);
  const [conditionMemo, setConditionMemo] = useState("");
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [showActionPicker, setShowActionPicker] = useState(false);
  const [showHomeAddModal, setShowHomeAddModal] = useState(false);
  const [showHomeReservationModal, setShowHomeReservationModal] = useState(false);
  const [reservationRefresh, setReservationRefresh] = useState(0);
  const [dataRefresh, setDataRefresh] = useState(0);
  const [editingReservation, setEditingReservation] = useState<Reservation | null>(null);
  const [calendarMonth, setCalendarMonth] = useState(TODAY);
  const [yearMonthPickerOpen, setYearMonthPickerOpen] = useState(false);

  // AI 파싱 등 외부 데이터 변경 시 새로고침
  useEffect(() => {
    const handler = () => setDataRefresh((v) => v + 1);
    window.addEventListener('skindesk:data-changed', handler);
    return () => window.removeEventListener('skindesk:data-changed', handler);
  }, []);

  // 언어 드롭다운 외부 클릭 닫기
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (langDropdownRef.current && !langDropdownRef.current.contains(e.target as Node)) {
        setLangOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const activeDays = getActiveDays(records);
  const bloom = getBloomInfo(activeDays);

  // Wilting: 48h+ since last record
  const lastRecordDateStr =
  records.length > 0 ? records.reduce((max, r) => r.date > max ? r.date : max, records[0].date) : null;
  const isWilting = lastRecordDateStr ? differenceInDays(TODAY, new Date(lastRecordDateStr)) >= 2 : false;

  // Bloom progress
  const remaining = bloom.nextMilestone ? bloom.nextMilestone - activeDays : 0;
  const stageMin = STAGES[bloom.stage].min;
  const stageMax = bloom.nextMilestone || stageMin;
  const progressPct =
  stageMax > stageMin ? Math.min((activeDays - stageMin) / (stageMax - stageMin) * 100, 100) : 100;

  // Reward feedback
  const [showReward, setShowReward] = useState(false);

  useEffect(() => {
    const loadDashboard = async () => {
      const {
        data: { user }
      } = await supabase.auth.getUser();
      if (!user) return;
      const [payRes, pkgRes, resRes] = await Promise.all([
      supabase.from("payment_records").select("amount,method").eq("user_id", user.id),
      supabase.
      from("treatment_packages").
      select("id,name,total_sessions,used_sessions,clinic,expiry_date").
      eq("user_id", user.id),
      supabase.
      from("reservations").
      select("id,date,time,treatment_name,clinic,memo,body_area,skin_layer").
      eq("user_id", user.id).
      order("date", { ascending: false })]
      );
      if (payRes.data) setClinicPayments(payRes.data);
      if (pkgRes.data) setPackages(pkgRes.data);
      if (resRes.data) setReservations(resRes.data as Reservation[]);
    };
    loadDashboard();
  }, [records, reservationRefresh, dataRefresh]);

  // Season change handler — require login, then apply pending mode

  // Privacy consent for OAuth users
  const [privacyConsentOpen, setPrivacyConsentOpen] = useState(false);
  const [privacyAgreePolicy, setPrivacyAgreePolicy] = useState(false);
  const [privacyAgreeAge, setPrivacyAgreeAge] = useState(false);

  useEffect(() => {
    const checkPrivacyConsent = async () => {
      const {
        data: { user: authUser }
      } = await supabase.auth.getUser();
      if (!authUser) return;

      // OAuth 가입 시 privacy_agreed=true 파라미터 처리
      const params = new URLSearchParams(window.location.search);
      if (params.get('privacy_agreed') === 'true') {
        await supabase.from('user_profiles').upsert({
          id: authUser.id,
          privacy_agreed_at: new Date().toISOString()
        });
        // URL에서 파라미터 제거
        params.delete('privacy_agreed');
        const newSearch = params.toString();
        window.history.replaceState({}, '', `${window.location.pathname}${newSearch ? '?' + newSearch : ''}`);
        return;
      }

      const { data } = await supabase.from("user_profiles").select("privacy_agreed_at").eq("id", authUser.id).maybeSingle();
      if (!data?.privacy_agreed_at) {
        setPrivacyConsentOpen(true);
      }
    };
    checkPrivacyConsent();
  }, []);

  const handlePrivacyConsent = async () => {
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("user_profiles").upsert({
      id: user.id,
      privacy_agreed_at: new Date().toISOString()
    });
    setPrivacyConsentOpen(false);
  };

  // Onboarding — only show after quiz is completed (logged-in users only)
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  useEffect(() => {
    if (!user) return;
    const done = localStorage.getItem("skindesk_onboarding_done");
    if (done) return;
    // Check if quiz is completed before showing onboarding
    supabase.
    from('user_profiles').
    select('quiz_completed_at').
    eq('id', user.id).
    single().
    then(({ data }) => {
      if (data?.quiz_completed_at) {
        setOnboardingOpen(true);
      }
    });
  }, [user]);
  const handleCloseOnboarding = () => {
    setOnboardingOpen(false);
    localStorage.setItem("skindesk_onboarding_done", "true");
    searchParams.delete("onboarding");
    setSearchParams(searchParams, { replace: true });
  };

  // Stats
  const allCycleStatuses = useMemo(() => cycles.map((c) => ({ c, ...getCycleStatus(c) })), [cycles]);
  const upcomingIn2w = allCycleStatuses.filter((s) => s.daysRemaining >= 0 && s.daysRemaining <= 14);
  const uniqueClinics = useMemo(() => new Set(cycles.map((c) => c.clinic)).size, [cycles]);
  const activePackages = useMemo(
    () => packages.filter((p) => (p.total_sessions ?? 0) - (p.used_sessions ?? 0) > 0),
    [packages]
  );
  const totalRemainingSessions = useMemo(
    () => activePackages.reduce((s, p) => s + ((p.total_sessions ?? 0) - (p.used_sessions ?? 0)), 0),
    [activePackages]
  );
  const totalBalance = useMemo(() => {
    const charged = clinicPayments.filter((p) => p.method === "charge").reduce((s, p) => s + p.amount, 0);
    const spent = clinicPayments.filter((p) => p.method !== "charge").reduce((s, p) => s + p.amount, 0);
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
    while (d <= calEnd) {
      days.push(d);
      d = addDays(d, 1);
    }
    return days;
  }, [calendarMonth]);

  // Records by date for calendar dots
  const recordDateSet = useMemo(() => new Set(records.map((r) => r.date.slice(0, 10))), [records]);
  const reservationDateSet = useMemo(() => new Set(reservations.map((r) => r.date.slice(0, 10))), [reservations]);
  // Records & reservations by date
  const recordsByDate = useMemo(() => {
    const map: Record<string, TreatmentRecord[]> = {};
    records.forEach((r) => {
      const d = r.date.slice(0, 10);
      if (!map[d]) map[d] = [];
      map[d].push(r);
    });
    return map;
  }, [records]);
  const reservationsByDate = useMemo(() => {
    const map: Record<string, Reservation[]> = {};
    reservations.forEach((r) => {
      const d = r.date.slice(0, 10);
      if (!map[d]) map[d] = [];
      map[d].push(r);
    });
    return map;
  }, [reservations]);

  // Default selected date: most recent reservation or record date
  const defaultInfoDate = useMemo(() => {
    const recentReservation = reservations.find((r) => r.date >= format(TODAY, "yyyy-MM-dd"));
    if (recentReservation) return recentReservation.date.slice(0, 10);
    if (records.length > 0) return records[0].date.slice(0, 10);
    return null;
  }, [reservations, records]);

  const activeSelectedDate = selectedDate ? format(selectedDate, "yyyy-MM-dd") : defaultInfoDate;
  const selectedRecords = activeSelectedDate ? recordsByDate[activeSelectedDate] || [] : [];
  const selectedReservations = activeSelectedDate ? reservationsByDate[activeSelectedDate] || [] : [];
  const hasSelectedInfo = selectedRecords.length > 0 || selectedReservations.length > 0;

  // Upcoming cycle dates
  const cycleDateMap = useMemo(() => {
    const map = new Map<string, string>();
    cycles.forEach((c) => {
      const next = addDays(new Date(c.lastTreatmentDate), c.cycleDays);
      map.set(format(next, "yyyy-MM-dd"), c.treatmentName);
    });
    return map;
  }, [cycles]);

  // Example data for empty state
  const isEmpty = cycles.length === 0 && records.length === 0;
  const exampleUpcoming = isEmpty ? [{ name: "울쎄라 리프팅", daysRemaining: 12 }] : null;

  // Expiry reminder events: 30, 20, 10 days before expiry_date
  const expiryEvents = useMemo(() => {
    const events: {date: string;name: string;expiryDate: string;daysLeft: number;}[] = [];
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
              date: format(reminderDate, "yyyy-MM-dd"),
              name: pkg.name,
              expiryDate: format(expiry, "M월 d일"),
              daysLeft: daysBefore
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
    return format(addDays(TODAY, 8), "yyyy-MM-dd");
  }, [isEmpty]);

  const handleSave = async (record: Omit<TreatmentRecord, "id">) => {
    if (editRecord) {
      updateRecord(editRecord.id, record);
    } else {
      await addRecord(record);
    }
    setEditRecord(null);
    setShowReward(true);
    setTimeout(() => setShowReward(false), 2500);
  };



  if (loading) return <FlowerLoader />;

  return (
    <div className="min-h-screen bg-background overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
      {/* ── HEADER with logo background ── */}
      <div className="relative safe-top overflow-visible">
        <img src={logoImg} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/55" />
        <div className="relative z-10 pt-10 px-5 pb-5 space-y-3">
          {/* Language selector */}
          <div className="absolute top-2 right-4 z-20" ref={langDropdownRef}>
            <button
              onClick={() => setLangOpen((prev) => !prev)}
              className="h-8 w-8 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center hover:bg-white/25 transition-colors">
              <Globe className="h-4 w-4 text-white/80" />
            </button>
            {langOpen &&
            <div className="absolute right-0 top-full mt-1 z-50 bg-popover border border-border rounded-xl shadow-lg overflow-hidden min-w-[120px]">
                {(["ko", "en", "zh"] as Language[]).map((lang) =>
              <button
                key={lang}
                onClick={() => {
                  setLanguage(lang);
                  setLangOpen(false);
                }}
                className={cn(
                  "w-full text-left px-4 py-2.5 text-xs font-medium transition-colors",
                  language === lang ? "bg-primary/10 text-primary" : "text-foreground hover:bg-muted"
                )}>
                    {LANGUAGE_LABELS[lang]}
                  </button>
              )}
              </div>
            }
          </div>

          {/* Row 1: Nickname's Bloom Log */}
          <div className="flex items-center">
            <div className="flex-1 min-w-0">
              <p className="text-white/60 tracking-wide text-xs font-sans font-extrabold">{t("blooming_day")} </p>
              <h1
                className="text-lg font-bold tracking-tight leading-tight text-white"
                style={{ fontFamily: "'Noto Sans KR', sans-serif" }}>
                {nickname || (language === "en" ? "User" : language === "zh" ? "用户" : "회원")}{t("name_bloom_log")} <span className="text-[hsl(var(--accent))]">Bloom Log</span>
              </h1>
            </div>
          </div>

          {/* ═══ Bloom Progress (inside header) ═══ */}
          <div className="flex items-center gap-3 px-1">
            <Popover>
              <PopoverTrigger asChild>
                <button className="focus:outline-none shrink-0">
                  <BloomAvatar size="sm" showDays={false} />
                </button>
              </PopoverTrigger>
              <PopoverContent
                side="bottom"
                align="start"
                className="w-52 rounded-xl border-0 bg-black/70 backdrop-blur-md text-white p-3 shadow-xl">
                <p className="text-[11px] font-semibold mb-2 text-white/80">{t("my_bloom")}</p>
                <div className="space-y-1.5 text-[11px]">
                  <p className="text-[#F2C94C] font-semibold">
                    {t("current_label")} {bloom.emoji} {bloom.name} ({activeDays}{t("unit_count")})
                  </p>
                  {bloom.nextMilestone !== null &&
                  <p className="text-white/90">
                      {t("next_label")} {STAGES[bloom.stage + 1].emoji} {STAGES[bloom.stage + 1].name} ({bloom.nextMilestone}{t("unit_count")})
                    </p>
                  }
                  {bloom.nextMilestone === null && <p className="text-white/90">{t("max_rank_achieved")}</p>}
                </div>
              </PopoverContent>
            </Popover>
            <div className="flex-1 min-w-0 space-y-1">
              {isWilting ?
              <p className="text-xs font-semibold text-white/70">{t("wilting_message")}</p> :
              bloom.stage === 0 ?
              <p className="text-xs font-semibold text-white">{t("first_record_upgrade")}</p> :
              remaining > 0 ?
              <>
              <p className="text-xs text-white/70">{t("records_grow_skin")}</p>
              <p className="text-xs font-semibold text-white">
                  🌸 {remaining} {t("records_until_next")} {STAGES[bloom.stage + 1]?.name || "Bloom"} {t("bloom_complete")}
                </p>
              </> :
              <p className="text-xs font-semibold text-white">{t("max_stage_achieved")}</p>
              }
              <div className="relative h-2 w-full overflow-hidden rounded-full bg-white/20">
                <div
                  className="h-full rounded-full transition-all duration-1000 ease-out"
                  style={{
                    width: `${progressPct}%`,
                    background: "linear-gradient(90deg, hsl(var(--primary)/0.6), hsl(var(--primary)), hsl(var(--rose)))"
                  }} />
              </div>
            </div>
            <span className="text-lg shrink-0">
              {bloom.nextMilestone !== null ? STAGES[bloom.stage + 1]?.emoji : "🌺"}
            </span>
          </div>
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div className="page-content space-y-1.5 pt-3 pb-40">


        {/* ═══ Today's Condition Log ═══ */}
        <Card className="border-0 shadow-sm">
          <CardContent className="px-2.5 py-2">
            <p className="text-sm font-bold text-foreground mb-1">{t("today_condition")}</p>
            <p className="text-[10px] text-muted-foreground mb-1.5">
              {language === "en" ? format(TODAY, "EEEE, MMM d", { locale: dateLocale }) : language === "zh" ? format(TODAY, "M月d日 (EEEE)", { locale: dateLocale }) : format(TODAY, "M월 d일 (EEEE)", { locale: dateLocale })} · {t("condition_question")}
            </p>
            <div className="flex items-center justify-between gap-1 mb-1.5">
              {CONDITION_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  className={cn(
                    "flex-1 flex flex-col items-center rounded-xl transition-all text-center gap-0 py-0",
                    todayCondition === opt.value
                      ? "bg-primary/10 ring-2 ring-primary/30 scale-105"
                      : "bg-muted/50 hover:bg-muted"
                  )}
                  onClick={() => setTodayCondition(todayCondition === opt.value ? null : opt.value)}
                >
                  <span className="text-xl">{opt.emoji}</span>
                  <span className="text-[10px] font-medium text-foreground">{opt.label}</span>
                </button>
              ))}
            </div>
            {todayCondition &&
            <div className="space-y-2">
                <textarea
                className="w-full text-xs bg-muted/30 border border-border/50 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-primary/30"
                placeholder={t("condition_memo_placeholder")}
                rows={2}
                value={conditionMemo}
                onChange={(e) => setConditionMemo(e.target.value)} />
              
                <button
                className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold active:scale-[0.98] transition-transform"
                onClick={async () => {
                  await addRecord({
                    date: format(TODAY, "yyyy-MM-dd"),
                    treatmentName: t("condition_record_name"),
                    treatmentId: undefined,
                    packageId: "",
                    skinLayer: "epidermis",
                    bodyArea: "face",
                    clinic: "-",
                    satisfaction: todayCondition as 1 | 2 | 3 | 4 | 5,
                    memo:
                    conditionMemo || `${t("condition_prefix")} ${CONDITION_OPTIONS.find((o) => o.value === todayCondition)?.label}`,
                    notes: t("daily_condition_note")
                  });
                  setTodayCondition(null);
                  setConditionMemo("");
                  setShowReward(true);
                  setTimeout(() => setShowReward(false), 2500);
                }}>
                
                  {t("record_condition")}
                </button>
              </div>
            }
          </CardContent>
        </Card>


        {/* ═══ Mini Calendar (moved to top) ═══ */}
        <Card className="border-0 shadow-sm overflow-hidden">
          <CardContent className="px-3 py-2.5">
            <div className="flex items-center justify-between mb-2">
              <button
                onClick={() => setCalendarMonth((prev) => subMonths(prev, 1))}
                className="p-1 rounded-lg hover:bg-muted transition-colors">
                <ChevronLeft size={14} className="text-muted-foreground" />
              </button>
              <div className="relative">
                <button
                  onClick={() => setYearMonthPickerOpen((v) => !v)}
                  className="text-xs font-bold text-foreground hover:text-primary transition-colors flex items-center gap-1">
                  {language === "en" ? format(calendarMonth, "MMMM yyyy", { locale: dateLocale }) : language === "zh" ? `${calendarMonth.getFullYear()}年 ${calendarMonth.getMonth() + 1}月` : format(calendarMonth, "yyyy년 M월", { locale: dateLocale })}
                  <ChevronDown size={10} className={cn("transition-transform", yearMonthPickerOpen && "rotate-180")} />
                </button>
                {yearMonthPickerOpen &&
                <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 z-50 bg-card border border-border rounded-xl shadow-lg p-3 w-[260px]">
                    <div className="flex items-center justify-between mb-3">
                      <button onClick={() => setCalendarMonth((prev) => setYear(prev, prev.getFullYear() - 1))} className="p-1 rounded hover:bg-muted">
                        <ChevronLeft size={14} />
                      </button>
                      <span className="text-sm font-bold">{calendarMonth.getFullYear()}{t("year_suffix")}</span>
                      <button onClick={() => setCalendarMonth((prev) => setYear(prev, prev.getFullYear() + 1))} className="p-1 rounded hover:bg-muted">
                        <ChevronRight size={14} />
                      </button>
                    </div>
                    <div className="grid grid-cols-4 gap-1.5">
                      {Array.from({ length: 12 }, (_, i) =>
                    <button
                      key={i}
                      onClick={() => {
                        setCalendarMonth((prev) => setMonth(setYear(prev, calendarMonth.getFullYear()), i));
                        setYearMonthPickerOpen(false);
                      }}
                      className={cn(
                        "py-1.5 rounded-lg text-xs font-medium transition-colors",
                        calendarMonth.getMonth() === i ? "bg-primary text-primary-foreground" : "hover:bg-muted text-foreground"
                      )}>
                          {language === "en" ? format(new Date(2000, i, 1), "MMM") : `${i + 1}${t("month_suffix")}`}
                        </button>
                    )}
                    </div>
                  </div>
                }
              </div>
              <button
                onClick={() => setCalendarMonth((prev) => addMonths(prev, 1))}
                className="p-1 rounded-lg hover:bg-muted transition-colors">
                <ChevronRight size={14} className="text-muted-foreground" />
              </button>
            </div>

            <div className="grid grid-cols-7 mb-0.5">
              {WEEKDAYS.map((d) =>
              <div key={d} className="text-center text-[9px] text-muted-foreground font-medium py-0.5">
                  {d}
                </div>
              )}
            </div>

            <div className="grid grid-cols-7">
              {calendarDays.map((day, i) => {
                const dateStr = format(day, "yyyy-MM-dd");
                const inMonth = isSameMonth(day, calendarMonth);
                const isToday2 = isSameDay(day, TODAY);
                const hasRecord = recordDateSet.has(dateStr);
                const hasReservation = reservationDateSet.has(dateStr);
                const cycleLabel = cycleDateMap.get(dateStr);
                const hasExpiry = expiryDateSet.has(dateStr) || isEmpty && dateStr === exampleExpiryDate;
                const isSelected = activeSelectedDate === dateStr;
                const hasAnyData = hasRecord || hasReservation;
                let longPressTimer: ReturnType<typeof setTimeout> | null = null;

                return (
                  <button
                    key={i}
                    onClick={() => {
                      setSelectedDate(day);
                      if (inMonth && !hasRecord && !hasReservation && !expiryByDate[dateStr]?.length) {
                        guardAction(() => setShowActionPicker(true));
                      }
                    }}
                    onDoubleClick={() => {
                      if (hasAnyData && inMonth) {
                        setSelectedDate(day);
                        guardAction(() => setShowActionPicker(true));
                      }
                    }}
                    onPointerDown={() => {
                      if (hasAnyData && inMonth) {
                        longPressTimer = setTimeout(() => {
                          setSelectedDate(day);
                          guardAction(() => setShowActionPicker(true));
                        }, 500);
                      }
                    }}
                    onPointerUp={() => {if (longPressTimer) clearTimeout(longPressTimer);}}
                    onPointerLeave={() => {if (longPressTimer) clearTimeout(longPressTimer);}}
                    onContextMenu={(e) => {if (hasAnyData && inMonth) e.preventDefault();}}
                    className={cn("flex flex-col items-center py-0.5 transition-colors", !inMonth && "opacity-30")}>
                    <span
                      className={cn(
                        "w-6 h-6 flex items-center justify-center rounded-full text-[11px] transition-all",
                        isSelected && "bg-primary text-primary-foreground font-bold",
                        !isSelected && isToday2 && "bg-primary/20 text-primary font-semibold",
                        !isSelected && hasRecord && !isToday2 && "bg-[#FF7F7F]/40",
                        !isSelected && hasExpiry && !isToday2 && !hasRecord && "bg-[hsl(var(--destructive))]/15",
                        !isSelected && cycleLabel && !isToday2 && !hasRecord && !hasExpiry && "ring-1 ring-primary/30"
                      )}>
                      {format(day, "d")}
                    </span>
                    <div className="flex gap-0.5 mt-px h-1 items-center">
                      {hasRecord && <div className="w-1 h-1 rounded-full bg-[#C9A96E]" />}
                      {hasReservation && <div className="w-1 h-1 rounded-full bg-info" />}
                      {hasExpiry && <div className="w-1 h-1 rounded-full bg-destructive" />}
                      {cycleLabel && inMonth && !hasRecord && !hasReservation && !hasExpiry &&
                      <div className="w-1 h-1 rounded-full bg-primary" />
                      }
                    </div>
                  </button>);
              })}
            </div>
          </CardContent>
        </Card>

        {/* ═══ Selected Date Info ═══ */}
        {activeSelectedDate &&
        <div className="space-y-2">
            <p className="text-xs font-bold text-foreground flex items-center gap-1.5 px-1">
              <CalendarDays className="h-3.5 w-3.5 text-primary" />
              {language === "en" ? format(new Date(activeSelectedDate + "T00:00:00"), "EEEE, MMM d", { locale: dateLocale }) : language === "zh" ? format(new Date(activeSelectedDate + "T00:00:00"), "M月d日 (EEEE)", { locale: dateLocale }) : format(new Date(activeSelectedDate + "T00:00:00"), "M월 d일 (EEEE)", { locale: dateLocale })}
            </p>

            {/* Expiry reminders */}
            {(expiryByDate[activeSelectedDate] || []).map((ev, idx) =>
          <Card key={`expiry-${idx}`} className="border-0 shadow-sm border-l-2 border-l-destructive">
                <CardContent className="p-3.5 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-destructive/10 flex items-center justify-center shrink-0">
                    <span className="text-base">⏰</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{ev.name}</p>
                    <p className="text-[11px] text-destructive font-medium mt-0.5">
                      {ev.expiryDate}{t("expiry_on_date")} (D-{ev.daysLeft})
                    </p>
                  </div>
                </CardContent>
              </Card>
          )}

            {/* Example expiry for empty state */}
            {isEmpty && activeSelectedDate === exampleExpiryDate &&
          <Card className="border-0 shadow-sm border-l-2 border-l-destructive opacity-60">
                <CardContent className="p-3.5 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-destructive/10 flex items-center justify-center shrink-0">
                    <span className="text-base">⏰</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{t("expiry_soon_title")}</p>
                    <p className="text-[11px] text-destructive font-medium mt-0.5">
                      {language === "en" ? format(addDays(TODAY, 8), "MMM d") : format(addDays(TODAY, 8), "M月 d日")}{t("expiry_example_suffix")}
                    </p>
                  </div>
                  <span className="text-[9px] font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full shrink-0">
                    {t("example_label")}
                  </span>
                </CardContent>
              </Card>
          }

            {/* Reservations */}
            {selectedReservations.map((res) =>
          <Card
            key={res.id}
            className="border-0 shadow-sm cursor-pointer active:scale-[0.98] transition-transform"
            onClick={() => setEditingReservation(res)}>
            
                <CardContent className="p-3.5 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-info/10 flex items-center justify-center shrink-0">
                    <CalendarPlus className="h-4 w-4 text-info" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{res.treatment_name}</p>
                    <p className="text-muted-foreground mt-0.5 font-sans text-sm">
                      {res.clinic}
                      {res.time ? ` · ${res.time}` : ""}
                    </p>
                  </div>
                  <span className="text-[10px] font-medium text-info bg-info/10 px-2 py-0.5 rounded-full shrink-0">
                    {t("reservation_label")}
                  </span>
                </CardContent>
              </Card>
          )}

            {/* Treatment records */}
            {selectedRecords.map((r) =>
          <Card key={r.id} className="border-0 shadow-sm">
                <CardContent className="p-3.5 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    {(r.treatmentName === "컨디션 기록" || r.treatmentName === "Condition Log" || r.treatmentName === "状态记录") && r.satisfaction ?
                <span className="text-lg">{CONDITION_OPTIONS.find((o) => o.value === r.satisfaction)?.emoji ?? "🌤️"}</span> :
                <Stethoscope className="h-4 w-4 text-primary" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{r.treatmentName}</p>
                    <p className="text-muted-foreground mt-0.5 font-sans text-sm">{r.clinic}</p>
                  </div>
                  {r.satisfaction &&
              <span className="text-xs text-[hsl(var(--accent))] font-medium shrink-0">
                      {"★".repeat(r.satisfaction)}
                    </span>
              }
                </CardContent>
              </Card>
          )}

            {/* Add button when there are existing items */}
            {hasSelectedInfo &&
          <button
            onClick={() => guardAction(() => setShowActionPicker(true))}
            className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-dashed border-muted-foreground/20 text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors active:scale-[0.98]">
            
                <Plus className="h-4 w-4" />
                <span className="text-xs font-medium">{t("add_button")}</span>
              </button>
          }

          </div>
        }

        {/* ═══ Stat Cards — 2×2 compact ═══ */}
        <div className="grid grid-cols-2 gap-2 text-base">
          <Card className="border-0 shadow-sm cursor-pointer active:scale-[0.98] transition-transform" onClick={() => navigate("/calendar?tab=history")}>
            <CardContent className="px-3 py-2.5 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[hsl(260,60%,94%)] flex items-center justify-center shrink-0">
                <span className="text-sm">💉</span>
              </div>
              <div className="min-w-0">
                <p className="text-muted-foreground mt-0.5 text-sm">{t("managed_treatments")}</p>
                <p className="text-sm font-black text-foreground leading-tight">{cycles.length > 0 ? <>{cycles.length}<span className="text-[10px] font-medium text-muted-foreground ml-0.5">{t("count_suffix")}</span></> : <span className="text-[10px] font-normal text-muted-foreground/70">첫 시술을 기록해봐요 🌱</span>}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm cursor-pointer active:scale-[0.98] transition-transform" onClick={() => navigate("/calendar?tab=history")}>
            <CardContent className="px-3 py-2.5 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[hsl(150,50%,92%)] flex items-center justify-center shrink-0">
                <span className="text-sm">🏥</span>
              </div>
              <div className="min-w-0">
                <p className="text-muted-foreground mt-0.5 text-sm">{t("active_clinics")}</p>
                <p className="text-sm font-black text-foreground leading-tight">{uniqueClinics > 0 ? <>{uniqueClinics}<span className="text-[10px] font-medium text-muted-foreground ml-0.5">{t("clinic_suffix")}</span></> : <span className="text-[10px] font-normal text-muted-foreground/70">병원을 추가해봐요</span>}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm cursor-pointer active:scale-[0.98] transition-transform" onClick={() => navigate("/packages?tab=packages")}>
            <CardContent className="px-3 py-2.5 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[hsl(30,90%,92%)] flex items-center justify-center shrink-0">
                <span className="text-sm">🎟️</span>
              </div>
              <div className="min-w-0">
                <p className="text-muted-foreground mt-0.5 text-sm">{t("remaining_sessions")}</p>
                <p className="text-sm font-black text-foreground leading-tight">{totalRemainingSessions > 0 ? <>{totalRemainingSessions}<span className="text-[10px] font-medium text-muted-foreground ml-0.5">{t("session_suffix")}</span></> : <span className="text-[10px] font-normal text-muted-foreground/70">시술권을 등록해봐요</span>}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm cursor-pointer active:scale-[0.98] transition-transform" onClick={() => navigate("/packages?tab=points")}>
            <CardContent className="px-3 py-2.5 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[hsl(340,60%,92%)] flex items-center justify-center shrink-0">
                <span className="text-sm">💰</span>
              </div>
              <div className="min-w-0">
                <p className="text-muted-foreground mt-0.5 text-sm">{t("remaining_points")}</p>
                <p className="text-sm font-black text-foreground leading-tight">{totalBalance > 0 ? <>{totalBalance.toLocaleString()}<span className="text-[10px] font-medium text-muted-foreground ml-0.5">{t("currency_suffix")}</span></> : <span className="text-[10px] font-normal text-muted-foreground/70">포인트를 적립해봐요</span>}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ═══ AI 시술 기록 배너 (로그인 유저만) ═══ */}
        <button
          onClick={() => setParseModalOpen(true)}
          className="w-full flex items-center gap-3 rounded-2xl bg-primary/90 hover:bg-primary transition-colors shadow-sm px-4 py-3.5 text-left">
          <span className="text-2xl">📋</span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-primary-foreground">{t("ai_parse_title")}</p>
            <p className="text-[11px] text-primary-foreground/70">{t("ai_parse_desc")}</p>
          </div>
          <ChevronRight size={16} className="ml-auto text-primary-foreground/50 shrink-0" />
        </button>


        {/* ═══ Recent Records ═══ */}
        <div>
          {records.length > 0 ? (
            <>
              <div className="flex items-center justify-between px-1 mb-2.5">
                <h2 className="text-sm font-bold flex items-center gap-1.5">
                  <Star className="h-3.5 w-3.5 text-[hsl(var(--accent))]" />
                  {t("recent_records")}
                </h2>
                <button
                  onClick={() => navigate("/calendar?tab=history")}
                  className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                  {t("view_all")} <ChevronRight size={10} />
                </button>
              </div>
              <div className="space-y-2">
                {records.slice(0, 3).map((r) =>
                  <Card key={r.id} className="glass-card">
                    <CardContent className="p-3.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-semibold text-foreground">{r.treatmentName}</span>
                          <p className="text-muted-foreground mt-0.5 font-sans text-sm">
                            {format(new Date(r.date), "yyyy.MM.dd")} · {r.clinic}
                          </p>
                          {r.memo && <p className="text-[11px] text-muted-foreground mt-1 line-clamp-1">{r.memo}</p>}
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {r.satisfaction &&
                            <span className="text-xs text-[hsl(var(--accent))] font-medium">
                              {"★".repeat(r.satisfaction)}
                            </span>
                          }
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-sm text-muted-foreground">
              아직 기록이 없어요. 첫 번째 시술을 남겨봐요 🌸
            </div>
          )}
        </div>
      </div>

      {/* Action Picker Sheet for home calendar */}
      <Sheet open={showActionPicker} onOpenChange={setShowActionPicker}>
        <SheetContent side="bottom" className="rounded-t-3xl px-5 pb-8 pt-4">
          <div className="mx-auto w-10 h-1 rounded-full bg-muted-foreground/20 mb-5" />
          <p className="text-center text-base font-semibold mb-1">
            <span className="text-primary">{selectedDate ? (language === "en" ? format(selectedDate, "MMM d") : format(selectedDate, "M月 d日")) : ""}</span>{t("date_selected_suffix")}
          </p>
          <p className="text-center text-sm text-muted-foreground mb-6">{t("what_to_add")}</p>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => {
                setShowActionPicker(false);
                setShowHomeReservationModal(true);
              }}
              className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-5 hover:bg-accent/50 active:scale-[0.97] transition-all">
              
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-info/10">
                <CalendarPlus className="h-6 w-6 text-info" />
              </div>
              <span className="text-sm font-semibold">{t("add_reservation")}</span>
            </button>
            <button
              onClick={() => {
                setShowActionPicker(false);
                setShowHomeAddModal(true);
              }}
              className="flex flex-col items-center gap-3 rounded-2xl border border-primary/30 bg-primary/5 p-5 hover:bg-primary/10 active:scale-[0.97] transition-all">
              
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <ClipboardList className="h-6 w-6 text-primary" />
              </div>
              <span className="text-sm font-semibold">{t("add_treatment_record")}</span>
            </button>
          </div>
        </SheetContent>
      </Sheet>

      <AddTreatmentModal
        open={showHomeAddModal}
        onClose={() => setShowHomeAddModal(false)}
        onSave={async (record) => {
          await addRecord(record);
          setShowReward(true);
          setTimeout(() => setShowReward(false), 2500);
        }}
        defaultDate={selectedDate ? format(selectedDate, "yyyy-MM-dd") : undefined}
        onOpenParse={() => {setShowHomeAddModal(false);setParseModalOpen(true);}} />
      

      <AddReservationModal
        open={showHomeReservationModal}
        onClose={() => {
          setShowHomeReservationModal(false);
          setReservationRefresh((v) => v + 1);
        }}
        defaultDate={selectedDate ? format(selectedDate, "yyyy-MM-dd") : undefined} />
      

      <EditReservationSheet
        open={!!editingReservation}
        onClose={() => setEditingReservation(null)}
        reservation={editingReservation}
        onSaved={() => setReservationRefresh((v) => v + 1)} />
      

      {parseModalOpen && <ParseTreatmentModal onClose={() => setParseModalOpen(false)} />}
      <AddTreatmentModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditRecord(null);
        }}
        onSave={handleSave}
        editRecord={editRecord}
        onOpenParse={() => {
          setModalOpen(false);
          setParseModalOpen(true);
        }} />
      

      <OnboardingFlow open={onboardingOpen} onClose={handleCloseOnboarding} />

      {/* Privacy Consent Modal for OAuth users */}
      <LoginRequiredSheet open={showLoginSheet} onClose={handleLoginClose} onLoginSuccess={handleLoginSuccess} />

      {privacyConsentOpen &&
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="bg-background rounded-2xl p-6 w-full max-w-sm space-y-4 shadow-xl">
            <div className="text-center space-y-1">
              <div className="text-2xl">🌸</div>
              <h2 className="font-bold text-base">{t("privacy_title") || "서비스 이용 전 확인해주세요"}</h2>
              <p className="text-xs text-muted-foreground">
                {t("privacy_subtitle") || "Bloomlog는 시술 기록을 안전하게 보관합니다"}
              </p>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed border rounded-lg p-3 bg-muted/30">
              {t("privacy_sensitive_notice") ||
            "시술 기록은 건강에 관한 민감정보입니다. 본인 동의 하에만 수집되며, 서비스 제공 외 목적으로 사용되지 않습니다."}
            </p>
            <div className="space-y-3">
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                type="checkbox"
                checked={privacyAgreePolicy}
                onChange={(e) => setPrivacyAgreePolicy(e.target.checked)}
                className="mt-0.5 accent-primary" />
              
                <span className="text-xs leading-relaxed">
                  {t("privacy_agree_policy") || "[필수] 개인정보처리방침에 동의합니다"}{" "}
                  <a href="/privacy" target="_blank" className="underline text-primary">
                    {t("privacy_view_full") || "전문 보기"}
                  </a>
                </span>
              </label>
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                type="checkbox"
                checked={privacyAgreeAge}
                onChange={(e) => setPrivacyAgreeAge(e.target.checked)}
                className="mt-0.5 accent-primary" />
              
                <span className="text-xs">{t("privacy_agree_age") || "[필수] 만 14세 이상입니다"}</span>
              </label>
            </div>
            <button
            onClick={handlePrivacyConsent}
            disabled={!privacyAgreePolicy || !privacyAgreeAge}
            className="w-full py-3 rounded-xl text-sm font-semibold bg-primary text-primary-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-opacity">
            
              {t("privacy_start") || "동의하고 시작하기"}
            </button>
          </div>
        </div>
      }

      {/* ═══ Reward Feedback Overlay ═══ */}
      {showReward &&
      <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none animate-fade-in">
          <div className="bg-black/70 backdrop-blur-md text-white rounded-2xl px-8 py-6 text-center space-y-2 animate-scale-in">
            <span className="text-4xl block animate-bounce">🌱</span>
            <p className="text-sm font-semibold">{t("reward_title")}</p>
            <p className="text-xs text-white/80">{t("reward_desc")}</p>
          </div>
        </div>
      }
    </div>);

};

export default Index;