import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ChevronRight, ChevronLeft, Check, Zap, Sparkles, Package } from 'lucide-react';
import { cn } from '@/lib/utils';
import ClinicSearchInput from './ClinicSearchInput';
import { TreatmentRecord } from '@/types/skin';
import { supabase } from '@/integrations/supabase/client';

// ─── 미금 밴스의원 실제 시술 데이터 ────────────────────────────────

type SL = 'epidermis' | 'dermis' | 'subcutaneous';

interface TreatmentItem {
  id: string;
  name: string;
  desc?: string;
  skinLayer: SL;
  shotOptions?: number[];   // 있으면 샷수 선택 단계 추가
}

interface Category {
  id: string;
  label: string;
  emoji: string;
  color: string;          // tailwind border/bg 색상
  items: TreatmentItem[];
}

const CATEGORIES: Category[] = [
  {
    id: 'lifting',
    label: '레이저 리프팅',
    emoji: '✨',
    color: 'border-purple-300 bg-purple-50',
    items: [
      { id: 'shrink',     name: '슈링크 유니버스',   desc: '효과UP 통증DOWN 밀착 리프팅',     skinLayer: 'subcutaneous', shotOptions: [100,200,300,600] },
      { id: 'ulthera_fp', name: '울쎄라 피프라임',   desc: '프리미엄 초음파 리프팅',           skinLayer: 'subcutaneous', shotOptions: [100,200,300,600] },
      { id: 'ulthera',    name: '울쎄라 리프팅',      desc: '보이는 초음파 리프팅',             skinLayer: 'subcutaneous', shotOptions: [100,200,300,600] },
      { id: 'serf',       name: '세르프 리프팅',      desc: '프리미엄 고주파 리프팅',           skinLayer: 'subcutaneous', shotOptions: [100,200,300,600] },
      { id: 'thermage',   name: '써마지 FLX',         desc: '고주파 에너지 리프팅',             skinLayer: 'subcutaneous' },
      { id: 'density',    name: '덴서티',              desc: '프리미엄 연예인 리프팅',           skinLayer: 'subcutaneous' },
      { id: 'onda',       name: '온다 리프팅',         desc: '차세대 극초단파 레이저',           skinLayer: 'subcutaneous' },
      { id: 'inmode',     name: '인모드',              desc: '토탈 안티에이징 리프팅',           skinLayer: 'subcutaneous' },
      { id: 'oligio',     name: '올리지오',            desc: '콜라겐 활성화 리프팅',             skinLayer: 'subcutaneous' },
    ],
  },
  {
    id: 'botox',
    label: '보톡스/윤곽주사',
    emoji: '💉',
    color: 'border-blue-300 bg-blue-50',
    items: [
      { id: 'botox_kr',    name: '국산 보톡스',           desc: '부담없는 가격의 국산 보톡스',    skinLayer: 'subcutaneous' },
      { id: 'botox_core',  name: '코어톡스 보톡스',       desc: '내성 적은 국산 보톡스',          skinLayer: 'subcutaneous' },
      { id: 'botox_xeomin',name: '제오민 보톡스',         desc: '내성 적은 독일 보톡스',          skinLayer: 'subcutaneous' },
      { id: 'botox_alg',   name: '엘러간 보톡스',         desc: '미국 프리미엄 보톡스',           skinLayer: 'subcutaneous' },
      { id: 'contour',     name: '윤곽주사',              desc: '갸름한 얼굴라인을 위한 주사',    skinLayer: 'subcutaneous' },
    ],
  },
  {
    id: 'filler',
    label: '필러/실리프팅',
    emoji: '🌙',
    color: 'border-indigo-300 bg-indigo-50',
    items: [
      { id: 'filler_kr',   name: '국산 필러 (아띠에르/뉴라미스)', desc: '자연스러운 볼륨 UP', skinLayer: 'dermis' },
      { id: 'filler_imp',  name: '수입 필러 (레스틸렌/쥬비덤)',   desc: '자연스러운 볼륨 UP', skinLayer: 'dermis' },
      { id: 'filler_chin', name: '턱끝 필러',     desc: '자연스러운 볼륨 UP',   skinLayer: 'dermis' },
      { id: 'filler_lip',  name: '입술 필러',     desc: '황금비율 입술 디자인', skinLayer: 'dermis' },
      { id: 'filler_sp',   name: '특수부위 필러', desc: '자연스러운 볼륨 UP',   skinLayer: 'dermis' },
      { id: 'thread',      name: '실리프팅',      desc: '자연스럽고 강력한 효과', skinLayer: 'subcutaneous' },
    ],
  },
  {
    id: 'booster',
    label: '스킨부스터',
    emoji: '💧',
    color: 'border-cyan-300 bg-cyan-50',
    items: [
      { id: 'skinvive',   name: '스킨바이브',       desc: '프리미엄 히알루론산 스킨부스터',        skinLayer: 'dermis' },
      { id: 'rejuran',    name: '리쥬란 힐러',      desc: 'PN 성분 잔주름 탄력 개선',             skinLayer: 'dermis' },
      { id: 'juvelook',   name: '쥬베룩 스킨/볼륨', desc: '자가조직재생 콜라겐 부스터',           skinLayer: 'dermis' },
      { id: 'mihee',      name: '미희주사',          desc: '꺼진 눈밑 볼륨에 특화된 콜라겐주사',  skinLayer: 'dermis' },
      { id: 'radiesse',   name: '레디어스',          desc: '스킨·코어부터 채우는 볼륨 부스터',    skinLayer: 'dermis' },
      { id: 'revive',     name: '리바이브',          desc: '글리세롤+HA 결합 오래가는 촉촉함',     skinLayer: 'dermis' },
      { id: 'oneday_b',   name: '원데이 스킨부스터', desc: '내 피부 맞춤 스킨부스터',             skinLayer: 'dermis' },
      { id: 'vanslan',    name: '밴스란힐러',        desc: '통증 낮춘 밴스의원 전용 PN 부스터',   skinLayer: 'dermis' },
      { id: 'lilied',     name: '릴리이드',          desc: '수분·콜라겐 충전',                    skinLayer: 'dermis' },
      { id: 'potenza',    name: '포텐자',            desc: '모공·흉터·홍조 맞춤형 고주파',        skinLayer: 'dermis' },
      { id: 'mulgwang',   name: '물광주사',          desc: 'HA로 피부 속부터 채우는 수분감',      skinLayer: 'dermis' },
      { id: 'colaster',   name: '콜라스터',          desc: '6가지 앰플 맞춤 콜라겐 부스터',       skinLayer: 'dermis' },
    ],
  },
  {
    id: 'skincare',
    label: '피부관리/패키지',
    emoji: '🌿',
    color: 'border-green-300 bg-green-50',
    items: [
      // Basic 패키지 아이템
      { id: 'b_scaling',   name: '[Basic] 스케일링',              skinLayer: 'epidermis' },
      { id: 'b_aquapeel',  name: '[Basic] 아쿠아필',              skinLayer: 'epidermis' },
      { id: 'b_vitamin',   name: '[Basic] 비타민관리',            skinLayer: 'epidermis' },
      { id: 'b_cryo',      name: '[Basic] 크라이오관리',          skinLayer: 'epidermis' },
      { id: 'b_led',       name: '[Basic] LED재생레이저 (+모델링팩)', skinLayer: 'epidermis' },
      { id: 'b_ionzyme',   name: '[Basic] 이온자임',              skinLayer: 'epidermis' },
      { id: 'b_cinder',    name: '[Basic] 신데렐라주사',          skinLayer: 'dermis' },
      { id: 'b_white',     name: '[Basic] 백옥주사',              skinLayer: 'dermis' },
      { id: 'b_placenta',  name: '[Basic] 태반주사',              skinLayer: 'dermis' },
      { id: 'b_vitiv',     name: '[Basic] 비타민주사',            skinLayer: 'dermis' },
      // Premium 패키지 아이템
      { id: 'p_larafil',   name: '[Premium] 라라필',              skinLayer: 'epidermis' },
      { id: 'p_placenta',  name: '[Premium] 플라센타관리',        skinLayer: 'epidermis' },
      { id: 'p_blackhead', name: '[Premium] 블랙헤드관리',        skinLayer: 'epidermis' },
      { id: 'p_blackpeel', name: '[Premium] 블랙필',              skinLayer: 'epidermis' },
      { id: 'p_yespeel',   name: '[Premium] 예스필',              skinLayer: 'epidermis' },
      { id: 'p_scinder',   name: '[Premium] 슈퍼신데렐라주사',    skinLayer: 'dermis' },
      { id: 'p_swhite',    name: '[Premium] 슈퍼백옥주사',        skinLayer: 'dermis' },
      { id: 'p_arginine',  name: '[Premium] 아르기닌주사',        skinLayer: 'dermis' },
      { id: 'p_water',     name: '[Premium] 물방울관리 6분',      skinLayer: 'epidermis' },
      { id: 'p_extract',   name: '[Premium] 압출',                skinLayer: 'epidermis' },
      { id: 'p_pinkpeel',  name: '[Premium] 핑크필',              skinLayer: 'epidermis' },
      // 단독 스킨케어
      { id: 'peeling',     name: '필링 (단독)',                   skinLayer: 'epidermis' },
    ],
  },
  {
    id: 'whitening',
    label: '미백/기미/색소',
    emoji: '⚡',
    color: 'border-amber-300 bg-amber-50',
    items: [
      { id: 'excelv',    name: '엑셀V',      desc: '색소·기미·잡티 제거 레이저',  skinLayer: 'epidermis' },
      { id: 'picotoning',name: '피코토닝',   desc: '피부를 맑고 깨끗하게',       skinLayer: 'epidermis' },
      { id: 'whitetone', name: '미백토닝',   desc: '피부를 맑고 깨끗하게',       skinLayer: 'epidermis' },
      { id: 'lipat',     name: '리팟레이저', desc: '단 한번으로 흑자 제거',      skinLayer: 'epidermis' },
    ],
  },
  {
    id: 'acne',
    label: '여드름/점제거',
    emoji: '🔬',
    color: 'border-rose-300 bg-rose-50',
    items: [
      { id: 'mole',    name: '점/쥐젖/사마귀/검버섯 제거', desc: '피부 손상 최소화 제거', skinLayer: 'epidermis' },
      { id: 'acne_tx', name: '여드름 치료',                desc: '아그네스/여드름진정주사', skinLayer: 'epidermis' },
      { id: 'potenza_face', name: '포텐자 얼굴전체',       desc: '모공·흉터·홍조 고주파',  skinLayer: 'epidermis' },
      { id: 'kapri',   name: '카프리레이저',               desc: '피지샘억제 여드름 레이저',skinLayer: 'epidermis' },
    ],
  },
  {
    id: 'fat',
    label: '지방분해주사',
    emoji: '🔥',
    color: 'border-orange-300 bg-orange-50',
    items: [
      { id: 'fat1',   name: '밴스 지방분해주사',        desc: '스테로이드 없는 고농도 지방분해',  skinLayer: 'subcutaneous' },
      { id: 'fat2',   name: '밴스 지방분해2주사',       desc: '통증↓ 효과↑ 강력한 고농도 주사',  skinLayer: 'subcutaneous' },
      { id: 'fat_f',  name: '밴스 얼굴지방분해주사',   desc: '얼굴 전용 고농도 지방분해주사',    skinLayer: 'subcutaneous' },
    ],
  },
  {
    id: 'hair_removal',
    label: '제모',
    emoji: '🪄',
    color: 'border-slate-300 bg-slate-50',
    items: [
      { id: 'gentle_m',  name: '젠틀맥스프로플러스 남성제모', skinLayer: 'epidermis' },
      { id: 'gentle_f',  name: '젠틀맥스프로플러스 여성제모', skinLayer: 'epidermis' },
      { id: 'apogee_m',  name: '아포지엘리트플러스 남성제모', skinLayer: 'epidermis' },
      { id: 'apogee_f',  name: '아포지엘리트플러스 여성제모', skinLayer: 'epidermis' },
    ],
  },
  {
    id: 'iv',
    label: '수액/줄기세포',
    emoji: '🌱',
    color: 'border-teal-300 bg-teal-50',
    items: [
      { id: 'iv_drip',  name: '수액주사',  desc: '숙취·피로해소 수액',  skinLayer: 'dermis' },
      { id: 'stemcell', name: '줄기세포',  desc: '피부재생 줄기세포 시술', skinLayer: 'dermis' },
    ],
  },
];

// ─── 헬퍼 ──────────────────────────────────────────────────────────

const SKIN_LAYER_LABEL: Record<SL, string> = {
  epidermis: '표피층', dermis: '진피층', subcutaneous: '피하조직',
};
const SKIN_LAYER_COLOR: Record<SL, string> = {
  epidermis: 'bg-amber-100 text-amber-600 border-amber-300',
  dermis: 'bg-blue-100 text-blue-600 border-blue-300',
  subcutaneous: 'bg-purple-100 text-purple-600 border-purple-300',
};

// ─── Props ──────────────────────────────────────────────────────────

interface Props {
  open: boolean;
  onClose: () => void;
  onOpenParse?: () => void;
  onSave: (record: Omit<TreatmentRecord, 'id'>) => void;
  editRecord?: TreatmentRecord | null;
}

// ─── 컴포넌트 ──────────────────────────────────────────────────────

export default function AddTreatmentModal({ open, onClose, onSave, editRecord, onOpenParse }: Props) {
  const [step, setStep] = useState(1);
  const [catId, setCatId] = useState<string | null>(null);
  const [itemId, setItemId] = useState<string | null>(null);
  const [shots, setShots] = useState<number | null>(null);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [clinic, setClinic] = useState('밴스 미금');
  const [satisfaction, setSatisfaction] = useState<1 | 2 | 3 | 4 | 5>(4);
  const [memo, setMemo] = useState('');
  // 시술권 선택 (package_uuid — 플로우 3)
  const [availPkgs, setAvailPkgs] = useState<{ id: string; name: string; remaining: number }[]>([]);
  const [selectedPkgId, setSelectedPkgId] = useState<string>(''); // '' = 시술권 미사용

  const reset = () => {
    setStep(1); setCatId(null); setItemId(null); setShots(null);
    setDate(new Date().toISOString().split('T')[0]);
    setClinic('밴스 미금'); setSatisfaction(4); setMemo('');
    setAvailPkgs([]); setSelectedPkgId('');
  };
  const handleClose = () => { reset(); onClose(); };

  const selectedCat = CATEGORIES.find(c => c.id === catId);
  const selectedItem = selectedCat?.items.find(i => i.id === itemId);
  const needsShots = !!(selectedItem?.shotOptions?.length);

  // 총 단계: 1(카테고리) → 2(시술) → 3(샷수, 해당시) → 마지막(상세)
  const totalSteps = needsShots ? 4 : 3;
  const isDetailStep = needsShots ? step === 4 : step === 3;

  // 상세 단계 진입 시 사용 가능한 시술권 조회
  useEffect(() => {
    if (!isDetailStep || !selectedItem) return;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('treatment_packages')
        .select('id, name, total_sessions, used_sessions, clinic')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (data) {
        const active = data
          .filter(p => p.used_sessions < p.total_sessions)
          .map(p => ({ id: p.id, name: p.name, remaining: p.total_sessions - p.used_sessions }));
        setAvailPkgs(active);
      }
    })();
  }, [isDetailStep, selectedItem]);

  const canNext = () => {
    if (step === 1) return !!catId;
    if (step === 2) return !!itemId;
    if (step === 3 && needsShots) return !!shots;
    return true;
  };

  const getTreatmentName = () => {
    if (!selectedItem) return '';
    return shots ? `${selectedItem.name} ${shots}샷` : selectedItem.name;
  };

  const handleSave = () => {
    if (!selectedItem) return;
    onSave({
      date,
      // selectedPkgId가 UUID면 그것을 사용 (플로우 3: 시술권 차감)
      // 없으면 빈 문자열 (포인트/잔액 변동 없음)
      packageId:     selectedPkgId || '',
      treatmentName: getTreatmentName(),
      skinLayer:     selectedItem.skinLayer,
      bodyArea:      'face',
      notes:         '',
      clinic,
      satisfaction,
      memo,
    });
    handleClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-white border border-gray-200 text-gray-900 max-w-md w-[92vw] max-h-[88vh] overflow-y-auto p-0">

        {/* 헤더 */}
        <DialogHeader className="px-5 pt-5 pb-3 border-b border-gray-200 sticky top-0 bg-white z-10">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-base font-semibold">
              {editRecord ? '시술 수정' : '시술 등록'}
            </DialogTitle>
            <span className="text-xs text-gray-400">{step} / {totalSteps}</span>
          </div>
          <div className="flex gap-1 mt-2.5">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div key={i} className={cn('h-0.5 flex-1 rounded-full transition-all',
                i < step ? 'bg-[#C9A96E]' : 'bg-gray-200')} />
            ))}
          </div>
        </DialogHeader>

        <div className="px-5 py-4">

          {/* ── STEP 1: 카테고리 선택 ── */}
          {step === 1 && (
            <div>
              <p className="text-xs text-gray-400 mb-3">시술 카테고리를 선택하세요</p>
              <div className="grid grid-cols-2 gap-2">
                {CATEGORIES.map(cat => (
                  <button key={cat.id}
                    onClick={() => { setCatId(cat.id); setItemId(null); setShots(null); }}
                    className={cn(
                      'flex items-center gap-2.5 px-3 py-3 rounded-xl border text-left transition-all',
                      cat.color,
                      catId === cat.id ? 'border-[#C9A96E] ring-1 ring-[#C9A96E]/40' : 'hover:border-gray-400 border-gray-200'
                    )}>
                    <span className="text-lg">{cat.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-gray-800 leading-tight">{cat.label}</div>
                      <div className="text-[10px] text-gray-400 mt-0.5">{cat.items.length}종</div>
                    </div>
                    {catId === cat.id && <Check size={12} className="text-[#C9A96E] shrink-0" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── STEP 2: 시술 선택 ── */}
          {step === 2 && selectedCat && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">{selectedCat.emoji}</span>
                <p className="text-sm font-semibold text-gray-900">{selectedCat.label}</p>
              </div>
              <div className="space-y-1.5">
                {selectedCat.items.map(item => (
                  <button key={item.id}
                    onClick={() => { setItemId(item.id); setShots(null); }}
                    className={cn(
                      'w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all text-left',
                      itemId === item.id
                        ? 'border-[#C9A96E] bg-[#C9A96E]/5 ring-1 ring-[#C9A96E]/30'
                        : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                    )}>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-gray-900 font-medium">{item.name}</div>
                      {item.desc && <div className="text-[11px] text-gray-400 mt-0.5 truncate">{item.desc}</div>}
                    </div>
                    <div className="flex items-center gap-1.5 ml-2 shrink-0">
                      <span className={cn('text-[10px] px-1.5 py-0.5 rounded-full border', SKIN_LAYER_COLOR[item.skinLayer])}>
                        {SKIN_LAYER_LABEL[item.skinLayer].replace('조직','').replace('층','')}
                      </span>
                      {item.shotOptions?.length && (
                        <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
                          <Zap size={9} />샷
                        </span>
                      )}
                      {itemId === item.id && <Check size={12} className="text-[#C9A96E]" />}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── STEP 3: 샷수 선택 ── */}
          {step === 3 && needsShots && selectedItem && (
            <div>
              <p className="text-xs text-gray-400 mb-1">샷수를 선택하세요</p>
              <p className="text-sm font-semibold text-gray-900 mb-4">{selectedItem.name}</p>
              <div className="grid grid-cols-2 gap-3">
                {selectedItem.shotOptions!.map(s => (
                  <button key={s}
                    onClick={() => setShots(s)}
                    className={cn(
                      'flex flex-col items-center justify-center py-6 rounded-xl border transition-all',
                      shots === s
                        ? 'border-[#C9A96E] bg-[#C9A96E]/10 ring-1 ring-[#C9A96E]/40'
                        : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                    )}>
                    <span className={cn('text-3xl font-bold', shots === s ? 'text-[#C9A96E]' : 'text-gray-800')}>{s}</span>
                    <span className="text-xs text-gray-400 mt-1">샷</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── 상세 입력 (마지막 단계) ── */}
          {isDetailStep && selectedItem && (
            <div className="space-y-4">
              {/* 선택 요약 */}
              <div className="bg-gray-50 rounded-xl px-4 py-3 border border-gray-200">
                <div className="text-[11px] text-gray-400 mb-1">등록할 시술</div>
                <div className="text-sm font-semibold text-[#C9A96E]">{getTreatmentName()}</div>
                <div className="mt-1.5">
                  <span className={cn('text-[10px] px-2 py-0.5 rounded-full border', SKIN_LAYER_COLOR[selectedItem.skinLayer])}>
                    {SKIN_LAYER_LABEL[selectedItem.skinLayer]}
                  </span>
                </div>
              </div>

              {/* 날짜 */}
              <div>
                <label className="text-xs text-gray-400 block mb-1.5">시술일</label>
                <input type="date" value={date}
                  onChange={e => setDate(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-[#C9A96E]/50" />
              </div>

              {/* 병원 */}
              <div>
                <label className="text-xs text-gray-400 block mb-1.5">병원</label>
                <ClinicSearchInput
                  value={clinic}
                  onChange={setClinic}
                  placeholder="병원명 검색 (예: 밴스 미금, 강남 피부과)"
                  darkMode={false} />
              </div>

              {/* 시술권 연결 (보유 시술권이 있을 때만 표시) */}
              {availPkgs.length > 0 && (
                <div>
                  <label className="text-xs text-gray-400 block mb-1.5 flex items-center gap-1">
                    <Package size={11} />시술권 사용 (선택)
                  </label>
                  <div className="space-y-1.5">
                    <button onClick={() => setSelectedPkgId('')}
                      className={cn('w-full text-left px-3 py-2 rounded-lg border text-xs transition-all',
                        !selectedPkgId
                          ? 'border-gray-300 bg-gray-50 text-gray-500 font-medium'
                          : 'border-gray-200 text-gray-300')}>
                      시술권 미사용 (잔액 차감 없음)
                    </button>
                    {availPkgs.map(p => (
                      <button key={p.id} onClick={() => setSelectedPkgId(p.id)}
                        className={cn('w-full text-left px-3 py-2 rounded-lg border text-xs transition-all',
                          selectedPkgId === p.id
                            ? 'border-indigo-400 bg-indigo-50 text-indigo-700 font-semibold'
                            : 'border-gray-200 text-gray-500')}>
                        🎫 {p.name}
                        <span className={cn('ml-2 font-bold', selectedPkgId === p.id ? 'text-indigo-500' : 'text-gray-400')}>
                          잔여 {p.remaining}회
                        </span>
                      </button>
                    ))}
                  </div>
                  {selectedPkgId && (
                    <p className="text-[10px] text-indigo-400 mt-1">
                      ✅ 저장 시 시술권 1회 차감 (결제·잔액 변동 없음)
                    </p>
                  )}
                </div>
              )}

              {/* 만족도 */}
              <div>
                <label className="text-xs text-gray-400 block mb-1.5">만족도</label>
                <div className="flex gap-2">
                  {[1,2,3,4,5].map(s => (
                    <button key={s} onClick={() => setSatisfaction(s as 1 | 2 | 3 | 4 | 5)}
                      className={cn(
                        'flex-1 py-2 rounded-lg border text-sm font-bold transition-all',
                        satisfaction === s
                          ? 'border-[#C9A96E] bg-[#C9A96E]/15 text-[#C9A96E]'
                          : 'border-gray-200 text-gray-300 hover:border-gray-400'
                      )}>
                      {'★'.repeat(s)}
                    </button>
                  ))}
                </div>
              </div>

              {/* 메모 */}
              <div>
                <label className="text-xs text-gray-400 block mb-1.5">메모 (선택)</label>
                <textarea rows={3} value={memo} onChange={e => setMemo(e.target.value)}
                  placeholder="시술 후 느낌, 효과, 다음 방문 시 참고사항..."
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder-gray-300 focus:outline-none focus:border-[#C9A96E]/50 resize-none" />
              </div>
            </div>
          )}
        </div>

        {/* 하단 버튼 */}
        <div className="px-5 pb-5 sticky bottom-0 bg-white pt-3 border-t border-gray-100 space-y-2">
          <div className="flex gap-3">
          {step > 1 && (
            <Button variant="outline" onClick={() => setStep(s => s - 1)}
              className="flex-1 border-gray-200 bg-transparent text-gray-500 hover:bg-gray-50 hover:text-gray-800">
              <ChevronLeft size={15} className="mr-1" /> 이전
            </Button>
          )}
          {!isDetailStep ? (
            <Button onClick={() => setStep(s => s + 1)} disabled={!canNext()}
              className="flex-1 bg-[#C9A96E] hover:bg-[#b8935a] text-black font-semibold disabled:opacity-25">
              다음 <ChevronRight size={15} className="ml-1" />
            </Button>
          ) : (
            <Button onClick={handleSave} disabled={!date || !clinic}
              className="flex-1 bg-[#C9A96E] hover:bg-[#b8935a] text-black font-semibold disabled:opacity-25">
              <Check size={15} className="mr-1.5" /> 저장
            </Button>
          )}
          </div>
          {onOpenParse && (
            <button
              onClick={() => { handleClose(); onOpenParse(); }}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-gray-200 text-gray-400 text-xs font-medium hover:bg-gray-50 hover:text-gray-600 transition-colors"
            >
              <Sparkles size={13} />
              텍스트 · 이미지로 한 번에 등록하기
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
