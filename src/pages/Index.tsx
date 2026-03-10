import { useState, useMemo } from 'react';
import { Wallet, ChevronRight, AlertTriangle, CheckCircle2, Timer, CalendarDays, Layers, Package, TrendingUp, Plus, Star, Trash2, Pencil, Sparkles } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { BodyAreaBadge } from '@/components/SkinLayerBadge';

import { useCycles } from '@/context/CyclesContext';
import { useRecords } from '@/context/RecordsContext';
import { useLanguage } from '@/i18n/LanguageContext';
import { SkinLayer, SKIN_LAYER_LABELS, BODY_AREA_LABELS, TreatmentCycle, TreatmentRecord } from '@/types/skin';
import { differenceInDays, format, addDays } from 'date-fns';
import { ko } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import AddTreatmentModal from '@/components/AddTreatmentModal';
import ParseTreatmentModal from '@/components/ParseTreatmentModal';
import OnboardingFlow from '@/components/OnboardingFlow';

const TODAY = new Date('2026-03-10');

const SKIN_LAYER_COLOR = {
  epidermis: 'bg-amber-500/15 text-amber-400 border-amber-500/25',
  dermis: 'bg-blue-500/15 text-blue-400 border-blue-500/25',
  subcutaneous: 'bg-purple-500/15 text-purple-400 border-purple-500/25',
};

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

const layerOrder: SkinLayer[] = ['epidermis', 'dermis', 'subcutaneous'];

const Index = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { cycles } = useCycles();
  const { records, addRecord, updateRecord, deleteRecord } = useRecords();
  const { t } = useLanguage();
  const [modalOpen, setModalOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<TreatmentRecord | null>(null);
  const [parseModalOpen, setParseModalOpen] = useState(false);
  const [fabOpen, setFabOpen] = useState(false);
  const [showAllRecords, setShowAllRecords] = useState(false);

  // Onboarding
  const [onboardingOpen, setOnboardingOpen] = useState(() => searchParams.get('onboarding') === 'true');

  const handleCloseOnboarding = () => {
    setOnboardingOpen(false);
    searchParams.delete('onboarding');
    setSearchParams(searchParams, { replace: true });
  };

  const statusConfig = {
    good: { color: 'text-sage-dark', bg: 'bg-sage-light', label: t('maintaining') },
    upcoming: { color: 'text-amber', bg: 'bg-amber-light', label: t('upcoming_treatment') },
    overdue: { color: 'text-rose', bg: 'bg-rose-light', label: t('treatment_needed') },
  };

  const stats = useMemo(() => {
    const allStatuses = cycles.map(c => ({ cycle: c, ...getCycleStatus(c) }));
    const overdue = allStatuses.filter(s => s.status === 'overdue').length;
    const upcoming = allStatuses.filter(s => s.status === 'upcoming').length;
    const good = allStatuses.filter(s => s.status === 'good').length;

    let scheduleCount = 0;
    ([] as any[]).forEach((e: any) => {
      const diff = differenceInDays(new Date(e.date), TODAY);
      if (diff >= 0 && diff <= 14) scheduleCount++;
    });
    cycles.forEach(cycle => {
      const lastDate = new Date(cycle.lastTreatmentDate);
      let nextDate = addDays(lastDate, cycle.cycleDays);
      if (nextDate < TODAY) nextDate = addDays(TODAY, 7);
      const diff = differenceInDays(nextDate, TODAY);
      if (diff >= 0 && diff <= 14) scheduleCount++;
    });

    const totalRemaining = 0;

    const mostUrgent = allStatuses
      .sort((a, b) => a.daysRemaining - b.daysRemaining)
      .slice(0, 2);

    const layerSummary = layerOrder.map(layer => {
      const layerStatuses = allStatuses.filter(s => s.cycle.skinLayer === layer);
      const worstStatus = layerStatuses.some(s => s.status === 'overdue') ? 'overdue'
        : layerStatuses.some(s => s.status === 'upcoming') ? 'upcoming' : 'good';
      return { layer, count: layerStatuses.length, status: worstStatus as 'good' | 'upcoming' | 'overdue' };
    }).filter(l => l.count > 0);

    return { overdue, upcoming, good, scheduleCount, totalRemaining, mostUrgent, layerSummary };
  }, [cycles]);

  const sortedRecords = useMemo(() =>
    [...records].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [records]
  );
  const displayedRecords = showAllRecords ? sortedRecords : sortedRecords.slice(0, 3);

  const handleSave = (record: Omit<TreatmentRecord, 'id'>) => {
    if (editRecord) {
      updateRecord(editRecord.id, record);
    } else {
      addRecord(record);
    }
    setEditRecord(null);
  };

  const handleEdit = (r: TreatmentRecord) => {
    setEditRecord(r);
    setModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm(t('delete_confirm'))) deleteRecord(id);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="gradient-sage safe-top">
        <div className="page-header-gradient pt-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-70 font-light">{t('hello')}</p>
              <h1 className="mt-0.5 text-xl font-bold">{t('my_skin_care')}</h1>
            </div>
            <div className="h-10 w-10 rounded-full bg-white/15 flex items-center justify-center backdrop-blur-sm tap-target cursor-pointer" onClick={() => navigate('/profile')}>
              <span className="text-base">👤</span>
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <span className="text-[11px] opacity-60 bg-white/10 px-3 py-1.5 rounded-full backdrop-blur-sm">
              {t('my_skin')}
            </span>
            <span className="text-[11px] opacity-60 bg-white/10 px-3 py-1.5 rounded-full backdrop-blur-sm">
              내 시술 기록 관리
            </span>
          </div>
        </div>
      </div>

      <div className="page-content space-y-4 pt-4 pb-28">
        {/* Status summary */}
        <div className="grid grid-cols-3 gap-2">
          <Card className="bg-rose-light border-none card-interactive cursor-pointer" onClick={() => navigate('/status?filter=overdue')}>
            <CardContent className="p-3 text-center">
              <AlertTriangle className="h-4 w-4 text-rose mx-auto mb-1" />
              <p className="text-xl font-bold text-rose">{stats.overdue}</p>
              <p className="text-[10px] text-muted-foreground">{t('treatment_needed')}</p>
            </CardContent>
          </Card>
          <Card className="bg-amber-light border-none card-interactive cursor-pointer" onClick={() => navigate('/status?filter=upcoming')}>
            <CardContent className="p-3 text-center">
              <Timer className="h-4 w-4 text-amber mx-auto mb-1" />
              <p className="text-xl font-bold text-amber">{stats.upcoming}</p>
              <p className="text-[10px] text-muted-foreground">{t('upcoming_treatment')}</p>
            </CardContent>
          </Card>
          <Card className="bg-sage-light border-none card-interactive cursor-pointer" onClick={() => navigate('/status?filter=good')}>
            <CardContent className="p-3 text-center">
              <CheckCircle2 className="h-4 w-4 text-sage-dark mx-auto mb-1" />
              <p className="text-xl font-bold text-sage-dark">{stats.good}</p>
              <p className="text-[10px] text-muted-foreground">{t('maintaining')}</p>
            </CardContent>
          </Card>
        </div>

        {/* Points */}
        <Card className="card-interactive" onClick={() => navigate('/points')}>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent">
              <Wallet className="h-4.5 w-4.5 text-accent-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] text-muted-foreground">{t('held_points')}</p>
              <p className="text-lg font-bold tracking-tight">잔액 확인 중...</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
          </CardContent>
        </Card>

        {/* Urgent treatments */}
        {stats.mostUrgent.length > 0 && (
          <Card className="card-interactive" onClick={() => navigate('/cycles')}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-bold flex items-center gap-1.5">
                  <TrendingUp className="h-3.5 w-3.5 text-rose" />
                  {t('urgent_treatments')}
                </h2>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="space-y-2">
                {stats.mostUrgent.map(({ cycle, daysRemaining, status }) => {
                  const config = statusConfig[status];
                  return (
                    <div key={cycle.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className={`h-2 w-2 rounded-full ${status === 'overdue' ? 'bg-rose' : status === 'upcoming' ? 'bg-amber' : 'bg-sage-dark'}`} />
                        <span className="text-sm font-medium truncate">{cycle.treatmentName}</span>
                        <span className="text-[10px] text-muted-foreground">{BODY_AREA_LABELS[cycle.bodyArea]}</span>
                      </div>
                      <span className={`text-sm font-bold ${config.color} shrink-0`}>
                        {daysRemaining > 0 ? `D-${daysRemaining}` : daysRemaining === 0 ? 'D-Day' : `D+${Math.abs(daysRemaining)}`}
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 2-week schedule */}
        <Card className="card-interactive" onClick={() => navigate('/calendar')}>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-info-light">
              <CalendarDays className="h-4.5 w-4.5 text-info" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] text-muted-foreground">{t('schedule_in_2weeks')}</p>
              <p className="text-lg font-bold tracking-tight">{stats.scheduleCount}건</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
          </CardContent>
        </Card>

        {/* Skin layer status */}
        <Card className="card-interactive" onClick={() => navigate('/cycles')}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5 text-info" />
                {t('skin_layer_status')}
              </h2>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="space-y-2.5">
              {stats.layerSummary.map(({ layer, count, status }) => {
                const config = statusConfig[status];
                return (
                  <div key={layer} className="flex items-center gap-3">
                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${config.bg}`}>
                      <span className="text-[10px] font-bold">{SKIN_LAYER_LABELS[layer].charAt(0)}</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{SKIN_LAYER_LABELS[layer]}</p>
                      <p className="text-[10px] text-muted-foreground">{count}개 시술 관리 중</p>
                    </div>
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${config.bg} ${config.color}`}>
                      {config.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Remaining vouchers */}
        <Card className="card-interactive" onClick={() => navigate('/packages')}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold flex items-center gap-1.5">
                <Package className="h-3.5 w-3.5 text-accent-foreground" />
                {t('remaining_vouchers')}
              </h2>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              {([] as any[]).map((pkg) => {
                const remaining = pkg.totalSessions - pkg.usedSessions;
                const progress = (pkg.usedSessions / pkg.totalSessions) * 100;
                return (
                  <div key={pkg.id} className="p-2.5 rounded-xl bg-muted/50">
                    <p className="text-xs font-semibold truncate">{pkg.name}</p>
                    <div className="flex items-end justify-between mt-1.5">
                      <p className="text-lg font-bold text-primary">{remaining}<span className="text-[10px] font-normal text-muted-foreground">회</span></p>
                      <BodyAreaBadge area={pkg.bodyArea} />
                    </div>
                    <Progress value={progress} className="h-1 mt-1.5" />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Treatment records */}
        <div>
          <div className="flex items-center justify-between px-1 mb-2.5">
            <h2 className="text-sm font-bold flex items-center gap-1.5">
              <Star className="h-3.5 w-3.5 text-[#C9A96E]" />
              {t('treatment_records')} ({records.length})
            </h2>
            <button onClick={() => setShowAllRecords(v => !v)} className="text-xs text-muted-foreground">
              {showAllRecords ? t('fold') : t('view_all')}
            </button>
          </div>

          <div className="space-y-2">
            {displayedRecords.map((r) => (
              <Card key={r.id} className="glass-card">
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
                        {format(new Date(r.date), 'yyyy.MM.dd')} · {r.clinic}
                      </p>
                      {r.memo && (
                        <p className="text-[11px] text-muted-foreground mt-1 line-clamp-1">{r.memo}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {r.satisfaction && (
                        <span className="text-xs text-[#C9A96E] font-medium">
                          {'★'.repeat(r.satisfaction)}
                        </span>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); handleEdit(r); }}
                        className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white/80 transition-colors"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(r.id); }}
                        className="p-1.5 rounded-lg hover:bg-rose-500/15 text-white/40 hover:text-rose-400 transition-colors"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* FAB */}
      {fabOpen && (
        <div className="fixed bottom-36 right-4 z-40 flex flex-col gap-2 items-end">
          <button
            onClick={() => { setFabOpen(false); setParseModalOpen(true); }}
            className="flex items-center gap-2 bg-[#1a1a1a] border border-[#C9A96E]/40 text-white text-xs font-semibold px-4 py-2.5 rounded-full shadow-lg"
          >
            <Sparkles size={14} className="text-[#C9A96E]" />
            문자/카톡으로 등록
          </button>
          <button
            onClick={() => { setFabOpen(false); setEditRecord(null); setModalOpen(true); }}
            className="flex items-center gap-2 bg-[#1a1a1a] border border-white/20 text-white text-xs font-semibold px-4 py-2.5 rounded-full shadow-lg"
          >
            <Plus size={14} />
            직접 입력
          </button>
        </div>
      )}
      {fabOpen && (
        <div className="fixed inset-0 z-30" onClick={() => setFabOpen(false)} />
      )}
      <button
        onClick={() => setFabOpen(v => !v)}
        className="fixed bottom-20 right-4 z-40 h-14 w-14 rounded-full bg-[#C9A96E] shadow-lg shadow-[#C9A96E]/30 flex items-center justify-center active:scale-95 transition-transform"
      >
        <Plus size={24} className={`text-black transition-transform duration-200 ${fabOpen ? "rotate-45" : ""}`} strokeWidth={2.5} />
      </button>

      {parseModalOpen && (
        <ParseTreatmentModal onClose={() => setParseModalOpen(false)} />
      )}
      <AddTreatmentModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditRecord(null); }}
        onSave={handleSave}
        editRecord={editRecord}
      />

      <OnboardingFlow open={onboardingOpen} onClose={handleCloseOnboarding} />
    </div>
  );
};

export default Index;
