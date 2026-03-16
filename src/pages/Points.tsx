import { useState } from 'react';
import type { ElementType } from 'react';
import { ArrowUpCircle, ArrowDownCircle, Users, Gift, TrendingDown, ChevronDown, Building2, CreditCard, Banknote, Coins } from 'lucide-react';
import logoImg from '@/assets/logo.png';
import { Card, CardContent } from '@/components/ui/card';
// ── 타입 정의 ─────────────────────────────────────────────────────────
type PaymentMethod = '포인트충전' | '시술결제' | '카드' | '현금' | '서비스';
type ClinicType = '밴스' | '타의원';

interface PointTransaction {
  id: string; date: string; type: 'charge' | 'use' | 'referral' | 'bonus';
  amount: number; description: string; balance: number;
}
interface PaymentRecord {
  id: string; date: string; treatment: string; clinic: string;
  clinicType: ClinicType; amount: number; method: PaymentMethod; notes?: string;
}
interface Package {
  id: string; name: string; clinic: string; totalSessions: number;
  usedSessions: number; expiryDate: string; skinLayer?: string;
}

const mockPoints: PointTransaction[] = [];
const currentBalance = 0;
const clinicBalances: Record<string, number> = {};
const mockPaymentRecords: PaymentRecord[] = [];
const mockPackages: Package[] = [];
const VANCE_CLINICS: string[] = [];

// ── 포인트 타입 설정 ──────────────────────────────────────────────────
type PointType = 'charge' | 'use' | 'referral' | 'bonus';

const pointTypeConfig: Record<PointType, { icon: ElementType; label: string; color: string }> = {
  charge:   { icon: ArrowUpCircle,   label: '충전',   color: 'text-emerald-500' },
  use:      { icon: ArrowDownCircle, label: '사용',   color: 'text-rose-400' },
  referral: { icon: Users,           label: '소개',   color: 'text-blue-400' },
  bonus:    { icon: Gift,            label: '보너스', color: 'text-amber-400' },
};

// ── 결제수단 배지 ─────────────────────────────────────────────────────
const methodStyle: Record<PaymentMethod, { bg: string; text: string; label: string }> = {
  '포인트충전': { bg: 'bg-amber-50',  text: 'text-amber-600',  label: '포인트충전' },
  '시술결제':   { bg: 'bg-blue-50',   text: 'text-blue-600',   label: '시술결제' },
  '카드':       { bg: 'bg-sky-50',    text: 'text-sky-600',    label: '카드' },
  '현금':       { bg: 'bg-green-50',  text: 'text-green-600',  label: '현금' },
  '서비스':     { bg: 'bg-gray-100',  text: 'text-gray-500',   label: '서비스' },
};

const clinicTypeStyle: Record<ClinicType, { bg: string; text: string }> = {
  '밴스':   { bg: 'bg-amber/10', text: 'text-amber' },
  '타의원': { bg: 'bg-secondary/10',    text: 'text-secondary' },
};

// ── 병원별 잔여 시술권 그룹핑 ────────────────────────────────────────
const remainingByClinic = mockPackages.reduce((acc, pkg) => {
  const remaining = pkg.totalSessions - pkg.usedSessions;
  if (remaining <= 0) return acc;
  if (!acc[pkg.clinic]) acc[pkg.clinic] = [];
  acc[pkg.clinic].push({ name: pkg.name, remaining, total: pkg.totalSessions, expiry: pkg.expiryDate });
  return acc;
}, {} as Record<string, { name: string; remaining: number; total: number; expiry: string }[]>);

// ── 결제 통계 ─────────────────────────────────────────────────────────
const vanceTotal = mockPaymentRecords.filter(p => p.clinicType === '밴스').reduce((s, p) => s + p.amount, 0);
const otherTotal = mockPaymentRecords.filter(p => p.clinicType === '타의원' && p.amount > 0).reduce((s, p) => s + p.amount, 0);
const totalSpent = vanceTotal + otherTotal;

const clinicStats = mockPaymentRecords.reduce((acc, p) => {
  if (p.amount > 0) acc[p.clinic] = (acc[p.clinic] || 0) + p.amount;
  return acc;
}, {} as Record<string, number>);

const clinicList = Object.entries(clinicStats)
  .sort((a, b) => b[1] - a[1])
  .map(([name, amount]) => ({
    name, amount,
    pct: totalSpent > 0 ? Math.round((amount / totalSpent) * 100) : 0,
    isVance: VANCE_CLINICS.some(() => name.includes('밴스')),
  }));

// ── 메인 ─────────────────────────────────────────────────────────────
const Points = () => {
  const [tab, setTab] = useState<'remaining' | 'payments'>('remaining');
  const [filterType, setFilterType] = useState<ClinicType | '전체'>('전체');
  const [showStats, setShowStats] = useState(true);

  const filtered = filterType === '전체'
    ? mockPaymentRecords
    : mockPaymentRecords.filter(p => p.clinicType === filterType);
  const sorted = [...filtered].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="min-h-screen bg-background">

      {/* ── 헤더 ── */}
      <div className="relative safe-top overflow-hidden">
        <img src={logoImg} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/40" />
        <div className="page-header-gradient relative z-10 pt-4" style={{ background: 'transparent' }}>
          <h1 className="text-lg font-bold">포인트 관리</h1>
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
          {/* 병원별 잔액 카드 */}
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
          {([
            { key: 'remaining', label: '포인트 관리' },
            { key: 'payments',  label: '결제 내역' },
          ] as const).map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${
                tab === t.key ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-400'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="page-content pt-4 space-y-3">

        {/* ── 남은 시술 & 포인트 탭 ── */}
        {tab === 'remaining' && (
          <>
            {/* 병원별 잔여 시술 + 잔액 */}
            {Object.entries(remainingByClinic).map(([clinic, items]) => {
              const balance = clinicBalances[clinic];
              const isVance = VANCE_CLINICS.some(() => clinic.includes('밴스'));
              return (
                <Card key={clinic} className="glass-card">
                  <CardContent className="p-4">
                    {/* 병원명 + 잔액 */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${isVance ? 'bg-amber' : 'bg-secondary'}`} />
                        <span className="font-semibold text-sm">{clinic}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                          isVance ? 'bg-amber/10 text-amber' : 'bg-secondary/10 text-secondary'
                        }`}>
                          {isVance ? '밴스' : '타의원'}
                        </span>
                      </div>
                      {balance !== undefined && (
                        <span className="text-sm font-bold text-amber">
                          ₩{balance.toLocaleString()}
                        </span>
                      )}
                    </div>

                    {/* 잔여 시술권 목록 */}
                    <div className="space-y-2">
                      {items.map((item, i) => (
                        <div key={i} className="flex items-center justify-between bg-muted rounded-xl px-3 py-2.5">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-foreground font-medium truncate">{item.name}</p>
                            <p className="text-[11px] text-muted-foreground mt-0.5">만료 {item.expiry}</p>
                          </div>
                          <div className="text-right ml-3 shrink-0">
                            <span className="text-sm font-bold text-foreground">{item.remaining}회</span>
                            <span className="text-[11px] text-muted-foreground"> / {item.total}회</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* 잔액만 있고 시술권 없는 경우 (필로의원 등) */}
                    {items.length === 0 && balance !== undefined && (
                      <p className="text-xs text-gray-400 text-center py-2">잔여 시술권 없음</p>
                    )}
                  </CardContent>
                </Card>
              );
            })}

            {/* 시술권은 없지만 잔액만 있는 병원 */}
            {Object.entries(clinicBalances)
              .filter(([clinic]) => !remainingByClinic[clinic])
              .map(([clinic, balance]) => (
                <Card key={clinic} className="glass-card">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-purple-400" />
                        <span className="font-semibold text-sm">{clinic}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-purple-50 text-purple-500">
                          타의원
                        </span>
                      </div>
                      <span className="text-sm font-bold text-[#C9A96E]">₩{balance.toLocaleString()}</span>
                    </div>
                    {/* mockPackages에서 해당 병원 시술권 직접 렌더 */}
                    <div className="space-y-2">
                      {mockPackages
                        .filter(p => p.clinic === clinic && p.totalSessions - p.usedSessions > 0)
                        .map(pkg => (
                          <div key={pkg.id} className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2.5">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-gray-800 font-medium truncate">{pkg.name}</p>
                              <p className="text-[11px] text-gray-400 mt-0.5">만료 {pkg.expiryDate}</p>
                            </div>
                            <div className="text-right ml-3 shrink-0">
                              <span className="text-sm font-bold text-gray-900">{pkg.totalSessions - pkg.usedSessions}회</span>
                              <span className="text-[11px] text-gray-400"> / {pkg.totalSessions}회</span>
                            </div>
                          </div>
                        ))
                      }
                      {mockPackages.filter(p => p.clinic === clinic && p.totalSessions - p.usedSessions > 0).length === 0 && (
                        <div className="space-y-1.5 bg-gray-50 rounded-xl px-3 py-2.5">
                          <p className="text-xs text-gray-400">잔여 시술권 없음</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}

            {/* 포인트 내역 요약 */}
            <div className="pt-2">
              <p className="text-xs font-semibold text-gray-400 px-1 mb-2">밴스 포인트 내역</p>
              <Card className="glass-card">
                <CardContent className="p-4">
                  <div className="grid grid-cols-2 gap-3 mb-3">
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

                  {mockPoints.map((tx: any) => {
                    const config = pointTypeConfig[tx.type as PointType];
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
                  })}
                </CardContent>
              </Card>
            </div>
          </>
        )}

        {/* ── 결제 내역 탭 ── */}
        {tab === 'payments' && (
          <>
            <div className="mx-0 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-xs text-amber-700 space-y-0.5">
              <p className="font-semibold">💡 결제 내역 구조</p>
              <p>밴스 계열: 포인트 신규충전 = 실제 카드/현금 결제</p>
              <p>타의원: 시술 직접 결제 내역</p>
            </div>

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

            <div className="flex gap-2 pb-1">
              {(['전체', '밴스', '타의원'] as const).map(f => (
                <button key={f} onClick={() => setFilterType(f)}
                  className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                    filterType === f ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-500 border-gray-200'
                  }`}>{f}</button>
              ))}
            </div>

            {sorted.map(p => {
              const ms = methodStyle[p.method];
              const cs = clinicTypeStyle[p.clinicType];
              return (
                <Card key={p.id} className="glass-card">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                          <p className="text-sm font-semibold truncate">{p.treatment}</p>
                          <span className={`shrink-0 text-[10px] px-1.5 py-0.5 rounded-full font-medium ${ms.bg} ${ms.text}`}>{ms.label}</span>
                          <span className={`shrink-0 text-[10px] px-1.5 py-0.5 rounded-full font-medium ${cs.bg} ${cs.text}`}>{p.clinicType}</span>
                        </div>
                        <p className="text-xs text-gray-400">{p.date.replace(/-/g, '.')} · {p.clinic}</p>
                        {p.notes && <p className="text-[11px] text-gray-400 mt-0.5">{p.notes}</p>}
                      </div>
                      <div className="text-right shrink-0">
                        {p.amount > 0
                          ? <p className="font-bold text-sm text-gray-900">{p.amount.toLocaleString()}원</p>
                          : <p className="font-bold text-sm text-gray-400">서비스</p>
                        }
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </>
        )}

        <div className="h-24" />
      </div>
    </div>
  );
};

export default Points;
