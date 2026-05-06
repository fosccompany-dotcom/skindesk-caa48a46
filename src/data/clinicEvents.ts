// 이달의 클리닉 이벤트 (mock data)
// clinicId는 src/constants/clinicPresets.ts 의 id 또는 사용자가 즐겨찾기한 병원명과 매칭

export interface ClinicEvent {
  id: string;
  clinicId: string;       // CLINIC_PRESETS.id 와 매칭
  clinicLabel: string;    // 표시용 병원명
  title: string;          // 이벤트 제목
  description?: string;
  originalPrice?: string;
  price: string;
  discount?: string;      // 예: "40%"
  category?: string;      // 시술 카테고리
  validUntil?: string;    // YYYY-MM-DD
  badge?: 'HOT' | 'NEW' | 'BEST' | 'EVENT';
}

// 이번 달 기준 mock 이벤트
export const CLINIC_EVENTS: ClinicEvent[] = [
  // 밴스 미금
  { id: 'e1', clinicId: 'vans_migeum', clinicLabel: '밴스 미금', title: '리쥬란HB+ 1cc 체험', price: '49,000원', originalPrice: '90,000원', discount: '45%', category: '스킨부스터', validUntil: '2026-05-31', badge: 'HOT' },
  { id: 'e2', clinicId: 'vans_migeum', clinicLabel: '밴스 미금', title: '울쎄라 300샷', price: '450,000원', originalPrice: '700,000원', discount: '35%', category: '리프팅', validUntil: '2026-05-31', badge: 'BEST' },
  { id: 'e3', clinicId: 'vans_migeum', clinicLabel: '밴스 미금', title: '제오민 보톡스 100u', price: '99,000원', originalPrice: '180,000원', discount: '45%', category: '보톡스', validUntil: '2026-05-31' },

  // 밴스의원
  { id: 'e4', clinicId: 'vans', clinicLabel: '밴스의원', title: '슈링크 유니버스 300샷', price: '199,000원', originalPrice: '350,000원', discount: '43%', category: '리프팅', validUntil: '2026-05-31', badge: 'HOT' },
  { id: 'e5', clinicId: 'vans', clinicLabel: '밴스의원', title: '쥬베룩 1cc', price: '89,000원', originalPrice: '150,000원', discount: '40%', category: '스킨부스터', validUntil: '2026-05-31' },

  // 밴스 구로
  { id: 'e6', clinicId: 'vans_guro', clinicLabel: '밴스 구로', title: '레이저 토닝 1회 체험', price: '19,900원', originalPrice: '50,000원', discount: '60%', category: '레이저토닝', validUntil: '2026-05-31', badge: 'NEW' },
  { id: 'e7', clinicId: 'vans_guro', clinicLabel: '밴스 구로', title: '엘란쎄 필러 1cc', price: '299,000원', originalPrice: '500,000원', discount: '40%', category: '필러', validUntil: '2026-05-31' },

  // 뷰티라운지 판교
  { id: 'e8', clinicId: 'beautylounce', clinicLabel: '뷰티라운지 판교', title: '인모드 FX+포마 패키지', price: '350,000원', originalPrice: '600,000원', discount: '41%', category: '리프팅', validUntil: '2026-05-31', badge: 'BEST' },
  { id: 'e9', clinicId: 'beautylounce', clinicLabel: '뷰티라운지 판교', title: '쥬베룩 볼륨 2cc', price: '180,000원', originalPrice: '300,000원', discount: '40%', category: '스킨부스터', validUntil: '2026-05-31' },

  // 필로의원
  { id: 'e10', clinicId: 'philo', clinicLabel: '필로의원', title: '실루엣 소프트 8가닥', price: '690,000원', originalPrice: '1,200,000원', discount: '42%', category: '실리프팅', validUntil: '2026-05-31', badge: 'HOT' },
  { id: 'e11', clinicId: 'philo', clinicLabel: '필로의원', title: '물톡스 + 리쥬란', price: '129,000원', originalPrice: '230,000원', discount: '43%', category: '복합시술', validUntil: '2026-05-31' },

  // 톡스앤필
  { id: 'e12', clinicId: 'toxfill', clinicLabel: '톡스앤필', title: '뉴로녹스 사각턱 100u', price: '79,000원', originalPrice: '150,000원', discount: '47%', category: '보톡스', validUntil: '2026-05-31', badge: 'EVENT' },
  { id: 'e13', clinicId: 'toxfill', clinicLabel: '톡스앤필', title: '쥬베덤 볼루마 1cc', price: '390,000원', originalPrice: '650,000원', discount: '40%', category: '필러', validUntil: '2026-05-31' },
];

export function getEventsByClinicIds(clinicIds: string[]): ClinicEvent[] {
  if (!clinicIds.length) return [];
  return CLINIC_EVENTS.filter(e => clinicIds.includes(e.clinicId));
}
