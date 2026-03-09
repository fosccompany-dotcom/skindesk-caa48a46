import { useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertTriangle, Timer, CheckCircle2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useCycles } from '@/context/CyclesContext';
import { BODY_AREA_LABELS, SKIN_LAYER_LABELS, TreatmentCycle } from '@/types/skin';
import { differenceInDays, addDays, format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useMemo } from 'react';

const TODAY = new Date('2026-03-08');

type Status = 'overdue' | 'upcoming' | 'good';

function getCycleStatus(cycle: TreatmentCycle) {
  const lastDate = new Date(cycle.lastTreatmentDate);
  const nextDate = addDays(lastDate, cycle.cycleDays);
  const daysRemaining = differenceInDays(nextDate, TODAY);
  const progress = Math.min((differenceInDays(TODAY, lastDate) / cycle.cycleDays) * 100, 100);

  let status: Status;
  if (daysRemaining > 14) status = 'good';
  else if (daysRemaining > 0) status = 'upcoming';
  else status = 'overdue';

  return { daysRemaining, progress, nextDate, status };
}

const statusConfig: Record<Status, { icon: typeof AlertTriangle; color: string; bg: string; label: string; description: string }> = {
  overdue: { icon: AlertTriangle, color: 'text-rose', bg: 'bg-rose-light', label: '시술 필요', description: '주기가 지난 시술입니다. 빠른 시술을 권장합니다.' },
  upcoming: { icon: Timer, color: 'text-amber', bg: 'bg-amber-light', label: '곧 시술', description: '2주 이내에 시술 예정인 항목입니다.' },
  good: { icon: CheckCircle2, color: 'text-sage-dark', bg: 'bg-sage-light', label: '유지 중', description: '주기에 맞게 잘 관리되고 있습니다.' },
};

const StatusList = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { cycles } = useCycles();
  const filter = (searchParams.get('filter') as Status) || 'overdue';
  const config = statusConfig[filter];
  const Icon = config.icon;

  const filteredCycles = useMemo(() => {
    return cycles
      .map(cycle => ({ cycle, ...getCycleStatus(cycle) }))
      .filter(item => item.status === filter)
      .sort((a, b) => a.daysRemaining - b.daysRemaining);
  }, [cycles, filter]);

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className={`safe-top ${config.bg}`}>
        <div className="px-5 pt-4 pb-5">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-muted-foreground mb-3 tap-target">
            <ArrowLeft className="h-4 w-4" />
            돌아가기
          </button>
          <div className="flex items-center gap-3">
            <div className={`h-11 w-11 rounded-2xl flex items-center justify-center bg-background/60`}>
              <Icon className={`h-5 w-5 ${config.color}`} />
            </div>
            <div>
              <h1 className="text-xl font-bold">{config.label}</h1>
              <p className="text-xs text-muted-foreground mt-0.5">{config.description}</p>
            </div>
          </div>
          <div className="mt-3">
            <span className={`text-sm font-bold ${config.color}`}>{filteredCycles.length}개</span>
            <span className="text-sm text-muted-foreground"> 시술</span>
          </div>
        </div>
      </div>

      {/* List */}
      <div className="px-5 pt-4 space-y-3">
        {filteredCycles.length === 0 ? (
          <div className="text-center py-16">
            <Icon className={`h-10 w-10 mx-auto mb-3 ${config.color} opacity-40`} />
            <p className="text-sm text-muted-foreground">해당 상태의 시술이 없습니다</p>
          </div>
        ) : (
          filteredCycles.map(({ cycle, daysRemaining, progress, nextDate }) => (
            <Card key={cycle.id} className="card-interactive" onClick={() => navigate('/cycles')}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-sm font-bold">{cycle.treatmentName}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                        {SKIN_LAYER_LABELS[cycle.skinLayer]}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                        {BODY_AREA_LABELS[cycle.bodyArea]}
                      </span>
                    </div>
                  </div>
                  <span className={`text-lg font-bold ${config.color}`}>
                    {daysRemaining > 0 ? `D-${daysRemaining}` : daysRemaining === 0 ? 'D-Day' : `D+${Math.abs(daysRemaining)}`}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="mt-3">
                  <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                    <span>주기 {cycle.cycleDays}일</span>
                    <span>다음 시술: {format(nextDate, 'M/d (EEE)', { locale: ko })}</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        filter === 'overdue' ? 'bg-rose' : filter === 'upcoming' ? 'bg-amber' : 'bg-sage-dark'
                      }`}
                      style={{ width: `${Math.min(progress, 100)}%` }}
                    />
                  </div>
                </div>

                <p className="text-[10px] text-muted-foreground mt-2">
                  마지막 시술: {format(new Date(cycle.lastTreatmentDate), 'yyyy.MM.dd', { locale: ko })}
                </p>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default StatusList;
