import { useState, useMemo } from 'react';
import { SkinLayerBadge, BodyAreaBadge } from '@/components/SkinLayerBadge';
import { mockEvents } from '@/data/mockData';
import { useCycles } from '@/context/CyclesContext';
import { CalendarDays, Bell, Sparkles, RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, addDays, addMonths, subMonths, differenceInDays, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isSameMonth, isSameDay, isToday } from 'date-fns';
import { ko } from 'date-fns/locale';
import { CalendarEvent, BODY_AREA_LABELS } from '@/types/skin';

const eventTypeConfig = {
  treatment: { icon: CalendarDays, color: 'text-primary', bg: 'bg-primary/10', dotColor: 'bg-primary' },
  reminder: { icon: Bell, color: 'text-amber-600', bg: 'bg-amber-50', dotColor: 'bg-amber' },
  recommendation: { icon: Sparkles, color: 'text-info', bg: 'bg-info-light', dotColor: 'bg-info' },
  cycle: { icon: RotateCcw, color: 'text-sage-dark', bg: 'bg-sage-light', dotColor: 'bg-sage' },
};

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

const CalendarPage = () => {
  const today = new Date('2026-03-08');
  const [currentMonth, setCurrentMonth] = useState(today);
  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const { cycles } = useCycles();

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
    const combined = [...mockEvents, ...cycleEvents];
    const seen = new Set(mockEvents.map(e => `${e.date}_${e.title}`));
    return combined.filter(e => {
      const key = `${e.date}_${e.title}`;
      if (seen.has(key) && e.id.startsWith('auto_')) return false;
      seen.add(key);
      return true;
    });
  }, [cycleEvents]);

  // 달력 날짜 배열 생성
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 0 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });

    const days: Date[] = [];
    let day = startDate;
    while (day <= endDate) {
      days.push(day);
      day = addDays(day, 1);
    }
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

  const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
  const selectedEvents = eventsByDate[selectedDateStr] || [];

  const goToPrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const goToNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const goToToday = () => {
    setCurrentMonth(today);
    setSelectedDate(today);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* 헤더 */}
      <div className="sticky top-0 z-10 bg-card border-b border-border safe-top">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold">{format(currentMonth, 'yyyy년 M월', { locale: ko })}</h1>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={goToToday}
              className="px-3 py-1.5 text-xs font-medium text-primary bg-primary/10 rounded-full"
            >
              오늘
            </button>
            <button onClick={goToPrevMonth} className="p-2 hover:bg-muted rounded-full">
              <ChevronLeft className="h-5 w-5 text-muted-foreground" />
            </button>
            <button onClick={goToNextMonth} className="p-2 hover:bg-muted rounded-full">
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* 요일 헤더 */}
        <div className="grid grid-cols-7 border-t border-border">
          {WEEKDAYS.map((day, idx) => (
            <div
              key={day}
              className={cn(
                'text-center text-xs font-medium py-2',
                idx === 0 && 'text-rose',
                idx === 6 && 'text-info',
                idx !== 0 && idx !== 6 && 'text-muted-foreground'
              )}
            >
              {day}
            </div>
          ))}
        </div>

        {/* 캘린더 그리드 */}
        <div className="grid grid-cols-7 border-t border-border">
          {calendarDays.map((day, idx) => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const dayEvents = eventsByDate[dateStr] || [];
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isSelected = isSameDay(day, selectedDate);
            const isTodayDate = isToday(day) || isSameDay(day, today);
            const dayOfWeek = day.getDay();

            return (
              <button
                key={idx}
                onClick={() => setSelectedDate(day)}
                className={cn(
                  'relative flex flex-col items-center py-2 min-h-[52px] border-b border-r border-border/50',
                  !isCurrentMonth && 'opacity-30',
                  isSelected && 'bg-primary/5'
                )}
              >
                <span
                  className={cn(
                    'w-7 h-7 flex items-center justify-center text-sm rounded-full',
                    isTodayDate && 'bg-primary text-primary-foreground font-semibold',
                    !isTodayDate && isSelected && 'bg-muted font-medium',
                    !isTodayDate && !isSelected && dayOfWeek === 0 && 'text-rose',
                    !isTodayDate && !isSelected && dayOfWeek === 6 && 'text-info',
                    !isTodayDate && !isSelected && dayOfWeek !== 0 && dayOfWeek !== 6 && 'text-foreground'
                  )}
                >
                  {format(day, 'd')}
                </span>
                {/* 이벤트 도트 */}
                {dayEvents.length > 0 && (
                  <div className="flex gap-0.5 mt-0.5">
                    {dayEvents.slice(0, 3).map((event, i) => {
                      const isCycleEvent = event.id.startsWith('auto_');
                      const configKey = isCycleEvent ? 'cycle' : event.type;
                      const config = eventTypeConfig[configKey as keyof typeof eventTypeConfig] || eventTypeConfig.recommendation;
                      return (
                        <div
                          key={i}
                          className={cn('w-1.5 h-1.5 rounded-full', config.dotColor)}
                        />
                      );
                    })}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 선택된 날짜 일정 */}
      <div className="flex-1 overflow-auto pb-24">
        <div className="px-4 py-3 bg-muted/50 border-b border-border sticky top-0">
          <h2 className="text-sm font-semibold text-foreground">
            {format(selectedDate, 'M월 d일 EEEE', { locale: ko })}
          </h2>
        </div>

        {selectedEvents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <CalendarDays className="h-12 w-12 mb-3 opacity-30" />
            <p className="text-sm">일정이 없습니다</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {selectedEvents.map((event) => {
              const isCycleEvent = event.id.startsWith('auto_');
              const configKey = isCycleEvent ? 'cycle' : event.type;
              const config = eventTypeConfig[configKey as keyof typeof eventTypeConfig] || eventTypeConfig.recommendation;
              const Icon = config.icon;
              const cycleInfo = (event as any).cycleInfo;

              return (
                <div key={event.id} className="flex items-start gap-3 px-4 py-3 bg-card">
                  <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl mt-0.5', config.bg)}>
                    <Icon className={cn('h-4 w-4', config.color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{event.title}</p>
                    {cycleInfo ? (
                      <p className="text-xs text-muted-foreground mt-0.5">{cycleInfo}</p>
                    ) : (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {configKey === 'treatment' ? '예약된 시술' : configKey === 'reminder' ? '알림' : '추천'}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col gap-1 items-end shrink-0">
                    {event.bodyArea && <BodyAreaBadge area={event.bodyArea} />}
                    {event.skinLayer && <SkinLayerBadge layer={event.skinLayer} />}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default CalendarPage;
