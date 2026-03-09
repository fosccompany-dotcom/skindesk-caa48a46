import { useState, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Filter, X, ChevronDown, ChevronUp, Search, MapPin, Sparkles, Tag, Building2, CalendarPlus, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { useCycles } from '@/context/CyclesContext';
import { SkinLayer, BodyArea, TreatmentCycle } from '@/types/skin';
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

// Map catalog category → skin layer
const CATEGORY_TO_SKIN_LAYER: Partial<Record<TreatmentCategory, SkinLayer>> = {
  botox: 'dermis',
  filler: 'dermis',
  lifting: 'subcutaneous',
  thread_lifting: 'subcutaneous',
  skin_booster: 'dermis',
  laser_toning: 'epidermis',
  peeling: 'epidermis',
  pigment: 'epidermis',
  acne: 'epidermis',
  hair_removal: 'epidermis',
  body_contouring: 'subcutaneous',
  iv_injection: 'dermis',
  skincare: 'epidermis',
  contour: 'subcutaneous',
  regeneration: 'dermis',
};

// Map catalog body area → cycle body area
const BODY_AREA_MAP: Partial<Record<TreatmentBodyArea, BodyArea>> = {
  face: 'face',
  neck: 'neck',
  body: 'chest',
  arm: 'arm',
  leg: 'leg',
  eye: 'face',
  bikini: 'hip',
  full_body: 'face',
};

// Default cycle days by category
const DEFAULT_CYCLE_DAYS: Partial<Record<TreatmentCategory, number>> = {
  botox: 120,
  filler: 365,
  lifting: 180,
  thread_lifting: 365,
  skin_booster: 90,
  laser_toning: 14,
  peeling: 28,
  pigment: 14,
  acne: 14,
  hair_removal: 42,
  body_contouring: 30,
  iv_injection: 14,
  skincare: 14,
  contour: 180,
  regeneration: 90,
};

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
  const [selectedTreatment, setSelectedTreatment] = useState<ClinicTreatment | null>(null);
  const [expandedSections, setExpandedSections] = useState<FilterSection[]>(['category']);
  const [favorites, setFavorites] = useState<Set<string>>(() => {
    const saved = localStorage.getItem('treatment-favorites');
    return saved ? new Set(JSON.parse(saved)) : new Set<string>();
  });
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const { cycles, setCycles } = useCycles();

  const toggleFavorite = (id: string) => {
    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      localStorage.setItem('treatment-favorites', JSON.stringify([...next]));
      return next;
    });
  };

  const registerCycle = (t: ClinicTreatment) => {
    const exists = cycles.some(c => c.treatmentName === t.name && c.clinic === t.clinic);
    if (exists) {
      toast({ title: '이미 등록된 시술입니다', description: `${t.name}은(는) 이미 주기 관리에 등록되어 있습니다.` });
      return;
    }
    const newCycle: TreatmentCycle = {
      id: `cycle-${Date.now()}`,
      treatmentName: t.name,
      skinLayer: CATEGORY_TO_SKIN_LAYER[t.category] || 'epidermis',
      bodyArea: BODY_AREA_MAP[t.bodyAreas[0]] || 'face',
      cycleDays: DEFAULT_CYCLE_DAYS[t.category] || 30,
      lastTreatmentDate: new Date().toISOString().split('T')[0],
      isCustomCycle: false,
      clinic: t.clinic,
      notes: t.description,
    };
    setCycles([...cycles, newCycle]);
    setSelectedTreatment(null);
    toast({ title: '시술 주기 등록 완료', description: `${t.name}이(가) 주기 관리에 추가되었습니다.` });
  };

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
      if (showFavoritesOnly && !favorites.has(t.id)) return false;
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
  }, [search, selectedCategories, selectedPrices, selectedAreas, selectedEffects, showFavoritesOnly, favorites]);

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
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFavoritesOnly(prev => !prev)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all border',
                showFavoritesOnly
                  ? 'bg-destructive/10 border-destructive/30 text-destructive'
                  : 'bg-card border-border/50 text-muted-foreground'
              )}
            >
              <Heart className={cn('h-3.5 w-3.5', showFavoritesOnly && 'fill-current')} />
              찜 {favorites.size > 0 && `(${favorites.size})`}
            </button>
            {activeFilterCount > 0 && (
              <button onClick={clearAll} className="flex items-center gap-1 text-xs text-primary">
                <X className="h-3 w-3" /> 초기화
              </button>
            )}
          </div>
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
                <div key={t.id} className="glass-card p-3 rounded-xl cursor-pointer active:scale-[0.98] transition-transform" onClick={() => setSelectedTreatment(t)}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1" >
                      <p className="text-sm font-medium text-foreground truncate">{t.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{t.clinic}</p>
                      {t.description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{t.description}</p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleFavorite(t.id); }}
                        className="p-1 rounded-full transition-colors"
                      >
                        <Heart className={cn('h-4 w-4 transition-colors', favorites.has(t.id) ? 'fill-destructive text-destructive' : 'text-muted-foreground')} />
                      </button>
                      {t.priceRange && (
                        <span className="text-xs text-primary font-medium whitespace-nowrap">{t.priceRange}</span>
                      )}
                    </div>
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

      {/* Detail Modal */}
      <Dialog open={!!selectedTreatment} onOpenChange={(open) => !open && setSelectedTreatment(null)}>
        <DialogContent className="max-w-[400px] rounded-2xl p-0 overflow-hidden">
          {selectedTreatment && (
            <>
              <div className="bg-primary/5 px-5 pt-5 pb-4">
                <DialogHeader>
                  <DialogTitle className="text-lg font-bold text-foreground text-left">{selectedTreatment.name}</DialogTitle>
                </DialogHeader>
                <div className="flex items-center gap-2 mt-2">
                  <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{selectedTreatment.clinic}</span>
                </div>
              </div>

              <div className="px-5 py-4 space-y-4">
                {/* Category & Price */}
                <div className="flex items-center justify-between">
                  <Badge variant="default" className="text-xs">
                    {CATEGORY_LABELS[selectedTreatment.category]}
                  </Badge>
                  {selectedTreatment.priceRange && (
                    <div className="flex items-center gap-1.5 text-primary font-semibold text-sm">
                      <Tag className="h-3.5 w-3.5" />
                      {selectedTreatment.priceRange}
                    </div>
                  )}
                </div>

                {/* Description */}
                {selectedTreatment.description && (
                  <div>
                    <p className="text-xs font-semibold text-foreground mb-1">설명</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">{selectedTreatment.description}</p>
                  </div>
                )}

                {/* Body Areas */}
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <MapPin className="h-3.5 w-3.5 text-primary" />
                    <p className="text-xs font-semibold text-foreground">시술 부위</p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedTreatment.bodyAreas.map(a => (
                      <Badge key={a} variant="outline" className="text-xs border-primary/30 text-primary">
                        {BODY_AREA_TREATMENT_LABELS[a]}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Effects */}
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                    <p className="text-xs font-semibold text-foreground">기대 효과</p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedTreatment.effects.map(e => (
                      <Badge key={e} variant="secondary" className="text-xs">
                        {EFFECT_LABELS[e]}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Register Button */}
                <Button
                  className="w-full mt-2 gap-2"
                  onClick={() => registerCycle(selectedTreatment)}
                >
                  <CalendarPlus className="h-4 w-4" />
                  시술 주기 등록
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Treatments;
