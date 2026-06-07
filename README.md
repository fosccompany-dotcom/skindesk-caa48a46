# Bloomlog

> **Your Personal Skin Coordinator** — 피부·바디 시술 기록과 주기를 한 곳에서 관리하는 개인용 앱.

피부과·미용 클리닉을 정기적으로 이용하는 사용자가 **여러 병원에 흩어진 시술 기록·시술권·포인트·결제 내역·시술 주기**를 통합 관리합니다. 5축(P·O·I·H·A) 피부 진단과 클리닉 이벤트 정보 제공 기능을 포함합니다.

- **제품명:** Bloomlog (사용자에게 보이는 정식 명칭)
- **도메인:** https://bloomlog.kr (단, 인앱 개인정보처리방침 링크는 `bloomlog.io/privacy`로 다름 — 통일 검토 필요)
- **배포(호스팅):** https://skindesk.lovable.app
- **모바일:** Capacitor 기반 Android 앱 (`io.bloomlog.app`)

> ℹ️ **`SKINDESK`는 Lovable 내부 프로젝트 코드네임**일 뿐, 사용자에게 노출되지 않습니다 (호스팅 URL·localStorage 키 접두사·내부 이벤트명에만 등장). 실제 제품 이름은 **Bloomlog**입니다.

---

## 기술 스택

| 영역 | 사용 기술 |
|------|-----------|
| 프론트엔드 | React 18 · TypeScript · Vite |
| 스타일 | Tailwind CSS · shadcn/ui (Radix) |
| 라우팅 | React Router DOM v6 |
| 서버 상태 | TanStack Query (일부) + Context API |
| 백엔드 | Supabase (Auth · PostgreSQL · RLS · Edge Functions) |
| AI 파싱 | Lovable AI Gateway (Gemini 2.5 Flash) |
| 모바일 | Capacitor (Android) |
| 패키지 매니저 | Bun (`bun.lockb`) — npm도 가능 |
| 배포 | Lovable |

---

## 로컬 개발 환경 설정

### 1. 사전 요구사항
- [Bun](https://bun.sh) (권장) 또는 Node.js 18+
- Supabase 프로젝트 접근 권한 (project ID: `gaharylmkilooukxnipk`)

### 2. 의존성 설치
```sh
bun install      # 또는 npm install
```

### 3. 환경 변수
프로젝트 루트에 `.env` 파일이 필요합니다 (Supabase 연결용):

```sh
VITE_SUPABASE_PROJECT_ID=<your-project-id>
VITE_SUPABASE_URL=<your-supabase-url>
VITE_SUPABASE_PUBLISHABLE_KEY=<your-anon-key>
```

> ⚠️ `.env`는 git에 커밋하지 마세요. `VITE_` 접두사 변수는 클라이언트 번들에 포함되므로 **anon(publishable) 키만** 사용하고, service role 키는 절대 넣지 않습니다.

### 4. 개발 서버 실행
```sh
bun dev          # http://localhost:8080
```

---

## 주요 스크립트

| 명령 | 설명 |
|------|------|
| `bun dev` | 개발 서버 (포트 8080, HMR) |
| `bun run build` | 프로덕션 빌드 |
| `bun run build:dev` | 개발 모드 빌드 |
| `bun run preview` | 빌드 결과 미리보기 |
| `bun run lint` | ESLint 실행 |
| `bun test` | 테스트 실행 (Vitest) |
| `bun run test:watch` | 테스트 watch 모드 |

> 💡 `npx eslint`로 직접 실행하면 글로벌 eslint 버전과 충돌할 수 있으니 **`bun run lint`(로컬 버전)** 를 사용하세요.

---

## 프로젝트 구조

```
src/
├── App.tsx              # 라우트 정의 + Provider 중첩
├── pages/               # 화면 단위 컴포넌트 (Index, Profile, Treatments, Admin 등)
├── components/          # 재사용 컴포넌트 (모달, 네비 등) + ui/ (shadcn)
├── context/             # 전역 상태 (Auth, Records, Cycles, Season, ManagementSettings)
├── hooks/               # 커스텀 훅 (useFavoriteClinics, useClinicEvents 등)
├── lib/                 # 도메인 로직 (clinicPayments, skinDiagnosis, adminAuth 등)
├── data/                # 정적 데이터 (시술 카탈로그·주기 데이터)
├── i18n/                # 다국어 (한/영/중)
├── integrations/supabase/  # Supabase 클라이언트 + 자동생성 타입
└── types/               # 공용 타입 정의

supabase/
├── functions/           # Edge Functions (parse-treatment, parse-clinic-event, search-clinic, delete-account)
└── migrations/          # DB 스키마 마이그레이션 (SQL)
```

내부 아키텍처·데이터 모델·작업 규칙은 [`CLAUDE.md`](./CLAUDE.md)를 참고하세요.

---

## 배포

Lovable을 통해 배포됩니다. GitHub에 푸시된 변경은 Lovable에 반영되며, 반대로 Lovable에서 편집한 내용도 이 저장소에 자동 커밋됩니다 (자동 커밋 메시지는 보통 `"Changes"`).

Android 빌드는 Capacitor를 사용합니다:
```sh
bun run build
npx cap sync android
npx cap open android
```
