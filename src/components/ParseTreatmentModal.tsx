import { useState, useRef } from 'react';
import { X, Clipboard, ImagePlus, Loader2, CheckCircle, ChevronDown, ChevronUp, Sparkles, AlertCircle, CreditCard, Package } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useRecords } from '@/context/RecordsContext';
import { SkinLayer, BodyArea } from '@/types/skin';

const SKIN_LAYER_COLOR: Record<string, string> = {
  epidermis:    'bg-amber-500/10 text-amber-400 border-amber-500/20',
  dermis:       'bg-blue-500/10 text-blue-400 border-blue-500/20',
  subcutaneous: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
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
  // UI state
  selected: boolean;
  expanded: boolean;
}

interface ChargeRecord {
  date: string;
  amount: number;
  clinic: string | null;
  label: string;
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
  const fileRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleParse = async () => {
    setLoading(true); setError(null);
    setParsed(null); setBundles([]); setCharges([]);

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

      const hasRecords  = data?.records?.length  > 0;
      const hasBundles  = data?.bundles?.length  > 0;
      const hasCharges  = data?.charges?.length  > 0;

      if (!hasRecords && !hasBundles && !hasCharges) {
        if (data?.hint === 'image_credit_low') {
          setTab('text');
          setError('이미지 분석 크레딧 부족 — 텍스트 탭에서 문자 내용을 붙여넣어 주세요.');
        } else {
          setError(data?.error || '시술 정보를 찾지 못했습니다.');
        }
        setLoading(false); return;
      }

      if (hasCharges) setCharges(data.charges);

      if (hasBundles) {
        setBundles(data.bundles.map((b: any) => ({
          ...b,
          clinic: b.clinic || '',
          treatments: (b.treatments || []).map((t: any) => ({
            ...t, clinic: t.clinic || b.clinic || '',
            skinLayer: t.skinLayer || 'epidermis',
            bodyArea: t.bodyArea || 'face',
          })),
          selected: true,
          expanded: true,
        })));
      }

      setParsed(
        hasRecords
          ? data.records.map((r: any) => ({
              ...r,
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

  // single record 토글
  const toggleSelect  = (i: number) => setParsed(prev => prev!.map((r, idx) => idx === i ? { ...r, selected: !r.selected } : r));
  const toggleExpand  = (i: number) => setParsed(prev => prev!.map((r, idx) => idx === i ? { ...r, expanded: !r.expanded } : r));
  const updateField   = (i: number, field: string, value: any) => setParsed(prev => prev!.map((r, idx) => idx === i ? { ...r, [field]: value } : r));

  // bundle 토글
  const toggleBundle        = (i: number) => setBundles(prev => prev.map((b, idx) => idx === i ? { ...b, selected: !b.selected } : b));
  const toggleBundleExpand  = (i: number) => setBundles(prev => prev.map((b, idx) => idx === i ? { ...b, expanded: !b.expanded } : b));
  const updateBundle        = (i: number, field: string, value: any) => setBundles(prev => prev.map((b, idx) => idx === i ? { ...b, [field]: value } : b));

  const handleSave = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setSaving(true);

    // 1. 단독 시술 저장
    const toSave = (parsed || []).filter(r => r.selected);
    for (const r of toSave) {
      await addRecord({
        date: r.date, packageId: '', treatmentName: r.treatmentName,
        skinLayer: r.skinLayer, bodyArea: r.bodyArea,
        clinic: r.clinic || '', satisfaction: undefined, notes: undefined,
        memo: r.memo || undefined, amount_paid: r.amount_paid ?? undefined,
      });
    }

    // 2. 번들 저장
    const selectedBundles = bundles.filter(b => b.selected);
    for (const b of selectedBundles) {
      // 2a. payment_records에 묶음 결제 저장
      await supabase.from('payment_records').insert({
        user_id:        user.id,
        date:           b.date,
        clinic:         b.clinic || '',
        clinic_type:    '밴스',   // 기본값, 추후 수정 가능
        treatment_name: b.bundleName,
        amount:         b.amount_paid || 0,
        method:         '시술결제',
        memo:           b.memo || null,
      });

      // 2b. treatment_records에 개별 시술 저장 (가격 없음)
      for (const t of b.treatments) {
        await addRecord({
          date: t.date, packageId: '', treatmentName: t.treatmentName,
          skinLayer: t.skinLayer, bodyArea: t.bodyArea,
          clinic: t.clinic || b.clinic || '', satisfaction: undefined,
          notes: undefined, memo: t.memo || b.memo || undefined,
          amount_paid: undefined,  // 번들이므로 개별 가격 없음
        });
      }
    }

    // 3. 신규충전 → clinic_balances 업데이트 + payment_records 저장
    for (const c of charges) {
      if (!c.clinic || c.amount <= 0) continue;

      // 기존 잔액 조회
      const { data: existing } = await supabase
        .from('clinic_balances')
        .select('balance')
        .eq('user_id', user.id)
        .eq('clinic', c.clinic)
        .maybeSingle();

      const newBalance = (existing?.balance || 0) + c.amount;

      // 잔액 upsert
      await supabase.from('clinic_balances').upsert({
        user_id:    user.id,
        clinic:     c.clinic,
        balance:    newBalance,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,clinic' });

      // payment_records에도 충전 기록 저장
      await supabase.from('payment_records').insert({
        user_id:        user.id,
        date:           c.date,
        clinic:         c.clinic,
        clinic_type:    '밴스',
        treatment_name: c.label,
        amount:         c.amount,
        method:         '포인트충전',
        memo:           null,
      });
    }

    setSaving(false); setSaved(true);
    setTimeout(onClose, 1200);
  };

  const selectedCount  = (parsed?.filter(r => r.selected).length ?? 0) + bundles.filter(b => b.selected).length;
  const showResults    = parsed !== null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-[#111] rounded-t-3xl max-h-[90vh] flex flex-col">
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-white/20" />
        </div>
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-[#C9A96E]" />
            <span className="font-bold text-sm">문자/카톡으로 자동 등록</span>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10">
            <X size={16} className="text-white/50" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {!showResults ? (
            <div className="p-5 space-y-4">
              {/* 탭 */}
              <div className="flex bg-white/5 rounded-xl p-1 gap-1">
                {(['text', 'image'] as Tab[]).map(t => (
                  <button key={t} onClick={() => setTab(t)}
                    className={cn('flex-1 py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5',
                      tab === t ? 'bg-[#C9A96E] text-black' : 'text-white/50 hover:text-white/80')}>
                    {t === 'text' ? <><Clipboard size={13} /> 문자/카톡 붙여넣기</> : <><ImagePlus size={13} /> 이미지 업로드</>}
                  </button>
                ))}
              </div>

              {tab === 'text' && (
                <div className="space-y-3">
                  <p className="text-[11px] text-white/40">병원에서 받은 문자나 카톡 내용을 그대로 붙여넣으세요</p>
                  <textarea value={text} onChange={e => setText(e.target.value)}
                    placeholder={"[Web발신]\n[미금 밴스의원]\n[2026-02-17] -1,518,000원 ★E_세르프 600샷\n[2026-01-29] -108,900원 ★1월 한정이벤트_엑셀V레이저+피코토닝+관리+진정팩"}
                    className="w-full h-40 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white/80 placeholder:text-white/20 resize-none focus:outline-none focus:border-[#C9A96E]/50" />
                </div>
              )}

              {tab === 'image' && (
                <div className="space-y-3">
                  <p className="text-[11px] text-white/40">카카오톡 또는 문자 스크린샷을 업로드하세요</p>
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
                  {imagePreview ? (
                    <div className="relative rounded-xl overflow-hidden">
                      <img src={imagePreview} alt="preview" className="w-full max-h-48 object-contain bg-white/5" />
                      <button onClick={() => { setImageFile(null); setImagePreview(null); }}
                        className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-full">
                        <X size={12} className="text-white" />
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => fileRef.current?.click()}
                      className="w-full h-36 border-2 border-dashed border-white/15 rounded-xl flex flex-col items-center justify-center gap-2 hover:border-[#C9A96E]/40 transition-colors">
                      <ImagePlus size={24} className="text-white/30" />
                      <span className="text-xs text-white/40">탭하여 이미지 선택</span>
                    </button>
                  )}
                  {imagePreview && (
                    <textarea value={text} onChange={e => setText(e.target.value)}
                      placeholder="병원명 등 보충 정보 (선택사항)"
                      className="w-full h-16 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white/80 placeholder:text-white/20 resize-none focus:outline-none focus:border-[#C9A96E]/50" />
                  )}
                </div>
              )}

              {error && (
                <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3">
                  <AlertCircle size={14} className="text-rose-400 shrink-0" />
                  <p className="text-xs text-rose-400">{error}</p>
                </div>
              )}

              <button onClick={handleParse} disabled={loading}
                className="w-full py-3.5 bg-[#C9A96E] text-black font-bold text-sm rounded-xl active:scale-[0.98] transition-transform disabled:opacity-50 flex items-center justify-center gap-2">
                {loading ? <><Loader2 size={16} className="animate-spin" /> 분석 중...</> : <><Sparkles size={16} /> 시술 정보 자동 추출</>}
              </button>
            </div>
          ) : (
            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-white/60">
                  {bundles.length > 0 && `세트 ${bundles.length}개 · `}
                  {(parsed?.length ?? 0)}개 시술 · {selectedCount}개 선택
                </p>
                <div className="flex items-center gap-2">
                  {parseSource === 'keyword_fallback' && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">키워드 파싱</span>
                  )}
                  <button onClick={() => { setParsed(null); setBundles([]); setCharges([]); }} className="text-xs text-[#C9A96E]">다시 입력</button>
                </div>
              </div>

              {/* 충전 배너 */}
              {charges.map((c, i) => (
                <div key={i} className="flex items-center gap-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-3.5 py-2.5">
                  <CreditCard size={14} className="text-emerald-400 shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-emerald-400">{c.label} +{c.amount.toLocaleString()}원</p>
                    <p className="text-[10px] text-white/40">{c.date}{c.clinic && ` · ${c.clinic}`} · 잔액에 자동 반영됩니다</p>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0">저장됨</span>
                </div>
              ))}

              {/* ── 번들 카드 ── */}
              {bundles.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[11px] text-white/40 flex items-center gap-1.5">
                    <Package size={11} /> 세트 시술 — 결제내역 1건 + 시술내역 {bundles.reduce((s, b) => s + b.treatments.length, 0)}건 등록
                  </p>
                  {bundles.map((b, i) => (
                    <div key={i} className={cn('rounded-xl border transition-all',
                      b.selected ? 'border-[#C9A96E]/40 bg-[#C9A96E]/5' : 'border-white/10 bg-white/3 opacity-50')}>

                      {/* 번들 헤더 */}
                      <div className="flex items-start gap-3 p-3.5">
                        <button onClick={() => toggleBundle(i)}
                          className={cn('w-5 h-5 mt-0.5 rounded-full border-2 shrink-0 flex items-center justify-center transition-all',
                            b.selected ? 'border-[#C9A96E] bg-[#C9A96E]' : 'border-white/30')}>
                          {b.selected && <div className="w-2 h-2 rounded-full bg-black" />}
                        </button>

                        <div className="flex-1 min-w-0" onClick={() => toggleBundleExpand(i)}>
                          <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#C9A96E]/20 text-[#C9A96E] border border-[#C9A96E]/30 font-semibold">세트</span>
                            {b.memo && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/5 text-white/40 border border-white/10">{b.memo}</span>}
                          </div>
                          {/* 세트 구성 표시 */}
                          <div className="flex flex-wrap gap-1 mt-1">
                            {b.treatments.map((t, ti) => (
                              <span key={ti} className="text-[10px] bg-white/8 border border-white/10 rounded-md px-1.5 py-0.5 text-white/70">
                                {t.treatmentName}
                              </span>
                            ))}
                          </div>
                          <p className="text-[11px] text-white/50 mt-1">
                            {b.date}{b.clinic && ` · ${b.clinic}`}
                            {b.amount_paid != null ? ` · ₩${b.amount_paid.toLocaleString()}` : ' · 금액 미확인'}
                          </p>
                          <p className="text-[10px] text-white/30 mt-0.5">결제내역 1건 + 시술내역 {b.treatments.length}건</p>
                        </div>

                        <button onClick={() => toggleBundleExpand(i)} className="p-1 text-white/30 mt-0.5">
                          {b.expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>
                      </div>

                      {/* 번들 수정 폼 */}
                      {b.expanded && (
                        <div className="px-3.5 pb-3.5 space-y-2 border-t border-white/10 pt-3">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-[10px] text-white/40 mb-1 block">날짜</label>
                              <input type="date" value={b.date} onChange={e => updateBundle(i, 'date', e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#C9A96E]/50" />
                            </div>
                            <div>
                              <label className="text-[10px] text-white/40 mb-1 block">세트 금액</label>
                              <input type="number" value={b.amount_paid ?? ''} placeholder="미확인"
                                onChange={e => updateBundle(i, 'amount_paid', e.target.value ? Number(e.target.value) : null)}
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#C9A96E]/50" />
                            </div>
                          </div>
                          <div>
                            <label className="text-[10px] text-white/40 mb-1 block">병원명</label>
                            <input type="text" value={b.clinic ?? ''} placeholder="병원명"
                              onChange={e => updateBundle(i, 'clinic', e.target.value)}
                              className="w-full bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#C9A96E]/50" />
                          </div>
                          {/* 개별 시술 목록 확인 */}
                          <div className="bg-white/3 rounded-lg p-2 space-y-1">
                            <p className="text-[10px] text-white/30 mb-1.5">등록될 시술내역</p>
                            {b.treatments.map((t, ti) => (
                              <div key={ti} className="flex items-center gap-2">
                                <span className={cn('text-[9px] px-1 py-0.5 rounded border shrink-0', SKIN_LAYER_COLOR[t.skinLayer])}>{LAYER_LABEL[t.skinLayer]}</span>
                                <span className="text-xs text-white/70">{t.treatmentName}</span>
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
                  {bundles.length > 0 && <p className="text-[11px] text-white/40">단독 시술</p>}
                  {parsed!.map((r, i) => (
                    <div key={i} className={cn('rounded-xl border transition-all',
                      r.selected ? 'border-[#C9A96E]/40 bg-[#C9A96E]/5' : 'border-white/10 bg-white/3 opacity-50')}>
                      <div className="flex items-center gap-3 p-3.5">
                        <button onClick={() => toggleSelect(i)}
                          className={cn('w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-all',
                            r.selected ? 'border-[#C9A96E] bg-[#C9A96E]' : 'border-white/30')}>
                          {r.selected && <div className="w-2 h-2 rounded-full bg-black" />}
                        </button>
                        <div className="flex-1 min-w-0" onClick={() => toggleExpand(i)}>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-sm font-semibold">{r.treatmentName}</span>
                            <span className={cn('text-[10px] px-1.5 py-0.5 rounded-full border', SKIN_LAYER_COLOR[r.skinLayer])}>{LAYER_LABEL[r.skinLayer]}</span>
                            {r.memo && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/5 text-white/40 border border-white/10">{r.memo}</span>}
                          </div>
                          <p className="text-[11px] text-white/50 mt-0.5">
                            {r.date}{r.clinic && ` · ${r.clinic}`}
                            {r.amount_paid != null ? ` · ₩${r.amount_paid.toLocaleString()}` : ' · 금액 미확인'}
                          </p>
                        </div>
                        <button onClick={() => toggleExpand(i)} className="p-1 text-white/30">
                          {r.expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>
                      </div>
                      {r.expanded && (
                        <div className="px-3.5 pb-3.5 space-y-2 border-t border-white/10 pt-3">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-[10px] text-white/40 mb-1 block">날짜</label>
                              <input type="date" value={r.date} onChange={e => updateField(i, 'date', e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#C9A96E]/50" />
                            </div>
                            <div>
                              <label className="text-[10px] text-white/40 mb-1 block">금액</label>
                              <input type="number" value={r.amount_paid ?? ''} placeholder="미확인"
                                onChange={e => updateField(i, 'amount_paid', e.target.value ? Number(e.target.value) : null)}
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#C9A96E]/50" />
                            </div>
                          </div>
                          <div>
                            <label className="text-[10px] text-white/40 mb-1 block">병원명</label>
                            <input type="text" value={r.clinic ?? ''} placeholder="병원명"
                              onChange={e => updateField(i, 'clinic', e.target.value)}
                              className="w-full bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#C9A96E]/50" />
                          </div>
                          <div>
                            <label className="text-[10px] text-white/40 mb-1 block">시술명</label>
                            <input type="text" value={r.treatmentName} onChange={e => updateField(i, 'treatmentName', e.target.value)}
                              className="w-full bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#C9A96E]/50" />
                          </div>
                          <div>
                            <label className="text-[10px] text-white/40 mb-1 block">태그/메모</label>
                            <input type="text" value={r.memo ?? ''} placeholder="이벤트, 1회체험가 등"
                              onChange={e => updateField(i, 'memo', e.target.value || null)}
                              className="w-full bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#C9A96E]/50" />
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
          <div className="p-5 border-t border-white/10">
            {saved ? (
              <div className="flex items-center justify-center gap-2 py-3 text-emerald-400">
                <CheckCircle size={18} />
                <span className="font-semibold text-sm">저장 완료!</span>
              </div>
            ) : (
              <button onClick={handleSave} disabled={saving || selectedCount === 0}
                className="w-full py-3.5 bg-[#C9A96E] text-black font-bold text-sm rounded-xl disabled:opacity-40 flex items-center justify-center gap-2 active:scale-[0.98] transition-transform">
                {saving ? <><Loader2 size={16} className="animate-spin" /> 저장 중...</> : (
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
