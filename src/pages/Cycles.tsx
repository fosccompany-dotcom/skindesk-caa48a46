import { Clock, AlertTriangle, CheckCircle2, Timer, CalendarDays, ChevronDown, ChevronUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { BodyAreaBadge } from '@/components/SkinLayerBadge';
import { useCycles } from '@/context/CyclesContext';
import { SkinLayer, SKIN_LAYER_LABELS, SKIN_LAYER_DESCRIPTIONS, BODY_AREA_LABELS, TreatmentCycle } from '@/types/skin';
import { differenceInDays, format, addDays } from 'date-fns';
import { ko } from 'date-fns/locale';
import { CycleEditorSheet } from '@/components/CycleEditor';
import { useMemo, useState } from 'react';

const TODAY = new Date('2026-03-08');

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

const statusConfig = {
  good: { color: 'text-sage-dark', bg: 'bg-sage-light', icon: CheckCircle2, label: '유지 중' },
  upcoming: { color: 'text-amber', bg: 'bg-amber-light', icon: Timer, label: '곧 시술' },
  overdue: { color: 'text-rose', bg: 'bg-rose-light', icon: AlertTriangle, label: '시술 필요' },
};

const layerOrder: SkinLayer[] = ['epidermis', 'dermis', 'subcutaneous'];

const layerIconBg: Record<SkinLayer, string> = {
  epidermis: 'bg-sage-light',
  dermis: 'bg-info-light',
  subcutaneous: 'bg-amber-light',
};

const Cycles = () => {
  const navigate = useNavigate();
  const { cycles, setCycles } = useCycles();
  const [showSchedule, setShowSchedule] = useState(true);

  const upcomingEvents = useMemo(() => {
    const events: { id: string; date: string; title: string; daysFromNow: number; cycleInfo?: string; skinLayer?: SkinLayer }[] = [];

      }
    });

    cycles.forEach(cycle => {
      const lastDate = new Date(cycle.lastTreatmentDate);
      let nextDate = addDays(lastDate, cycle.cycleDays);
      if (nextDate < TODAY) nextDate = addDays(TODAY, 7);

      for (let i = 0; i < 3; i++) {
        const diff = differenceInDays(nextDate, TODAY);
        if (diff > 14) break;
        if (diff >= 0) {
          const key = `${format(nextDate, 'yyyy-MM-dd')}_${cycle.treatmentName}`;
          if (!events.find(e => `${e.date}_${e.title}` === key)) {
            events.push({
              id: `upcoming_${cycle.id}_${i}`,
              date: format(nextDate, 'yyyy-MM-dd'),
              title: `${cycle.treatmentName} 추천일`,
              daysFromNow: diff,
              cycleInfo: `${BODY_AREA_LABELS[cycle.bodyArea]}${cycle.product ? ` · ${cycle.product}` : ''}`,
              skinLayer: cycle.skinLayer,
            });
          }
        }
        nextDate = addDays(nextDate, cycle.cycleDays);
      }
    });

    return events.sort((a, b) => a.daysFromNow - b.daysFromNow);
  }, [cycles]);

  const cyclesByLayer = layerOrder.map(layer => ({
    layer,
    cycles: cycles.filter(c => c.skinLayer === layer),
  }));

  const allStatuses = cycles.map(c => ({ cycle: c, ...getCycleStatus(c) }));
  const urgent = allStatuses.filter(s => s.status === 'overdue' || s.status === 'upcoming');

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="gradient-sage safe-top">
        <div className="page-header-gradient pt-4">
          <h1 className="text-lg font-bold">피부 관리 현황</h1>
          <p className="text-xs opacity-70 mt-1">시술 주기 및 예정 일정</p>
        </div>
      </div>

      <div className="page-content space-y-5 pt-4">
        {/* 2주 이내 예정 일정 */}
        {upcomingEvents.length > 0 && (
          <div>
            <button
              onClick={() => setShowSchedule(!showSchedule)}
              className="flex items-center justify-between w-full px-1 mb-2.5"
            >
              <h2 className="section-title flex items-center gap-1.5 mb-0">
                <CalendarDays className="h-3.5 w-3.5 text-info" />
                2주 내 예정 일정 ({upcomingEvents.length})
              </h2>
              {showSchedule ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
            </button>
            {showSchedule && (
              <div className="space-y-2">
                {upcomingEvents.slice(0, 8).map((event) => (
                  <Card key={event.id} className="glass-card" onClick={() => navigate('/calendar')}>
                    <CardContent className="flex items-center gap-3 p-3.5">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-info-light">
                        <CalendarDays className="h-4 w-4 text-info" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold">{event.title}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {format(new Date(event.date), 'M월 d일 (EEE)', { locale: ko })}
                          {event.cycleInfo ? ` · ${event.cycleInfo}` : ''}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold text-info">
                          {event.daysFromNow === 0 ? 'D-Day' : `D-${event.daysFromNow}`}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 급한 알림 */}
        {urgent.length > 0 && (
          <div>
            <h2 className="section-title flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5 text-amber" />
              관리 알림
            </h2>
            <div className="space-y-2">
              {urgent.sort((a, b) => a.daysRemaining - b.daysRemaining).map(({ cycle, daysRemaining, status }) => {
                const config = statusConfig[status];
                const Icon = config.icon;
                return (
                  <Card key={cycle.id} className="glass-card">
                    <CardContent className="flex items-center gap-3 p-3.5">
                      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${config.bg}`}>
                        <Icon className={`h-4 w-4 ${config.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-semibold">{cycle.treatmentName}</span>
                          {cycle.product && <span className="text-[10px] text-muted-foreground">({cycle.product})</span>}
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                          {cycle.notes ? `${cycle.notes} · ` : ''}{BODY_AREA_LABELS[cycle.bodyArea]}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className={`text-sm font-bold ${config.color}`}>
                          {daysRemaining > 0 ? `D-${daysRemaining}` : `D+${Math.abs(daysRemaining)}`}
                        </p>
                        <p className="text-[10px] text-muted-foreground">{config.label}</p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* 피부층별 관리 현황 */}
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm font-bold">피부층별 관리 현황</h2>
          <CycleEditorSheet cycles={cycles} onUpdate={setCycles} />
        </div>

        {cyclesByLayer.map(({ layer, cycles: layerCycles }) => {
          if (layerCycles.length === 0) return null;
          return (
            <div key={layer}>
              <div className="flex items-center gap-2 mb-2.5 px-1">
                <div className={`h-6 w-6 rounded-lg flex items-center justify-center ${layerIconBg[layer]}`}>
                  <span className="text-[10px] font-bold">{SKIN_LAYER_LABELS[layer].charAt(0)}</span>
                </div>
                <div>
                  <h2 className="text-sm font-bold">{SKIN_LAYER_LABELS[layer]}</h2>
                  <p className="text-[10px] text-muted-foreground">{SKIN_LAYER_DESCRIPTIONS[layer]}</p>
                </div>
              </div>

              <div className="space-y-2">
                {layerCycles.map((cycle) => {
                  const { daysRemaining, progress, nextDate, status } = getCycleStatus(cycle);
                  const config = statusConfig[status];

                  return (
                    <Card key={cycle.id} className="glass-card">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-semibold text-sm">{cycle.treatmentName}</span>
                              {cycle.product && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground">{cycle.product}</span>
                              )}
                              <BodyAreaBadge area={cycle.bodyArea} />
                            </div>
                            {cycle.notes && (
                              <p className="text-[11px] text-muted-foreground mt-0.5">{cycle.notes}</p>
                            )}
                          </div>
                          <div className="text-right shrink-0 ml-3">
                            <p className={`text-lg font-bold ${config.color}`}>
                              {daysRemaining > 0 ? `D-${daysRemaining}` : daysRemaining === 0 ? 'D-Day' : `D+${Math.abs(daysRemaining)}`}
                            </p>
                          </div>
                        </div>

                        <div className="relative">
                          <Progress value={progress} className="h-1.5" />
                        </div>

                        <div className="mt-2 flex justify-between text-[11px] text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            마지막: {format(new Date(cycle.lastTreatmentDate), 'M.d')}
                          </span>
                          <span>
                            다음: {format(nextDate, 'M.d')} ({cycle.cycleDays}일{cycle.isCustomCycle ? ' · 커스텀' : ''})
                          </span>
                        </div>

                        <p className="text-[10px] text-muted-foreground mt-1">{cycle.clinic}</p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Cycles;
