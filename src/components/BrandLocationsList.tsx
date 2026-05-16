import { useClinicLocations } from '@/hooks/useClinicLocations';
import { Check, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BrandLocationsListProps {
  brandId: string;
  isActiveLocation: (locationId: string) => boolean;
  onToggleLocation: (brandId: string, locationId: string) => void;
}

export default function BrandLocationsList({
  brandId,
  isActiveLocation,
  onToggleLocation,
}: BrandLocationsListProps) {
  const { locations, loading } = useClinicLocations(brandId);

  if (loading) {
    return (
      <div className="col-span-2 px-3 py-2 text-[10px] text-muted-foreground">
        지점 정보 불러오는 중...
      </div>
    );
  }

  if (locations.length === 0) {
    return (
      <div className="col-span-2 px-3 py-2 text-[10px] text-muted-foreground">
        등록된 지점이 없습니다
      </div>
    );
  }

  return (
    <div className="col-span-2 bg-muted/20 border border-border/40 rounded-xl p-2.5 space-y-1.5">
      <div className="flex items-center gap-1 px-1 mb-0.5">
        <MapPin className="h-3 w-3 text-muted-foreground" />
        <span className="text-[10px] font-semibold text-muted-foreground">
          지점 선택 ({locations.filter((l) => isActiveLocation(l.id)).length}/{locations.length})
        </span>
      </div>
      <div className="grid grid-cols-2 gap-1">
        {locations.map((loc) => {
          const active = isActiveLocation(loc.id);
          return (
            <button
              key={loc.id}
              onClick={(e) => {
                e.stopPropagation();
                onToggleLocation(brandId, loc.id);
              }}
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[11px] font-medium transition-all text-left',
                active
                  ? 'bg-primary/15 border-primary/40 text-primary'
                  : 'bg-background border-border/40 text-foreground',
              )}
            >
              <span className="truncate flex-1">{loc.branch_name}</span>
              {active && <Check className="h-3 w-3 shrink-0" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
