-- =====================================================================
-- Workstream B — Clinic Events 수집 시스템 (Stage 1)
-- 목적: 카카오톡/SMS 자동 수집을 위한 컬럼 추가 + 검수 워크플로우 확장
-- =====================================================================
-- 변경 요약:
--   1. clinic_locations.kakao_channel_id 추가 (카카오톡 채널 ID, 카카오맵과 구분)
--   2. clinic_events에 raw_message, confidence_score, admin_note, review_status 추가
--   3. review_status 백필 (is_published 기반)
--   4. 자동 승인 트리거 (confidence >= 80)
--   5. review_status ↔ is_published 양방향 sync 트리거 (기존 review_clinic_event RPC 호환)
-- =====================================================================

BEGIN;

-- ---------------------------------------------------------------------
-- 1. clinic_locations: 카카오톡 채널 ID
-- ---------------------------------------------------------------------
ALTER TABLE public.clinic_locations
  ADD COLUMN IF NOT EXISTS kakao_channel_id text;

COMMENT ON COLUMN public.clinic_locations.kakao_channel_id IS
  '카카오톡 플러스친구/채널 ID. clinic_locations.kakao_place_id(카카오맵 장소 ID)와 다른 개념.';

CREATE INDEX IF NOT EXISTS idx_clinic_locations_kakao_channel_id
  ON public.clinic_locations(kakao_channel_id)
  WHERE kakao_channel_id IS NOT NULL;

-- ---------------------------------------------------------------------
-- 2. clinic_events: 자동 수집/AI 파싱/검수용 컬럼
-- ---------------------------------------------------------------------
ALTER TABLE public.clinic_events
  ADD COLUMN IF NOT EXISTS raw_message      text,
  ADD COLUMN IF NOT EXISTS confidence_score smallint,
  ADD COLUMN IF NOT EXISTS admin_note       text,
  ADD COLUMN IF NOT EXISTS review_status    text NOT NULL DEFAULT 'pending';

-- confidence_score 범위 제약 (NULL 허용)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'clinic_events_confidence_score_check'
  ) THEN
    ALTER TABLE public.clinic_events
      ADD CONSTRAINT clinic_events_confidence_score_check
      CHECK (confidence_score IS NULL OR confidence_score BETWEEN 0 AND 100);
  END IF;
END $$;

-- review_status enum-like 제약
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'clinic_events_review_status_check'
  ) THEN
    ALTER TABLE public.clinic_events
      ADD CONSTRAINT clinic_events_review_status_check
      CHECK (review_status IN ('pending','approved','rejected','expired'));
  END IF;
END $$;

COMMENT ON COLUMN public.clinic_events.raw_message IS
  '원본 메시지(카카오톡/SMS 자동 수집 시). manual/homepage는 NULL.';
COMMENT ON COLUMN public.clinic_events.confidence_score IS
  'AI 파싱 신뢰도 0-100. NULL = AI 파싱 안 거침. >=80 자동 승인.';
COMMENT ON COLUMN public.clinic_events.admin_note IS
  '어드민 검수 메모(승인/거부 사유).';
COMMENT ON COLUMN public.clinic_events.review_status IS
  '검수 상태: pending(대기) / approved(승인,공개) / rejected(거부) / expired(만료). is_published와 트리거로 sync.';

CREATE INDEX IF NOT EXISTS idx_clinic_events_review_status
  ON public.clinic_events(review_status)
  WHERE review_status IN ('pending','rejected');

-- ---------------------------------------------------------------------
-- 3. 기존 데이터 review_status 백필
-- ---------------------------------------------------------------------
UPDATE public.clinic_events
SET review_status = CASE
  WHEN is_published = true THEN 'approved'
  ELSE 'pending'
END
WHERE review_status = 'pending' AND is_published IS NOT NULL;

-- ---------------------------------------------------------------------
-- 4. 자동 승인 + 양방향 sync 트리거
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_clinic_events_sync_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- INSERT: 자동 승인 로직
  IF TG_OP = 'INSERT' THEN
    -- confidence_score>=80 + review_status가 명시 안 됐으면 자동 승인
    IF NEW.confidence_score IS NOT NULL
       AND NEW.confidence_score >= 80
       AND NEW.review_status = 'pending' THEN
      NEW.review_status := 'approved';
    END IF;
    -- review_status에 맞춰 is_published 동기화
    NEW.is_published := (NEW.review_status = 'approved');
    RETURN NEW;
  END IF;

  -- UPDATE: 양방향 sync
  IF TG_OP = 'UPDATE' THEN
    -- review_status가 변경된 경우 → is_published 따라가기
    IF NEW.review_status IS DISTINCT FROM OLD.review_status THEN
      NEW.is_published := (NEW.review_status = 'approved');
    -- review_status는 그대로인데 is_published만 바뀐 경우 (기존 RPC 호환)
    ELSIF NEW.is_published IS DISTINCT FROM OLD.is_published THEN
      IF NEW.is_published = true AND OLD.review_status IN ('pending','rejected','expired') THEN
        NEW.review_status := 'approved';
      ELSIF NEW.is_published = false AND OLD.review_status = 'approved' THEN
        -- 기존 fn_expire_clinic_events 등이 is_published만 false로 토글한 경우:
        -- end_date 기준으로 expired vs pending 자동 판별
        IF NEW.end_date IS NOT NULL AND NEW.end_date < CURRENT_DATE THEN
          NEW.review_status := 'expired';
        ELSE
          NEW.review_status := 'pending';
        END IF;
      END IF;
    END IF;
    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_clinic_events_sync_status ON public.clinic_events;
CREATE TRIGGER trg_clinic_events_sync_status
  BEFORE INSERT OR UPDATE ON public.clinic_events
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_clinic_events_sync_status();

COMMENT ON FUNCTION public.fn_clinic_events_sync_status() IS
  'review_status ↔ is_published 양방향 동기화 + confidence>=80 자동 승인. 기존 review_clinic_event RPC 호환.';

-- ---------------------------------------------------------------------
-- 5. 검증용 sanity (실행 결과 확인용)
-- ---------------------------------------------------------------------
-- 백필 결과 확인 (실행 후 SELECT)
-- SELECT review_status, is_published, source_type, COUNT(*)
-- FROM clinic_events
-- GROUP BY review_status, is_published, source_type
-- ORDER BY review_status, source_type;

COMMIT;
