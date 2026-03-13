import { useState, useRef } from 'react';
import { X, Clipboard, ImagePlus, Loader2, CheckCircle, ChevronDown, ChevronUp, Sparkles, AlertCircle, CreditCard, Package, Wallet } from 'lucide-react';
import { cn, extractDistrict } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import ClinicSearchInput from './ClinicSearchInput';
import { useRecords } from '@/context/RecordsContext';
import { SkinLayer, BodyArea } from '@/types/skin';

const SKIN_LAYER_COLOR: Record<string, string> = {
  epidermis:    'bg-amber-100 text-amber-600 border-amber-300',
  dermis:       'bg-blue-100 text-blue-600 border-blue-300',
  subcutaneous: 'bg-purple-100 text-purple-600 border-purple-300',
};
const LAYER_LABEL: Record<string, string> = {
  epidermis: '표피', dermis: '진피', subcutaneous: '피하',
};

interface ParsedRecord {
  date: string;
  treatmentName: string;
  clinic: string | null;
  amount_paid: number | null;
  skinLayer: SkinLayer;
  bodyArea: BodyArea;
  memo: string | null;
  selected: boolean;
  expanded: boolean;
}

interface BundleTreatment {
  date: string;
  treatmentName: string;
  clinic: string | null;
  skinLayer: SkinLayer;
  bodyArea: BodyArea;
  memo: string | null;
}

interface ParsedBundle {
  date: string;
  bundleName: string;
  clinic: string | null;
  amount_paid: number | null;
  memo: string | null;
  treatments: BundleTreatment[];
  selected: boolean;
  expanded: boolean;
}

interface ChargeRecord {
  date: string;
  amount: number;
  clinic: string | null;
  label: string;
}

type PkgPayMethod = '카드' | '현금' | '포인트' | '서비스';

interface ParsedPackage {
  date: string;
  name: string;
  total_sessions: number;
  used_sessions: number;
  clinic: string | null;
  amount_paid: number | null;
  memo: string | null;
  selected: boolean;
  payMethod: PkgPayMethod;
  // 중복 감지
  existingPackageId?: string | null;
  existingPackageName?: string | null;
  existingUsedSessions?: number;
  existingTotalSessions?: number;
  duplicateAction?: 'update' | 'new' | null; // null = 아직 선택 안함
}

type BalanceMethod = 'set' | 'add';

interface BalanceInfo {
  amount: number;
  clinic: string;
  selected: boolean;
  method: BalanceMethod;
}

interface Props { onClose: () => void; }
type Tab = 'text' | 'image';

export default function ParseTreatmentModal({ onClose }: Props) {
  const { addRecord } = useRecords();
  const [tab, setTab]                 = useState<Tab>('text');
  const [text, setText]               = useState('');
  const [imageFile, setImageFile]     = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState<string | null>(null);
  const [parsed, setParsed]           = useState<ParsedRecord[] | null>(null);
  const [bundles, setBundles]         = useState<ParsedBundle[]>([]);
  const [charges, setCharges]         = useState<ChargeRecord[]>([]);
  const [saving, setSaving]           = useState(false);
  const [parseSource, setParseSource] = useState<string | null>(null);
  const [saved, setSaved]             = useState(false);
  const [chargePayments, setChargePayments] = useState<{ show: boolean; amount: string; method: 'card' | 'cash' }[]>([]);
  const [pkgs, setPkgs] = useState<ParsedPackage[]>([]);
  const [balanceInfo, setBalanceInfo] = useState<BalanceInfo | null>(null);
  const [isRemainingContext, setIsRemainingContext] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  // ── 클라이언트 사이드 패키지 파싱 (N-M회차 패턴) ──
  const parsePackagesFromText = (inputText: string): ParsedPackage[] => {
    const results: ParsedPackage[] = [];
    const todayStr = new Date().toISOString().split('T')[0];

    // 통합 패턴: "XXX패키지 N-M회차" or "XXX 패키지 N-M회차" (괄호 포함 가능)
    const regex = /(\S+(?:\([^)]+\))?)\s*패키지\s*(\d+)\s*[-–]\s*(\d+)\s*회차/gi;
    let match;
    while ((match = regex.exec(inputText)) !== null) {
      const rawName = match[1].trim();
      const total = parseInt(match[2]);
      const used = parseInt(match[3]);
      if (total > 0 && used >= 0 && used <= total) {
        const pkgName = normalizePkgName(rawName);
        // 같은 정규화된 이름+총회차 중복 방지
        if (!results.find(r => r.name === pkgName && r.total_sessions === total)) {
          results.push({
            date: todayStr, name: pkgName,
            total_sessions: total, used_sessions: used,
            clinic: null, amount_paid: null, memo: null,
            selected: true, payMethod: '포인트',
            duplicateAction: null,
          });
        }
      }
    }
    return results;
  };

  const normalizePkgName = (raw: string): string => {
    const lower = raw.toLowerCase().replace(/[()]/g, '');
    if (lower.includes('베이직') || lower.includes('basic')) return '베이직 패키지';
    if (lower.includes('프리미엄') || lower.includes('premium')) return '프리미엄 패키지';
    if (lower.includes('스페셜') || lower.includes('special')) return '스페셜 패키지';
    if (lower.includes('바디') || lower.includes('body')) return '바디 패키지';
    if (lower.includes('메디컬') || lower.includes('medical')) return '메디컬 패키지';
    return raw + ' 패키지';
  };

  // ── 기존 패키지 중복 체크 ──
  const checkDuplicatePackages = async (packages: ParsedPackage[]): Promise<ParsedPackage[]> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || packages.length === 0) return packages;

    const { data: existingPkgs } = await supabase
      .from('treatment_packages')
      .select('id, name, total_sessions, used_sessions, clinic')
      .eq('user_id', user.id);

    if (!existingPkgs || existingPkgs.length === 0) return packages;

    return packages.map(pkg => {
      // 이름이 유사한 기존 패키지 찾기
      const match = existingPkgs.find(ep => {
        const epName = ep.name.toLowerCase().replace(/\s/g, '');
        const pkgName = pkg.name.toLowerCase().replace(/\s/g, '');
        return epName.includes(pkgName) || pkgName.includes(epName) || 
               (epName.includes('베이직') && pkgName.includes('베이직')) ||
               (epName.includes('프리미엄') && pkgName.includes('프리미엄')) ||
               (epName.includes('스페셜') && pkgName.includes('스페셜')) ||
               (epName.includes('바디') && pkgName.includes('바디')) ||
               (epName.includes('메디컬') && pkgName.includes('메디컬'));
      });

      if (match) {
        return {
          ...pkg,
          existingPackageId: match.id,
          existingPackageName: match.name,
          existingUsedSessions: match.used_sessions ?? 0,
          existingTotalSessions: match.total_sessions ?? 0,
          duplicateAction: null, // 유저에게 물어봄
        };
      }
      return pkg;
    });
  };

  const handleParse = async () => {
    setLoading(true); setError(null);
    setParsed(null); setBundles([]); setCharges([]); setBalanceInfo(null);

    try {
      let body: Record<string, any> = {};
      if (tab === 'text') {
        if (!text.trim()) { setError('텍스트를 입력해주세요.'); setLoading(false); return; }
        body = { text };
      } else {
        if (!imageFile) { setError('이미지를 선택해주세요.'); setLoading(false); return; }
        const base64 = await new Promise<string>((res, rej) => {
          const reader = new FileReader();
          reader.onload = () => res((reader.result as string).split(',')[1]);
          reader.onerror = rej;
          reader.readAsDataURL(imageFile);
        });
        body = { image_base64: base64, image_type: imageFile.type, text: text.trim() || undefined };
      }

      const { data, error: fnError } = await supabase.functions.invoke('parse-treatment', { body });
      if (fnError) throw new Error(fnError.message);

      const hasRecords   = data?.records?.length  > 0;
      const hasBundles   = data?.bundles?.length  > 0;
      const hasCharges   = data?.charges?.length  > 0;
      const hasPackages  = data?.packages?.length > 0;

      // 잔여금액 감지 (client-side)
      const inputText = body.text || text;
      // "남아있는/남아계신" 패턴 감지 → 시술권으로 저장
      const remainingPattern = /남아[있계]|남은\s*관리|잔여\s*시술|잔여\s*관리/;
      setIsRemainingContext(remainingPattern.test(inputText));
      const balanceMatch = inputText.match(/잔여금액\s*([\d,.\s]+)\s*원/);
      let hasBalance = false;
      if (balanceMatch) {
        const balanceAmount = parseInt(balanceMatch[1].replace(/[,.\s]/g, '')) || 0;
        if (balanceAmount > 0) {
          const clinicFromData = data?.records?.[0]?.clinic || data?.bundles?.[0]?.clinic || data?.packages?.[0]?.clinic || data?.charges?.[0]?.clinic || '';
          const clinicFromText = inputText.match(/(\S+의원|\S+피부과|\S+클리닉|\S+병원)/)?.[1] || '';
          setBalanceInfo({
            amount: balanceAmount,
            clinic: clinicFromData || clinicFromText,
            selected: true,
            method: 'set',
          });
          hasBalance = true;
        }
      }

      // ── 클라이언트 사이드 패키지 파싱 (N-M회차 패턴) ──
      const clientPkgs = parsePackagesFromText(inputText);
      // 병원명을 AI 결과에서 가져오기
      const clinicHint = data?.records?.[0]?.clinic || data?.bundles?.[0]?.clinic || data?.packages?.[0]?.clinic || data?.charges?.[0]?.clinic
        || inputText.match(/(\S+의원|\S+피부과|\S+클리닉|\S+병원)/)?.[1] || '';
      clientPkgs.forEach(p => { if (!p.clinic) p.clinic = clinicHint; });

      // AI 파싱된 패키지 + 클라이언트 파싱된 패키지 합치기 (정규화 기반 중복 제거)
      const normForDedup = (n: string) => n.toLowerCase().replace(/[\s()（）]/g, '');
      let allPkgs: ParsedPackage[] = [];
      if (hasPackages) {
        const todayStr = new Date().toISOString().split('T')[0];
        allPkgs = data.packages.map((p: any) => ({
          ...p, clinic: p.clinic || clinicHint, date: p.date || todayStr,
          selected: true, payMethod: '포인트' as PkgPayMethod, duplicateAction: null,
        }));
      }
      // 클라이언트 파싱 결과 중 AI가 이미 추출하지 않은 것만 추가
      for (const cp of clientPkgs) {
        const cpNorm = normForDedup(cp.name);
        const alreadyExists = allPkgs.some(ap => {
          const apNorm = normForDedup(ap.name);
          return (apNorm.includes(cpNorm) || cpNorm.includes(apNorm)) && ap.total_sessions === cp.total_sessions;
        });
        if (!alreadyExists) allPkgs.push(cp);
      }

      const hasClientPkgs = allPkgs.length > 0;

      if (!hasRecords && !hasBundles && !hasCharges && !hasPackages && !hasBalance && !hasClientPkgs) {
        if (data?.hint === 'image_credit_low') {
          setTab('text');
          setError('이미지 분석 크레딧 부족 — 텍스트 탭에서 문자 내용을 붙여넣어 주세요.');
        } else {
          setError(data?.error || '시술 정보를 찾지 못했습니다.');
        }
        setLoading(false); return;
      }

      if (hasCharges) {
        setCharges(data.charges);
        setChargePayments(data.charges.map(() => ({ show: false, amount: '', method: 'card' as const })));
      }

      // 중복 패키지 감지 후 설정
      if (hasClientPkgs) {
        const checkedPkgs = await checkDuplicatePackages(allPkgs);
        setPkgs(checkedPkgs);
      }

      if (hasBundles) {
        setBundles(data.bundles.map((b: any) => (
          {
            ...b,
            clinic: b.clinic || '',
            treatments: (b.treatments || []).map((t: any) => ({
              ...t, clinic: t.clinic || b.clinic || '',
              skinLayer: t.skinLayer || 'epidermis',
              bodyArea: t.bodyArea || 'face',
            })),
            selected: true,
            expanded: true,
          }
        )));
      }

      const todayStr2 = new Date().toISOString().split('T')[0];
      setParsed(
        hasRecords
          ? data.records.map((r: any) => ({
              ...r,
              date: r.date || todayStr2,
              clinic: r.clinic || '',
              skinLayer: r.skinLayer || 'dermis',
              bodyArea: r.bodyArea || 'face',
              selected: true,
              expanded: false,
            }))
          : []
      );
      setParseSource(data.source || null);
    } catch (e: any) {
      setError(e.message || '파싱 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect  = (i: number) => setParsed(prev => prev!.map((r, idx) => idx === i ? { ...r, selected: !r.selected } : r));
  const toggleExpand  = (i: number) => setParsed(prev => prev!.map((r, idx) => idx === i ? { ...r, expanded: !r.expanded } : r));
  const updateField   = (i: number, field: string, value: any) => setParsed(prev => prev!.map((r, idx) => idx === i ? { ...r, [field]: value } : r));

  const toggleBundle        = (i: number) => setBundles(prev => prev.map((b, idx) => idx === i ? { ...b, selected: !b.selected } : b));
  const toggleBundleExpand  = (i: number) => setBundles(prev => prev.map((b, idx) => idx === i ? { ...b, expanded: !b.expanded } : b));
  const updateBundle        = (i: number, field: string, value: any) => setBundles(prev => prev.map((b, idx) => idx === i ? { ...b, [field]: value } : b));
  const removeBundleTreatment = (bundleIdx: number, treatIdx: number) =>
    setBundles(prev => prev.map((b, i) => i === bundleIdx
      ? { ...b, treatments: b.treatments.filter((_, ti) => ti !== treatIdx) }
      : b));

  const handleSave = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setSaving(true);

    const toSave = (parsed || []).filter(r => r.selected);
    
    if (isRemainingContext) {
      // "남아있는" 시술 → 시술권(treatment_packages)으로 저장
      for (const r of toSave) {
        await supabase.from('treatment_packages').insert({
          user_id: user.id,
          name: r.treatmentName,
          type: 'session',
          total_sessions: 1,
          used_sessions: 0,
          skin_layer: r.skinLayer || 'dermis',
          body_area: r.bodyArea || 'face',
          clinic: r.clinic || '',
          expiry_date: null,
        });
      }
    } else {
      // 일반 시술내역으로 저장
      for (const r of toSave) {
        await addRecord({
          date: r.date, packageId: '', treatmentName: r.treatmentName,
          skinLayer: r.skinLayer, bodyArea: r.bodyArea,
          clinic: r.clinic || '', satisfaction: undefined, notes: undefined,
          memo: r.memo || undefined, amount_paid: r.amount_paid ?? undefined,
          input_method: 'ai_parsed',
          clinic_kakao_id: null,
          clinic_district: r.clinic ? extractDistrict(r.clinic) : null,
          clinic_address: null,
        });
      }
    }

    const selectedBundles = bundles.filter(b => b.selected);
    for (const b of selectedBundles) {
      await supabase.from('payment_records').insert({
        user_id: user.id, date: b.date, clinic: b.clinic || '',
        clinic_type: '밴스', treatment_name: b.bundleName,
        amount: b.amount_paid || 0, method: '시술결제', memo: b.memo || null,
      });
      for (const t of b.treatments) {
        await addRecord({
          date: t.date, packageId: '', treatmentName: t.treatmentName,
          skinLayer: t.skinLayer, bodyArea: t.bodyArea,
          clinic: t.clinic || b.clinic || '', satisfaction: undefined,
          notes: undefined, memo: t.memo || b.memo || undefined, amount_paid: undefined,
          input_method: 'ai_parsed',
          clinic_kakao_id: null,
          clinic_district: (t.clinic || b.clinic) ? extractDistrict(t.clinic || b.clinic || '') : null,
          clinic_address: null,
        });
      }
      if ((b.amount_paid || 0) > 0 && b.clinic) {
        const { data: bBal } = await supabase
          .from('clinic_balances').select('balance')
          .eq('user_id', user.id).eq('clinic', b.clinic).maybeSingle();
        if (bBal && bBal.balance > 0) {
          await supabase.from('clinic_balances').upsert({
            user_id: user.id, clinic: b.clinic,
            balance: Math.max(0, bBal.balance - (b.amount_paid || 0)),
            updated_at: new Date().toISOString(),
          }, { onConflict: 'user_id,clinic' });
        }
      }
    }

    for (const c of charges) {
      if (!c.clinic || c.amount <= 0) continue;
      const { data: existing } = await supabase.from('clinic_balances').select('balance')
        .eq('user_id', user.id).eq('clinic', c.clinic).maybeSingle();
      const newBalance = (existing?.balance || 0) + c.amount;
      await supabase.from('clinic_balances').upsert({
        user_id: user.id, clinic: c.clinic, balance: newBalance,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,clinic' });
      await supabase.from('payment_records').insert({
        user_id: user.id, date: c.date, clinic: c.clinic,
        clinic_type: '밴스', treatment_name: c.label,
        amount: c.amount, method: '포인트충전', memo: null,
      });
    }

    for (let ci = 0; ci < charges.length; ci++) {
      const cp = chargePayments[ci];
      if (!cp?.show || !cp.amount) continue;
      const c = charges[ci];
      await supabase.from('payment_records').insert({
        user_id: user.id, date: c.date, clinic: c.clinic || '',
        clinic_type: '밴스', treatment_name: '시술결제',
        amount: Number(cp.amount), method: cp.method === 'card' ? '카드' : '현금', memo: null,
      });
    }

    for (const p of pkgs.filter(p => p.selected)) {
      if (p.duplicateAction === 'update' && p.existingPackageId) {
        // 기존 패키지 업데이트
        await supabase.from('treatment_packages').update({
          total_sessions: p.total_sessions,
          used_sessions: p.used_sessions,
        }).eq('id', p.existingPackageId);
      } else {
        // 새로 등록
        await supabase.from('treatment_packages').insert({
          user_id: user.id, name: p.name, type: 'session',
          total_sessions: p.total_sessions, used_sessions: p.used_sessions,
          skin_layer: 'dermis', body_area: 'face',
          clinic: p.clinic || '', expiry_date: null,
        });
      }
      if (p.payMethod !== '서비스' && p.amount_paid) {
        const methodMap: Record<PkgPayMethod, string> = { '카드': '카드', '현금': '현금', '포인트': '시술결제', '서비스': '서비스' };
        await supabase.from('payment_records').insert({
          user_id: user.id, date: p.date, clinic: p.clinic || '',
          clinic_type: '밴스', treatment_name: p.name,
          amount: p.amount_paid, method: methodMap[p.payMethod], memo: p.memo || null,
        });
        if (p.clinic && p.payMethod === '포인트') {
          const { data: pkgBal } = await supabase
            .from('clinic_balances').select('balance')
            .eq('user_id', user.id).eq('clinic', p.clinic).maybeSingle();
          if (pkgBal && pkgBal.balance > 0) {
            await supabase.from('clinic_balances').upsert({
              user_id: user.id, clinic: p.clinic,
              balance: Math.max(0, pkgBal.balance - p.amount_paid),
              updated_at: new Date().toISOString(),
            }, { onConflict: 'user_id,clinic' });
          }
        }
      }
    }

    // 잔여금액 → clinic_balances + point_transactions 반영
    if (balanceInfo?.selected && balanceInfo.clinic && balanceInfo.amount > 0) {
      const todayStr = new Date().toISOString().split('T')[0];
      
      if (balanceInfo.method === 'set') {
        // 직접 세팅
        await supabase.from('clinic_balances').upsert({
          user_id: user.id,
          clinic: balanceInfo.clinic,
          balance: balanceInfo.amount,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id,clinic' });
      } else {
        // 기존 잔액에 더하기
        const { data: existing } = await supabase
          .from('clinic_balances').select('balance')
          .eq('user_id', user.id).eq('clinic', balanceInfo.clinic).maybeSingle();
        await supabase.from('clinic_balances').upsert({
          user_id: user.id,
          clinic: balanceInfo.clinic,
          balance: (existing?.balance || 0) + balanceInfo.amount,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id,clinic' });
      }

      // point_transactions에도 기록 추가
      await supabase.from('point_transactions').insert({
        user_id: user.id,
        date: todayStr,
        amount: balanceInfo.amount,
        balance: balanceInfo.amount,
        type: 'charge',
        description: `${balanceInfo.clinic} 포인트 잔액 설정`,
        clinic: balanceInfo.clinic,
      });

      // payment_records에도 기록 추가 (결제 내역 리스트에 표시)
      await supabase.from('payment_records').insert({
        user_id: user.id,
        date: todayStr,
        clinic: balanceInfo.clinic,
        treatment_name: '포인트 잔액 설정',
        amount: balanceInfo.amount,
        method: '포인트충전',
        memo: balanceInfo.method === 'set' ? '잔액 직접 설정' : '기존 잔액에 더하기',
      });
    }

    setSaving(false); setSaved(true);
    setTimeout(onClose, 1200);
  };

  const selectedCount  = (parsed?.filter(r => r.selected).length ?? 0) + bundles.filter(b => b.selected).length + pkgs.filter(p => p.selected).length + (balanceInfo?.selected ? 1 : 0);
  const hasPendingDuplicate = pkgs.some(p => p.selected && p.existingPackageId && !p.duplicateAction);
  const showResults    = parsed !== null || balanceInfo !== null || pkgs.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center pb-[72px]">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white rounded-t-3xl max-h-[calc(100vh-72px)] flex flex-col text-gray-900">
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-gray-200" />
        </div>
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-primary" />
            <span className="font-bold text-sm text-gray-900">문자/카톡으로 자동 등록</span>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100">
            <X size={16} className="text-gray-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto pb-6">
          {!showResults ? (
            <div className="p-5 space-y-4">
              {/* 탭 */}
              <div className="flex bg-muted rounded-xl p-1 gap-1">
                {(['text', 'image'] as Tab[]).map(t => (
                  <button key={t} onClick={() => setTab(t)}
                    className={cn('flex-1 py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5',
                      tab === t ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')}>
                    {t === 'text' ? <><Clipboard size={13} /> 문자/카톡 붙여넣기</> : <><ImagePlus size={13} /> 이미지 업로드</>}
                  </button>
                ))}
              </div>

              {tab === 'text' && (
                <div className="space-y-3">
                  <p className="text-[11px] text-muted-foreground">병원에서 받은 문자나 카톡 내용을 그대로 붙여넣으세요</p>
                  <textarea value={text} onChange={e => setText(e.target.value)}
                    placeholder={"[Web발신]\n[미금 밴스의원]\n[2026-02-17] -1,518,000원 ★E_세르프 600샷\n[2026-01-29] -108,900원 ★1월 한정이벤트_엑셀V레이저+피코토닝+관리+진정팩"}
                    className="w-full h-40 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-xs text-gray-800 placeholder:text-gray-300 resize-none focus:outline-none focus:border-primary/50" />
                </div>
              )}

              {tab === 'image' && (
                <div className="space-y-3">
                  <p className="text-[11px] text-muted-foreground">카카오톡 또는 문자 스크린샷을 업로드하세요</p>
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
                  {imagePreview ? (
                    <div className="relative rounded-xl overflow-hidden">
                      <img src={imagePreview} alt="preview" className="w-full max-h-48 object-contain bg-gray-50" />
                      <button onClick={() => { setImageFile(null); setImagePreview(null); }}
                        className="absolute top-2 right-2 p-1.5 bg-black/40 rounded-full">
                        <X size={12} className="text-white" />
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => fileRef.current?.click()}
                      className="w-full h-36 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center gap-2 hover:border-primary/40 transition-colors">
                      <ImagePlus size={24} className="text-gray-300" />
                      <span className="text-xs text-gray-400">탭하여 이미지 선택</span>
                    </button>
                  )}
                  {imagePreview && (
                    <textarea value={text} onChange={e => setText(e.target.value)}
                      placeholder="병원명 등 보충 정보 (선택사항)"
                      className="w-full h-16 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 placeholder:text-gray-300 resize-none focus:outline-none focus:border-primary/50" />
                  )}
                </div>
              )}

              {error && (
                <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3">
                  <AlertCircle size={14} className="text-rose-500 shrink-0" />
                  <p className="text-xs text-rose-600">{error}</p>
                </div>
              )}

              <button onClick={handleParse} disabled={loading}
                className="w-full py-3.5 bg-primary text-primary-foreground font-bold text-sm rounded-xl active:scale-[0.98] transition-transform disabled:opacity-50 flex items-center justify-center gap-2">
                {loading ? <><Loader2 size={16} className="animate-spin" /> 분석 중...</> : <><Sparkles size={16} /> 시술 정보 자동 추출</>}
              </button>
            </div>
          ) : (
            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  {pkgs.length > 0 && `시술권 ${pkgs.length}개 · `}
                  {bundles.length > 0 && `세트 ${bundles.length}개 · `}
                  {(parsed?.length ?? 0)}개 시술 · {selectedCount}개 선택
                </p>
                <div className="flex items-center gap-2">
                  {parseSource === 'keyword_fallback' && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-200">키워드 파싱</span>
                  )}
                  <button onClick={() => { setParsed(null); setBundles([]); setCharges([]); setPkgs([]); setBalanceInfo(null); }} className="text-xs text-primary font-medium">뒤로 가서 다시 입력</button>
                </div>
              </div>

              {/* 충전 배너 */}
              {charges.map((c, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex items-center gap-2.5 bg-emerald-50 border border-emerald-200 rounded-xl px-3.5 py-2.5">
                    <CreditCard size={14} className="text-emerald-600 shrink-0" />
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-emerald-700">{c.label} +{c.amount.toLocaleString()}원</p>
                      <p className="text-[10px] text-gray-400">{c.date}{c.clinic && ` · ${c.clinic}`} · 잔액에 자동 반영됩니다</p>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-600 border border-emerald-300 shrink-0">저장됨</span>
                  </div>

                  {(parsed?.length ?? 0) === 0 && bundles.length === 0 && (
                    <div className="rounded-xl border border-gray-200 bg-gray-50 overflow-hidden">
                      <button
                        onClick={() => setChargePayments(prev => prev.map((cp, ci2) => ci2 === i ? { ...cp, show: !cp.show } : cp))}
                        className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-left"
                      >
                        <span className="text-sm">🧾</span>
                        <div className="flex-1">
                          <p className="text-xs font-semibold text-gray-700">결제내역도 추가하시겠어요?</p>
                          <p className="text-[10px] text-gray-400">이번 충전 관련 결제 기록을 추가할 수 있어요</p>
                        </div>
                        <div className={`w-8 h-4 rounded-full transition-colors shrink-0 ${chargePayments[i]?.show ? 'bg-primary' : 'bg-gray-200'}`}>
                          <div className={`w-3 h-3 bg-white rounded-full mt-0.5 transition-transform ${chargePayments[i]?.show ? 'translate-x-4' : 'translate-x-0.5'}`} />
                        </div>
                      </button>

                      {chargePayments[i]?.show && (
                        <div className="px-3.5 pb-3.5 space-y-2 border-t border-gray-200 pt-3">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-[10px] text-gray-400 mb-1 block">병원명</label>
                              <input type="text" value={c.clinic || ''} readOnly
                                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-500 focus:outline-none" />
                            </div>
                            <div>
                              <label className="text-[10px] text-gray-400 mb-1 block">결제 금액</label>
                              <input type="number"
                                value={chargePayments[i]?.amount || ''}
                                placeholder="금액 입력"
                                onChange={e => setChargePayments(prev => prev.map((cp, ci2) => ci2 === i ? { ...cp, amount: e.target.value } : cp))}
                                className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-900 focus:outline-none focus:border-primary/50" />
                            </div>
                          </div>
                          <div>
                            <label className="text-[10px] text-gray-400 mb-1.5 block">결제 수단</label>
                            <div className="flex gap-2">
                              {(['card', 'cash'] as const).map(m => (
                                <button key={m}
                                  onClick={() => setChargePayments(prev => prev.map((cp, ci2) => ci2 === i ? { ...cp, method: m } : cp))}
                                  className={`flex-1 py-2 rounded-lg text-xs font-semibold border transition-all ${
                                    chargePayments[i]?.method === m
                                      ? 'border-primary/60 bg-primary/10 text-primary'
                                      : 'border-gray-200 bg-gray-50 text-gray-400'
                                  }`}>
                                  {m === 'card' ? '💳 카드' : '💵 현금'}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {/* ── 잔여금액(포인트 잔액) 카드 ── */}
              {balanceInfo && (
                <div className={cn('rounded-xl border transition-all',
                  balanceInfo.selected ? 'border-emerald-300 bg-emerald-50' : 'border-gray-200 bg-gray-50 opacity-50')}>
                  <div className="flex items-center gap-3 p-3.5">
                    <button onClick={() => setBalanceInfo(prev => prev ? { ...prev, selected: !prev.selected } : prev)}
                      className={cn('w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-all',
                        balanceInfo.selected ? 'border-emerald-500 bg-emerald-500' : 'border-gray-300')}>
                      {balanceInfo.selected && <div className="w-2 h-2 rounded-full bg-white" />}
                    </button>
                    <Wallet size={16} className="text-emerald-600 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-600 border border-emerald-200 font-semibold">잔여금액</span>
                      </div>
                      <p className="text-lg font-black text-emerald-700">{balanceInfo.amount.toLocaleString()}<span className="text-xs font-normal text-emerald-500 ml-0.5">원</span></p>
                      {balanceInfo.clinic && <p className="text-[11px] text-gray-500 mt-0.5">{balanceInfo.clinic}</p>}
                    </div>
                  </div>
                  {balanceInfo.selected && (
                    <div className="px-3.5 pb-3 border-t border-emerald-200 pt-2.5 space-y-2">
                      <div>
                        <label className="text-[10px] text-gray-400 mb-1 block">병원명</label>
                        <input type="text" value={balanceInfo.clinic}
                          onChange={e => setBalanceInfo(prev => prev ? { ...prev, clinic: e.target.value } : prev)}
                          placeholder="병원명 입력"
                          className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-900 focus:outline-none focus:border-primary/50" />
                      </div>
                      <div>
                        <label className="text-[10px] text-gray-400 mb-1 block">잔여금액 (원)</label>
                        <input type="number" value={balanceInfo.amount}
                          onChange={e => setBalanceInfo(prev => prev ? { ...prev, amount: Number(e.target.value) || 0 } : prev)}
                          className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-900 focus:outline-none focus:border-primary/50" />
                      </div>
                      <div>
                        <label className="text-[10px] text-gray-400 mb-1.5 block">금액 추가 방식</label>
                        <div className="flex gap-1.5">
                          {([
                            { key: 'set' as BalanceMethod, label: '잔액 직접 설정', desc: '이 금액으로 덮어쓰기' },
                            { key: 'add' as BalanceMethod, label: '기존 잔액에 더하기', desc: '현재 잔액 + 이 금액' },
                          ]).map(opt => (
                            <button key={opt.key}
                              onClick={() => setBalanceInfo(prev => prev ? { ...prev, method: opt.key } : prev)}
                              className={cn('flex-1 py-2 px-2 rounded-lg border text-left transition-all',
                                balanceInfo.method === opt.key
                                  ? 'border-emerald-300 bg-emerald-50'
                                  : 'border-gray-200 bg-gray-50'
                              )}>
                              <p className={cn('text-[11px] font-semibold', balanceInfo.method === opt.key ? 'text-emerald-600' : 'text-gray-500')}>{opt.label}</p>
                              <p className="text-[9px] text-gray-400">{opt.desc}</p>
                            </button>
                          ))}
                        </div>
                      </div>
                      <p className="text-[10px] text-emerald-600">
                        {balanceInfo.method === 'set'
                          ? '✓ 저장 시 해당 병원의 잔액이 이 금액으로 설정됩니다'
                          : '✓ 저장 시 해당 병원의 기존 잔액에 이 금액이 추가됩니다'}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* ── 시술권(패키지) 카드 ── */}
              {pkgs.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                    <Package size={11} /> 시술권 구매 — treatment_packages에 등록
                  </p>
                  {pkgs.map((p, i) => (
                    <div key={i} className={cn('rounded-xl border transition-all',
                      p.selected ? 'border-primary/40 bg-primary/5' : 'border-gray-200 bg-gray-50 opacity-50')}>
                      <div className="flex items-center gap-3 p-3.5">
                        <button onClick={() => setPkgs(prev => prev.map((pk, pi) => pi === i ? { ...pk, selected: !pk.selected } : pk))}
                          className={cn('w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-all',
                            p.selected ? 'border-primary bg-primary' : 'border-gray-300')}>
                          {p.selected && <div className="w-2 h-2 rounded-full bg-white" />}
                        </button>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-violet-100 text-violet-600 border border-violet-200 font-semibold">시술권</span>
                            {p.memo && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500 border border-gray-200">{p.memo}</span>}
                          </div>
                          <p className="text-[13px] font-bold text-gray-900 leading-tight">{p.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[11px] font-bold text-primary">{p.total_sessions}회권</span>
                            <span className="text-[10px] text-gray-500">{p.used_sessions}회 사용</span>
                            <span className="text-[10px] font-semibold text-emerald-600">잔여 {p.total_sessions - p.used_sessions}회</span>
                            {p.clinic && <span className="text-[10px] text-gray-400">{p.clinic}</span>}
                          </div>
                        </div>
                      </div>

                      {/* ── 기존 패키지 중복 감지 알림 ── */}
                      {p.existingPackageId && p.selected && (
                        <div className="mx-3.5 mb-2 rounded-lg border border-amber-200 bg-amber-50 p-3 space-y-2">
                          <div className="flex items-start gap-2">
                            <AlertCircle size={14} className="text-amber-600 shrink-0 mt-0.5" />
                            <div className="flex-1">
                              <p className="text-[11px] font-semibold text-amber-700">동일한 패키지가 이미 존재합니다</p>
                              <p className="text-[10px] text-amber-600 mt-0.5">
                                기존: {p.existingPackageName} ({p.existingTotalSessions}회권, {p.existingUsedSessions}회 사용)
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-1.5">
                            <button
                              onClick={() => setPkgs(prev => prev.map((pk, pi) => pi === i ? { ...pk, duplicateAction: 'update' } : pk))}
                              className={cn('flex-1 py-2 px-2 rounded-lg border text-left transition-all',
                                p.duplicateAction === 'update'
                                  ? 'border-blue-300 bg-blue-50'
                                  : 'border-gray-200 bg-white'
                              )}>
                              <p className={cn('text-[11px] font-semibold', p.duplicateAction === 'update' ? 'text-blue-600' : 'text-gray-500')}>기존 패키지 업데이트</p>
                              <p className="text-[9px] text-gray-400">{p.total_sessions}회권 / {p.used_sessions}회 사용으로 변경</p>
                            </button>
                            <button
                              onClick={() => setPkgs(prev => prev.map((pk, pi) => pi === i ? { ...pk, duplicateAction: 'new' } : pk))}
                              className={cn('flex-1 py-2 px-2 rounded-lg border text-left transition-all',
                                p.duplicateAction === 'new'
                                  ? 'border-violet-300 bg-violet-50'
                                  : 'border-gray-200 bg-white'
                              )}>
                              <p className={cn('text-[11px] font-semibold', p.duplicateAction === 'new' ? 'text-violet-600' : 'text-gray-500')}>새로 등록</p>
                              <p className="text-[9px] text-gray-400">별도의 새 시술권으로 추가</p>
                            </button>
                          </div>
                        </div>
                      )}

                      {/* 결제 종류 */}
                      <div className="px-3.5 pb-3 pt-2 border-t border-gray-100">
                        <label className="text-[10px] text-gray-400 mb-1.5 block">결제 종류</label>
                        <div className="flex gap-1.5">
                          {(['포인트', '카드', '현금', '서비스'] as PkgPayMethod[]).map(m => (
                            <button key={m}
                              onClick={() => setPkgs(prev => prev.map((pk, pi) => pi === i ? { ...pk, payMethod: m } : pk))}
                              className={cn('flex-1 py-1.5 rounded-lg text-[11px] font-semibold border transition-all',
                                p.payMethod === m
                                  ? m === '포인트' ? 'border-emerald-300 bg-emerald-50 text-emerald-600'
                                  : m === '카드' ? 'border-blue-300 bg-blue-50 text-blue-600'
                                  : m === '현금' ? 'border-green-300 bg-green-50 text-green-600'
                                  : 'border-gray-300 bg-gray-100 text-gray-500'
                                  : 'border-gray-200 bg-gray-50 text-gray-400'
                              )}>
                              {m}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {bundles.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                    <Package size={11} /> 세트 시술 — 결제내역 1건 + 시술내역 {bundles.reduce((s, b) => s + b.treatments.length, 0)}건 등록
                  </p>
                  {bundles.map((b, i) => (
                    <div key={i} className={cn('rounded-xl border transition-all',
                      b.selected ? 'border-primary/40 bg-primary/5' : 'border-gray-200 bg-gray-50 opacity-50')}>

                      {/* 번들 헤더 */}
                      <div className="flex items-start gap-3 p-3.5">
                        <button onClick={() => toggleBundle(i)}
                          className={cn('w-5 h-5 mt-0.5 rounded-full border-2 shrink-0 flex items-center justify-center transition-all',
                            b.selected ? 'border-primary bg-primary' : 'border-gray-300')}>
                          {b.selected && <div className="w-2 h-2 rounded-full bg-white" />}
                        </button>

                        <div className="flex-1 min-w-0" onClick={() => toggleBundleExpand(i)}>
                          <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/30 font-semibold">세트</span>
                            {b.memo && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500 border border-gray-200">{b.memo}</span>}
                          </div>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {b.treatments.map((t, ti) => (
                              <span key={ti} className="text-[10px] bg-gray-100 border border-gray-200 rounded-md px-1.5 py-0.5 text-gray-600">
                                {t.treatmentName}
                              </span>
                            ))}
                          </div>
                          <p className="text-[11px] text-gray-500 mt-1">
                            {b.date}{b.clinic && ` · ${b.clinic}`}
                            {b.amount_paid != null ? ` · ₩${b.amount_paid.toLocaleString()}` : ' · 금액 미확인'}
                          </p>
                          <p className="text-[10px] text-gray-400 mt-0.5">결제내역 1건 + 시술내역 {b.treatments.length}건</p>
                        </div>

                        <button onClick={() => setBundles(prev => prev.filter((_, idx) => idx !== i))} className="p-1 text-gray-300 hover:text-rose-500 transition-colors mt-0.5" title="삭제">
                          <X size={14} />
                        </button>
                        <button onClick={() => toggleBundleExpand(i)} className="p-1 text-gray-400 mt-0.5">
                          {b.expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>
                      </div>

                      {/* 번들 수정 폼 */}
                      {b.expanded && (
                        <div className="px-3.5 pb-3.5 space-y-2 border-t border-gray-200 pt-3">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-[10px] text-gray-400 mb-1 block">날짜</label>
                              <input type="date" value={b.date} onChange={e => updateBundle(i, 'date', e.target.value)}
                                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-900 focus:outline-none focus:border-primary/50" />
                            </div>
                            <div>
                              <label className="text-[10px] text-gray-400 mb-1 block">세트 금액</label>
                              <input type="number" value={b.amount_paid ?? ''} placeholder="미확인"
                                onChange={e => updateBundle(i, 'amount_paid', e.target.value ? Number(e.target.value) : null)}
                                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-900 focus:outline-none focus:border-primary/50" />
                            </div>
                          </div>
                          <div>
                            <label className="text-[10px] text-gray-400 mb-1 block">병원명</label>
                            <ClinicSearchInput
                              value={b.clinic ?? ''}
                              onChange={v => updateBundle(i, 'clinic', v)}
                              placeholder="병원명"
                              darkMode={false} />
                          </div>
                          <div className="bg-gray-50 rounded-lg p-2 space-y-1">
                            <p className="text-[10px] text-gray-400 mb-1.5">등록될 시술내역</p>
                            {b.treatments.map((t, ti) => (
                              <div key={ti} className="flex items-center gap-2">
                                <span className={cn('text-[9px] px-1 py-0.5 rounded border shrink-0', SKIN_LAYER_COLOR[t.skinLayer])}>{LAYER_LABEL[t.skinLayer]}</span>
                                <span className="text-xs text-gray-700 flex-1">{t.treatmentName}</span>
                                <button
                                  onClick={() => removeBundleTreatment(i, ti)}
                                  className="p-1 rounded-full hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors shrink-0"
                                >
                                  <X size={11} />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* ── 단독 시술 카드 ── */}
              {(parsed?.length ?? 0) > 0 && (
                <div className="space-y-2">
                  {bundles.length > 0 && <p className="text-[11px] text-muted-foreground">단독 시술</p>}
                  {parsed!.map((r, i) => (
                    <div key={i} className={cn('rounded-xl border transition-all',
                      r.selected ? 'border-primary/40 bg-primary/5' : 'border-gray-200 bg-gray-50 opacity-50')}>
                      <div className="flex items-center gap-3 p-3.5">
                        <button onClick={() => toggleSelect(i)}
                          className={cn('w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-all',
                            r.selected ? 'border-primary bg-primary' : 'border-gray-300')}>
                          {r.selected && <div className="w-2 h-2 rounded-full bg-white" />}
                        </button>
                        <div className="flex-1 min-w-0" onClick={() => toggleExpand(i)}>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-sm font-semibold text-gray-900">{r.treatmentName}</span>
                            <span className={cn('text-[10px] px-1.5 py-0.5 rounded-full border', SKIN_LAYER_COLOR[r.skinLayer])}>{LAYER_LABEL[r.skinLayer]}</span>
                            {r.memo && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500 border border-gray-200">{r.memo}</span>}
                          </div>
                          <p className="text-[11px] text-gray-500 mt-0.5">
                            {r.date}{r.clinic && ` · ${r.clinic}`}
                            {r.amount_paid != null ? ` · ₩${r.amount_paid.toLocaleString()}` : ' · 금액 미확인'}
                          </p>
                        </div>
                        <button onClick={() => setParsed(prev => prev!.filter((_, idx) => idx !== i))} className="p-1 text-gray-300 hover:text-rose-500 transition-colors" title="삭제">
                          <X size={14} />
                        </button>
                        <button onClick={() => toggleExpand(i)} className="p-1 text-gray-400">
                          {r.expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>
                      </div>
                      {r.expanded && (
                        <div className="px-3.5 pb-3.5 space-y-2 border-t border-gray-200 pt-3">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-[10px] text-gray-400 mb-1 block">날짜</label>
                              <input type="date" value={r.date} onChange={e => updateField(i, 'date', e.target.value)}
                                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-900 focus:outline-none focus:border-primary/50" />
                            </div>
                            <div>
                              <label className="text-[10px] text-gray-400 mb-1 block">금액</label>
                              <input type="number" value={r.amount_paid ?? ''} placeholder="미확인"
                                onChange={e => updateField(i, 'amount_paid', e.target.value ? Number(e.target.value) : null)}
                                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-900 focus:outline-none focus:border-primary/50" />
                            </div>
                          </div>
                          <div>
                            <label className="text-[10px] text-gray-400 mb-1 block">병원명</label>
                            <ClinicSearchInput
                              value={r.clinic ?? ''}
                              onChange={v => updateField(i, 'clinic', v)}
                              placeholder="병원명"
                              darkMode={false} />
                          </div>
                          <div>
                            <label className="text-[10px] text-gray-400 mb-1 block">시술명</label>
                            <input type="text" value={r.treatmentName} onChange={e => updateField(i, 'treatmentName', e.target.value)}
                              className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-900 focus:outline-none focus:border-primary/50" />
                          </div>
                          <div>
                            <label className="text-[10px] text-gray-400 mb-1 block">태그/메모</label>
                            <input type="text" value={r.memo ?? ''} placeholder="이벤트, 1회체험가 등"
                              onChange={e => updateField(i, 'memo', e.target.value || null)}
                              className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-900 focus:outline-none focus:border-primary/50" />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* 저장 버튼 */}
        {showResults && (
          <div className="p-5 border-t border-gray-200">
            {saved ? (
              <div className="flex items-center justify-center gap-2 py-3 text-emerald-600">
                <CheckCircle size={18} />
                <span className="font-semibold text-sm">저장 완료!</span>
              </div>
            ) : (
              <button onClick={handleSave} disabled={saving || selectedCount === 0 || hasPendingDuplicate}
                className="w-full py-3.5 bg-primary text-primary-foreground font-bold text-sm rounded-xl disabled:opacity-40 flex items-center justify-center gap-2 active:scale-[0.98] transition-transform">
                {saving ? <><Loader2 size={16} className="animate-spin" /> 저장 중...</> : hasPendingDuplicate ? '⚠ 중복 패키지 처리 방법을 선택해주세요' : (
                  <><CheckCircle size={16} /> {selectedCount}건 저장{charges.length > 0 ? ` + 충전 ${charges.length}건` : ''}</>
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
