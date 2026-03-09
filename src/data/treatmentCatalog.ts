export type TreatmentCategory = 
  | 'botox' | 'filler' | 'lifting' | 'thread_lifting' | 'skin_booster'
  | 'laser_toning' | 'peeling' | 'pigment' | 'acne' | 'hair_removal'
  | 'body_contouring' | 'iv_injection' | 'skincare' | 'contour' | 'regeneration';

export type TreatmentBodyArea = 'face' | 'eye' | 'neck' | 'body' | 'arm' | 'leg' | 'bikini' | 'full_body';

export type TreatmentEffect = 
  | 'wrinkle' | 'elasticity' | 'whitening' | 'pore' | 'acne_care'
  | 'hydration' | 'slimming' | 'hair_removal_effect' | 'scar' | 'redness'
  | 'volume' | 'contour_effect' | 'regeneration_effect' | 'brightening' | 'tightening';

export interface ClinicTreatment {
  id: string;
  name: string;
  clinic: '밴스의원' | '쁨클리닉';
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

export const CLINIC_TREATMENTS: ClinicTreatment[] = [
  // ========== 밴스의원 ==========
  // 보톡스
  { id: 'v1', name: '주름보톡스 (국산)', clinic: '밴스의원', category: 'botox', bodyAreas: ['face'], effects: ['wrinkle'], priceRange: '900원~' },
  { id: 'v2', name: '제오민 주름보톡스', clinic: '밴스의원', category: 'botox', bodyAreas: ['face'], effects: ['wrinkle'], priceRange: '29,000원~' },
  { id: 'v3', name: '엘러간 주름보톡스', clinic: '밴스의원', category: 'botox', bodyAreas: ['face'], effects: ['wrinkle'], priceRange: '59,000원~' },
  { id: 'v4', name: '국산 사각턱보톡스', clinic: '밴스의원', category: 'botox', bodyAreas: ['face'], effects: ['contour_effect', 'slimming'], priceRange: '9,900원~' },
  { id: 'v5', name: '제오민 턱보톡스', clinic: '밴스의원', category: 'botox', bodyAreas: ['face'], effects: ['contour_effect', 'slimming'], priceRange: '79,000원~' },
  { id: 'v6', name: '엘러간 턱보톡스', clinic: '밴스의원', category: 'botox', bodyAreas: ['face'], effects: ['contour_effect', 'slimming'], priceRange: '149,000원~' },
  { id: 'v7', name: '모공톡신 1cc', clinic: '밴스의원', category: 'botox', bodyAreas: ['face'], effects: ['pore', 'wrinkle'], priceRange: '29,000원~' },
  { id: 'v8', name: '순정모공톡신 3cc (제오민)', clinic: '밴스의원', category: 'botox', bodyAreas: ['face'], effects: ['pore', 'wrinkle'], priceRange: '99,000원~' },

  // 필러
  { id: 'v9', name: '눈밑필러', clinic: '밴스의원', category: 'filler', bodyAreas: ['eye'], effects: ['volume', 'wrinkle'], priceRange: '49,000원~' },
  { id: 'v10', name: '턱끝필러 (국산)', clinic: '밴스의원', category: 'filler', bodyAreas: ['face'], effects: ['volume', 'contour_effect'], priceRange: '49,000원~' },
  { id: 'v11', name: '팔자필러 (국산)', clinic: '밴스의원', category: 'filler', bodyAreas: ['face'], effects: ['volume', 'wrinkle'], priceRange: '49,000원~' },
  { id: 'v12', name: '무제한 입술필러', clinic: '밴스의원', category: 'filler', bodyAreas: ['face'], effects: ['volume'], priceRange: '89,000원~' },
  { id: 'v13', name: '무제한 애교필러', clinic: '밴스의원', category: 'filler', bodyAreas: ['face'], effects: ['volume'], priceRange: '89,000원~' },
  { id: 'v14', name: '동안필러 (국산 3cc~)', clinic: '밴스의원', category: 'filler', bodyAreas: ['face'], effects: ['volume', 'wrinkle', 'elasticity'], priceRange: '99,000원~' },
  { id: 'v15', name: '수입 동안필러 (3cc~)', clinic: '밴스의원', category: 'filler', bodyAreas: ['face'], effects: ['volume', 'wrinkle', 'elasticity'], priceRange: '130,000원~' },

  // 레이저 리프팅
  { id: 'v16', name: '슈링크 유니버스 울트라 100샷', clinic: '밴스의원', category: 'lifting', bodyAreas: ['face'], effects: ['elasticity', 'tightening'], priceRange: '9,900원~' },
  { id: 'v17', name: '슈링크 유니버스 울트라 300샷', clinic: '밴스의원', category: 'lifting', bodyAreas: ['face'], effects: ['elasticity', 'tightening'], priceRange: '89,000원~' },
  { id: 'v18', name: '온다리프팅 10KJ', clinic: '밴스의원', category: 'lifting', bodyAreas: ['face'], effects: ['elasticity', 'tightening'], priceRange: '49,000원~' },
  { id: 'v19', name: '울쎄라 300샷', clinic: '밴스의원', category: 'lifting', bodyAreas: ['face'], effects: ['elasticity', 'tightening', 'wrinkle'], priceRange: '690,000원~' },
  { id: 'v20', name: '울쎄라피프라임 300샷', clinic: '밴스의원', category: 'lifting', bodyAreas: ['face'], effects: ['elasticity', 'tightening', 'wrinkle'], priceRange: '890,000원~' },

  // 바디 리프팅/타이트닝
  { id: 'v21', name: '바디인모드 1부위', clinic: '밴스의원', category: 'body_contouring', bodyAreas: ['body'], effects: ['tightening', 'slimming'], priceRange: '99,000원~' },
  { id: 'v22', name: '바디리니어지 1부위', clinic: '밴스의원', category: 'body_contouring', bodyAreas: ['body'], effects: ['tightening', 'slimming'], priceRange: '99,000원~' },
  { id: 'v23', name: '바디울쎄라 100샷', clinic: '밴스의원', category: 'body_contouring', bodyAreas: ['body'], effects: ['tightening'], priceRange: '490,000원~' },

  // 실리프팅
  { id: 'v24', name: '탄력실(울트라) 10줄', clinic: '밴스의원', category: 'thread_lifting', bodyAreas: ['face'], effects: ['elasticity', 'tightening'], priceRange: '49,000원~' },
  { id: 'v25', name: '팢핒리프팅', clinic: '밴스의원', category: 'thread_lifting', bodyAreas: ['face'], effects: ['elasticity', 'wrinkle'], description: '팔자주름 전용', priceRange: '490,000원~' },

  // 스킨부스터
  { id: 'v26', name: '콜라스터 오리지널 1cc', clinic: '밴스의원', category: 'skin_booster', bodyAreas: ['face'], effects: ['hydration', 'elasticity'], priceRange: '29,000원~' },
  { id: 'v27', name: '콜라스터 브라이트닝 1cc', clinic: '밴스의원', category: 'skin_booster', bodyAreas: ['face'], effects: ['brightening', 'hydration'], priceRange: '39,000원~' },
  { id: 'v28', name: '콜라스터 아크네 1cc', clinic: '밴스의원', category: 'skin_booster', bodyAreas: ['face'], effects: ['acne_care', 'hydration'], priceRange: '49,000원~' },
  { id: 'v29', name: '콜라스터 넥소좀 1cc', clinic: '밴스의원', category: 'skin_booster', bodyAreas: ['face', 'neck'], effects: ['regeneration_effect', 'hydration'], priceRange: '69,000원~' },
  { id: 'v30', name: '콜라스터 연어재생 PDRN 1cc', clinic: '밴스의원', category: 'skin_booster', bodyAreas: ['face'], effects: ['regeneration_effect', 'hydration'], priceRange: '69,000원~' },
  { id: 'v31', name: '리쥬란힐러 2cc', clinic: '밴스의원', category: 'skin_booster', bodyAreas: ['face'], effects: ['regeneration_effect', 'wrinkle', 'elasticity'], priceRange: '135,000원~' },
  { id: 'v32', name: '쥬베룩스킨 1cc', clinic: '밴스의원', category: 'skin_booster', bodyAreas: ['face'], effects: ['regeneration_effect', 'elasticity'], priceRange: '49,000원~' },
  { id: 'v33', name: '릴리이드 물광주사 2cc', clinic: '밴스의원', category: 'skin_booster', bodyAreas: ['face'], effects: ['hydration', 'brightening'], priceRange: '69,000원~' },
  { id: 'v34', name: '릴리이드 물광주사 5cc', clinic: '밴스의원', category: 'skin_booster', bodyAreas: ['face'], effects: ['hydration', 'brightening'], priceRange: '129,000원~' },

  // 레이저 토닝/색소
  { id: 'v35', name: '피코슈어토닝', clinic: '밴스의원', category: 'laser_toning', bodyAreas: ['face'], effects: ['whitening', 'pore'], description: '프리미엄 피코토닝', priceRange: '29,000원~' },
  { id: 'v36', name: '피코토닝 1+1', clinic: '밴스의원', category: 'laser_toning', bodyAreas: ['face'], effects: ['whitening', 'brightening'], priceRange: '9,900원~' },
  { id: 'v37', name: '기미주사', clinic: '밴스의원', category: 'pigment', bodyAreas: ['face'], effects: ['whitening'], priceRange: '29,000원~' },
  { id: 'v38', name: '피코토닝+피코지우개', clinic: '밴스의원', category: 'laser_toning', bodyAreas: ['face'], effects: ['whitening', 'brightening'], priceRange: '99,000원~' },
  { id: 'v39', name: '더마V 싱글모드', clinic: '밴스의원', category: 'pigment', bodyAreas: ['face'], effects: ['whitening', 'acne_care', 'elasticity'], priceRange: '89,000원~' },
  { id: 'v40', name: '더마V 듀얼모드', clinic: '밴스의원', category: 'pigment', bodyAreas: ['face'], effects: ['whitening', 'acne_care', 'elasticity'], priceRange: '249,000원~' },
  { id: 'v41', name: '더마V 트리플모드', clinic: '밴스의원', category: 'pigment', bodyAreas: ['face'], effects: ['whitening', 'acne_care', 'elasticity'], priceRange: '299,000원~' },
  { id: 'v42', name: '엑셀V플러스 싱글모드', clinic: '밴스의원', category: 'pigment', bodyAreas: ['face'], effects: ['redness', 'pore', 'whitening'], priceRange: '75,000원~' },

  // 스킨케어
  { id: 'v43', name: '아쿠아필 2단계', clinic: '밴스의원', category: 'skincare', bodyAreas: ['face'], effects: ['hydration', 'pore'], priceRange: '4,900원~' },
  { id: 'v44', name: '비타민관리', clinic: '밴스의원', category: 'skincare', bodyAreas: ['face'], effects: ['brightening', 'hydration'], priceRange: '9,900원~' },
  { id: 'v45', name: 'LED재생레이저', clinic: '밴스의원', category: 'skincare', bodyAreas: ['face'], effects: ['regeneration_effect', 'elasticity'], priceRange: '9,900원~' },
  { id: 'v46', name: '블랙헤드관리', clinic: '밴스의원', category: 'skincare', bodyAreas: ['face'], effects: ['pore'], priceRange: '19,000원~' },
  { id: 'v47', name: '블랙필', clinic: '밴스의원', category: 'peeling', bodyAreas: ['face'], effects: ['pore', 'brightening'], priceRange: '19,000원~' },
  { id: 'v48', name: '스케일링', clinic: '밴스의원', category: 'skincare', bodyAreas: ['face'], effects: ['pore', 'brightening'], priceRange: '19,000원~' },
  { id: 'v49', name: '크라이오 진정관리', clinic: '밴스의원', category: 'skincare', bodyAreas: ['face'], effects: ['redness', 'hydration'], priceRange: '19,000원~' },
  { id: 'v50', name: '이온자임 보습관리', clinic: '밴스의원', category: 'skincare', bodyAreas: ['face'], effects: ['hydration'], priceRange: '19,000원~' },

  // 주사/수액
  { id: 'v51', name: '신데렐라주사', clinic: '밴스의원', category: 'iv_injection', bodyAreas: ['full_body'], effects: ['whitening', 'brightening'], priceRange: '19,000원~' },
  { id: 'v52', name: '백옥주사', clinic: '밴스의원', category: 'iv_injection', bodyAreas: ['full_body'], effects: ['whitening', 'brightening'], priceRange: '19,000원~' },

  // 윤곽
  { id: 'v53', name: '밴스슬림넥', clinic: '밴스의원', category: 'contour', bodyAreas: ['neck'], effects: ['slimming', 'contour_effect'], priceRange: '99,000원~' },
  { id: 'v54', name: '엘러간 승모근+슬림넥', clinic: '밴스의원', category: 'contour', bodyAreas: ['neck'], effects: ['slimming', 'contour_effect'], priceRange: '599,000원~' },

  // 제모
  { id: 'v55', name: '젠틀맥스프로+ 여성 인중 제모', clinic: '밴스의원', category: 'hair_removal', bodyAreas: ['face'], effects: ['hair_removal_effect'], priceRange: '1,000원~' },
  { id: 'v56', name: '젠틀맥스프로+ 여성 겨드랑이 제모', clinic: '밴스의원', category: 'hair_removal', bodyAreas: ['arm'], effects: ['hair_removal_effect'], priceRange: '2,000원~' },
  { id: 'v57', name: '젠틀맥스프로+ 여성 팔 제모', clinic: '밴스의원', category: 'hair_removal', bodyAreas: ['arm'], effects: ['hair_removal_effect'], priceRange: '10,000원~' },
  { id: 'v58', name: '젠틀맥스프로+ 여성 브라질리언 제모', clinic: '밴스의원', category: 'hair_removal', bodyAreas: ['bikini'], effects: ['hair_removal_effect'], priceRange: '99,000원~' },
  { id: 'v59', name: '젠틀맥스프로+ 여성 다리전체 제모', clinic: '밴스의원', category: 'hair_removal', bodyAreas: ['leg'], effects: ['hair_removal_effect'], priceRange: '129,000원~' },
  { id: 'v60', name: '젠틀맥스프로+ 남성 인중 제모', clinic: '밴스의원', category: 'hair_removal', bodyAreas: ['face'], effects: ['hair_removal_effect'], priceRange: '2,000원~' },
  { id: 'v61', name: '젠틀맥스프로+ 남성 겨드랑이 제모', clinic: '밴스의원', category: 'hair_removal', bodyAreas: ['arm'], effects: ['hair_removal_effect'], priceRange: '4,900원~' },
  { id: 'v62', name: '젠틀맥스프로+ 남성 하관전체 제모', clinic: '밴스의원', category: 'hair_removal', bodyAreas: ['face'], effects: ['hair_removal_effect'], priceRange: '69,000원~' },

  // ========== 쁨클리닉 ==========
  // 보톡스
  { id: 'p1', name: '사각턱보톡스 (국산)', clinic: '쁨클리닉', category: 'botox', bodyAreas: ['face'], effects: ['contour_effect', 'slimming'] },
  { id: 'p2', name: '주름보톡스', clinic: '쁨클리닉', category: 'botox', bodyAreas: ['face'], effects: ['wrinkle'] },
  { id: 'p3', name: '코보톡스', clinic: '쁨클리닉', category: 'botox', bodyAreas: ['face'], effects: ['contour_effect'] },
  { id: 'p4', name: '입꼬리보톡스', clinic: '쁨클리닉', category: 'botox', bodyAreas: ['face'], effects: ['wrinkle'] },
  { id: 'p5', name: '승모근보톡스', clinic: '쁨클리닉', category: 'botox', bodyAreas: ['neck'], effects: ['slimming', 'contour_effect'] },

  // 필러
  { id: 'p6', name: '눈밑필러', clinic: '쁨클리닉', category: 'filler', bodyAreas: ['eye'], effects: ['volume'] },
  { id: 'p7', name: '팔자필러', clinic: '쁨클리닉', category: 'filler', bodyAreas: ['face'], effects: ['volume', 'wrinkle'] },
  { id: 'p8', name: '턱끝필러', clinic: '쁨클리닉', category: 'filler', bodyAreas: ['face'], effects: ['volume', 'contour_effect'] },
  { id: 'p9', name: '코필러', clinic: '쁨클리닉', category: 'filler', bodyAreas: ['face'], effects: ['volume', 'contour_effect'] },
  { id: 'p10', name: '입술필러', clinic: '쁨클리닉', category: 'filler', bodyAreas: ['face'], effects: ['volume'] },
  { id: 'p11', name: '이마필러', clinic: '쁨클리닉', category: 'filler', bodyAreas: ['face'], effects: ['volume'] },

  // 윤곽/라인
  { id: 'p12', name: '윤곽주사', clinic: '쁨클리닉', category: 'contour', bodyAreas: ['face'], effects: ['slimming', 'contour_effect'] },
  { id: 'p13', name: '양악주사', clinic: '쁨클리닉', category: 'contour', bodyAreas: ['face'], effects: ['slimming', 'contour_effect'] },
  { id: 'p14', name: '아큐주사', clinic: '쁨클리닉', category: 'contour', bodyAreas: ['face'], effects: ['slimming'] },
  { id: 'p15', name: '하이코', clinic: '쁨클리닉', category: 'contour', bodyAreas: ['face'], effects: ['contour_effect'] },
  { id: 'p16', name: '바비코', clinic: '쁨클리닉', category: 'contour', bodyAreas: ['face'], effects: ['contour_effect'] },
  { id: 'p17', name: 'Y코', clinic: '쁨클리닉', category: 'contour', bodyAreas: ['face'], effects: ['contour_effect'] },

  // 재생/물광
  { id: 'p18', name: '물광주사', clinic: '쁨클리닉', category: 'skin_booster', bodyAreas: ['face'], effects: ['hydration', 'brightening'] },
  { id: 'p19', name: '리쥬란', clinic: '쁨클리닉', category: 'skin_booster', bodyAreas: ['face'], effects: ['regeneration_effect', 'elasticity'] },
  { id: 'p20', name: '쥬베룩 볼륨 1cc', clinic: '쁨클리닉', category: 'skin_booster', bodyAreas: ['face'], effects: ['volume', 'regeneration_effect'], priceRange: '49,000원~' },
  { id: 'p21', name: '셀르디엠 7cc', clinic: '쁨클리닉', category: 'skin_booster', bodyAreas: ['face'], effects: ['regeneration_effect', 'volume'], priceRange: '650,000원~' },

  // 리프팅
  { id: 'p22', name: '볼뉴머 100샷', clinic: '쁨클리닉', category: 'lifting', bodyAreas: ['face'], effects: ['elasticity', 'tightening'], priceRange: '129,000원~' },
  { id: 'p23', name: '아이 볼뉴머 100샷', clinic: '쁨클리닉', category: 'lifting', bodyAreas: ['eye'], effects: ['elasticity', 'tightening'], priceRange: '159,000원~' },
  { id: 'p24', name: '포트라 리프팅 20KJ', clinic: '쁨클리닉', category: 'lifting', bodyAreas: ['face'], effects: ['elasticity', 'tightening'], priceRange: '349,000원~' },
  { id: 'p25', name: '울트라인 100샷', clinic: '쁨클리닉', category: 'lifting', bodyAreas: ['face'], effects: ['elasticity', 'tightening'], priceRange: '249,000원~' },
  { id: 'p26', name: '온다 리프팅 10KJ', clinic: '쁨클리닉', category: 'lifting', bodyAreas: ['face'], effects: ['elasticity', 'tightening'], priceRange: '110,000원~' },
  { id: 'p27', name: '울쎄라', clinic: '쁨클리닉', category: 'lifting', bodyAreas: ['face'], effects: ['elasticity', 'tightening', 'wrinkle'] },

  // 바디
  { id: 'p28', name: '울트라인 바디 100샷', clinic: '쁨클리닉', category: 'body_contouring', bodyAreas: ['body'], effects: ['tightening', 'slimming'], priceRange: '490,000원~' },
  { id: 'p29', name: '바디주사', clinic: '쁨클리닉', category: 'body_contouring', bodyAreas: ['body'], effects: ['slimming'] },

  // 실리프팅
  { id: 'p30', name: '실리프팅 (코그실)', clinic: '쁨클리닉', category: 'thread_lifting', bodyAreas: ['face'], effects: ['elasticity', 'tightening'] },
  { id: 'p31', name: '탄력실리프팅', clinic: '쁨클리닉', category: 'thread_lifting', bodyAreas: ['face'], effects: ['elasticity'] },

  // 레이저
  { id: 'p32', name: '리팟레이저 5mm', clinic: '쁨클리닉', category: 'pigment', bodyAreas: ['face'], effects: ['whitening', 'scar'], priceRange: '290,000원~' },
  { id: 'p33', name: '피코토닝', clinic: '쁨클리닉', category: 'laser_toning', bodyAreas: ['face'], effects: ['whitening', 'brightening'] },
  { id: 'p34', name: '색소레이저', clinic: '쁨클리닉', category: 'pigment', bodyAreas: ['face'], effects: ['whitening'] },
  { id: 'p35', name: '홍조레이저', clinic: '쁨클리닉', category: 'pigment', bodyAreas: ['face'], effects: ['redness'] },
  { id: 'p36', name: '여드름레이저', clinic: '쁨클리닉', category: 'acne', bodyAreas: ['face'], effects: ['acne_care'] },
  { id: 'p37', name: '모공레이저', clinic: '쁨클리닉', category: 'acne', bodyAreas: ['face'], effects: ['pore'] },

  // 제모 - 여성
  { id: 'p38', name: '여성 인중 제모', clinic: '쁨클리닉', category: 'hair_removal', bodyAreas: ['face'], effects: ['hair_removal_effect'] },
  { id: 'p39', name: '여성 겨드랑이 제모', clinic: '쁨클리닉', category: 'hair_removal', bodyAreas: ['arm'], effects: ['hair_removal_effect'] },
  { id: 'p40', name: '여성 팔 상완 제모', clinic: '쁨클리닉', category: 'hair_removal', bodyAreas: ['arm'], effects: ['hair_removal_effect'] },
  { id: 'p41', name: '여성 팔 하완 제모', clinic: '쁨클리닉', category: 'hair_removal', bodyAreas: ['arm'], effects: ['hair_removal_effect'] },
  { id: 'p42', name: '여성 팔 전체 제모', clinic: '쁨클리닉', category: 'hair_removal', bodyAreas: ['arm'], effects: ['hair_removal_effect'] },
  { id: 'p43', name: '여성 허벅지 제모', clinic: '쁨클리닉', category: 'hair_removal', bodyAreas: ['leg'], effects: ['hair_removal_effect'] },
  { id: 'p44', name: '여성 종아리 제모', clinic: '쁨클리닉', category: 'hair_removal', bodyAreas: ['leg'], effects: ['hair_removal_effect'] },
  { id: 'p45', name: '여성 다리 전체 제모', clinic: '쁨클리닉', category: 'hair_removal', bodyAreas: ['leg'], effects: ['hair_removal_effect'] },
  { id: 'p46', name: '여성 비키니라인 제모', clinic: '쁨클리닉', category: 'hair_removal', bodyAreas: ['bikini'], effects: ['hair_removal_effect'] },
  { id: 'p47', name: '여성 브라질리언 제모', clinic: '쁨클리닉', category: 'hair_removal', bodyAreas: ['bikini'], effects: ['hair_removal_effect'] },
  { id: 'p48', name: '여성 얼굴전체 제모', clinic: '쁨클리닉', category: 'hair_removal', bodyAreas: ['face'], effects: ['hair_removal_effect'] },
  { id: 'p49', name: '여성 헤어라인 제모', clinic: '쁨클리닉', category: 'hair_removal', bodyAreas: ['face'], effects: ['hair_removal_effect'] },
  { id: 'p50', name: '여성 상반신 제모', clinic: '쁨클리닉', category: 'hair_removal', bodyAreas: ['full_body'], effects: ['hair_removal_effect'] },
  { id: 'p51', name: '여성 하반신 제모', clinic: '쁨클리닉', category: 'hair_removal', bodyAreas: ['full_body'], effects: ['hair_removal_effect'] },
  { id: 'p52', name: '여성 전신 제모', clinic: '쁨클리닉', category: 'hair_removal', bodyAreas: ['full_body'], effects: ['hair_removal_effect'] },

  // 제모 - 남성
  { id: 'p53', name: '남성 3자이마 제모', clinic: '쁨클리닉', category: 'hair_removal', bodyAreas: ['face'], effects: ['hair_removal_effect'] },
  { id: 'p54', name: '남성 턱수염 제모', clinic: '쁨클리닉', category: 'hair_removal', bodyAreas: ['face'], effects: ['hair_removal_effect'] },
  { id: 'p55', name: '남성 콧수염 제모', clinic: '쁨클리닉', category: 'hair_removal', bodyAreas: ['face'], effects: ['hair_removal_effect'] },
  { id: 'p56', name: '남성 얼굴전체 제모', clinic: '쁨클리닉', category: 'hair_removal', bodyAreas: ['face'], effects: ['hair_removal_effect'] },
  { id: 'p57', name: '남성 겨드랑이 제모', clinic: '쁨클리닉', category: 'hair_removal', bodyAreas: ['arm'], effects: ['hair_removal_effect'] },
  { id: 'p58', name: '남성 팔 전체 제모', clinic: '쁨클리닉', category: 'hair_removal', bodyAreas: ['arm'], effects: ['hair_removal_effect'] },
  { id: 'p59', name: '남성 가슴/배 제모', clinic: '쁨클리닉', category: 'hair_removal', bodyAreas: ['body'], effects: ['hair_removal_effect'] },
  { id: 'p60', name: '남성 다리 전체 제모', clinic: '쁨클리닉', category: 'hair_removal', bodyAreas: ['leg'], effects: ['hair_removal_effect'] },
  { id: 'p61', name: '남성 상반신 제모', clinic: '쁨클리닉', category: 'hair_removal', bodyAreas: ['full_body'], effects: ['hair_removal_effect'] },
  { id: 'p62', name: '남성 하반신 제모', clinic: '쁨클리닉', category: 'hair_removal', bodyAreas: ['full_body'], effects: ['hair_removal_effect'] },
  { id: 'p63', name: '남성 전신 제모', clinic: '쁨클리닉', category: 'hair_removal', bodyAreas: ['full_body'], effects: ['hair_removal_effect'] },

  // 스킨케어/필링
  { id: 'p64', name: '아쿠아필', clinic: '쁨클리닉', category: 'skincare', bodyAreas: ['face'], effects: ['hydration', 'pore'] },
  { id: 'p65', name: '스케일링', clinic: '쁨클리닉', category: 'skincare', bodyAreas: ['face'], effects: ['pore', 'brightening'] },
  { id: 'p66', name: '메디컬필링', clinic: '쁨클리닉', category: 'peeling', bodyAreas: ['face'], effects: ['brightening', 'pore'] },
  { id: 'p67', name: '여드름관리', clinic: '쁨클리닉', category: 'acne', bodyAreas: ['face'], effects: ['acne_care'] },
  { id: 'p68', name: '모공관리', clinic: '쁨클리닉', category: 'acne', bodyAreas: ['face'], effects: ['pore'] },

  // 주사/수액
  { id: 'p69', name: '고압산소케어(아이벡스)', clinic: '쁨클리닉', category: 'skincare', bodyAreas: ['face'], effects: ['hydration', 'regeneration_effect'], priceRange: '99,000원~' },
];
