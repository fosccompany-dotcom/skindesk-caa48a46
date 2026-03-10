# SKINDESK 개발 로그

## 목표
**Android v1.0 앱스토어 등록**
목표 출시일: 2026년 4월 7일

---

## 2026-03-10

### 완료
- Login.tsx: 언어 선택기(한/영/중), 상단 이미지 삭제, SKINDESK 태그라인
- 구글/카카오 OAuth redirectTo → Supabase 콜백 URL 분리
- Signup.tsx redirectTo → skindesk.lovable.app?onboarding=true
- Points.tsx 결제 내역 실 데이터 로직 전면 교체 (밴스=포인트충전, 타의원=시술결제)
- 밴스 미금 실결제 금액 수정 (₩2,000,000 / 증정 ₩860,000 메모)
- Supabase DB 7개 테이블 생성 + RLS 정책 적용
  - treatment_records, treatment_packages, point_transactions
  - payment_records, treatment_cycles, user_profiles, clinic_balances
- AuthContext 신규 (유저 세션 전역 상태)
- PrivateRoute 신규 (비로그인 → /login 리다이렉트)
- App.tsx 인증 가드 전체 라우트 적용
- RecordsContext → Supabase 실시간 연동 (user_id 기반)
- Points 탭명 → "남은 시술 & 포인트" (병원별 잔여 시술권 + 잔액)
- 개인정보처리방침 작성 + GitHub Pages 배포
  - URL: https://fosccompany-dotcom.github.io/skindesk/privacy-policy.html
- 익명·통계 데이터 활용 조항 추가 (제7조의2)

### 커밋 이력
| SHA | 내용 |
|-----|------|
| 52a5e247 | Login — 언어선택기, 이미지삭제, SKINDESK 태그라인 |
| 290d0e99 | 카카오 redirectTo → Supabase 콜백 |
| 94426c8a | 구글/카카오 OAuth 핸들러 분리 |
| 2f35fb5c | Signup redirectTo 수정 |
| 6073b364 | mockData — PaymentRecord 타입 + 실 결제 데이터 |
| 7a8e8461 | Points — 실 결제 로직 교체 |
| ffe3cd75 | 밴스 미금 실결제 2,000,000 수정 |
| fb29e369 | AuthContext 신규 |
| 51eb0166 | PrivateRoute 신규 |
| 6627be5a | App.tsx 인증 가드 |
| 05e4847b | RecordsContext Supabase 연동 |
| 791ab72e | Points — 남은 시술 & 포인트 탭 |
| 881f947c | 개인정보처리방침 제7조의2 추가 |

---

## 다음 할 것
- [ ] Google Play Console 계정 등록 ($25)
- [ ] 병원 등록 기능 (카카오 로컬 API 연동)
- [ ] 버그 픽스 + 기능 검증
- [ ] mockData → Supabase 전체 연동 (기능 확정 후)
- [ ] Capacitor Android 빌드
