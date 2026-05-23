-- =====================================================================
-- Workstream B — Clinic Events 수집 시스템 (Stage 2)
-- 목적: 데이터 모델 정정 — 모든 데이터는 location 단위. 영업공지 컬럼 추가.
-- =====================================================================
-- 변경 요약:
--   1. 옛 데이터 삭제 (45개): location_id 없거나 옛 homepage 크롤
--   2. notice_type, hours_text, is_closed 컬럼 추가
--   3. location_id NOT NULL 강제
--   4. notice_type CHECK 제약
--   5. 인덱스
-- =====================================================================

BEGIN;

-- ---------------------------------------------------------------------
-- 1. 옛 데이터 삭제
-- ---------------------------------------------------------------------
-- 39 homepage 이벤트 (검수 안 됨, location 정보 없음 → 새로 크롤 시 정확히 재생성)
-- 6 manual 이벤트 (사용자 직접 입력했지만 location_id 비어있음)
DELETE FROM public.clinic_events
WHERE (source_type = 'homepage' AND is_published = false)
   OR (source_type = 'manual'   AND location_id IS NULL);

-- ---------------------------------------------------------------------
-- 2. 새 컬럼 추가
-- ---------------------------------------------------------------------
ALTER TABLE public.clinic_events
  ADD COLUMN IF NOT EXISTS notice_type text    NOT NULL DEFAULT 'event',
  ADD COLUMN IF NOT EXISTS hours_text  text,
  ADD COLUMN IF NOT EXISTS is_closed   boolean NOT NULL DEFAULT false;

-- ---------------------------------------------------------------------
-- 3. notice_type CHECK 제약
-- ---------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'clinic_events_notice_type_check'
  ) THEN
    ALTER TABLE public.clinic_events
      ADD CONSTRAINT clinic_events_notice_type_check
      CHECK (notice_type IN ('event','schedule','other'));
  END IF;
END $$;

-- ---------------------------------------------------------------------
-- 4. location_id 필수화
-- ---------------------------------------------------------------------
-- 삭제 후 남은 row는 모두 location_id 보유 → NOT NULL 안전하게 적용 가능
ALTER TABLE public.clinic_events
  ALTER COLUMN location_id SET NOT NULL;

-- ---------------------------------------------------------------------
-- 5. 인덱스
-- ---------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_clinic_events_notice_loc
  ON public.clinic_events(notice_type, location_id, start_date DESC);

-- ---------------------------------------------------------------------
-- 6. 컬럼 코멘트
-- ---------------------------------------------------------------------
COMMENT ON COLUMN public.clinic_events.notice_type IS
  '공지 종류: event(마케팅 이벤트) / schedule(영업·휴진 안내) / other';
COMMENT ON COLUMN public.clinic_events.hours_text IS
  '영업시간 텍스트 (예: "09:00~18:00"). notice_type=schedule에서만 의미.';
COMMENT ON COLUMN public.clinic_events.is_closed IS
  '휴진 여부. notice_type=schedule + true면 그 기간 휴진.';

COMMIT;
