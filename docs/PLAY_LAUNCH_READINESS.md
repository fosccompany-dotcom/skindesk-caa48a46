# Bloomlog — Google Play 출시 준비 체크리스트

> **작성:** 2026-07-21 (M5, pre-launch review) · **appId:** `io.bloomlog.app` · **도메인:** bloomlog.kr
> **범위:** Capacitor(Android) 패키징 + Google Play 정책(Data Safety / 계정삭제 / 권한 / 개인정보) 준비.
> 보안 항목은 [`SECURITY_REVIEW.md`](./SECURITY_REVIEW.md) 참조. 이 문서는 **출시 게이트**에 집중.
> 마커: ✅ 완료 · 🔧 코드/문서로 처리가능 · 👤 오너 결정/실행 필요 · ⚠️ 리스크/불일치

---

## 0. 요약 — 출시 전 반드시 닫아야 하는 것

| 우선 | 항목 | 상태 |
|---|---|---|
| 1 | 엣지함수 보안 수정 **배포** (PR `bnivibe/claude/prelaunch-security`) | 👤 머지+재배포 |
| 2 | 핵심 테이블 RLS 고정 마이그레이션 **적용** | 👤 프로덕션 적용 |
| 3 | ⚠️ **targetSdk 34 → 35/36 상향** (Capacitor 7 경로) — 미해결 시 등록 거부 | 👤 결정+작업 |
| 4 | 서명 키스토어 생성 + AAB 빌드 (`android/` ✅생성완료) | 👤 키스토어 |
| 5 | **계정삭제 웹 URL** + 실제 보관정책 고지 | 🔧/👤 (아래 §5 불일치) |
| 6 | **Data Safety 양식** (건강·재정·오디오·이미지 + 제3자 AI 공유) | 👤 콘솔 입력 |
| 7 | 개인정보처리방침 ↔ 실제 삭제동작 **정합화** | ⚠️👤 결정 |
| 8 | 마이크(`RECORD_AUDIO`) 권한 ✅선언완료 / 런타임 동작 실기기 확인 | 🔧 |

---

## 1. Android 패키징 (Capacitor)

- **툴체인(M5):** JDK 22, Android SDK `~/Library/Android/sdk`, Capacitor CLI 6.2.1. ✅ 스캐폴딩 가능.
- ✅ **JDK (확인됨):** 기본 `java`가 JDK 22라 Gradle 8.2.1이 실패(`Unsupported class file major version 66`). M5에 **JDK 17(temurin-17.0.15)·21 설치돼 있음** → Android 빌드 시 `export JAVA_HOME=~/Library/Java/JavaVirtualMachines/temurin-17.0.15/Contents/Home`. 이 JDK로 `cap sync` **성공 확인**. JDK 경로는 머신마다 다르므로 저장소에 커밋하지 말고, 필요하면 **사용자 전역** `~/.gradle/gradle.properties`(비커밋)에 `org.gradle.java.home=`으로 고정.
- ✅ **`android/` 생성 완료** (2026-07-21, JDK17로 sync 검증). 재생성/재동기화:
  ```bash
  npm run build                 # dist 생성 (Capacitor webDir)
  JAVA_HOME=~/Library/Java/JavaVirtualMachines/temurin-17.0.15/Contents/Home \
    npx cap sync android        # 플러그인/웹자산 동기화 (add는 이미 완료)
  ```
- ⚠️ **Target API — 현재 값으로는 등록 거부 가능 (블로커):** 생성된 `android/variables.gradle`이 `compileSdkVersion 34 / targetSdkVersion 34` (Capacitor 6 기본). Google Play 신규 등록 기준은 **2025-08-31부터 API 35**, **2026-08-31부터 API 36**. 오늘(2026-07) 기준 **34는 미달**이며, 출시 시점이 8월을 넘기면 36이 필요.
  - 단순히 숫자만 35/36으로 올리면 **AGP 8.2.1이 해당 compileSdk를 지원하지 않아 빌드 실패** 가능 → **Capacitor 7 업그레이드**(AGP/Gradle 동반 상향)가 정석 경로.
  - 👤 Play Console의 현행 요건을 확인 후 타깃 결정 → 그에 맞춰 Capacitor 업그레이드 계획 필요. **AAB 빌드 전에 반드시 해결.**
- **cleartext:** `capacitor.config.ts`가 `androidScheme: 'https'` ✅. 별도 http 호출 없음(모든 백엔드 https). `usesCleartextTraffic`는 false 유지.
- **버전:** `android/app/build.gradle`의 `versionCode`(정수, 매 출시 증가)·`versionName`(예: "1.0.0") 설정. 👤 최초값 결정.

## 2. 앱 서명 / Play App Signing 👤

- **업로드 키스토어는 비밀** — 저장소/Drive/동기화 경로에 **절대 커밋 금지**(사용자 규칙). 생성 머신에 로컬 보관, 별도 안전백업.
  ```bash
  keytool -genkey -v -keystore bloomlog-upload.keystore \
    -alias bloomlog -keyalg RSA -keysize 2048 -validity 10000
  ```
- `android/keystore.properties`(gitignore 대상)로 참조, `build.gradle` `signingConfigs` 연결.
- Play App Signing 사용 권장(구글이 앱서명키 관리, 업로드키만 보관). 분실 대비.

## 3. 권한 (Permissions)

앱이 실제로 쓰는 민감 권한은 **마이크 1개뿐**:

| 권한 | 근거 | 처리 |
|---|---|---|
| `RECORD_AUDIO` | STT 녹음 (`ParseTreatmentModal` `getUserMedia({audio:true})`) | 🔧 Manifest 선언 + WebView `onPermissionRequest` 처리 + 런타임 요청 |
| `INTERNET` | 기본(백엔드 호출) | ✅ 자동 |
| ~~CAMERA/저장소~~ | 이미지 입력은 `<input type=file accept=image/*>` = 시스템 사진선택기 | ❌ 불필요 |

- Data Safety와 **일관**되게: 마이크 오디오는 STT 목적, 기기외 전송(제3자 AI) → §4에 반영.

## 4. Data Safety 양식 (Play Console) 👤 — 실제 스키마 기반 초안

> 부정확 선언은 정책위반. 아래는 코드/스키마 근거 초안 — 콘솔 입력 시 검증할 것.

**수집·전송하는 데이터:**
| 카테고리 | 항목 | 근거 | 제3자 공유 |
|---|---|---|---|
| 개인 식별 | 이름, 이메일 | `user_profiles`, OAuth(Google/Kakao) | Supabase(처리자) |
| 건강 | 시술 이력, 피부진단(5축), 관심/목표 | `treatment_records`, `user_profiles` | 파싱 시 Gemini(Lovable) |
| 재정 | 결제/포인트/잔액 이력 | `payment_records`,`point_transactions`,`clinic_balances` | Supabase(처리자) |
| 사진 | 영수증·카톡 스크린샷(파싱 입력) | `parse-treatment` 입력 | **Gemini(Lovable AI)로 전송** |
| 오디오 | 음성 녹음(STT 입력) | `transcribe-audio` 입력 | **OpenAI STT(Lovable AI)로 전송** |
| 앱 활동 | 앱 내 기록/설정 | 여러 테이블 | Supabase(처리자) |

- ⚠️ **제3자 AI 공유 반드시 선언:** 이미지·오디오·시술텍스트가 파싱/STT를 위해 Lovable AI Gateway 경유로 **Google Gemini·OpenAI**에 전송됨. 저장은 안 해도(“ephemeral”) **전송/공유**는 발생 → Data Safety "shared" 또는 "processed ephemerally"로 정확히 표기.
- 제3자 목록: Supabase(DB/인증), Lovable(호스팅+AI 게이트웨이), Google(Gemini 파싱), OpenAI(STT), Kakao(클리닉 검색 — **검색어만** 전송, 사용자 PII 아님).
- 암호화(전송중 TLS) ✅, 삭제요청 수단 제공 ✅(아래 §5).

## 5. 계정 삭제 (Play 필수) — ⚠️ 정책·구현 불일치

- **앱 내 삭제:** `Settings` → `delete-account` 엣지함수 존재 ✅.
- **Play 요구:** 계정 생성 앱은 **앱 외부(웹)에서도 삭제 요청 가능한 공개 URL** 필요. 현재 `/privacy`에 `tech@82edit.com` 이메일 안내 있음 — 전용 페이지(`bloomlog.kr/delete-account`) 또는 privacy 내 명시 섹션 권장.
- ⚠️ **불일치(정합화 필요):**
  - 개인정보처리방침(`src/pages/Privacy.tsx`): "회원 탈퇴 시 **즉시 삭제**", "**30일** 유예 후 완전삭제".
  - 실제 `delete-account` 코드: 데이터 **익명화**(user_id→익명 UUID) + `payment_records`는 **6개월 보관**(`retain_until` 마커) + auth 유저만 즉시 삭제.
  - → 세무/전자상거래법상 결제기록 보관은 정당할 수 있으나, **고지문과 코드가 달라** Play/PIPA 리스크. **결정 필요:** (a) 방침을 실제 보관정책(6개월)으로 수정 / (b) 코드를 방침(즉시/30일)에 맞춤 / (c) 둘 다 명시(“결제기록은 법정보관 N개월”).
- 삭제 시 무엇이 삭제/보관/익명화되는지 **표로 공개**해야 Data Safety 삭제항목과 정합.

## 6. 개인정보처리방침 / 콘텐츠등급 / 대상연령

- **개인정보처리방침:** ✅ 존재(`/privacy`, KO/EN). 게시 URL 확인(`bloomlog.kr/privacy`). §5 정합화 후 최종화.
- **콘텐츠 등급 설문:** 👤 콘솔에서 작성(뷰티/의료인접, 폭력·성적요소 없음 → 전연령 예상).
- **대상 연령/가족정책:** 20~40대 성인 타깃. **아동 대상 아님** 명확히(민감 건강데이터 → 13세 미만 배제 권장).
- **건강앱 정책:** 미용·시술 **기록** 앱(진단·치료 주장 아님)임을 스토어 설명에 명확히. 의료기기/의학적 조언으로 오인될 문구 지양.

## 7. 스토어 리스팅 자산 (비보안, 패키징) 👤

- [ ] 앱 아이콘(512×512), 피처 그래픽(1024×500)
- [ ] 스크린샷(폰 최소 2장), 짧은/긴 설명
- [ ] 개인정보처리방침 URL, 카테고리(건강/뷰티), 연락처
- [ ] 데이터 안전 양식 제출(§4), 콘텐츠 등급(§6)

---

## 부록 — 출시 순서(권장)

1. PR#(보안) 머지 → 엣지함수 재배포 검증(익명 호출 401 확인) → RLS 마이그레이션 적용 후 anon 프로브 재실행(전부 0행).
2. §5 삭제정책 정합화 결정 → 방침/코드/삭제안내 페이지 확정.
3. `android/` 생성·권한·서명 → 내부테스트 트랙 업로드.
4. Data Safety·콘텐츠등급·리스팅 완성 → 비공개 테스트 → 프로덕션.
