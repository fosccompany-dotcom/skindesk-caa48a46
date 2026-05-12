import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppHeader from '@/components/AppHeader';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Heart,
  Sparkles,
  Calendar,
  Building2,
  Settings as SettingsIcon,
  ExternalLink,
  ArrowDownNarrowWide,
  Filter,
  Tag,
} from 'lucide-react';
import { useFavoriteClinics } from '@/hooks/useFavoriteClinics';
import { useUserClinicEvents, type ClinicEventRow } from '@/hooks/useClinicEvents';
import { cn } from '@/lib/utils';

type SortKey = 'discount' | 'price_asc' | 'expiring' | 'newest';

const formatPrice = (krw: number | null | undefined): string => {
  if (krw === null || krw === undefined) return '';
  return krw.toLocaleString('ko-KR') + '원';
};

const formatDateMonthDay = (iso: string | null | undefined): string | null => {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  return `${d.getMonth() + 1}.${d.getDate()}`;
};

const Treatments = () => {
  const navigate = useNavigate();
  const { favorites: favBrands, favoriteBrandIds, loading: favLoading } = useFavoriteClinics();
  const { events, loading: eventsLoading } = useUserClinicEvents(favoriteBrandIds);

  const [sortKey, setSortKey] = useState<SortKey>('discount');
  const [selectedBrandId, setSelectedBrandId] = useState<string | null>(null);

  const monthLabel = useMemo(() => `${new Date().getMonth() + 1}월`, []);

  // 정렬·필터링
  const filteredEvents = useMemo(() => {
    let arr = [...events];
    if (selectedBrandId) arr = arr.filter((e) => e.brand_id === selectedBrandId);

    arr.sort((a, b) => {
      switch (sortKey) {
        case 'discount':
          return (b.discount_pct ?? 0) - (a.discount_pct ?? 0);
        case 'price_asc':
          return (a.discount_amount ?? Number.MAX_SAFE_INTEGER) - (b.discount_amount ?? Number.MAX_SAFE_INTEGER);
        case 'expiring': {
          const ad = a.end_date ?? '9999-12-31';
          const bd = b.end_date ?? '9999-12-31';
          return ad.localeCompare(bd);
        }
        case 'newest':
        default:
          return (b.created_at ?? '').localeCompare(a.created_at ?? '');
      }
    });
    return arr;
  }, [events, selectedBrandId, sortKey]);

  // brand별 그룹핑
  const groupedByBrand = useMemo(() => {
    const map = new Map<
      string,
      { brand_id: string; brand_name: string; events: ClinicEventRow[] }
    >();
    for (const ev of filteredEvents) {
      const key = ev.brand_id ?? '';
      const name = ev.brand?.name ?? '기타';
      if (!map.has(key)) map.set(key, { brand_id: key, brand_name: name, events: [] });
      map.get(key)!.events.push(ev);
    }
    return Array.from(map.values());
  }, [filteredEvents]);

  return (
    <div className="min-h-screen bg-background pb-24">
      <AppHeader title="시술 이벤트" />

      <div className="px-4 pt-3">
        {/* 헤더 */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div>
            <h1 className="text-lg font-bold flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              {monthLabel} 즐겨찾기 클리닉 이벤트
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              마이페이지에서 즐겨찾기한 클리닉의 이벤트를 모아봤어요
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl text-xs gap-1 shrink-0"
            onClick={() => navigate('/profile#fav-clinics')}
          >
            <SettingsIcon className="h-3.5 w-3.5" />
            클리닉
          </Button>
        </div>

        {/* 로딩 */}
        {(favLoading || eventsLoading) && (
          <div className="text-center py-12 text-muted-foreground text-xs">
            불러오는 중...
          </div>
        )}

        {/* 즐겨찾기 없을 때 */}
        {!favLoading && favBrands.length === 0 && (
          <div className="glass-card rounded-2xl p-6 text-center space-y-3">
            <Heart className="h-8 w-8 text-muted-foreground mx-auto" />
            <p className="text-sm text-foreground font-medium">
              마이페이지에서 자주가는 클리닉을 즐겨찾기 해보세요!
            </p>
            <p className="text-xs text-muted-foreground">
              마이페이지에서 자주 가는 클리닉을 선택하면<br />
              이벤트를 한눈에 비교할 수 있어요
            </p>
            <Button
              size="sm"
              className="rounded-xl text-xs"
              onClick={() => navigate('/profile#fav-clinics')}
            >
              지금 클리닉 선택하기
            </Button>
          </div>
        )}

        {/* 즐겨찾기 있는데 이벤트 없을 때 */}
        {!favLoading && favBrands.length > 0 && !eventsLoading && events.length === 0 && (
          <div className="glass-card rounded-2xl p-6 text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              선택한 클리닉의 진행 중인 이벤트가 아직 없어요
            </p>
            <p className="text-[10px] text-muted-foreground">
              새 이벤트가 등록되면 자동으로 표시됩니다
            </p>
          </div>
        )}

        {/* 이벤트 리스트 */}
        {!favLoading && favBrands.length > 0 && !eventsLoading && events.length > 0 && (
          <>
            {/* 필터·정렬 */}
            <div className="space-y-2 mb-3">
              {/* 클리닉 칩 필터 */}
              <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
                <button
                  onClick={() => setSelectedBrandId(null)}
                  className={cn(
                    'shrink-0 text-[11px] px-3 py-1.5 rounded-full border transition-all',
                    selectedBrandId === null
                      ? 'bg-foreground text-background border-foreground'
                      : 'bg-background text-muted-foreground border-border',
                  )}
                >
                  전체 ({events.length})
                </button>
                {favBrands.map((fb) => {
                  const count = events.filter((e) => e.brand_id === fb.brand_id).length;
                  if (count === 0) return null;
                  return (
                    <button
                      key={fb.brand_id}
                      onClick={() =>
                        setSelectedBrandId(selectedBrandId === fb.brand_id ? null : fb.brand_id)
                      }
                      className={cn(
                        'shrink-0 text-[11px] px-3 py-1.5 rounded-full border transition-all',
                        selectedBrandId === fb.brand_id
                          ? 'bg-foreground text-background border-foreground'
                          : 'bg-background text-muted-foreground border-border',
                      )}
                    >
                      {fb.brand?.name ?? '?'} ({count})
                    </button>
                  );
                })}
              </div>

              {/* 정렬 */}
              <div className="flex items-center gap-1.5">
                <ArrowDownNarrowWide className="w-3 h-3 text-muted-foreground" />
                <span className="text-[10px] text-muted-foreground">정렬:</span>
                {(
                  [
                    { key: 'discount' as SortKey, label: '할인율순' },
                    { key: 'expiring' as SortKey, label: '만료임박' },
                    { key: 'price_asc' as SortKey, label: '저가순' },
                    { key: 'newest' as SortKey, label: '최신순' },
                  ]
                ).map((s) => (
                  <button
                    key={s.key}
                    onClick={() => setSortKey(s.key)}
                    className={cn(
                      'text-[10px] px-2 py-0.5 rounded-full border transition-colors',
                      sortKey === s.key
                        ? 'bg-primary/10 border-primary/40 text-primary'
                        : 'bg-background text-muted-foreground border-border',
                    )}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 그룹 카드 */}
            <div className="space-y-3 pb-6">
              {groupedByBrand.map((g) => (
                <div key={g.brand_id} className="glass-card rounded-2xl overflow-hidden">
                  <div className="flex items-center justify-between px-3.5 py-2.5 bg-primary/5 border-b border-border/30">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-primary" />
                      <span className="text-sm font-semibold text-foreground">
                        {g.brand_name}
                      </span>
                    </div>
                    <Badge variant="outline" className="text-[10px]">
                      {g.events.length}건
                    </Badge>
                  </div>
                  <div className="divide-y divide-border/30">
                    {g.events.map((ev) => {
                      const start = formatDateMonthDay(ev.start_date);
                      const end = formatDateMonthDay(ev.end_date);
                      return (
                        <div key={ev.id} className="px-3.5 py-3">
                          <div className="flex items-start gap-3">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 flex-wrap mb-1">
                                {ev.discount_pct && ev.discount_pct >= 30 && (
                                  <Badge
                                    variant="destructive"
                                    className="text-[9px] px-1.5 py-0 h-4"
                                  >
                                    HOT
                                  </Badge>
                                )}
                                {ev.location && (
                                  <Badge
                                    variant="outline"
                                    className="text-[10px] px-1.5 py-0 h-4"
                                  >
                                    {ev.location.branch_name}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm font-medium text-foreground line-clamp-2">
                                {ev.title}
                              </p>
                              {ev.description && (
                                <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                                  {ev.description}
                                </p>
                              )}
                              {(start || end) && (
                                <div className="flex items-center gap-1 mt-1.5 text-[10px] text-muted-foreground">
                                  <Calendar className="h-3 w-3" />
                                  {start && end ? `${start} ~ ${end}` : end ? `${end}까지` : start ? `${start}부터` : ''}
                                </div>
                              )}
                            </div>
                            <div className="flex flex-col items-end shrink-0 min-w-[60px]">
                              {ev.discount_pct && (
                                <Badge
                                  variant="destructive"
                                  className="text-[10px] px-1.5 py-0 h-4 mb-1"
                                >
                                  -{Math.round(ev.discount_pct)}%
                                </Badge>
                              )}
                              {ev.discount_amount && (
                                <span className="text-sm text-primary font-bold whitespace-nowrap">
                                  {formatPrice(ev.discount_amount)}
                                </span>
                              )}
                              {ev.source_url && (
                                <a
                                  href={ev.source_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="mt-1 text-[10px] text-muted-foreground hover:text-foreground inline-flex items-center gap-0.5"
                                >
                                  자세히 <ExternalLink className="w-2.5 h-2.5" />
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* 다른 병원 추가 */}
            <button
              onClick={() => navigate('/profile#fav-clinics')}
              className="w-full glass-card rounded-2xl px-4 py-3 flex items-center justify-between text-left active:scale-[0.99] transition-transform"
            >
              <div>
                <p className="text-sm font-medium text-foreground">다른 클리닉 추가하기</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  25개 클리닉 중 더 즐겨찾기 할 수 있어요
                </p>
              </div>
              <Tag className="h-4 w-4 text-muted-foreground" />
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default Treatments;
