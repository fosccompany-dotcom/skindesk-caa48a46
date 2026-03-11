import { useState } from 'react';
import { X, Plus, Loader2, CheckCircle, CreditCard, Coins, Banknote, Gift, Package } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import ClinicSearchInput from './ClinicSearchInput';
import { processCharge, processPackagePurchase } from '@/lib/clinicPayments';

/**
 * AddPaymentModal — 수동 결제/포인트 내역 추가
 *
 * 유형별 DB 처리 규칙:
 * ┌──────────┬──────────────────┬──────────────────────┬────────────────┐
 * │ 유형     │ payment_records  │ point_transactions   │ 기타           │
 * ├──────────┼──────────────────┼──────────────────────┼────────────────┤
 * │ 포인트충전│ ✅ cash_payment  │ ✅ charge            │ 잔액 +         │
 * │ 시술권구매│ ❌ 저장 안 함   │ ✅ package_purchase  │ 시술권 생성    │
 * │ 카드결제 │ ✅ cash_payment  │ ❌                   │ 잔액 변동 없음 │
 * │ 현금결제 │ ✅ cash_payment  │ ❌                   │ 잔액 변동 없음 │
 * │ 서비스   │ ✅ (기록용)      │ ❌                   │ 잔액 변동 없음 │
 * └──────────┴──────────────────┴──────────────────────┴────────────────┘
 */

type PayType = '포인트충전' | '시술권구매' | '카드' | '현금' | '서비스';

const TYPE_CFG: Record<PayType, { label: string; icon: any; color: string; desc: string }> = {
  '포인트충전': { label: '포인트 충전',  icon: Coins,      color: 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400', desc: '카드/현금 → 선불 잔액' },
  '시술권구매': { label: '시술권 구매',  icon: Package,    color: 'border-indigo-500/50 bg-indigo-500/10 text-indigo-400',   desc: '포인트로 N회권 구매' },
  '카드':       { label: '카드 직접결제',icon: CreditCard, color: 'border-blue-500/50 bg-blue-500/10 text-blue-400',         desc: '카드 단건 결제 기록' },
  '현금':       { label: '현금 직접결제',icon: Banknote,   color: 'border-amber-500/50 bg-amber-500/10 text-amber-400',      desc: '현금 단건 결제 기록' },
  '서비스':     { label: '서비스',       icon: Gift,       color: 'border-white/20 bg-white/5 text-white/50',                desc: '무료 제공 기록' },
};

interface Props { onClose: () => void; onSaved: () => void; }

export default function AddPaymentModal({ onClose, onSaved }: Props) {
  const today = new Date().toISOString().split('T')[0];
  const [date, setDate]             = useState(today);
  const [clinic, setClinic]         = useState('');
  const [type, setType]             = useState<PayType>('포인트충전');
  const [description, setDesc]      = useState('');
  const [paidAmt, setPaidAmt]       = useState('');    // 실결제금액
  const [chargedAmt, setChargedAmt] = useState('');   // 충전금액 (포인트충전만)
  const [sessions, setSessions]     = useState('');    // 회수 (시술권구매만)
  const [chargeMethod, setChargeMethod] = useState<'카드' | '현금'>('카드');
  const [memo, setMemo]             = useState('');
  const [saving, setSaving]         = useState(false);
  const [saved, setSaved]           = useState(false);
  const [error, setError]           = useState<string | null>(null);

  const fmt = (v: string) => { const n = v.replace(/[^0-9]/g, ''); return n ? parseInt(n).toLocaleString() : ''; };
  const num = (v: string) => parseInt(v.replace(/,/g, '')) || 0;

  const handleSave = async () => {
    setError(null);
    if (!clinic.trim())      { setError('병원명을 입력해주세요.'); return; }
    if (!description.trim()) { setError('내용을 입력해주세요.'); return; }
    if (type !== '서비스' && !paidAmt) { setError('금액을 입력해주세요.'); return; }
    if (type === '시술권구매' && !sessions) { setError('시술 횟수를 입력해주세요.'); return; }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('로그인이 필요합니다.');

      // ── 포인트 충전 (플로우 1) ─────────────────────────────────
      if (type === '포인트충전') {
        const paid    = num(paidAmt);
        const charged = chargedAmt ? num(chargedAmt) : paid;
        await processCharge({
          userId: user.id, date, clinic: clinic.trim(),
          paidAmount: paid, chargedAmount: charged,
          method: chargeMethod,
          description: description.trim(), memo: memo || undefined,
        });
      }

      // ── 시술권 구매 (플로우 2) — payment_records 저장 안 함 ────
      else if (type === '시술권구매') {
        await processPackagePurchase({
          userId: user.id, date, clinic: clinic.trim(),
          packageName:   description.trim(),
          totalSessions: parseInt(sessions) || 1,
          purchasePrice: num(paidAmt),
          memo: memo || undefined,
        });
      }

      // ── 카드/현금 직접결제 — payment_records 기록만 ────────────
      else if (type === '카드' || type === '현금') {
        const { error: e } = await supabase.from('payment_records').insert({
          user_id: user.id, date, clinic: clinic.trim(), clinic_type: '밴스',
          treatment_name: description.trim(), amount: num(paidAmt),
          method: type, record_type: 'cash_payment', memo: memo || null,
        });
        if (e) throw e;
      }

      // ── 서비스 — 기록만 ────────────────────────────────────────
      else {
        const { error: e } = await supabase.from('payment_records').insert({
          user_id: user.id, date, clinic: clinic.trim(), clinic_type: '밴스',
          treatment_name: description.trim(), amount: 0,
          method: '서비스', record_type: 'cash_payment', memo: memo || null,
        });
        if (e) throw e;
      }

      setSaved(true);
      setTimeout(() => { onSaved(); onClose(); }, 900);
    } catch (e: any) {
      setError(e.message || '저장 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const isCharge = type === '포인트충전';
  const isPkg    = type === '시술권구매';

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-[#111] rounded-t-3xl max-h-[90vh] flex flex-col">
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-white/20" />
        </div>
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <CreditCard size={16} className="text-[#C9A96E]" />
            <span className="font-bold text-sm">결제 내역 추가</span>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10">
            <X size={16} className="text-white/50" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">

          {/* 결제 유형 */}
          <div>
            <label className="text-[11px] text-white/40 mb-1.5 block">결제 유형</label>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(TYPE_CFG) as PayType[]).map(t => {
                const { label, icon: Icon, color, desc } = TYPE_CFG[t];
                return (
                  <button key={t} onClick={() => { setType(t); setError(null); }}
                    className={cn('flex items-center gap-2 px-3 py-2.5 rounded-xl border text-left transition-all',
                      type === t ? color : 'border-white/10 bg-white/3 text-white/40')}>
                    <Icon size={14} className="shrink-0" />
                    <div><p className="text-xs font-semibold">{label}</p><p className="text-[9px] opacity-60">{desc}</p></div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 날짜 */}
          <div>
            <label className="text-[11px] text-white/40 mb-1.5 block">날짜</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#C9A96E]/50 [color-scheme:dark]" />
          </div>

          {/* 병원 */}
          <div>
            <label className="text-[11px] text-white/40 mb-1.5 block">병원명</label>
            <ClinicSearchInput value={clinic} onChange={setClinic} placeholder="미금 밴스의원" darkMode />
          </div>

          {/* 내용 */}
          <div>
            <label className="text-[11px] text-white/40 mb-1.5 block">
              {isPkg ? '시술권 이름' : '내용'}
            </label>
            <input type="text" value={description} onChange={e => setDesc(e.target.value)}
              placeholder={isCharge ? '신규충전' : isPkg ? 'Premium 패키지 10회' : '슈링크 200샷'}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#C9A96E]/50" />
          </div>

          {/* 금액 */}
          {type !== '서비스' && (
            <div className={isCharge ? 'space-y-3' : ''}>
              {/* 결제수단 (포인트충전) */}
              {isCharge && (
                <div>
                  <label className="text-[11px] text-white/40 mb-1.5 block">결제 수단</label>
                  <div className="flex gap-2">
                    {(['카드', '현금'] as const).map(m => (
                      <button key={m} onClick={() => setChargeMethod(m)}
                        className={cn('flex-1 py-2 rounded-xl border text-xs font-semibold transition-all',
                          chargeMethod === m ? 'border-[#C9A96E]/50 bg-[#C9A96E]/10 text-[#C9A96E]' : 'border-white/10 text-white/30')}>
                        {m}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className={isCharge ? 'grid grid-cols-2 gap-3' : ''}>
                <div>
                  <label className="text-[11px] text-white/40 mb-1.5 block">
                    {isCharge ? '실결제금액 (원)' : isPkg ? '구매금액 (포인트)' : '금액 (원)'}
                  </label>
                  <div className="relative">
                    <input type="text" inputMode="numeric" value={paidAmt}
                      onChange={e => setPaidAmt(fmt(e.target.value))} placeholder="0"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#C9A96E]/50 pr-8" />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-white/30">원</span>
                  </div>
                </div>

                {/* 충전금액 (포인트충전만) */}
                {isCharge && (
                  <div>
                    <label className="text-[11px] mb-1.5 block">
                      <span className="text-emerald-400">충전금액</span>
                      <span className="text-white/30 ml-1">(잔액 반영)</span>
                    </label>
                    <div className="relative">
                      <input type="text" inputMode="numeric" value={chargedAmt}
                        onChange={e => setChargedAmt(fmt(e.target.value))} placeholder={paidAmt || '0'}
                        className="w-full bg-emerald-500/5 border border-emerald-500/30 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-emerald-500/60 pr-8" />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-white/30">원</span>
                    </div>
                    {paidAmt && chargedAmt && num(paidAmt) !== num(chargedAmt) && (
                      <p className="text-[10px] text-emerald-400 mt-1">
                        +{(num(chargedAmt) - num(paidAmt)).toLocaleString()}원 보너스
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 시술 횟수 (시술권구매만) */}
          {isPkg && (
            <div>
              <label className="text-[11px] text-white/40 mb-1.5 block">시술 횟수</label>
              <input type="number" inputMode="numeric" value={sessions}
                onChange={e => setSessions(e.target.value)} placeholder="10"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#C9A96E]/50" />
            </div>
          )}

          {/* 메모 */}
          <div>
            <label className="text-[11px] text-white/40 mb-1.5 block">메모 (선택)</label>
            <input type="text" value={memo} onChange={e => setMemo(e.target.value)}
              placeholder="이벤트 적용, 1+1 등"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#C9A96E]/50" />
          </div>

          {/* 안내 */}
          <div className="rounded-xl bg-white/3 border border-white/8 px-4 py-2.5 text-[10px] text-white/25 leading-relaxed">
            {isCharge && '💳 실결제 → payment_records / 충전 → point_transactions(charge) + 잔액 반영'}
            {isPkg    && '🎫 포인트 잔액 차감 → point_transactions(package_purchase) + 시술권 등록. 결제내역에는 표시 안 됨'}
            {(type === '카드' || type === '현금') && '📋 결제기록만 저장. 잔액 변동 없음'}
            {type === '서비스' && '🎁 무료 제공 기록. 잔액 변동 없음'}
          </div>

          {error && (
            <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-2.5">{error}</p>
          )}
        </div>

        <div className="p-5 border-t border-white/10">
          {saved ? (
            <div className="flex items-center justify-center gap-2 py-3 text-emerald-400">
              <CheckCircle size={18} /><span className="font-semibold text-sm">저장 완료!</span>
            </div>
          ) : (
            <button onClick={handleSave} disabled={saving}
              className="w-full py-3.5 bg-[#C9A96E] text-black font-bold text-sm rounded-xl disabled:opacity-40 flex items-center justify-center gap-2 active:scale-[0.98] transition-transform">
              {saving ? <><Loader2 size={16} className="animate-spin" />저장 중...</> : <><Plus size={16} />추가</>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
