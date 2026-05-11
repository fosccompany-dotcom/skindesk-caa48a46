// ─────────────────────────────────────────────────────────────────────────────
// 시술별 모드 추천 데이터
// 각 시술의 피부과학적 회복 주기 + 5모드별 권장 빈도를 정의합니다.
// ─────────────────────────────────────────────────────────────────────────────

export type SeasonKey = 'no_care' | 'maintain' | 'boost' | 'special';

export interface SeasonRec {
  label: string;          // "연 1회", "3개월 간격 2회" 등
  timesPerYear: number;   // 연간 시술 횟수
  intervalDays: number;   // 시술 간격 (일)
  note: string;           // 상세 설명
  synergy?: string[];     // 시너지 추천 시술 (boost/special만)
}

export interface TreatmentSeasonData {
  id: string;
  name: string;
  category: '리프팅' | '레이저' | '보톡스/필러' | '주사' | '스킨케어' | '기기';
  skinLayer: 'epidermis' | 'dermis' | 'subcutaneous';
  description: string;
  baseIntervalDays: number;   // maintain 기준 기본 주기 (일)
  seasons: Record<SeasonKey, SeasonRec>;
}

// ─────────────────────────────────────────────────────────────────────────────
// 리프팅 계열 (피하층)
// ─────────────────────────────────────────────────────────────────────────────

const liftingTreatments: TreatmentSeasonData[] = [
  {
    id: 'shrink',
    name: '슈링크',
    category: '리프팅',
    skinLayer: 'subcutaneous',
    description: 'HIFU 방식 피부 리프팅. 피하 지방층까지 집속 초음파 에너지 전달.',
    baseIntervalDays: 150,
    seasons: {
      no_care: {
        label: '비추천',
        timesPerYear: 0,
        intervalDays: 0,
        note: '휴식기에는 시술을 쉬고 피부 회복에 집중하세요.',
      },
      maintain: {
        label: '연 2회 (6개월 간격)',
        timesPerYear: 2,
        intervalDays: 180,
        note: '콜라겐 재생 주기(3~6개월) 고려. 6개월 간격으로 꾸준히 유지.',
      },
      boost: {
        label: '연 3회 (4개월 간격)',
        timesPerYear: 3,
        intervalDays: 120,
        note: '집중 관리 모드. 4개월 간격으로 탄력·리프팅 효과를 극대화.',
        synergy: ['리쥬란힐러', '스킨부스터', '엑소좀'],
      },
      special: {
        label: '연 3~4회 (3개월 간격)',
        timesPerYear: 4,
        intervalDays: 90,
        note: '이벤트 D-30 전 시술 권장. 3개월 간격 + 직전 스킨부스터 조합.',
        synergy: ['리쥬란힐러', '스킨부스터', '물광주사', '엑소좀'],
      },
    },
  },
  {
    id: 'cerph',
    name: '세르프',
    category: '리프팅',
    skinLayer: 'subcutaneous',
    description: 'SMAS층 집중 리프팅. 슈링크 대비 더 깊은 층에 작용하는 고강도 리프팅 시술.',
    baseIntervalDays: 180,
    seasons: {
      no_care: {
        label: '비추천',
        timesPerYear: 0,
        intervalDays: 0,
        note: '휴식기에는 시술을 쉬고 피부 회복에 집중하세요.',
      },
      maintain: {
        label: '연 1~2회 (6개월 간격)',
        timesPerYear: 2,
        intervalDays: 180,
        note: '콜라겐 생성 주기 고려. 6개월 이상 간격 유지 권장.',
      },
      boost: {
        label: '연 2회 (5개월 간격)',
        timesPerYear: 2,
        intervalDays: 150,
        note: '탄력·윤곽 개선에 집중. 5개월 간격으로 진행 시 효과 누적.',
        synergy: ['슈링크', '리쥬란힐러', '보톡스'],
      },
      special: {
        label: '연 3회 (4개월 간격)',
        timesPerYear: 3,
        intervalDays: 120,
        note: '이벤트 D-60 전 선제 시술 권장. 이후 슈링크+스킨부스터 마무리.',
        synergy: ['슈링크', '리쥬란힐러', '물광주사', '스킨부스터'],
      },
    },
  },
  {
    id: 'thermage',
    name: '써마지',
    category: '리프팅',
    skinLayer: 'subcutaneous',
    description: '고주파(RF) 방식의 콜라겐 리모델링. 피부 전체 레이어에 균일한 열에너지 전달.',
    baseIntervalDays: 365,
    seasons: {
      no_care: {
        label: '비추천',
        timesPerYear: 0,
        intervalDays: 0,
        note: '휴식기에는 시술을 쉬고 피부 회복에 집중하세요.',
      },
      maintain: {
        label: '연 1회',
        timesPerYear: 1,
        intervalDays: 365,
        note: '써마지는 효과 지속력이 길어 연 1회도 충분한 유지 효과.',
      },
      boost: {
        label: '연 1~2회 (6개월 간격)',
        timesPerYear: 2,
        intervalDays: 180,
        note: '콜라겐 재생 사이클을 활용해 6개월 간격 2회 진행.',
        synergy: ['슈링크', '리쥬란힐러', '보톡스'],
      },
      special: {
        label: '연 2회 + 직전 부스팅',
        timesPerYear: 2,
        intervalDays: 180,
        note: '이벤트 D-45 전 시술 + D-7 스킨부스터로 광채 극대화.',
        synergy: ['슈링크', '리쥬란힐러', '스킨부스터', '물광주사'],
      },
    },
  },
  {
    id: 'inmode',
    name: '인모드',
    category: '리프팅',
    skinLayer: 'subcutaneous',
    description: '고주파(RF) 기반 바디·페이스 라인 개선 기기. 피하지방층 작용.',
    baseIntervalDays: 90,
    seasons: {
      no_care: {
        label: '비추천',
        timesPerYear: 0,
        intervalDays: 0,
        note: '휴식기에는 시술을 쉬고 피부 회복에 집중하세요.',
      },
      maintain: {
        label: '2개월 간격 (연 6회)',
        timesPerYear: 6,
        intervalDays: 60,
        note: '꾸준한 라인 유지를 위해 2개월 간격 정기 관리.',
      },
      boost: {
        label: '월 1~2회 (연 12~18회)',
        timesPerYear: 15,
        intervalDays: 28,
        note: '집중 관리 모드. 1개월 간격으로 효과 누적.',
        synergy: ['써마지', '보톡스(턱/사각턱)', '리쥬란힐러'],
      },
      special: {
        label: '월 2회 (D-60부터)',
        timesPerYear: 4,
        intervalDays: 14,
        note: '이벤트 2개월 전부터 집중. D-14 이후 인모드 중단 후 마무리 케어.',
        synergy: ['써마지', '보톡스', '스킨부스터', '물광주사'],
      },
    },
  },
  {
    id: 'doublo',
    name: '더블로',
    category: '리프팅',
    skinLayer: 'subcutaneous',
    description: '마이크로포커스 초음파(MFU)+RF 복합 리프팅. 실시간 영상 확인 기반.',
    baseIntervalDays: 150,
    seasons: {
      no_care: {
        label: '비추천',
        timesPerYear: 0,
        intervalDays: 0,
        note: '휴식기에는 시술을 쉬고 피부 회복에 집중하세요.',
      },
      maintain: {
        label: '연 2~3회 (4~6개월 간격)',
        timesPerYear: 2,
        intervalDays: 150,
        note: '콜라겐 재생 주기 고려. 4~6개월 간격 유지.',
      },
      boost: {
        label: '연 3~4회 (3개월 간격)',
        timesPerYear: 3,
        intervalDays: 90,
        note: '3개월 간격으로 집중 리프팅 효과 누적.',
        synergy: ['리쥬란힐러', '스킨부스터', '보톡스'],
      },
      special: {
        label: '연 4회 (3개월 간격) + 직전 주사',
        timesPerYear: 4,
        intervalDays: 90,
        note: '이벤트 D-30 더블로 + D-7 물광/스킨부스터 마무리.',
        synergy: ['리쥬란힐러', '물광주사', '스킨부스터', '보톡스'],
      },
    },
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// 보톡스 / 필러 계열 (진피층)
// ─────────────────────────────────────────────────────────────────────────────

const botoxFillerTreatments: TreatmentSeasonData[] = [
  {
    id: 'botox',
    name: '보톡스',
    category: '보톡스/필러',
    skinLayer: 'dermis',
    description: '보툴리눔 톡신 주사. 근육 이완을 통한 주름 개선 및 윤곽 교정.',
    baseIntervalDays: 120,
    seasons: {
      no_care: {
        label: '비추천',
        timesPerYear: 0,
        intervalDays: 0,
        note: '휴식기에는 시술을 쉬고 피부 회복에 집중하세요.',
      },
      maintain: {
        label: '3~4개월 간격 (연 3~4회)',
        timesPerYear: 3,
        intervalDays: 120,
        note: '보톡스 효과 지속 주기(3~4개월)에 맞춰 정기 관리.',
      },
      boost: {
        label: '3개월 간격 (연 4회)',
        timesPerYear: 4,
        intervalDays: 90,
        note: '부위 확장 고려. 이마·눈가·입가·사각턱 전체 케어 루틴화.',
        synergy: ['필러', '리쥬란힐러', '스킨부스터'],
      },
      special: {
        label: '이벤트 D-14 세팅',
        timesPerYear: 4,
        intervalDays: 90,
        note: '이벤트 2주 전 시술 권장(완전 발현 후 촬영/모임). 물광주사와 조합.',
        synergy: ['필러', '물광주사', '스킨부스터', '리쥬란힐러'],
      },
    },
  },
  {
    id: 'zeomin',
    name: '제오민 (보톡스)',
    category: '보톡스/필러',
    skinLayer: 'dermis',
    description: '복합단백질 제거 정제 보툴리눔 톡신. 내성 없는 장기 관리에 적합.',
    baseIntervalDays: 150,
    seasons: {
      no_care: {
        label: '비추천',
        timesPerYear: 0,
        intervalDays: 0,
        note: '휴식기에는 시술을 쉬고 피부 회복에 집중하세요.',
      },
      maintain: {
        label: '4~5개월 간격 (연 3회)',
        timesPerYear: 3,
        intervalDays: 135,
        note: '제오민 효과 지속 주기(4~5개월) 기준으로 규칙적 관리.',
      },
      boost: {
        label: '3~4개월 간격 (연 4회)',
        timesPerYear: 4,
        intervalDays: 105,
        note: '효과 극대화를 위해 리프팅과 병행.',
        synergy: ['슈링크', '필러', '스킨부스터'],
      },
      special: {
        label: '이벤트 D-14 세팅',
        timesPerYear: 4,
        intervalDays: 90,
        note: '이벤트 2주 전 시술. 리쥬란+물광 조합으로 마무리.',
        synergy: ['필러', '리쥬란힐러', '물광주사'],
      },
    },
  },
  {
    id: 'filler',
    name: '필러',
    category: '보톡스/필러',
    skinLayer: 'dermis',
    description: '히알루론산 등 필러 주입. 볼륨 보충, 팔자 개선, 윤곽 교정.',
    baseIntervalDays: 365,
    seasons: {
      no_care: {
        label: '비추천',
        timesPerYear: 0,
        intervalDays: 0,
        note: '휴식기에는 시술을 쉬고 피부 회복에 집중하세요.',
      },
      maintain: {
        label: '연 1~2회 (6~12개월 간격)',
        timesPerYear: 1,
        intervalDays: 365,
        note: '필러 종류에 따라 6~18개월 지속. 자연 흡수 후 리터치.',
      },
      boost: {
        label: '연 1~2회 + 부위 추가',
        timesPerYear: 2,
        intervalDays: 180,
        note: '기존 부위 유지 + 새로운 부위 볼륨 개선.',
        synergy: ['보톡스', '리쥬란힐러', '스킨부스터'],
      },
      special: {
        label: '이벤트 D-30 전 필러 세팅',
        timesPerYear: 2,
        intervalDays: 180,
        note: '이벤트 1개월 전 필러 + 2주 전 보톡스로 최상의 컨디션.',
        synergy: ['보톡스', '물광주사', '스킨부스터', '리쥬란힐러'],
      },
    },
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// 주사 / 스킨부스터 계열 (진피층)
// ─────────────────────────────────────────────────────────────────────────────

const injectionTreatments: TreatmentSeasonData[] = [
  {
    id: 'rejuran',
    name: '리쥬란힐러',
    category: '주사',
    skinLayer: 'dermis',
    description: '연어 DNA(PN) 기반 피부 재생 주사. 손상 피부 회복, 콜라겐 촉진.',
    baseIntervalDays: 90,
    seasons: {
      no_care: {
        label: '비추천',
        timesPerYear: 0,
        intervalDays: 0,
        note: '휴식기에는 시술을 쉬고 피부 회복에 집중하세요.',
      },
      maintain: {
        label: '2~3개월 간격 (연 4~6회)',
        timesPerYear: 4,
        intervalDays: 75,
        note: '콜라겐 유지를 위한 정기 관리.',
      },
      boost: {
        label: '1~2개월 간격 (연 6~8회)',
        timesPerYear: 7,
        intervalDays: 45,
        note: '집중 재생 모드. 리프팅 시술 후 회복 촉진에 효과적.',
        synergy: ['슈링크', '더블로', '스킨부스터', '엑소좀'],
      },
      special: {
        label: '이벤트 D-14 최종 주사',
        timesPerYear: 8,
        intervalDays: 30,
        note: '이벤트 2주 전 마지막 리쥬란으로 피부 촉촉함·탄력 최대화.',
        synergy: ['물광주사', '스킨부스터', '엑소좀', '보톡스'],
      },
    },
  },
  {
    id: 'rejuran-eye',
    name: '리쥬란아이',
    category: '주사',
    skinLayer: 'dermis',
    description: '눈가 전용 리쥬란. 눈 밑 재생 및 잔주름 개선.',
    baseIntervalDays: 60,
    seasons: {
      no_care: {
        label: '비추천',
        timesPerYear: 0,
        intervalDays: 0,
        note: '휴식기에는 시술을 쉬고 피부 회복에 집중하세요.',
      },
      maintain: {
        label: '2개월 간격 (연 6회)',
        timesPerYear: 6,
        intervalDays: 60,
        note: '눈가 탄력 유지를 위한 정기 관리.',
      },
      boost: {
        label: '1개월 간격 (연 8~10회)',
        timesPerYear: 9,
        intervalDays: 40,
        note: '집중 눈가 케어. 리쥬란힐러 전신과 함께 진행 시 효과적.',
        synergy: ['리쥬란힐러', '보톡스(눈가)', '스킨부스터'],
      },
      special: {
        label: '이벤트 D-7 최종 주사',
        timesPerYear: 12,
        intervalDays: 30,
        note: '이벤트 일주일 전 눈가 집중 케어. 보톡스와 시너지.',
        synergy: ['보톡스', '물광주사', '리쥬란힐러'],
      },
    },
  },
  {
    id: 'skinbooster',
    name: '스킨부스터',
    category: '주사',
    skinLayer: 'dermis',
    description: '히알루론산 피부 내 직접 주입. 즉각적인 수분 충전 및 광채 효과.',
    baseIntervalDays: 60,
    seasons: {
      no_care: {
        label: '비추천',
        timesPerYear: 0,
        intervalDays: 0,
        note: '휴식기에는 시술을 쉬고 피부 회복에 집중하세요.',
      },
      maintain: {
        label: '2개월 간격 (연 6회)',
        timesPerYear: 6,
        intervalDays: 60,
        note: '꾸준한 수분·탄력 유지.',
      },
      boost: {
        label: '1개월 간격 (연 10~12회)',
        timesPerYear: 10,
        intervalDays: 30,
        note: '모든 시술 후 마무리 케어로 활용. 리프팅 효과 극대화.',
        synergy: ['슈링크', '더블로', '리쥬란힐러', '엑소좀'],
      },
      special: {
        label: '이벤트 D-7 필수 주사',
        timesPerYear: 12,
        intervalDays: 28,
        note: '이벤트 일주일 전 스킨부스터는 필수. 즉각 광채·수분 효과.',
        synergy: ['물광주사', '리쥬란힐러', '보톡스', '엑소좀'],
      },
    },
  },
  {
    id: 'mulkwang',
    name: '물광주사',
    category: '주사',
    skinLayer: 'dermis',
    description: '히알루론산+미백·영양 성분 수분광 주사. 즉각 수분·광채 효과.',
    baseIntervalDays: 28,
    seasons: {
      no_care: {
        label: '비추천',
        timesPerYear: 0,
        intervalDays: 0,
        note: '휴식기에는 시술을 쉬고 피부 회복에 집중하세요.',
      },
      maintain: {
        label: '3~4주 간격 (연 10~12회)',
        timesPerYear: 10,
        intervalDays: 28,
        note: '꾸준한 수분 관리로 피부 베이스 유지.',
      },
      boost: {
        label: '2주 간격 집중 (연 20회)',
        timesPerYear: 20,
        intervalDays: 14,
        note: '부스트 모드에는 물광주사를 모든 시술의 마무리로 활용.',
        synergy: ['스킨부스터', '리쥬란힐러', '엑소좀', '백옥주사'],
      },
      special: {
        label: '이벤트 D-3 최종 수분',
        timesPerYear: 24,
        intervalDays: 14,
        note: '이벤트 3일 전 물광으로 수분감·광채 최고조. 스킨부스터와 교체 사용.',
        synergy: ['스킨부스터', '엑소좀', '리쥬란힐러', '백옥주사'],
      },
    },
  },
  {
    id: 'exosome',
    name: '엑소좀',
    category: '주사',
    skinLayer: 'dermis',
    description: '줄기세포 유래 엑소좀. 피부 재생·항염 효과. 시술 후 회복에 탁월.',
    baseIntervalDays: 45,
    seasons: {
      no_care: {
        label: '비추천',
        timesPerYear: 0,
        intervalDays: 0,
        note: '휴식기에는 시술을 쉬고 피부 회복에 집중하세요.',
      },
      maintain: {
        label: '1~2개월 간격 (연 6~8회)',
        timesPerYear: 7,
        intervalDays: 45,
        note: '모든 리프팅·레이저 시술과 병행 시 회복 가속화.',
      },
      boost: {
        label: '1개월 간격 (연 10~12회)',
        timesPerYear: 10,
        intervalDays: 30,
        note: '부스트 모드에 모든 시술 직후 엑소좀 병행 강력 추천.',
        synergy: ['슈링크', '더블로', '리쥬란힐러', '스킨부스터'],
      },
      special: {
        label: '시술 후 반드시 병행',
        timesPerYear: 12,
        intervalDays: 28,
        note: '스페셜 모드 중 모든 고에너지 시술 이후 엑소좀으로 즉각 회복.',
        synergy: ['슈링크', '세르프', '리쥬란힐러', '물광주사'],
      },
    },
  },
  {
    id: 'baekok',
    name: '백옥주사',
    category: '주사',
    skinLayer: 'dermis',
    description: '글루타치온 기반 미백·항산화 주사. 피부 톤 개선 및 해독 효과.',
    baseIntervalDays: 14,
    seasons: {
      no_care: {
        label: '비추천',
        timesPerYear: 0,
        intervalDays: 0,
        note: '휴식기에는 시술을 쉬고 피부 회복에 집중하세요.',
      },
      maintain: {
        label: '2주 간격',
        timesPerYear: 24,
        intervalDays: 14,
        note: '꾸준한 피부 톤 관리.',
      },
      boost: {
        label: '주 1~2회 집중',
        timesPerYear: 52,
        intervalDays: 7,
        note: '부스트 모드 피부 톤 개선 필수. 물광주사와 교대 사용.',
        synergy: ['물광주사', '스킨부스터', '엑소좀'],
      },
      special: {
        label: '이벤트 D-14부터 주 2회',
        timesPerYear: 60,
        intervalDays: 3,
        note: '이벤트 2주 전부터 집중 미백. D-1 최종 투여.',
        synergy: ['물광주사', '스킨부스터', '신데렐라주사'],
      },
    },
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// 레이저 계열 (표피층)
// ─────────────────────────────────────────────────────────────────────────────

const laserTreatments: TreatmentSeasonData[] = [
  {
    id: 'picotoning',
    name: '피코토닝',
    category: '레이저',
    skinLayer: 'epidermis',
    description: '피코초 레이저 토닝. 색소·기미 개선, 모공 축소, 피부 톤 균일화.',
    baseIntervalDays: 21,
    seasons: {
      no_care: {
        label: '비추천',
        timesPerYear: 0,
        intervalDays: 0,
        note: '휴식기에는 시술을 쉬고 피부 회복에 집중하세요.',
      },
      maintain: {
        label: '3~4주 간격 (연 10~12회)',
        timesPerYear: 10,
        intervalDays: 28,
        note: '꾸준한 기미·색소 관리. 자외선 차단 필수.',
      },
      boost: {
        label: '2주 간격 집중 (연 18~20회)',
        timesPerYear: 18,
        intervalDays: 14,
        note: '집중 기미 개선. 엑셀V와 교대 사용으로 효과 극대화.',
        synergy: ['엑셀V레이저', '스킨부스터', '백옥주사'],
      },
      special: {
        label: '이벤트 D-21까지 주 1회',
        timesPerYear: 24,
        intervalDays: 7,
        note: '이벤트 3주 전까지 집중 후 D-21 이후 레이저 중단 + 수분 관리.',
        synergy: ['엑셀V레이저', '물광주사', '스킨부스터', '백옥주사'],
      },
    },
  },
  {
    id: 'excelv',
    name: '엑셀V레이저',
    category: '레이저',
    skinLayer: 'epidermis',
    description: '혈관·색소 레이저. 붉은기, 모세혈관, 기미, 잡티 동시 개선.',
    baseIntervalDays: 28,
    seasons: {
      no_care: {
        label: '비추천',
        timesPerYear: 0,
        intervalDays: 0,
        note: '휴식기에는 시술을 쉬고 피부 회복에 집중하세요.',
      },
      maintain: {
        label: '3~4주 간격 (연 10~12회)',
        timesPerYear: 10,
        intervalDays: 28,
        note: '혈관·색소 꾸준한 관리.',
      },
      boost: {
        label: '2~3주 간격 집중 (연 15~18회)',
        timesPerYear: 16,
        intervalDays: 21,
        note: '피부 톤 집중 개선. 피코토닝과 교대 사용.',
        synergy: ['피코토닝', '스킨부스터', '백옥주사'],
      },
      special: {
        label: '이벤트 D-28까지 집중',
        timesPerYear: 18,
        intervalDays: 14,
        note: '이벤트 4주 전까지 집중 관리. D-14 이후 레이저 중단.',
        synergy: ['피코토닝', '물광주사', '스킨부스터', '백옥주사'],
      },
    },
  },
  {
    id: 'aquapeel',
    name: '아쿠아필링',
    category: '스킨케어',
    skinLayer: 'epidermis',
    description: '수압 필링. 각질 제거 + 영양 수분 공급 동시 진행. 자극이 적음.',
    baseIntervalDays: 21,
    seasons: {
      no_care: {
        label: '비추천',
        timesPerYear: 0,
        intervalDays: 0,
        note: '휴식기에는 시술을 쉬고 피부 회복에 집중하세요.',
      },
      maintain: {
        label: '2주 간격 (연 20~24회)',
        timesPerYear: 22,
        intervalDays: 14,
        note: '기본 피부 관리로 주기적 시행.',
      },
      boost: {
        label: '주 1회 (연 40회)',
        timesPerYear: 40,
        intervalDays: 7,
        note: '고강도 시술 전 피부 준비 단계로 활용. 매주 관리.',
        synergy: ['피코토닝', '스킨부스터', '물광주사'],
      },
      special: {
        label: '이벤트 D-3 최종 케어',
        timesPerYear: 48,
        intervalDays: 7,
        note: '이벤트 3일 전 마지막 아쿠아필링. 즉각 피부 정돈 효과.',
        synergy: ['물광주사', '스킨부스터', '진정팩'],
      },
    },
  },
  {
    id: 'cryo',
    name: '크라이오테라피',
    category: '레이저',
    skinLayer: 'epidermis',
    description: '냉각 기반 피부 진정·홍조 개선. 예민성 피부 즉각 진정.',
    baseIntervalDays: 14,
    seasons: {
      no_care: {
        label: '비추천',
        timesPerYear: 0,
        intervalDays: 0,
        note: '휴식기에는 시술을 쉬고 피부 회복에 집중하세요.',
      },
      maintain: {
        label: '2주 간격 정기 관리',
        timesPerYear: 24,
        intervalDays: 14,
        note: '꾸준한 피부 진정·홍조 관리.',
      },
      boost: {
        label: '고강도 시술 후 병행',
        timesPerYear: 24,
        intervalDays: 14,
        note: '레이저·리프팅 후 진정 목적으로 병행. 부작용 최소화.',
        synergy: ['피코토닝', '엑셀V레이저', '스킨부스터'],
      },
      special: {
        label: '이벤트 D-1 최종 진정',
        timesPerYear: 24,
        intervalDays: 14,
        note: '이벤트 전날 크라이오로 피부 진정·붉은기 최소화.',
        synergy: ['진정팩', '스킨부스터', '아쿠아필링'],
      },
    },
  },
  {
    id: 'management',
    name: '피부 관리',
    category: '스킨케어',
    skinLayer: 'epidermis',
    description: '클리닉 피부 관리 (진정, 수분, 영양 팩 등). 기본 피부 케어.',
    baseIntervalDays: 14,
    seasons: {
      no_care: {
        label: '비추천',
        timesPerYear: 0,
        intervalDays: 0,
        note: '휴식기에는 시술을 쉬고 피부 회복에 집중하세요.',
      },
      maintain: {
        label: '2주 간격 (연 20~24회)',
        timesPerYear: 22,
        intervalDays: 14,
        note: '꾸준한 기본 피부 관리.',
      },
      boost: {
        label: '주 1회 (연 40회)',
        timesPerYear: 40,
        intervalDays: 7,
        note: '모든 시술 전후 기본 관리. 효과 유지에 필수.',
        synergy: ['아쿠아필링', '스킨부스터', '물광주사'],
      },
      special: {
        label: '이벤트 D-3 집중 관리',
        timesPerYear: 48,
        intervalDays: 7,
        note: '이벤트 3일 전 최종 피부 관리로 베이스 완성.',
        synergy: ['아쿠아필링', '물광주사', '진정팩'],
      },
    },
  },
  {
    id: 'jincheong-pack',
    name: '진정팩',
    category: '스킨케어',
    skinLayer: 'epidermis',
    description: '피부 진정·보습 팩. 시술 후 피부 안정화, 홍조 완화.',
    baseIntervalDays: 7,
    seasons: {
      no_care: {
        label: '비추천',
        timesPerYear: 0,
        intervalDays: 0,
        note: '휴식기에는 시술을 쉬고 피부 회복에 집중하세요.',
      },
      maintain: {
        label: '주 2회',
        timesPerYear: 96,
        intervalDays: 3,
        note: '꾸준한 피부 진정 유지.',
      },
      boost: {
        label: '모든 시술 후 병행',
        timesPerYear: 120,
        intervalDays: 3,
        note: '부스트 모드 고강도 시술 후 회복 필수템.',
        synergy: ['아쿠아필링', '크라이오테라피'],
      },
      special: {
        label: '이벤트 D-1 필수',
        timesPerYear: 120,
        intervalDays: 3,
        note: '이벤트 전날 진정팩으로 피부 안정화 마무리.',
        synergy: ['크라이오테라피', '스킨부스터'],
      },
    },
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// 전체 데이터 export
// ─────────────────────────────────────────────────────────────────────────────

export const ALL_TREATMENT_SEASON_DATA: TreatmentSeasonData[] = [
  ...liftingTreatments,
  ...botoxFillerTreatments,
  ...injectionTreatments,
  ...laserTreatments,
];

export const SEASON_META: Record<SeasonKey, { emoji: string; title: string; sub: string; color: string; bg: string; border: string }> = {
  no_care:  { emoji: '💤', title: 'Rest Mode',     sub: '휴식 모드',        color: 'text-stone-700',  bg: 'bg-stone-50',   border: 'border-stone-200' },
  maintain: { emoji: '💜', title: 'Maintain Mode', sub: '유지 모드',        color: 'text-indigo-700', bg: 'bg-indigo-50',  border: 'border-indigo-200' },
  boost:    { emoji: '🌹', title: 'Boost Mode',    sub: '관리 끌올 모드',  color: 'text-amber-700',  bg: 'bg-amber-50',   border: 'border-amber-200' },
  special:  { emoji: '🌸', title: 'Special Mode',  sub: '스페셜 모드',     color: 'text-purple-700', bg: 'bg-purple-50',  border: 'border-purple-200' },
};

export const CATEGORY_ORDER = ['리프팅', '보톡스/필러', '주사', '레이저', '스킨케어'] as const;
