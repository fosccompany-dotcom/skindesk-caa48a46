import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ChevronRight, ChevronLeft, Package, Syringe, Zap, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TreatmentRecord } from '@/types/skin';

// ─── 데이터 ────────────────────────────────────────────────────────────

const BASIC_ITEMS = [
  { id: 'basic_scaling', name: '스케일링', skinLayer: 'epidermis' as const },
  { id: 'basic_aquapeel', name: '아쿠아필', skinLayer: 'epidermis' as const },
  { id: 'basic_vitamin', name: '비타민관리', skinLayer: 'epidermis' as const },
  { id: 'basic_cryo', name: '크라이오관리', skinLayer: 'epidermis' as const },
  { id: 'basic_led', name: 'LED재생레이저 (+모델링팩)', skinLayer: 'epidermis' as const },
  { id: 'basic_ionzyme', name: '이온자임', skinLayer: 'epidermis' as const },
  { id: 'basic_cinderella', name: '신데렐라주사', skinLayer: 'dermis' as const },
  { id: 'basic_whitening', name: '백옥주사', skinLayer: 'dermis' as const },
  { id: 'basic_placenta', name: '태반주사', skinLayer: 'dermis' as const },
  { id: 'basic_vitaminiv', name: '비타민주사', skinLayer: 'dermis' as const },
];

const PREMIUM_ITEMS = [
  { id: 'premium_larafil', name: '라라필', skinLayer: 'epidermis' as const },
  { id: 'premium_placenta_care', name: '플라센타관리', skinLayer: 'epidermis' as const },
  { id: 'premium_blackhead', name: '블랙헤드관리', skinLayer: 'epidermis' as const },
  { id: 'premium_blackpeel', name: '블랙필', skinLayer: 'epidermis' as const },
  { id: 'premium_yespeel', name: '예스필', skinLayer: 'epidermis' as const },
  { id: 'premium_super_cinderella', name: '슈퍼신데렐라주사', skinLayer: 'dermis' as const },
  { id: 'premium_super_whitening', name: '슈퍼백옥주사', skinLayer: 'dermis' as const },
  { id: 'premium_arginine', name: '아르기닌주사', skinLayer: 'dermis' as const },
  { id: 'premium_waterdrop', name: '물방울관리 6분', skinLayer: 'epidermis' as const },
  { id: 'premium_extraction', name: '압출', skinLayer: 'epidermis' as const },
  { id: 'premium_pinkpeel', name: '핑크필', skinLayer: 'epidermis' as const },
];

const STANDALONE_TREATMENTS = [
  // 피하조직
  { id: 'shrink', name: '슈링크 유니버스', skinLayer: 'subcutaneous' as const, hasShots: true, shotOptions: [100, 200, 300, 600] },
  { id: 'serf', name: '세르프', skinLayer: 'subcutaneous' as const, hasShots: true, shotOptions: [100, 200, 300, 600] },
  { id: 'ulthera', name: '울쎄라', skinLayer: 'subcutaneous' as const, hasShots: true, shotOptions: [100, 200, 300, 600] },
  { id: 'doublo', name: '더블로', skinLayer: 'subcutaneous' as const, hasShots: true, shotOptions: [100, 200, 300, 600] },
  { id: 'titanium', name: '티타늄', skinLayer: 'subcutaneous' as const, hasShots: true, shotOptions: [30, 60, 100] },
  { id: 'inmode_fx', name: '인모드 FX', skinLayer: 'subcutaneous' as const, hasShots: false, shotOptions: [] },
  { id: 'botox_jaw', name: '보톡스 — 사각턱 (제오민)', skinLayer: 'subcutaneous' as const, hasShots: false, shotOptions: [] },
  { id: 'botox_forehead', name: '보톡스 — 이마', skinLayer: 'subcutaneous' as const, hasShots: false, shotOptions: [] },
  { id: 'botox_glabella', name: '보톡스 — 미간', skinLayer: 'subcutaneous' as const, hasShots: false, shotOptions: [] },
  { id: 'filler_nasolabial', name: '필러 — 팔자 (뉴라미스)', skinLayer: 'subcutaneous' as const, hasShots: false, shotOptions: [] },
  // 진피층
  { id: 'rejuran', name: '리쥬란 힐러 2cc', skinLayer: 'dermis' as const, hasShots: false, shotOptions: [] },
  { id: 'rejuran_all', name: '리쥬란 올인원 (힐러2cc+아이1cc)', skinLayer: 'dermis' as const, hasShots: false, shotOptions: [] },
  { id: 'vanslan', name: '밴스란힐러 2cc', skinLayer: 'dermis' as const, hasShots: false, shotOptions: [] },
  { id: 'mihee', name: '미희주사', skinLayer: 'dermis' as const, hasShots: false, shotOptions: [] },
  // 표피층
  { id: 'picotoning', name: '피코토닝', skinLayer: 'epidermis' as const, hasShots: false, shotOptions: [] },
  { id: 'excelv', name: '엑셀V레이저 + 피코토닝 콤보', skinLayer: 'epidermis' as const, hasShots: false, shotOptions: [] },
  { id: 'aquapeel_solo', name: '아쿠아필 (단독)', skinLayer: 'epidermis' as const, hasShots: false, shotOptions: [] },
  { id: 'larafil_solo', name: '라라필 (단독)', skinLayer: 'epidermis' as const, hasShots: false, shotOptions: [] },
];

const SKIN_LAYER_LABEL = {
  epidermis: '표피층',
  dermis: '진피층',
  subcutaneous: '피하조직',
};

const SKIN_LAYER_COLOR = {
  epidermis: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  dermis: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  subcutaneous: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
};

// ─── 타입 ──────────────────────────────────────────────────────────────

type TreatmentType = 'basic_pkg' | 'premium_pkg' | 'standalone';

interface FormData {
  treatmentType: TreatmentType | null;
  packageItem: typeof BASIC_ITEMS[number] | null;
  standaloneItem: typeof STANDALONE_TREATMENTS[number] | null;
  shots: number | null;
  date: string;
  clinic: string;
  notes: string;
  satisfaction: number;
  memo: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (record: Omit<TreatmentRecord, 'id'>) => void;
  editRecord?: TreatmentRecord | null;
}

// ─── 컴포넌트 ──────────────────────────────────────────────────────────

export default function AddTreatmentModal({ open, onClose, onSave, editRecord }: Props) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormData>({
    treatmentType: null,
    packageItem: null,
    standaloneItem: null,
    shots: null,
    date: new Date().toISOString().split('T')[0],
    clinic: '밴스 미금',
    notes: '',
    satisfaction: 4,
    memo: '',
  });

  const reset = () => {
    setStep(1);
    setForm({
      treatmentType: null,
      packageItem: null,
      standaloneItem: null,
      shots: null,
      date: new Date().toISOString().split('T')[0],
      clinic: '밴스 미금',
      notes: '',
      satisfaction: 4,
      memo: '',
    });
  };

  const handleClose = () => { reset(); onClose(); };

  // 단계 계산
  const maxStep = (() => {
    if (!form.treatmentType) return 1;
    if (form.treatmentType === 'standalone') {
      const item = form.standaloneItem;
      if (item?.hasShots) return 4; // 1:타입 → 2:시술 → 3:샷수 → 4:상세
      return 3; // 1:타입 → 2:시술 → 3:상세
    }
    return 3; // 1:타입 → 2:패키지시술 → 3:상세
  })();

  const handleNext = () => {
    if (step < maxStep) setStep(s => s + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(s => s - 1);
  };

  const canNext = () => {
    if (step === 1) return !!form.treatmentType;
    if (step === 2) {
      if (form.treatmentType === 'standalone') return !!form.standaloneItem;
      return !!(form.packageItem);
    }
    if (step === 3 && form.treatmentType === 'standalone' && form.standaloneItem?.hasShots) {
      return !!form.shots;
    }
    return true;
  };

  const getTreatmentName = () => {
    if (form.treatmentType === 'basic_pkg' && form.packageItem) {
      return `Basic — ${form.packageItem.name}`;
    }
    if (form.treatmentType === 'premium_pkg' && form.packageItem) {
      return `Premium — ${form.packageItem.name}`;
    }
    if (form.treatmentType === 'standalone' && form.standaloneItem) {
      const shots = form.shots ? ` ${form.shots}샷` : '';
      return `${form.standaloneItem.name}${shots}`;
    }
    return '';
  };

  const getSkinLayer = (): 'epidermis' | 'dermis' | 'subcutaneous' => {
    if (form.packageItem) return form.packageItem.skinLayer;
    if (form.standaloneItem) return form.standaloneItem.skinLayer;
    return 'epidermis';
  };

  const handleSave = () => {
    const record: Omit<TreatmentRecord, 'id'> = {
      date: form.date,
      packageId: form.treatmentType === 'basic_pkg' ? 'p1' : form.treatmentType === 'premium_pkg' ? 'p2' : '',
      treatmentName: getTreatmentName(),
      skinLayer: getSkinLayer(),
      bodyArea: 'face',
      notes: form.notes,
      clinic: form.clinic,
      satisfaction: form.satisfaction,
      memo: form.memo,
    };
    onSave(record);
    handleClose();
  };

  const isDetailStep = () => {
    if (form.treatmentType === 'standalone' && form.standaloneItem?.hasShots) return step === 4;
    return step === 3 && !!form.treatmentType;
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-[#111] border border-white/10 text-white max-w-md w-[92vw] max-h-[85vh] overflow-y-auto p-0">
        {/* 헤더 */}
        <DialogHeader className="px-5 pt-5 pb-3 border-b border-white/10">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-base font-semibold text-white">
              {editRecord ? '시술 수정' : '시술 등록'}
            </DialogTitle>
            <span className="text-xs text-white/40">{step} / {maxStep}</span>
          </div>
          {/* 진행바 */}
          <div className="flex gap-1 mt-3">
            {Array.from({ length: maxStep }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  'h-0.5 flex-1 rounded-full transition-all duration-300',
                  i < step ? 'bg-[#C9A96E]' : 'bg-white/10'
                )}
              />
            ))}
          </div>
        </DialogHeader>

        <div className="px-5 py-4">
          {/* ─ STEP 1: 시술 타입 선택 ─ */}
          {step === 1 && (
            <div className="space-y-3">
              <p className="text-xs text-white/50 mb-4">어떤 시술을 등록할까요?</p>
              {[
                { id: 'basic_pkg' as TreatmentType, icon: <Package size={16} />, label: 'Basic 패키지', sub: '스케일링, 아쿠아필, LED 등 10종', color: 'border-amber-500/40 bg-amber-500/5' },
                { id: 'premium_pkg' as TreatmentType, icon: <Package size={16} />, label: 'Premium 패키지', sub: '라라필, 물방울관리, 핑크필 등 11종', color: 'border-blue-500/40 bg-blue-500/5' },
                { id: 'standalone' as TreatmentType, icon: <Syringe size={16} />, label: '단독 시술', sub: '리프팅, 주사, 레이저 등 단건 등록', color: 'border-white/20 bg-white/5' },
              ].map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setForm(f => ({ ...f, treatmentType: opt.id, packageItem: null, standaloneItem: null, shots: null }))}
                  className={cn(
                    'w-full flex items-center gap-3 p-4 rounded-xl border transition-all text-left',
                    opt.color,
                    form.treatmentType === opt.id
                      ? 'border-[#C9A96E] ring-1 ring-[#C9A96E]/40'
                      : 'hover:border-white/30'
                  )}
                >
                  <div className="text-[#C9A96E]">{opt.icon}</div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-white">{opt.label}</div>
                    <div className="text-xs text-white/40 mt-0.5">{opt.sub}</div>
                  </div>
                  {form.treatmentType === opt.id && (
                    <Check size={14} className="text-[#C9A96E]" />
                  )}
                </button>
              ))}
            </div>
          )}

          {/* ─ STEP 2a: 패키지 내 시술 선택 ─ */}
          {step === 2 && (form.treatmentType === 'basic_pkg' || form.treatmentType === 'premium_pkg') && (
            <div className="space-y-2">
              <p className="text-xs text-white/50 mb-3">
                {form.treatmentType === 'basic_pkg' ? 'Basic' : 'Premium'} 패키지에서 시술을 선택하세요
              </p>
              <div className="grid gap-2">
                {(form.treatmentType === 'basic_pkg' ? BASIC_ITEMS : PREMIUM_ITEMS).map(item => (
                  <button
                    key={item.id}
                    onClick={() => setForm(f => ({ ...f, packageItem: item }))}
                    className={cn(
                      'w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all text-left',
                      form.packageItem?.id === item.id
                        ? 'border-[#C9A96E] bg-[#C9A96E]/5 ring-1 ring-[#C9A96E]/30'
                        : 'border-white/10 bg-white/3 hover:border-white/25'
                    )}
                  >
                    <span className="text-sm text-white">{item.name}</span>
                    <div className="flex items-center gap-2">
                      <span className={cn('text-xs px-2 py-0.5 rounded-full border', SKIN_LAYER_COLOR[item.skinLayer])}>
                        {SKIN_LAYER_LABEL[item.skinLayer]}
                      </span>
                      {form.packageItem?.id === item.id && <Check size={13} className="text-[#C9A96E]" />}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ─ STEP 2b: 단독 시술 선택 ─ */}
          {step === 2 && form.treatmentType === 'standalone' && (
            <div className="space-y-2">
              <p className="text-xs text-white/50 mb-3">시술을 선택하세요</p>
              {(['subcutaneous', 'dermis', 'epidermis'] as const).map(layer => {
                const items = STANDALONE_TREATMENTS.filter(t => t.skinLayer === layer);
                return (
                  <div key={layer} className="mb-4">
                    <div className={cn('text-xs font-medium px-2 py-1 rounded-md inline-block mb-2 border', SKIN_LAYER_COLOR[layer])}>
                      {SKIN_LAYER_LABEL[layer]}
                    </div>
                    <div className="space-y-1.5">
                      {items.map(item => (
                        <button
                          key={item.id}
                          onClick={() => setForm(f => ({ ...f, standaloneItem: item, shots: null }))}
                          className={cn(
                            'w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all text-left',
                            form.standaloneItem?.id === item.id
                              ? 'border-[#C9A96E] bg-[#C9A96E]/5 ring-1 ring-[#C9A96E]/30'
                              : 'border-white/10 bg-white/3 hover:border-white/25'
                          )}
                        >
                          <span className="text-sm text-white">{item.name}</span>
                          <div className="flex items-center gap-2">
                            {item.hasShots && (
                              <span className="text-xs text-white/30 flex items-center gap-1">
                                <Zap size={11} />샷수 선택
                              </span>
                            )}
                            {form.standaloneItem?.id === item.id && <Check size={13} className="text-[#C9A96E]" />}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ─ STEP 3 (샷수): 샷수 선택 ─ */}
          {step === 3 && form.treatmentType === 'standalone' && form.standaloneItem?.hasShots && (
            <div>
              <p className="text-xs text-white/50 mb-4">
                <span className="text-white font-medium">{form.standaloneItem.name}</span> — 샷수를 선택하세요
              </p>
              <div className="grid grid-cols-2 gap-3">
                {form.standaloneItem.shotOptions.map(shot => (
                  <button
                    key={shot}
                    onClick={() => setForm(f => ({ ...f, shots: shot }))}
                    className={cn(
                      'flex flex-col items-center justify-center py-5 rounded-xl border transition-all',
                      form.shots === shot
                        ? 'border-[#C9A96E] bg-[#C9A96E]/10 ring-1 ring-[#C9A96E]/40'
                        : 'border-white/15 bg-white/3 hover:border-white/30'
                    )}
                  >
                    <span className={cn('text-2xl font-bold', form.shots === shot ? 'text-[#C9A96E]' : 'text-white')}>
                      {shot}
                    </span>
                    <span className="text-xs text-white/40 mt-0.5">샷</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ─ 상세 입력 (마지막 단계) ─ */}
          {isDetailStep() && (
            <div className="space-y-4">
              {/* 선택 요약 */}
              <div className="bg-white/5 rounded-xl px-4 py-3 border border-white/10">
                <div className="text-xs text-white/40 mb-1">등록할 시술</div>
                <div className="text-sm font-medium text-[#C9A96E]">{getTreatmentName()}</div>
                <div className="mt-1">
                  <span className={cn('text-xs px-2 py-0.5 rounded-full border', SKIN_LAYER_COLOR[getSkinLayer()])}>
                    {SKIN_LAYER_LABEL[getSkinLayer()]}
                  </span>
                </div>
              </div>

              {/* 날짜 */}
              <div>
                <label className="text-xs text-white/50 block mb-1.5">시술일</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                  className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#C9A96E]/50 [color-scheme:dark]"
                />
              </div>

              {/* 병원 */}
              <div>
                <label className="text-xs text-white/50 block mb-1.5">병원</label>
                <div className="grid grid-cols-2 gap-2">
                  {['밴스 미금', '밴스 구로', '밴스 판교', '뷰티라운지 판교', '필로의원 정자', '직접 입력'].map(c => (
                    <button
                      key={c}
                      onClick={() => setForm(f => ({ ...f, clinic: c === '직접 입력' ? '' : c }))}
                      className={cn(
                        'px-3 py-2 rounded-lg border text-xs transition-all',
                        form.clinic === c
                          ? 'border-[#C9A96E] bg-[#C9A96E]/10 text-[#C9A96E]'
                          : 'border-white/10 text-white/60 hover:border-white/25'
                      )}
                    >
                      {c}
                    </button>
                  ))}
                </div>
                {!['밴스 미금', '밴스 구로', '밴스 판교', '뷰티라운지 판교', '필로의원 정자'].includes(form.clinic) && (
                  <input
                    type="text"
                    placeholder="병원명 입력"
                    value={form.clinic}
                    onChange={e => setForm(f => ({ ...f, clinic: e.target.value }))}
                    className="mt-2 w-full bg-white/5 border border-white/15 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-[#C9A96E]/50"
                  />
                )}
              </div>

              {/* 만족도 */}
              <div>
                <label className="text-xs text-white/50 block mb-1.5">만족도</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map(s => (
                    <button
                      key={s}
                      onClick={() => setForm(f => ({ ...f, satisfaction: s }))}
                      className={cn(
                        'flex-1 py-2 rounded-lg border text-sm font-medium transition-all',
                        form.satisfaction === s
                          ? 'border-[#C9A96E] bg-[#C9A96E]/15 text-[#C9A96E]'
                          : 'border-white/10 text-white/40 hover:border-white/25'
                      )}
                    >
                      {'★'.repeat(s)}
                    </button>
                  ))}
                </div>
              </div>

              {/* 메모 */}
              <div>
                <label className="text-xs text-white/50 block mb-1.5">메모 (선택)</label>
                <textarea
                  rows={3}
                  placeholder="시술 후 느낌, 효과, 다음 방문 시 참고 사항 등"
                  value={form.memo}
                  onChange={e => setForm(f => ({ ...f, memo: e.target.value }))}
                  className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-[#C9A96E]/50 resize-none"
                />
              </div>
            </div>
          )}
        </div>

        {/* 하단 버튼 */}
        <div className="px-5 pb-5 flex gap-3">
          {step > 1 && (
            <Button
              variant="outline"
              onClick={handleBack}
              className="flex-1 border-white/15 bg-transparent text-white/70 hover:bg-white/5 hover:text-white"
            >
              <ChevronLeft size={15} className="mr-1" /> 이전
            </Button>
          )}
          {!isDetailStep() ? (
            <Button
              onClick={handleNext}
              disabled={!canNext()}
              className="flex-1 bg-[#C9A96E] hover:bg-[#b8935a] text-black font-semibold disabled:opacity-30 disabled:cursor-not-allowed"
            >
              다음 <ChevronRight size={15} className="ml-1" />
            </Button>
          ) : (
            <Button
              onClick={handleSave}
              disabled={!form.date || !form.clinic}
              className="flex-1 bg-[#C9A96E] hover:bg-[#b8935a] text-black font-semibold disabled:opacity-30"
            >
              <Check size={15} className="mr-1.5" /> 저장
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
