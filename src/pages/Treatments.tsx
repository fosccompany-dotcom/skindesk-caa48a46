import { useState, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Filter, X, ChevronDown, ChevronUp, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  CLINIC_TREATMENTS,
  CATEGORY_LABELS,
  BODY_AREA_TREATMENT_LABELS,
  EFFECT_LABELS,
  TreatmentCategory,
  TreatmentBodyArea,
  TreatmentEffect,
  ClinicTreatment,
} from '@/data/treatmentCatalog';

const categoryKeys = Object.keys(CATEGORY_LABELS) as TreatmentCategory[];
const bodyAreaKeys = Object.keys(BODY_AREA_TREATMENT_LABELS) as TreatmentBodyArea[];
const effectKeys = Object.keys(EFFECT_LABELS) as TreatmentEffect[];

type PriceRange = 'under10' | '10to30' | '30to50' | '50to100' | 'over100';
const PRICE_LABELS: Record<PriceRange, string> = {
  under10: '10만 미만',
  '10to30': '10~30만',
  '30to50': '30~50만',
  '50to100': '50~100만',
  over100: '100만 이상',
};
const priceKeys = Object.keys(PRICE_LABELS) as PriceRange[];

function parsePriceRange(priceRange?: string): [number, number] | null {
  if (!priceRange) return null;
  const nums = priceRange.replace(/[^0-9~\-,]/g, '').split(/[~\-,]/);
  const low = parseInt(nums[0]) || 0;
  const high = parseInt(nums[1]) || low;
  return [low * 10000, high * 10000];
}

function matchesPrice(t: ClinicTreatment, range: PriceRange): boolean {
  const p = parsePriceRange(t.priceRange);
  if (!p) return false;
  const [low] = p;
  switch (range) {
    case 'under10': return low < 100000;
    case '10to30': return low >= 100000 && low < 300000;
    case '30to50': return low >= 300000 && low < 500000;
    case '50to100': return low >= 500000 && low < 1000000;
    case 'over100': return low >= 1000000;
  }
}

type FilterSection = 'category' | 'price' | 'bodyArea' | 'effect';

const Treatments = () => {
  const [search, setSearch] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<TreatmentCategory[]>([]);
  const [selectedPrices, setSelectedPrices] = useState<PriceRange[]>([]);
  const [selectedAreas, setSelectedAreas] = useState<TreatmentBodyArea[]>([]);
  const [selectedEffects, setSelectedEffects] = useState<TreatmentEffect[]>([]);
  const [expandedSections, setExpandedSections] = useState<FilterSection[]>(['category']);

  const toggleSection = (s: FilterSection) =>
    setExpandedSections(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);

  const toggle = <T,>(arr: T[], val: T) =>
    arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val];

  const activeFilterCount = selectedCategories.length + selectedPrices.length + selectedAreas.length + selectedEffects.length;

  const clearAll = () => {
    setSelectedCategories([]);
    setSelectedPrices([]);
    setSelectedAreas([]);
    setSelectedEffects([]);
    setSearch('');
  };

  const filtered = useMemo(() => {
    return CLINIC_TREATMENTS.filter(t => {
      if (search) {
        const q = search.toLowerCase();
        const match = t.name.toLowerCase().includes(q) ||
          t.clinic.toLowerCase().includes(q) ||
          t.description?.toLowerCase().includes(q);
        if (!match) return false;
      }
      if (selectedCategories.length && !selectedCategories.includes(t.category)) return false;
      if (selectedPrices.length && !selectedPrices.some(p => matchesPrice(t, p))) return false;
      if (selectedAreas.length && !selectedAreas.some(a => t.bodyAreas.includes(a))) return false;
      if (selectedEffects.length && !selectedEffects.some(e => t.effects.includes(e))) return false;
      return true;
    });
  }, [search, selectedCategories, selectedPrices, selectedAreas, selectedEffects]);

  const grouped = useMemo(() => {
    return filtered.reduce((acc, t) => {
      const key = CATEGORY_LABELS[t.category];
      if (!acc[key]) acc[key] = [];
      acc[key].push(t);
      return acc;
    }, {} as Record<string, ClinicTreatment[]>);
  }, [filtered]);

  const FilterRow = ({ label, section, children }: { label: string; section: FilterSection; children: React.ReactNode }) => {
    const isOpen = expandedSections.includes(section);
    return (
      <div className="border-b border-border/30 last:border-b-0">
        <button
          onClick={() => toggleSection(section)}
          className="w-full flex items-center justify-between py-2.5 px-1 text-sm font-medium text-foreground"
        >
          <span>{label}</span>
          {isOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </button>
        {isOpen && <div className="flex flex-wrap gap-1.5 pb-3 px-1">{children}</div>}
      </div>
    );
  };

  return (
    <div className="page-container pb-24">
      {/* Header */}
      <div className="pt-6 pb-3 px-1">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">시술 리스트</h1>
            <p className="text-xs text-muted-foreground mt-0.5">{filtered.length}개 시술</p>
          </div>
          {activeFilterCount > 0 && (
            <button onClick={clearAll} className="flex items-center gap-1 text-xs text-primary">
              <X className="h-3 w-3" /> 필터 초기화
            </button>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="px-1 mb-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="시술명, 병원명 검색..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-card border border-border/50 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/30"
          />
        </div>
      </div>

      {/* Layered Filters */}
      <div className="mx-1 mb-4 glass-card rounded-xl px-3 py-1">
        <div className="flex items-center gap-2 py-2 border-b border-border/30">
          <Filter className="h-4 w-4 text-primary" />
          <span className="text-xs font-semibold text-foreground">필터</span>
          {activeFilterCount > 0 && (
            <Badge variant="default" className="text-[10px] px-1.5 py-0 ml-auto">{activeFilterCount}</Badge>
          )}
        </div>

        <FilterRow label="시술 종류" section="category">
          {categoryKeys.map(cat => (
            <Badge
              key={cat}
              variant={selectedCategories.includes(cat) ? 'default' : 'outline'}
              className="cursor-pointer text-[11px]"
              onClick={() => setSelectedCategories(prev => toggle(prev, cat))}
            >
              {CATEGORY_LABELS[cat]}
            </Badge>
          ))}
        </FilterRow>

        <FilterRow label="가격대" section="price">
          {priceKeys.map(p => (
            <Badge
              key={p}
              variant={selectedPrices.includes(p) ? 'default' : 'outline'}
              className="cursor-pointer text-[11px]"
              onClick={() => setSelectedPrices(prev => toggle(prev, p))}
            >
              {PRICE_LABELS[p]}
            </Badge>
          ))}
        </FilterRow>

        <FilterRow label="부위" section="bodyArea">
          {bodyAreaKeys.map(a => (
            <Badge
              key={a}
              variant={selectedAreas.includes(a) ? 'default' : 'outline'}
              className="cursor-pointer text-[11px]"
              onClick={() => setSelectedAreas(prev => toggle(prev, a))}
            >
              {BODY_AREA_TREATMENT_LABELS[a]}
            </Badge>
          ))}
        </FilterRow>

        <FilterRow label="효과" section="effect">
          {effectKeys.map(e => (
            <Badge
              key={e}
              variant={selectedEffects.includes(e) ? 'default' : 'outline'}
              className="cursor-pointer text-[11px]"
              onClick={() => setSelectedEffects(prev => toggle(prev, e))}
            >
              {EFFECT_LABELS[e]}
            </Badge>
          ))}
        </FilterRow>
      </div>

      {/* Results */}
      <div className="space-y-5 px-1">
        {Object.keys(grouped).length === 0 && (
          <div className="text-center py-12 text-muted-foreground text-sm">
            조건에 맞는 시술이 없습니다
          </div>
        )}
        {Object.entries(grouped).map(([category, treatments]) => (
          <div key={category}>
            <h2 className="text-sm font-semibold text-foreground mb-2">{category} ({treatments.length})</h2>
            <div className="space-y-2">
              {treatments.map(t => (
                <div key={t.id} className="glass-card p-3 rounded-xl">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground truncate">{t.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{t.clinic}</p>
                      {t.description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{t.description}</p>
                      )}
                    </div>
                    {t.priceRange && (
                      <span className="text-xs text-primary font-medium whitespace-nowrap">{t.priceRange}</span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {t.bodyAreas.map(a => (
                      <Badge key={a} variant="outline" className="text-[10px] px-1.5 py-0 border-primary/30 text-primary">
                        {BODY_AREA_TREATMENT_LABELS[a]}
                      </Badge>
                    ))}
                    {t.effects.slice(0, 3).map(e => (
                      <Badge key={e} variant="secondary" className="text-[10px] px-1.5 py-0">
                        {EFFECT_LABELS[e]}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Treatments;
