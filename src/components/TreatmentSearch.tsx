import { useState, useMemo } from 'react';
import { Search, X, Building2, Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  CLINIC_TREATMENTS, CATEGORY_LABELS, BODY_AREA_TREATMENT_LABELS, EFFECT_LABELS,
  TreatmentCategory, TreatmentBodyArea, TreatmentEffect, ClinicTreatment,
} from '@/data/treatmentCatalog';

type ClinicFilter = 'all' | '밴스의원' | '쁨클리닉';

export default function TreatmentSearch() {
  const [query, setQuery] = useState('');
  const [clinicFilter, setClinicFilter] = useState<ClinicFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState<TreatmentCategory | 'all'>('all');
  const [bodyAreaFilter, setBodyAreaFilter] = useState<TreatmentBodyArea | 'all'>('all');
  const [effectFilter, setEffectFilter] = useState<TreatmentEffect | 'all'>('all');

  const activeCount = [clinicFilter !== 'all', categoryFilter !== 'all', bodyAreaFilter !== 'all', effectFilter !== 'all'].filter(Boolean).length;

  const filtered = useMemo(() => {
    let result = [...CLINIC_TREATMENTS];

    if (query.trim()) {
      const q = query.trim().toLowerCase();
      result = result.filter(t =>
        t.name.toLowerCase().includes(q) ||
        t.clinic.toLowerCase().includes(q) ||
        t.description?.toLowerCase().includes(q) ||
        CATEGORY_LABELS[t.category].includes(q) ||
        t.effects.some(e => EFFECT_LABELS[e].includes(q)) ||
        t.bodyAreas.some(b => BODY_AREA_TREATMENT_LABELS[b].includes(q))
      );
    }

    if (clinicFilter !== 'all') result = result.filter(t => t.clinic === clinicFilter);
    if (categoryFilter !== 'all') result = result.filter(t => t.category === categoryFilter);
    if (bodyAreaFilter !== 'all') result = result.filter(t => t.bodyAreas.includes(bodyAreaFilter));
    if (effectFilter !== 'all') result = result.filter(t => t.effects.includes(effectFilter));

    return result;
  }, [query, clinicFilter, categoryFilter, bodyAreaFilter, effectFilter]);

  const clearAll = () => {
    setQuery('');
    setClinicFilter('all');
    setCategoryFilter('all');
    setBodyAreaFilter('all');
    setEffectFilter('all');
  };

  // Only show categories/areas/effects that exist in current results for better UX
  const availableCategories = useMemo(() => {
    const cats = new Set(CLINIC_TREATMENTS.map(t => t.category));
    return Object.keys(CATEGORY_LABELS).filter(k => cats.has(k as TreatmentCategory)) as TreatmentCategory[];
  }, []);

  const availableBodyAreas = useMemo(() => {
    const areas = new Set(CLINIC_TREATMENTS.flatMap(t => t.bodyAreas));
    return Object.keys(BODY_AREA_TREATMENT_LABELS).filter(k => areas.has(k as TreatmentBodyArea)) as TreatmentBodyArea[];
  }, []);

  const availableEffects = useMemo(() => {
    const effs = new Set(CLINIC_TREATMENTS.flatMap(t => t.effects));
    return Object.keys(EFFECT_LABELS).filter(k => effs.has(k as TreatmentEffect)) as TreatmentEffect[];
  }, []);

  return (
    <div className="space-y-3">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="시술명, 효과, 부위 검색..."
          className="pl-9 rounded-xl"
        />
        {(query || activeCount > 0) && (
          <button onClick={clearAll} className="absolute right-3 top-1/2 -translate-y-1/2 tap-target">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* Clinic filter */}
      <div className="space-y-1.5">
        <p className="text-[11px] text-muted-foreground font-medium">병원</p>
        <div className="flex gap-1.5">
          {(['all', '밴스의원', '쁨클리닉'] as ClinicFilter[]).map(c => (
            <Badge
              key={c}
              variant={clinicFilter === c ? 'default' : 'outline'}
              className="cursor-pointer tap-target rounded-full px-3 py-1.5 text-xs"
              onClick={() => setClinicFilter(c)}
            >
              {c === 'all' ? '전체' : c}
            </Badge>
          ))}
        </div>
      </div>

      {/* Category filter */}
      <div className="space-y-1.5">
        <p className="text-[11px] text-muted-foreground font-medium">시술 카테고리</p>
        <ScrollArea className="w-full">
          <div className="flex gap-1.5 pb-1 flex-wrap">
            <Badge
              variant={categoryFilter === 'all' ? 'default' : 'outline'}
              className="cursor-pointer tap-target rounded-full px-3 py-1.5 text-xs whitespace-nowrap"
              onClick={() => setCategoryFilter('all')}
            >
              전체
            </Badge>
            {availableCategories.map(c => (
              <Badge
                key={c}
                variant={categoryFilter === c ? 'default' : 'outline'}
                className="cursor-pointer tap-target rounded-full px-3 py-1.5 text-xs whitespace-nowrap"
                onClick={() => setCategoryFilter(c)}
              >
                {CATEGORY_LABELS[c]}
              </Badge>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Body area filter */}
      <div className="space-y-1.5">
        <p className="text-[11px] text-muted-foreground font-medium">부위</p>
        <div className="flex gap-1.5 flex-wrap">
          <Badge
            variant={bodyAreaFilter === 'all' ? 'default' : 'outline'}
            className="cursor-pointer tap-target rounded-full px-3 py-1.5 text-xs"
            onClick={() => setBodyAreaFilter('all')}
          >
            전체
          </Badge>
          {availableBodyAreas.map(a => (
            <Badge
              key={a}
              variant={bodyAreaFilter === a ? 'default' : 'outline'}
              className="cursor-pointer tap-target rounded-full px-3 py-1.5 text-xs"
              onClick={() => setBodyAreaFilter(a)}
            >
              {BODY_AREA_TREATMENT_LABELS[a]}
            </Badge>
          ))}
        </div>
      </div>

      {/* Effect filter */}
      <div className="space-y-1.5">
        <p className="text-[11px] text-muted-foreground font-medium">효과</p>
        <div className="flex gap-1.5 flex-wrap">
          <Badge
            variant={effectFilter === 'all' ? 'default' : 'outline'}
            className="cursor-pointer tap-target rounded-full px-3 py-1.5 text-xs"
            onClick={() => setEffectFilter('all')}
          >
            전체
          </Badge>
          {availableEffects.map(e => (
            <Badge
              key={e}
              variant={effectFilter === e ? 'default' : 'outline'}
              className="cursor-pointer tap-target rounded-full px-3 py-1.5 text-xs"
              onClick={() => setEffectFilter(e)}
            >
              {EFFECT_LABELS[e]}
            </Badge>
          ))}
        </div>
      </div>

      {/* Result count */}
      <p className="text-[11px] text-muted-foreground">
        {filtered.length}개 시술
      </p>

      {/* Results */}
      <div className="space-y-2">
        {filtered.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">검색 결과가 없습니다</p>
        )}
        {filtered.map(t => (
          <Card key={t.id} className="glass-card">
            <CardContent className="p-3.5">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted">
                  <Sparkles className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold">{t.name}</p>
                  <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                    <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                      <Building2 className="h-3 w-3" />
                      {t.clinic}
                    </span>
                    <span className="text-[10px] text-muted-foreground">·</span>
                    <span className="text-[10px] text-muted-foreground">{CATEGORY_LABELS[t.category]}</span>
                    {t.priceRange && (
                      <>
                        <span className="text-[10px] text-muted-foreground">·</span>
                        <span className="text-[10px] font-medium text-primary">{t.priceRange}</span>
                      </>
                    )}
                  </div>
                  {t.description && (
                    <p className="text-[10px] text-muted-foreground mt-0.5">{t.description}</p>
                  )}
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {t.bodyAreas.map(a => (
                      <Badge key={a} variant="secondary" className="text-[9px] px-1.5 py-0 h-4 rounded-full">
                        {BODY_AREA_TREATMENT_LABELS[a]}
                      </Badge>
                    ))}
                    {t.effects.map(e => (
                      <Badge key={e} variant="outline" className="text-[9px] px-1.5 py-0 h-4 rounded-full">
                        {EFFECT_LABELS[e]}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
