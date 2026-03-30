import { useState, useMemo, useEffect } from 'react';
import { useSeason } from '@/context/SeasonContext';
import { useSearchParams } from 'react-router-dom';
import { SkinLayerBadge, BodyAreaBadge } from '@/components/SkinLayerBadge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useCycles } from '@/context/CyclesContext';
import { useRecords } from '@/context/RecordsContext';
import { CalendarDays, Bell, Sparkles, RotateCcw, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Star, Stethoscope, ClipboardList, MoreVertical, Pencil, Trash2, CreditCard, Plus, Check } from 'lucide-react';
import DraggableTabsList from '@/components/DraggableTabsList';
import { cn } from '@/lib/utils';
import { format, addDays, addMonths, subMonths, differenceInDays, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isSameMonth, isSameDay, isToday } from 'date-fns';
import { ko } from 'date-fns/locale';
import { CalendarEvent, BODY_AREA_LABELS, SKIN_LAYER_LABELS, TreatmentRecord, SkinLayer, BodyArea } from '@/types/skin';
import MyTreatmentHistory from '@/components/MyTreatmentHistory';
import logoImg from '@/assets/logo.png';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import AddPaymentModal from '@/components/AddPaymentModal';
import LoginRequiredSheet from '@/components/LoginRequiredSheet';
import { useLoginGuard } from '@/hooks/useLoginGuard';

const eventTypeConfig = {
  treatment:     { icon: CalendarDays, color: 'text-primary',    bg: 'bg-primary/10',   dotColor: 'bg-primary' },
  reminder:      { icon: Bell,         color: 'text-amber-600',  bg: 'bg-amber-50',     dotColor: 'bg-amber-400' },
  recommendation:{ icon: Sparkles,     color: 'text-info',       bg: 'bg-info-light',   dotColor: 'bg-info' },
  cycle:         { icon: RotateCcw,    color: 'text-sage-dark',  bg: 'bg-sage-light',   dotColor: 'bg-sage' },
};

const SKIN_LAYER_COLOR: Record<string, string> = {
  epidermis:   'bg-amber-500/10 text-amber-400 border-amber-500/20',
  dermis:      'bg-blue-500/10 text-blue-400 border-blue-500/20',
  subcutaneous:'bg-purple-500/10 text-purple-400 border-purple-500/20',
};

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

const SKIN_LAYER_OPTIONS: { value: SkinLayer; label: string }[] = [
  { value: 'epidermis', label: '표피층' },
  { value: 'dermis', label: '진피층' },
  { value: 'subcutaneous', label: '피하조직' },
];

const BODY_AREA_OPTIONS: { value: BodyArea; label: string }[] = [
  { value: 'face', label: '얼굴' },
  { value: 'neck', label: '목' },
  { value: 'arm', label: '팔' },
  { value: 'leg', label: '다리' },
  { value: 'abdomen', label: '복부' },
  { value: 'back', label: '등' },
  { value: 'chest', label: '가슴' },
  { value: 'hip', label: '엉덩이/힙' },
];

// ── 시술 기록 카드 (펼치기/접기 + 수정/삭제) ──────────────────────────
const RecordCard = ({ r, onEdit, onDelete }: { r: TreatmentRecord; onEdit: (r: TreatmentRecord) => void; onDelete: (r: TreatmentRecord) => void }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card className="glass-card cursor-pointer" onClick={() => setExpanded(v => !v)}>
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
              {r.clinic}
            </p>
            {!expanded && r.memo && (
              <p className="text-[11px] text-muted-foreground mt-1 line-clamp-1">{r.memo}</p>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {r.satisfaction && (
              <span className="text-xs text-[#C9A96E] font-medium">
                {'★'.repeat(r.satisfaction)}
              </span>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-1 rounded-md hover:bg-muted transition-colors" onClick={e => e.stopPropagation()}>
                  <MoreVertical className="h-4 w-4 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[100px]">
                <DropdownMenuItem onClick={e => { e.stopPropagation(); onEdit(r); }} className="text-xs gap-2">
                  <Pencil className="h-3.5 w-3.5" /> 수정
                </DropdownMenuItem>
                <DropdownMenuItem onClick={e => { e.stopPropagation(); onDelete(r); }} className="text-xs gap-2 text-destructive focus:text-destructive">
                  <Trash2 className="h-3.5 w-3.5" /> 삭제
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            {expanded
              ? <ChevronUp size={14} className="text-muted-foreground" />
              : <ChevronDown size={14} className="text-muted-foreground" />
            }
          </div>
        </div>

        {/* 펼쳐진 상세 */}
        {expanded && (
          <div className="mt-3 pt-3 border-t border-white/10 space-y-2">
            {r.notes && (
              <div className="bg-white/5 rounded-xl px-3 py-2">
                <p className="text-[11px] text-muted-foreground leading-relaxed">{r.notes}</p>
              </div>
            )}
            {r.memo && (
              <div className="bg-white/5 rounded-xl px-3 py-2">
                <p className="text-[10px] text-[#C9A96E] mb-0.5 font-medium">메모</p>
                <p className="text-[11px] text-muted-foreground leading-relaxed">{r.memo}</p>
              </div>
            )}
            <div className="flex gap-1.5 flex-wrap">
              <BodyAreaBadge area={r.bodyArea as BodyArea} />
              <SkinLayerBadge layer={r.skinLayer} />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// ── 메인 ─────────────────────────────────────────────────────────────
// ── CalendarPage ──────────────────────────────────────────────────────
const CalendarPage = () => {
  const [searchParams] = useSearchParams();
  const defaultTab = searchParams.get('tab') || 'history';
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today);
  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const { cycles } = useCycles();
  const { records, updateRecord, deleteRecord } = useRecords();
  const { nickname } = useSeason();

  // ── 수정/삭제 state ──
  const [editRecord, setEditRecord] = useState<TreatmentRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TreatmentRecord | null>(null);
  const [editForm, setEditForm] = useState({
    treatmentName: '', clinic: '', date: '', memo: '', notes: '',
    skinLayer: 'epidermis' as SkinLayer, bodyArea: 'face' as string,
    satisfaction: 0,
  });

  const handleEditRecord = (r: TreatmentRecord) => {
    setEditForm({
      treatmentName: r.treatmentName, clinic: r.clinic, date: r.date,
      memo: r.memo || '', notes: r.notes || '',
      skinLayer: r.skinLayer, bodyArea: r.bodyArea,
      satisfaction: r.satisfaction || 0,
    });
    setEditRecord(r);
  };

  const saveRecordEdit = async () => {
    if (!editRecord) return;
    try {
      await updateRecord(editRecord.id, {
        ...editRecord,
        treatmentName: editForm.treatmentName,
        clinic: editForm.clinic,
        date: editForm.date,
        memo: editForm.memo || undefined,
        notes: editForm.notes || undefined,
        skinLayer: editForm.skinLayer,
        bodyArea: editForm.bodyArea,
        satisfaction: (editForm.satisfaction || undefined) as TreatmentRecord['satisfaction'],
      });
      toast.success('시술 기록이 수정되었습니다');
      setEditRecord(null);
    } catch { toast.error('수정 실패'); }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteRecord(deleteTarget.id);
      toast.success('삭제되었습니다');
      setDeleteTarget(null);
    } catch { toast.error('삭제 실패'); }
  };

  // 주기 기반 자동 추천 이벤트 생성
  const cycleEvents = useMemo(() => {
    const events: (CalendarEvent & { cycleInfo?: string })[] = [];
    cycles.forEach((cycle) => {
      const lastDate = new Date(cycle.lastTreatmentDate);
      let nextDate = addDays(lastDate, cycle.cycleDays);
      if (nextDate < today) {
        const overdueDays = differenceInDays(today, nextDate);
        events.push({
          id: `auto_overdue_${cycle.id}`,
          date: format(today, 'yyyy-MM-dd'),
          title: `${cycle.treatmentName} 시술 필요`,
          type: 'recommendation',
          skinLayer: cycle.skinLayer,
          bodyArea: cycle.bodyArea,
          cycleInfo: `${overdueDays}일 초과 · ${cycle.product || ''} · ${BODY_AREA_LABELS[cycle.bodyArea]}`,
        } as any);
        nextDate = addDays(today, 7);
      }
      for (let i = 0; i < 3; i++) {
        if (differenceInDays(nextDate, today) > 90) break;
        if (nextDate >= today) {
          const daysFromNow = differenceInDays(nextDate, today);
          events.push({
            id: `auto_${cycle.id}_${i}`,
            date: format(nextDate, 'yyyy-MM-dd'),
            title: `${cycle.treatmentName} 추천일`,
            type: 'recommendation',
            skinLayer: cycle.skinLayer,
            bodyArea: cycle.bodyArea,
            cycleInfo: `${cycle.cycleDays}일 주기${cycle.product ? ` · ${cycle.product}` : ''} · D-${daysFromNow}`,
          } as any);
        }
        nextDate = addDays(nextDate, cycle.cycleDays);
      }
    });
    return events;
  }, [cycles]);

  const allEvents = useMemo(() => {
    const combined = [...cycleEvents];
        return combined.filter(e => {
      const key = `${e.date}_${e.title}`;
      return true;
    });
  }, [cycleEvents]);

  // 달력 날짜 배열
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 0 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });
    const days: Date[] = [];
    let day = startDate;
    while (day <= endDate) { days.push(day); day = addDays(day, 1); }
    return days;
  }, [currentMonth]);

  // 날짜별 이벤트 맵
  const eventsByDate = useMemo(() => {
    const map: Record<string, typeof allEvents> = {};
    allEvents.forEach(event => {
      if (!map[event.date]) map[event.date] = [];
      map[event.date].push(event);
    });
    return map;
  }, [allEvents]);

  // 날짜별 시술 기록 맵
  const recordsByDate = useMemo(() => {
    const map: Record<string, TreatmentRecord[]> = {};
    records.forEach(r => {
      if (!map[r.date]) map[r.date] = [];
      map[r.date].push(r);
    });
    return map;
  }, [records]);

  const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
  const selectedEvents = eventsByDate[selectedDateStr] || [];
  const selectedRecords = recordsByDate[selectedDateStr] || [];

  // 시술 기록 있는 날짜 → 달력에 별도 dot
  const hasRecord = (dateStr: string) => !!(recordsByDate[dateStr]?.length);

  const goToPrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const goToNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const goToToday = () => { setCurrentMonth(today); setSelectedDate(today); };

  return (
    <div className="min-h-screen bg-background">
      {/* 헤더 */}
      <div className="relative safe-top overflow-hidden">
        <img src={logoImg} alt="" className="absolute inset-0 w-full h-full object-cover" style={{ clipPath: 'inset(0)' }} />
        <div className="absolute inset-0 bg-black/40" />
        <div className="page-header-gradient relative z-10" style={{ background: 'transparent' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-70 font-light">{nickname ? `${nickname}의` : '나의'} 기록 ✍️</p>
              <h1 className="mt-0.5 text-xl font-bold">시술내역</h1>
            </div>
            <div className="flex items-center gap-1">
              <span className="px-3 py-1.5 text-xs font-medium text-primary-foreground bg-white/15 rounded-full backdrop-blur-sm">
                <ClipboardList className="h-3.5 w-3.5 inline mr-1" />
                {records.length}건
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="page-content space-y-5 pt-4">
        <HistoryTabs defaultTab={defaultTab} />
      </div>
    </div>
  );
}


// ─── 결제 기록 탭 컴포넌트 ────────────────────────────────────────────────
interface PaymentRecord {
  id: string;date: string;clinic: string;
  treatment_name: string;amount: number;method: string;memo?: string;
  charged_amount?: number;clinic_type?: string;
}

const HISTORY_TAB_CONFIG: Record<string, { value: string; label: string }> = {
  history: { value: 'history', label: '시술내역' },
  payments: { value: 'payments', label: '결제기록' },
};

function HistoryTabs({ defaultTab }: { defaultTab: string }) {
  const [tabOrder, setTabOrder] = useState<('history' | 'payments')[]>(() => {
    const saved = localStorage.getItem('skindesk_history_tab_order');
    if (saved) {
      try { return JSON.parse(saved); } catch { /* ignore */ }
    }
    return ['history', 'payments'];
  });

  return (
    <Tabs defaultValue={defaultTab || tabOrder[0]} className="w-full">
      <DraggableTabsList
        tabs={tabOrder.map((tabKey) => ({
          key: tabKey,
          label: HISTORY_TAB_CONFIG[tabKey].label,
        }))}
        onReorder={(newOrder) => {
          const typed = newOrder as ('history' | 'payments')[];
          setTabOrder(typed);
          localStorage.setItem('skindesk_history_tab_order', JSON.stringify(typed));
        }}
      />
      <TabsContent value="history">
        <MyTreatmentHistory />
      </TabsContent>
      <TabsContent value="payments">
        <PaymentHistoryTab />
      </TabsContent>
    </Tabs>
  );
}

interface MatchedTreatment {
  id: string;date: string;treatment_name: string;
  skin_layer?: string;body_area?: string;satisfaction?: number;memo?: string;
}

function PaymentHistoryTab() {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [matchedTreatments, setMatchedTreatments] = useState<Record<string, MatchedTreatment[]>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<PaymentRecord>>({});
  const [deleting, setDeleting] = useState<string | null>(null);
  const { showLoginSheet: payLoginSheet, guardAction: payGuardAction, handleLoginSuccess: payLoginSuccess, handleClose: payLoginClose } = useLoginGuard();
  const [methodFilter, setMethodFilter] = useState<string | null>(null);

  const loadPayments = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {setLoading(false);return;}
    const { data } = await supabase.
    from('payment_records').
    select('id, date, clinic, treatment_name, amount, method, memo, charged_amount, clinic_type').
    eq('user_id', user.id).
    neq('method', '포인트충전').
    order('date', { ascending: false });
    setPayments(data ?? []);
    setLoading(false);
  };

  useEffect(() => {loadPayments();}, []);

  const loadMatchedTreatments = async (paymentId: string, date: string, clinic: string) => {
    if (matchedTreatments[paymentId]) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.
    from('treatment_records').
    select('id, date, treatment_name, skin_layer, body_area, satisfaction, memo').
    eq('user_id', user.id).
    eq('date', date).
    eq('clinic', clinic).
    order('created_at', { ascending: false });
    setMatchedTreatments((prev) => ({ ...prev, [paymentId]: data ?? [] }));
  };

  const handleExpand = (p: PaymentRecord) => {
    if (expandedId === p.id) {
      setExpandedId(null);
      setEditingId(null);
    } else {
      setExpandedId(p.id);
      setEditingId(null);
      loadMatchedTreatments(p.id, p.date, p.clinic);
    }
  };

  const startEdit = (p: PaymentRecord) => {
    setEditingId(p.id);
    setEditForm({ date: p.date, clinic: p.clinic, treatment_name: p.treatment_name, amount: p.amount, method: p.method, memo: p.memo });
  };

  const saveEdit = async (id: string) => {
    const { error } = await supabase.from('payment_records').update({
      date: editForm.date,
      clinic: editForm.clinic,
      treatment_name: editForm.treatment_name,
      amount: editForm.amount,
      method: editForm.method,
      memo: editForm.memo || null
    }).eq('id', id);
    if (!error) {
      setEditingId(null);
      loadPayments();
    }
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    const { error } = await supabase.from('payment_records').delete().eq('id', id);
    if (!error) {
      setPayments((prev) => prev.filter((p) => p.id !== id));
      if (expandedId === id) setExpandedId(null);
    }
    setDeleting(null);
  };

  const METHOD_FILTER_OPTIONS = [
    { key: null, label: '전체' },
    { key: '카드', label: '카드' },
    { key: '현금', label: '현금' },
    { key: '포인트', label: '포인트' },
    { key: '시술결제', label: '시술권' },
    { key: '서비스', label: '서비스' },
  ] as const;

  const filteredPayments = useMemo(() => {
    if (!methodFilter) return payments;
    return payments.filter(p => p.method === methodFilter);
  }, [payments, methodFilter]);

  const totalSpent = filteredPayments.reduce((s, p) => s + p.amount, 0);

  const LAYER_LABEL: Record<string, string> = { epidermis: '표피', dermis: '진피', subcutaneous: '피하' };

  if (loading) return <div className="text-center py-8 text-sm text-muted-foreground">불러오는 중...</div>;

  return (
    <div className="space-y-3">
      {/* Payment method filter chips */}
      <div className="flex gap-1.5 flex-wrap">
        {METHOD_FILTER_OPTIONS.map(opt => (
          <button
            key={opt.label}
            onClick={() => setMethodFilter(prev => prev === opt.key ? null : opt.key)}
            className={cn('px-3 py-1.5 rounded-full text-[11px] font-semibold border transition-all',
              methodFilter === opt.key ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border/50 text-muted-foreground')}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <Card className="glass-card">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] text-muted-foreground">총 결제 금액</p>
              <p className="text-xl font-black text-foreground">{totalSpent.toLocaleString()}<span className="text-sm font-normal text-muted-foreground ml-1">원</span></p>
            </div>
            <div className="text-right">
              <p className="text-[11px] text-muted-foreground">결제 건수</p>
              <p className="text-xl font-black text-foreground">{filteredPayments.length}<span className="text-sm font-normal text-muted-foreground ml-1">건</span></p>
            </div>
          </div>
          <Button
            onClick={() => payGuardAction(() => setShowAddModal(true))}
            className="w-full mt-3 rounded-xl text-xs gap-1.5"
            size="sm">
            <Plus className="h-3.5 w-3.5" />
            결제 내역 추가
          </Button>
        </CardContent>
      </Card>

      <AddPaymentModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSaved={() => {setShowAddModal(false);loadPayments();}} />

      {filteredPayments.length === 0 ?
      <div className="space-y-3 mt-2">
        {/* 예시 결제기록 카드 */}
        <div className="relative opacity-60 pointer-events-none">
          <div className="absolute -top-2 left-3 z-10">
            <span className="bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-full">예시</span>
          </div>
          <Card className="glass-card border-dashed border-muted-foreground/30">
            <CardContent className="p-3.5">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">울쎄라 리프팅</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">2026-03-05 · 청담 에스테틱</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-black text-foreground">-350,000원</p>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">카드</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="relative opacity-60 pointer-events-none">
          <Card className="glass-card border-dashed border-muted-foreground/30">
            <CardContent className="p-3.5">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">보톡스 (턱)</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">2026-02-20 · 강남 피부과</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-black text-foreground">-120,000원</p>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">현금</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="rounded-2xl border border-dashed border-muted-foreground/20 bg-muted/50 p-6 text-center">
          <CreditCard className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
          <p className="text-sm font-semibold text-muted-foreground mb-1">결제 기록을 시작해 보세요</p>
          <p className="text-xs text-muted-foreground/70 leading-relaxed">
            지출을 기록하면 어디에 얼마를 쓰는지 보여요.<br />
            현명한 피부 투자의 첫걸음이에요 💡
          </p>
          <div className="flex items-center justify-center gap-1.5 mt-4">
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-[#F2C94C] shadow-md">
              <span className="text-[#E87461] text-lg font-bold">+</span>
            </span>
            <p className="text-xs font-medium text-muted-foreground">
              우측 하단 <span className="font-bold text-[#E87461]">+</span> 버튼으로 바로 등록하세요
            </p>
          </div>
        </div>
      </div> :
      <div className="space-y-2">
          {filteredPayments.map((p) => {
          const isExpanded = expandedId === p.id;
          const isEditing = editingId === p.id;
          const matched = matchedTreatments[p.id] ?? [];

          return (
            <Card key={p.id} className="glass-card overflow-hidden">
                <CardContent className="p-3.5 cursor-pointer" onClick={() => handleExpand(p)}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{p.treatment_name}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{p.date} · {p.clinic}</p>
                      {p.memo && <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{p.memo}</p>}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="text-right">
                        <p className={`text-sm font-black ${p.method === '포인트충전' ? 'text-emerald-500' : 'text-foreground'}`}>
                          {p.method === '포인트충전' ? '+' : '-'}{p.amount.toLocaleString()}원
                        </p>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">{p.method}</span>
                      </div>
                      {isExpanded ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
                    </div>
                  </div>
                </CardContent>

                {isExpanded &&
              <div className="border-t border-border px-3.5 pb-3.5 pt-3 space-y-3">
                    {!isEditing ?
                <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                          <div><span className="text-muted-foreground">날짜</span><p className="font-medium text-foreground">{p.date}</p></div>
                          <div><span className="text-muted-foreground">병원</span><p className="font-medium text-foreground">{p.clinic}</p></div>
                          <div><span className="text-muted-foreground">결제 방법</span><p className="font-medium text-foreground">{p.method}</p></div>
                          <div><span className="text-muted-foreground">금액</span><p className="font-medium text-foreground">{p.amount.toLocaleString()}원</p></div>
                          {p.charged_amount && p.charged_amount !== p.amount &&
                    <div><span className="text-muted-foreground">충전금액</span><p className="font-medium text-emerald-600">{p.charged_amount.toLocaleString()}원</p></div>
                    }
                          {p.memo &&
                    <div className="col-span-2"><span className="text-muted-foreground">메모</span><p className="font-medium text-foreground">{p.memo}</p></div>
                    }
                        </div>
                        <div className="flex gap-2 pt-1">
                          <Button variant="outline" size="sm" className="flex-1 rounded-xl text-xs h-8 gap-1" onClick={(e) => {e.stopPropagation();startEdit(p);}}>
                            <Pencil className="h-3 w-3" /> 수정
                          </Button>
                          <Button variant="outline" size="sm"
                    className="rounded-xl text-xs h-8 gap-1 text-destructive border-destructive/30 hover:bg-destructive/10"
                    disabled={deleting === p.id}
                    onClick={(e) => {e.stopPropagation();if (confirm('이 결제 기록을 삭제하시겠습니까?')) handleDelete(p.id);}}>
                            <Trash2 className="h-3 w-3" /> 삭제
                          </Button>
                        </div>
                      </div> :
                <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] text-muted-foreground mb-1 block">날짜</label>
                            <input type="date" value={editForm.date || ''} onChange={(e) => setEditForm((f) => ({ ...f, date: e.target.value }))}
                      className="w-full bg-background border border-input rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring" />
                          </div>
                          <div>
                            <label className="text-[10px] text-muted-foreground mb-1 block">금액</label>
                            <input type="number" value={editForm.amount || ''} onChange={(e) => setEditForm((f) => ({ ...f, amount: Number(e.target.value) }))}
                      className="w-full bg-background border border-input rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring" />
                          </div>
                        </div>
                        <div>
                          <label className="text-[10px] text-muted-foreground mb-1 block">병원명</label>
                          <input type="text" value={editForm.clinic || ''} onChange={(e) => setEditForm((f) => ({ ...f, clinic: e.target.value }))}
                    className="w-full bg-background border border-input rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring" />
                        </div>
                        <div>
                          <label className="text-[10px] text-muted-foreground mb-1 block">내용</label>
                          <input type="text" value={editForm.treatment_name || ''} onChange={(e) => setEditForm((f) => ({ ...f, treatment_name: e.target.value }))}
                    className="w-full bg-background border border-input rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring" />
                        </div>
                        <div>
                          <label className="text-[10px] text-muted-foreground mb-1 block">결제 방법</label>
                          <div className="flex gap-1.5">
                            {[{ value: '포인트충전', label: '포인트' }, { value: '카드', label: '카드' }, { value: '현금', label: '현금' }, { value: '서비스', label: '서비스' }].map((m) =>
                      <button key={m.value} onClick={() => setEditForm((f) => ({ ...f, method: m.value }))}
                      className={cn('flex-1 py-1.5 rounded-lg text-[11px] font-semibold border transition-all',
                      editForm.method === m.value ? 'border-primary bg-primary/10 text-primary' : 'border-input bg-background text-muted-foreground')}>
                                {m.label}
                              </button>
                      )}
                          </div>
                        </div>
                        <div>
                          <label className="text-[10px] text-muted-foreground mb-1 block">메모</label>
                          <input type="text" value={editForm.memo || ''} onChange={(e) => setEditForm((f) => ({ ...f, memo: e.target.value }))}
                    placeholder="메모 (선택)"
                    className="w-full bg-background border border-input rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring" />
                        </div>
                        <div className="flex gap-2 pt-1">
                          <Button size="sm" className="flex-1 rounded-xl text-xs h-8 gap-1" onClick={() => saveEdit(p.id)}>
                            <Check className="h-3 w-3" /> 저장
                          </Button>
                          <Button variant="outline" size="sm" className="rounded-xl text-xs h-8" onClick={() => setEditingId(null)}>
                            취소
                          </Button>
                        </div>
                      </div>
                }

                    {matched.length > 0 &&
                <div className="space-y-1.5">
                        <p className="text-[10px] text-muted-foreground font-semibold flex items-center gap-1">
                          <ClipboardList className="h-3 w-3" /> 같은 날 시술 기록 ({matched.length}건)
                        </p>
                        {matched.map((t) =>
                  <div key={t.id} className="bg-muted/50 rounded-lg px-3 py-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                <p className="text-xs font-medium text-foreground">{t.treatment_name}</p>
                                {t.skin_layer &&
                        <span className={cn('text-[9px] px-1 py-0.5 rounded border font-medium',
                        t.skin_layer === 'epidermis' ? 'bg-amber-100 text-amber-600 border-amber-300' :
                        t.skin_layer === 'dermis' ? 'bg-blue-100 text-blue-600 border-blue-300' :
                        'bg-purple-100 text-purple-600 border-purple-300'
                        )}>{LAYER_LABEL[t.skin_layer] || t.skin_layer}</span>
                        }
                              </div>
                              {t.satisfaction &&
                      <div className="flex gap-0.5">
                                  {[1, 2, 3, 4, 5].map((s) =>
                        <Star key={s} className={cn('h-3 w-3', s <= t.satisfaction! ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/20')} />
                        )}
                                </div>
                      }
                            </div>
                            {t.memo && <p className="text-[10px] text-muted-foreground mt-0.5">{t.memo}</p>}
                          </div>
                  )}
                      </div>
                }
                    {matched.length === 0 && expandedId === p.id &&
                <p className="text-[10px] text-muted-foreground text-center py-2">같은 날/같은 병원의 시술 기록이 없습니다</p>
                }
                  </div>
              }
              </Card>);
        })}
        </div>
      }
      <LoginRequiredSheet
        open={payLoginSheet}
        onClose={payLoginClose}
        onLoginSuccess={payLoginSuccess}
      />
    </div>);
}

export default CalendarPage;
