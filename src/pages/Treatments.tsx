import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { CLINIC_TREATMENTS, CATEGORY_LABELS, TreatmentCategory } from '@/data/treatmentCatalog';

const categoryKeys = Object.keys(CATEGORY_LABELS) as TreatmentCategory[];

const Treatments = () => {
  const [selectedCategory, setSelectedCategory] = useState<TreatmentCategory | null>(null);

  const filtered = selectedCategory
    ? CLINIC_TREATMENTS.filter(t => t.category === selectedCategory)
    : CLINIC_TREATMENTS;

  const grouped = filtered.reduce((acc, t) => {
    const key = CATEGORY_LABELS[t.category];
    if (!acc[key]) acc[key] = [];
    acc[key].push(t);
    return acc;
  }, {} as Record<string, typeof CLINIC_TREATMENTS>);

  return (
    <div className="page-container pb-24">
      <div className="pt-6 pb-4 px-1">
        <h1 className="text-xl font-bold text-foreground">시술 리스트</h1>
        <p className="text-sm text-muted-foreground mt-1">종류별로 시술을 확인하세요</p>
      </div>

      {/* Category filter chips */}
      <div className="flex flex-wrap gap-2 px-1 mb-4">
        <Badge
          variant={selectedCategory === null ? 'default' : 'outline'}
          className="cursor-pointer text-xs"
          onClick={() => setSelectedCategory(null)}
        >
          전체
        </Badge>
        {categoryKeys.map(cat => (
          <Badge
            key={cat}
            variant={selectedCategory === cat ? 'default' : 'outline'}
            className="cursor-pointer text-xs"
            onClick={() => setSelectedCategory(prev => prev === cat ? null : cat)}
          >
            {CATEGORY_LABELS[cat]}
          </Badge>
        ))}
      </div>

      {/* Grouped list */}
      <div className="space-y-5 px-1">
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
                    {t.effects.slice(0, 3).map(e => (
                      <Badge key={e} variant="secondary" className="text-[10px] px-1.5 py-0">
                        {e}
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
