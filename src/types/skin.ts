export type SkinType = '건성' | '지성' | '복합성' | '민감성' | '중성';

export type SkinLayer = 'epidermis' | 'dermis' | 'subcutaneous';

export const SKIN_LAYER_LABELS: Record<SkinLayer, string> = {
  epidermis: '표피층',
  dermis: '진피층',
  subcutaneous: '피하조직',
};

export interface UserProfile {
  skinType: SkinType;
  age: number;
  concerns: string[];
  goals: string[];
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
  expiryDate: string;
  clinic: string;
}

export interface TreatmentRecord {
  id: string;
  date: string;
  packageId: string;
  treatmentName: string;
  skinLayer: SkinLayer;
  notes?: string;
  clinic: string;
}

export interface CalendarEvent {
  id: string;
  date: string;
  title: string;
  type: 'treatment' | 'reminder' | 'recommendation';
  skinLayer?: SkinLayer;
}
