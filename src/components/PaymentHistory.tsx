import { useState, useMemo } from 'react';
import { ArrowUpCircle, ArrowDownCircle, Users, Gift, Filter, X, Building2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { mockPoints, currentBalance } from '@/data/mockData';
import { PointTransaction } from '@/types/skin';

const typeConfig = {
  charge: { icon: ArrowUpCircle, label: '충전', color: 'text-sage-dark' },
  use: { icon: ArrowDownCircle, label: '사용', color: 'text-rose' },
  referral: { icon: Users, label: '소개', color: 'text-info' },
  bonus: { icon: Gift, label: '보너스', color: 'text-amber' },
};

type PriceRange = 'all' | 'under10' | '10to30' | '30to50' | 'over50';
type DateRange = 'all' | '1week' | '1month' | '3month';

const PRICE_LABELS: Record<PriceRange, string> = {
  all: '전체',
  under10: '10만원 미만',
  '10to30': '10~30만원',
  '30to50': '30~50만원',
  over50: '50만원 이상',
};

const DATE_LABELS: Record<DateRange, string> = {
  all: '전체',
  '1week': '최근 1주',
  '1month': '최근 1개월',
  '3month': '최근 3개월',
};

export default function PaymentHistory() {
  const [showFilters, setShowFilters] = useState(false);
  const [clinicFilter, setClinicFilter] = useState('all');
  const [priceFilter, setPriceFilter] = useState<PriceRange>('all');
  const [dateFilter, setDateFilter] = useState<DateRange>('all');

  const clinics = useMemo(() => {
    const set = new Set(mockPoints.map(p => p.clinic).filter(Boolean) as string[]);
    return Array.from(set);
  }, []);

  const activeFilterCount = [clinicFilter !== 'all', priceFilter !== 'all', dateFilter !== 'all'].filter(Boolean).length;

  const filtered = useMemo(() => {
    let result = [...mockPoints];

    if (clinicFilter !== 'all') {
      result = result.filter(t => t.clinic === clinicFilter);
    }

    if (priceFilter !== 'all') {
      result = result.filter(t => {
        const abs = Math.abs(t.amount);
        switch (priceFilter) {
          case 'under10': return abs < 100000;
          case '10to30': return abs >= 100000 && abs < 300000;
          case '30to50': return abs >= 300000 && abs < 500000;
          case 'over50': return abs >= 500000;
          default: return true;
        }
      });
    }

    if (dateFilter !== 'all') {
      const now = new Date('2026-03-09');
      let from: Date;
      switch (dateFilter) {
        case '1week': from = new Date(now.getTime() - 7 * 86400000); break;
        case '1month': from = new Date(now.getTime() - 30 * 86400000); break;
        case '3month': from = new Date(now.getTime() - 90 * 86400000); break;
        default: from = new Date(0);
      }
      result = result.filter(t => new Date(t.date) >= from);
    }

    return result.sort((a, b) => b.date.localeCompare(a.date));
  }, [clinicFilter, priceFilter, dateFilter]);

  const filteredTotal = useMemo(() => {
    return filtered.reduce((sum, t) => sum + t.amount, 0);
  }, [filtered]);

  const clearFilters = () => {
    setClinicFilter('all');
    setPriceFilter('all');
    setDateFilter('all');
  };

  return (
    <div className="space-y-3">
      {/* Balance summary */}
      <Card className="glass-card overflow-hidden">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">보유 포인트</p>
              <p className="text-2xl font-bold tracking-tight">{currentBalance.toLocaleString()}원</p>
            </div>
            <Button
              variant={showFilters ? 'default' : 'outline'}
              size="sm"
              className="rounded-full text-xs h-8 tap-target relative"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-3.5 w-3.5 mr-1" />
              필터
              {activeFilterCount > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      {showFilters && (
        <Card className="glass-card">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold">필터</p>
              {activeFilterCount > 0 && (
                <Button variant="ghost" size="sm" className="text-xs h-6 px-2 text-muted-foreground" onClick={clearFilters}>
                  <X className="h-3 w-3 mr-1" /> 초기화
                </Button>
              )}
            </div>

            <div className="space-y-2">
              <p className="text-[11px] text-muted-foreground">병원</p>
              <div className="flex flex-wrap gap-1.5">
                <Badge
                  variant={clinicFilter === 'all' ? 'default' : 'outline'}
                  className="cursor-pointer tap-target rounded-full px-3 py-1.5 text-xs"
                  onClick={() => setClinicFilter('all')}
                >
                  전체
                </Badge>
                {clinics.map(c => (
                  <Badge
                    key={c}
                    variant={clinicFilter === c ? 'default' : 'outline'}
                    className="cursor-pointer tap-target rounded-full px-3 py-1.5 text-xs"
                    onClick={() => setClinicFilter(c)}
                  >
                    {c}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-[11px] text-muted-foreground">가격대</p>
              <div className="flex flex-wrap gap-1.5">
                {(Object.keys(PRICE_LABELS) as PriceRange[]).map(k => (
                  <Badge
                    key={k}
                    variant={priceFilter === k ? 'default' : 'outline'}
                    className="cursor-pointer tap-target rounded-full px-3 py-1.5 text-xs"
                    onClick={() => setPriceFilter(k)}
                  >
                    {PRICE_LABELS[k]}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-[11px] text-muted-foreground">기간</p>
              <div className="flex flex-wrap gap-1.5">
                {(Object.keys(DATE_LABELS) as DateRange[]).map(k => (
                  <Badge
                    key={k}
                    variant={dateFilter === k ? 'default' : 'outline'}
                    className="cursor-pointer tap-target rounded-full px-3 py-1.5 text-xs"
                    onClick={() => setDateFilter(k)}
                  >
                    {DATE_LABELS[k]}
                  </Badge>
                ))}
              </div>
            </div>

            {activeFilterCount > 0 && (
              <p className="text-[11px] text-muted-foreground text-right">
                {filtered.length}건 · 합계 <span className="font-semibold">{filteredTotal.toLocaleString()}원</span>
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Transaction list */}
      <div className="space-y-2">
        {filtered.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">조건에 맞는 내역이 없습니다</p>
        )}
        {filtered.map((tx) => {
          const config = typeConfig[tx.type];
          const Icon = config.icon;
          return (
            <Card key={tx.id} className="glass-card">
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted">
                  <Icon className={`h-4 w-4 ${config.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{tx.description}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {tx.date} · {config.label}
                    {tx.clinic && <span> · {tx.clinic}</span>}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className={`font-bold text-sm ${tx.amount > 0 ? 'text-sage-dark' : 'text-rose'}`}>
                    {tx.amount > 0 ? '+' : ''}{tx.amount.toLocaleString()}원
                  </p>
                  <p className="text-[10px] text-muted-foreground">잔액 {tx.balance.toLocaleString()}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
