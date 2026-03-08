export type SkinType = '건성' | '지성' | '복합성' | '민감성' | '중성';

export type SkinLayer = 'epidermis' | 'dermis' | 'subcutaneous';

export type BodyArea = 'face' | 'neck' | 'arm' | 'leg' | 'abdomen' | 'back' | 'chest' | 'hip';

export const SKIN_LAYER_LABELS: Record<SkinLayer, string> = {
  epidermis: '표피층',
  dermis: '진피층',
  subcutaneous: '피하조직',
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
  age: number;
  concerns: string[];
  goals: string[];
  targetAreas: BodyArea[];
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
