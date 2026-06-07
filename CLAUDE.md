# Bloomlog — 유지보수 가이드

> **마지막 업데이트:** 2026-06-07 (코드베이스 전수 분석 기반 재작성)
> **제품명:** Bloomlog (사용자에게 보이는 정식 명칭. `SKINDESK`는 Lovable 내부 코드네임일 뿐 — 호스팅 URL·localStorage 키·내부 이벤트명에만 등장)
> **저장소:** https://github.com/fosccompany-dotcom/skindesk-caa48a46
> **도메인:** https://bloomlog.kr · **호스팅:** https://skindesk.lovable.app
> **Supabase project ID:** `gaharylmkilooukxnipk`

로컬 실행·셋업은 [`README.md`](./README.md) 참고. 이 문서는 **내부 아키텍처와 유지보수 규칙**에 집중합니다.

---

## 협업 규칙 (필수)

1. **코드 변경 전 한국어로 설명**하고 오너의 "OK"를 받은 후 진행
2. **지정된 파일 외 수정 금지** — 작업 범위를 명확히
3. 진단·계획 단계와 실행 단계를 분리
4. **`main` 직접 커밋·푸시 금지** — 반드시 새 브랜치 → PR (머지는 오너가 브라우저에서 처리)
5. 작업 시작 **전에** 브랜치 생성 (prefix 예: `bnivibe/claude/...`)
6. 저장되는 문서·주석은 일관된 언어로

> ⚠️ git 로컬 작성자 정보가 `fosccompany-dotcom / fosccompany@gmail.com`으로 설정돼 있을 수 있습니다. 커밋 작성자 규칙은 작업자(오너)의 워크스페이스 규칙을 우선합니다.

---

## 한눈에 보는 제품

피부·미용 시술을 받는 개인을 위한 **멀티 클리닉 통합 기록·주기 관리 앱**. 20~40대 여성 타깃.
경쟁(강남언니·굿닥)이 병원 마케팅 플랫폼이라면, Bloomlog는 **사용자 중심** 개인 관리 앱.

핵심 가치: 사용자가 쌓는 시술 이력 = 락인(lock-in) + 익명 통계 데이터 자산.

---

## ⭐ 가장 중요한 구조: 두 개의 도메인

코드베이스는 사실상 **두 시스템이 한 앱·한 DB에 공존**합니다. 이 경계를 이해하는 게 유지보수의 핵심입니다.

### 🟦 도메인 A — 개인 시술 기록 (사용자용, 원래 핵심)
사용자가 자기 시술/결제/포인트/주기/진단을 기록·관리.

- **테이블:** `treatment_records`, `treatment_packages`, `point_transactions`, `payment_records`, `treatment_cycles`, `clinic_balances`, `user_profiles`, `user_favorite_clinics`, `diagnosis_snapshots`, `reservations`
- **결제 모델:** [`src/lib/clinicPayments.ts`](src/lib/clinicPayments.ts) 상단 주석에 3단계 플로우가 정리돼 있음 — **수정 전 반드시 읽을 것**
  - 플로우 1: 현금/카드 → 포인트 충전 (`payment_records` + `point_transactions` + `clinic_balances`)
  - 플로우 2: 시술권 구매 → 포인트 차감만 (실결제 아님)
  - 플로우 3: 시술 진행 → 잔액 변동 없음 (`treatment_records` + `used_sessions++`)
- **5축 진단(P·O·I·H·A):** [`src/lib/skinDiagnosis.ts`](src/lib/skinDiagnosis.ts) (Baumann 피부유형 기반), 추천은 [`src/lib/skinRecommendation.ts`](src/lib/skinRecommendation.ts)

### 🟥 도메인 B — 클리닉 이벤트 카탈로그 ("Workstream B")
어드민이 카톡/SMS/배너 이미지를 **AI로 파싱**해 클리닉 이벤트·시술 가격 DB를 구축, 사용자에게 노출.

- **계층:** `clinic_brands` → `clinic_locations` → `clinic_events` → `clinic_treatments`
- **AI 파싱:** Edge Function `parse-clinic-event`가 Lovable AI Gateway(Gemini 2.5 Flash)로 구조화 추출
- **피드백 루프(정교함):** 어드민 반려/정정 → `parse_corrections` 기록 → 트리거가 `treatment_glossary`(브랜드별 정규화 사전)에 자동 누적 → 다음 파싱 프롬프트에 주입
- **사용자 노출:** [`src/pages/ClinicEvents.tsx`](src/pages/ClinicEvents.tsx)
- **검수 워크플로우:** `clinic_events.review_status`(pending/approved/rejected/expired) ↔ `is_published` 트리거 동기화. confidence ≥ 80 자동 승인.

---

## 5축 진단 시스템 (P·O·I·H·A)

| 축 | 의미 | 컬럼 |
|----|------|-------|
| P | Pigment (색소·미백) | `score_p` |
| O | Oil/Pore (유분·모공) | `score_o` |
| I | Inflammation (염증·여드름) | `score_i` |
| H | Hydration (수분) | `score_h` |
| A | Aging (노화·리프팅) | `score_a` |

각 0~10점, `user_profiles`에 저장. 스냅샷은 `diagnosis_snapshots`에 히스토리로 누적.
관련 페이지: [`SkinQuiz.tsx`](src/pages/SkinQuiz.tsx) → [`QuizResult.tsx`](src/pages/QuizResult.tsx) → [`SkinMatch.tsx`](src/pages/SkinMatch.tsx)

> `skin_tribe`는 deprecated (이전 분류 체계). 일부 잔재가 남아 있을 수 있음.

---

## 아키텍처 메모

### Provider 중첩 ([`src/App.tsx`](src/App.tsx))
`ErrorBoundary > QueryClient > Tooltip > Language > BrowserRouter > Auth > Season > Cycles > Records > ManagementSettings`

### 상태 관리 (2원화 — 주의)
- TanStack Query가 설치돼 있으나, 실제 데이터는 대부분 **Context + useState + 직접 supabase 호출**로 관리 ([`RecordsContext`](src/context/RecordsContext.tsx), [`CyclesContext`](src/context/CyclesContext.tsx))
- 컨텍스트 간 리프레시는 `window.dispatchEvent('skindesk:data-changed')` 커스텀 이벤트로 강제 (안티패턴이지만 동작함)
- **관리모드가 2개 공존 (혼동 주의):**
  | 시스템 | 위치 | 값 | 저장 |
  |--------|------|----|------|
  | `SeasonContext` (메인) | [`context/SeasonContext.tsx`](src/context/SeasonContext.tsx) | `no_care`·`maintain`·`boost`·`special` | Supabase |
  | `ManagementSettingsContext` (보조) | [`context/ManagementSettingsContext.tsx`](src/context/ManagementSettingsContext.tsx) | 부위별 `tight`·`maintain`·`none` | localStorage |

### 인증 / 권한
- `AuthContext` + `PrivateRoute`로 라우트 가드 (프리뷰 환경 예외 처리 포함)
- **어드민 RBAC 3단계:** owner / admin / reviewer
  - 클라이언트 1차: [`src/lib/adminAuth.ts`](src/lib/adminAuth.ts)의 이메일 화이트리스트
  - 서버 2차: `admin_users` 테이블 + RLS 함수 `is_owner()` / `is_admin()` / `is_reviewer_or_higher()`
  - 락아웃 방지 트리거(오너 자기 강등·삭제 불가)까지 구현됨
- 어드민 페이지: [`Admin.tsx`](src/pages/Admin.tsx), [`AdminEvents.tsx`](src/pages/AdminEvents.tsx), [`AdminUsers.tsx`](src/pages/AdminUsers.tsx) (모바일 max-width 제약 해제, 풀 데스크톱 폭)

### Edge Functions ([`supabase/functions/`](supabase/functions/))
| 함수 | 용도 | `verify_jwt` |
|------|------|--------------|
| `parse-treatment` | 개인 시술 기록 텍스트/이미지 파싱 | false (config.toml) |
| `parse-clinic-event` | 클리닉 이벤트 파싱 (도메인 B) | ⚠️ config.toml 미등록 (기본 true) |
| `search-clinic` | 클리닉 검색 | false |
| `delete-account` | 계정 삭제 | false |

---

## 알려진 기술 부채 / 주의사항

1. **테스트 공백** — 사실상 테스트 없음([`src/test/example.test.ts`](src/test/example.test.ts) 1개). 특히 **결제 플로우에 테스트 0** → 최우선 보강 대상
2. **git 위생** — Lovable 자동 커밋이 전부 `"Changes"` 메시지. 이력 추적 어려움
3. **config.toml** — ✅ 해소됨. `parse-clinic-event`를 `verify_jwt = true`로 명시 등록(어드민/내부 전용, service role로 RLS 우회 쓰기 → 익명 호출 차단). 후속: 함수 내부 `is_admin()` 검증 추가 권장
4. **AI 벤더 종속** — 파싱이 `LOVABLE_API_KEY` + Lovable AI Gateway에 종속
5. **하드코딩된 오너 식별자** — RBAC 마이그레이션·adminAuth에 특정 UUID/이메일(`fosccompany@gmail.com`) 박힘. 오너 이전 시 수정 필요
6. **대형 파일** — [`AddTreatmentModal.tsx`](src/components/AddTreatmentModal.tsx)(~1287줄), [`Profile.tsx`](src/pages/Profile.tsx)(~1219줄), [`ParseTreatmentModal.tsx`](src/components/ParseTreatmentModal.tsx)(~1199줄) — 분해 후보
7. **console.* 다수(~29개)** — 프로덕션 정리 대상
8. **deprecated 잔재** — `skin_tribe` 관련 코드 일부 잔존 가능
9. **`.env` git 추적 중** — 루트 `.env`가 커밋돼 있으나 내용은 **공개용 키 3개뿐**(`VITE_SUPABASE_PROJECT_ID`·`VITE_SUPABASE_URL`·anon `PUBLISHABLE_KEY`). 셋 다 클라이언트 번들에 어차피 노출되는 공개 값이라 **실질 비밀 없음**. Lovable 빌드가 커밋된 `.env`에 의존할 수 있어 추적 해제는 위험 대비 실익이 낮음 → **현행 유지 권장**. (service role 키는 절대 커밋 금지)

---

## DB 마이그레이션 이력 (요약)

`supabase/migrations/` — 시간순. 주요 분기점:
- `20260316*` — 초기 7개 테이블 + RLS (도메인 A)
- `20260510_stage1_diagnosis_schema` — 5축 진단 스키마 (score_p~a, diagnosis_snapshots, user_favorite_clinics)
- `20260522_workstream_b_events` ~ `20260524_correction_glossary` — **도메인 B 전체** (클리닉 이벤트 수집, RBAC, 시술 체계화, 파싱 피드백 루프)

> 마이그레이션 SQL은 코드와 함께 신뢰할 수 있는 1차 자료입니다. 데이터 모델이 헷갈리면 최신 마이그레이션부터 읽으세요.

---

## 건강 상태 (2026-06-07 기준)

- ✅ `tsc --noEmit` 통과
- ✅ 워킹 트리 clean
- ⚠️ 린트는 `bun run lint`(로컬 버전)로 실행 — `npx eslint`는 버전 충돌
- ❌ 테스트 커버리지 거의 없음

---
---

# 📜 이전 인수인계 로그 (아카이브)

> 아래는 **2026-05-11 기준 이전 작업자(비개발자 오너 + Claude Code)가 작성한 인수인계 로그**입니다.
> **원문의 구조와 항목은 그대로 보존**하되, 이후 진행 상황을 알 수 있도록 **완료 여부 표시(✅/🟨)와 "현행 메모"만 덧붙였습니다** (원래 항목을 지우지 않음).
> **현재의 정확한 구조는 위 본문을 기준**으로 하세요.

---

## 프로젝트 개요 (당시 기록)

- **앱명:** BloomLog (피부 시술 기록·주기 관리 앱)
- **스택:** React 18 + TypeScript + Vite + Tailwind CSS + shadcn/ui
- **백엔드:** Supabase (Auth, PostgreSQL, RLS)
- **라우터:** React Router DOM v6
- **Supabase project ID:** `gaharylmkilooukxnipk`

---

## 완료된 작업

### ✅ 2단계: 로그인 필수 진입 구현 (머지 완료)

**변경 파일:**
- `src/components/PrivateRoute.tsx` — 미인증 시 `/login` 리다이렉트
- `src/pages/Login.tsx` — OAuth redirectTo를 `window.location.origin`으로 수정
- `src/App.tsx` — `/login` 라우트 추가, AppStartLoginGate 제거

**프리뷰 환경 예외 처리:**
```ts
const isPreview =
  window.location.hostname.includes('preview--') ||
  window.location.hostname.includes('lovableproject.com');
// isPreview면 PrivateRoute 통과
```

---

### ✅ 3a단계: 죽은 모달·가드 코드 제거 (머지 완료)

**삭제된 파일:**
- `src/components/AppStartLoginGate.tsx`
- `src/components/LoginRequiredSheet.tsx`
- `src/hooks/useLoginGuard.ts`

**정리된 파일:**
- `src/components/BottomNav.tsx` — useLoginGuard, LoginRequiredSheet 제거
- `src/components/GlobalFAB.tsx` — 동일
- `src/pages/Index.tsx` — 동일
- `src/pages/CalendarPage.tsx` — 동일

---

### ✅ Stage 1: DB 스키마 마이그레이션 (SQL 파일 작성·머지 완료, **DB 적용 완료 2026-05-11**)

**커밋:** `94fab53 feat: add stage 1 diagnosis schema` → main 머지됨

**SQL 파일 위치:**
```
supabase/migrations/20260510_stage1_diagnosis_schema.sql
```

**SQL 내용 요약:**
| 변경 내용 | 비고 |
|-----------|------|
| `user_profiles`에 `score_p/o/i/h/a` (smallint, 0~10) 추가 | IF NOT EXISTS |
| `user_profiles`에 `diagnosis_updated_at` (timestamptz) 추가 | IF NOT EXISTS |
| `treatment_records`에 `axis_weights` (jsonb) 추가 | IF NOT EXISTS |
| `skin_tribe` 컬럼 값 전부 NULL로 초기화 | 컬럼 자체는 유지 |
| `current_season` 값 `reset`·`recovery` → `no_care`로 변환 | UPDATE문 |
| `diagnosis_snapshots` 테이블 신규 생성 + RLS | CREATE TABLE IF NOT EXISTS |
| `user_favorite_clinics` 테이블 신규 생성 + RLS | CREATE TABLE IF NOT EXISTS |

**✅ Supabase DB 적용 완료 (2026-05-11)**
- `diagnosis_snapshots`, `user_favorite_clinics` 테이블 생성 확인
- `user_profiles`에 score_p~score_a, diagnosis_updated_at 컬럼 추가 완료
- `treatment_records`에 axis_weights 컬럼 추가 완료
- skin_tribe 값 NULL 초기화, current_season reset·recovery → no_care 변환 완료

**types.ts 상태:** `src/integrations/supabase/types.ts`는 Codex가 이미 업데이트 완료 (score_p~score_a, diagnosis_snapshots, user_favorite_clinics 모두 반영됨)

---

## 현재 main 브랜치 상태 (당시 기록)

```
3a1ed1c  Merge pull request #2 from .../feature/stage1-diagnosis-schema
94fab53  feat: add stage 1 diagnosis schema
8216871  로고를 3배로 키웠습니다
```

`feature/login-required-entry` 브랜치: origin에 존재, main에 머지됨

---

## 현재 DB 스키마 (types.ts 기준, 당시 기록)

### `user_profiles` 주요 컬럼

```
id, name, email, birth_date, skin_type, skin_tribe (deprecated),
current_season (text: 'no_care'|'maintain'|'boost'|'special' — DB 적용 후),
score_p, score_o, score_i, score_h, score_a (0~10, DB 적용 후),
diagnosis_updated_at, bloom_stage, total_log_count, ...
```

### 5축 진단 시스템 (P·O·I·H·A)

| 축 | 의미 | 컬럼 |
|----|------|-------|
| P | Pigment (색소·미백) | score_p |
| O | Oil/Pore (유분·모공) | score_o |
| I | Inflammation (염증·여드름) | score_i |
| H | Hydration (수분) | score_h |
| A | Aging (노화·리프팅) | score_a |

### 관리 모드 시스템 (두 개 존재, 혼동 주의)

| 시스템 | 위치 | 값 | 용도 |
|--------|------|----|------|
| **SeasonContext** (메인) | `src/context/SeasonContext.tsx` | `no_care`·`maintain`·`boost`·`special`·`special` | 사용자가 설정하는 관리 단계, Supabase DB에 저장 |
| ManagementSettingsContext (보조) | `src/context/ManagementSettingsContext.tsx` | `tight`·`maintain`·`none` (body zone별) | 내부 주기 계산용, localStorage 저장 |

---

## 남은 작업 목록 (당시 기록)

### 🔴 즉시 필요 (다음 작업)

1. **SeasonContext.tsx 타입 업데이트** — ✅ **완료**
   - 현재: `'reset' | 'recovery' | 'maintain' | 'boost' | 'special'`
   - 변경 후: `'no_care' | 'maintain' | 'boost' | 'special'` (DB 적용 후 맞춰야 함)
   - 파일: `src/context/SeasonContext.tsx` line 4
   - 🔎 *현행 메모:* `SeasonContext.tsx`는 이미 `'no_care' | 'maintain' | 'boost' | 'special'`로 수정됨.

---

### 🟡 Stage 2: SkinQuiz 5축 퀴즈 재설계 — ✅ **완료**

> 🔎 *현행 메모:* `SkinQuiz.tsx`가 `skinTribeClassifier` 대신 `@/lib/skinDiagnosis`(5축) 사용으로 전환됨. 결과를 `score_p~score_a`에 저장하고 `diagnosis_snapshots`에 스냅샷 INSERT까지 구현됨.

**현재 상황:**
- `src/pages/SkinQuiz.tsx` — 현재 `skinTribeClassifier`를 사용하는 6~7문항 퀴즈
- `src/lib/skinTribeClassifier.ts` — skin_tribe 분류 로직 (deprecated 예정)
- 저장 로직: `quiz_completed_at`, `skin_tribe`, `skin_type`, `skin_goal` 저장

**목표:**
- 기존 퀴즈를 5축(P·O·I·H·A) 기반으로 재설계
- 퀴즈 결과를 `score_p~score_a`에 저장
- `diagnosis_snapshots`에 스냅샷 기록

---

### 🟡 Stage 3: skin_tribe 코드 제거 — ✅ **거의 완료**

> 🔎 *현행 메모:* `src/lib/skinTribeClassifier.ts` 삭제됨. 페이지·컴포넌트의 `skin_tribe` 코드 참조 제거됨. **단, 자동 생성 타입 `src/integrations/supabase/types.ts`에 3건 잔존** — DB 컬럼 `skin_tribe`가 deprecated 상태로 남아 있기 때문(컬럼 drop 시 정리됨). 아래 "삭제/정리 대상" 파일들(SkinMatch, SkinLayerBadge, SeasonRecommendation 등)은 다른 용도로 **파일 자체는 존속**하며 skin_tribe 참조만 빠진 상태.

**skin_tribe 참조 파일 (삭제/정리 대상):**
- `src/lib/skinTribeClassifier.ts` (전체 삭제)
- `src/pages/SkinQuiz.tsx` (import 제거)
- `src/pages/SkinMatch.tsx`
- `src/pages/QuizResult.tsx`
- `src/components/SkinLayerBadge.tsx`
- `src/components/SeasonRecommendation.tsx`
- `src/pages/Profile.tsx`

---

### 🟡 Stage 4: 5축 진단 결과 화면 — ✅ **완료**

> 🔎 *현행 메모:* `QuizResult.tsx`가 recharts `RadarChart`로 5축 점수를 시각화하고, `diagnosis_snapshots` 히스토리를 읽어 표시함.

- `src/pages/QuizResult.tsx` 재설계
- 레이더 차트 또는 바 차트로 5축 점수 시각화
- `diagnosis_snapshots` 히스토리 표시

---

### 🟡 Stage 5: 추천 엔진 — 🟨 **구현됨 (지속 고도화 여지)**

> 🔎 *현행 메모:* `src/lib/skinRecommendation.ts`(5축→시술 매핑)가 구현되어 `SkinMatch.tsx`에서 사용됨. `user_favorite_clinics`는 Profile·Treatments·훅 등에서 활용 중. 기본 추천 로직은 동작하며, 정교화는 계속 진행 가능.

- 5축 점수 기반 시술 추천
- `user_favorite_clinics` 활용
- `SeasonContext` 관리모드와 연동

---

## 주요 파일 구조 (원문 구조 + 현행 반영)

> 원문의 구조를 유지하되, 이후 변경분(삭제/추가)을 반영해 갱신함.

```
src/
├── App.tsx                          # 라우트 정의 (public: /login 등; private: 나머지)
├── components/
│   ├── PrivateRoute.tsx             # 인증 가드
│   ├── BottomNav.tsx                # 하단 네비게이션
│   ├── GlobalFAB.tsx                # 플로팅 버튼
│   ├── ParseTreatmentModal.tsx      # (신규) 시술 기록 AI 파싱 입력 모달
│   └── SkinDiagnosisOnboardingModal.tsx # (신규) 5축 진단 온보딩
├── context/
│   ├── AuthContext.tsx              # Supabase Auth
│   ├── SeasonContext.tsx            # 관리모드 (no_care/maintain/boost/special, DB 저장)
│   ├── ManagementSettingsContext.tsx # 내부 주기 계산용 (localStorage)
│   ├── CyclesContext.tsx            # 시술 주기 (DB + realtime)
│   └── RecordsContext.tsx          # (신규) 시술 기록 상태
├── pages/
│   ├── Login.tsx                    # 로그인 페이지 (Google/Kakao OAuth)
│   ├── SkinQuiz.tsx                 # 5축 퀴즈 (skinDiagnosis 기반)  ← 재설계 완료
│   ├── SkinMatch.tsx                # 퀴즈 결과 → 추천 매칭 (skinRecommendation)
│   ├── QuizResult.tsx               # 5축 진단 결과 (recharts 레이더차트)  ← 완료
│   ├── Profile.tsx                  # 프로필 설정
│   ├── ClinicEvents.tsx             # (신규) 클리닉 이벤트 노출 (도메인 B)
│   ├── Admin.tsx / AdminEvents.tsx / AdminUsers.tsx # (신규) 어드민/검수/RBAC
│   └── ... (Points, Packages, Treatments, Cycles, Calendar, Settings 등)
├── lib/
│   ├── skinDiagnosis.ts            # (신규) 5축 진단 로직  ← skinTribeClassifier 대체
│   ├── skinRecommendation.ts       # (신규) 5축 → 시술 추천
│   ├── clinicPayments.ts           # 결제 3단계 플로우 (상단 주석 필독)
│   └── adminAuth.ts                # (신규) 어드민 이메일 화이트리스트
│       # ⚠️ skinTribeClassifier.ts 는 삭제됨 (Stage 3)
└── integrations/supabase/
    └── types.ts                     # DB 타입 (자동 생성, Stage 1 + Workstream B 반영)

supabase/
├── functions/                       # (신규) Edge Functions
│   ├── parse-treatment/             #   개인 시술 기록 파싱
│   ├── parse-clinic-event/          #   클리닉 이벤트 파싱 (도메인 B)
│   ├── search-clinic/ · delete-account/
└── migrations/
    ├── 20260510_stage1_diagnosis_schema.sql      # 5축 스키마 (DB 적용 완료)
    └── 20260522~0524_*.sql                        # (신규) Workstream B: 이벤트·RBAC·glossary
```

---

## 알려진 기술 이슈 (당시 기록)

### P0 버그 (로그인 필수화로 사실상 해소)
- 비로그인 사용자가 퀴즈 완료 시 결과가 저장되지 않는 문제
- `SkinQuiz.tsx:116` `if (!user) return` 조기 반환
- 로그인 필수 진입 구현으로 실제 영향 없어짐

### SeasonContext 타입 불일치 (DB 적용 후 수정 필요) — ✅ 해소됨
- DB에서는 `reset`·`recovery` 값이 `no_care`로 변환됨
- 코드에서는 아직 `'reset' | 'recovery'` 타입을 포함 중
- 수정 파일: `src/context/SeasonContext.tsx` line 4
- 🔎 *현행 메모:* 타입이 `'no_care' | 'maintain' | 'boost' | 'special'`로 수정 완료됨.

### git 작성자 정보
- 로컬 저장소에만 적용됨
- 새 환경에서 작업 시: `git config --local user.name "fosccompany-dotcom"` / `git config --local user.email "fosccompany@gmail.com"`
