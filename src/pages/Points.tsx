import { useState } from 'react';
import { ArrowUpCircle, ArrowDownCircle, Users, Gift, CreditCard, TrendingDown, Plus, ChevronDown, Building2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { mockPoints, currentBalance, clinicBalances } from '@/data/mockData';

// ── 타입 ──────────────────────────────────────────────────
type PointType = 'charge' | 'use' | 'referral' | 'bonus';
type PaymentMethod = '카드' | '현금' | '포인트' | '혼합';

interface PaymentRecord {
  id: string;
  date: string;
  clinic: string;
  treatmentName: string;
  amount: number;
  method: PaymentMethod;
  pointsUsed?: number;
  memo?: string;
}

// ── Mock 결제 데이터 (실제로는 mockData.ts로 이동) ────────
const mockPayments: PaymentRecord[] = [
  { id: 'p1', date: '2026.03.08', clinic: '글로우 피부과', treatmentName: '알렉산드라이트 제모 (팔)', amount: 150000, method: '카드', pointsUsed: 10000 },
  { id: 'p2', date: '2026.03.08', clinic: '글로우 피부과', treatmentName: '알렉산드라이트 제모 (다리)', amount: 200000, method: '카드' },
  { id: 'p3', date: '2026.03.03', clinic: '글로우 피부과', treatmentName: '레이저 토닝', amount: 80000, method: '포인트', pointsUsed: 80000 },
  { id: 'p4', date: '2026.03.01', clinic: '에스테틱 피부과', treatmentName: '바디 타이트닝', amount: 320000, method: '혼합', pointsUsed: 50000 },
  { id: 'p5', date: '2026.02.28', clinic: '글로우 피부과', treatmentName: '등 여드름 필링', amount: 60000, method: '카드' },
  { id: 'p6', date: '2026.02.25', clinic: '글로우 피부과', treatmentName: '프리미엄 리프팅', amount: 450000, method: '카드', pointsUsed: 30000 },
  { id: 'p7', date: '2026.02.18', clinic: '글로우 피부과', treatmentName: '아쿠아필링', amount: 90000, method: '현금' },
];

// ── 설정 ──────────────────────────────────────────────────
const typeConfig: Record<PointType, { icon: React.ElementType; label: string; color: string }> = {
  charge: { icon: ArrowUpCircle, label: '충전', color: 'text-emerald-500' },
  use:    { icon: ArrowDownCircle, label: '사용', color: 'text-rose-400' },
  referral: { icon: Users, label: '소개', color: 'text-blue-400' },
  bonus:  { icon: Gift, label: '보너스', color: 'text-amber-400' },
};

const methodColors: Record<PaymentMethod, string> = {
  '카드': 'bg-blue-50 text-blue-600',
  '현금': 'bg-green-50 text-green-600',
  '포인트': 'bg-amber-50 text-amber-600',
  '혼합': 'bg-purple-50 text-purple-600',
};

// ── 통계 계산 ─────────────────────────────────────────────
const totalSpent = mockPayments.reduce((sum, p) => sum + p.amount, 0);
const totalPointsUsed = mockPayments.reduce((sum, p) => sum + (p.pointsUsed || 0), 0);

const clinicStats = mockPayments.reduce((acc, p) => {
  acc[p.clinic] = (acc[p.clinic] || 0) + p.amount;
  return acc;
}, {} as Record<string, number>);

const clinicList = Object.entries(clinicStats)
  .sort((a, b) => b[1] - a[1])
  .map(([name, amount]) => ({ name, amount, pct: Math.round((amount / totalSpent) * 100) }));

// ── 등록 모달 ─────────────────────────────────────────────
const AddPaymentModal = ({ onClose }: { onClose: () => void }) => {
  const [form, setForm] = useState({ clinic: '', treatment: '', amount: '', method: '카드' as PaymentMethod, points: '', memo: '' });

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={onClose}>
      <div className="w-full max-w-md bg-white rounded-t-2xl p-5 pb-8 space-y-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-base">결제 내역 등록</h2>
          <button onClick={onClose} className="text-gray-400 text-xl leading-none">✕</button>
        </div>

        {[
          { label: '병원명', key: 'clinic', placeholder: '글로우 피부과' },
          { label: '시술명', key: 'treatment', placeholder: '레이저 토닝' },
          { label: '결제 금액 (원)', key: 'amount', placeholder: '80000', type: 'number' },
          { label: '포인트 사용 (원)', key: 'points', placeholder: '0', type: 'number' },
          { label: '메모', key: 'memo', placeholder: '특이사항 입력' },
        ].map(({ label, key, placeholder, type }) => (
          <div key={key}>
            <label className="text-xs text-gray-500 mb-1 block">{label}</label>
            <input
              type={type || 'text'}
              placeholder={placeholder}
              value={(form as any)[key]}
              onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
            />
          </div>
        ))}

        <div>
          <label className="text-xs text-gray-500 mb-1 block">결제 수단</label>
          <div className="flex gap-2">
            {(['카드', '현금', '포인트', '혼합'] as PaymentMethod[]).map(m => (
              <button
                key={m}
                onClick={() => setForm(f => ({ ...f, method: m }))}
                className={`flex-1 py-2 rounded-xl text-xs font-medium border transition-all ${
                  form.method === m ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-500 border-gray-200'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full bg-gray-900 text-white py-3 rounded-xl font-semibold text-sm mt-2"
        >
          등록하기
        </button>
      </div>
    </div>
  );
};

// ── 메인 컴포넌트 ─────────────────────────────────────────
const Points = () => {
  const [tab, setTab] = useState<'points' | 'payments'>('payments');
  const [filterMethod, setFilterMethod] = useState<PaymentMethod | '전체'>('전체');
  const [showAdd, setShowAdd] = useState(false);
  const [showStats, setShowStats] = useState(true);

  const filtered = filterMethod === '전체'
    ? mockPayments
    : mockPayments.filter(p => p.method === filterMethod);

  return (
    <div className="min-h-screen bg-background">

      {/* ── 헤더 ── */}
      <div className="gradient-sage safe-top">
        <div className="page-header-gradient pt-4">
          <h1 className="text-lg font-bold">결제 · 포인트</h1>
          <div className="flex items-end gap-6 mt-3">
            <div>
              <p className="text-3xl font-bold tracking-tight">{currentBalance.toLocaleString()}원</p>
              <p className="text-xs opacity-60 font-light mt-0.5">밴스 미금 잔액</p>
            </div>
            <div className="pb-0.5">
              <p className="text-lg font-semibold opacity-90">{totalSpent.toLocaleString()}원</p>
              <p className="text-xs opacity-60 font-light">누적 지출</p>
            </div>
          </div>
          {/* 병원별 잔액 */}
          <div className="flex gap-2 flex-wrap mt-3 pb-1">
            {Object.entries(clinicBalances).map(([clinic, bal]) => (
              <div key={clinic} className="flex-1 min-w-[130px] rounded-xl bg-white/10 border border-white/20 px-3 py-2">
                <p className="text-[10px] opacity-50 mb-0.5">{clinic}</p>
                <p className="text-sm font-semibold text-[#C9A96E]">₩{bal.toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── 탭 ── */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4">
        <div className="flex">
          {(['payments', 'points'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${
                tab === t ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-400'
              }`}
            >
              {t === 'payments' ? '결제 내역' : '포인트 내역'}
            </button>
          ))}
        </div>
      </div>

      <div className="page-content pt-4 space-y-3">

        {/* ── 결제 탭 ── */}
        {tab === 'payments' && (
          <>
            {/* 통계 토글 */}
            <button
              onClick={() => setShowStats(s => !s)}
              className="w-full flex items-center justify-between px-4 py-2 text-sm font-medium text-gray-600"
            >
              <span className="flex items-center gap-1.5"><TrendingDown className="w-4 h-4" /> 지출 분석</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${showStats ? 'rotate-180' : ''}`} />
            </button>

            {showStats && (
              <Card className="glass-card mx-0">
                <CardContent className="p-4 space-y-3">
                  {/* 요약 */}
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: '총 지출', value: `${(totalSpent / 10000).toFixed(0)}만원` },
                      { label: '포인트 절약', value: `${(totalPointsUsed / 10000).toFixed(0)}만원` },
                      { label: '시술 횟수', value: `${mockPayments.length}건` },
                    ].map(({ label, value }) => (
                      <div key={label} className="bg-gray-50 rounded-xl p-2.5 text-center">
                        <p className="text-xs text-gray-400 mb-0.5">{label}</p>
                        <p className="text-sm font-bold text-gray-800">{value}</p>
                      </div>
                    ))}
                  </div>

                  {/* 병원별 */}
                  <div>
                    <p className="text-xs text-gray-400 mb-2 flex items-center gap-1">
                      <Building2 className="w-3 h-3" /> 병원별 지출
                    </p>
                    {clinicList.map(({ name, amount, pct }) => (
                      <div key={name} className="mb-2">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-gray-600 font-medium">{name}</span>
                          <span className="text-gray-800 font-semibold">{amount.toLocaleString()}원</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gray-800 rounded-full transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 필터 */}
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide px-0">
              {(['전체', '카드', '현금', '포인트', '혼합'] as const).map(m => (
                <button
                  key={m}
                  onClick={() => setFilterMethod(m)}
                  className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                    filterMethod === m
                      ? 'bg-gray-900 text-white border-gray-900'
                      : 'bg-white text-gray-500 border-gray-200'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>

            {/* 결제 목록 */}
            {filtered.map(p => (
              <Card key={p.id} className="glass-card">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-sm font-semibold truncate">{p.treatmentName}</p>
                        <span className={`shrink-0 text-[10px] px-1.5 py-0.5 rounded-full font-medium ${methodColors[p.method]}`}>
                          {p.method}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400">{p.date} · {p.clinic}</p>
                      {p.pointsUsed && (
                        <p className="text-[11px] text-amber-500 mt-0.5">포인트 {p.pointsUsed.toLocaleString()}원 사용</p>
                      )}
                      {p.memo && <p className="text-[11px] text-gray-400 mt-0.5">{p.memo}</p>}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-bold text-sm text-gray-900">
                        {p.amount.toLocaleString()}원
                      </p>
                      {p.pointsUsed && (
                        <p className="text-[10px] text-gray-400">
                          실결제 {(p.amount - p.pointsUsed).toLocaleString()}원
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </>
        )}

        {/* ── 포인트 탭 ── */}
        {tab === 'points' && (
          <>
            <Card className="glass-card">
              <CardContent className="p-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-emerald-50 rounded-xl p-3 text-center">
                    <p className="text-xs text-emerald-600 mb-1">총 적립</p>
                    <p className="text-base font-bold text-emerald-700">
                      {mockPoints.filter((t: any) => t.amount > 0).reduce((s: number, t: any) => s + t.amount, 0).toLocaleString()}원
                    </p>
                  </div>
                  <div className="bg-rose-50 rounded-xl p-3 text-center">
                    <p className="text-xs text-rose-500 mb-1">총 사용</p>
                    <p className="text-base font-bold text-rose-600">
                      {Math.abs(mockPoints.filter((t: any) => t.amount < 0).reduce((s: number, t: any) => s + t.amount, 0)).toLocaleString()}원
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {mockPoints.map((tx: any) => {
              const config = typeConfig[tx.type as PointType];
              const Icon = config.icon;
              return (
                <Card key={tx.id} className="glass-card">
                  <CardContent className="flex items-center gap-3 p-4">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted">
                      <Icon className={`h-4 w-4 ${config.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{tx.description}</p>
                      <p className="text-[11px] text-muted-foreground">{tx.date} · {config.label}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`font-bold text-sm ${tx.amount > 0 ? 'text-emerald-500' : 'text-rose-400'}`}>
                        {tx.amount > 0 ? '+' : ''}{tx.amount.toLocaleString()}원
                      </p>
                      <p className="text-[10px] text-muted-foreground">잔액 {tx.balance.toLocaleString()}</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </>
        )}

        <div className="h-24" />
      </div>

      {/* ── FAB 등록 버튼 ── */}
      {tab === 'payments' && (
        <button
          onClick={() => setShowAdd(true)}
          className="fixed bottom-24 right-5 z-40 flex items-center gap-2 bg-gray-900 text-white px-4 py-3 rounded-2xl shadow-lg font-medium text-sm"
        >
          <Plus className="w-4 h-4" />
          결제 등록
        </button>
      )}

      {showAdd && <AddPaymentModal onClose={() => setShowAdd(false)} />}
    </div>
  );
};

export default Points;
