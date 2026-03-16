import { useState, useMemo } from 'react';
import { useRecords } from '@/context/RecordsContext';
import { useCycles } from '@/context/CyclesContext';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SKIN_LAYER_LABELS, BODY_AREA_LABELS, SkinLayer, BodyArea, TreatmentRecord } from '@/types/skin';
import { format, parseISO, subMonths } from 'date-fns';
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

// Body area mapping for filter chips
const BODY_AREA_FILTER_MAP: Record<string, string> = {
  face: '얼굴',
  jaw: '턱',
  eye: '눈',
  lip: '입술',
  body: '바디',
  leg: '다리',
  arm: '팔',
};

// Category options for the dropdown — labels used to match treatment names
const CATEGORY_OPTIONS: { value: string; label: string; keywords: string[] }[] = [
  { value: 'all', label: '전체', keywords: [] },
  { value: 'lifting', label: '레이저 리프팅', keywords: ['슈링크','울쎄라','세르프','써마지','덴서티','온다','인모드','올리지오','티타늄','텐써마','텐쎄라','엠페이스','볼뉴머','LDM','리프팅'] },
  { value: 'botox', label: '보톡스/윤곽주사', keywords: ['보톡스','코어톡스','제오민','엘러간','더모톡신','아쿠아톡신','메조보톡스','윤곽주사','다한증'] },
  { value: 'filler', label: '필러/실리프팅', keywords: ['필러','스컬트라','실리프팅','뉴라미스','아띠에르','레스틸렌','쥬비덤'] },
  { value: 'booster', label: '스킨부스터', keywords: ['스킨바이브','리쥬란','쥬베룩','레디어스','리바이브','레티젠','리투오','엑소좀','미희','물광','포텐자','콜라스터','스킨부스터'] },
  { value: 'skincare', label: '피부관리/패키지', keywords: ['Basic','Premium','스케일링','아쿠아필','비타민관리','크라이오','LED','이온자임','신데렐라','백옥','태반','라라필','플라센타','블랙헤드','블랙필','예스필','핑크필','물방울','압출','필링 (단독)'] },
  { value: 'whitening', label: '미백/기미/색소', keywords: ['엑셀V','피코토닝','레이저토닝','피코프락셀','미백토닝','리팟','알라딘','PHA필링','쿰스필링'] },
  { value: 'acne', label: '여드름/점제거', keywords: ['점/','쥐젖','사마귀','검버섯','여드름','아크네','포텐자 얼굴','카프리'] },
  { value: 'fat', label: '지방분해/윤곽주사', keywords: ['지방분해','조각주사','브이올렛','제로핏','벨라콜린'] },
  { value: 'hair_removal', label: '제모', keywords: ['제모','젠틀맥스','아포지','다이오드','SHR'] },
  { value: 'iv', label: '수액/영양주사', keywords: ['수액','백옥주사','신데렐라주사','비타민주사','태반주사','줄기세포'] },
];

const PERIOD_OPTIONS = [
  { value: 'all', label: '전체' },
  { value: '3m', label: '3개월 내' },
  { value: '6m', label: '6개월 내' },
  { value: '1y', label: '1년 내' },
];

const matchesCategory = (treatmentName: string, categoryValue: string): boolean => {
  if (categoryValue === 'all') return true;
  const cat = CATEGORY_OPTIONS.find(c => c.value === categoryValue);
  if (!cat) return true;
  const name = treatmentName.toLowerCase();
  return cat.keywords.some(kw => name.includes(kw.toLowerCase()));
};

const MyTreatmentHistory = () => {
  const { records, loading, updateRecord, deleteRecord } = useRecords();
  const { cycles } = useCycles();
  const [search, setSearch] = useState('');
  const [periodFilter, setPeriodFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [bodyAreaFilter, setBodyAreaFilter] = useState<string | null>(null);
  const [clinicFilter, setClinicFilter] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<TreatmentRecord>>({});

  // Derive dynamic body area chips from records
  const bodyAreaChips = useMemo(() => {
    const nonPkgRecords = records.filter(r => !r.packageId);
    const areaSet = new Set<string>();
    let hasOther = false;
    nonPkgRecords.forEach(r => {
      if (r.bodyArea) {
        if (BODY_AREA_FILTER_MAP[r.bodyArea]) {
          areaSet.add(r.bodyArea);
        } else {
          hasOther = true;
        }
      }
    });
    const chips = Array.from(areaSet).map(key => ({
      key,
      label: BODY_AREA_FILTER_MAP[key],
    }));
    if (hasOther) {
      chips.push({ key: '__other', label: '기타' });
    }
    return chips;
  }, [records]);

  // Derive dynamic clinic chips from records
  const clinicChips = useMemo(() => {
    const nonPkgRecords = records.filter(r => !r.packageId);
    const clinicSet = new Set<string>();
    nonPkgRecords.forEach(r => {
      if (r.clinic) clinicSet.add(r.clinic);
    });
    return Array.from(clinicSet).sort();
  }, [records]);

  // Filter & search
  const filtered = useMemo(() => {
    const now = new Date();
    return records
      .filter(r => !r.packageId)
      .filter(r => {
        // Period filter
        if (periodFilter !== 'all') {
          const d = parseISO(r.date);
          if (periodFilter === '3m' && d < subMonths(now, 3)) return false;
          if (periodFilter === '6m' && d < subMonths(now, 6)) return false;
          if (periodFilter === '1y' && d < subMonths(now, 12)) return false;
        }
        // Category filter — match by treatment name keywords
        if (categoryFilter !== 'all' && !matchesCategory(r.treatmentName, categoryFilter)) return false;
        // Body area filter
        if (bodyAreaFilter) {
          if (bodyAreaFilter === '__other') {
            if (!r.bodyArea || BODY_AREA_FILTER_MAP[r.bodyArea]) return false;
          } else {
            if (r.bodyArea !== bodyAreaFilter) return false;
          }
        }
        // Clinic filter
        if (clinicFilter && r.clinic !== clinicFilter) return false;
        // Search
        if (search) {
          const q = search.toLowerCase();
          if (!r.treatmentName.toLowerCase().includes(q) && !r.clinic.toLowerCase().includes(q)) return false;
        }
        return true;
      });
  }, [records, periodFilter, categoryFilter, bodyAreaFilter, clinicFilter, search]);

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


      {/* Row 1 — 기간 dropdown */}
      <div className="space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] text-muted-foreground mb-1 block">기간</label>
            <Select value={periodFilter} onValueChange={setPeriodFilter}>
              <SelectTrigger className="h-8 text-xs rounded-lg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PERIOD_OPTIONS.map(o => (
                  <SelectItem key={o.value} value={o.value} className="text-xs">{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {/* Row 2 — 시술종류 dropdown */}
          <div>
            <label className="text-[10px] text-muted-foreground mb-1 block">시술종류</label>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="h-8 text-xs rounded-lg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORY_OPTIONS.map(o => (
                  <SelectItem key={o.value} value={o.value} className="text-xs">{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Row 3 — 부위 chips */}
        {bodyAreaChips.length > 0 && (
          <div>
            <label className="text-[10px] text-muted-foreground mb-1 block">부위</label>
            <div className="flex gap-1.5 flex-wrap">
              <button
                onClick={() => setBodyAreaFilter(null)}
                className={cn('px-3 py-1.5 rounded-full text-[11px] font-semibold border transition-all',
                  !bodyAreaFilter ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border/50 text-muted-foreground')}
              >
                전체
              </button>
              {bodyAreaChips.map(chip => (
                <button
                  key={chip.key}
                  onClick={() => setBodyAreaFilter(prev => prev === chip.key ? null : chip.key)}
                  className={cn('px-3 py-1.5 rounded-full text-[11px] font-semibold border transition-all',
                    bodyAreaFilter === chip.key ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border/50 text-muted-foreground')}
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Row 3 — 병원 chips */}
        {clinicChips.length > 0 && (
          <div>
            <label className="text-[10px] text-muted-foreground mb-1 block">병원</label>
            <div className="flex gap-1.5 flex-wrap">
              <button
                onClick={() => setClinicFilter(null)}
                className={cn('px-3 py-1.5 rounded-full text-[11px] font-semibold border transition-all',
                  !clinicFilter ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border/50 text-muted-foreground')}
              >
                전체
              </button>
              {clinicChips.map(clinic => (
                <button
                  key={clinic}
                  onClick={() => setClinicFilter(prev => prev === clinic ? null : clinic)}
                  className={cn('px-3 py-1.5 rounded-full text-[11px] font-semibold border transition-all',
                    clinicFilter === clinic ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border/50 text-muted-foreground')}
                >
                  {clinic}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Records by month */}
      {Object.keys(grouped).length === 0 ? (
        <div className="space-y-3 mt-2">
          {/* 예시 시술내역 카드 */}
          <div className="relative opacity-60 pointer-events-none">
            <div className="absolute -top-2 left-3 z-10">
              <span className="bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-full">예시</span>
            </div>
            <Card className="border-dashed border-muted-foreground/30">
              <CardContent className="p-0">
                <button className="w-full flex items-center gap-3 p-3 text-left">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-foreground">울쎄라 리프팅</p>
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full border bg-violet-100 text-violet-700 border-violet-200 font-medium">피하조직</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[11px] text-muted-foreground">3.05 (수)</span>
                      <span className="text-[11px] text-muted-foreground">·</span>
                      <span className="text-[11px] text-muted-foreground">청담 에스테틱</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-bold text-foreground">350,000원</span>
                  </div>
                </button>
              </CardContent>
            </Card>
          </div>

          <div className="relative opacity-60 pointer-events-none">
            <Card className="border-dashed border-muted-foreground/30">
              <CardContent className="p-0">
                <button className="w-full flex items-center gap-3 p-3 text-left">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-foreground">보톡스 (턱)</p>
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full border bg-sky-100 text-sky-700 border-sky-200 font-medium">진피층</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[11px] text-muted-foreground">2.20 (목)</span>
                      <span className="text-[11px] text-muted-foreground">·</span>
                      <span className="text-[11px] text-muted-foreground">강남 피부과</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-bold text-foreground">120,000원</span>
                  </div>
                </button>
              </CardContent>
            </Card>
          </div>

          {/* 안내 문구 */}
          <div className="rounded-2xl border border-dashed border-muted-foreground/20 bg-muted/50 p-6 text-center">
            <Stethoscope className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-sm font-semibold text-muted-foreground mb-1">아직 시술 내역이 없어요</p>
            <p className="text-xs text-muted-foreground/70 leading-relaxed">
              시술을 기록하면 부위별, 기간별로<br />내 관리 히스토리를 한눈에 볼 수 있어요
            </p>
            <div className="flex items-center justify-center gap-1.5 mt-4">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-[#F2C94C] shadow-md">
                <span className="text-[#E87461] text-lg font-bold">+</span>
              </span>
              <p className="text-xs font-medium text-muted-foreground">
                우측 하단 <span className="font-bold text-[#E87461]">+</span> 버튼으로 바로 등록하세요
              </p>
            </div>
          </div>
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
                              <p className="font-medium text-foreground">
                                {r.bodyArea
                                  ? (BODY_AREA_LABELS[r.bodyArea as BodyArea] || BODY_AREA_FILTER_MAP[r.bodyArea] || r.bodyArea)
                                  : '-'}
                              </p>
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
