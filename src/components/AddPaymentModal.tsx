import { useState } from 'react';
import { X, Plus, Loader2, CheckCircle, CreditCard, Coins, Banknote, Gift } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

type PayMethod = '포인트충전' | '카드' | '현금' | '서비스';
type ClinicType = '밴스' | '타의원';

interface Props {
  onClose: () => void;
  onSaved: () => void;
}

const METHOD_CONFIG: Record<PayMethod, { label: string; icon: any; color: string; desc: string }> = {
  '포인트충전': { label: '포인트 충전', icon: Coins,      color: 'border-amber-500/50 bg-amber-500/10 text-amber-400',   desc: '밴스 등 선불 잔액 충전' },
  '카드':       { label: '카드 결제',   icon: CreditCard, color: 'border-blue-500/50 bg-blue-500/10 text-blue-400',       desc: '신용/체크카드 직접 결제' },
  '현금':       { label: '현금 결제',   icon: Banknote,   color: 'border-green-500/50 bg-green-500/10 text-green-400',    desc: '현금 직접 결제' },
  '서비스':     { label: '서비스',      icon: Gift,       color: 'border-white/20 bg-white/5 text-white/50',              desc: '무료 제공' },
};

export default function AddPaymentModal({ onClose, onSaved }: Props) {
  const today = new Date().toISOString().split('T')[0];
  const [date, setDate]               = useState(today);
  const [clinic, setClinic]           = useState('');
  const [clinicType, setClinicType]   = useState<ClinicType>('밴스');
  const [method, setMethod]           = useState<PayMethod>('포인트충전');
  const [amount, setAmount]           = useState('');
  const [description, setDescription] = useState('');
  const [memo, setMemo]               = useState('');
  const [saving, setSaving]           = useState(false);
  const [saved, setSaved]             = useState(false);
  const [error, setError]             = useState<string | null>(null);

  const handleSave = async () => {
    if (!clinic.trim())       { setError('병원명을 입력해주세요.'); return; }
    if (!description.trim())  { setError('내용을 입력해주세요.'); return; }
    if (!amount && method !== '서비스') { setError('금액을 입력해주세요.'); return; }

    setSaving(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('로그인이 필요합니다.');

      const amountNum = method === '서비스' ? 0 : parseInt(amount.replace(/,/g, '')) || 0;

      // 1. payment_records 삽입
      const { error: insertErr } = await supabase.from('payment_records').insert({
        user_id:       user.id,
        date,
        clinic:        clinic.trim(),
        clinic_type:   clinicType,
        treatment_name: description.trim(),
        amount:        amountNum,
        method,
        memo:          memo.trim() || null,
      });
      if (insertErr) throw insertErr;

      // 2. 포인트충전이면 clinic_balances upsert (잔액 증가)
      if (method === '포인트충전' && amountNum > 0) {
        const { data: existing } = await supabase
          .from('clinic_balances')
          .select('balance')
          .eq('user_id', user.id)
          .eq('clinic', clinic.trim())
          .single();

        const newBalance = (existing?.balance || 0) + amountNum;
        await supabase.from('clinic_balances').upsert({
          user_id:    user.id,
          clinic:     clinic.trim(),
          balance:    newBalance,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id,clinic' });
      }

      setSaved(true);
      setTimeout(() => { onSaved(); onClose(); }, 1000);
    } catch (e: any) {
      setError(e.message || '저장 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const formatAmount = (val: string) => {
    const num = val.replace(/[^0-9]/g, '');
    return num ? parseInt(num).toLocaleString() : '';
  };

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

        <div className="flex-1 overflow-y-auto p-5 space-y-5">

          {/* 날짜 */}
          <div>
            <label className="text-[11px] text-white/40 mb-1.5 block">날짜</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#C9A96E]/50" />
          </div>

          {/* 결제 유형 */}
          <div>
            <label className="text-[11px] text-white/40 mb-1.5 block">결제 유형</label>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(METHOD_CONFIG) as PayMethod[]).map(m => {
                const cfg = METHOD_CONFIG[m];
                const Icon = cfg.icon;
                return (
                  <button key={m} onClick={() => setMethod(m)}
                    className={cn('flex items-center gap-2 px-3 py-2.5 rounded-xl border text-left transition-all',
                      method === m ? cfg.color : 'border-white/10 bg-white/3 text-white/40')}>
                    <Icon size={14} className="shrink-0" />
                    <div>
                      <p className="text-xs font-semibold">{cfg.label}</p>
                      <p className="text-[9px] opacity-60">{cfg.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 병원 + 병원유형 */}
          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-2">
              <label className="text-[11px] text-white/40 mb-1.5 block">병원명</label>
              <input type="text" value={clinic} onChange={e => setClinic(e.target.value)}
                placeholder="미금 밴스의원"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#C9A96E]/50" />
            </div>
            <div>
              <label className="text-[11px] text-white/40 mb-1.5 block">구분</label>
              <div className="flex flex-col gap-1">
                {(['밴스', '타의원'] as ClinicType[]).map(t => (
                  <button key={t} onClick={() => setClinicType(t)}
                    className={cn('py-2 rounded-lg text-xs font-medium border transition-all',
                      clinicType === t
                        ? t === '밴스' ? 'bg-[#C9A96E]/20 border-[#C9A96E]/50 text-[#C9A96E]' : 'bg-purple-500/20 border-purple-500/50 text-purple-400'
                        : 'border-white/10 text-white/30')}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 내용 */}
          <div>
            <label className="text-[11px] text-white/40 mb-1.5 block">내용</label>
            <input type="text" value={description} onChange={e => setDescription(e.target.value)}
              placeholder={method === '포인트충전' ? '신규충전' : '세르프 600샷'}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#C9A96E]/50" />
          </div>

          {/* 금액 */}
          {method !== '서비스' && (
            <div>
              <label className="text-[11px] text-white/40 mb-1.5 block">
                금액 (원)
                {method === '포인트충전' && <span className="ml-1.5 text-emerald-400">→ 잔액에 추가됩니다</span>}
              </label>
              <div className="relative">
                <input type="text" value={amount} inputMode="numeric"
                  onChange={e => setAmount(formatAmount(e.target.value))}
                  placeholder="0"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#C9A96E]/50 pr-8" />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-white/30">원</span>
              </div>
            </div>
          )}

          {/* 메모 */}
          <div>
            <label className="text-[11px] text-white/40 mb-1.5 block">메모 (선택)</label>
            <input type="text" value={memo} onChange={e => setMemo(e.target.value)}
              placeholder="이벤트 적용, 1+1 패키지 등"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#C9A96E]/50" />
          </div>

          {/* 에러 */}
          {error && (
            <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-2.5">{error}</p>
          )}
        </div>

        {/* 저장 버튼 */}
        <div className="p-5 border-t border-white/10">
          {saved ? (
            <div className="flex items-center justify-center gap-2 py-3 text-emerald-400">
              <CheckCircle size={18} />
              <span className="font-semibold text-sm">저장 완료!</span>
            </div>
          ) : (
            <button onClick={handleSave} disabled={saving}
              className="w-full py-3.5 bg-[#C9A96E] text-black font-bold text-sm rounded-xl disabled:opacity-40 flex items-center justify-center gap-2 active:scale-[0.98] transition-transform">
              {saving ? <><Loader2 size={16} className="animate-spin" /> 저장 중...</> : <><Plus size={16} /> 결제 내역 추가</>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
