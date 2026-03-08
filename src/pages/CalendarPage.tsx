import { useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent } from '@/components/ui/card';
import SkinLayerBadge from '@/components/SkinLayerBadge';
import { mockEvents } from '@/data/mockData';
import { CalendarDays, Bell, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

const eventTypeConfig = {
  treatment: { icon: CalendarDays, color: 'text-sage-dark', bg: 'bg-sage-light' },
  reminder: { icon: Bell, color: 'text-amber', bg: 'bg-amber-light' },
  recommendation: { icon: Sparkles, color: 'text-info', bg: 'bg-info-light' },
};

const CalendarPage = () => {
  const [selected, setSelected] = useState<Date | undefined>(new Date());

  const selectedStr = selected ? format(selected, 'yyyy-MM-dd') : '';
  const dayEvents = mockEvents.filter((e) => e.date === selectedStr);

  const eventDates = mockEvents.map((e) => new Date(e.date));

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="px-5 pt-12 pb-4">
        <h1 className="text-xl font-bold">캘린더</h1>
        <p className="text-sm text-muted-foreground mt-1">시술 일정과 관리 주기를 확인하세요</p>
      </div>

      <div className="mx-auto max-w-lg px-4 space-y-4">
        <Card className="glass-card">
          <CardContent className="p-3">
            <Calendar
              mode="single"
              selected={selected}
              onSelect={setSelected}
              locale={ko}
              className="pointer-events-auto"
              modifiers={{ event: eventDates }}
              modifiersClassNames={{ event: 'bg-sage-light text-sage-dark font-semibold rounded-full' }}
            />
          </CardContent>
        </Card>

        <div className="space-y-2">
          <h2 className="px-1 font-semibold text-sm">
            {selected ? format(selected, 'M월 d일 (EEEE)', { locale: ko }) : '날짜를 선택하세요'}
          </h2>

          {dayEvents.length === 0 ? (
            <p className="text-sm text-muted-foreground px-1">예정된 일정이 없습니다</p>
          ) : (
            dayEvents.map((event) => {
              const config = eventTypeConfig[event.type];
              const Icon = config.icon;
              return (
                <Card key={event.id} className="glass-card">
                  <CardContent className="flex items-center gap-3 p-4">
                    <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg', config.bg)}>
                      <Icon className={cn('h-4 w-4', config.color)} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{event.title}</p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {event.type === 'treatment' ? '시술' : event.type === 'reminder' ? '알림' : '추천'}
                      </p>
                    </div>
                    {event.skinLayer && <SkinLayerBadge layer={event.skinLayer} />}
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
