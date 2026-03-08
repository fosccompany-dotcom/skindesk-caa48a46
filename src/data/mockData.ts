import { UserProfile, PointTransaction, TreatmentPackage, TreatmentRecord, CalendarEvent, TreatmentCycle } from '@/types/skin';

export const mockProfile: UserProfile = {
  skinType: '복합성',
  birthDate: '1994-05-12',
  concerns: ['모공', '색소침착', '탄력저하', '제모', '셀룰라이트'],
  goals: ['맑은 피부톤', '모공 축소', '탄력 개선', '바디라인 정리'],
  targetAreas: ['face', 'arm', 'leg', 'abdomen'],
  regions: ['서울특별시 강남구', '서울특별시 서초구'],
};

export const mockPoints: PointTransaction[] = [
  { id: '1', date: '2026-03-01', type: 'charge', amount: 2500000, description: '200만원 결제 → 250만원 충전', balance: 2500000 },
  { id: '2', date: '2026-03-03', type: 'use', amount: -150000, description: '레이저 토닝 (얼굴)', balance: 2350000 },
  { id: '3', date: '2026-03-05', type: 'referral', amount: 50000, description: '지인 소개 포인트 적립', balance: 2400000 },
  { id: '4', date: '2026-03-07', type: 'use', amount: -200000, description: '프리미엄 리프팅 (얼굴)', balance: 2200000 },
  { id: '5', date: '2026-03-08', type: 'use', amount: -300000, description: '제모 레이저 (팔+다리)', balance: 1900000 },
];

export const mockPackages: TreatmentPackage[] = [
  { id: 'p1', name: '베이직 관리 30회권', type: 'session', totalSessions: 30, usedSessions: 12, skinLayer: 'epidermis', bodyArea: 'face', expiryDate: '2026-12-31', clinic: '글로우 피부과' },
  { id: 'p2', name: '프리미엄 관리 10회권', type: 'session', totalSessions: 10, usedSessions: 3, skinLayer: 'dermis', bodyArea: 'face', expiryDate: '2026-09-30', clinic: '글로우 피부과' },
  { id: 'p3', name: '리프팅 2+1 패키지', type: 'bundle', totalSessions: 3, usedSessions: 1, skinLayer: 'subcutaneous', bodyArea: 'face', expiryDate: '2026-08-15', clinic: '에스테틱 피부과' },
  { id: 'p4', name: '팔 제모 5회권', type: 'session', totalSessions: 5, usedSessions: 2, skinLayer: 'epidermis', bodyArea: 'arm', expiryDate: '2026-11-30', clinic: '글로우 피부과' },
  { id: 'p5', name: '다리 제모 5회권', type: 'session', totalSessions: 5, usedSessions: 2, skinLayer: 'epidermis', bodyArea: 'leg', expiryDate: '2026-11-30', clinic: '글로우 피부과' },
  { id: 'p6', name: '복부 바디 타이트닝 10회권', type: 'session', totalSessions: 10, usedSessions: 4, skinLayer: 'subcutaneous', bodyArea: 'abdomen', expiryDate: '2027-01-31', clinic: '에스테틱 피부과' },
  { id: 'p7', name: '등 여드름 관리 8회권', type: 'session', totalSessions: 8, usedSessions: 3, skinLayer: 'dermis', bodyArea: 'back', expiryDate: '2026-10-15', clinic: '글로우 피부과' },
];

export const mockRecords: TreatmentRecord[] = [
  { id: 'r1', date: '2026-03-03', packageId: 'p1', treatmentName: '레이저 토닝', skinLayer: 'epidermis', bodyArea: 'face', notes: '시술 후 약간의 홍조', clinic: '글로우 피부과' },
  { id: 'r2', date: '2026-02-25', packageId: 'p2', treatmentName: '프리미엄 리프팅', skinLayer: 'dermis', bodyArea: 'face', clinic: '글로우 피부과' },
  { id: 'r3', date: '2026-02-18', packageId: 'p1', treatmentName: '아쿠아필링', skinLayer: 'epidermis', bodyArea: 'face', clinic: '글로우 피부과' },
  { id: 'r4', date: '2026-02-10', packageId: 'p3', treatmentName: '울쎄라 리프팅', skinLayer: 'subcutaneous', bodyArea: 'face', notes: '첫 회차 완료', clinic: '에스테틱 피부과' },
  { id: 'r5', date: '2026-03-08', packageId: 'p4', treatmentName: '알렉산드라이트 제모', skinLayer: 'epidermis', bodyArea: 'arm', clinic: '글로우 피부과' },
  { id: 'r6', date: '2026-03-08', packageId: 'p5', treatmentName: '알렉산드라이트 제모', skinLayer: 'epidermis', bodyArea: 'leg', clinic: '글로우 피부과' },
  { id: 'r7', date: '2026-03-01', packageId: 'p6', treatmentName: '바디 타이트닝', skinLayer: 'subcutaneous', bodyArea: 'abdomen', notes: '복부 중심 시술', clinic: '에스테틱 피부과' },
  { id: 'r8', date: '2026-02-28', packageId: 'p7', treatmentName: '등 여드름 필링', skinLayer: 'dermis', bodyArea: 'back', clinic: '글로우 피부과' },
];

export const mockCycles: TreatmentCycle[] = [
  // 표피층
  { id: 'c1', treatmentName: '레이저 토닝', skinLayer: 'epidermis', bodyArea: 'face', cycleDays: 14, lastTreatmentDate: '2026-03-03', isCustomCycle: false, clinic: '글로우 피부과' },
  { id: 'c2', treatmentName: '제모 레이저', skinLayer: 'epidermis', bodyArea: 'arm', cycleDays: 42, lastTreatmentDate: '2026-03-08', isCustomCycle: false, clinic: '글로우 피부과' },
  { id: 'c3', treatmentName: '제모 레이저', skinLayer: 'epidermis', bodyArea: 'leg', cycleDays: 42, lastTreatmentDate: '2026-03-08', isCustomCycle: false, clinic: '글로우 피부과' },
  // 진피층
  { id: 'c4', treatmentName: '리쥬란', skinLayer: 'dermis', bodyArea: 'face', cycleDays: 90, lastTreatmentDate: '2026-01-15', isCustomCycle: false, clinic: '글로우 피부과', product: '리쥬란HB' },
  { id: 'c5', treatmentName: '보톡스', skinLayer: 'dermis', bodyArea: 'face', cycleDays: 180, lastTreatmentDate: '2025-12-20', isCustomCycle: true, clinic: '에스테틱 피부과', product: '제오민', notes: '턱 보톡스' },
  { id: 'c6', treatmentName: '스킨보톡스', skinLayer: 'dermis', bodyArea: 'face', cycleDays: 90, lastTreatmentDate: '2026-02-01', isCustomCycle: false, clinic: '글로우 피부과' },
  // 피하조직
  { id: 'c7', treatmentName: '울쎄라', skinLayer: 'subcutaneous', bodyArea: 'face', cycleDays: 365, lastTreatmentDate: '2026-02-10', isCustomCycle: false, clinic: '에스테틱 피부과' },
  { id: 'c8', treatmentName: '인모드', skinLayer: 'subcutaneous', bodyArea: 'abdomen', cycleDays: 30, lastTreatmentDate: '2026-03-01', isCustomCycle: false, clinic: '에스테틱 피부과' },
];

export const mockEvents: CalendarEvent[] = [
  { id: 'e1', date: '2026-03-10', title: '레이저 토닝 예약', type: 'treatment', skinLayer: 'epidermis', bodyArea: 'face' },
  { id: 'e2', date: '2026-03-15', title: '프리미엄 리프팅 예약', type: 'treatment', skinLayer: 'dermis', bodyArea: 'face' },
  { id: 'e3', date: '2026-03-12', title: '자외선 차단제 재구매 시기', type: 'reminder' },
  { id: 'e4', date: '2026-03-20', title: '진피층 관리 추천 주기', type: 'recommendation', skinLayer: 'dermis', bodyArea: 'face' },
  { id: 'e5', date: '2026-03-14', title: '팔 제모 예약', type: 'treatment', skinLayer: 'epidermis', bodyArea: 'arm' },
  { id: 'e6', date: '2026-03-14', title: '다리 제모 예약', type: 'treatment', skinLayer: 'epidermis', bodyArea: 'leg' },
  { id: 'e7', date: '2026-03-18', title: '복부 바디 타이트닝', type: 'treatment', skinLayer: 'subcutaneous', bodyArea: 'abdomen' },
  { id: 'e8', date: '2026-03-22', title: '등 여드름 관리 추천', type: 'recommendation', skinLayer: 'dermis', bodyArea: 'back' },
];

export const currentBalance = 1900000;