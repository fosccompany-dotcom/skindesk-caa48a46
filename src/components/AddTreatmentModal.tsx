import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ChevronRight, ChevronLeft, Check, Zap, Sparkles, Package, CreditCard, Coins, Banknote, Gift } from 'lucide-react';
import { cn } from '@/lib/utils';
import ClinicSearchInput from './ClinicSearchInput';
import { TreatmentRecord } from '@/types/skin';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/i18n/LanguageContext';
import { Skeleton } from '@/components/ui/skeleton';

// ─── 미금 밴스의원 실제 시술 데이터 ────────────────────────────────

type SL = 'epidermis' | 'dermis' | 'subcutaneous';

interface DrugOption {
  id: string;
  name: string;
  desc?: string;
}

const BOTOX_DRUGS: DrugOption[] = [
  { id: 'kr_botox',    name: '국산 보톡스',     desc: '보툴렉스·나보타 등 합리적 가격' },
  { id: 'imp_botox',   name: '수입 보톡스',     desc: '레스틸렌·쥬비덤 등 수입 제품' },
  { id: 'coretox',     name: '코어톡스',        desc: '내성 적은 국산 보톡스' },
  { id: 'xeomin',      name: '제오민',          desc: '독일 · 순수 보톡스' },
  { id: 'allergan',    name: '엘러간',          desc: '미국 · 프리미엄' },
  { id: 'aquatoxin',   name: '아쿠아톡신',      desc: '피부 직접 주사 보톡스' },
  { id: 'mesobotox',   name: '메조보톡스',      desc: '모공·피지 개선 보톡스' },
];

const BOTOX_AREA_OPTIONS = [
  { value: 'jaw',           label: '사각턱' },
  { value: 'wrinkle',       label: '주름 (이마·눈가·미간)' },
  { value: 'special',       label: '특수부위 (침샘·측두근·콧볼)' },
  { value: 'trapezius',     label: '승모근' },
  { value: 'calf',          label: '종아리' },
  { value: 'thigh_arm',     label: '허벅지/팔뚝' },
  { value: 'hyperhidrosis', label: '다한증' },
  { value: 'hair_loss',     label: '탈모' },
  { value: '__other',       label: '기타 (직접입력)' },
];

// ─── Display types (unified for DB & fallback) ──────────────────
interface DisplayItem {
  id: string;
  name: string;
  desc?: string;
  skinLayer?: SL;
  shotOptions?: number[];
}

interface DisplayCategory {
  id: string;
  label: string;
  emoji: string;
  color: string;
  items: DisplayItem[];
}

interface TreatmentItem {
  id: string;
  name: string;
  desc?: string;
  skinLayer: SL;
  shotOptions?: number[];
  drugOptions?: DrugOption[];
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
      { id: 'shrink',      name: '슈링크 유니버스',   desc: '효과UP 통증DOWN 밀착 리프팅',    skinLayer: 'subcutaneous', shotOptions: [100,200,300,600] },
      { id: 'ulthera_fp',  name: '울쎄라 피프라임',   desc: '프리미엄 초음파 리프팅',         skinLayer: 'subcutaneous', shotOptions: [100,200,300,600] },
      { id: 'ulthera',     name: '울쎄라 리프팅',      desc: '보이는 초음파 리프팅',           skinLayer: 'subcutaneous', shotOptions: [100,200,300,600] },
      { id: 'serf',        name: '세르프 리프팅',      desc: '프리미엄 고주파 리프팅',         skinLayer: 'subcutaneous', shotOptions: [100,200,300,600] },
      { id: 'thermage',    name: '써마지 FLX',         desc: '고주파 에너지 리프팅',           skinLayer: 'subcutaneous' },
      { id: 'density',     name: '덴서티',              desc: '프리미엄 연예인 리프팅',         skinLayer: 'subcutaneous' },
      { id: 'onda',        name: '온다 리프팅',         desc: '차세대 극초단파 레이저',         skinLayer: 'subcutaneous' },
      { id: 'inmode',      name: '인모드',              desc: '토탈 안티에이징 리프팅',         skinLayer: 'subcutaneous' },
      { id: 'oligio',      name: '올리지오',            desc: '콜라겐 활성화 리프팅',           skinLayer: 'subcutaneous' },
      { id: 'titanium',    name: '티타늄 리프팅',       desc: '고주파 티타늄 안티에이징',       skinLayer: 'subcutaneous' },
      { id: 'tensema',     name: '텐써마',              desc: '고주파 열에너지 리프팅',         skinLayer: 'subcutaneous' },
      { id: 'tensera',     name: '텐쎄라',              desc: '초음파+고주파 복합 리프팅',      skinLayer: 'subcutaneous' },
      { id: 'emface',      name: '엠페이스',            desc: 'RF+HIFES 근육·피부 동시 케어', skinLayer: 'subcutaneous' },
      { id: 'volnumar',    name: '볼뉴머',              desc: '피부 속 콜라겐 재생 리프팅',     skinLayer: 'subcutaneous' },
      { id: 'ldm',         name: 'LDM 리프팅',          desc: '초음파 피부 진동 재생 리프팅',   skinLayer: 'dermis' },
    ],
  },
  {
    id: 'botox',
    label: '보톡스/윤곽주사',
    emoji: '💉',
    color: 'border-blue-300 bg-blue-50',
    items: [
      { id: 'contour',       name: '윤곽주사',                desc: '갸름한 얼굴라인을 위한 주사',       skinLayer: 'subcutaneous' },
    ],
  },
  {
    id: 'filler',
    label: '필러/실리프팅',
    emoji: '🌙',
    color: 'border-indigo-300 bg-indigo-50',
    items: [
      { id: 'filler_kr',        name: '국산 필러 (아띠에르/뉴라미스)', desc: '자연스러운 볼륨 UP',      skinLayer: 'dermis' },
      { id: 'filler_imp',       name: '수입 필러 (레스틸렌/쥬비덤)',   desc: '자연스러운 볼륨 UP',      skinLayer: 'dermis' },
      { id: 'filler_chin',      name: '턱끝 필러',       desc: '자연스러운 볼륨 UP',      skinLayer: 'dermis' },
      { id: 'filler_lip',       name: '입술 필러',       desc: '황금비율 입술 디자인',    skinLayer: 'dermis' },
      { id: 'filler_nose',      name: '코 필러',         desc: '자연스러운 코 높이 개선', skinLayer: 'dermis' },
      { id: 'filler_eye',       name: '눈밑 필러',       desc: '다크서클·눈밑 꺼짐 개선', skinLayer: 'dermis' },
      { id: 'filler_aegyo',     name: '애교살 필러',     desc: '자연스러운 애교살 볼륨',  skinLayer: 'dermis' },
      { id: 'filler_lip_corner',name: '입꼬리 필러',     desc: '처진 입꼬리 개선',        skinLayer: 'dermis' },
      { id: 'filler_neck',      name: '목주름 필러',     desc: '목가로주름 개선',         skinLayer: 'dermis' },
      { id: 'filler_sp',        name: '기타 특수부위 필러', desc: '자연스러운 볼륨 UP',   skinLayer: 'dermis' },
      { id: 'sculptra',         name: '스컬트라',        desc: '콜라겐 자극 볼륨 회복',   skinLayer: 'subcutaneous' },
      { id: 'thread',           name: '실리프팅',        desc: '자연스럽고 강력한 효과',  skinLayer: 'subcutaneous' },
    ],
  },
  {
    id: 'booster',
    label: '스킨부스터',
    emoji: '💧',
    color: 'border-cyan-300 bg-cyan-50',
    items: [
      { id: 'skinvive',   name: '스킨바이브',         desc: '프리미엄 히알루론산 스킨부스터',      skinLayer: 'dermis' },
      { id: 'rejuran',    name: '리쥬란 힐러',         desc: 'PN 성분 잔주름 탄력 개선',            skinLayer: 'dermis' },
      { id: 'rejuran_hb', name: '리쥬란HB',            desc: '히알루론산+PN 복합 부스터',           skinLayer: 'dermis' },
      { id: 'eye_rejuran',name: '아이리쥬란',          desc: '눈 주변 전용 리쥬란',                 skinLayer: 'dermis' },
      { id: 'juvelook',   name: '쥬베룩 스킨',         desc: '자가조직재생 콜라겐 부스터',          skinLayer: 'dermis' },
      { id: 'juvelook_v', name: '쥬베룩 볼륨',         desc: '볼륨감 있는 콜라겐 부스터',           skinLayer: 'dermis' },
      { id: 'juvelook_eye',name: '쥬베룩 아이',        desc: '눈가 전용 쥬베룩',                    skinLayer: 'dermis' },
      { id: 'radiesse',   name: '레디어스',             desc: '스킨·코어부터 채우는 볼륨 부스터',   skinLayer: 'dermis' },
      { id: 'revive',     name: '리바이브',             desc: '글리세롤+HA 결합 오래가는 촉촉함',   skinLayer: 'dermis' },
      { id: 'retizen',    name: '레티젠',               desc: '레티놀+HA 콜라겐 스킨부스터',        skinLayer: 'dermis' },
      { id: 'litoure',    name: '리투오',               desc: '단백질+HA 피부 재생 부스터',          skinLayer: 'dermis' },
      { id: 'exosome',    name: '엑소좀',               desc: '줄기세포 유래 피부 재생',             skinLayer: 'dermis' },
      { id: 'mihee',      name: '미희주사',             desc: '꺼진 눈밑 볼륨에 특화된 콜라겐주사', skinLayer: 'dermis' },
      { id: 'mulgwang',   name: '물광주사',             desc: 'HA로 피부 속부터 채우는 수분감',     skinLayer: 'dermis' },
      { id: 'potenza',    name: '포텐자',               desc: '모공·흉터·홍조 맞춤형 고주파',       skinLayer: 'dermis' },
      { id: 'colaster',   name: '콜라스터',             desc: '6가지 앰플 맞춤 콜라겐 부스터',      skinLayer: 'dermis' },
      { id: 'oneday_b',   name: '원데이 스킨부스터',   desc: '내 피부 맞춤 스킨부스터',             skinLayer: 'dermis' },
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
      { id: 'excelv',      name: '엑셀V',         desc: '색소·기미·잡티 제거 레이저',   skinLayer: 'epidermis' },
      { id: 'picotoning',  name: '피코토닝',      desc: '피부를 맑고 깨끗하게',         skinLayer: 'epidermis' },
      { id: 'lasertoning', name: '레이저토닝',    desc: '멜라닌 색소 저하 토닝',        skinLayer: 'epidermis' },
      { id: 'picofrac',    name: '피코프락셀',    desc: '기미·잡티·모공 복합 개선',     skinLayer: 'epidermis' },
      { id: 'whitetone',   name: '미백토닝',      desc: '피부를 맑고 깨끗하게',         skinLayer: 'epidermis' },
      { id: 'lipat',       name: '리팟레이저',    desc: '단 한번으로 흑자 제거',        skinLayer: 'epidermis' },
      { id: 'aladdin_peel',name: '알라딘필링',    desc: '피부결·색소 복합 개선 필링',   skinLayer: 'epidermis' },
      { id: 'pha_peel',    name: 'PHA필링',       desc: '자극 적은 피부 재생 필링',     skinLayer: 'epidermis' },
      { id: 'cooms_peel',  name: '쿰스필링',      desc: '색소·모공 맞춤 필링',          skinLayer: 'epidermis' },
    ],
  },
  {
    id: 'acne',
    label: '여드름/점제거',
    emoji: '🔬',
    color: 'border-rose-300 bg-rose-50',
    items: [
      { id: 'mole',        name: '점/쥐젖/사마귀/검버섯 제거', desc: '피부 손상 최소화 제거',    skinLayer: 'epidermis' },
      { id: 'acne_tx',     name: '여드름 치료',                desc: '아그네스/여드름진정주사',  skinLayer: 'epidermis' },
      { id: 'acne_peel',   name: '아크네필링',                 desc: '여드름·모공 전용 필링',    skinLayer: 'epidermis' },
      { id: 'potenza_face',name: '포텐자 얼굴전체',            desc: '모공·흉터·홍조 고주파',    skinLayer: 'epidermis' },
      { id: 'kapri',       name: '카프리레이저',               desc: '피지샘억제 여드름 레이저', skinLayer: 'epidermis' },
    ],
  },
  {
    id: 'fat',
    label: '지방분해/윤곽주사',
    emoji: '🔥',
    color: 'border-orange-300 bg-orange-50',
    items: [
      { id: 'fat_general',  name: '지방분해주사',         desc: '고농도 지방분해 주사',            skinLayer: 'subcutaneous' },
      { id: 'fat_face',     name: '얼굴 지방분해주사',    desc: '얼굴 전용 지방분해',              skinLayer: 'subcutaneous' },
      { id: 'fat_body',     name: '바디 지방분해주사',    desc: '복부·허벅지·팔뚝 지방분해',      skinLayer: 'subcutaneous' },
      { id: 'contour_inj',  name: '윤곽주사',             desc: '브이라인 윤곽 개선 주사',         skinLayer: 'subcutaneous' },
      { id: 'sculpt_inj',   name: '조각주사',             desc: '얼굴 조각·입체감 주사',           skinLayer: 'subcutaneous' },
      { id: 'violet_inj',   name: '브이올렛',             desc: '리프팅+지방분해 복합 주사',       skinLayer: 'subcutaneous' },
      { id: 'zerofit_inj',  name: '제로핏',               desc: '지방세포 사멸 비수술 체형관리',   skinLayer: 'subcutaneous' },
      { id: 'belacolin',    name: '벨라콜린',             desc: '카르니틴 복합 지방분해',          skinLayer: 'subcutaneous' },
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
      { id: 'diode_m',   name: '다이오드 레이저 남성제모',    skinLayer: 'epidermis' },
      { id: 'diode_f',   name: '다이오드 레이저 여성제모',    skinLayer: 'epidermis' },
      { id: 'shr',       name: 'SHR 제모',                    desc: '통증 적은 고속 제모',  skinLayer: 'epidermis' },
    ],
  },
  {
    id: 'iv',
    label: '수액/영양주사',
    emoji: '🌱',
    color: 'border-teal-300 bg-teal-50',
    items: [
      { id: 'iv_drip',    name: '수액주사',        desc: '숙취·피로해소 수액',          skinLayer: 'dermis' },
      { id: 'iv_white',   name: '백옥주사',        desc: '글루타치온 미백·항산화',      skinLayer: 'dermis' },
      { id: 'iv_cinder',  name: '신데렐라주사',    desc: '알파리포산 미백·항산화',      skinLayer: 'dermis' },
      { id: 'iv_vitamin', name: '비타민주사',      desc: '비타민C 고용량 면역 강화',    skinLayer: 'dermis' },
      { id: 'iv_placenta',name: '태반주사',        desc: '라엔넥·멜스몬 항노화',        skinLayer: 'dermis' },
      { id: 'stemcell',   name: '줄기세포',        desc: '피부재생 줄기세포 시술',      skinLayer: 'dermis' },
    ],
  },
];

// ─── Category metadata (emoji/color) ───
// Covers both DB category names and fallback hardcoded IDs
const CATEGORY_META: Record<string, { emoji: string; color: string }> = {
  // DB categories
  '리프팅·보톡스':     { emoji: '✨', color: 'border-purple-300 bg-purple-50' },
  '필러·실리프팅':     { emoji: '🌙', color: 'border-indigo-300 bg-indigo-50' },
  '스킨부스터':        { emoji: '💧', color: 'border-cyan-300 bg-cyan-50' },
  '피부 관리':         { emoji: '🌿', color: 'border-green-300 bg-green-50' },
  '미백·색소':         { emoji: '⚡', color: 'border-amber-300 bg-amber-50' },
  '여드름·흉터':       { emoji: '🔬', color: 'border-rose-300 bg-rose-50' },
  '지방분해':          { emoji: '🔥', color: 'border-orange-300 bg-orange-50' },
  '제모':              { emoji: '🪄', color: 'border-slate-300 bg-slate-50' },
  '수액·영양주사':     { emoji: '🌱', color: 'border-teal-300 bg-teal-50' },
  '주사 관리':         { emoji: '💉', color: 'border-cyan-300 bg-cyan-50' },
  '탈모·두피':         { emoji: '🌱', color: 'border-teal-300 bg-teal-50' },
  '기타':              { emoji: '💊', color: 'border-gray-300 bg-gray-50' },
  // Fallback hardcoded category IDs
  'lifting':           { emoji: '✨', color: 'border-purple-300 bg-purple-50' },
  'botox':             { emoji: '💉', color: 'border-blue-300 bg-blue-50' },
  'filler':            { emoji: '🌙', color: 'border-indigo-300 bg-indigo-50' },
  'booster':           { emoji: '💧', color: 'border-cyan-300 bg-cyan-50' },
  'skincare':          { emoji: '🌿', color: 'border-green-300 bg-green-50' },
  'whitening':         { emoji: '⚡', color: 'border-amber-300 bg-amber-50' },
  'acne':              { emoji: '🔬', color: 'border-rose-300 bg-rose-50' },
  'fat':               { emoji: '🔥', color: 'border-orange-300 bg-orange-50' },
  'hair_removal':      { emoji: '🪄', color: 'border-slate-300 bg-slate-50' },
  'iv':                { emoji: '🌱', color: 'border-teal-300 bg-teal-50' },
};
const DEFAULT_CAT_META = { emoji: '💊', color: 'border-gray-300 bg-gray-50' };

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
  const { language } = useLanguage();
  const [step, setStep] = useState(1);
  const [catId, setCatId] = useState<string | null>(null);
  const [itemId, setItemId] = useState<string | null>(null);
  const [shots, setShots] = useState<number | null>(null);
  const [drugId, setDrugId] = useState<string | null>(null);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [clinic, setClinic] = useState('밴스 미금');
  const [satisfaction, setSatisfaction] = useState<1 | 2 | 3 | 4 | 5>(4);
  const [memo, setMemo] = useState('');
  const [bodyArea, setBodyArea] = useState('face');
  const [customBodyArea, setCustomBodyArea] = useState('');
  const [availPkgs, setAvailPkgs] = useState<{ id: string; name: string; remaining: number }[]>([]);
  const [selectedPkgId, setSelectedPkgId] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [customTreatmentName, setCustomTreatmentName] = useState('');

  // ── Filler state ──
  const [fillerDrugId, setFillerDrugId] = useState<string | null>(null);
  const [fillerAreaId, setFillerAreaId] = useState<string | null>(null);
  const [fillerDrugOptions, setFillerDrugOptions] = useState<any[]>([]);
  const [fillerAreaOptions, setFillerAreaOptions] = useState<any[]>([]);
  const [customFillerArea, setCustomFillerArea] = useState('');

  // ── DB categories ──
  const [dbOptions, setDbOptions] = useState<any[]>([]);
  const [dbLoading, setDbLoading] = useState(true);

  const BODY_AREA_OPTIONS_WITH_OTHER = [
    { value: 'face', label: '얼굴' },
    { value: 'jaw', label: '턱' },
    { value: 'eye', label: '눈' },
    { value: 'lip', label: '입술' },
    { value: 'body', label: '바디' },
    { value: 'neck', label: '목' },
    { value: 'arm', label: '팔' },
    { value: 'leg', label: '다리' },
    { value: 'abdomen', label: '복부' },
    { value: 'back', label: '등' },
    { value: 'chest', label: '가슴' },
    { value: 'hip', label: '엉덩이/힙' },
    { value: '__other', label: '기타 (직접입력)' },
  ];

  const reset = () => {
    setStep(1); setCatId(null); setItemId(null); setShots(null); setDrugId(null);
    setDate(new Date().toISOString().split('T')[0]);
    setClinic('밴스 미금'); setSatisfaction(4); setMemo('');
    setBodyArea('face'); setCustomBodyArea(''); setCustomTreatmentName('');
    setAvailPkgs([]); setSelectedPkgId('');
    setPaymentMethod(null); setPaymentAmount('');
    setFillerDrugId(null); setFillerAreaId(null); setCustomFillerArea('');
  };
  const handleClose = () => { reset(); onClose(); };

  // ── Fetch package_options from Supabase ──
  useEffect(() => {
    supabase
      .from('package_options')
      .select('id, category, name, category_en, name_en, category_zh, name_zh')
      .is('package_id', null)
      .eq('is_default', true)
      .order('category')
      .order('sort_order')
      .then(({ data, error }) => {
        if (!error && data?.length) setDbOptions(data);
        setDbLoading(false);
      });
  }, []);

  // ── Fetch filler drug/area options from DB ──
  useEffect(() => {
    supabase
      .from('package_options')
      .select('id, name, name_en, name_zh, sub_type')
      .eq('category', '필러·실리프팅')
      .is('package_id', null)
      .eq('is_default', true)
      .order('sort_order')
      .then(({ data }) => {
        if (data) {
          setFillerDrugOptions(data.filter((d: any) => d.sub_type === 'drug'));
          setFillerAreaOptions(data.filter((d: any) => d.sub_type === 'area'));
        }
      });
  }, []);

  // ── Build display categories: DB primary, hardcoded fallback ──
  const displayCategories: DisplayCategory[] = useMemo(() => {
    const customLabel = language === 'en' ? 'Custom Input'
                      : language === 'zh' ? '自定义输入'
                      : '직접 입력';

    // If no DB data, fall back to hardcoded
    if (dbOptions.length === 0) {
      return CATEGORIES.map(c => ({
        id: c.id,
        label: c.label,
        emoji: c.emoji,
        color: c.color,
        items: [
          ...c.items.map(i => ({ id: i.id, name: i.name, desc: i.desc, skinLayer: i.skinLayer, shotOptions: i.shotOptions })),
          { id: '__custom', name: customLabel },
        ],
      }));
    }

    // Use DB data as primary source
    const groups: Record<string, DisplayItem[]> = {};
    const catLabels: Record<string, string> = {};

    for (const opt of dbOptions) {
      const catKey = opt.category;
      const catLabel = language === 'en' ? (opt.category_en || opt.category)
                     : language === 'zh' ? (opt.category_zh || opt.category)
                     : opt.category;
      const itemName = language === 'en' ? (opt.name_en || opt.name)
                     : language === 'zh' ? (opt.name_zh || opt.name)
                     : opt.name;

      if (!groups[catKey]) {
        groups[catKey] = [];
        catLabels[catKey] = catLabel;
      }
      groups[catKey].push({ id: opt.id, name: itemName });
    }

    return Object.entries(groups).map(([catKey, items]) => {
      const meta = CATEGORY_META[catKey] || DEFAULT_CAT_META;
      return {
        id: catKey,
        label: catLabels[catKey],
        emoji: meta.emoji,
        color: meta.color,
        items: [...items, { id: '__custom', name: customLabel }],
      };
    });
  }, [dbOptions, language]);

  const selectedCat = displayCategories.find(c => c.id === catId);
  const isBotox = catId === 'botox' || catId === '보톡스/윤곽주사';
  const isFiller = catId === 'filler' || catId === '필러·실리프팅';
  const selectedItem = selectedCat?.items.find(i => i.id === itemId);
  const needsShots = !!(selectedItem?.shotOptions?.length);

  const botoxTotalSteps = 4;
  const normalExtraSteps = needsShots ? 1 : 0;
  const normalTotalSteps = 3 + normalExtraSteps;
  const totalSteps = isBotox ? botoxTotalSteps : isFiller ? 4 : normalTotalSteps;

  const shotsStep = needsShots ? 3 : -1;
  const isDetailStep = isBotox ? step === 4 : isFiller ? step === 4 : step === (needsShots ? 4 : 3);

  // 상세 단계 진입 시 사용 가능한 시술권 조회
  useEffect(() => {
    if (!isDetailStep) return;
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
  }, [isDetailStep]);

  const canNext = () => {
    if (step === 1) return !!catId;
    if (isBotox) return true;
    if (isFiller) return true;
    if (step === 2) {
      if (itemId === '__custom') return !!customTreatmentName.trim();
      return !!itemId;
    }
    if (step === shotsStep) return !!shots;
    return true;
  };

  const selectedDrug = BOTOX_DRUGS.find(d => d.id === drugId);

  const getLocalizedName = (opt: any) => {
    if (language === 'en') return opt.name_en || opt.name;
    if (language === 'zh') return opt.name_zh || opt.name;
    return opt.name;
  };

  const selectedFillerDrug = fillerDrugOptions.find(d => d.id === fillerDrugId);
  const selectedFillerArea = fillerAreaOptions.find(a => a.id === fillerAreaId);

  const getTreatmentName = () => {
    if (isBotox) {
      return selectedDrug ? selectedDrug.name : '보톡스';
    }
    if (isFiller) {
      const drugName = selectedFillerDrug ? getLocalizedName(selectedFillerDrug) : null;
      const areaName = fillerAreaId === '__custom'
        ? (customFillerArea.trim() || null)
        : selectedFillerArea ? getLocalizedName(selectedFillerArea) : null;
      if (drugName && areaName) return `${drugName} - ${areaName}`;
      if (areaName) return `필러 - ${areaName}`;
      if (drugName) return drugName;
      return '필러';
    }
    if (itemId === '__custom') return customTreatmentName.trim() || '';
    if (!selectedItem) return '';
    let name = selectedItem.name;
    if (shots) name += ` ${shots}샷`;
    return name;
  };

  const getBotoxSkinLayer = (): SL => {
    if (drugId === 'aquatoxin' || drugId === 'mesobotox') return 'dermis';
    return 'subcutaneous';
  };

  // 결제 수단 → DB 값 매핑
  const resolvePaymentMethod = (): string | null => {
    if (selectedPkgId) return 'package';
    return paymentMethod;
  };

  const handleSave = () => {
    if (!isBotox && !isFiller && !selectedItem) return;
    const pm = resolvePaymentMethod();
    const amt = (!selectedPkgId && paymentMethod && paymentMethod !== 'service' && paymentAmount)
      ? parseInt(paymentAmount, 10) || null
      : null;
    const resolvedBodyArea = bodyArea === '__other' ? (customBodyArea.trim() || 'other') : bodyArea;
    const skinLayer = isBotox ? getBotoxSkinLayer() : isFiller ? 'dermis' as SL : (selectedItem?.skinLayer || 'dermis');
    onSave({
      date,
      packageId:     selectedPkgId || '',
      treatmentName: getTreatmentName(),
      skinLayer,
      bodyArea:      resolvedBodyArea,
      notes:         '',
      clinic,
      satisfaction,
      memo,
      payment_method: pm,
      payment_amount: amt,
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
              <p className="text-xs text-gray-400 mb-3">
                {language === 'en' ? 'Select a treatment category' : language === 'zh' ? '选择治疗类别' : '시술 카테고리를 선택하세요'}
              </p>
              {dbLoading ? (
                <div className="grid grid-cols-2 gap-2">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 rounded-xl" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {displayCategories.map(cat => (
                    <button key={cat.id}
                      onClick={() => { setCatId(cat.id); setItemId(null); setShots(null); setDrugId(null); setCustomTreatmentName(''); }}
                      className={cn(
                        'flex items-center gap-2.5 px-3 py-3 rounded-xl border text-left transition-all',
                        cat.color,
                        catId === cat.id ? 'border-[#C9A96E] ring-1 ring-[#C9A96E]/40' : 'hover:border-gray-400 border-gray-200'
                      )}>
                      <span className="text-lg">{cat.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-gray-800 leading-tight">{cat.label}</div>
                        <div className="text-[10px] text-gray-400 mt-0.5">{cat.items.filter(i => i.id !== '__custom').length}종</div>
                      </div>
                      {catId === cat.id && <Check size={12} className="text-[#C9A96E] shrink-0" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── STEP 2 (필러): 약제 선택 ── */}
          {step === 2 && isFiller && (
            <div>
              <p className="text-xs text-gray-400 mb-1">
                {language === 'en' ? 'Select filler product (optional)' : language === 'zh' ? '选择填充产品（可选）' : '필러 종류를 선택하세요 (선택사항)'}
              </p>
              <p className="text-sm font-semibold text-gray-900 mb-4">🌙 {language === 'en' ? 'Filler' : language === 'zh' ? '填充剂' : '필러·실리프팅'}</p>
              <div className="space-y-1.5">
                {fillerDrugOptions.map(drug => (
                  <button key={drug.id}
                    onClick={() => setFillerDrugId(prev => prev === drug.id ? null : drug.id)}
                    className={cn(
                      'w-full flex items-center justify-between px-4 py-3.5 rounded-xl border transition-all text-left',
                      fillerDrugId === drug.id
                        ? 'border-[#C9A96E] bg-[#C9A96E]/5 ring-1 ring-[#C9A96E]/30'
                        : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                    )}>
                    <div className="text-sm text-gray-900 font-medium">{getLocalizedName(drug)}</div>
                    {fillerDrugId === drug.id && <Check size={12} className="text-[#C9A96E] shrink-0" />}
                  </button>
                ))}
              </div>
              <button
                onClick={() => { setFillerDrugId(null); setStep(3); }}
                className="w-full mt-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-colors"
              >
                {language === 'en' ? 'Skip →' : language === 'zh' ? '跳过 →' : '건너뛰기 →'}
              </button>
            </div>
          )}

          {/* ── STEP 3 (필러): 부위 선택 ── */}
          {step === 3 && isFiller && (
            <div>
              <p className="text-xs text-gray-400 mb-1">
                {language === 'en' ? 'Select treatment area' : language === 'zh' ? '选择治疗部位' : '시술 부위를 선택하세요'}
              </p>
              <p className="text-sm font-semibold text-gray-900 mb-4">
                🌙 {selectedFillerDrug ? getLocalizedName(selectedFillerDrug) : (language === 'en' ? 'Filler' : language === 'zh' ? '填充剂' : '필러')}
              </p>
              <div className="grid grid-cols-3 gap-2">
                {fillerAreaOptions.map(area => (
                  <button key={area.id}
                    onClick={() => { setFillerAreaId(prev => prev === area.id ? null : area.id); setCustomFillerArea(''); }}
                    className={cn(
                      'py-3 rounded-xl border text-sm font-medium transition-all',
                      fillerAreaId === area.id
                        ? 'border-[#C9A96E] bg-[#C9A96E]/10 text-[#C9A96E]'
                        : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300'
                    )}>
                    {getLocalizedName(area)}
                  </button>
                ))}
                <button
                  onClick={() => setFillerAreaId(prev => prev === '__custom' ? null : '__custom')}
                  className={cn(
                    'py-3 rounded-xl border text-sm font-medium transition-all',
                    fillerAreaId === '__custom'
                      ? 'border-[#C9A96E] bg-[#C9A96E]/10 text-[#C9A96E]'
                      : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300'
                  )}>
                  {language === 'en' ? 'Other' : language === 'zh' ? '其他' : '기타 (직접입력)'}
                </button>
              </div>
              {fillerAreaId === '__custom' && (
                <input
                  type="text"
                  value={customFillerArea}
                  onChange={e => setCustomFillerArea(e.target.value)}
                  placeholder={language === 'en' ? 'Enter area' : language === 'zh' ? '请输入部位' : '부위를 입력하세요'}
                  className="w-full mt-3 bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-[#C9A96E]/50"
                />
              )}
            </div>
          )}

          {/* ── STEP 2: 시술 선택 (비보톡스/비필러) ── */}
          {step === 2 && selectedCat && !isBotox && !isFiller && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">{selectedCat.emoji}</span>
                <p className="text-sm font-semibold text-gray-900">{selectedCat.label}</p>
              </div>
              <div className="space-y-1.5">
                {selectedCat.items.map(item => (
                  <button key={item.id}
                    onClick={() => { setItemId(item.id); setShots(null); if (item.id !== '__custom') setCustomTreatmentName(''); }}
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
                      {item.skinLayer && (
                        <span className={cn('text-[10px] px-1.5 py-0.5 rounded-full border', SKIN_LAYER_COLOR[item.skinLayer])}>
                          {SKIN_LAYER_LABEL[item.skinLayer].replace('조직','').replace('층','')}
                        </span>
                      )}
                      {item.shotOptions?.length ? (
                        <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
                          <Zap size={9} />샷
                        </span>
                      ) : null}
                      {itemId === item.id && <Check size={12} className="text-[#C9A96E]" />}
                    </div>
                  </button>
                ))}
              </div>
              {itemId === '__custom' && (
                <input
                  type="text"
                  value={customTreatmentName}
                  onChange={e => setCustomTreatmentName(e.target.value)}
                  placeholder={language === 'en' ? 'Enter treatment name' : language === 'zh' ? '请输入项目名称' : '시술명을 입력하세요'}
                  className="w-full mt-3 bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-[#C9A96E]/50"
                />
              )}
            </div>
          )}

          {/* ── STEP 2 (보톡스): 약물 선택 ── */}
          {step === 2 && isBotox && (
            <div>
              <p className="text-xs text-gray-400 mb-1">사용 약물을 선택하세요</p>
              <p className="text-sm font-semibold text-gray-900 mb-4">💉 보톡스/윤곽주사</p>
              <div className="space-y-1.5">
                {BOTOX_DRUGS.map(drug => (
                  <button key={drug.id}
                    onClick={() => setDrugId(drug.id)}
                    className={cn(
                      'w-full flex items-center justify-between px-4 py-3.5 rounded-xl border transition-all text-left',
                      drugId === drug.id
                        ? 'border-[#C9A96E] bg-[#C9A96E]/5 ring-1 ring-[#C9A96E]/30'
                        : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                    )}>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-gray-900 font-medium">{drug.name}</div>
                      {drug.desc && <div className="text-[11px] text-gray-400 mt-0.5">{drug.desc}</div>}
                    </div>
                    {drugId === drug.id && <Check size={12} className="text-[#C9A96E] shrink-0" />}
                  </button>
                ))}
              </div>
              <button
                onClick={() => { setDrugId(null); setStep(3); }}
                className="w-full mt-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-colors"
              >
                잘 모르겠어요 →
              </button>
            </div>
          )}

          {/* ── STEP 3 (보톡스): 부위 선택 ── */}
          {step === 3 && isBotox && (
            <div>
              <p className="text-xs text-gray-400 mb-1">시술 부위를 선택하세요</p>
              <p className="text-sm font-semibold text-gray-900 mb-4">
                {selectedDrug ? `💉 ${selectedDrug.name}` : '💉 보톡스'}
              </p>
              <div className="grid grid-cols-3 gap-2">
               {(isBotox ? BOTOX_AREA_OPTIONS : BODY_AREA_OPTIONS_WITH_OTHER).map(opt => (
                  <button key={opt.value}
                    onClick={() => { setBodyArea(opt.value); if (opt.value !== '__other') setCustomBodyArea(''); }}
                    className={cn(
                      'py-3 rounded-xl border text-sm font-medium transition-all',
                      bodyArea === opt.value
                        ? 'border-[#C9A96E] bg-[#C9A96E]/10 text-[#C9A96E]'
                        : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300'
                    )}>
                    {opt.label}
                  </button>
                ))}
              </div>
              {bodyArea === '__other' && (
                <input
                  type="text"
                  value={customBodyArea}
                  onChange={e => setCustomBodyArea(e.target.value)}
                  placeholder="부위를 입력하세요"
                  className="w-full mt-3 bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-[#C9A96E]/50"
                />
              )}
            </div>
          )}

          {/* ── 샷수 선택 (비보톡스) ── */}
          {step === shotsStep && needsShots && selectedItem && (
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
          {isDetailStep && (isBotox || isFiller || selectedItem) && (
            <div className="space-y-4">
              {/* 선택 요약 */}
              <div className="bg-gray-50 rounded-xl px-4 py-3 border border-gray-200">
                <div className="text-[11px] text-gray-400 mb-1">등록할 시술</div>
                <div className="text-sm font-semibold text-[#C9A96E]">{getTreatmentName()}</div>
                <div className="mt-1.5">
                  {(() => {
                    const sl = isBotox ? getBotoxSkinLayer() : isFiller ? 'dermis' as SL : selectedItem!.skinLayer;
                    return (
                      <span className={cn('text-[10px] px-2 py-0.5 rounded-full border', SKIN_LAYER_COLOR[sl])}>
                        {SKIN_LAYER_LABEL[sl]}
                      </span>
                    );
                  })()}
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

              {/* 부위 선택 (비보톡스/비필러만 — 별도 단계에서 선택) */}
              {!isBotox && !isFiller && (
                <div>
                  <label className="text-xs text-gray-400 block mb-1.5">부위</label>
                  <div className="flex gap-1.5 flex-wrap">
                    {BODY_AREA_OPTIONS_WITH_OTHER.map(opt => (
                      <button key={opt.value}
                        onClick={() => { setBodyArea(opt.value); if (opt.value !== '__other') setCustomBodyArea(''); }}
                        className={cn(
                          'px-3 py-1.5 rounded-full text-[11px] font-semibold border transition-all',
                          bodyArea === opt.value
                            ? 'border-[#C9A96E] bg-[#C9A96E]/10 text-[#C9A96E]'
                            : 'border-gray-200 bg-gray-50 text-gray-500 hover:border-gray-300'
                        )}>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  {bodyArea === '__other' && (
                    <input
                      type="text"
                      value={customBodyArea}
                      onChange={e => setCustomBodyArea(e.target.value)}
                      placeholder="부위를 입력하세요"
                      className="w-full mt-2 bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-[#C9A96E]/50"
                    />
                  )}
                </div>
              )}

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

              {/* 결제 수단 (시술권 미사용 시에만 표시) */}
              {!selectedPkgId && (
                <div>
                  <label className="text-xs text-gray-400 block mb-1.5">결제 수단 <span className="text-red-400">*</span></label>
                  <div className="grid grid-cols-2 gap-2">
                    {([
                      { key: 'card',    label: '카드 결제',    desc: '신용/체크카드 직접 결제', icon: CreditCard },
                      { key: 'point',   label: '포인트 차감',  desc: '병원 선불 잔액 차감',     icon: Coins },
                      { key: 'cash',    label: '현금 결제',    desc: '현금 직접 결제',          icon: Banknote },
                      { key: 'service', label: '서비스',       desc: '무료 제공',               icon: Gift },
                    ] as const).map(m => (
                      <button key={m.key}
                        onClick={() => setPaymentMethod(prev => prev === m.key ? null : m.key)}
                        className={cn(
                          'flex flex-col items-center gap-1 px-3 py-3 rounded-xl border text-center transition-all',
                          paymentMethod === m.key
                            ? 'border-[#C9A96E] bg-[#C9A96E]/10 ring-1 ring-[#C9A96E]/30'
                            : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                        )}>
                        <m.icon size={18} className={paymentMethod === m.key ? 'text-[#C9A96E]' : 'text-gray-400'} />
                        <span className={cn('text-xs font-medium', paymentMethod === m.key ? 'text-[#C9A96E]' : 'text-gray-600')}>{m.label}</span>
                        <span className="text-[10px] text-gray-400 leading-tight">{m.desc}</span>
                      </button>
                    ))}
                  </div>
                  {/* 결제 금액 (서비스 제외) */}
                  {paymentMethod && paymentMethod !== 'service' && (
                    <div className="mt-3">
                      <label className="text-xs text-gray-400 block mb-1.5">결제 금액 (선택)</label>
                      <div className="relative">
                        <input
                          type="number"
                          inputMode="numeric"
                          value={paymentAmount}
                          onChange={e => setPaymentAmount(e.target.value)}
                          placeholder="0"
                          className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-[#C9A96E]/50 pr-10"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-400">원</span>
                      </div>
                    </div>
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
