import { useState, useMemo } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent } from '@/components/ui/card';
import { SkinLayerBadge, BodyAreaBadge } from '@/components/SkinLayerBadge';
import { mockEvents } from '@/data/mockData';
import { useCycles } from '@/context/CyclesContext';
import { CalendarDays, Bell, Sparkles, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, addDays, differenceInDays } from 'date-fns';
import { ko } from 'date-fns/locale';
import { CalendarEvent, BODY_AREA_LABELS } from '@/types/skin';

const eventTypeConfig = {
  treatment: { icon: CalendarDays, color: 'text-accent-foreground', bg: 'bg-accent', label: '예약' },
  reminder: { icon: Bell, color: 'text-amber', bg: 'bg-amber-light', label: '알림' },
  recommendation: { icon: Sparkles, color: 'text-info', bg: 'bg-info-light', label: '추천' },
  cycle: { icon: RotateCcw, color: 'text-sage-dark', bg: 'bg-sage-light', label: '주기 도래' },
};

const CalendarPage = () => {
  const [selected, setSelected] = useState<Date | undefined>(new Date('2026-03-08'));
  const { cycles } = useCycles();

  // 주기 기반 자동 추천 이벤트 생성 (앞으로 90일)
  const cycleEvents = useMemo(() => {
    const events: (CalendarEvent & { cycleInfo?: string })[] = [];
    const today = new Date('2026-03-08');

    cycles.forEach((cycle) => {
      const lastDate = new Date(cycle.lastTreatmentDate);
      let nextDate = addDays(lastDate, cycle.cycleDays);

      // 이미 지난 경우 → 오늘 기준으로 "지금 해야 함" 표시
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
        });
        // 다음 추천일도 계산
        nextDate = addDays(today, 7); // 초과 시 1주 내 추천
      }

      // 앞으로 3회차 추천일 생성
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
          });
        }
        nextDate = addDays(nextDate, cycle.cycleDays);
      }
    });

    return events;
  }, [cycles]);

  // 모든 이벤트 합치기 (기존 + 자동 추천)
  const allEvents = useMemo(() => {
    const combined = [...mockEvents, ...cycleEvents];
    // 중복 제거 (같은 날 같은 시술명이면 자동 추천 제외)
    const seen = new Set(mockEvents.map(e => `${e.date}_${e.title}`));
    return combined.filter(e => {
      const key = `${e.date}_${e.title}`;
      if (seen.has(key) && e.id.startsWith('auto_')) return false;
      seen.add(key);
      return true;
    });
  }, [cycleEvents]);

  const selectedStr = selected ? format(selected, 'yyyy-MM-dd') : '';
  const dayEvents = allEvents.filter((e) => e.date === selectedStr);
  const eventDates = [...new Set(allEvents.map(e => e.date))].map(d => new Date(d));

  // 추천일이 있는 날짜
  const recommendationDates = [...new Set(cycleEvents.map(e => e.date))].map(d => new Date(d));

  return (
    <div className="min-h-screen bg-background">
      <div className="page-header safe-top">
        <h1 className="text-lg font-bold">캘린더</h1>
        <p className="text-xs text-muted-foreground mt-1">시술 일정과 자동 추천 주기</p>
      </div>

      <div className="page-content space-y-4">
        <Card className="glass-card overflow-hidden">
          <CardContent className="p-2">
            <Calendar
              mode="single"
              selected={selected}
              onSelect={setSelected}
              locale={ko}
              className="pointer-events-auto"
              modifiers={{
                event: eventDates,
                recommendation: recommendationDates,
              }}
              modifiersClassNames={{
                event: 'bg-accent text-accent-foreground font-semibold rounded-full',
                recommendation: 'ring-2 ring-info/30 rounded-full',
              }}
            />
          </CardContent>
        </Card>

        {/* 범례 */}
        <div className="flex items-center gap-4 px-2">
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-accent border border-accent-foreground/20" />
            <span className="text-[10px] text-muted-foreground">예약</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-background ring-2 ring-info/40" />
            <span className="text-[10px] text-muted-foreground">추천일</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-amber-light" />
            <span className="text-[10px] text-muted-foreground">알림</span>
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="section-title">
            {selected ? format(selected, 'M월 d일 (EEEE)', { locale: ko }) : '날짜를 선택하세요'}
          </h2>

          {dayEvents.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">예정된 일정이 없습니다</p>
            </div>
          ) : (
            dayEvents.map((event) => {
              const isCycleEvent = event.id.startsWith('auto_');
              const configKey = isCycleEvent ? 'cycle' : event.type;
              const config = eventTypeConfig[configKey as keyof typeof eventTypeConfig] || eventTypeConfig.recommendation;
              const Icon = config.icon;
              const cycleInfo = (event as any).cycleInfo;

              return (
                <Card key={event.id} className={cn('glass-card', isCycleEvent && 'border-info/20')}>
                  <CardContent className="flex items-center gap-3 p-4">
                    <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', config.bg)}>
                      <Icon className={cn('h-4 w-4', config.color)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold">{event.title}</p>
                      {cycleInfo ? (
                        <p className="text-[11px] text-muted-foreground">{cycleInfo}</p>
                      ) : (
                        <p className="text-[11px] text-muted-foreground">{config.label}</p>
                      )}
                    </div>
                    <div className="flex flex-col gap-1 items-end shrink-0">
                      {event.bodyArea && <BodyAreaBadge area={event.bodyArea} />}
                      {event.skinLayer && <SkinLayerBadge layer={event.skinLayer} />}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default CalendarPage;