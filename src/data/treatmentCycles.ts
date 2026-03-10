// src/data/treatmentCycles.ts
// 밴스의원 실제 시술 기준 권장 주기 데이터 (샷수별 세분화)

export type ManagementLevel = 'tight' | 'maintain' | 'none';

export const MANAGEMENT_LEVEL_LABELS: Record<ManagementLevel, string> = {
  tight: '💪 타이트한 관리',
  maintain: '🔵 유지 관리',
  none: '⚫ 관리 안함',
};

export const MANAGEMENT_LEVEL_DESC: Record<ManagementLevel, string> = {
  tight: '짧은 주기 — 최상의 컨디션 유지',
  maintain: '표준 주기 — 효과 유지에 충분',
  none: '주기 알림 없음',
};

export type BodyZone = 'face' | 'neck' | 'arms_legs' | 'body';

export const BODY_ZONES: { id: BodyZone; label: string; emoji: string; desc: string }[] = [
  { id: 'face', label: '얼굴', emoji: '✨', desc: '리프팅·보톡스·부스터·피부관리' },
  { id: 'neck', label: '목·쇄골', emoji: '💎', desc: '목 리프팅·넥라인 관리' },
  { id: 'arms_legs', label: '팔·다리', emoji: '💪', desc: '제모·바디 리프팅' },
  { id: 'body', label: '복부·바디', emoji: '🔥', desc: '지방분해·제모·바디관리' },
];

export interface CycleInterval {
  shots?: number;   // null/undefined = 샷수 무관
  tight: number;    // days (타이트 관리)
  maintain: number; // days (유지 관리)
}

export interface TreatmentCycleConfig {
  treatmentId: string;
  zone: BodyZone;
  onetime?: boolean;   // true = 1회성 (알람 없음)
  subscription?: boolean; // 무제한권 (제모 등)
  intervals: CycleInterval[];
}

// ─── 시술별 권장 주기 데이터 ──────────────────────────────────────

export const TREATMENT_CYCLES: TreatmentCycleConfig[] = [

  // ── 레이저 리프팅 ─────────────────────────────────
  // 슈링크 유니버스: HIFU 중강도, 샷수별 효과 2~6개월
  {
    treatmentId: 'shrink',
    zone: 'face',
    intervals: [
      { shots: 100, tight: 60,  maintain: 75  }, // 부분 1~2.5개월
      { shots: 200, tight: 75,  maintain: 100 },
      { shots: 300, tight: 90,  maintain: 120 }, // 3~4개월 (임상 기준)
      { shots: 400, tight: 105, maintain: 135 },
      { shots: 500, tight: 112, maintain: 150 },
      { shots: 600, tight: 120, maintain: 180 }, // 4~6개월 (임상 기준)
    ],
  },
  // 세르프: 듀얼 RF, 써마지 대비 유지 6~12개월
  {
    treatmentId: 'serf',
    zone: 'face',
    intervals: [
      { shots: 100, tight: 90,  maintain: 150 },
      { shots: 200, tight: 120, maintain: 180 },
      { shots: 300, tight: 180, maintain: 270 }, // 6~9개월 (강남언니 임상)
      { shots: 400, tight: 180, maintain: 270 },
      { shots: 500, tight: 180, maintain: 300 },
      { shots: 600, tight: 180, maintain: 365 }, // 6~12개월 (세르프 전문 자료)
    ],
  },
  // 울쎄라: HIFU 고강도, 권장 6개월~1년
  {
    treatmentId: 'ulthera',
    zone: 'face',
    intervals: [
      { shots: 100, tight: 120, maintain: 180 },
      { shots: 200, tight: 150, maintain: 240 },
      { shots: 300, tight: 180, maintain: 270 }, // 6~9개월
      { shots: 400, tight: 180, maintain: 300 },
      { shots: 500, tight: 180, maintain: 330 },
      { shots: 600, tight: 180, maintain: 365 }, // 6~12개월 (닥터나우 권장)
    ],
  },
  // 울쎄라 피프라임: 최고강도, 효과 최장 1~2년
  {
    treatmentId: 'ulthera_fp',
    zone: 'face',
    intervals: [
      { shots: 300, tight: 270, maintain: 365 },
      { shots: 400, tight: 270, maintain: 456 },
      { shots: 500, tight: 300, maintain: 456 },
      { shots: 600, tight: 270, maintain: 548 }, // 9개월~18개월
    ],
  },
  // 써마지 FLX: RF 고강도, 300/600샷 (밴스 기준)
  {
    treatmentId: 'thermage',
    zone: 'face',
    intervals: [
      { shots: 300, tight: 180, maintain: 270 }, // 6~9개월
      { shots: 600, tight: 270, maintain: 365 }, // 9~12개월 (보스피부과 임상)
    ],
  },
  // 덴서티: RF 고강도, 세르프 유사
  {
    treatmentId: 'density',
    zone: 'face',
    intervals: [{ tight: 180, maintain: 365 }],
  },
  // 온다: 극초단파, 중강도
  {
    treatmentId: 'onda',
    zone: 'face',
    intervals: [{ tight: 90, maintain: 180 }],
  },
  // 인모드: RF 고강도
  {
    treatmentId: 'inmode',
    zone: 'face',
    intervals: [{ tight: 180, maintain: 365 }],
  },
  // 올리지오: 슈링크 계열 유사
  {
    treatmentId: 'oligio',
    zone: 'face',
    intervals: [{ tight: 90, maintain: 180 }],
  },

  // ── 보톡스/윤곽주사 ─────────────────────────────
  { treatmentId: 'botox_kr',     zone: 'face', intervals: [{ tight: 90,  maintain: 120 }] }, // 국산: 3~4개월
  { treatmentId: 'botox_core',   zone: 'face', intervals: [{ tight: 120, maintain: 180 }] }, // 코어톡스: 4~6개월
  { treatmentId: 'botox_xeomin', zone: 'face', intervals: [{ tight: 120, maintain: 180 }] }, // 제오민: 4~6개월
  { treatmentId: 'botox_alg',    zone: 'face', intervals: [{ tight: 120, maintain: 180 }] }, // 엘러간: 4~6개월
  { treatmentId: 'contour',      zone: 'face', intervals: [{ tight: 120, maintain: 180 }] }, // 윤곽: 4~6개월

  // ── 필러/실리프팅 ─────────────────────────────
  { treatmentId: 'filler_kr',  zone: 'face', intervals: [{ tight: 180, maintain: 365 }] },
  { treatmentId: 'filler_imp', zone: 'face', intervals: [{ tight: 270, maintain: 548 }] }, // 수입필러: 9~18개월
  { treatmentId: 'filler_chin',zone: 'face', intervals: [{ tight: 180, maintain: 365 }] },
  { treatmentId: 'filler_lip', zone: 'face', intervals: [{ tight: 180, maintain: 365 }] },
  { treatmentId: 'filler_sp',  zone: 'face', intervals: [{ tight: 180, maintain: 365 }] },
  { treatmentId: 'thread',     zone: 'face', intervals: [{ tight: 180, maintain: 365 }] }, // 실리프팅(PDO): 6~12개월

  // ── 스킨부스터 ─────────────────────────────
  { treatmentId: 'skinvive',  zone: 'face', intervals: [{ tight: 60, maintain: 90  }] },
  { treatmentId: 'rejuran',   zone: 'face', intervals: [{ tight: 30, maintain: 60  }] }, // 리쥬란: 초기 1개월×3회 → 유지 1~2개월
  { treatmentId: 'juvelook',  zone: 'face', intervals: [{ tight: 30, maintain: 60  }] },
  { treatmentId: 'mihee',     zone: 'face', intervals: [{ tight: 30, maintain: 60  }] },
  { treatmentId: 'radiesse',  zone: 'face', intervals: [{ tight: 60, maintain: 90  }] }, // 레디어스: 볼륨 남으면 2~3개월
  { treatmentId: 'revive',    zone: 'face', intervals: [{ tight: 60, maintain: 90  }] },
  { treatmentId: 'oneday_b',  zone: 'face', intervals: [{ tight: 30, maintain: 60  }] },
  { treatmentId: 'vanslan',   zone: 'face', intervals: [{ tight: 30, maintain: 60  }] }, // 밴스란힐러
  { treatmentId: 'lilied',    zone: 'face', intervals: [{ tight: 30, maintain: 60  }] },
  { treatmentId: 'potenza',   zone: 'face', intervals: [{ tight: 30, maintain: 60  }] },
  { treatmentId: 'mulgwang',  zone: 'face', intervals: [{ tight: 30, maintain: 60  }] },
  { treatmentId: 'colaster',  zone: 'face', intervals: [{ tight: 30, maintain: 60  }] },

  // ── 피부관리 패키지 (Basic/Premium) ──────────
  ...([
    'b_scaling','b_aquapeel','b_vitamin','b_cryo','b_led','b_ionzyme',
    'b_cinder','b_white','b_placenta','b_vitiv',
    'p_larafil','p_placenta','p_blackhead','p_blackpeel','p_yespeel',
    'p_scinder','p_swhite','p_arginine','p_water','p_extract','p_pinkpeel',
    'peeling',
  ] as string[]).map(id => ({
    treatmentId: id,
    zone: 'face' as BodyZone,
    intervals: [{ tight: 14, maintain: 28 }], // 2주/4주
  })),

  // ── 미백/기미/색소 ─────────────────────────────
  { treatmentId: 'excelv',     zone: 'face', intervals: [{ tight: 60, maintain: 90  }] },
  { treatmentId: 'picotoning', zone: 'face', intervals: [{ tight: 14, maintain: 28  }] },
  { treatmentId: 'whitetone',  zone: 'face', intervals: [{ tight: 14, maintain: 28  }] },
  { treatmentId: 'lipat',      zone: 'face', onetime: true, intervals: [] }, // 1회성

  // ── 여드름/점제거 ─────────────────────────────
  { treatmentId: 'mole',         zone: 'face', onetime: true, intervals: [] }, // 1회성
  { treatmentId: 'acne_tx',      zone: 'face', intervals: [{ tight: 28, maintain: 56  }] },
  { treatmentId: 'potenza_face', zone: 'face', intervals: [{ tight: 30, maintain: 60  }] },
  { treatmentId: 'kapri',        zone: 'face', intervals: [{ tight: 28, maintain: 56  }] },

  // ── 지방분해주사 ─────────────────────────────
  { treatmentId: 'fat1',  zone: 'face',  intervals: [{ tight: 14, maintain: 28 }] },
  { treatmentId: 'fat2',  zone: 'face',  intervals: [{ tight: 14, maintain: 28 }] },
  { treatmentId: 'fat_f', zone: 'face',  intervals: [{ tight: 14, maintain: 28 }] },

  // ── 제모 (무제한권) ─────────────────────────────
  { treatmentId: 'gentle_m',  zone: 'arms_legs', subscription: true, intervals: [] },
  { treatmentId: 'gentle_f',  zone: 'arms_legs', subscription: true, intervals: [] },
  { treatmentId: 'apogee_m',  zone: 'arms_legs', subscription: true, intervals: [] },
  { treatmentId: 'apogee_f',  zone: 'arms_legs', subscription: true, intervals: [] },

  // ── 수액/줄기세포 ─────────────────────────────
  { treatmentId: 'iv_drip',  zone: 'body', intervals: [{ tight: 7,  maintain: 14  }] },
  { treatmentId: 'stemcell', zone: 'face', intervals: [{ tight: 90, maintain: 180 }] },
];

// ─── 유틸 함수 ─────────────────────────────────────────────────

/** 시술 + 샷수 + 관리 레벨로 권장 일수 계산 */
export function getCycleDays(
  treatmentId: string,
  shots: number | null,
  level: ManagementLevel
): number | null {
  if (level === 'none') return null;
  const config = TREATMENT_CYCLES.find(c => c.treatmentId === treatmentId);
  if (!config || config.onetime || config.subscription || config.intervals.length === 0) return null;

  let interval: CycleInterval;
  if (shots != null && config.intervals.some(i => i.shots != null)) {
    // 가장 가까운 샷수 구간 선택
    const shotList = config.intervals.filter(i => i.shots != null);
    interval = shotList.reduce((prev, curr) =>
      Math.abs((curr.shots ?? 0) - shots) < Math.abs((prev.shots ?? 0) - shots) ? curr : prev
    );
  } else {
    interval = config.intervals[0];
  }
  return level === 'tight' ? interval.tight : interval.maintain;
}

/** 다음 시술 권장일 계산 */
export function getNextDate(
  lastDate: string,
  treatmentId: string,
  shots: number | null,
  level: ManagementLevel
): Date | null {
  const days = getCycleDays(treatmentId, shots, level);
  if (days == null) return null;
  const d = new Date(lastDate);
  d.setDate(d.getDate() + days);
  return d;
}

/** D-day 계산 (음수 = 초과) */
export function getDDay(targetDate: Date): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(targetDate);
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}
