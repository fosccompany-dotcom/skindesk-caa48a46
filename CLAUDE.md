# BloomLog — Claude Code 작업 인수인계 로그

> **마지막 업데이트:** 2026-05-11  
> **작업자:** 비개발자 오너와 Claude Code 협업  
> **저장소:** https://github.com/fosccompany-dotcom/skindesk-caa48a46  
> **배포 URL:** https://skindesk.lovable.app

---

## 협업 규칙 (필수)

1. **코드 변경 전 반드시 한국어로 설명**하고 오너의 "OK" 답변을 받은 후 진행
2. **지정된 파일 외 절대 수정 금지**
3. 진단·계획 단계와 실행 단계를 명확히 분리
4. 커밋 시 작성자 정보: `name=fosccompany-dotcom / email=fosccompany@gmail.com` (로컬 config)

---

## 프로젝트 개요

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

## 현재 main 브랜치 상태

```
3a1ed1c  Merge pull request #2 from .../feature/stage1-diagnosis-schema
94fab53  feat: add stage 1 diagnosis schema
8216871  로고를 3배로 키웠습니다
```

`feature/login-required-entry` 브랜치: origin에 존재, main에 머지됨

---

## 현재 DB 스키마 (types.ts 기준)

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

## 남은 작업 목록

### 🔴 즉시 필요 (다음 작업)

1. **SeasonContext.tsx 타입 업데이트**
   - 현재: `'reset' | 'recovery' | 'maintain' | 'boost' | 'special'`
   - 변경 후: `'no_care' | 'maintain' | 'boost' | 'special'` (DB 적용 후 맞춰야 함)
   - 파일: `src/context/SeasonContext.tsx` line 4

---

### 🟡 Stage 2: SkinQuiz 5축 퀴즈 재설계

**현재 상황:**
- `src/pages/SkinQuiz.tsx` — 현재 `skinTribeClassifier`를 사용하는 6~7문항 퀴즈
- `src/lib/skinTribeClassifier.ts` — skin_tribe 분류 로직 (deprecated 예정)
- 저장 로직: `quiz_completed_at`, `skin_tribe`, `skin_type`, `skin_goal` 저장

**목표:**
- 기존 퀴즈를 5축(P·O·I·H·A) 기반으로 재설계
- 퀴즈 결과를 `score_p~score_a`에 저장
- `diagnosis_snapshots`에 스냅샷 기록

---

### 🟡 Stage 3: skin_tribe 코드 제거

**skin_tribe 참조 파일 (삭제/정리 대상):**
- `src/lib/skinTribeClassifier.ts` (전체 삭제)
- `src/pages/SkinQuiz.tsx` (import 제거)
- `src/pages/SkinMatch.tsx`
- `src/pages/QuizResult.tsx`
- `src/components/SkinLayerBadge.tsx`
- `src/components/SeasonRecommendation.tsx`
- `src/pages/Profile.tsx`

---

### 🟡 Stage 4: 5축 진단 결과 화면

- `src/pages/QuizResult.tsx` 재설계
- 레이더 차트 또는 바 차트로 5축 점수 시각화
- `diagnosis_snapshots` 히스토리 표시

---

### 🟡 Stage 5: 추천 엔진

- 5축 점수 기반 시술 추천
- `user_favorite_clinics` 활용
- `SeasonContext` 관리모드와 연동

---

## 주요 파일 구조

```
src/
├── App.tsx                          # 라우트 정의 (public: /login; private: 나머지)
├── components/
│   ├── PrivateRoute.tsx             # 인증 가드
│   ├── BottomNav.tsx                # 하단 네비게이션
│   └── GlobalFAB.tsx                # 플로팅 버튼
├── context/
│   ├── AuthContext.tsx              # Supabase Auth
│   ├── SeasonContext.tsx            # 관리모드 (5단계, DB 저장)
│   ├── ManagementSettingsContext.tsx # 내부 주기 계산용 (localStorage)
│   └── CyclesContext.tsx
├── pages/
│   ├── Login.tsx                    # 로그인 페이지 (Google/Kakao OAuth)
│   ├── SkinQuiz.tsx                 # 피부 퀴즈 (5축 재설계 예정)
│   ├── SkinMatch.tsx                # 퀴즈 결과 → 매칭
│   ├── QuizResult.tsx               # 진단 결과 화면
│   └── Profile.tsx                  # 프로필 설정
├── lib/
│   └── skinTribeClassifier.ts       # ⚠️ deprecated 예정
└── integrations/supabase/
    └── types.ts                     # DB 타입 (Stage 1 반영 완료)

supabase/
└── migrations/
    ├── 20260329101150_...sql        # RLS 정책 (마지막 적용된 마이그레이션)
    └── 20260510_stage1_diagnosis_schema.sql  # ⚠️ DB 미적용
```

---

## 알려진 기술 이슈

### P0 버그 (로그인 필수화로 사실상 해소)
- 비로그인 사용자가 퀴즈 완료 시 결과가 저장되지 않는 문제
- `SkinQuiz.tsx:116` `if (!user) return` 조기 반환
- 로그인 필수 진입 구현으로 실제 영향 없어짐

### SeasonContext 타입 불일치 (DB 적용 후 수정 필요)
- DB에서는 `reset`·`recovery` 값이 `no_care`로 변환됨
- 코드에서는 아직 `'reset' | 'recovery'` 타입을 포함 중
- 수정 파일: `src/context/SeasonContext.tsx` line 4

### git 작성자 정보
- 로컬 저장소에만 적용됨
- 새 환경에서 작업 시: `git config --local user.name "fosccompany-dotcom"` / `git config --local user.email "fosccompany@gmail.com"`
