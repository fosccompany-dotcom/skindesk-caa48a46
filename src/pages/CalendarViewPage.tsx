import { useState, useMemo, useEffect, useCallback } from 'react';
import { SkinLayerBadge, BodyAreaBadge } from '@/components/SkinLayerBadge';
import { Card, CardContent } from '@/components/ui/card';
import { useCycles } from '@/context/CyclesContext';
import { useRecords } from '@/context/RecordsContext';
import { CalendarDays, Bell, Sparkles, RotateCcw, ChevronLeft, ChevronRight, Stethoscope, Star, Plus, ClipboardList, CalendarPlus, Clock, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, addDays, addMonths, subMonths, differenceInDays, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isSameMonth, isSameDay, isToday } from 'date-fns';
import { ko } from 'date-fns/locale';
import { CalendarEvent, TreatmentRecord, BodyArea } from '@/types/skin';
import logoImg from '@/assets/logo.png';
import AddTreatmentModal from '@/components/AddTreatmentModal';
import AddReservationModal from '@/components/AddReservationModal';
import LoginRequiredSheet from '@/components/LoginRequiredSheet';
import { useLoginGuard } from '@/hooks/useLoginGuard';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
const eventTypeConfig = {
  treatment:     { icon: CalendarDays, color: 'text-primary',    bg: 'bg-primary/10',   dotColor: 'bg-primary' },
  reminder:      { icon: Bell,         color: 'text-amber-600',  bg: 'bg-amber-50',     dotColor: 'bg-amber-400' },
  recommendation:{ icon: Sparkles,     color: 'text-info',       bg: 'bg-info-light',   dotColor: 'bg-info' },
  cycle:         { icon: RotateCcw,    color: 'text-sage-dark',  bg: 'bg-sage-light',   dotColor: 'bg-sage' },
};

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

function RecordCard({ r }: { r: TreatmentRecord }) {
  return (
    <Card className="glass-card">
      <CardContent className="p-3.5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
            <Stethoscope className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{r.treatmentName}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">{r.clinic}</p>
          </div>
          <div className="flex flex-col gap-1 items-end shrink-0">
            {r.bodyArea && <BodyAreaBadge area={r.bodyArea as BodyArea} />}
            {r.skinLayer && <SkinLayerBadge layer={r.skinLayer} />}
          </div>
        </div>
        {r.satisfaction && (
          <div className="flex gap-0.5 mt-2 ml-[52px]">
            {[1,2,3,4,5].map(s => (
              <Star key={s} className={cn('h-3 w-3', s <= r.satisfaction! ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/20')} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

const CalendarViewPage = () => {
  const today = new Date('2026-03-08');
  const [currentMonth, setCurrentMonth] = useState(today);
  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showActionPicker, setShowActionPicker] = useState(false);
  const [showReservationModal, setShowReservationModal] = useState(false);
  const { cycles } = useCycles();
  const { records, addRecord } = useRecords();
  const { showLoginSheet, guardAction, handleLoginSuccess, handleClose: handleLoginClose } = useLoginGuard();

  const cycleEvents = useMemo(() => {
    const events: (CalendarEvent & { cycleInfo?: string })[] = [];
    cycles.forEach((cycle) => {
      const lastDate = new Date(cycle.lastTreatmentDate);
      let nextDate = addDays(lastDate, cycle.cycleDays);
      if (nextDate < today) {
        const overdueDays = differenceInDays(today, nextDate);
        events.push({
          id: `auto_overdue_${cycle.id}`, date: format(today, 'yyyy-MM-dd'),
          title: `${cycle.treatmentName} 시술 필요`, type: 'reminder',
          skinLayer: cycle.skinLayer, bodyArea: cycle.bodyArea,
          cycleInfo: `${overdueDays}일 지남 · ${cycle.clinic}`,
        } as any);
      }
      for (let i = 0; i < 6; i++) {
        if (nextDate >= today) {
          events.push({
            id: `auto_${cycle.id}_${i}`, date: format(nextDate, 'yyyy-MM-dd'),
            title: `${cycle.treatmentName} 추천`, type: 'recommendation',
            skinLayer: cycle.skinLayer, bodyArea: cycle.bodyArea,
            cycleInfo: `${cycle.cycleDays}일 주기 · ${cycle.clinic}`,
          } as any);
        }
        nextDate = addDays(nextDate, cycle.cycleDays);
      }
    });
    return events;
  }, [cycles, today]);

  const allEvents = useMemo(() => cycleEvents, [cycleEvents]);

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

  const eventsByDate = useMemo(() => {
    const map: Record<string, typeof allEvents> = {};
    allEvents.forEach(event => {
      if (!map[event.date]) map[event.date] = [];
      map[event.date].push(event);
    });
    return map;
  }, [allEvents]);

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

  const goToPrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const goToNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const goToToday = () => { setCurrentMonth(today); setSelectedDate(today); };

  return (
    <div className="min-h-screen bg-background">
      <div className="relative safe-top overflow-hidden">
        <img src={logoImg} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/40" />
        <div className="page-header-gradient relative z-10" style={{ background: 'transparent' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-70 font-light">캘린더 📅</p>
              <h1 className="mt-0.5 text-xl font-bold">{format(currentMonth, 'yyyy년 M월', { locale: ko })}</h1>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={goToToday} className="px-3 py-1.5 text-xs font-medium text-primary-foreground bg-white/15 rounded-full backdrop-blur-sm tap-target">오늘</button>
              <button onClick={goToPrevMonth} className="p-2 hover:bg-white/10 rounded-full tap-target"><ChevronLeft className="h-5 w-5 text-primary-foreground/70" /></button>
              <button onClick={goToNextMonth} className="p-2 hover:bg-white/10 rounded-full tap-target"><ChevronRight className="h-5 w-5 text-primary-foreground/70" /></button>
            </div>
          </div>
        </div>
      </div>

      <div className="page-content space-y-5 pt-4">
        <Card className="glass-card overflow-hidden">
          <div className="grid grid-cols-7 border-b border-border">
            {WEEKDAYS.map((day, idx) => (
              <div key={day} className={cn('text-center text-xs font-medium py-2.5',
                idx === 0 && 'text-rose', idx === 6 && 'text-info',
                idx !== 0 && idx !== 6 && 'text-muted-foreground')}>
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {calendarDays.map((day, idx) => {
              const dateStr = format(day, 'yyyy-MM-dd');
              const dayEvents = eventsByDate[dateStr] || [];
              const recCount = recordsByDate[dateStr]?.length || 0;
              const hasRec = recCount > 0;
              const isCurrentMonth = isSameMonth(day, currentMonth);
              const isSelected = isSameDay(day, selectedDate);
              const isTodayDate = isToday(day) || isSameDay(day, today);
              const dayOfWeek = day.getDay();
              const heatmapOpacity = recCount >= 3 ? 1 : recCount === 2 ? 0.7 : recCount === 1 ? 0.4 : 0;

              return (
                <button key={idx} onClick={() => setSelectedDate(day)}
                  className={cn('relative flex flex-col items-center py-2 min-h-[52px] tap-target transition-colors',
                    !isCurrentMonth && 'opacity-30',
                    isSelected && !isTodayDate && 'bg-primary/10')}
                  style={heatmapOpacity > 0 && isCurrentMonth && !isSelected ? {
                    backgroundColor: `rgba(255, 127, 127, ${heatmapOpacity * 0.25})`,
                  } : undefined}
                >
                  <span className={cn('w-7 h-7 flex items-center justify-center text-sm rounded-full transition-all',
                    isSelected && isTodayDate && 'bg-primary text-primary-foreground font-bold ring-2 ring-primary/30 ring-offset-1',
                    isSelected && !isTodayDate && 'bg-primary text-primary-foreground font-bold',
                    !isSelected && isTodayDate && 'bg-primary/20 text-primary font-semibold',
                    !isSelected && !isTodayDate && dayOfWeek === 0 && 'text-rose',
                    !isSelected && !isTodayDate && dayOfWeek === 6 && 'text-info',
                    !isSelected && !isTodayDate && dayOfWeek !== 0 && dayOfWeek !== 6 && 'text-foreground')}>
                    {format(day, 'd')}
                  </span>
                  <div className="flex gap-0.5 mt-0.5 h-2 items-center">
                    {dayEvents.slice(0, 2).map((event, i) => {
                      const isCycleEvent = event.id.startsWith('auto_');
                      const configKey = isCycleEvent ? 'cycle' : event.type;
                      const config = eventTypeConfig[configKey as keyof typeof eventTypeConfig] || eventTypeConfig.recommendation;
                      return <div key={i} className={cn('w-1.5 h-1.5 rounded-full', config.dotColor)} />;
                    })}
                    {hasRec && <div className="w-1.5 h-1.5 rounded-full bg-[#C9A96E]" />}
                  </div>
                </button>
              );
            })}
          </div>
        </Card>

        <div className="space-y-4">
          <h2 className="section-title flex items-center gap-1.5">
            <CalendarDays className="h-3.5 w-3.5 text-info" />
            {format(selectedDate, 'M월 d일 EEEE', { locale: ko })}
          </h2>

          {selectedRecords.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-[#C9A96E] flex items-center gap-1.5 px-1">
                <Stethoscope size={12} /> 시술 기록 ({selectedRecords.length})
              </p>
              {selectedRecords.map(r => <RecordCard key={r.id} r={r} />)}
            </div>
          )}

          {selectedEvents.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5 px-1">
                <Sparkles size={12} /> 일정 & 추천 ({selectedEvents.length})
              </p>
              {selectedEvents.map((event) => {
                const isCycleEvent = event.id.startsWith('auto_');
                const configKey = isCycleEvent ? 'cycle' : event.type;
                const config = eventTypeConfig[configKey as keyof typeof eventTypeConfig] || eventTypeConfig.recommendation;
                const Icon = config.icon;
                const cycleInfo = (event as any).cycleInfo;
                return (
                  <Card key={event.id} className="glass-card">
                    <CardContent className="flex items-center gap-3 p-3.5">
                      <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', config.bg)}>
                        <Icon className={cn('h-4 w-4', config.color)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold">{event.title}</p>
                        {cycleInfo
                          ? <p className="text-[11px] text-muted-foreground mt-0.5">{cycleInfo}</p>
                          : <p className="text-[11px] text-muted-foreground mt-0.5">
                              {configKey === 'treatment' ? '예약된 시술' : configKey === 'reminder' ? '알림' : '추천'}
                            </p>
                        }
                      </div>
                      <div className="flex flex-col gap-1 items-end shrink-0">
                        {event.bodyArea && <BodyAreaBadge area={event.bodyArea} />}
                        {event.skinLayer && <SkinLayerBadge layer={event.skinLayer} />}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {selectedRecords.length === 0 && selectedEvents.length === 0 && (
            <button
              onClick={() => guardAction(() => setShowActionPicker(true))}
              className="w-full text-left"
            >
              <div className="rounded-2xl border border-dashed border-primary/30 bg-primary/5 p-6 text-center hover:bg-primary/10 transition-colors active:scale-[0.98]">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mx-auto mb-3">
                  <Plus className="h-6 w-6 text-primary" />
                </div>
                <p className="text-sm font-semibold text-foreground mb-1">이 날짜에 일정이 없어요</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  탭하여 <span className="font-bold text-primary">{format(selectedDate, 'M월 d일')}</span>에 추가하세요
                </p>
              </div>
            </button>
          )}
        </div>
      </div>

      {/* Action Picker Sheet */}
      <Sheet open={showActionPicker} onOpenChange={setShowActionPicker}>
        <SheetContent side="bottom" className="rounded-t-3xl px-5 pb-8 pt-4">
          <div className="mx-auto w-10 h-1 rounded-full bg-muted-foreground/20 mb-5" />
          <p className="text-center text-base font-semibold mb-1">
            <span className="text-primary">{format(selectedDate, 'M월 d일')}</span>을 선택하셨어요
          </p>
          <p className="text-center text-sm text-muted-foreground mb-6">무엇을 추가하시겠어요?</p>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => {
                setShowActionPicker(false);
                setShowReservationModal(true);
              }}
              className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-5 hover:bg-accent/50 active:scale-[0.97] transition-all"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-info/10">
                <CalendarPlus className="h-6 w-6 text-info" />
              </div>
              <span className="text-sm font-semibold">예약 일정 추가</span>
              <span className="text-[11px] text-muted-foreground leading-tight">앞으로의 예약을<br/>미리 등록해요</span>
            </button>

            <button
              onClick={() => {
                setShowActionPicker(false);
                setShowAddModal(true);
              }}
              className="flex flex-col items-center gap-3 rounded-2xl border border-primary/30 bg-primary/5 p-5 hover:bg-primary/10 active:scale-[0.97] transition-all"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <ClipboardList className="h-6 w-6 text-primary" />
              </div>
              <span className="text-sm font-semibold">시술 내역 추가</span>
              <span className="text-[11px] text-muted-foreground leading-tight">받은 시술을<br/>기록해요</span>
            </button>
          </div>
        </SheetContent>
      </Sheet>

      <AddTreatmentModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={addRecord}
        defaultDate={selectedDateStr}
      />

      <AddReservationModal
        open={showReservationModal}
        onClose={() => setShowReservationModal(false)}
        defaultDate={selectedDateStr}
      />

      <LoginRequiredSheet
        open={showLoginSheet}
        onClose={handleLoginClose}
        onLoginSuccess={handleLoginSuccess}
      />
    </div>
  );
};

export default CalendarViewPage;
