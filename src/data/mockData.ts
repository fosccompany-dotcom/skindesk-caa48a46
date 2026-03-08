import { UserProfile, PointTransaction, TreatmentPackage, TreatmentRecord, CalendarEvent } from '@/types/skin';

export const mockProfile: UserProfile = {
  skinType: '복합성',
  age: 32,
  concerns: ['모공', '색소침착', '탄력저하'],
  goals: ['맑은 피부톤', '모공 축소', '탄력 개선'],
};

export const mockPoints: PointTransaction[] = [
  { id: '1', date: '2026-03-01', type: 'charge', amount: 2500000, description: '200만원 결제 → 250만원 충전', balance: 2500000 },
  { id: '2', date: '2026-03-03', type: 'use', amount: -150000, description: '레이저 토닝 시술', balance: 2350000 },
  { id: '3', date: '2026-03-05', type: 'referral', amount: 50000, description: '지인 소개 포인트 적립', balance: 2400000 },
  { id: '4', date: '2026-03-07', type: 'use', amount: -200000, description: '프리미엄 리프팅 시술', balance: 2200000 },
];

export const mockPackages: TreatmentPackage[] = [
  { id: 'p1', name: '베이직 관리 30회권', type: 'session', totalSessions: 30, usedSessions: 12, skinLayer: 'epidermis', expiryDate: '2026-12-31', clinic: '글로우 피부과' },
  { id: 'p2', name: '프리미엄 관리 10회권', type: 'session', totalSessions: 10, usedSessions: 3, skinLayer: 'dermis', expiryDate: '2026-09-30', clinic: '글로우 피부과' },
  { id: 'p3', name: '리프팅 2+1 패키지', type: 'bundle', totalSessions: 3, usedSessions: 1, skinLayer: 'subcutaneous', expiryDate: '2026-08-15', clinic: '에스테틱 피부과' },
];

export const mockRecords: TreatmentRecord[] = [
  { id: 'r1', date: '2026-03-03', packageId: 'p1', treatmentName: '레이저 토닝', skinLayer: 'epidermis', notes: '시술 후 약간의 홍조', clinic: '글로우 피부과' },
  { id: 'r2', date: '2026-02-25', packageId: 'p2', treatmentName: '프리미엄 리프팅', skinLayer: 'dermis', clinic: '글로우 피부과' },
  { id: 'r3', date: '2026-02-18', packageId: 'p1', treatmentName: '아쿠아필링', skinLayer: 'epidermis', clinic: '글로우 피부과' },
  { id: 'r4', date: '2026-02-10', packageId: 'p3', treatmentName: '울쎄라 리프팅', skinLayer: 'subcutaneous', notes: '첫 회차 완료', clinic: '에스테틱 피부과' },
];

export const mockEvents: CalendarEvent[] = [
  { id: 'e1', date: '2026-03-10', title: '레이저 토닝 예약', type: 'treatment', skinLayer: 'epidermis' },
  { id: 'e2', date: '2026-03-15', title: '프리미엄 리프팅 예약', type: 'treatment', skinLayer: 'dermis' },
  { id: 'e3', date: '2026-03-12', title: '자외선 차단제 재구매 시기', type: 'reminder' },
  { id: 'e4', date: '2026-03-20', title: '진피층 관리 추천 주기', type: 'recommendation', skinLayer: 'dermis' },
];

export const currentBalance = 2200000;
