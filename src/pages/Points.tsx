import { useState, useEffect, useCallback } from 'react';
import { Plus, ArrowUpCircle, ArrowDownCircle, Users, Gift, TrendingDown, ChevronDown, Building2, CreditCard, Banknote, Coins } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import AddPaymentModal from '@/components/AddPaymentModal';

// ── 타입 정의 ──────────────────────────────────────────────────────────
type PaymentMethod = '포인트충전' | '시술결제' | '카드' | '현금' | '서비스';
type ClinicType    = '밴스' | '타의원';
type PointType     = 'charge' | 'use' | 'referral' | 'bonus';

interface PointTransaction {
  id: string; date: string; type: PointType;
  amount: number; description: string; balance: number; clinic?: string;
}
interface PaymentRecord {
  id: string; date: string; clinic: string; clinic_type: ClinicType;
  treatment_name: string; amount: number; method: PaymentMethod; memo?: string;
}
interface ClinicBalance { clinic: string; balance: number; }

// ── 스타일 설정 ────────────────────────────────────────────────────────
const pointTypeConfig: Record<PointType, { icon: React.ElementType; label: string; color: string }> = {
  charge:   { icon: ArrowUpCircle,   label: '충전',   color: 'text-emerald-500' },
  use:      { icon: ArrowDownCircle, label: '사용',   color: 'text-rose-400' },
  referral: { icon: Users,           label: '소개',   color: 'text-blue-400' },
  bonus:    { icon: Gift,            label: '보너스', color: 'text-amber-400' },
};
const methodStyle: Record<PaymentMethod, { bg: string; text: string; label: string }> = {
  '포인트충전': { bg: 'bg-amber-50',  text: 'text-amber-600',  label: '포인트충전' },
  '시술결제':   { bg: 'bg-blue-50',   text: 'text-blue-600',   label: '시술결제' },
  '카드':       { bg: 'bg-sky-50',    text: 'text-sky-600',    label: '카드' },
  '현금':       { bg: 'bg-green-50',  text: 'text-green-600',  label: '현금' },
  '서비스':     { bg: 'bg-gray-100',  text: 'text-gray-500',   label: '서비스' },
};
const clinicTypeStyle: Record<ClinicType, { bg: string; text: string }> = {
  '밴스':   { bg: 'bg-[#C9A96E]/10', text: 'text-[#C9A96E]' },
  '타의원': { bg: 'bg-purple-50',    text: 'text-purple-500' },
};

// ── 메인 ──────────────────────────────────────────────────────────────
const Points = () => {
  const [tab, setTab]               = useState<'payments' | 'points'>('payments');
  const [filterType, setFilterType] = useState<ClinicType | '전체'>('전체');
  const [showStats, setShowStats]   = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  const [payments, setPayments]     = useState<PaymentRecord[]>([]);
  const [points, setPoints]         = useState<PointTransaction[]>([]);
  const [balances, setBalances]     = useState<ClinicBalance[]>([]);
  const [loading, setLoading]       = useState(true);

  const loadData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setLoading(true);
    const [pRes, ptRes, bRes] = await Promise.all([
      supabase.from('payment_records').select('*').eq('user_id', user.id).order('date', { ascending: false }),
      supabase.from('point_transactions').select('*').eq('user_id', user.id).order('date', { ascending: false }),
      supabase.from('clinic_balances').select('clinic, balance').eq('user_id', user.id),
    ]);
    if (pRes.data)  setPayments(pRes.data.map(r => ({ ...r, method: (r.method || '카드') as PaymentMethod, clinic_type: (r.clinic_type || '타의원') as ClinicType })));
    if (ptRes.data) setPoints(ptRes.data.map(r => ({ ...r, type: (r.type || 'use') as PointType })));
    if (bRes.data)  setBalances(bRes.data as ClinicBalance[]);
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // ── 통계 계산 ────────────────────────────────────────────────────────
  const vanceTotal  = payments.filter(p => p.clinic_type === '밴스').reduce((s, p) => s + p.amount, 0);
  const otherTotal  = payments.filter(p => p.clinic_type === '타의원' && p.amount > 0).reduce((s, p) => s + p.amount, 0);
  const totalSpent  = vanceTotal + otherTotal;

  const clinicStats = payments.reduce((acc, p) => {
    if (p.amount > 0) acc[p.clinic] = (acc[p.clinic] || 0) + p.amount;
    return acc;
  }, {} as Record<string, number>);

  const clinicList = Object.entries(clinicStats)
    .sort((a, b) => b[1] - a[1])
    .map(([name, amount]) => ({
      name, amount,
      pct: totalSpent > 0 ? Math.round((amount / totalSpent) * 100) : 0,
      isVance: name.includes('밴스'),
    }));

  const filtered = filterType === '전체' ? payments : payments.filter(p => p.clinic_type === filterType);

  return (
    <div className="min-h-screen bg-background">

      {/* ── 헤더 ── */}
      <div className="gradient-sage safe-top">
        <div className="page-header-gradient pt-4">
          <h1 className="text-lg font-bold">결제 · 포인트</h1>
          <div className="flex items-end gap-6 mt-3">
            <div>
              <p className="text-3xl font-bold tracking-tight">
                {loading ? '—' : balances.reduce((s, b) => s + b.balance, 0).toLocaleString()}원
              </p>
              <p className="text-xs opacity-60 font-light mt-0.5">전체 잔액 합계</p>
            </div>
            <div className="pb-0.5">
              <p className="text-lg font-semibold opacity-90">{totalSpent.toLocaleString()}원</p>
              <p className="text-xs opacity-60 font-light">누적 지출</p>
            </div>
          </div>
          {/* 병원별 잔액 */}
          {balances.length > 0 && (
            <div className="flex gap-2 flex-wrap mt-3 pb-1">
              {balances.map(b => (
                <div key={b.clinic} className="flex-1 min-w-[130px] rounded-xl bg-white/10 border border-white/20 px-3 py-2">
                  <p className="text-[10px] opacity-50 mb-0.5">{b.clinic}</p>
                  <p className="text-sm font-semibold text-[#C9A96E]">₩{b.balance.toLocaleString()}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── 탭 ── */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4">
        <div className="flex">
          {([
            { key: 'payments', label: '결제 내역' },
            { key: 'points',   label: '포인트 내역' },
          ] as const).map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${
                tab === t.key ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-400'}`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="page-content pt-4 space-y-3 pb-28">

        {/* ── 결제 내역 탭 ── */}
        {tab === 'payments' && (
          <>
            {/* 지출 분석 */}
            <button onClick={() => setShowStats(s => !s)}
              className="w-full flex items-center justify-between px-4 py-2 text-sm font-medium text-gray-600">
              <span className="flex items-center gap-1.5"><TrendingDown className="w-4 h-4" /> 지출 분석</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${showStats ? 'rotate-180' : ''}`} />
            </button>

            {showStats && (
              <Card className="glass-card">
                <CardContent className="p-4 space-y-3">
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: '총 지출', value: `${(totalSpent / 10000).toFixed(0)}만원`, icon: CreditCard },
                      { label: '밴스 충전', value: `${(vanceTotal / 10000).toFixed(0)}만원`, icon: Coins },
                      { label: '타의원', value: `${(otherTotal / 10000).toFixed(0)}만원`, icon: Banknote },
                    ].map(({ label, value }) => (
                      <div key={label} className="bg-gray-50 rounded-xl p-2.5 text-center">
                        <p className="text-xs text-gray-400 mb-0.5">{label}</p>
                        <p className="text-sm font-bold text-gray-800">{value}</p>
                      </div>
                    ))}
                  </div>
                  {clinicList.length > 0 && (
                    <div>
                      <p className="text-xs text-gray-400 mb-2 flex items-center gap-1">
                        <Building2 className="w-3 h-3" /> 병원별 지출
                      </p>
                      {clinicList.map(({ name, amount, pct, isVance }) => (
                        <div key={name} className="mb-2">
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-gray-600 font-medium flex items-center gap-1">
                              {name}
                              <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${isVance ? 'bg-amber-100 text-amber-600' : 'bg-purple-100 text-purple-500'}`}>
                                {isVance ? '밴스' : '타의원'}
                              </span>
                            </span>
                            <span className="text-gray-800 font-semibold">{amount.toLocaleString()}원</span>
                          </div>
                          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full transition-all ${isVance ? 'bg-amber-400' : 'bg-purple-400'}`} style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* 필터 */}
            <div className="flex gap-2 pb-1">
              {(['전체', '밴스', '타의원'] as const).map(f => (
                <button key={f} onClick={() => setFilterType(f)}
                  className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                    filterType === f ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-500 border-gray-200'}`}>
                  {f}
                </button>
              ))}
            </div>

            {/* 결제 목록 */}
            {loading ? (
              <p className="text-center text-sm text-gray-400 py-8">불러오는 중...</p>
            ) : filtered.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <CreditCard className="w-8 h-8 mx-auto mb-3 opacity-30" />
                <p className="text-sm">결제 내역이 없습니다</p>
                <p className="text-xs mt-1 opacity-60">아래 + 버튼으로 추가하세요</p>
              </div>
            ) : (
              filtered.map(p => {
                const ms = methodStyle[p.method] || methodStyle['카드'];
                const cs = clinicTypeStyle[p.clinic_type] || clinicTypeStyle['타의원'];
                return (
                  <Card key={p.id} className="glass-card">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                            <p className="text-sm font-semibold truncate">{p.treatment_name}</p>
                            <span className={`shrink-0 text-[10px] px-1.5 py-0.5 rounded-full font-medium ${ms.bg} ${ms.text}`}>{ms.label}</span>
                            <span className={`shrink-0 text-[10px] px-1.5 py-0.5 rounded-full font-medium ${cs.bg} ${cs.text}`}>{p.clinic_type}</span>
                          </div>
                          <p className="text-xs text-gray-400">{p.date.replace(/-/g, '.')} · {p.clinic}</p>
                          {p.memo && <p className="text-[11px] text-gray-400 mt-0.5">{p.memo}</p>}
                        </div>
                        <div className="text-right shrink-0">
                          {p.amount > 0
                            ? <p className={`font-bold text-sm ${p.method === '포인트충전' ? 'text-emerald-600' : 'text-gray-900'}`}>
                                {p.method === '포인트충전' ? '+' : ''}{p.amount.toLocaleString()}원
                              </p>
                            : <p className="font-bold text-sm text-gray-400">서비스</p>
                          }
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </>
        )}

        {/* ── 포인트 내역 탭 ── */}
        {tab === 'points' && (
          <>
            <Card className="glass-card">
              <CardContent className="p-4">
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="bg-emerald-50 rounded-xl p-3 text-center">
                    <p className="text-xs text-emerald-600 mb-1">총 적립</p>
                    <p className="text-base font-bold text-emerald-700">
                      {points.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0).toLocaleString()}원
                    </p>
                  </div>
                  <div className="bg-rose-50 rounded-xl p-3 text-center">
                    <p className="text-xs text-rose-500 mb-1">총 사용</p>
                    <p className="text-base font-bold text-rose-600">
                      {Math.abs(points.filter(t => t.amount < 0).reduce((s, t) => s + t.amount, 0)).toLocaleString()}원
                    </p>
                  </div>
                </div>

                {loading ? (
                  <p className="text-center text-sm text-gray-400 py-4">불러오는 중...</p>
                ) : points.length === 0 ? (
                  <p className="text-center text-xs text-gray-400 py-4">포인트 내역이 없습니다</p>
                ) : (
                  points.map(tx => {
                    const config = pointTypeConfig[tx.type] || pointTypeConfig['use'];
                    const Icon = config.icon;
                    return (
                      <div key={tx.id} className="flex items-center gap-3 py-2.5 border-t border-gray-50 first:border-0">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-muted">
                          <Icon className={`h-3.5 w-3.5 ${config.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate">{tx.description}</p>
                          <p className="text-[10px] text-muted-foreground">{tx.date} · {config.label}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className={`font-bold text-xs ${tx.amount > 0 ? 'text-emerald-500' : 'text-rose-400'}`}>
                            {tx.amount > 0 ? '+' : ''}{tx.amount.toLocaleString()}
                          </p>
                          <p className="text-[10px] text-muted-foreground">잔액 {tx.balance.toLocaleString()}</p>
                        </div>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* ── FAB: 결제내역 추가 ── */}
      {tab === 'payments' && (
        <button onClick={() => setShowAddModal(true)}
          className="fixed bottom-24 right-5 z-20 w-14 h-14 rounded-full bg-[#C9A96E] shadow-lg flex items-center justify-center active:scale-95 transition-transform">
          <Plus size={24} className="text-black" />
        </button>
      )}

      {/* 모달 */}
      {showAddModal && (
        <AddPaymentModal
          onClose={() => setShowAddModal(false)}
          onSaved={loadData}
        />
      )}
    </div>
  );
};

export default Points;
