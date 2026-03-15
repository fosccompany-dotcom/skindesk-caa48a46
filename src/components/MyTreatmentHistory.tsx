import { useState, useMemo } from 'react';
import { useRecords } from '@/context/RecordsContext';
import { useCycles } from '@/context/CyclesContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { SKIN_LAYER_LABELS, BODY_AREA_LABELS, SkinLayer, BodyArea, TreatmentRecord } from '@/types/skin';
import { CLINIC_PRESETS } from '@/constants/clinicPresets';
import { format, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';
import {
  Search, ChevronDown, ChevronUp, Pencil, Trash2, Check, X, Star,
  Calendar as CalendarIcon, Building2, Stethoscope, FileText, Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

const LAYER_COLOR: Record<string, string> = {
  epidermis: 'bg-amber-100 text-amber-700 border-amber-200',
  dermis: 'bg-sky-100 text-sky-700 border-sky-200',
  subcutaneous: 'bg-violet-100 text-violet-700 border-violet-200',
};

const MyTreatmentHistory = () => {
  const { records, loading, updateRecord, deleteRecord } = useRecords();
  const { cycles } = useCycles();
  const [search, setSearch] = useState('');
  const [filterPresetId, setFilterPresetId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<TreatmentRecord>>({});

  // Filter & search
  const filtered = useMemo(() => {
    const preset = CLINIC_PRESETS.find(p => p.id === filterPresetId);
    return records
      .filter(r => !r.packageId)
      .filter(r => {
        if (preset && !preset.branches.includes(r.clinic)) return false;
        if (search) {
          const q = search.toLowerCase();
          if (!r.treatmentName.toLowerCase().includes(q) && !r.clinic.toLowerCase().includes(q)) return false;
        }
        return true;
      });
  }, [records, filterPresetId, search]);

  // Group by month
  const grouped = useMemo(() => {
    const map: Record<string, TreatmentRecord[]> = {};
    filtered.forEach(r => {
      const key = format(parseISO(r.date), 'yyyy년 M월', { locale: ko });
      if (!map[key]) map[key] = [];
      map[key].push(r);
    });
    return map;
  }, [filtered]);

  // Stats
  const stats = useMemo(() => {
    const nonPkgRecords = records.filter(r => !r.packageId);
    const thisMonth = nonPkgRecords.filter(r => {
      const d = parseISO(r.date);
      const now = new Date();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;
    const sorted = [...nonPkgRecords].sort((a, b) => b.date.localeCompare(a.date));
    const lastDate = sorted.length > 0 ? sorted[0].date : null;
    const lastDateLabel = lastDate
      ? `${parseISO(lastDate).getMonth() + 1}월 ${parseISO(lastDate).getDate()}일`
      : '없음';
    return { thisMonth, lastDateLabel };
  }, [records]);

  // Find matching cycle for a record
  const findCycle = (r: TreatmentRecord) => {
    return cycles.find(c =>
      c.treatmentName === r.treatmentName && c.clinic === r.clinic
    );
  };

  const startEdit = (r: TreatmentRecord) => {
    setEditingId(r.id);
    setEditForm({ ...r });
  };

  const saveEdit = async () => {
    if (!editingId || !editForm.treatmentName || !editForm.date || !editForm.clinic) return;
    await updateRecord(editingId, editForm as Omit<TreatmentRecord, 'id'>);
    setEditingId(null);
    toast({ title: '수정 완료', description: '시술 기록이 수정되었습니다.' });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('이 시술 기록을 삭제하시겠습니까?')) return;
    await deleteRecord(id);
    setExpandedId(null);
    toast({ title: '삭제 완료', description: '시술 기록이 삭제되었습니다.' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats Summary */}
      <div className="grid grid-cols-2 gap-2">
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-3 text-center">
            <p className="text-[10px] text-muted-foreground">이번 달 횟수</p>
            <p className="text-xl font-black text-primary">{stats.thisMonth}<span className="text-xs font-normal ml-0.5">회</span></p>
          </CardContent>
        </Card>
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-3 text-center">
            <p className="text-[10px] text-muted-foreground">마지막 시술일</p>
            <p className="text-xl font-black text-primary">{stats.lastDateLabel}</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="시술명, 병원명 검색..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9 rounded-xl"
        />
      </div>

      {/* Filters */}
      <div className="flex gap-1.5 flex-wrap">
        <button
          onClick={() => setFilterPresetId(null)}
          className={cn('px-3 py-1.5 rounded-full text-[11px] font-semibold border transition-all',
            !filterPresetId ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border/50 text-muted-foreground')}
        >
          전체
        </button>
        {CLINIC_PRESETS.map(p => (
          <button
            key={p.id}
            onClick={() => setFilterPresetId(prev => prev === p.id ? null : p.id)}
            className={cn('px-3 py-1.5 rounded-full text-[11px] font-semibold border transition-all',
              filterPresetId === p.id ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border/50 text-muted-foreground')}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Records by month */}
      {Object.keys(grouped).length === 0 ? (
        <div className="text-center py-16">
          <Stethoscope className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">시술 내역이 없습니다</p>
        </div>
      ) : (
        Object.entries(grouped).map(([month, recs]) => (
          <div key={month}>
            <div className="flex items-center justify-between mb-2 px-1">
              <h3 className="text-sm font-bold text-foreground">{month}</h3>
              <span className="text-[11px] text-muted-foreground">{recs.length}건</span>
            </div>
            <div className="space-y-2">
              {recs.map(r => {
                const isExpanded = expandedId === r.id;
                const isEditing = editingId === r.id;
                const cycle = findCycle(r);

                return (
                  <Card key={r.id} className="overflow-hidden">
                    <CardContent className="p-0">
                      {/* Main row */}
                      <button
                        onClick={() => { setExpandedId(isExpanded ? null : r.id); setEditingId(null); }}
                        className="w-full flex items-center gap-3 p-3 text-left"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-foreground truncate">{r.treatmentName}</p>
                            {r.skinLayer && (
                              <span className={cn('text-[9px] px-1.5 py-0.5 rounded-full border font-medium', LAYER_COLOR[r.skinLayer])}>
                                {SKIN_LAYER_LABELS[r.skinLayer as SkinLayer]}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[11px] text-muted-foreground">{format(parseISO(r.date), 'M.dd (EEE)', { locale: ko })}</span>
                            <span className="text-[11px] text-muted-foreground">·</span>
                            <span className="text-[11px] text-muted-foreground">{r.clinic}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {r.amount_paid != null && r.amount_paid > 0 && (
                            <span className="text-xs font-bold text-foreground">{r.amount_paid.toLocaleString()}원</span>
                          )}
                          {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                        </div>
                      </button>

                      {/* Expanded detail */}
                      {isExpanded && !isEditing && (
                        <div className="border-t border-border/30 bg-muted/30 px-3 py-3 space-y-3">
                          <div className="grid grid-cols-2 gap-2 text-[11px]">
                            <div>
                              <span className="text-muted-foreground">부위</span>
                              <p className="font-medium text-foreground">{r.bodyArea ? BODY_AREA_LABELS[r.bodyArea as BodyArea] : '-'}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">샷 수</span>
                              <p className="font-medium text-foreground">{r.shots || '-'}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">만족도</span>
                              <div className="flex gap-0.5 mt-0.5">
                                {r.satisfaction ? Array.from({ length: 5 }).map((_, i) => (
                                  <Star key={i} className={cn('h-3 w-3', i < r.satisfaction! ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30')} />
                                )) : <span className="text-foreground font-medium">-</span>}
                              </div>
                            </div>
                          </div>

                          {r.memo && (
                            <div className="text-[11px]">
                              <span className="text-muted-foreground">메모</span>
                              <p className="font-medium text-foreground mt-0.5">{r.memo}</p>
                            </div>
                          )}
                          {r.notes && (
                            <div className="text-[11px]">
                              <span className="text-muted-foreground">노트</span>
                              <p className="font-medium text-foreground mt-0.5">{r.notes}</p>
                            </div>
                          )}

                          {/* Linked cycle info */}
                          {cycle && (
                            <div className="bg-primary/5 border border-primary/20 rounded-lg p-2.5">
                              <div className="flex items-center gap-1.5 mb-1">
                                <Zap className="h-3 w-3 text-primary" />
                                <span className="text-[10px] font-semibold text-primary">연결된 시술 주기</span>
                              </div>
                              <p className="text-[11px] text-foreground">주기: {cycle.cycleDays}일 | 마지막: {format(parseISO(cycle.lastTreatmentDate), 'M.dd', { locale: ko })}</p>
                            </div>
                          )}

                          {/* Actions */}
                          <div className="flex gap-2 pt-1">
                            <button
                              onClick={() => startEdit(r)}
                              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-primary/10 text-primary text-xs font-semibold"
                            >
                              <Pencil className="h-3 w-3" /> 수정
                            </button>
                            <button
                              onClick={() => handleDelete(r.id)}
                              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-destructive/10 text-destructive text-xs font-semibold"
                            >
                              <Trash2 className="h-3 w-3" /> 삭제
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Edit form */}
                      {isExpanded && isEditing && (
                        <div className="border-t border-border/30 bg-muted/30 px-3 py-3 space-y-2.5">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-[10px] text-muted-foreground mb-1 block">시술명</label>
                              <Input value={editForm.treatmentName || ''} onChange={e => setEditForm(f => ({ ...f, treatmentName: e.target.value }))} className="h-8 text-xs" />
                            </div>
                            <div>
                              <label className="text-[10px] text-muted-foreground mb-1 block">날짜</label>
                              <Input type="date" value={editForm.date || ''} onChange={e => setEditForm(f => ({ ...f, date: e.target.value }))} className="h-8 text-xs" />
                            </div>
                            <div>
                              <label className="text-[10px] text-muted-foreground mb-1 block">병원</label>
                              <Input value={editForm.clinic || ''} onChange={e => setEditForm(f => ({ ...f, clinic: e.target.value }))} className="h-8 text-xs" />
                            </div>
                            <div>
                              <label className="text-[10px] text-muted-foreground mb-1 block">금액</label>
                              <Input type="number" value={editForm.amount_paid || ''} onChange={e => setEditForm(f => ({ ...f, amount_paid: Number(e.target.value) }))} className="h-8 text-xs" />
                            </div>
                            <div>
                              <label className="text-[10px] text-muted-foreground mb-1 block">샷 수</label>
                              <Input type="number" value={editForm.shots || ''} onChange={e => setEditForm(f => ({ ...f, shots: Number(e.target.value) }))} className="h-8 text-xs" />
                            </div>
                            <div>
                              <label className="text-[10px] text-muted-foreground mb-1 block">만족도</label>
                              <div className="flex gap-1 mt-1">
                                {[1, 2, 3, 4, 5].map(s => (
                                  <button key={s} onClick={() => setEditForm(f => ({ ...f, satisfaction: s as any }))}>
                                    <Star className={cn('h-4 w-4', (editForm.satisfaction || 0) >= s ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30')} />
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                          <div>
                            <label className="text-[10px] text-muted-foreground mb-1 block">메모</label>
                            <Input value={editForm.memo || ''} onChange={e => setEditForm(f => ({ ...f, memo: e.target.value }))} className="h-8 text-xs" />
                          </div>
                          <div className="flex gap-2 pt-1">
                            <button onClick={saveEdit} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold">
                              <Check className="h-3 w-3" /> 저장
                            </button>
                            <button onClick={() => setEditingId(null)} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-muted text-muted-foreground text-xs font-semibold">
                              <X className="h-3 w-3" /> 취소
                            </button>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default MyTreatmentHistory;
