import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Plus, Loader2, CheckCircle, CreditCard, Coins, Banknote, Gift, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import ClinicSearchInput, { ClinicPlace } from './ClinicSearchInput';
import { extractDistrict } from '@/lib/utils';
import { PaymentMethodKey, getMethodLabel } from '@/lib/paymentMethodUtils';
import { useLanguage } from '@/i18n/LanguageContext';

type PayMethod = 'charge' | 'card' | 'cash' | 'service';
type ClinicType = '밴스' | '타의원';

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

const METHOD_CONFIG: Record<PayMethod, { icon: any; lightColor: string; descKo: string; descEn: string; descZh: string }> = {
  charge:  { icon: Coins,      lightColor: 'border-amber-300 bg-amber-50 text-amber-700',   descKo: '밴스 등 선불 잔액 충전', descEn: 'Prepaid balance charge', descZh: '预付余额充值' },
  card:    { icon: CreditCard, lightColor: 'border-blue-300 bg-blue-50 text-blue-700',       descKo: '신용/체크카드 직접 결제', descEn: 'Credit/debit card', descZh: '信用卡/借记卡' },
  cash:    { icon: Banknote,   lightColor: 'border-green-300 bg-green-50 text-green-700',    descKo: '현금 직접 결제', descEn: 'Cash payment', descZh: '现金支付' },
  service: { icon: Gift,       lightColor: 'border-gray-300 bg-gray-50 text-gray-600',       descKo: '무료 제공', descEn: 'Free service', descZh: '免费服务' },
};

export default function AddPaymentModal({ open, onClose, onSaved }: Props) {
  const { language } = useLanguage();
  const today = new Date().toISOString().split('T')[0];
  const [date, setDate]               = useState(today);
  const [clinic, setClinic]           = useState('');
  const [clinicKakaoId, setClinicKakaoId] = useState<string | null>(null);
  const [clinicDistrict, setClinicDistrict] = useState<string | null>(null);
  const [clinicAddress, setClinicAddress] = useState<string | null>(null);
  const [clinicType, setClinicType]   = useState<ClinicType>('밴스');
  const [method, setMethod]           = useState<PayMethod>('charge');
  const [amount, setAmount]           = useState('');
  const [chargedAmount, setChargedAmount] = useState('');
  const [description, setDescription] = useState('');
  const [memo, setMemo]               = useState('');
  const [saving, setSaving]           = useState(false);
  const [saved, setSaved]             = useState(false);
  const [error, setError]             = useState<string | null>(null);

  const reset = () => {
    setDate(today); setClinic(''); setClinicKakaoId(null); setClinicDistrict(null); setClinicAddress(null);
    setClinicType('밴스'); setMethod('charge');
    setAmount(''); setChargedAmount(''); setDescription(''); setMemo('');
    setSaving(false); setSaved(false); setError(null);
  };

  const handleClose = () => { reset(); onClose(); };

  const handleSave = async () => {
    if (!clinic.trim())       { setError('병원명을 입력해주세요.'); return; }
    if (!amount && method !== 'service') { setError('금액을 입력해주세요.'); return; }

    setSaving(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('로그인이 필요합니다.');

      const amountNum = method === 'service' ? 0 : parseInt(amount.replace(/,/g, '')) || 0;
      const chargedNum = method === 'charge'
        ? (chargedAmount ? parseInt(chargedAmount.replace(/,/g, '')) || amountNum : amountNum)
        : amountNum;

      // DB에 영문 key로 저장
      const { error: insertErr } = await supabase.from('payment_records').insert({
        user_id:        user.id,
        date,
        clinic:         clinic.trim(),
        clinic_type:    clinicType,
        clinic_kakao_id: clinicKakaoId,
        clinic_district: clinicDistrict,
        treatment_name: description.trim() || getMethodLabel(method, language),
        amount:         amountNum,
        charged_amount: method === 'charge' ? chargedNum : null,
        method,
        memo:           memo.trim() || null,
      });
      if (insertErr) throw insertErr;

      const clinicKey = clinic.trim();
      if (method === 'charge' && chargedNum > 0) {
        const { data: existing } = await supabase
          .from('clinic_balances').select('balance')
          .eq('user_id', user.id).eq('clinic', clinicKey).single();
        await supabase.from('clinic_balances').upsert({
          user_id:    user.id,
          clinic:     clinicKey,
          clinic_kakao_id: clinicKakaoId,
          balance:    (existing?.balance || 0) + chargedNum,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id,clinic' });
      }

      setSaved(true);
      setTimeout(() => { onSaved(); handleClose(); }, 1000);
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

  const inputClass = "w-full bg-background border border-input rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1";

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-white border border-gray-200 text-gray-900 max-w-md w-[92vw] max-h-[88vh] overflow-y-auto p-0">

        {/* 헤더 */}
        <DialogHeader className="px-5 pt-5 pb-3 border-b border-gray-200 sticky top-0 bg-white z-10">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-base font-semibold flex items-center gap-2">
              <CreditCard size={16} className="text-primary" />
              {language === 'en' ? 'Add Payment' : language === 'zh' ? '添加支付记录' : '결제 내역 추가'}
            </DialogTitle>
            <button onClick={handleClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
              <X size={18} className="text-gray-400" />
            </button>
          </div>
        </DialogHeader>

        <div className="p-5 space-y-5">

          {/* 날짜 */}
          <div>
            <label className="text-[11px] text-muted-foreground mb-1.5 block font-medium">
              {language === 'en' ? 'Date' : language === 'zh' ? '日期' : '날짜'}
            </label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} className={inputClass} />
          </div>

          {/* 결제 유형 */}
          <div>
            <label className="text-[11px] text-muted-foreground mb-1.5 block font-medium">
              {language === 'en' ? 'Payment Type' : language === 'zh' ? '支付类型' : '결제 유형'}
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(METHOD_CONFIG) as PayMethod[]).map(m => {
                const cfg = METHOD_CONFIG[m];
                const Icon = cfg.icon;
                const label = getMethodLabel(m, language);
                const desc = language === 'en' ? cfg.descEn : language === 'zh' ? cfg.descZh : cfg.descKo;
                return (
                  <button key={m} onClick={() => setMethod(m)}
                    className={cn('flex items-center gap-2 px-3 py-2.5 rounded-xl border text-left transition-all',
                      method === m ? cfg.lightColor : 'border-gray-200 bg-gray-50/50 text-muted-foreground')}>
                    <Icon size={14} className="shrink-0" />
                    <div>
                      <p className="text-xs font-semibold">{label}</p>
                      <p className="text-[9px] opacity-60">{desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 병원 + 병원유형 */}
          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-2">
              <label className="text-[11px] text-muted-foreground mb-1.5 block font-medium">
                {language === 'en' ? 'Clinic' : language === 'zh' ? '医院' : '병원명'}
              </label>
              <ClinicSearchInput
                value={clinic}
                onChange={(val) => {
                  setClinic(val);
                  setClinicKakaoId(null);
                  setClinicDistrict(null);
                  setClinicAddress(null);
                }}
                onSelectPlace={(place) => {
                  setClinic(place.name);
                  setClinicKakaoId(place.kakao_id || null);
                  setClinicAddress(place.road_address || place.address || null);
                  setClinicDistrict(extractDistrict(place.road_address || place.address || '') || null);
                }}
                placeholder="미금 밴스의원" />
            </div>
            <div>
              <label className="text-[11px] text-muted-foreground mb-1.5 block font-medium">
                {language === 'en' ? 'Type' : language === 'zh' ? '类型' : '구분'}
              </label>
              <div className="flex flex-col gap-1">
                {(['밴스', '타의원'] as ClinicType[]).map(t => (
                  <button key={t} onClick={() => setClinicType(t)}
                    className={cn('py-2 rounded-lg text-xs font-medium border transition-all',
                      clinicType === t
                        ? t === '밴스' ? 'bg-primary/10 border-primary/50 text-primary' : 'bg-purple-100 border-purple-300 text-purple-600'
                        : 'border-gray-200 text-muted-foreground')}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 내용 */}
          <div>
            <label className="text-[11px] text-muted-foreground mb-1.5 block font-medium">
              {language === 'en' ? 'Description' : language === 'zh' ? '内容' : '내용'}
            </label>
            <input type="text" value={description} onChange={e => setDescription(e.target.value)}
              placeholder={method === 'charge' ? '신규충전' : '세르프 600샷'}
              className={inputClass} />
          </div>

          {/* 금액 */}
          {method !== 'service' && (
            <div className={method === 'charge' ? 'grid grid-cols-2 gap-2' : ''}>
              <div>
                <label className="text-[11px] text-muted-foreground mb-1.5 block font-medium">
                  {method === 'charge'
                    ? (language === 'en' ? 'Paid Amount (₩)' : language === 'zh' ? '实付金额 (元)' : '실결제금액 (원)')
                    : (language === 'en' ? 'Amount (₩)' : language === 'zh' ? '金额 (元)' : '금액 (원)')}
                </label>
                <div className="relative">
                  <input type="text" value={amount} inputMode="numeric"
                    onChange={e => setAmount(formatAmount(e.target.value))}
                    placeholder="0"
                    className={cn(inputClass, 'pr-8')} />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                    {language === 'zh' ? '元' : '원'}
                  </span>
                </div>
              </div>

              {method === 'charge' && (
                <div>
                  <label className="text-[11px] mb-1.5 block font-medium">
                    <span className="text-emerald-600">
                      {language === 'en' ? 'Charged Amount' : language === 'zh' ? '充值金额' : '충전금액 (원)'}
                    </span>
                    <span className="text-muted-foreground ml-1">
                      {language === 'en' ? 'applied to balance' : language === 'zh' ? '计入余额' : '잔액에 반영'}
                    </span>
                  </label>
                  <div className="relative">
                    <input type="text" value={chargedAmount} inputMode="numeric"
                      onChange={e => setChargedAmount(formatAmount(e.target.value))}
                      placeholder={amount || '0'}
                      className="w-full bg-emerald-50 border border-emerald-300 rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-400 pr-8" />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                      {language === 'zh' ? '元' : '원'}
                    </span>
                  </div>
                  {amount && chargedAmount && amount !== chargedAmount && (
                    <p className="text-[10px] text-emerald-600 mt-1 font-medium">
                      +{(parseInt(chargedAmount.replace(/,/g,'')) - parseInt(amount.replace(/,/g,''))).toLocaleString()}
                      {language === 'en' ? ' bonus' : language === 'zh' ? '元 奖励' : '원 보너스'}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 메모 */}
          <div>
            <label className="text-[11px] text-muted-foreground mb-1.5 block font-medium">
              {language === 'en' ? 'Memo (optional)' : language === 'zh' ? '备注 (可选)' : '메모 (선택)'}
            </label>
            <input type="text" value={memo} onChange={e => setMemo(e.target.value)}
              placeholder={language === 'en' ? 'Event, 1+1 package, etc.' : '이벤트 적용, 1+1 패키지 등'}
              className={inputClass} />
          </div>

          {/* 에러 */}
          {error && (
            <p className="text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-xl px-4 py-2.5">{error}</p>
          )}
        </div>

        {/* 저장 버튼 */}
        <div className="p-5 border-t border-gray-200">
          {saved ? (
            <div className="flex items-center justify-center gap-2 py-3 text-emerald-600">
              <CheckCircle size={18} />
              <span className="font-semibold text-sm">
                {language === 'en' ? 'Saved!' : language === 'zh' ? '已保存！' : '저장 완료!'}
              </span>
            </div>
          ) : (
            <Button onClick={handleSave} disabled={saving} className="w-full rounded-xl h-12 text-sm font-bold gap-2">
              {saving
                ? <><Loader2 size={16} className="animate-spin" /> {language === 'en' ? 'Saving...' : '저장 중...'}</>
                : <><Plus size={16} /> {language === 'en' ? 'Add Payment' : language === 'zh' ? '添加支付记录' : '결제 내역 추가'}</>}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
