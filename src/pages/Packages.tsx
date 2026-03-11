import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SkinLayerBadge, BodyAreaBadge } from '@/components/SkinLayerBadge';
import { useRecords } from '@/context/RecordsContext';
import { TreatmentRecord, SKIN_LAYER_LABELS, BODY_AREA_LABELS, SkinLayer, BodyArea } from '@/types/skin';
import { Sparkles, Building2, Star, ChevronDown, ChevronUp } from 'lucide-react';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/i18n/LanguageContext';

interface Package {
  id: string; name: string; clinic: string; totalSessions: number;
  usedSessions: number; expiryDate: string; skinLayer?: string; bodyArea?: string;
}

const layers: SkinLayer[] = ['epidermis', 'dermis', 'subcutaneous'];
const bodyAreas: BodyArea[] = ['face', 'neck', 'arm', 'leg', 'abdomen', 'back', 'chest', 'hip'];

function StarRating({ value, onChange, readonly = false }: { value: number; onChange?: (v: 1|2|3|4|5) => void; readonly?: boolean }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly && !onChange}
          className={cn('p-0.5 transition-colors', !readonly && 'cursor-pointer')}
          onClick={() => onChange?.(star as 1|2|3|4|5)}
        >
          <Star className={cn(
            'h-4 w-4 transition-colors',
            star <= value ? 'fill-amber text-amber' : 'text-muted-foreground/30'
          )} />
        </button>
      ))}
    </div>
  );
}

const Packages = () => {
  const { t } = useLanguage();
  const { records, updateRecord } = useRecords();
  const packages: Package[] = [];
  const [mainTab, setMainTab] = useState<'packages' | 'history'>('packages');
  const [filterType, setFilterType] = useState<'layer' | 'body'>('body');
  const [selectedClinic, setSelectedClinic] = useState<string | null>(null);

  // Treatment history state
  const [expandedRecord, setExpandedRecord] = useState<string | null>(null);
  const [editingMemo, setEditingMemo] = useState<Record<string, string>>({});

  const clinics = useMemo(() => {
    const clinicSet = new Set<string>();
    packages.forEach(p => clinicSet.add(p.clinic));
    records.forEach(r => clinicSet.add(r.clinic));
    return Array.from(clinicSet);
  }, []);

  const filteredPackages = useMemo(() =>
    selectedClinic ? packages.filter(p => p.clinic === selectedClinic) : packages,
    [selectedClinic]
  );

  const filteredRecords = useMemo(() =>
    selectedClinic ? records.filter(r => r.clinic === selectedClinic) : records,
    [selectedClinic]
  );

  const sortedRecords = useMemo(() =>
    [...records].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [records]
  );

  const avgSatisfaction = useMemo(() => {
    const rated = records.filter(r => r.satisfaction);
    if (rated.length === 0) return 0;
    return rated.reduce((sum, r) => sum + (r.satisfaction || 0), 0) / rated.length;
  }, [records]);

  const updateSatisfaction = async (id: string, satisfaction: 1|2|3|4|5) => {
    const rec = records.find(r => r.id === id);
    if (!rec) return;
    await updateRecord(id, { ...rec, satisfaction });
  };

  const updateMemo = async (id: string) => {
    const memo = editingMemo[id];
    if (memo !== undefined) {
      const rec = records.find(r => r.id === id);
      if (rec) await updateRecord(id, { ...rec, memo });
      setEditingMemo(prev => { const next = { ...prev }; delete next[id]; return next; });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="page-header safe-top">
        <h1 className="text-lg font-bold">시술정보</h1>
        <p className="text-xs text-muted-foreground mt-1">시술권 · 시술내역 관리</p>
      </div>

      {/* Main tabs like Points page */}
      <div className="sticky top-0 z-10 bg-card border-b border-border/50 px-4">
        <div className="flex">
          {([
            { key: 'packages' as const, label: '시술권관리' },
            { key: 'history' as const, label: '시술내역' },
          ]).map(t => (
            <button
              key={t.key}
              onClick={() => setMainTab(t.key)}
              className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${
                mainTab === t.key ? 'border-foreground text-foreground' : 'border-transparent text-muted-foreground'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="page-content">
        {/* ── 시술권관리 탭 ── */}
        {mainTab === 'packages' && (
          <>
            {/* Toggle */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setFilterType('body')}
                className={`px-4 py-2 rounded-full text-xs font-semibold transition-all tap-target ${filterType === 'body' ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-muted text-muted-foreground'}`}
              >
                부위별
              </button>
              <button
                onClick={() => setFilterType('layer')}
                className={`px-4 py-2 rounded-full text-xs font-semibold transition-all tap-target ${filterType === 'layer' ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-muted text-muted-foreground'}`}
              >
                피부층별
              </button>
            </div>

            {/* Clinic Filter */}
            <ScrollArea className="w-full mb-4">
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedClinic(null)}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                    !selectedClinic ? 'bg-accent text-accent-foreground shadow-sm' : 'bg-muted text-muted-foreground'
                  }`}
                >
                  <Building2 className="h-3 w-3" />
                  전체 병원
                </button>
                {clinics.map((clinic) => (
                  <button
                    key={clinic}
                    onClick={() => setSelectedClinic(clinic)}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                      selectedClinic === clinic ? 'bg-accent text-accent-foreground shadow-sm' : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    <Building2 className="h-3 w-3" />
                    {clinic}
                  </button>
                ))}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>

            {filterType === 'body' ? (
              <Tabs defaultValue="all" className="w-full">
                <ScrollArea className="w-full mb-4">
                  <TabsList className="inline-flex w-auto gap-1 h-auto bg-transparent p-0">
                    <TabsTrigger value="all" className="text-xs rounded-full px-3 py-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">전체</TabsTrigger>
                    {bodyAreas.filter(a => filteredPackages.some(p => p.bodyArea === a)).map((a) => (
                      <TabsTrigger key={a} value={a} className="text-xs rounded-full px-3 py-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">{BODY_AREA_LABELS[a]}</TabsTrigger>
                    ))}
                  </TabsList>
                  <ScrollBar orientation="horizontal" />
                </ScrollArea>

                <TabsContent value="all" className="space-y-2.5 mt-0">
                  {filteredPackages.map((pkg) => <PackageCard key={pkg.id} pkg={pkg} />)}
                </TabsContent>

                {bodyAreas.map((area) => (
                  <TabsContent key={area} value={area} className="space-y-2.5 mt-0">
                    {filteredPackages.filter(p => p.bodyArea === area).map((pkg) => (
                      <PackageCard key={pkg.id} pkg={pkg} />
                    ))}
                    <RecordsList records={filteredRecords.filter(r => r.bodyArea === area)} />
                  </TabsContent>
                ))}
              </Tabs>
            ) : (
              <Tabs defaultValue="all" className="w-full">
                <TabsList className="w-full grid grid-cols-4 mb-4 h-auto bg-muted rounded-2xl p-1">
                  <TabsTrigger value="all" className="text-xs rounded-xl py-2 data-[state=active]:bg-card data-[state=active]:shadow-sm">전체</TabsTrigger>
                  {layers.map((l) => (
                    <TabsTrigger key={l} value={l} className="text-xs rounded-xl py-2 data-[state=active]:bg-card data-[state=active]:shadow-sm">{SKIN_LAYER_LABELS[l]}</TabsTrigger>
                  ))}
                </TabsList>

                <TabsContent value="all" className="space-y-2.5 mt-0">
                  {filteredPackages.map((pkg) => <PackageCard key={pkg.id} pkg={pkg} />)}
                </TabsContent>

                {layers.map((layer) => (
                  <TabsContent key={layer} value={layer} className="space-y-2.5 mt-0">
                    {filteredPackages.filter(p => p.skinLayer === layer).map((pkg) => (
                      <PackageCard key={pkg.id} pkg={pkg} />
                    ))}
                    <RecordsList records={filteredRecords.filter(r => r.skinLayer === layer)} />
                  </TabsContent>
                ))}
              </Tabs>
            )}
          </>
        )}

        {/* ── 시술내역 탭 ── */}
        {mainTab === 'history' && (
          <div className="space-y-3 pt-4">
            <Card className="glass-card">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[11px] text-muted-foreground">{t('total_records')}</p>
                    <p className="text-2xl font-bold text-foreground">{records.length}<span className="text-sm font-normal text-muted-foreground">건</span></p>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] text-muted-foreground">{t('avg_satisfaction')}</p>
                    <div className="flex items-center gap-1.5">
                      <Star className="h-4 w-4 fill-amber text-amber" />
                      <span className="text-2xl font-bold text-foreground">{avgSatisfaction.toFixed(1)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-2">
              {sortedRecords.map((record) => {
                const isExpanded = expandedRecord === record.id;
                const memoValue = editingMemo[record.id] ?? record.memo ?? '';

                return (
                  <Card key={record.id} className="glass-card overflow-hidden">
                    <button
                      className="w-full text-left"
                      onClick={() => setExpandedRecord(isExpanded ? null : record.id)}
                    >
                      <CardContent className="p-3.5">
                        <div className="flex items-center justify-between">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm font-semibold text-foreground">{record.treatmentName}</span>
                              <Badge variant="outline" className="text-[9px] px-1.5 py-0">{BODY_AREA_LABELS[record.bodyArea]}</Badge>
                            </div>
                            <p className="text-[11px] text-muted-foreground mt-0.5">
                              {format(new Date(record.date), 'yyyy.M.d (EEE)', { locale: ko })} · {record.clinic}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {record.satisfaction && (
                              <div className="flex items-center gap-0.5">
                                <Star className="h-3 w-3 fill-amber text-amber" />
                                <span className="text-xs font-semibold text-foreground">{record.satisfaction}</span>
                              </div>
                            )}
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                        </div>
                        {record.notes && !isExpanded && (
                          <p className="text-[10px] text-muted-foreground mt-1 truncate">{record.notes}</p>
                        )}
                      </CardContent>
                    </button>

                    {isExpanded && (
                      <div className="border-t border-border/50 px-3.5 pb-3.5 pt-3 space-y-3">
                        <div className="flex flex-wrap gap-1.5">
                          <Badge variant="secondary" className="text-[10px]">{SKIN_LAYER_LABELS[record.skinLayer]}</Badge>
                          <Badge variant="secondary" className="text-[10px]">{BODY_AREA_LABELS[record.bodyArea]}</Badge>
                          <Badge variant="outline" className="text-[10px]">{record.clinic}</Badge>
                        </div>

                        {record.notes && (
                          <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-2.5">{record.notes}</p>
                        )}

                        <div>
                          <Label className="text-[11px] text-muted-foreground mb-1.5 block">{t('satisfaction')}</Label>
                          <StarRating
                            value={record.satisfaction || 0}
                            onChange={(v) => updateSatisfaction(record.id, v)}
                          />
                        </div>

                        <div>
                          <Label className="text-[11px] text-muted-foreground mb-1.5 block">메모</Label>
                          <Textarea
                            value={memoValue}
                            onChange={(e) => setEditingMemo(prev => ({ ...prev, [record.id]: e.target.value }))}
                            placeholder={t('memo_placeholder')}
                            className="text-xs min-h-[80px] rounded-xl resize-none"
                          />
                          {editingMemo[record.id] !== undefined && editingMemo[record.id] !== (record.memo ?? '') && (
                            <Button
                              size="sm"
                              className="mt-2 w-full rounded-xl text-xs"
                              onClick={() => updateMemo(record.id)}
                            >
                              {t('save')}
                            </Button>
                          )}
                        </div>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>

            {sortedRecords.length === 0 && (
              <div className="text-center py-12 text-muted-foreground text-sm">
                {t('no_records')}
              </div>
            )}
          </div>
        )}

        <div className="h-24" />
      </div>
    </div>
  );
};

function RecordsList({ records }: { records: TreatmentRecord[] }) {
  if (records.length === 0) return null;
  return (
    <div className="space-y-2 mt-4">
      <h3 className="text-xs font-semibold text-muted-foreground px-1">시술 기록</h3>
      {records.map((rec) => (
        <Card key={rec.id} className="glass-card">
          <CardContent className="flex items-center gap-3 p-3">
            <Sparkles className="h-4 w-4 text-muted-foreground shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <p className="text-sm font-medium">{rec.treatmentName}</p>
                <BodyAreaBadge area={rec.bodyArea} />
                <SkinLayerBadge layer={rec.skinLayer} />
              </div>
              <p className="text-[11px] text-muted-foreground">{rec.date} · {rec.clinic}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function PackageCard({ pkg }: { pkg: Package }) {
  const progress = (pkg.usedSessions / pkg.totalSessions) * 100;
  const remaining = pkg.totalSessions - pkg.usedSessions;

  return (
    <Card className="glass-card">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 mb-1 flex-wrap">
              <span className="font-bold text-sm">{pkg.name}</span>
              <BodyAreaBadge area={pkg.bodyArea} />
              <SkinLayerBadge layer={pkg.skinLayer} />
            </div>
            <p className="text-[11px] text-muted-foreground">{pkg.clinic}</p>
          </div>
          <div className="text-right shrink-0 ml-3">
            <p className="text-2xl font-bold text-primary">{remaining}</p>
            <p className="text-[10px] text-muted-foreground">잔여</p>
          </div>
        </div>
        <Progress value={progress} className="h-1.5" />
        <div className="mt-2 flex justify-between text-[11px] text-muted-foreground">
          <span>{pkg.usedSessions}회 / {pkg.totalSessions}회</span>
          <span>만료 {pkg.expiryDate}</span>
        </div>
      </CardContent>
    </Card>
  );
}

export default Packages;
