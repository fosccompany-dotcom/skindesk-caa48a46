import { useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent } from '@/components/ui/card';
import { SkinLayerBadge, BodyAreaBadge } from '@/components/SkinLayerBadge';
import { mockEvents } from '@/data/mockData';
import { CalendarDays, Bell, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

const eventTypeConfig = {
  treatment: { icon: CalendarDays, color: 'text-accent-foreground', bg: 'bg-accent' },
  reminder: { icon: Bell, color: 'text-amber', bg: 'bg-amber-light' },
  recommendation: { icon: Sparkles, color: 'text-info', bg: 'bg-info-light' },
};

const CalendarPage = () => {
  const [selected, setSelected] = useState<Date | undefined>(new Date());

  const selectedStr = selected ? format(selected, 'yyyy-MM-dd') : '';
  const dayEvents = mockEvents.filter((e) => e.date === selectedStr);
  const eventDates = mockEvents.map((e) => new Date(e.date));

  return (
    <div className="min-h-screen bg-background">
      <div className="page-header safe-top">
        <h1 className="text-lg font-bold">캘린더</h1>
        <p className="text-xs text-muted-foreground mt-1">시술 일정과 관리 주기</p>
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
              modifiers={{ event: eventDates }}
              modifiersClassNames={{ event: 'bg-accent text-accent-foreground font-semibold rounded-full' }}
            />
          </CardContent>
        </Card>

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
              const config = eventTypeConfig[event.type];
              const Icon = config.icon;
              return (
                <Card key={event.id} className="glass-card">
                  <CardContent className="flex items-center gap-3 p-4">
                    <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', config.bg)}>
                      <Icon className={cn('h-4 w-4', config.color)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold">{event.title}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {event.type === 'treatment' ? '시술' : event.type === 'reminder' ? '알림' : '추천'}
                      </p>
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