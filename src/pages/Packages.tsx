import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Package, Wallet, Plus, ChevronRight, Building2, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useRecords } from '@/context/RecordsContext';
import AddPaymentModal from '@/components/AddPaymentModal';

// ── 타입 ──────────────────────────────────────────────────────────────
interface TreatmentPackage {
  id: string; name: string; clinic: string;
  total_sessions: number; used_sessions: number;
  expiry_date: string | null;
}
type PaymentMethod = '포인트충전' | '시술결제' | '카드' | '현금' | '서비스';
type ClinicType    = '밴스' | '타의원';
interface PaymentRecord {
  id: string; date: string; clinic: string; clinic_type: ClinicType;
  treatment_name: string; amount: number; method: PaymentMethod; memo?: string;
}
interface ClinicBalance { clinic: string; balance: number; }

const methodStyle: Record<string, { bg: string; text: string }> = {
  '포인트충전': { bg: 'bg-emerald-50', text: 'text-emerald-600' },
  '시술결제':   { bg: 'bg-indigo-50',  text: 'text-indigo-600' },
  '카드':       { bg: 'bg-sky-50',     text: 'text-sky-600' },
  '현금':       { bg: 'bg-amber-50',   text: 'text-amber-600' },
  '서비스':     { bg: 'bg-gray-100',   text: 'text-gray-500' },
};

// ─────────────────────────────────────────────────────────────────────
const Packages = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const defaultTab = searchParams.get('tab') || 'packages';

  // ── 시술권 state ──
  const [packages, setPackages] = useState<TreatmentPackage[]>([]);
  const [pkgLoading, setPkgLoading] = useState(true);

  // ── 포인트/결제 state ──
  const [payments, setPayments]   = useState<PaymentRecord[]>([]);
  const [balances, setBalances]   = useState<ClinicBalance[]>([]);
  const [payLoading, setPayLoading] = useState(true);
  const [filterClinic, setFilterClinic] = useState<string>('전체');
  const [showAddModal, setShowAddModal] = useState(false);

  // 시술권 로드
  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setPkgLoading(false); return; }
      const { data } = await supabase
        .from('treatment_packages')
        .select('id, name, clinic, total_sessions, used_sessions, expiry_date')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      setPackages(data ?? []);
      setPkgLoading(false);
    };
    load();
  }, []);

  // 결제 데이터 로드
  const loadPayments = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setPayLoading(false); return; }
    const [pRes, bRes] = await Promise.all([
      supabase.from('payment_records').select('*').eq('user_id', user.id).order('date', { ascending: false }),
      supabase.from('clinic_balances').select('clinic, balance').eq('user_id', user.id),
    ]);
    if (pRes.data)  setPayments(pRes.data.map(r => ({ ...r, method: (r.method || '카드') as PaymentMethod, clinic_type: (r.clinic_type || '타의원') as ClinicType })));
    if (bRes.data)  setBalances(bRes.data as ClinicBalance[]);
    setPayLoading(false);
  }, []);

  useEffect(() => { loadPayments(); }, [loadPayments]);

  // ── 계산 ──────────────────────────────────────────────────────────
  const activePackages   = packages.filter(p => p.total_sessions - p.used_sessions > 0);
  const finishedPackages = packages.filter(p => p.total_sessions - p.used_sessions <= 0);
  const totalBalance     = balances.reduce((s, b) => s + b.balance, 0);
  const totalSpent       = payments.filter(p => p.method !== '포인트충전').reduce((s, p) => s + p.amount, 0);

  const clinicList = useMemo(() => {
    const set = new Set<string>();
    payments.forEach(p => p.clinic && set.add(p.clinic));
    return ['전체', ...Array.from(set)];
  }, [payments]);

  const filteredPayments = filterClinic === '전체'
    ? payments
    : payments.filter(p => p.clinic === filterClinic);

  return (
    <div className="min-h-screen bg-background">
      <div className="page-header safe-top">
        <h1 className="text-lg font-bold">시술권 · 포인트</h1>
      </div>

      <div className="page-content pb-28">
        <Tabs defaultValue={defaultTab} className="w-full">
          <TabsList className="w-full grid grid-cols-2 mb-4 rounded-xl h-auto bg-muted p-1">
            <TabsTrigger value="packages" className="rounded-lg text-xs py-2 flex items-center gap-1.5 data-[state=active]:bg-card data-[state=active]:shadow-sm">
              <Package className="h-3.5 w-3.5" /> 시술권 관리
            </TabsTrigger>
            <TabsTrigger value="points" className="rounded-lg text-xs py-2 flex items-center gap-1.5 data-[state=active]:bg-card data-[state=active]:shadow-sm">
              <Wallet className="h-3.5 w-3.5" /> 포인트 관리
            </TabsTrigger>
          </TabsList>

          {/* ══════════════ 시술권 관리 탭 ══════════════ */}
          <TabsContent value="packages" className="space-y-3 mt-0">
            {pkgLoading ? (
              <div className="text-center py-12 text-sm text-muted-foreground">불러오는 중...</div>
            ) : packages.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-8 text-center mt-4">
                <p className="text-sm font-semibold text-gray-500 mb-1">시술권을 등록하면</p>
                <p className="text-xs text-gray-400 leading-relaxed mb-4">
                  남은 횟수와 다음 관리 시점을<br />자동으로 알려드려요!
                </p>
                <p className="text-xs text-gray-400">문자/카카오 메시지로 자동 등록하거나<br />홈 화면에서 직접 추가할 수 있어요</p>
              </div>
            ) : (
              <>
                {activePackages.length > 0 && (
                  <div>
                    <p className="text-xs font-bold text-gray-500 mb-2">잔여 시술권 {activePackages.length}개</p>
                    <div className="space-y-2.5">
                      {activePackages.map(pkg => <PackageCard key={pkg.id} pkg={pkg} />)}
                    </div>
                  </div>
                )}
                {finishedPackages.length > 0 && (
                  <div>
                    <p className="text-xs font-bold text-gray-400 mb-2 mt-4">완료 {finishedPackages.length}개</p>
                    <div className="space-y-2.5 opacity-50">
                      {finishedPackages.map(pkg => <PackageCard key={pkg.id} pkg={pkg} />)}
                    </div>
                  </div>
                )}
              </>
            )}
          </TabsContent>

          {/* ══════════════ 포인트 관리 탭 ══════════════ */}
          <TabsContent value="points" className="space-y-3 mt-0">

            {/* 잔액 요약 */}
            {balances.length > 0 && (
              <Card className="glass-card">
                <CardContent className="p-4">
                  <p className="text-[11px] text-muted-foreground mb-1">남은 잔액 (사용 가능)</p>
                  <p className="text-2xl font-black text-foreground">{totalBalance.toLocaleString()}<span className="text-sm font-normal ml-1">원</span></p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {balances.map(b => (
                      <span key={b.clinic} className="text-[11px] px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 font-medium">
                        {b.clinic} {b.balance.toLocaleString()}원
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 결제 통계 */}
            <Card className="glass-card">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-[11px] text-muted-foreground">총 결제액</p>
                  <p className="text-xl font-black">{totalSpent.toLocaleString()}<span className="text-sm font-normal ml-1">원</span></p>
                </div>
                <div className="text-right">
                  <p className="text-[11px] text-muted-foreground">결제 건수</p>
                  <p className="text-xl font-black">{payments.filter(p => p.method !== '포인트충전').length}<span className="text-sm font-normal ml-1">건</span></p>
                </div>
              </CardContent>
            </Card>

            {/* 병원 필터 */}
            {clinicList.length > 1 && (
              <ScrollArea className="w-full">
                <div className="flex gap-2 pb-1">
                  {clinicList.map(c => (
                    <button key={c}
                      onClick={() => setFilterClinic(c)}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                        filterClinic === c
                          ? 'bg-primary text-primary-foreground shadow-sm'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {c !== '전체' && <Building2 className="h-3 w-3" />} {c}
                    </button>
                  ))}
                </div>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            )}

            {/* 결제 목록 */}
            {payLoading ? (
              <div className="text-center py-8 text-sm text-muted-foreground">불러오는 중...</div>
            ) : filteredPayments.length === 0 ? (
              <div className="text-center py-10 text-sm text-muted-foreground">결제 기록이 없어요</div>
            ) : (
              <div className="space-y-2">
                {filteredPayments.map(p => {
                  const style = methodStyle[p.method] ?? { bg: 'bg-gray-100', text: 'text-gray-500' };
                  return (
                    <Card key={p.id} className="glass-card">
                      <CardContent className="p-3.5">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold truncate">{p.treatment_name}</p>
                            <p className="text-[11px] text-muted-foreground mt-0.5">{p.date} · {p.clinic}</p>
                            {p.memo && <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{p.memo}</p>}
                          </div>
                          <div className="text-right shrink-0">
                            <p className={`text-sm font-black ${p.method === '포인트충전' ? 'text-emerald-500' : ''}`}>
                              {p.method === '포인트충전' ? '+' : '-'}{p.amount.toLocaleString()}원
                            </p>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${style.bg} ${style.text}`}>
                              {p.method}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* FAB */}
      <button
        onClick={() => setShowAddModal(true)}
        className="fixed bottom-20 right-4 z-40 h-14 w-14 rounded-full bg-[#C9A96E] shadow-lg shadow-[#C9A96E]/30 flex items-center justify-center active:scale-95 transition-transform"
      >
        <Plus size={24} className="text-black" strokeWidth={2.5} />
      </button>

      <AddPaymentModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSaved={() => { setShowAddModal(false); loadPayments(); }}
      />
    </div>
  );
};

function PackageCard({ pkg }: { pkg: TreatmentPackage }) {
  const remaining = pkg.total_sessions - pkg.used_sessions;
  const progress  = (pkg.used_sessions / pkg.total_sessions) * 100;
  return (
    <Card className="glass-card">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm leading-snug">{pkg.name}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">{pkg.clinic}</p>
            {pkg.expiry_date && <p className="text-[10px] text-muted-foreground mt-0.5">만료 {pkg.expiry_date}</p>}
          </div>
          <div className="text-right shrink-0 ml-3">
            <p className="text-2xl font-black text-primary">{remaining}</p>
            <p className="text-[10px] text-muted-foreground">잔여</p>
          </div>
        </div>
        <Progress value={progress} className="h-1.5 mb-1.5" />
        <p className="text-[11px] text-muted-foreground text-right">{pkg.used_sessions}회 사용 / 총 {pkg.total_sessions}회</p>
      </CardContent>
    </Card>
  );
}

export default Packages;
