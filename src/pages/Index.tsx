import { Wallet, ChevronRight, Clock, AlertTriangle, CheckCircle2, Timer } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { SkinLayerBadge, BodyAreaBadge } from '@/components/SkinLayerBadge';
import { mockPackages, currentBalance, mockProfile } from '@/data/mockData';
import { useCycles } from '@/context/CyclesContext';
import { SkinLayer, SKIN_LAYER_LABELS, SKIN_LAYER_DESCRIPTIONS, BODY_AREA_LABELS, TreatmentCycle } from '@/types/skin';
import { differenceInDays, format, addDays } from 'date-fns';
import { CycleEditorSheet } from '@/components/CycleEditor';

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

const Index = () => {
  const navigate = useNavigate();
  const { cycles, setCycles } = useCycles();

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
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-70 font-light">안녕하세요 👋</p>
              <h1 className="mt-0.5 text-xl font-bold">나의 피부 관리</h1>
            </div>
            <div className="h-10 w-10 rounded-full bg-white/15 flex items-center justify-center backdrop-blur-sm tap-target cursor-pointer" onClick={() => navigate('/profile')}>
              <span className="text-base">👤</span>
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <span className="text-[11px] opacity-60 bg-white/10 px-3 py-1.5 rounded-full backdrop-blur-sm">
              {mockProfile.skinType} · 만 {Math.floor((new Date('2026-03-08').getTime() - new Date(mockProfile.birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000))}세
            </span>
            <span className="text-[11px] opacity-60 bg-white/10 px-3 py-1.5 rounded-full backdrop-blur-sm">
              {mockProfile.concerns[0]} 집중 관리
            </span>
          </div>
        </div>
      </div>

      <div className="page-content space-y-5 -mt-3">
        {/* Points summary */}
        <Card className="card-interactive" onClick={() => navigate('/points')}>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent">
              <Wallet className="h-4.5 w-4.5 text-accent-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] text-muted-foreground">보유 포인트</p>
              <p className="text-lg font-bold tracking-tight">{currentBalance.toLocaleString()}원</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
          </CardContent>
        </Card>

        {/* 급한 알림 */}
        {urgent.length > 0 && (
          <div>
            <h2 className="section-title flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5 text-amber" />
              관리 알림
            </h2>
            <div className="space-y-2">
              {urgent.sort((a, b) => a.daysRemaining - b.daysRemaining).slice(0, 3).map(({ cycle, daysRemaining, status }) => {
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

        {/* 피부층별 관리 현황 - 헤더에 편집 버튼 */}
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

        {/* 시술권 요약 */}
        <div>
          <div className="flex items-center justify-between px-1 mb-2.5">
            <h2 className="text-sm font-bold">시술권 잔여 현황</h2>
            <button onClick={() => navigate('/packages')} className="text-xs text-secondary font-semibold tap-target">전체보기</button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {mockPackages.slice(0, 4).map((pkg) => {
              const remaining = pkg.totalSessions - pkg.usedSessions;
              const progress = (pkg.usedSessions / pkg.totalSessions) * 100;
              return (
                <Card key={pkg.id} className="card-interactive" onClick={() => navigate('/packages')}>
                  <CardContent className="p-3">
                    <p className="text-xs font-semibold truncate">{pkg.name}</p>
                    <div className="flex items-end justify-between mt-2">
                      <div>
                        <p className="text-lg font-bold text-primary">{remaining}<span className="text-[10px] font-normal text-muted-foreground">회</span></p>
                      </div>
                      <BodyAreaBadge area={pkg.bodyArea} />
                    </div>
                    <Progress value={progress} className="h-1 mt-2" />
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;