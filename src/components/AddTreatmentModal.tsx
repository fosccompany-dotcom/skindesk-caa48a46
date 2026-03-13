import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ChevronRight, ChevronLeft, Check, Zap, Sparkles, Package, Loader2 } from 'lucide-react';
import { cn, extractDistrict } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import ClinicSearchInput, { ClinicPlace } from './ClinicSearchInput';
import { TreatmentRecord } from '@/types/skin';

// ─── 시술 데이터 ────────────────────────────────────────────────────

type SL = 'epidermis' | 'dermis' | 'subcutaneous';

interface TreatmentItem {
  id: string;
  name: string;
  desc?: string;
  skinLayer: SL;
  shotOptions?: number[];
}

interface Category {
  id: string;
  label: string;
  emoji: string;
  color: string;
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
    items: [], // DB에서 동적으로 불러옴
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

// ─── DB 타입 ────────────────────────────────────────────────────────

interface DBPackage {
  id: string;
  name: string;
  clinic: string;
  total_sessions: number | null;
  used_sessions: number | null;
  skin_layer: string | null;
  body_area: string | null;
}

interface DBPackageOption {
  id: string;
  package_id: string;
  name: string;
  category: string;
  sort_order: number | null;
}

// ─── Props ──────────────────────────────────────────────────────────

interface Props {
  open: boolean;
  onClose: () => void;
  onOpenParse?: () => void;
  onSave: (record: Omit<TreatmentRecord, 'id'>) => void;
  editRecord?: TreatmentRecord | null;
  coachActive?: boolean;
}

// ─── 컴포넌트 ──────────────────────────────────────────────────────

export default function AddTreatmentModal({ open, onClose, onSave, editRecord, onOpenParse, coachActive }: Props) {
  const { user } = useAuth();
  const [mode, setMode] = useState<'record' | 'package'>('record');
  const [step, setStep] = useState(1);
  const [catId, setCatId] = useState<string | null>(null);
  const [itemId, setItemId] = useState<string | null>(null);
  const [shots, setShots] = useState<number | null>(null);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [clinic, setClinic] = useState('밴스 미금');
  const [clinicKakaoId, setClinicKakaoId] = useState<string | null>(null);
  const [clinicDistrict, setClinicDistrict] = useState<string | null>(null);
  const [clinicAddress, setClinicAddress] = useState<string | null>(null);
  const [satisfaction, setSatisfaction] = useState<1 | 2 | 3 | 4 | 5>(4);
  const [memo, setMemo] = useState('');

  // 시술권 추가 전용 state
  const [pkgTotal, setPkgTotal] = useState<number>(10);
  const [pkgUsed, setPkgUsed] = useState<number>(0);
  const [pkgExpiry, setPkgExpiry] = useState('');
  const [pkgSaving, setPkgSaving] = useState(false);

  // 패키지 선택 플로우 state
  const [userPackages, setUserPackages] = useState<DBPackage[]>([]);
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);
  const [packageOptions, setPackageOptions] = useState<DBPackageOption[]>([]);
  const [selectedOptionName, setSelectedOptionName] = useState<string | null>(null);
  const [pkgLoading, setPkgLoading] = useState(false);
  const [optionsLoading, setOptionsLoading] = useState(false);
  const [optionsError, setOptionsError] = useState(false);

  const isSkincareFlow = catId === 'skincare';

  // 패키지 목록 fetch
  useEffect(() => {
    if (!isSkincareFlow || !user) return;
    setPkgLoading(true);
    supabase
      .from('treatment_packages')
      .select('id, name, clinic, total_sessions, used_sessions, skin_layer, body_area')
      .eq('user_id', user.id)
      .then(({ data }) => {
        setUserPackages(data ?? []);
        setPkgLoading(false);
      });
  }, [isSkincareFlow, user]);

  // 패키지 옵션 fetch
  useEffect(() => {
    if (!selectedPackageId) { setPackageOptions([]); return; }
    setOptionsLoading(true);
    setOptionsError(false);
    supabase
      .from('package_options')
      .select('*')
      .eq('package_id', selectedPackageId)
      .order('category')
      .order('sort_order')
      .then(({ data, error }) => {
        if (error || !data) {
          setOptionsError(true);
          setPackageOptions([]);
        } else {
          setPackageOptions(data);
        }
        setOptionsLoading(false);
      });
  }, [selectedPackageId]);

  const resetClinicMeta = () => {
    setClinicKakaoId(null); setClinicDistrict(null); setClinicAddress(null);
  };

  const reset = () => {
    setStep(1); setCatId(null); setItemId(null); setShots(null);
    setDate(new Date().toISOString().split('T')[0]);
    setClinic('밴스 미금'); resetClinicMeta(); setSatisfaction(4); setMemo('');
    setPkgTotal(10); setPkgUsed(0); setPkgExpiry('');
    setSelectedPackageId(null); setSelectedOptionName(null);
    setPackageOptions([]); setUserPackages([]);
  };
  const handleClose = () => { reset(); setMode('record'); onClose(); };

  const selectedCat = CATEGORIES.find(c => c.id === catId);
  const selectedItem = selectedCat?.items.find(i => i.id === itemId);
  const needsShots = !!(selectedItem?.shotOptions?.length);

  // 스텝 계산: skincare는 4단계 고정 (카테고리→패키지→옵션→상세)
  // 일반: 3 or 4 (카테고리→시술→[샷수]→상세)
  const totalSteps = isSkincareFlow ? 4 : (needsShots ? 4 : 3);
  const isDetailStep = step === totalSteps;

  const canNext = () => {
    if (step === 1) return !!catId;
    if (isSkincareFlow) {
      if (step === 2) return !!selectedPackageId;
      if (step === 3) return !!selectedOptionName;
      return true;
    }
    if (step === 2) return !!itemId;
    if (step === 3 && needsShots) return !!shots;
    return true;
  };

  const getTreatmentName = () => {
    if (isSkincareFlow) return selectedOptionName || '';
    if (!selectedItem) return '';
    return shots ? `${selectedItem.name} ${shots}샷` : selectedItem.name;
  };

  const handleClinicTextInput = (value: string) => {
    setClinic(value);
    resetClinicMeta();
  };

  const handlePlaceSelect = (place: ClinicPlace) => {
    setClinicKakaoId(place.kakao_id ?? null);
    setClinicDistrict(extractDistrict(place.address || ''));
    setClinicAddress(place.road_address ?? place.address ?? null);
  };

  // 선택한 패키지 정보
  const selectedPkg = userPackages.find(p => p.id === selectedPackageId);

  const handleSave = () => {
    if (isSkincareFlow) {
      if (!selectedOptionName || !selectedPackageId) return;
      onSave({
        date,
        packageId: selectedPackageId, // UUID → RecordsContext가 package_uuid로 저장
        treatmentName: selectedOptionName,
        skinLayer: (selectedPkg?.skin_layer as SL) || 'epidermis',
        bodyArea: (selectedPkg?.body_area as any) || 'face',
        notes: '',
        clinic: selectedPkg?.clinic || clinic,
        satisfaction,
        memo,
        clinic_kakao_id: clinicKakaoId,
        clinic_district: clinicDistrict,
        clinic_address: clinicAddress,
        input_method: 'manual',
      });
    } else {
      if (!selectedItem) return;
      onSave({
        date,
        packageId: '',
        treatmentName: getTreatmentName(),
        skinLayer: selectedItem.skinLayer,
        bodyArea: 'face',
        notes: '',
        clinic,
        satisfaction,
        memo,
        clinic_kakao_id: clinicKakaoId,
        clinic_district: clinicDistrict,
        clinic_address: clinicAddress,
        input_method: 'manual',
      });
    }
    handleClose();
  };

  const handleSavePackage = async () => {
    if (!selectedItem || !clinic) return;
    setPkgSaving(true);
    if (!user) { setPkgSaving(false); return; }
    await supabase.from('treatment_packages').insert({
      user_id: user.id,
      name: getTreatmentName(),
      clinic,
      total_sessions: pkgTotal,
      used_sessions: pkgUsed,
      expiry_date: pkgExpiry || null,
      skin_layer: selectedItem.skinLayer,
      body_area: 'face',
    });
    setPkgSaving(false);
    handleClose();
  };

  // 옵션을 카테고리별로 그룹핑
  const groupedOptions = packageOptions.reduce<Record<string, DBPackageOption[]>>((acc, opt) => {
    (acc[opt.category] ??= []).push(opt);
    return acc;
  }, {});

  // 카테고리 카드 표시 시 skincare의 item 수는 패키지 수로 표시
  const getCategoryCount = (cat: Category) => {
    if (cat.id === 'skincare') return userPackages.length;
    return cat.items.length;
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!coachActive) handleClose(); }}>
      <DialogContent data-coach-container className="bg-white border border-gray-200 text-gray-900 max-w-md w-[92vw] max-h-[88vh] overflow-y-auto p-0" onInteractOutside={(e) => { if (coachActive) e.preventDefault(); }} onEscapeKeyDown={(e) => { if (coachActive) e.preventDefault(); }}>

        {/* 헤더 */}
        <DialogHeader className="px-5 pt-5 pb-3 border-b border-gray-200 sticky top-0 bg-white z-10">
          <DialogTitle className="text-base font-semibold">
            {editRecord ? '시술 수정' : '시술 등록'}
          </DialogTitle>

          {/* 모드 토글 */}
          {!editRecord && (
            <div data-coach="mode-toggle" className="flex mt-3 bg-muted rounded-lg p-0.5">
              <button
                onClick={() => { setMode('record'); reset(); }}
                className={cn(
                  'flex-1 py-2 text-xs font-medium rounded-md transition-all',
                  mode === 'record'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}>
                시술내역 추가
              </button>
              <button
                onClick={() => { setMode('package'); reset(); }}
                className={cn(
                  'flex-1 py-2 text-xs font-medium rounded-md transition-all flex items-center justify-center gap-1',
                  mode === 'package'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}>
                <Package size={12} /> 시술권 추가
              </button>
            </div>
          )}

          {/* 진행바 */}
          <div className="flex items-center justify-between mt-2">
            <div className="flex gap-1 flex-1">
              {Array.from({ length: totalSteps }).map((_, i) => (
                <div key={i} className={cn('h-0.5 flex-1 rounded-full transition-all',
                  i < step ? 'bg-primary' : 'bg-muted')} />
              ))}
            </div>
            <span className="text-xs text-muted-foreground ml-2">{step} / {totalSteps}</span>
          </div>
        </DialogHeader>

        <div className="px-5 py-4">

          {/* ── STEP 1: 카테고리 선택 ── */}
          {step === 1 && (
            <div>
              <p className="text-xs text-gray-400 mb-3">시술 카테고리를 선택하세요</p>
              <div data-coach="category-grid" className="grid grid-cols-2 gap-2">
                {CATEGORIES.map(cat => (
                  <button key={cat.id}
                    onClick={() => { setCatId(cat.id); setItemId(null); setShots(null); setSelectedPackageId(null); setSelectedOptionName(null); }}
                    className={cn(
                      'flex items-center gap-2.5 px-3 py-3 rounded-xl border text-left transition-all',
                      cat.color,
                      catId === cat.id ? 'border-[#C9A96E] ring-1 ring-[#C9A96E]/40' : 'hover:border-gray-400 border-gray-200'
                    )}>
                    <span className="text-lg">{cat.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-gray-800 leading-tight">{cat.label}</div>
                      <div className="text-[10px] text-gray-400 mt-0.5">
                        {cat.id === 'skincare' ? '내 패키지' : `${cat.items.length}종`}
                      </div>
                    </div>
                    {catId === cat.id && <Check size={12} className="text-[#C9A96E] shrink-0" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── SKINCARE STEP 2: 패키지 선택 ── */}
          {step === 2 && isSkincareFlow && (
            <div>
              <p className="text-xs text-gray-400 mb-3">시술할 패키지를 선택하세요</p>
              {pkgLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="animate-spin text-muted-foreground" size={24} />
                </div>
              ) : userPackages.length === 0 ? (
                <div className="text-center py-12 text-sm text-muted-foreground">
                  등록된 패키지가 없습니다
                </div>
              ) : (
                <div className="space-y-2">
                  {userPackages.map(pkg => {
                    const remaining = (pkg.total_sessions ?? 0) - (pkg.used_sessions ?? 0);
                    const exhausted = remaining <= 0;
                    return (
                      <button key={pkg.id}
                        disabled={exhausted}
                        onClick={() => setSelectedPackageId(pkg.id)}
                        className={cn(
                          'w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all text-left',
                          exhausted && 'opacity-40 cursor-not-allowed',
                          selectedPackageId === pkg.id
                            ? 'border-[#C9A96E] bg-[#C9A96E]/5 ring-1 ring-[#C9A96E]/30'
                            : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                        )}>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-gray-900 font-medium">{pkg.name}</div>
                          <div className="text-[11px] text-gray-400 mt-0.5">{pkg.clinic}</div>
                        </div>
                        <div className="flex items-center gap-2 ml-2 shrink-0">
                          <span className={cn(
                            'text-xs font-semibold px-2 py-0.5 rounded-full',
                            exhausted ? 'bg-gray-100 text-gray-400' : 'bg-green-100 text-green-700'
                          )}>
                            잔여 {remaining}회
                          </span>
                          {selectedPackageId === pkg.id && <Check size={12} className="text-[#C9A96E]" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── SKINCARE STEP 3: 옵션 선택 ── */}
          {step === 3 && isSkincareFlow && (
            <div>
              <p className="text-xs text-gray-400 mb-3">시술 옵션을 선택하세요</p>
              {optionsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="animate-spin text-muted-foreground" size={24} />
                </div>
              ) : optionsError ? (
                <div className="text-center py-12 text-sm text-destructive">
                  옵션을 불러올 수 없습니다
                </div>
              ) : packageOptions.length === 0 ? (
                <div className="text-center py-12 text-sm text-muted-foreground">
                  등록된 옵션이 없습니다
                </div>
              ) : (
                <div className="space-y-4">
                  {Object.entries(groupedOptions).map(([category, options]) => (
                    <div key={category}>
                      <div className="text-xs font-semibold text-gray-500 mb-1.5 px-1">{category}</div>
                      <div className="space-y-1.5">
                        {options.map(opt => (
                          <button key={opt.id}
                            onClick={() => setSelectedOptionName(opt.name)}
                            className={cn(
                              'w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all text-left',
                              selectedOptionName === opt.name
                                ? 'border-[#C9A96E] bg-[#C9A96E]/5 ring-1 ring-[#C9A96E]/30'
                                : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                            )}>
                            <div className="text-sm text-gray-900">{opt.name}</div>
                            {selectedOptionName === opt.name && <Check size={12} className="text-[#C9A96E]" />}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── 일반 STEP 2: 시술 선택 ── */}
          {step === 2 && !isSkincareFlow && selectedCat && (
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

          {/* ── STEP 3: 샷수 선택 (일반 플로우) ── */}
          {step === 3 && !isSkincareFlow && needsShots && selectedItem && (
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
          {isDetailStep && (isSkincareFlow ? !!selectedOptionName : !!selectedItem) && (
            <div className="space-y-4">
              {/* 선택 요약 */}
              <div className="bg-gray-50 rounded-xl px-4 py-3 border border-gray-200">
                <div className="text-[11px] text-gray-400 mb-1">
                  {mode === 'package' ? '등록할 시술권' : '등록할 시술'}
                </div>
                <div className="text-sm font-semibold text-primary">{getTreatmentName()}</div>
                {isSkincareFlow && selectedPkg && (
                  <div className="text-[11px] text-gray-400 mt-1">{selectedPkg.clinic} · {selectedPkg.name}</div>
                )}
                {!isSkincareFlow && selectedItem && (
                  <div className="mt-1.5">
                    <span className={cn('text-[10px] px-2 py-0.5 rounded-full border', SKIN_LAYER_COLOR[selectedItem.skinLayer])}>
                      {SKIN_LAYER_LABEL[selectedItem.skinLayer]}
                    </span>
                  </div>
                )}
              </div>

              {/* 시술권 모드: 횟수/만료일 */}
              {mode === 'package' && !isSkincareFlow && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-muted-foreground block mb-1.5">총 횟수</label>
                      <input type="number" min={1} value={pkgTotal} onChange={e => setPkgTotal(Number(e.target.value))}
                        className="w-full bg-white border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary/50" />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground block mb-1.5">사용 횟수</label>
                      <input type="number" min={0} value={pkgUsed} onChange={e => setPkgUsed(Number(e.target.value))}
                        className="w-full bg-white border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary/50" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1.5">만료일 (선택)</label>
                    <input type="date" value={pkgExpiry} onChange={e => setPkgExpiry(e.target.value)}
                      className="w-full bg-white border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary/50" />
                  </div>
                </>
              )}

              {/* 시술내역 모드: 날짜 */}
              {mode === 'record' && (
                <div>
                  <label className="text-xs text-gray-400 block mb-1.5">시술일</label>
                  <input type="date" value={date}
                    onChange={e => setDate(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-primary/50" />
                </div>
              )}

              {/* 병원 (공통, skincare에서는 패키지 클리닉 자동설정) */}
              <div>
                <label className="text-xs text-gray-400 block mb-1.5">병원</label>
                <ClinicSearchInput
                  value={isSkincareFlow && selectedPkg ? selectedPkg.clinic : clinic}
                  onChange={handleClinicTextInput}
                  onSelectPlace={handlePlaceSelect}
                  placeholder="병원명 검색 (예: 밴스 미금, 강남 피부과)"
                  darkMode={false} />
              </div>

              {/* 만족도 (시술내역만) */}
              {mode === 'record' && (
                <div>
                  <label className="text-xs text-gray-400 block mb-1.5">만족도</label>
                  <div className="flex gap-2">
                    {[1,2,3,4,5].map(s => (
                      <button key={s} onClick={() => setSatisfaction(s as 1 | 2 | 3 | 4 | 5)}
                        className={cn(
                          'flex-1 py-2 rounded-lg border text-sm font-bold transition-all',
                          satisfaction === s
                            ? 'border-primary bg-primary/15 text-primary'
                            : 'border-gray-200 text-gray-300 hover:border-gray-400'
                        )}>
                        {'★'.repeat(s)}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 메모 (공통) */}
              <div>
                <label className="text-xs text-gray-400 block mb-1.5">메모 (선택)</label>
                <textarea rows={3} value={memo} onChange={e => setMemo(e.target.value)}
                  placeholder={mode === 'package' ? '시술권 관련 메모...' : '시술 후 느낌, 효과, 다음 방문 시 참고사항...'}
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder-gray-300 focus:outline-none focus:border-primary/50 resize-none" />
              </div>
            </div>
          )}
        </div>

        {/* 하단 버튼 */}
        <div className="px-5 pb-5 sticky bottom-0 bg-white pt-3 border-t border-gray-100 space-y-2">
          <div className="flex gap-3">
            {step > 1 && (
              <Button variant="outline" onClick={() => setStep(s => s - 1)}
                className="flex-1 border-border bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground">
                <ChevronLeft size={15} className="mr-1" /> 이전
              </Button>
            )}
            {!isDetailStep ? (
              <Button onClick={() => setStep(s => s + 1)} disabled={!canNext()}
                className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold disabled:opacity-25">
                다음 <ChevronRight size={15} className="ml-1" />
              </Button>
            ) : (
              <Button
                onClick={mode === 'package' && !isSkincareFlow ? handleSavePackage : handleSave}
                disabled={
                  isSkincareFlow
                    ? (!selectedOptionName || !selectedPackageId)
                    : mode === 'package'
                      ? (!selectedItem || !clinic || pkgSaving)
                      : (!date || !clinic)
                }
                className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold disabled:opacity-25">
                <Check size={15} className="mr-1.5" />
                {mode === 'package' ? (pkgSaving ? '저장 중...' : '시술권 저장') : '저장'}
              </Button>
            )}
          </div>
          {onOpenParse && (
            <button
              data-coach="parse-button"
              onClick={() => { handleClose(); onOpenParse(); }}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-border text-muted-foreground text-xs font-medium hover:bg-muted hover:text-foreground transition-colors"
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
