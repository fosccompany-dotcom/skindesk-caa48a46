import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Package, Wallet, Building2, MoreVertical, Pencil, Trash2, ChevronDown, ArrowLeftRight } from 'lucide-react';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useSearchParams } from 'react-router-dom';
import AddPaymentModal from '@/components/AddPaymentModal';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

// ── 타입 ──────────────────────────────────────────────────────────────
interface TreatmentPackage {
  id: string; name: string; clinic: string;
  total_sessions: number; used_sessions: number;
  expiry_date: string | null;
}
type PaymentMethod = '포인트충전' | '포인트' | '시술결제' | '카드' | '현금' | '서비스';
type ClinicType    = '밴스' | '타의원';
interface PaymentRecord {
  id: string; date: string; clinic: string; clinic_type: ClinicType;
  treatment_name: string; amount: number; method: PaymentMethod; memo?: string;
}
interface ClinicBalance { clinic: string; balance: number; }

const methodStyle: Record<string, { bg: string; text: string }> = {
  '포인트충전': { bg: 'bg-emerald-50', text: 'text-emerald-600' },
  '포인트':     { bg: 'bg-orange-50',  text: 'text-orange-600' },
  '시술결제':   { bg: 'bg-indigo-50',  text: 'text-indigo-600' },
  '카드':       { bg: 'bg-sky-50',     text: 'text-sky-600' },
  '현금':       { bg: 'bg-amber-50',   text: 'text-amber-600' },
  '서비스':     { bg: 'bg-gray-100',   text: 'text-gray-500' },
};

// ─────────────────────────────────────────────────────────────────────
const Packages = () => {
  const [searchParams] = useSearchParams();
  const defaultTab = searchParams.get('tab') || 'packages';

  // ── 탭 순서 커스텀 (드래그) ──
  const TAB_ORDER_KEY = 'skindesk_tab_order';
  const [tabOrder, setTabOrder] = useState<('packages' | 'points')[]>(() => {
    try {
      const saved = localStorage.getItem(TAB_ORDER_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return ['packages', 'points'];
  });
  const [dragIdx, setDragIdx] = useState<number | null>(null);

  const handleDragStart = (idx: number) => setDragIdx(idx);
  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (dragIdx === null || dragIdx === idx) return;
    const newOrder = [...tabOrder];
    const [moved] = newOrder.splice(dragIdx, 1);
    newOrder.splice(idx, 0, moved);
    setTabOrder(newOrder);
    localStorage.setItem(TAB_ORDER_KEY, JSON.stringify(newOrder));
    setDragIdx(idx);
  };
  const handleDragEnd = () => setDragIdx(null);

  const tabConfig: Record<string, { icon: typeof Package; label: string }> = {
    packages: { icon: Package, label: '시술권 관리' },
    points:   { icon: Wallet,  label: '포인트 관리' },
  };
  // ── 시술권 state ──
  const [packages, setPackages] = useState<TreatmentPackage[]>([]);
  const [pkgLoading, setPkgLoading] = useState(true);

  // ── 포인트/결제 state ──
  const [payments, setPayments]   = useState<PaymentRecord[]>([]);
  const [balances, setBalances]   = useState<ClinicBalance[]>([]);
  const [payLoading, setPayLoading] = useState(true);
  const [filterClinic, setFilterClinic] = useState<string>('전체');
  const [showAddModal, setShowAddModal] = useState(false);

  // ── 수정/삭제 모달 state ──
  const [editPkg, setEditPkg] = useState<TreatmentPackage | null>(null);
  const [editPay, setEditPay] = useState<PaymentRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'package' | 'payment'; id: string; name: string } | null>(null);

  // 편집 폼 state
  const [editPkgForm, setEditPkgForm] = useState({ name: '', clinic: '', total_sessions: 0, used_sessions: 0, expiry_date: '' });
  const [editPayForm, setEditPayForm] = useState({ treatment_name: '', clinic: '', date: '', amount: 0, memo: '', method: '' as string });

  // 시술권 로드
  const loadPackages = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setPkgLoading(false); return; }
    const { data } = await supabase
      .from('treatment_packages')
      .select('id, name, clinic, total_sessions, used_sessions, expiry_date')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    setPackages(data ?? []);
    setPkgLoading(false);
  }, []);

  useEffect(() => { loadPackages(); }, [loadPackages]);

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

  // ── 시술권 수정 ──
  const handleEditPkg = (pkg: TreatmentPackage) => {
    setEditPkgForm({
      name: pkg.name,
      clinic: pkg.clinic,
      total_sessions: pkg.total_sessions,
      used_sessions: pkg.used_sessions,
      expiry_date: pkg.expiry_date || '',
    });
    setEditPkg(pkg);
  };

  const savePkgEdit = async () => {
    if (!editPkg) return;
    const { error } = await supabase.from('treatment_packages').update({
      name: editPkgForm.name,
      clinic: editPkgForm.clinic,
      total_sessions: editPkgForm.total_sessions,
      used_sessions: editPkgForm.used_sessions,
      expiry_date: editPkgForm.expiry_date || null,
    }).eq('id', editPkg.id);
    if (error) { toast.error('수정 실패'); return; }
    toast.success('시술권이 수정되었습니다');
    setEditPkg(null);
    loadPackages();
  };

  // ── 결제 수정 ──
  const handleEditPay = (pay: PaymentRecord) => {
    setEditPayForm({
      treatment_name: pay.treatment_name,
      clinic: pay.clinic,
      date: pay.date,
      amount: pay.amount,
      memo: pay.memo || '',
      method: pay.method,
    });
    setEditPay(pay);
  };

  const savePayEdit = async () => {
    if (!editPay) return;
    const { error } = await supabase.from('payment_records').update({
      treatment_name: editPayForm.treatment_name,
      clinic: editPayForm.clinic,
      date: editPayForm.date,
      amount: editPayForm.amount,
      memo: editPayForm.memo || null,
      method: editPayForm.method,
    }).eq('id', editPay.id);
    if (error) { toast.error('수정 실패'); return; }
    toast.success('결제 내역이 수정되었습니다');
    setEditPay(null);
    loadPayments();
  };

  // ── 삭제 ──
  const handleDelete = async () => {
    if (!deleteTarget) return;
    const table = deleteTarget.type === 'package' ? 'treatment_packages' : 'payment_records';
    const { error } = await supabase.from(table).delete().eq('id', deleteTarget.id);
    if (error) { toast.error('삭제 실패'); return; }
    toast.success('삭제되었습니다');
    setDeleteTarget(null);
    if (deleteTarget.type === 'package') loadPackages();
    else loadPayments();
  };

  // ── 계산 (카드 내역 기반, 필터 반영) ──────────────────────────────
  const activePackages   = packages.filter(p => p.total_sessions - p.used_sessions > 0);
  const finishedPackages = packages.filter(p => p.total_sessions - p.used_sessions <= 0);

  const clinicList = useMemo(() => {
    const set = new Set<string>();
    payments.forEach(p => p.clinic && set.add(p.clinic));
    return ['전체', ...Array.from(set)];
  }, [payments]);

  const filteredPayments = filterClinic === '전체'
    ? payments
    : payments.filter(p => p.clinic === filterClinic);

  // 필터된 내역 기반으로 요약 계산
  const totalCharged = filteredPayments.filter(p => p.method === '포인트충전').reduce((s, p) => s + p.amount, 0);
  const totalSpent   = filteredPayments.filter(p => p.method !== '포인트충전').reduce((s, p) => s + p.amount, 0);
  const totalBalance = totalCharged - totalSpent;

  return (
    <div className="min-h-screen bg-background">
      <div className="page-header safe-top">
        <h1 className="text-lg font-bold">시술권 · 포인트</h1>
      </div>

      <div className="page-content pb-28">
        <Tabs defaultValue={defaultTab} className="w-full">
          <TabsList className="w-full grid grid-cols-2 mb-4 rounded-xl h-auto bg-muted p-1">
            {tabOrder.map((tabKey, idx) => {
              const cfg = tabConfig[tabKey];
              const Icon = cfg.icon;
              return (
                <TabsTrigger
                  key={tabKey}
                  value={tabKey}
                  draggable
                  onDragStart={() => handleDragStart(idx)}
                  onDragOver={e => handleDragOver(e, idx)}
                  onDragEnd={handleDragEnd}
                  className="rounded-lg text-xs py-2 flex items-center gap-1.5 data-[state=active]:bg-card data-[state=active]:shadow-sm cursor-grab active:cursor-grabbing"
                >
                  <Icon className="h-3.5 w-3.5" /> {cfg.label}
                </TabsTrigger>
              );
            })}
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
                      {activePackages.map(pkg => (
                        <PackageCard key={pkg.id} pkg={pkg} onEdit={() => handleEditPkg(pkg)} onDelete={() => setDeleteTarget({ type: 'package', id: pkg.id, name: pkg.name })} />
                      ))}
                    </div>
                  </div>
                )}
                {finishedPackages.length > 0 && (
                  <div>
                    <p className="text-xs font-bold text-gray-400 mb-2 mt-4">완료 {finishedPackages.length}개</p>
                    <div className="space-y-2.5 opacity-50">
                      {finishedPackages.map(pkg => (
                        <PackageCard key={pkg.id} pkg={pkg} onEdit={() => handleEditPkg(pkg)} onDelete={() => setDeleteTarget({ type: 'package', id: pkg.id, name: pkg.name })} />
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </TabsContent>

          {/* ══════════════ 포인트 관리 탭 ══════════════ */}
          <TabsContent value="points" className="space-y-3 mt-0">
            <Card className="glass-card">
              <CardContent className="p-4">
                <p className="text-[11px] text-muted-foreground mb-1">남은 잔액 (사용 가능)</p>
                <p className="text-2xl font-black text-foreground">{totalBalance.toLocaleString()}<span className="text-sm font-normal ml-1">원</span></p>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-[11px] text-muted-foreground">총 시술 결제액</p>
                  <p className="text-xl font-black">{totalSpent.toLocaleString()}<span className="text-sm font-normal ml-1">원</span></p>
                </div>
                <div className="text-right">
                  <p className="text-[11px] text-muted-foreground">총 충전액</p>
                  <p className="text-xl font-black text-emerald-500">{totalCharged.toLocaleString()}<span className="text-sm font-normal ml-1">원</span></p>
                </div>
              </CardContent>
            </Card>

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

            {payLoading ? (
              <div className="text-center py-8 text-sm text-muted-foreground">불러오는 중...</div>
            ) : filteredPayments.length === 0 ? (
              <div className="text-center py-10 text-sm text-muted-foreground">기록이 없어요</div>
            ) : (() => {
              const chargeRecords = filteredPayments.filter(p => p.method === '포인트충전');
              const treatmentRecords = filteredPayments.filter(p => p.method !== '포인트충전');

              const renderPayCard = (p: PaymentRecord) => {
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
                        <div className="flex items-start gap-1.5">
                          <div className="text-right shrink-0">
                            <p className={`text-sm font-black ${p.method === '포인트충전' ? 'text-emerald-500' : ''}`}>
                              {p.method === '포인트충전' ? '+' : '-'}{p.amount.toLocaleString()}원
                            </p>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${style.bg} ${style.text}`}>
                              {p.method}
                            </span>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button className="p-1 rounded-md hover:bg-muted transition-colors -mr-1">
                                <MoreVertical className="h-4 w-4 text-muted-foreground" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="min-w-[100px]">
                              <DropdownMenuItem onClick={() => handleEditPay(p)} className="text-xs gap-2">
                                <Pencil className="h-3.5 w-3.5" /> 수정
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setDeleteTarget({ type: 'payment', id: p.id, name: p.treatment_name })} className="text-xs gap-2 text-destructive focus:text-destructive">
                                <Trash2 className="h-3.5 w-3.5" /> 삭제
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              };

              return (
                <div className="space-y-4">
                  {chargeRecords.length > 0 && (
                    <div>
                      <p className="text-xs font-bold text-emerald-600 mb-2">충전 내역 {chargeRecords.length}건</p>
                      <div className="space-y-2">{chargeRecords.map(renderPayCard)}</div>
                    </div>
                  )}
                  {treatmentRecords.length > 0 && (
                    <div>
                      <p className="text-xs font-bold text-muted-foreground mb-2">시술 내역 {treatmentRecords.length}건</p>
                      <div className="space-y-2">{treatmentRecords.map(renderPayCard)}</div>
                    </div>
                  )}
                </div>
              );
            })()}
          </TabsContent>
        </Tabs>
      </div>

      <AddPaymentModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSaved={() => { setShowAddModal(false); loadPayments(); }}
      />

      {/* ── 시술권 수정 모달 ── */}
      <Dialog open={!!editPkg} onOpenChange={(open) => !open && setEditPkg(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base">시술권 수정</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">시술권명</Label>
              <Input value={editPkgForm.name} onChange={e => setEditPkgForm(f => ({ ...f, name: e.target.value }))} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">병원</Label>
              <Input value={editPkgForm.clinic} onChange={e => setEditPkgForm(f => ({ ...f, clinic: e.target.value }))} className="mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">총 회차</Label>
                <Input type="number" value={editPkgForm.total_sessions} onChange={e => setEditPkgForm(f => ({ ...f, total_sessions: Number(e.target.value) }))} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs">사용 회차</Label>
                <Input type="number" value={editPkgForm.used_sessions} onChange={e => setEditPkgForm(f => ({ ...f, used_sessions: Number(e.target.value) }))} className="mt-1" />
              </div>
            </div>
            <div>
              <Label className="text-xs">만료일 (선택)</Label>
              <Input type="date" value={editPkgForm.expiry_date} onChange={e => setEditPkgForm(f => ({ ...f, expiry_date: e.target.value }))} className="mt-1" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditPkg(null)} size="sm">취소</Button>
            <Button onClick={savePkgEdit} size="sm">저장</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── 결제 수정 모달 ── */}
      <Dialog open={!!editPay} onOpenChange={(open) => !open && setEditPay(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base">결제 내역 수정</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">내용</Label>
              <Input value={editPayForm.treatment_name} onChange={e => setEditPayForm(f => ({ ...f, treatment_name: e.target.value }))} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">병원</Label>
              <Input value={editPayForm.clinic} onChange={e => setEditPayForm(f => ({ ...f, clinic: e.target.value }))} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">결제 종류</Label>
              <div className="grid grid-cols-5 gap-1.5 mt-1">
                {(['포인트', '시술결제', '카드', '현금', '서비스'] as const).map(m => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setEditPayForm(f => ({ ...f, method: m }))}
                    className={`py-1.5 rounded-lg text-[11px] font-medium border transition-all ${
                      editPayForm.method === m
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-muted text-muted-foreground border-transparent'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">날짜</Label>
                <Input type="date" value={editPayForm.date} onChange={e => setEditPayForm(f => ({ ...f, date: e.target.value }))} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs">금액 (원)</Label>
                <Input type="number" value={editPayForm.amount} onChange={e => setEditPayForm(f => ({ ...f, amount: Number(e.target.value) }))} className="mt-1" />
              </div>
            </div>
            <div>
              <Label className="text-xs">메모 (선택)</Label>
              <Input value={editPayForm.memo} onChange={e => setEditPayForm(f => ({ ...f, memo: e.target.value }))} className="mt-1" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditPay(null)} size="sm">취소</Button>
            <Button onClick={savePayEdit} size="sm">저장</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── 삭제 확인 모달 ── */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle className="text-base">삭제 확인</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">"{deleteTarget?.name}"</span>을(를) 삭제하시겠습니까?<br />이 작업은 되돌릴 수 없습니다.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)} size="sm">취소</Button>
            <Button variant="destructive" onClick={handleDelete} size="sm">삭제</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

function PackageCard({ pkg, onEdit, onDelete }: { pkg: TreatmentPackage; onEdit: () => void; onDelete: () => void }) {
  const remaining = pkg.total_sessions - pkg.used_sessions;
  const progress  = (pkg.used_sessions / pkg.total_sessions) * 100;
  const [expanded, setExpanded] = useState(false);
  const [usageRecords, setUsageRecords] = useState<{ id: string; date: string; treatment_name: string; memo: string | null }[]>([]);
  const [loadingUsage, setLoadingUsage] = useState(false);
  const isMultiSession = pkg.total_sessions >= 2;

  const loadUsage = async () => {
    if (usageRecords.length > 0) return; // already loaded
    setLoadingUsage(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoadingUsage(false); return; }
    // package_uuid로 연결된 시술 기록 + 이름이 같은 시술 기록도 포함
    const { data } = await supabase
      .from('treatment_records')
      .select('id, date, treatment_name, memo')
      .eq('user_id', user.id)
      .or(`package_uuid.eq.${pkg.id},and(clinic.eq.${pkg.clinic},treatment_name.ilike.%${pkg.name.split(' ')[0]}%)`)
      .order('date', { ascending: false });
    setUsageRecords(data ?? []);
    setLoadingUsage(false);
  };

  const handleCardClick = () => {
    if (!isMultiSession) return;
    const next = !expanded;
    setExpanded(next);
    if (next) loadUsage();
  };

  return (
    <Card className={`glass-card ${isMultiSession ? 'cursor-pointer' : ''}`} onClick={handleCardClick}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm leading-snug">{pkg.name}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">{pkg.clinic}</p>
            {pkg.expiry_date && <p className="text-[10px] text-muted-foreground mt-0.5">만료 {pkg.expiry_date}</p>}
          </div>
          <div className="flex items-start gap-2 ml-3">
            <div className="text-right shrink-0">
              <p className="text-2xl font-black text-primary">{remaining}</p>
              <p className="text-[10px] text-muted-foreground">잔여</p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-1 rounded-md hover:bg-muted transition-colors -mr-1 mt-1" onClick={e => e.stopPropagation()}>
                  <MoreVertical className="h-4 w-4 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[100px]">
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(); }} className="text-xs gap-2">
                  <Pencil className="h-3.5 w-3.5" /> 수정
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDelete(); }} className="text-xs gap-2 text-destructive focus:text-destructive">
                  <Trash2 className="h-3.5 w-3.5" /> 삭제
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <Progress value={progress} className="h-1.5 mb-1.5" />
        <div className="flex items-center justify-between">
          <p className="text-[11px] text-muted-foreground">{pkg.used_sessions}회 사용 / 총 {pkg.total_sessions}회</p>
          {isMultiSession && (
            <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${expanded ? 'rotate-180' : ''}`} />
          )}
        </div>

        {/* 사용 내역 펼침 */}
        {expanded && isMultiSession && (
          <div className="mt-3 pt-3 border-t border-border space-y-2" onClick={e => e.stopPropagation()}>
            <p className="text-[11px] font-semibold text-muted-foreground">사용 내역</p>
            {loadingUsage ? (
              <p className="text-[11px] text-muted-foreground py-2">불러오는 중...</p>
            ) : usageRecords.length === 0 ? (
              <p className="text-[11px] text-muted-foreground py-2">아직 사용 기록이 없어요</p>
            ) : (
              usageRecords.map((r, i) => (
                <div key={r.id} className="flex items-center gap-2 text-[11px]">
                  <span className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground shrink-0">
                    {i + 1}
                  </span>
                  <span className="text-muted-foreground shrink-0">{r.date}</span>
                  <span className="truncate font-medium">{r.treatment_name}</span>
                  {r.memo && <span className="text-muted-foreground truncate">· {r.memo}</span>}
                </div>
              ))
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default Packages;
