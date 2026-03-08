export type SkinType = '건성' | '지성' | '복합성' | '민감성' | '중성';

export type SkinLayer = 'epidermis' | 'dermis' | 'subcutaneous';

export type BodyArea = 'face' | 'neck' | 'arm' | 'leg' | 'abdomen' | 'back' | 'chest' | 'hip';

export const SKIN_LAYER_LABELS: Record<SkinLayer, string> = {
  epidermis: '표피층',
  dermis: '진피층',
  subcutaneous: '피하조직',
};

export const SKIN_LAYER_DESCRIPTIONS: Record<SkinLayer, string> = {
  epidermis: '토닝 · 필링 · 제모',
  dermis: '리쥬란 · 보톡스 · 필러',
  subcutaneous: '리프팅 · 타이트닝',
};

export const BODY_AREA_LABELS: Record<BodyArea, string> = {
  face: '얼굴',
  neck: '목',
  arm: '팔',
  leg: '다리',
  abdomen: '복부',
  back: '등',
  chest: '가슴',
  hip: '엉덩이/힙',
};

export interface UserProfile {
  skinType: SkinType;
  birthDate: string; // yyyy-MM-dd
  concerns: string[];
  goals: string[];
  targetAreas: BodyArea[];
  regions: string[]; // 주요 활동 지역
}

export interface PointTransaction {
  id: string;
  date: string;
  type: 'charge' | 'use' | 'referral' | 'bonus';
  amount: number;
  description: string;
  balance: number;
}

export interface TreatmentPackage {
  id: string;
  name: string;
  type: 'session' | 'bundle' | 'point';
  totalSessions: number;
  usedSessions: number;
  skinLayer: SkinLayer;
  bodyArea: BodyArea;
  expiryDate: string;
  clinic: string;
}

export interface TreatmentRecord {
  id: string;
  date: string;
  packageId: string;
  treatmentName: string;
  skinLayer: SkinLayer;
  bodyArea: BodyArea;
  notes?: string;
  clinic: string;
}

export interface CalendarEvent {
  id: string;
  date: string;
  title: string;
  type: 'treatment' | 'reminder' | 'recommendation';
  skinLayer?: SkinLayer;
  bodyArea?: BodyArea;
}

// 시술 주기 추적
export interface TreatmentCycle {
  id: string;
  treatmentName: string;
  skinLayer: SkinLayer;
  bodyArea: BodyArea;
  cycleDays: number; // 권장 주기 (일)
  lastTreatmentDate: string;
  isCustomCycle: boolean;
  clinic: string;
  product?: string; // 제품명 (예: 제오민, 리쥬란HB 등)
  notes?: string;
}

// 기본 시술 주기 프리셋
export interface CyclePreset {
  treatmentName: string;
  skinLayer: SkinLayer;
  defaultCycleDays: number;
  description: string;
  product?: string;
}

export const CYCLE_PRESETS: CyclePreset[] = [
  // 표피층
  { treatmentName: '레이저 토닝', skinLayer: 'epidermis', defaultCycleDays: 14, description: '2주 간격 권장' },
  { treatmentName: '아쿠아필링', skinLayer: 'epidermis', defaultCycleDays: 28, description: '4주 간격 권장' },
  { treatmentName: '제모 레이저', skinLayer: 'epidermis', defaultCycleDays: 42, description: '6주 간격 권장' },
  // 진피층
  { treatmentName: '리쥬란', skinLayer: 'dermis', defaultCycleDays: 90, description: '3개월 간격 권장', product: '리쥬란HB' },
  { treatmentName: '보톡스', skinLayer: 'dermis', defaultCycleDays: 120, description: '4개월 효력', product: '보톡스' },
  { treatmentName: '보톡스 (제오민)', skinLayer: 'dermis', defaultCycleDays: 180, description: '6개월 효력', product: '제오민' },
  { treatmentName: '필러', skinLayer: 'dermis', defaultCycleDays: 365, description: '12개월 효력' },
  { treatmentName: '스킨보톡스', skinLayer: 'dermis', defaultCycleDays: 90, description: '3개월 간격 권장' },
  // 피하조직
  { treatmentName: '울쎄라', skinLayer: 'subcutaneous', defaultCycleDays: 365, description: '12개월 간격 권장' },
  { treatmentName: '슈링크', skinLayer: 'subcutaneous', defaultCycleDays: 180, description: '6개월 간격 권장' },
  { treatmentName: '인모드', skinLayer: 'subcutaneous', defaultCycleDays: 30, description: '4주 간격 (코스)' },
];