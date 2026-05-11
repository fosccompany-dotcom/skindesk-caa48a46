import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import AppHeader from '@/components/AppHeader';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  ChevronDown, 
  ChevronUp, 
  Heart, 
  ChevronRight,
  Target
} from 'lucide-react';
import { 
  CLINIC_TREATMENTS, 
  CATEGORY_LABELS, 
  EFFECT_LABELS, 
  BODY_AREA_TREATMENT_LABELS 
} from '@/data/treatmentCatalog';
import { CLINIC_PRESETS } from '@/constants/clinicPresets';
import { cn } from '@/lib/utils';
import { useTreatmentFavorites } from '@/hooks/useTreatmentFavorites';

const FilterRow = ({ label, children, section }: { label: string; children: React.ReactNode; section: string }) => (
  <div className="space-y-2.5">
    <div className="flex items-center justify-between">
      <p className="text-[11px] font-bold text-muted-foreground/80 flex items-center gap-1.5 uppercase tracking-wider">
        <Target className="h-3 w-3" />
        {label}
      </p>
    </div>
    <div className="flex flex-wrap gap-1.5">
      {children}
    </div>
  </div>
);

const Treatments = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClinic, setSelectedClinic] = useState<string | null>(null);
  const [selectedBranches, setSelectedBranches] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
  const [selectedEffects, setSelectedEffects] = useState<string[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['보톡스', '필러']));
  

  const { favorites, toggleFavorite } = useTreatmentFavorites();

  const availableBranches = useMemo(() => {
    if (!selectedClinic) return [];
    const clinic = CLINIC_PRESETS.find(c => c.label === selectedClinic);
    return clinic?.branches || [];
  }, [selectedClinic]);

  const filteredTreatments = useMemo(() => {
    return CLINIC_TREATMENTS.filter(t => {
      if (searchQuery && !t.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (selectedClinic && t.clinic !== selectedClinic) return false;
      if (selectedBranches.length > 0 && !t.branches?.some(b => selectedBranches.includes(b))) return false;
      if (selectedCategories.length > 0 && !selectedCategories.includes(t.category)) return false;
      if (selectedAreas.length > 0 && !t.bodyAreas?.some(a => selectedAreas.includes(a))) return false;
      if (selectedEffects.length > 0 && !t.effects?.some(e => selectedEffects.includes(e))) return false;
      return true;
    });
  }, [searchQuery, selectedClinic, selectedBranches, selectedCategories, selectedAreas, selectedEffects]);

  const grouped = useMemo(() => {
    const res: Record<string, typeof CLINIC_TREATMENTS> = {};
    filteredTreatments.forEach(t => {
      const label = CATEGORY_LABELS[t.category as keyof typeof CATEGORY_LABELS] || t.category;
      if (!res[label]) res[label] = [];
      res[label].push(t);
    });
    return res;
  }, [filteredTreatments]);

  const toggle = (list: string[], item: string) => 
    list.includes(item) ? list.filter(i => i !== item) : [...list, item];

  const categoryKeys = Object.keys(CATEGORY_LABELS);
  const bodyAreaKeys = Object.keys(BODY_AREA_TREATMENT_LABELS);
  const effectKeys = Object.keys(EFFECT_LABELS);

  return (
    <div className="min-h-screen bg-background pb-24">
      <AppHeader title="시술 정보" />
      
      <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-md px-4 py-3 space-y-3 border-b border-border/40">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="시술명, 고민 부위 검색..." 
            className="pl-9 bg-muted/50 border-none rounded-xl h-11 text-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="page-content pt-4 space-y-6 px-4">

      {/* 이달의 이벤트 진입 배너 */}
      <button
        onClick={() => navigate('/treatments/events')}
        className="w-full mb-2.5 flex items-center gap-3 px-4 py-3 rounded-2xl bg-gradient-to-r from-rose-50 to-amber-50 border border-rose-200/50 active:scale-[0.98] transition-all"
      >
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-rose-500/10 shrink-0">
          <Heart className="h-5 w-5 text-rose-500" />
        </div>
        <div className="flex-1 text-left">
          <p className="text-sm font-bold text-foreground">내 즐겨찾기 클리닉 이벤트 리스트</p>
          <p className="text-xs text-muted-foreground mt-0.5">내 즐겨찾기 클리닉의 이번 달 혜택을 한눈에</p>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
      </button>


      <div className="space-y-6">
        <FilterRow label="클리닉/지점" section="clinic">
          <Badge
            variant={selectedClinic === '밴스의원' ? 'default' : 'outline'}
            className="cursor-pointer text-[11px]"
            onClick={() => { setSelectedClinic(prev => prev === '밴스의원' ? null : '밴스의원'); setSelectedBranches([]); }}
          >밴스의원</Badge>
          <Badge
            variant={selectedClinic === '쁨클리닉' ? 'default' : 'outline'}
            className="cursor-pointer text-[11px]"
            onClick={() => { setSelectedClinic(prev => prev === '쁨클리닉' ? null : '쁨클리닉'); setSelectedBranches([]); }}
          >쁨클리닉</Badge>
          {selectedClinic && availableBranches.length > 0 && (
            <>
              <div className="w-full border-t border-border/20 my-1" />
              {availableBranches.map(b => (
                <Badge
                  key={b}
                  variant={selectedBranches.includes(b) ? 'default' : 'outline'}
                  className="cursor-pointer text-[10px]"
                  onClick={() => setSelectedBranches(prev => toggle(prev, b))}
                >
                  {b}
                </Badge>
              ))}
            </>
          )}
        </FilterRow>

        <FilterRow label="시술 종류" section="category">
          {categoryKeys.map(cat => (
            <Badge
              key={cat}
              variant={selectedCategories.includes(cat) ? 'default' : 'outline'}
              className="cursor-pointer text-[11px]"
              onClick={() => setSelectedCategories(prev => toggle(prev, cat))}
            >
              {CATEGORY_LABELS[cat as keyof typeof CATEGORY_LABELS]}
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
              {BODY_AREA_TREATMENT_LABELS[a as keyof typeof BODY_AREA_TREATMENT_LABELS]}
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
              {EFFECT_LABELS[e as keyof typeof EFFECT_LABELS]}
            </Badge>
          ))}
        </FilterRow>
      </div>

      {/* Results */}
      <div className="space-y-5 px-1 pt-4">
        {Object.keys(grouped).length === 0 && (
          <div className="text-center py-12 text-muted-foreground text-sm">
            조건에 맞는 시술이 없습니다
          </div>
        )}
        {Object.entries(grouped).map(([category, treatments]) => {
          const isOpen = expandedCategories.has(category);
          return (
            <div key={category} className="glass-card rounded-xl overflow-hidden shadow-sm">
              <button
                onClick={() => setExpandedCategories(prev => {
                  const next = new Set(prev);
                  if (next.has(category)) next.delete(category); else next.add(category);
                  return next;
                })}
                className="w-full flex items-center justify-between px-3 py-3 hover:bg-muted/50 transition-colors"
              >
                <h2 className="text-sm font-semibold text-foreground">{category} ({treatments.length})</h2>
                {isOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
              </button>
              {isOpen && (
                <div className="space-y-2 px-3 pb-3">
                  {treatments.map(t => (
                    <div key={t.id} className="bg-background/50 border border-border/30 p-3 rounded-xl cursor-pointer active:scale-[0.98] transition-transform">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-foreground truncate">{t.name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{t.clinic}</p>
                          {t.description && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{t.description}</p>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-1.5 shrink-0">
                          <button
                            onClick={(e) => { e.stopPropagation(); toggleFavorite(t.id); }}
                            className="p-1 hover:bg-muted rounded-full transition-colors"
                          >
                            <Heart className={cn("h-4 w-4", favorites.includes(t.id) ? "text-rose-500 fill-rose-500" : "text-muted-foreground")} />
                          </button>
                          <div className="text-right">
                            <p className="text-sm font-bold text-primary">{t.priceRange}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
    </div>
  );
};

export default Treatments;
