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
  branch: string;
}

export interface BranchPrice {
  branch: string;
  price: string;       // 할인가
  originalPrice?: string; // 정가
  discount?: string;    // 할인율
  note?: string;        // 체험가, 조건 등
}

export interface ClinicTreatment {
  id: string;
  name: string;
  clinic: ClinicBrand;
  branches: string[];
  category: TreatmentCategory;
  bodyAreas: TreatmentBodyArea[];
  effects: TreatmentEffect[];
  description?: string;
  priceRange?: string;
  branchPrices?: BranchPrice[]; // 지점별 가격
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

// ============ 밴스의원 지점 목록 (전체) ============

export const VANDS_BRANCH_URLS: Record<string, string> = {
  // 성형외과/모발이식
  '밴스성형외과(신논현)': 'https://vandsps.com/',
  '모자이너의원(신논현)': 'https://vandsmosigner.com/',
  // 서울
  '강남점': 'http://gangnam.vandsclinic.co.kr',
  '강서화곡점': 'http://hwagok.vandsclinic.co.kr',
  '구로점': 'http://guro.vandsclinic.co.kr',
  '동대문점': 'http://dongdaemun.vandsclinic.co.kr',
  '마포공덕점': 'http://mapo.vandsclinic.co.kr',
  '명동점': 'http://myeongdong.vandsclinic.co.kr',
  '명동2호점': 'http://myeongdong2.vandsclinic.co.kr',
  '삼성점': 'http://samseong.vandsclinic.co.kr',
  '성수점': 'https://seongsu.vandsclinic.co.kr/',
  '신사점': 'http://sinsa.vandsclinic.co.kr',
  '신촌점': 'https://sinchon.vandsclinic.co.kr/',
  '여의도점': 'http://yeouido.vandsclinic.co.kr',
  '영등포점': 'http://yeongdeungpo.vandsclinic.co.kr',
  '왕십리점': 'https://wangsimni.vandsclinic.co.kr/',
  '용산점': 'http://yongsan.vandsclinic.co.kr',
  '역삼점': 'https://yeoksam.vandsclinic.co.kr/',
  '잠실점': 'https://jamsil.vandsclinic.co.kr/',
  '천호점': 'https://cheonho.vandsclinic.co.kr/',
  '청담점': 'http://cheongdam.vandsclinic.co.kr',
  '홍대점': 'http://hongdae.vandsclinic.co.kr',
  // 경기
  '과천점': 'http://gwacheon.vandsclinic.co.kr',
  '광교점': 'http://gwanggyo.vandsclinic.co.kr',
  '구월점': 'http://guwol.vandsclinic.co.kr',
  '다산점': 'http://dasan.vandsclinic.co.kr',
  '동탄점': 'http://dongtanderma.vandsclinic.co.kr',
  '미금점': 'http://migeum.vandsclinic.co.kr',
  '부천점': 'http://bucheon.vandsclinic.co.kr',
  '송도점': 'https://songdo.vandsclinic.co.kr/',
  '수원점': 'http://suwon.vandsclinic.co.kr',
  '수원망포점': 'https://mangpo.vandsclinic.co.kr/',
  '수지점': 'https://suji.vandsclinic.co.kr/',
  '시흥점': 'https://siheung.vandsclinic.co.kr/',
  '야탑점': 'http://yatap.vandsclinic.co.kr',
  '위례점': 'https://wirye.vandsclinic.co.kr/',
  '의정부점': 'https://uijeongbu.vandsclinic.co.kr/',
  '일산점': 'http://ilsan.vandsclinic.co.kr',
  '판교점': 'http://pangyo.vandsclinic.co.kr',
  // 전국
  '광주점': 'http://gwangju.vandsclinic.co.kr',
  '광주주월점': 'http://gwangjujuwol.vandsclinic.co.kr',
  '김해점': 'https://gimhae.vandsclinic.co.kr/',
  '대구동성로점': 'https://daegu.vandsclinic.co.kr/',
  '대전점': 'http://daejeon.vandsclinic.co.kr',
  '부산점': 'http://busan.vandsclinic.co.kr',
  '부산센텀점': 'https://centum.vandsclinic.co.kr/',
  '부산해운대점': 'https://haeundae.vandsclinic.co.kr/',
  '순천점': 'https://suncheon.vandsclinic.co.kr/',
  '울산점': 'https://ulsan.vandsclinic.co.kr/',
  '원주점': 'https://wonju.vandsclinic.co.kr/',
  '양산점': 'https://yangsan.vandsclinic.co.kr/',
  '전주점': 'https://jeonju.vandsclinic.co.kr/',
  '제주점': 'http://jeju.vandsclinic.co.kr',
  '진주점': 'http://jinju.vandsclinic.co.kr',
  '창원점': 'https://changwon.vandsclinic.co.kr/',
  '청주점': 'http://cheongju.vandsclinic.co.kr',
  '충주점': 'http://chungju.vandsclinic.co.kr',
};

export const VANDS_BRANCHES = Object.keys(VANDS_BRANCH_URLS);

export const VANDS_REGIONS: Record<string, string[]> = {
  '성형/모발': ['밴스성형외과(신논현)', '모자이너의원(신논현)'],
  '서울': ['강남점','강서화곡점','구로점','동대문점','마포공덕점','명동점','명동2호점','삼성점','성수점','신사점','신촌점','여의도점','영등포점','왕십리점','용산점','역삼점','잠실점','천호점','청담점','홍대점'],
  '경기': ['과천점','광교점','구월점','다산점','동탄점','미금점','부천점','송도점','수원점','수원망포점','수지점','시흥점','야탑점','위례점','의정부점','일산점','판교점'],
  '전국': ['광주점','광주주월점','김해점','대구동성로점','대전점','부산점','부산센텀점','부산해운대점','순천점','울산점','원주점','양산점','전주점','제주점','진주점','창원점','청주점','충주점'],
};

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

// ============ 시술 데이터 (크롤링 기반 실제 가격) ============

const allVands = VANDS_BRANCHES.filter(b => !['밴스성형외과(신논현)', '모자이너의원(신논현)'].includes(b));
const allPpeum = PPEUM_BRANCHES;

// 서울 주요지점 (크롤링 완료)
const seoulMain = ['강남점','신사점','성수점','명동점','청담점','홍대점','잠실점'];
// 경기 주요지점
const gyeonggiMain = ['판교점','일산점','수원점','부천점','동탄점'];
// 전국 주요지점
const nationMain = ['부산점','대전점','대구동성로점','광주점','제주점'];

export const CLINIC_TREATMENTS: ClinicTreatment[] = [
  // =============================================
  //  밴스의원 — 보톡스 (크롤링 데이터 기반)
  // =============================================
  { 
    id: 'v1', name: '주름보톡스 1부위 (국산)', clinic: '밴스의원', branches: allVands, 
    category: 'botox', bodyAreas: ['face'], effects: ['wrinkle'], 
    priceRange: '900~9,900원', description: '미간/눈가/이마/콧등 등 부위별',
    branchPrices: [
      { branch: '강남점', price: '900원', originalPrice: '1,500원', discount: '40%', note: '1회 체험가' },
      { branch: '강남점', price: '9,900원', originalPrice: '18,000원', discount: '45%', note: '4부위 이상 1부위당' },
      { branch: '신사점', price: '900원', originalPrice: '1,500원', discount: '40%', note: '1회 체험가' },
      { branch: '신사점', price: '9,900원', originalPrice: '18,000원', discount: '45%', note: '4부위 이상시 1부위당' },
      { branch: '성수점', price: '900원', originalPrice: '1,500원', discount: '40%', note: '1회 체험가' },
    ],
  },
  { 
    id: 'v2', name: '사각턱보톡스 (국산)', clinic: '밴스의원', branches: allVands, 
    category: 'botox', bodyAreas: ['face'], effects: ['contour_effect', 'slimming'], 
    priceRange: '9,900~19,000원',
    branchPrices: [
      { branch: '강남점', price: '9,900원', originalPrice: '18,000원', discount: '45%', note: '1회 체험가' },
      { branch: '강남점', price: '19,000원', originalPrice: '35,000원', discount: '46%' },
      { branch: '신사점', price: '1,000원', originalPrice: '1,900원', discount: '47%', note: '얼굴제로팻 시술시' },
      { branch: '신사점', price: '9,900원', originalPrice: '18,000원', discount: '45%', note: '1회 체험가' },
    ],
  },
  { 
    id: 'v3', name: '제오민 주름보톡스 1부위', clinic: '밴스의원', branches: allVands, 
    category: 'botox', bodyAreas: ['face'], effects: ['wrinkle'], 
    priceRange: '29,000~99,000원', description: '내성 적은 독일 보톡스',
    branchPrices: [
      { branch: '강남점', price: '29,000원', originalPrice: '55,000원', discount: '47%', note: '1회 체험가' },
      { branch: '강남점', price: '99,000원', originalPrice: '180,000원', discount: '45%', note: '4부위' },
      { branch: '신사점', price: '29,000원', originalPrice: '55,000원', discount: '47%', note: '1회 체험가' },
      { branch: '신사점', price: '99,000원', originalPrice: '180,000원', discount: '45%', note: '3+1 (4부위)' },
    ],
  },
  { 
    id: 'v4', name: '제오민 사각턱보톡스', clinic: '밴스의원', branches: allVands, 
    category: 'botox', bodyAreas: ['face'], effects: ['contour_effect', 'slimming'], 
    priceRange: '79,000원',
    branchPrices: [
      { branch: '강남점', price: '79,000원', originalPrice: '140,000원', discount: '44%', note: '1회 체험가' },
      { branch: '신사점', price: '79,000원', originalPrice: '140,000원', discount: '44%', note: '1회 체험가' },
    ],
  },
  { 
    id: 'v5', name: '엘러간 주름보톡스 1부위', clinic: '밴스의원', branches: allVands, 
    category: 'botox', bodyAreas: ['face'], effects: ['wrinkle'], 
    priceRange: '59,000~199,000원', description: '미국 프리미엄 보톡스',
    branchPrices: [
      { branch: '강남점', price: '59,000원', originalPrice: '100,000원', discount: '41%', note: '1회 체험가' },
      { branch: '강남점', price: '149,000원', originalPrice: '250,000원', discount: '40%', note: '사각턱' },
      { branch: '강남점', price: '199,000원', originalPrice: '350,000원', discount: '43%', note: '3부위' },
    ],
  },
  { 
    id: 'v6', name: '모공톡신 (국산)', clinic: '밴스의원', branches: allVands, 
    category: 'botox', bodyAreas: ['face'], effects: ['pore', 'elasticity'], 
    priceRange: '29,000~99,000원',
    branchPrices: [
      { branch: '강남점', price: '29,000원', originalPrice: '50,000원', discount: '42%', note: '1cc' },
      { branch: '강남점', price: '49,000원', originalPrice: '90,000원', discount: '46%', note: '2cc' },
      { branch: '강남점', price: '69,000원', originalPrice: '130,000원', discount: '47%', note: '3cc' },
      { branch: '강남점', price: '89,000원', originalPrice: '150,000원', discount: '41%', note: '4cc' },
      { branch: '강남점', price: '99,000원', originalPrice: '180,000원', discount: '45%', note: '5cc' },
      { branch: '신사점', price: '29,000원', originalPrice: '50,000원', discount: '42%', note: '국산' },
      { branch: '신사점', price: '99,000원', originalPrice: '190,000원', discount: '48%', note: '제오민 3cc' },
    ],
  },
  { 
    id: 'v7', name: '침샘보톡스', clinic: '밴스의원', branches: allVands, 
    category: 'botox', bodyAreas: ['face'], effects: ['slimming', 'contour_effect'], 
    priceRange: '39,000~69,000원',
    branchPrices: [
      { branch: '강남점', price: '39,000원', originalPrice: '75,000원', discount: '48%', note: '1회 체험가' },
      { branch: '강남점', price: '69,000원', originalPrice: '130,000원', discount: '47%', note: '노메스턱 (턱+침샘)' },
    ],
  },
  { 
    id: 'v8', name: '승모근/종아리보톡스 100unit', clinic: '밴스의원', branches: allVands, 
    category: 'botox', bodyAreas: ['body'], effects: ['slimming', 'contour_effect'], 
    priceRange: '29,000원',
    branchPrices: [
      { branch: '강남점', price: '29,000원', originalPrice: '50,000원', discount: '42%' },
    ],
  },
  { 
    id: 'v9', name: '밴스슬림넥', clinic: '밴스의원', branches: allVands, 
    category: 'botox', bodyAreas: ['neck'], effects: ['slimming', 'contour_effect'], 
    priceRange: '99,000원', description: '두꺼운 목을 가늘게',
    branchPrices: [
      { branch: '강남점', price: '99,000원', originalPrice: '180,000원', discount: '45%' },
      { branch: '신사점', price: '99,000원', originalPrice: '180,000원', discount: '45%' },
    ],
  },
  { 
    id: 'v10', name: '다한증보톡스 (겨드랑이)', clinic: '밴스의원', branches: allVands, 
    category: 'botox', bodyAreas: ['body'], effects: ['slimming'], 
    priceRange: '49,000원',
    branchPrices: [
      { branch: '강남점', price: '49,000원', originalPrice: '90,000원', discount: '46%' },
    ],
  },
  { 
    id: 'v11', name: '다한증보톡스 (손/발바닥)', clinic: '밴스의원', branches: allVands, 
    category: 'botox', bodyAreas: ['body'], effects: ['slimming'], 
    priceRange: '90,000원',
    branchPrices: [
      { branch: '강남점', price: '90,000원', originalPrice: '170,000원', discount: '47%' },
    ],
  },
  { 
    id: 'v12', name: '목주름 보톡스 1+1', clinic: '밴스의원', branches: allVands, 
    category: 'botox', bodyAreas: ['neck'], effects: ['wrinkle'], 
    priceRange: '69,000원',
    branchPrices: [
      { branch: '강남점', price: '69,000원', originalPrice: '130,000원', discount: '47%' },
    ],
  },

  // =============================================
  //  밴스의원 — 레이저 리프팅 (크롤링 데이터 기반)
  // =============================================
  { 
    id: 'v24', name: '울쎄라피프라임 100샷', clinic: '밴스의원', branches: allVands, 
    category: 'lifting', bodyAreas: ['face'], effects: ['elasticity', 'tightening'], 
    priceRange: '299,000~890,000원',
    branchPrices: [
      { branch: '강남점', price: '299,000원', originalPrice: '550,000원', discount: '46%', note: '100샷 1회체험가' },
      { branch: '강남점', price: '890,000원', originalPrice: '1,500,000원', discount: '41%', note: '300샷 1회체험가' },
    ],
  },
  { 
    id: 'v25', name: '인모드 FX모드 1부위', clinic: '밴스의원', branches: allVands, 
    category: 'lifting', bodyAreas: ['face'], effects: ['elasticity', 'tightening'], 
    priceRange: '19,000~149,000원',
    branchPrices: [
      { branch: '강남점', price: '19,000원', originalPrice: '35,000원', discount: '46%', note: 'FX 1부위' },
      { branch: '강남점', price: '69,000원', originalPrice: '100,000원', discount: '31%', note: 'FX 얼굴전체' },
      { branch: '강남점', price: '59,000원', originalPrice: '100,000원', discount: '41%', note: 'Forma 1부위' },
      { branch: '강남점', price: '119,000원', originalPrice: '190,000원', discount: '37%', note: 'Forma 얼굴전체' },
      { branch: '강남점', price: '149,000원', originalPrice: '250,000원', discount: '40%', note: 'FX+Forma 얼굴전체' },
    ],
  },
  { 
    id: 'v26', name: '슈링크유니버스 울트라', clinic: '밴스의원', branches: allVands, 
    category: 'lifting', bodyAreas: ['face'], effects: ['elasticity', 'tightening'], 
    priceRange: '9,900~89,000원',
    branchPrices: [
      { branch: '강남점', price: '9,900원', originalPrice: '19,000원', discount: '48%', note: '100샷 1회 체험가' },
      { branch: '강남점', price: '89,000원', originalPrice: '160,000원', discount: '44%', note: '300샷 1회 체험가' },
    ],
  },
  { 
    id: 'v27', name: '아이슈링크 100샷+더마톡신 1cc', clinic: '밴스의원', branches: allVands, 
    category: 'lifting', bodyAreas: ['eye'], effects: ['elasticity', 'tightening', 'wrinkle'], 
    priceRange: '69,000원',
    branchPrices: [
      { branch: '강남점', price: '69,000원', originalPrice: '135,000원', discount: '49%' },
    ],
  },

  // =============================================
  //  밴스의원 — 스킨부스터 (크롤링 데이터 기반)
  // =============================================
  { 
    id: 'v30', name: '셀르디엠 얼굴전체 6cc', clinic: '밴스의원', branches: allVands, 
    category: 'skin_booster', bodyAreas: ['face'], effects: ['regeneration_effect', 'elasticity'], 
    priceRange: '590,000원', description: '차세대 ECM 스킨부스터',
    branchPrices: [
      { branch: '강남점', price: '590,000원', originalPrice: '1,000,000원', discount: '41%', note: '1회 체험가' },
    ],
  },
  { 
    id: 'v31', name: '스컬트라 1cc', clinic: '밴스의원', branches: allVands, 
    category: 'skin_booster', bodyAreas: ['face'], effects: ['volume', 'elasticity'], 
    priceRange: '49,000원', description: 'PLLA 콜라겐생성유도물질',
    branchPrices: [
      { branch: '강남점', price: '49,000원', originalPrice: '80,000원', discount: '39%', note: '10cc 이상시' },
    ],
  },
  { 
    id: 'v32', name: '엘라비에 리투오 6cc', clinic: '밴스의원', branches: allVands, 
    category: 'skin_booster', bodyAreas: ['face'], effects: ['elasticity', 'regeneration_effect'], 
    priceRange: '600,000원', description: '안티에이징 스킨부스터',
    branchPrices: [
      { branch: '강남점', price: '600,000원', originalPrice: '1,000,000원', discount: '40%' },
    ],
  },
  { 
    id: 'v33', name: '리바이브 1cc', clinic: '밴스의원', branches: allVands, 
    category: 'skin_booster', bodyAreas: ['face'], effects: ['hydration', 'elasticity'], 
    priceRange: '290,000원', description: '글리세롤+히알루론산 명품 부스터',
    branchPrices: [
      { branch: '강남점', price: '290,000원', originalPrice: '550,000원', discount: '47%', note: '1회 체험가' },
    ],
  },
  { 
    id: 'v34', name: '미라콜 (볼륨) 3cc', clinic: '밴스의원', branches: allVands, 
    category: 'skin_booster', bodyAreas: ['face'], effects: ['volume', 'elasticity', 'regeneration_effect'], 
    priceRange: '149,000~390,000원', description: '콜라겐 리모델링',
    branchPrices: [
      { branch: '강남점', price: '290,000원', originalPrice: '550,000원', discount: '47%', note: '볼륨 3cc' },
      { branch: '강남점', price: '149,000원', originalPrice: '250,000원', discount: '40%', note: '눈밑 1회' },
      { branch: '강남점', price: '390,000원', originalPrice: '750,000원', discount: '48%', note: '스킨 6cc' },
    ],
  },
  { 
    id: 'v35', name: '스킨바이브 2cc', clinic: '밴스의원', branches: allVands, 
    category: 'skin_booster', bodyAreas: ['face'], effects: ['hydration', 'elasticity'], 
    priceRange: '249,000원', description: '엠보 없이 지속 길게, 명품 스킨부스터',
    branchPrices: [
      { branch: '강남점', price: '249,000원', originalPrice: '450,000원', discount: '45%' },
    ],
  },
  { 
    id: 'v36', name: 'THE 미희주사', clinic: '밴스의원', branches: allVands, 
    category: 'skin_booster', bodyAreas: ['face', 'eye'], effects: ['volume', 'regeneration_effect'], 
    priceRange: '290,000원', description: '꺼진 눈밑 볼륨 콜라겐주사',
    branchPrices: [
      { branch: '강남점', price: '290,000원', originalPrice: '550,000원', discount: '47%', note: '눈밑 1회' },
      { branch: '강남점', price: '290,000원', originalPrice: '550,000원', discount: '47%', note: '목주름 1+1' },
    ],
  },

  // =============================================
  //  밴스의원 — 레이저토닝/미백 (크롤링: 신사점)
  // =============================================
  { 
    id: 'v40', name: '피코토닝', clinic: '밴스의원', branches: allVands, 
    category: 'laser_toning', bodyAreas: ['face'], effects: ['brightening', 'whitening', 'pore'], 
    priceRange: '9,900~490,000원',
    branchPrices: [
      { branch: '신사점', price: '9,900원', originalPrice: '18,000원', discount: '45%', note: '1회 체험가' },
      { branch: '신사점', price: '39,000원', originalPrice: '60,000원', discount: '35%', note: '+비타민관리 1회 체험가' },
      { branch: '신사점', price: '99,000원', originalPrice: '180,000원', discount: '45%', note: '+피코지우개 1회 체험가' },
      { branch: '신사점', price: '490,000원', originalPrice: '800,000원', discount: '39%', note: '10회' },
    ],
  },
  { 
    id: 'v41', name: '기미주사', clinic: '밴스의원', branches: allVands, 
    category: 'pigment', bodyAreas: ['face'], effects: ['whitening', 'brightening'], 
    priceRange: '39,000원',
    branchPrices: [
      { branch: '신사점', price: '39,000원', originalPrice: '40,000원', discount: '2%' },
    ],
  },
  { 
    id: 'v42', name: '엑셀V플러스', clinic: '밴스의원', branches: allVands, 
    category: 'pigment', bodyAreas: ['face'], effects: ['redness', 'brightening', 'whitening'], 
    priceRange: '99,000~299,000원',
    branchPrices: [
      { branch: '신사점', price: '99,000원', originalPrice: '180,000원', discount: '45%', note: '싱글모드 1회 체험가' },
      { branch: '신사점', price: '199,000원', originalPrice: '380,000원', discount: '48%', note: '듀얼모드 1회 체험가' },
      { branch: '신사점', price: '299,000원', originalPrice: '580,000원', discount: '48%', note: '트리플모드 1회 체험가' },
    ],
  },

  // =============================================
  //  밴스의원 — 스킨케어 체험가 (크롤링: 신사점)
  // =============================================
  { 
    id: 'v50', name: '아쿠아필 2단계', clinic: '밴스의원', branches: allVands, 
    category: 'skincare', bodyAreas: ['face'], effects: ['hydration', 'pore'], 
    priceRange: '9,900원',
    branchPrices: [
      { branch: '신사점', price: '9,900원', originalPrice: '18,000원', discount: '45%' },
    ],
  },
  { 
    id: 'v51', name: '비타민관리', clinic: '밴스의원', branches: allVands, 
    category: 'skincare', bodyAreas: ['face'], effects: ['brightening', 'hydration'], 
    priceRange: '9,900원',
    branchPrices: [
      { branch: '신사점', price: '9,900원', originalPrice: '18,000원', discount: '45%' },
    ],
  },
  { 
    id: 'v52', name: 'LED재생레이저', clinic: '밴스의원', branches: allVands, 
    category: 'skincare', bodyAreas: ['face'], effects: ['regeneration_effect'], 
    priceRange: '9,900원',
    branchPrices: [
      { branch: '신사점', price: '9,900원', originalPrice: '18,000원', discount: '45%' },
    ],
  },
  { 
    id: 'v53', name: '크라이오 진정관리', clinic: '밴스의원', branches: allVands, 
    category: 'skincare', bodyAreas: ['face'], effects: ['hydration', 'redness'], 
    priceRange: '9,900원',
    branchPrices: [
      { branch: '신사점', price: '9,900원', originalPrice: '18,000원', discount: '45%' },
    ],
  },
  { 
    id: 'v54', name: '피부스케일링', clinic: '밴스의원', branches: allVands, 
    category: 'peeling', bodyAreas: ['face'], effects: ['brightening', 'pore'], 
    priceRange: '9,900원',
    branchPrices: [
      { branch: '신사점', price: '9,900원', originalPrice: '18,000원', discount: '45%' },
    ],
  },

  // =============================================
  //  밴스의원 — 콜라스터 (크롤링: 신사점)
  // =============================================
  { 
    id: 'v60', name: '콜라스터 오리지널 4cc (3회)', clinic: '밴스의원', branches: allVands, 
    category: 'regeneration', bodyAreas: ['face'], effects: ['regeneration_effect', 'elasticity'], 
    priceRange: '297,000원', description: '6가지 앰플 맞춤 피부재생 콜라겐 부스터',
    branchPrices: [
      { branch: '신사점', price: '297,000원', originalPrice: '550,000원', discount: '46%' },
    ],
  },
  { 
    id: 'v61', name: '콜라스터 브라이트닝 6cc (3회)', clinic: '밴스의원', branches: allVands, 
    category: 'regeneration', bodyAreas: ['face'], effects: ['brightening', 'regeneration_effect'], 
    priceRange: '447,000원',
    branchPrices: [
      { branch: '신사점', price: '447,000원', originalPrice: '800,000원', discount: '44%' },
    ],
  },
  { 
    id: 'v62', name: '콜라스터 아크네 6cc (3회)', clinic: '밴스의원', branches: allVands, 
    category: 'regeneration', bodyAreas: ['face'], effects: ['acne_care', 'regeneration_effect'], 
    priceRange: '597,000원',
    branchPrices: [
      { branch: '신사점', price: '597,000원', originalPrice: '1,000,000원', discount: '40%' },
    ],
  },
  { 
    id: 'v63', name: '콜라스터 넥소좀 6cc (3회)', clinic: '밴스의원', branches: allVands, 
    category: 'regeneration', bodyAreas: ['face', 'neck'], effects: ['regeneration_effect', 'elasticity'], 
    priceRange: '747,000원',
    branchPrices: [
      { branch: '신사점', price: '747,000원', originalPrice: '1,400,000원', discount: '47%' },
    ],
  },

  // =============================================
  //  밴스의원 — 제모 (기존 데이터 유지)
  // =============================================
  { id: 'v70', name: '여성 겨드랑이/인중 제모 1회', clinic: '밴스의원', branches: allVands, category: 'hair_removal', bodyAreas: ['body'], effects: ['hair_removal_effect'], priceRange: '1,000~19,000원' },
  { id: 'v71', name: '여성 헤어라인/눈썹 제모 1회', clinic: '밴스의원', branches: allVands, category: 'hair_removal', bodyAreas: ['face'], effects: ['hair_removal_effect'], priceRange: '60,000원' },
  { id: 'v72', name: '여성 팔하완 제모 1회', clinic: '밴스의원', branches: allVands, category: 'hair_removal', bodyAreas: ['arm'], effects: ['hair_removal_effect'], priceRange: '10,000~80,000원' },
  { id: 'v73', name: '여성 다리전체 제모 1회', clinic: '밴스의원', branches: allVands, category: 'hair_removal', bodyAreas: ['leg'], effects: ['hair_removal_effect'], priceRange: '80,000~150,000원' },
  { id: 'v74', name: '남성 인중+콧수염 제모 1회', clinic: '밴스의원', branches: allVands, category: 'hair_removal', bodyAreas: ['face'], effects: ['hair_removal_effect'], priceRange: '1,000~29,000원' },

  // =============================================
  //  밴스의원 — 필러 (기존 + 크롤링)
  // =============================================
  { id: 'v80', name: '볼륨필러 아띠에르 (국산) 1cc', clinic: '밴스의원', branches: allVands, category: 'filler', bodyAreas: ['face'], effects: ['volume', 'wrinkle'], priceRange: '49,000원' },
  { id: 'v81', name: '볼륨필러 벨로테로 (수입) 1cc', clinic: '밴스의원', branches: allVands, category: 'filler', bodyAreas: ['face'], effects: ['volume', 'wrinkle'], priceRange: '290,000~390,000원' },
  { id: 'v82', name: '볼륨필러 레스틸렌 (수입) 1cc', clinic: '밴스의원', branches: allVands, category: 'filler', bodyAreas: ['face'], effects: ['volume', 'wrinkle'], priceRange: '330,000~390,000원' },
  { id: 'v83', name: '하이코/바비코 (수입) 1줄', clinic: '밴스의원', branches: allVands, category: 'thread_lifting', bodyAreas: ['face'], effects: ['elasticity', 'tightening'], priceRange: '99,000원' },

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
  { id: 'p24', name: '스타일에이지 필러 (수입)', clinic: '쁨클리닉', branches: allPpeum, category: 'filler', bodyAreas: ['face'], effects: ['volume', 'wrinkle'], priceRange: '250,000원' },
  { id: 'p25', name: '수입 눈밑재배치 필러', clinic: '쁨클리닉', branches: allPpeum, category: 'filler', bodyAreas: ['eye'], effects: ['volume', 'wrinkle'], priceRange: '500,000원' },
  { id: 'p26', name: '입술필러 1부위 (국산)', clinic: '쁨클리닉', branches: allPpeum, category: 'filler', bodyAreas: ['face'], effects: ['volume'], priceRange: '80,000원', description: '위/아래/꼬리 중 택1' },
  { id: 'p27', name: '큐오필 플러스 1cc', clinic: '쁨클리닉', branches: allPpeum, category: 'filler', bodyAreas: ['face'], effects: ['volume', 'elasticity'], priceRange: '60,000원', description: '3cc 이상 시술 시 적용' },
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

  // 쁨클리닉 — 기타
  { id: 'p58', name: '잇몸노출 보톡스', clinic: '쁨클리닉', branches: allPpeum, category: 'botox', bodyAreas: ['face'], effects: ['contour_effect'], priceRange: '50,000원' },
  { id: 'p59', name: '자갈턱/콧볼/콧등 보톡스', clinic: '쁨클리닉', branches: allPpeum, category: 'botox', bodyAreas: ['face'], effects: ['contour_effect'], priceRange: '30,000원' },
  { id: 'p60', name: '심술보 삭제 필러', clinic: '쁨클리닉', branches: allPpeum, category: 'filler', bodyAreas: ['face'], effects: ['volume', 'contour_effect'], priceRange: '400,000원' },
];
