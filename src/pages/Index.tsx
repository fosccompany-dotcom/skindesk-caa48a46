import { useState } from 'react';
import { Wallet, ChevronRight, AlertTriangle, CheckCircle2, Timer, CalendarDays, Layers, Package, TrendingUp, Plus, Star, Trash2, Pencil } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { BodyAreaBadge } from '@/components/SkinLayerBadge';
import { mockPackages, currentBalance, mockProfile, mockEvents } from '@/data/mockData';
import { useCycles } from '@/context/CyclesContext';
import { useRecords } from '@/context/RecordsContext';
import { SkinLayer, SKIN_LAYER_LABELS, BODY_AREA_LABELS, TreatmentCycle, TreatmentRecord } from '@/types/skin';
import { differenceInDays, format, addDays } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import AddTreatmentModal from '@/components/AddTreatmentModal';

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

const statusConfig = {
  good: { color: 'text-sage-dark', bg: 'bg-sage-light', label: '유지 중' },
  upcoming: { color: 'text-amber', bg: 'bg-amber-light', label: '곧 시술' },
  overdue: { color: 'text-rose', bg: 'bg-rose-light', label: '시술 필요' },
};

const layerOrder: SkinLayer[] = ['epidermis', 'dermis', 'subcutaneous'];

const Index = () => {
  const navigate = useNavigate();
  const { cycles } = useCycles();
  const { records, addRecord, updateRecord, deleteRecord } = useRecords();
  const [modalOpen, setModalOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<TreatmentRecord | null>(null);
  const [showAllRecords, setShowAllRecords] = useState(false);

  const stats = useMemo(() => {
    const allStatuses = cycles.map(c => ({ cycle: c, ...getCycleStatus(c) }));
    const overdue = allStatuses.filter(s => s.status === 'overdue').length;
    const upcoming = allStatuses.filter(s => s.status === 'upcoming').length;
    const good = allStatuses.filter(s => s.status === 'good').length;

    let scheduleCount = 0;
    mockEvents.forEach(e => {
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

    const totalRemaining = mockPackages.reduce((sum, pkg) => sum + (pkg.totalSessions - pkg.usedSessions), 0);

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
    if (confirm('이 시술 기록을 삭제할까요?')) deleteRecord(id);
  };

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
              {mockProfile.skinType} · 만 {Math.floor((TODAY.getTime() - new Date(mockProfile.birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000))}세
            </span>
            <span className="text-[11px] opacity-60 bg-white/10 px-3 py-1.5 rounded-full backdrop-blur-sm">
              {mockProfile.concerns[0]} 집중 관리
            </span>
          </div>
        </div>
      </div>

      <div className="page-content space-y-4 pt-4 pb-28">
        {/* 상태 요약 카드 3개 */}
        <div className="grid grid-cols-3 gap-2">
          <Card className="bg-rose-light border-none card-interactive cursor-pointer" onClick={() => navigate('/status?filter=overdue')}>
            <CardContent className="p-3 text-center">
              <AlertTriangle className="h-4 w-4 text-rose mx-auto mb-1" />
              <p className="text-xl font-bold text-rose">{stats.overdue}</p>
              <p className="text-[10px] text-muted-foreground">시술 필요</p>
            </CardContent>
          </Card>
          <Card className="bg-amber-light border-none card-interactive cursor-pointer" onClick={() => navigate('/status?filter=upcoming')}>
            <CardContent className="p-3 text-center">
              <Timer className="h-4 w-4 text-amber mx-auto mb-1" />
              <p className="text-xl font-bold text-amber">{stats.upcoming}</p>
              <p className="text-[10px] text-muted-foreground">곧 시술</p>
            </CardContent>
          </Card>
          <Card className="bg-sage-light border-none card-interactive cursor-pointer" onClick={() => navigate('/status?filter=good')}>
            <CardContent className="p-3 text-center">
              <CheckCircle2 className="h-4 w-4 text-sage-dark mx-auto mb-1" />
              <p className="text-xl font-bold text-sage-dark">{stats.good}</p>
              <p className="text-[10px] text-muted-foreground">유지 중</p>
            </CardContent>
          </Card>
        </div>

        {/* 포인트 */}
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

        {/* 가장 급한 시술 */}
        {stats.mostUrgent.length > 0 && (
          <Card className="card-interactive" onClick={() => navigate('/cycles')}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-bold flex items-center gap-1.5">
                  <TrendingUp className="h-3.5 w-3.5 text-rose" />
                  급한 시술
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

        {/* 2주 내 일정 */}
        <Card className="card-interactive" onClick={() => navigate('/calendar')}>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-info-light">
              <CalendarDays className="h-4.5 w-4.5 text-info" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] text-muted-foreground">2주 내 예정 일정</p>
              <p className="text-lg font-bold tracking-tight">{stats.scheduleCount}건</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
          </CardContent>
        </Card>

        {/* 피부층별 관리 현황 */}
        <Card className="card-interactive" onClick={() => navigate('/cycles')}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5 text-info" />
                피부층별 관리 현황
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

        {/* 시술권 잔여 */}
        <Card className="card-interactive" onClick={() => navigate('/packages')}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold flex items-center gap-1.5">
                <Package className="h-3.5 w-3.5 text-accent-foreground" />
                시술권 잔여 현황
              </h2>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              {mockPackages.slice(0, 4).map((pkg) => {
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

        {/* ─ 시술 기록 ─ */}
        <div>
          <div className="flex items-center justify-between px-1 mb-2.5">
            <h2 className="text-sm font-bold flex items-center gap-1.5">
              <Star className="h-3.5 w-3.5 text-[#C9A96E]" />
              시술 기록 ({records.length})
            </h2>
            <button
              onClick={() => setShowAllRecords(v => !v)}
              className="text-xs text-muted-foreground"
            >
              {showAllRecords ? '접기' : '전체보기'}
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

      {/* FAB — 시술 등록 */}
      <button
        onClick={() => { setEditRecord(null); setModalOpen(true); }}
        className="fixed bottom-20 right-4 z-40 h-14 w-14 rounded-full bg-[#C9A96E] shadow-lg shadow-[#C9A96E]/30 flex items-center justify-center active:scale-95 transition-transform"
      >
        <Plus size={24} className="text-black" strokeWidth={2.5} />
      </button>

      {/* 등록/수정 모달 */}
      <AddTreatmentModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditRecord(null); }}
        onSave={handleSave}
        editRecord={editRecord}
      />
    </div>
  );
};

export default Index;
