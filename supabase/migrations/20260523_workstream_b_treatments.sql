-- =====================================================================
-- Workstream B — Clinic Treatments 시술 단위 체계화 (Stage 3)
-- 목적: 캠페인(clinic_events) 안의 시술을 개별 row로 분리, 정확한 분류·가격·조합·횟수 표현
-- =====================================================================
-- 변경 요약:
--   1. clinic_treatments에 6개 컬럼 추가 (패키지·번들·조합·조건·캠페인 링크)
--   2. event_id FK → clinic_events.id (ON DELETE SET NULL)
--   3. 인덱스
-- =====================================================================

BEGIN;

-- ---------------------------------------------------------------------
-- 1. 신규 컬럼
-- ---------------------------------------------------------------------
ALTER TABLE public.clinic_treatments
  ADD COLUMN IF NOT EXISTS event_id      uuid,
  ADD COLUMN IF NOT EXISTS session_count integer,
  ADD COLUMN IF NOT EXISTS is_unlimited  boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS bundle_size   integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS combo_items   text[],
  ADD COLUMN IF NOT EXISTS conditions    text;

-- ---------------------------------------------------------------------
-- 2. event_id FK (트랜잭션 내에서 컬럼 추가 후 FK 추가)
-- ---------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'clinic_treatments_event_id_fkey'
  ) THEN
    ALTER TABLE public.clinic_treatments
      ADD CONSTRAINT clinic_treatments_event_id_fkey
      FOREIGN KEY (event_id) REFERENCES public.clinic_events(id)
      ON DELETE SET NULL;
  END IF;
END $$;

-- ---------------------------------------------------------------------
-- 3. CHECK 제약: session_count > 0 또는 is_unlimited=true
-- ---------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'clinic_treatments_session_count_check'
  ) THEN
    ALTER TABLE public.clinic_treatments
      ADD CONSTRAINT clinic_treatments_session_count_check
      CHECK (
        session_count IS NULL
        OR session_count > 0
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'clinic_treatments_bundle_size_check'
  ) THEN
    ALTER TABLE public.clinic_treatments
      ADD CONSTRAINT clinic_treatments_bundle_size_check
      CHECK (bundle_size >= 1);
  END IF;
END $$;

-- ---------------------------------------------------------------------
-- 4. 인덱스
-- ---------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_clinic_treatments_event_id
  ON public.clinic_treatments(event_id)
  WHERE event_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_clinic_treatments_category_loc
  ON public.clinic_treatments(category, location_id, price_krw);

-- ---------------------------------------------------------------------
-- 5. 컬럼 코멘트
-- ---------------------------------------------------------------------
COMMENT ON COLUMN public.clinic_treatments.event_id IS
  '소속 캠페인(clinic_events) FK. 어느 이미지/이벤트에서 추출됐는지 추적용.';
COMMENT ON COLUMN public.clinic_treatments.session_count IS
  '패키지 횟수. 1=단일 시술, N=N회 패키지, NULL=무제한 또는 횟수 무관.';
COMMENT ON COLUMN public.clinic_treatments.is_unlimited IS
  '무제한 패키지 여부 (예: "1년 무제한"). true면 session_count는 보통 NULL.';
COMMENT ON COLUMN public.clinic_treatments.bundle_size IS
  '번들 크기. 1+1이면 2, 1+2면 3, 단일이면 1.';
COMMENT ON COLUMN public.clinic_treatments.combo_items IS
  '조합 시술명 배열 (예: ["리투오 1vial","리쥬란 4cc"]). 단일 시술이면 NULL.';
COMMENT ON COLUMN public.clinic_treatments.conditions IS
  '구매 조건/제약 (예: "구글리뷰조건", "카카오톡 플친", "VAT별도").';

COMMIT;
