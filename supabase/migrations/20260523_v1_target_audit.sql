-- =====================================================================
-- Workstream B — clinic_brands v1 타깃 분류 + 히스토리 로그
-- =====================================================================
-- 목적:
--   1. v1 데이터 수집 타깃 브랜드 분류 컬럼 추가
--   2. 13개 미분류 브랜드 중 7개 active, 6개 excluded로 설정
--   3. 제외 사유를 영구 기록 (히스토리 로그)
-- 결정 근거: reports/overnight_workstream_b.md 의 A섹션 + 2026-05-23 오너 결정
-- =====================================================================

BEGIN;

-- ---------------------------------------------------------------------
-- 1. 컬럼 추가
-- ---------------------------------------------------------------------
ALTER TABLE public.clinic_brands
  ADD COLUMN IF NOT EXISTS v1_target_status   text NOT NULL DEFAULT 'candidate',
  ADD COLUMN IF NOT EXISTS v1_excluded_reason text;

-- ---------------------------------------------------------------------
-- 2. CHECK 제약
-- ---------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'clinic_brands_v1_target_status_check'
  ) THEN
    ALTER TABLE public.clinic_brands
      ADD CONSTRAINT clinic_brands_v1_target_status_check
      CHECK (v1_target_status IN ('candidate','active','excluded'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'clinic_brands_v1_excluded_reason_check'
  ) THEN
    ALTER TABLE public.clinic_brands
      ADD CONSTRAINT clinic_brands_v1_excluded_reason_check
      CHECK (
        v1_excluded_reason IS NULL
        OR v1_excluded_reason IN ('no_event_page','access_blocked','unreachable','domain_changed','other')
      );
  END IF;
END $$;

-- ---------------------------------------------------------------------
-- 3. ACTIVE (v1 타깃) — 12개 기존 URL 보유 + 7개 새로 살림 = 총 19개
-- ---------------------------------------------------------------------
-- 기존 event_page_url 있던 12개 브랜드
UPDATE public.clinic_brands
SET v1_target_status = 'active',
    v1_excluded_reason = NULL
WHERE event_page_url IS NOT NULL;

-- 새로 살림 4개 — 명확한 이벤트 페이지 발견
UPDATE public.clinic_brands
SET v1_target_status = 'active',
    v1_excluded_reason = NULL
WHERE slug IN ('upskin','beautylounce','skinchois','oracleclinic');

-- 새로 살림 3개 — 지점별 별도 도메인 (밴스 패턴)
UPDATE public.clinic_brands
SET v1_target_status = 'active',
    v1_excluded_reason = NULL
WHERE slug IN ('doctormellow','starskin','toxfill');

-- ---------------------------------------------------------------------
-- 4. EXCLUDED (v1 제외) — 6개
-- ---------------------------------------------------------------------
-- 이벤트 전용 페이지 없음 — 4개 (홈페이지 크롤 불가, 카톡 알림 등 다른 채널 필요)
UPDATE public.clinic_brands
SET v1_target_status = 'excluded',
    v1_excluded_reason = 'no_event_page'
WHERE slug IN ('cnpskin','ozheannetwork','beautyskin','philo');

-- 접근 불가 — 2개 (봇 차단·SSL 만료·도메인 리다이렉트)
UPDATE public.clinic_brands
SET v1_target_status = 'excluded',
    v1_excluded_reason = 'access_blocked'
WHERE slug IN ('mimimi','gowoonss');

-- ---------------------------------------------------------------------
-- 5. 인덱스
-- ---------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_clinic_brands_v1_target_status
  ON public.clinic_brands(v1_target_status);

-- ---------------------------------------------------------------------
-- 6. 코멘트 (의미 문서화)
-- ---------------------------------------------------------------------
COMMENT ON COLUMN public.clinic_brands.v1_target_status IS
  'BloomLog v1 데이터 수집 대상 분류: candidate(미분류), active(타깃), excluded(제외).';
COMMENT ON COLUMN public.clinic_brands.v1_excluded_reason IS
  '제외 사유: no_event_page(이벤트 전용 페이지 없음), access_blocked(403/SSL/리다이렉트로 차단), unreachable(도메인 도달 불가), domain_changed(도메인 변경), other.';

COMMIT;

-- =====================================================================
-- 적용 후 검증 쿼리 (실행 후 참고용)
-- =====================================================================
-- SELECT v1_target_status, v1_excluded_reason, COUNT(*) FROM clinic_brands
-- GROUP BY v1_target_status, v1_excluded_reason
-- ORDER BY v1_target_status;
--
-- 예상 결과:
--   active     | NULL                 | 19
--   excluded   | no_event_page        | 4
--   excluded   | access_blocked       | 2
