export type TreatmentCategory = 
  | 'botox' | 'filler' | 'lifting' | 'thread_lifting' | 'skin_booster'
  | 'laser_toning' | 'peeling' | 'pigment' | 'acne' | 'hair_removal'
  | 'body_contouring' | 'iv_injection' | 'skincare' | 'contour' | 'regeneration';

export type TreatmentBodyArea = 'face' | 'eye' | 'neck' | 'body' | 'arm' | 'leg' | 'bikini' | 'full_body';

export type TreatmentEffect = 
  | 'wrinkle' | 'elasticity' | 'whitening' | 'pore' | 'acne_care'
  | 'hydration' | 'slimming' | 'hair_removal_effect' | 'scar' | 'redness'
  | 'volume' | 'contour_effect' | 'regeneration_effect' | 'brightening' | 'tightening';

export type ClinicBrand = '밴스의원' | '쁨클리닉';

export interface ClinicBranch {
  brand: ClinicBrand;
  branch: string; // e.g. '강남점'
}

export interface ClinicTreatment {
  id: string;
  name: string;
  clinic: ClinicBrand;
  branches: string[]; // 해당 시술 가능 지점
  category: TreatmentCategory;
  bodyAreas: TreatmentBodyArea[];
  effects: TreatmentEffect[];
  description?: string;
  priceRange?: string;
}

export const CATEGORY_LABELS: Record<TreatmentCategory, string> = {
  botox: '보톡스',
  filler: '필러',
  lifting: '레이저 리프팅',
  thread_lifting: '실리프팅',
  skin_booster: '스킨부스터',
  laser_toning: '레이저 토닝',
  peeling: '필링',
  pigment: '미백/색소',
  acne: '여드름/모공',
  hair_removal: '제모',
  body_contouring: '바디',
  iv_injection: '주사/수액',
  skincare: '스킨케어',
  contour: '윤곽/라인',
  regeneration: '재생',
};

export const BODY_AREA_TREATMENT_LABELS: Record<TreatmentBodyArea, string> = {
  face: '얼굴',
  eye: '눈가',
  neck: '목',
  body: '바디',
  arm: '팔',
  leg: '다리',
  bikini: '비키니',
  full_body: '전신',
};

export const EFFECT_LABELS: Record<TreatmentEffect, string> = {
  wrinkle: '주름개선',
  elasticity: '탄력',
  whitening: '미백',
  pore: '모공축소',
  acne_care: '여드름',
  hydration: '보습/수분',
  slimming: '슬리밍',
  hair_removal_effect: '제모',
  scar: '흉터',
  redness: '홍조',
  volume: '볼륨',
  contour_effect: '윤곽',
  regeneration_effect: '재생',
  brightening: '브라이트닝',
  tightening: '타이트닝',
};

// ============ 지점 목록 ============

export const VANDS_BRANCHES = [
  '강남점', '강서화곡점', '구로점', '동대문점', '마포공덕점', '명동점', '명동2호점',
  '삼성점', '성수점', '신사점', '신촌점', '여의도점', '영등포점', '용산점',
  '천호점', '청담점', '홍대점', '잠실점',
  '과천점', '광명점', '김포점', '동탄점', '부천점', '분당점', '수원점',
  '안양점', '일산점', '평촌점',
  '송도점', '부평점', '인천점',
  '대전점', '천안점', '전주점', '부산점', '창원점',
];

export const PPEUM_BRANCHES = [
  '신논현 메가스토어점', '강남 스탠다드점', '명동점', '홍대점', '천호점',
  '건대점', '노원점', '서울대입구점', '잠실점', '발산점',
  '부천점', '일산점', '수원인계점', '안산점', '인천본점', '분당점', '범계점',
  '부평점', '동탄점', '수원역점', '하남미사점',
  '대전점', '천안점', '춘천점', '부산점', '제주점',
];

export const ALL_BRANCHES: ClinicBranch[] = [
  ...VANDS_BRANCHES.map(b => ({ brand: '밴스의원' as ClinicBrand, branch: b })),
  ...PPEUM_BRANCHES.map(b => ({ brand: '쁨클리닉' as ClinicBrand, branch: b })),
];

// ============ 시술 데이터 (실제 가격 기반) ============

const allVands = VANDS_BRANCHES;
const allPpeum = PPEUM_BRANCHES;

export const CLINIC_TREATMENTS: ClinicTreatment[] = [
  // =============================================
  //  밴스의원 — 보톡스
  // =============================================
  { id: 'v1', name: '주름보톡스 (국산)', clinic: '밴스의원', branches: allVands, category: 'botox', bodyAreas: ['face'], effects: ['wrinkle'], priceRange: '1,000~29,000원', description: '미간/눈가/이마/콧등 등 부위별' },
  { id: 'v2', name: '주름보톡스 (수입)', clinic: '밴스의원', branches: allVands, category: 'botox', bodyAreas: ['face'], effects: ['wrinkle'], priceRange: '19,000~190,000원', description: '제오민/엘러간 수입 보톡스' },
  { id: 'v3', name: '사각턱보톡스 50유닛 (국산)', clinic: '밴스의원', branches: allVands, category: 'botox', bodyAreas: ['face'], effects: ['contour_effect', 'slimming'], priceRange: '6,900~59,000원' },
  { id: 'v4', name: '사각턱보톡스 50유닛 (수입)', clinic: '밴스의원', branches: allVands, category: 'botox', bodyAreas: ['face'], effects: ['contour_effect', 'slimming'], priceRange: '99,000~149,000원' },
  { id: 'v5', name: '바디보톡스 100유닛 (국산)', clinic: '밴스의원', branches: allVands, category: 'botox', bodyAreas: ['body'], effects: ['slimming', 'contour_effect'], priceRange: '29,000~99,000원', description: '승모근/종아리/허벅지' },
  { id: 'v6', name: '바디보톡스 100유닛 (수입)', clinic: '밴스의원', branches: allVands, category: 'botox', bodyAreas: ['body'], effects: ['slimming', 'contour_effect'], priceRange: '199,000~499,000원' },
  { id: 'v7', name: '다한증보톡스 50유닛 (국산)', clinic: '밴스의원', branches: allVands, category: 'botox', bodyAreas: ['body'], effects: ['slimming'], priceRange: '49,000~149,000원', description: '겨드랑이/손/발' },
  { id: 'v8', name: '다한증보톡스 50유닛 (수입)', clinic: '밴스의원', branches: allVands, category: 'botox', bodyAreas: ['body'], effects: ['slimming'], priceRange: '149,000~290,000원' },

  // 밴스의원 — 필러
  { id: 'v9', name: '볼륨필러 아띠에르 (국산) 1cc', clinic: '밴스의원', branches: allVands, category: 'filler', bodyAreas: ['face'], effects: ['volume', 'wrinkle'], priceRange: '49,000원' },
  { id: 'v10', name: '볼륨필러 벨로테로 (수입) 1cc', clinic: '밴스의원', branches: allVands, category: 'filler', bodyAreas: ['face'], effects: ['volume', 'wrinkle'], priceRange: '290,000~390,000원' },
  { id: 'v11', name: '볼륨필러 레스틸렌 (수입) 1cc', clinic: '밴스의원', branches: allVands, category: 'filler', bodyAreas: ['face'], effects: ['volume', 'wrinkle'], priceRange: '330,000~390,000원' },
  { id: 'v12', name: '주름필러 벨로테로 (수입) 1cc', clinic: '밴스의원', branches: allVands, category: 'filler', bodyAreas: ['face'], effects: ['volume', 'wrinkle'], priceRange: '150,000~190,000원' },

  // 밴스의원 — 실리프팅
  { id: 'v13', name: '하이코/바비코 (수입) 1줄', clinic: '밴스의원', branches: allVands, category: 'thread_lifting', bodyAreas: ['face'], effects: ['elasticity', 'tightening'], priceRange: '99,000원' },

  // 밴스의원 — 콜라겐재생
  { id: 'v14', name: '쥬베룩볼륨 1부위(3cc)', clinic: '밴스의원', branches: allVands, category: 'regeneration', bodyAreas: ['face'], effects: ['regeneration_effect', 'elasticity', 'volume'], priceRange: '249,000~690,000원' },
  { id: 'v15', name: '미희주사 1회', clinic: '밴스의원', branches: allVands, category: 'regeneration', bodyAreas: ['face'], effects: ['regeneration_effect', 'elasticity'], priceRange: '290,000~390,000원', description: '부위에 따라 금액 다름' },

  // 밴스의원 — 스킨케어/스킨부스터
  { id: 'v16', name: '리쥬란힐러 2cc', clinic: '밴스의원', branches: allVands, category: 'skin_booster', bodyAreas: ['face'], effects: ['regeneration_effect', 'elasticity', 'hydration'], priceRange: '99,000~149,000원' },
  { id: 'v17', name: '밴스란힐러 1cc', clinic: '밴스의원', branches: allVands, category: 'skin_booster', bodyAreas: ['face'], effects: ['regeneration_effect', 'hydration'], priceRange: '49,000~99,000원', description: '2cc 이상 진행' },
  { id: 'v18', name: '리쥬란 프리미엄 3cc', clinic: '밴스의원', branches: allVands, category: 'skin_booster', bodyAreas: ['face'], effects: ['regeneration_effect', 'elasticity'], priceRange: '129,000~169,000원' },
  { id: 'v19', name: '아이리쥬란 1cc', clinic: '밴스의원', branches: allVands, category: 'skin_booster', bodyAreas: ['eye'], effects: ['regeneration_effect', 'wrinkle'], priceRange: '199,000원' },
  { id: 'v20', name: '아이리쥬란 프리미엄 3cc', clinic: '밴스의원', branches: allVands, category: 'skin_booster', bodyAreas: ['eye'], effects: ['regeneration_effect', 'wrinkle'], priceRange: '290,000원' },
  { id: 'v21', name: '물광주사 2cc', clinic: '밴스의원', branches: allVands, category: 'skin_booster', bodyAreas: ['face'], effects: ['hydration', 'brightening'], priceRange: '89,000원' },
  { id: 'v22', name: '쥬베룩스킨 1cc', clinic: '밴스의원', branches: allVands, category: 'skin_booster', bodyAreas: ['face'], effects: ['regeneration_effect', 'elasticity'], priceRange: '49,000~99,000원' },
  { id: 'v23', name: '레디어스 1회', clinic: '밴스의원', branches: allVands, category: 'skin_booster', bodyAreas: ['face'], effects: ['volume', 'elasticity', 'tightening'], priceRange: '890,000원' },

  // 밴스의원 — 리프팅
  { id: 'v24', name: '인모드리프팅 1회', clinic: '밴스의원', branches: allVands, category: 'lifting', bodyAreas: ['face'], effects: ['elasticity', 'tightening'], priceRange: '6,900~199,000원', description: '부위별 추가 금액' },
  { id: 'v25', name: '슈링크 유니버스 100샷', clinic: '밴스의원', branches: allVands, category: 'lifting', bodyAreas: ['face'], effects: ['elasticity', 'tightening'], priceRange: '9,900~49,000원' },
  { id: 'v26', name: '아이슈링크 100샷', clinic: '밴스의원', branches: allVands, category: 'lifting', bodyAreas: ['eye'], effects: ['elasticity', 'tightening', 'wrinkle'], priceRange: '69,000원' },
  { id: 'v27', name: '리니어지 100샷', clinic: '밴스의원', branches: allVands, category: 'lifting', bodyAreas: ['face'], effects: ['elasticity', 'tightening'], priceRange: '49,000~90,000원' },
  { id: 'v28', name: '울쎄라리프팅 100샷', clinic: '밴스의원', branches: allVands, category: 'lifting', bodyAreas: ['face'], effects: ['elasticity', 'tightening', 'wrinkle'], priceRange: '199,000~400,000원' },
  { id: 'v29', name: '티타늄리프팅 100KJ', clinic: '밴스의원', branches: allVands, category: 'lifting', bodyAreas: ['face'], effects: ['elasticity', 'tightening'], priceRange: '590,000원' },
  { id: 'v30', name: '써마지 FLX 300샷', clinic: '밴스의원', branches: allVands, category: 'lifting', bodyAreas: ['face'], effects: ['elasticity', 'tightening', 'wrinkle'], priceRange: '899,000~1,290,000원' },
  { id: 'v31', name: '온다리프팅 10KJ', clinic: '밴스의원', branches: allVands, category: 'lifting', bodyAreas: ['face'], effects: ['elasticity', 'tightening'], priceRange: '59,000~99,000원' },
  { id: 'v32', name: '볼뉴머리프팅 100샷', clinic: '밴스의원', branches: allVands, category: 'lifting', bodyAreas: ['face'], effects: ['elasticity', 'tightening'], priceRange: '99,000원' },
  { id: 'v33', name: '브이로리프팅 100샷', clinic: '밴스의원', branches: allVands, category: 'lifting', bodyAreas: ['face'], effects: ['elasticity', 'tightening'], priceRange: '59,000원' },
  { id: 'v34', name: '올리지오리프팅 100샷', clinic: '밴스의원', branches: allVands, category: 'lifting', bodyAreas: ['face'], effects: ['elasticity', 'tightening'], priceRange: '99,000원' },
  { id: 'v35', name: '포텐자콜라스터 1회', clinic: '밴스의원', branches: allVands, category: 'lifting', bodyAreas: ['face'], effects: ['regeneration_effect', 'elasticity', 'pore'], priceRange: '49,000~299,000원', description: '팁값 별도' },

  // 밴스의원 — 레이저 토닝/미백/색소
  { id: 'v36', name: '미인토닝 1회', clinic: '밴스의원', branches: allVands, category: 'laser_toning', bodyAreas: ['face'], effects: ['brightening', 'whitening'], priceRange: '39,000~79,000원' },
  { id: 'v37', name: '피코토닝 1+1회', clinic: '밴스의원', branches: allVands, category: 'laser_toning', bodyAreas: ['face'], effects: ['brightening', 'whitening', 'pore'], priceRange: '9,900~59,000원' },
  { id: 'v38', name: '피코토닝+피코지우개 1회', clinic: '밴스의원', branches: allVands, category: 'laser_toning', bodyAreas: ['face'], effects: ['brightening', 'whitening'], priceRange: '99,000원' },
  { id: 'v39', name: '엑셀V레이저 1파장', clinic: '밴스의원', branches: allVands, category: 'pigment', bodyAreas: ['face'], effects: ['redness', 'brightening', 'whitening'], priceRange: '129,000~199,000원' },
  { id: 'v40', name: '피코프락셀 1회', clinic: '밴스의원', branches: allVands, category: 'pigment', bodyAreas: ['face'], effects: ['scar', 'pore', 'brightening'], priceRange: '69,000~99,000원' },
  { id: 'v41', name: '얼굴점제거 (2mm이하)', clinic: '밴스의원', branches: allVands, category: 'pigment', bodyAreas: ['face'], effects: ['brightening'], priceRange: '9,900원' },
  { id: 'v42', name: '비립종/한관종/편평사마귀 제거', clinic: '밴스의원', branches: allVands, category: 'pigment', bodyAreas: ['face'], effects: ['brightening'], priceRange: '9,900원/개' },

  // 밴스의원 — 여드름
  { id: 'v43', name: '아그네스 레이저 1회', clinic: '밴스의원', branches: allVands, category: 'acne', bodyAreas: ['face'], effects: ['acne_care', 'pore'], priceRange: '10,000~150,000원', description: '팁값 별도' },

  // 밴스의원 — 제모
  { id: 'v44', name: '여성 겨드랑이/인중 제모 1회', clinic: '밴스의원', branches: allVands, category: 'hair_removal', bodyAreas: ['body'], effects: ['hair_removal_effect'], priceRange: '1,000~19,000원' },
  { id: 'v45', name: '여성 헤어라인/눈썹 제모 1회', clinic: '밴스의원', branches: allVands, category: 'hair_removal', bodyAreas: ['face'], effects: ['hair_removal_effect'], priceRange: '60,000원' },
  { id: 'v46', name: '여성 팔하완 제모 1회', clinic: '밴스의원', branches: allVands, category: 'hair_removal', bodyAreas: ['arm'], effects: ['hair_removal_effect'], priceRange: '10,000~80,000원' },
  { id: 'v47', name: '여성 다리전체 제모 1회', clinic: '밴스의원', branches: allVands, category: 'hair_removal', bodyAreas: ['leg'], effects: ['hair_removal_effect'], priceRange: '80,000~150,000원' },
  { id: 'v48', name: '남성 인중+콧수염 제모 1회', clinic: '밴스의원', branches: allVands, category: 'hair_removal', bodyAreas: ['face'], effects: ['hair_removal_effect'], priceRange: '1,000~29,000원' },
  { id: 'v49', name: '남성 팔하완 제모 1회', clinic: '밴스의원', branches: allVands, category: 'hair_removal', bodyAreas: ['arm'], effects: ['hair_removal_effect'], priceRange: '90,000원' },
  { id: 'v50', name: '남성 종아리 제모 1회', clinic: '밴스의원', branches: allVands, category: 'hair_removal', bodyAreas: ['leg'], effects: ['hair_removal_effect'], priceRange: '100,000원', description: '무릎 포함' },
  { id: 'v51', name: '남성 브라질리언 제모 1회', clinic: '밴스의원', branches: allVands, category: 'hair_removal', bodyAreas: ['bikini'], effects: ['hair_removal_effect'], priceRange: '199,000원', description: '항문 포함' },

  // =============================================
  //  쁨클리닉 — 보톡스
  // =============================================
  { id: 'p1', name: '사각턱보톡스 국산 50u', clinic: '쁨클리닉', branches: allPpeum, category: 'botox', bodyAreas: ['face'], effects: ['contour_effect', 'slimming'], priceRange: '19,000원~', description: '정가 3.5만원 → 이벤트가' },
  { id: 'p2', name: '사각턱보톡스 수입독일산', clinic: '쁨클리닉', branches: allPpeum, category: 'botox', bodyAreas: ['face'], effects: ['contour_effect', 'slimming'], priceRange: '120,000원' },
  { id: 'p3', name: '스킨보톡스 턱라인 (국산)', clinic: '쁨클리닉', branches: allPpeum, category: 'botox', bodyAreas: ['face'], effects: ['pore', 'elasticity'], priceRange: '80,000원' },
  { id: 'p4', name: '스킨보톡스 풀페이스 (국산)', clinic: '쁨클리닉', branches: allPpeum, category: 'botox', bodyAreas: ['face'], effects: ['pore', 'elasticity'], priceRange: '160,000원' },
  { id: 'p5', name: '스킨보톡스 턱라인 (수입)', clinic: '쁨클리닉', branches: allPpeum, category: 'botox', bodyAreas: ['face'], effects: ['pore', 'elasticity'], priceRange: '150,000원' },
  { id: 'p6', name: '스킨보톡스 풀페이스 (수입)', clinic: '쁨클리닉', branches: allPpeum, category: 'botox', bodyAreas: ['face'], effects: ['pore', 'elasticity'], priceRange: '250,000원' },
  { id: 'p7', name: '주름보톡스 (미간/눈가/콧등 등)', clinic: '쁨클리닉', branches: allPpeum, category: 'botox', bodyAreas: ['face'], effects: ['wrinkle'], priceRange: '30,000원' },
  { id: 'p8', name: '이마주름 보톡스', clinic: '쁨클리닉', branches: allPpeum, category: 'botox', bodyAreas: ['face'], effects: ['wrinkle'], priceRange: '50,000원' },
  { id: 'p9', name: '이마 패키지 (이마+더모톡신)', clinic: '쁨클리닉', branches: allPpeum, category: 'botox', bodyAreas: ['face'], effects: ['wrinkle', 'elasticity'], priceRange: '90,000원' },
  { id: 'p10', name: '이마+미간 패키지', clinic: '쁨클리닉', branches: allPpeum, category: 'botox', bodyAreas: ['face'], effects: ['wrinkle'], priceRange: '70,000원' },
  { id: 'p11', name: '눈주변 패키지 (눈가+눈밑+콧등)', clinic: '쁨클리닉', branches: allPpeum, category: 'botox', bodyAreas: ['face', 'eye'], effects: ['wrinkle'], priceRange: '80,000원' },
  { id: 'p12', name: '얼굴전체 주름 패키지', clinic: '쁨클리닉', branches: allPpeum, category: 'botox', bodyAreas: ['face'], effects: ['wrinkle'], priceRange: '260,000원' },
  { id: 'p13', name: '바디보톡스 100u (승모근/종아리)', clinic: '쁨클리닉', branches: allPpeum, category: 'botox', bodyAreas: ['body'], effects: ['slimming', 'contour_effect'], priceRange: '130,000원' },
  { id: 'p14', name: '겨드랑이 다한증보톡스 50u', clinic: '쁨클리닉', branches: allPpeum, category: 'botox', bodyAreas: ['body'], effects: ['slimming'], priceRange: '90,000원' },
  { id: 'p15', name: '손/발 다한증보톡스 100u', clinic: '쁨클리닉', branches: allPpeum, category: 'botox', bodyAreas: ['body'], effects: ['slimming'], priceRange: '180,000원' },
  { id: 'p16', name: '치료용보톡스 (턱관절/이갈이 등)', clinic: '쁨클리닉', branches: allPpeum, category: 'botox', bodyAreas: ['face'], effects: ['wrinkle'], priceRange: '100,000원' },

  // 쁨클리닉 — 필러
  { id: 'p17', name: '국산 일반필러', clinic: '쁨클리닉', branches: allPpeum, category: 'filler', bodyAreas: ['face'], effects: ['volume'], priceRange: '100,000원' },
  { id: 'p18', name: '국산 특수필러', clinic: '쁨클리닉', branches: allPpeum, category: 'filler', bodyAreas: ['face'], effects: ['volume'], priceRange: '130,000원' },
  { id: 'p19', name: '국산 프리미엄필러', clinic: '쁨클리닉', branches: allPpeum, category: 'filler', bodyAreas: ['face'], effects: ['volume', 'elasticity'], priceRange: '150,000원' },
  { id: 'p20', name: '국산 프리미엄 특수필러', clinic: '쁨클리닉', branches: allPpeum, category: 'filler', bodyAreas: ['face'], effects: ['volume', 'elasticity'], priceRange: '180,000원' },
  { id: 'p21', name: '쥬비덤 필러 (수입)', clinic: '쁨클리닉', branches: allPpeum, category: 'filler', bodyAreas: ['face'], effects: ['volume', 'wrinkle'], priceRange: '300,000원' },
  { id: 'p22', name: '레스틸렌 필러 (수입)', clinic: '쁨클리닉', branches: allPpeum, category: 'filler', bodyAreas: ['face'], effects: ['volume', 'wrinkle'], priceRange: '300,000원' },
  { id: 'p23', name: '벨로테로 필러 (수입)', clinic: '쁨클리닉', branches: allPpeum, category: 'filler', bodyAreas: ['face'], effects: ['volume', 'wrinkle'], priceRange: '300,000원' },
  { id: 'p24', name: '스타일에이지 필러 (수입)', clinic: '쁨클리닉', branches: allPpeum, category: 'filler', bodyAreas: ['face'], effects: ['volume', 'wrinkle'], priceRange: '250,000원', description: '정가 30만 → 이벤트가' },
  { id: 'p25', name: '수입 눈밑재배치 필러', clinic: '쁨클리닉', branches: allPpeum, category: 'filler', bodyAreas: ['eye'], effects: ['volume', 'wrinkle'], priceRange: '500,000원' },
  { id: 'p26', name: '입술필러 1부위 (국산)', clinic: '쁨클리닉', branches: allPpeum, category: 'filler', bodyAreas: ['face'], effects: ['volume'], priceRange: '80,000원', description: '위/아래/꼬리 중 택1' },
  { id: 'p27', name: '큐오필 플러스 1cc', clinic: '쁨클리닉', branches: allPpeum, category: 'filler', bodyAreas: ['face'], effects: ['volume', 'elasticity'], priceRange: '60,000원', description: '3cc 이상 시술 시 적용' },

  // 쁨클리닉 — 목주름 필러 패키지
  { id: 'p28', name: '목주름필러+보톡스', clinic: '쁨클리닉', branches: allPpeum, category: 'filler', bodyAreas: ['neck'], effects: ['wrinkle', 'elasticity'], priceRange: '300,000원' },
  { id: 'p29', name: '목주름필러+보톡스+슈링크300샷', clinic: '쁨클리닉', branches: allPpeum, category: 'filler', bodyAreas: ['neck'], effects: ['wrinkle', 'elasticity', 'tightening'], priceRange: '500,000원' },
  { id: 'p30', name: '목주름 풀패키지 (필러+보톡스+슈링크+물광)', clinic: '쁨클리닉', branches: allPpeum, category: 'filler', bodyAreas: ['neck'], effects: ['wrinkle', 'elasticity', 'tightening', 'hydration'], priceRange: '700,000원' },

  // 쁨클리닉 — 윤곽/조각주사
  { id: 'p31', name: '윤곽주사 1회', clinic: '쁨클리닉', branches: allPpeum, category: 'contour', bodyAreas: ['face'], effects: ['contour_effect', 'slimming'], priceRange: '50,000원' },
  { id: 'p32', name: '조각주사 1회', clinic: '쁨클리닉', branches: allPpeum, category: 'contour', bodyAreas: ['face'], effects: ['contour_effect', 'slimming'], priceRange: '100,000원' },
  { id: 'p33', name: 'PS성형주사 1회 (6cc)', clinic: '쁨클리닉', branches: allPpeum, category: 'contour', bodyAreas: ['face'], effects: ['contour_effect', 'slimming'], priceRange: '150,000원' },
  { id: 'p34', name: '코조각주사 1회', clinic: '쁨클리닉', branches: allPpeum, category: 'contour', bodyAreas: ['face'], effects: ['contour_effect'], priceRange: '100,000원' },
  { id: 'p35', name: 'V핏톡스 (1) 윤곽+턱보톡스', clinic: '쁨클리닉', branches: allPpeum, category: 'contour', bodyAreas: ['face'], effects: ['contour_effect', 'slimming'], priceRange: '60,000원' },
  { id: 'p36', name: 'V핏톡스 (2) 윤곽3회+턱보톡스', clinic: '쁨클리닉', branches: allPpeum, category: 'contour', bodyAreas: ['face'], effects: ['contour_effect', 'slimming'], priceRange: '120,000원' },
  { id: 'p37', name: '수퍼핏톡스 (1) 조각+턱보톡스100u', clinic: '쁨클리닉', branches: allPpeum, category: 'contour', bodyAreas: ['face'], effects: ['contour_effect', 'slimming'], priceRange: '120,000원' },
  { id: 'p38', name: '수퍼핏톡스 (2) 조각3회+턱보톡스100u', clinic: '쁨클리닉', branches: allPpeum, category: 'contour', bodyAreas: ['face'], effects: ['contour_effect', 'slimming'], priceRange: '300,000원' },

  // 쁨클리닉 — 하이코/바비코
  { id: 'p39', name: '하이코 콧대', clinic: '쁨클리닉', branches: allPpeum, category: 'thread_lifting', bodyAreas: ['face'], effects: ['volume', 'contour_effect'], priceRange: '100,000원' },
  { id: 'p40', name: '하이코 콧대+(국산)필러', clinic: '쁨클리닉', branches: allPpeum, category: 'thread_lifting', bodyAreas: ['face'], effects: ['volume', 'contour_effect'], priceRange: '190,000원' },
  { id: 'p41', name: '하이코 콧대+(수입)필러', clinic: '쁨클리닉', branches: allPpeum, category: 'thread_lifting', bodyAreas: ['face'], effects: ['volume', 'contour_effect'], priceRange: '370,000원' },
  { id: 'p42', name: '바비코 콧대or코끝', clinic: '쁨클리닉', branches: allPpeum, category: 'thread_lifting', bodyAreas: ['face'], effects: ['volume', 'contour_effect'], priceRange: '200,000원' },
  { id: 'p43', name: '프리미엄 바비코 (콧대+코끝+필러+보톡스)', clinic: '쁨클리닉', branches: allPpeum, category: 'thread_lifting', bodyAreas: ['face'], effects: ['volume', 'contour_effect'], priceRange: '390,000원' },

  // 쁨클리닉 — 재생/스킨부스터
  { id: 'p44', name: '필메드 NCTF 1회', clinic: '쁨클리닉', branches: allPpeum, category: 'skin_booster', bodyAreas: ['face'], effects: ['hydration', 'regeneration_effect'], priceRange: '190,000원' },
  { id: 'p45', name: '필메드 NCTF 3회', clinic: '쁨클리닉', branches: allPpeum, category: 'skin_booster', bodyAreas: ['face'], effects: ['hydration', 'regeneration_effect'], priceRange: '500,000원' },
  { id: 'p46', name: '리쥬란힐러 오리지널 1회 (2cc)', clinic: '쁨클리닉', branches: allPpeum, category: 'skin_booster', bodyAreas: ['face'], effects: ['regeneration_effect', 'elasticity'], priceRange: '250,000원' },
  { id: 'p47', name: '리쥬란힐러 오리지널 3회 (6cc)', clinic: '쁨클리닉', branches: allPpeum, category: 'skin_booster', bodyAreas: ['face'], effects: ['regeneration_effect', 'elasticity'], priceRange: '700,000원' },
  { id: 'p48', name: '리쥬란힐러 아이 1회 (1cc)', clinic: '쁨클리닉', branches: allPpeum, category: 'skin_booster', bodyAreas: ['eye'], effects: ['regeneration_effect', 'wrinkle'], priceRange: '230,000원' },
  { id: 'p49', name: '리쥬란힐러 아이 3회 (3cc)', clinic: '쁨클리닉', branches: allPpeum, category: 'skin_booster', bodyAreas: ['eye'], effects: ['regeneration_effect', 'wrinkle'], priceRange: '590,000원' },
  { id: 'p50', name: 'PRP주사 1회', clinic: '쁨클리닉', branches: allPpeum, category: 'regeneration', bodyAreas: ['face'], effects: ['regeneration_effect', 'elasticity'], priceRange: '100,000원' },
  { id: 'p51', name: '물광주사 히론트', clinic: '쁨클리닉', branches: allPpeum, category: 'skin_booster', bodyAreas: ['face'], effects: ['hydration', 'brightening'], priceRange: '100,000원' },
  { id: 'p52', name: '물광주사 레스틸렌 비탈', clinic: '쁨클리닉', branches: allPpeum, category: 'skin_booster', bodyAreas: ['face'], effects: ['hydration', 'elasticity'], priceRange: '300,000원' },
  { id: 'p53', name: '물광주사 볼라이트 1cc', clinic: '쁨클리닉', branches: allPpeum, category: 'skin_booster', bodyAreas: ['face'], effects: ['hydration', 'volume'], priceRange: '350,000원' },
  { id: 'p54', name: 'MTS 1회', clinic: '쁨클리닉', branches: allPpeum, category: 'skincare', bodyAreas: ['face'], effects: ['regeneration_effect', 'pore'], priceRange: '100,000원' },
  { id: 'p55', name: 'MTS 3회', clinic: '쁨클리닉', branches: allPpeum, category: 'skincare', bodyAreas: ['face'], effects: ['regeneration_effect', 'pore'], priceRange: '200,000원' },
  { id: 'p56', name: '아기주사 1회', clinic: '쁨클리닉', branches: allPpeum, category: 'skin_booster', bodyAreas: ['face'], effects: ['hydration', 'brightening', 'regeneration_effect'], priceRange: '100,000원' },
  { id: 'p57', name: '아기주사 3회', clinic: '쁨클리닉', branches: allPpeum, category: 'skin_booster', bodyAreas: ['face'], effects: ['hydration', 'brightening', 'regeneration_effect'], priceRange: '250,000원' },

  // 쁨클리닉 — 잇몸/자갈턱 보톡스
  { id: 'p58', name: '잇몸노출 보톡스', clinic: '쁨클리닉', branches: allPpeum, category: 'botox', bodyAreas: ['face'], effects: ['contour_effect'], priceRange: '50,000원' },
  { id: 'p59', name: '자갈턱/콧볼/콧등 보톡스', clinic: '쁨클리닉', branches: allPpeum, category: 'botox', bodyAreas: ['face'], effects: ['contour_effect'], priceRange: '30,000원' },

  // 쁨클리닉 — 심술보 삭제 필러
  { id: 'p60', name: '심술보 삭제 필러', clinic: '쁨클리닉', branches: allPpeum, category: 'filler', bodyAreas: ['face'], effects: ['volume', 'contour_effect'], priceRange: '400,000원' },
];
