-- =====================================================================
-- 파싱 피드백 루프: parse_corrections + treatment_glossary
-- =====================================================================
-- 목적:
--   1. 어드민 반려 시 필드별 정정값을 영구 기록 (parse_corrections)
--   2. 자주 반복되는 정정은 brand 단위 glossary로 자동 누적 (treatment_glossary)
--   3. parse-clinic-event Edge Function이 glossary 조회해서 다음 파싱 프롬프트에 주입
-- =====================================================================

BEGIN;

-- ---------------------------------------------------------------------
-- 1. parse_corrections — 모든 정정 기록 (audit)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.parse_corrections (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id          uuid REFERENCES public.clinic_events(id) ON DELETE CASCADE,
  brand_id          uuid REFERENCES public.clinic_brands(id) ON DELETE SET NULL,
  location_id       uuid REFERENCES public.clinic_locations(id) ON DELETE SET NULL,
  field             text NOT NULL,
  original_value    text,
  corrected_value   text,
  raw_text_excerpt  text,
  notes             text,
  created_by        uuid REFERENCES auth.users(id),
  created_at        timestamptz NOT NULL DEFAULT now()
);

-- field CHECK
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'parse_corrections_field_check') THEN
    ALTER TABLE public.parse_corrections
      ADD CONSTRAINT parse_corrections_field_check
      CHECK (field IN (
        'treatment_name','category','price_krw','original_price_krw',
        'session_count','is_unlimited','bundle_size','combo_items','conditions',
        'body_areas','notice_type','start_date','end_date','title','description',
        'hours_text','is_closed','other'
      ));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_corrections_brand_field
  ON public.parse_corrections(brand_id, field, created_at DESC);

COMMENT ON TABLE public.parse_corrections IS
  '어드민 반려/수정 시 LLM 정정 사례 영구 기록. parse-clinic-event 학습용.';

-- ---------------------------------------------------------------------
-- 2. treatment_glossary — brand 단위 정규화 사전 (자동 누적)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.treatment_glossary (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id        uuid REFERENCES public.clinic_brands(id) ON DELETE CASCADE,
  term            text NOT NULL,    -- LLM이 잘못 추출한 형태 (예: '리투우')
  canonical       text NOT NULL,    -- 정정된 표준 형태 (예: '리투오')
  field           text NOT NULL,    -- treatment_name / category 등
  usage_count     integer NOT NULL DEFAULT 1,
  last_seen_at    timestamptz NOT NULL DEFAULT now(),
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE(brand_id, term, field)
);

CREATE INDEX IF NOT EXISTS idx_glossary_brand_field_recent
  ON public.treatment_glossary(brand_id, field, last_seen_at DESC);

COMMENT ON TABLE public.treatment_glossary IS
  '브랜드별 시술명/카테고리 정규화 사전. 정정 누적되면 자동 등재.';

-- ---------------------------------------------------------------------
-- 3. 자동 동기화 트리거 — parse_corrections INSERT 시 glossary 누적
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_sync_glossary_from_correction()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- 의미 있는 정정만 (treatment_name·category 같은 텍스트 정규화 위주)
  IF NEW.field NOT IN ('treatment_name','category','notice_type','title') THEN
    RETURN NEW;
  END IF;
  IF NEW.original_value IS NULL OR NEW.corrected_value IS NULL THEN
    RETURN NEW;
  END IF;
  IF NEW.brand_id IS NULL THEN
    RETURN NEW;
  END IF;
  IF trim(NEW.original_value) = trim(NEW.corrected_value) THEN
    RETURN NEW;  -- 동일하면 의미 없음
  END IF;

  -- UPSERT: 같은 (brand, term, field) 있으면 usage_count++ + last_seen 갱신
  INSERT INTO public.treatment_glossary (brand_id, term, canonical, field, usage_count, last_seen_at)
  VALUES (NEW.brand_id, trim(NEW.original_value), trim(NEW.corrected_value), NEW.field, 1, now())
  ON CONFLICT (brand_id, term, field) DO UPDATE
  SET usage_count = treatment_glossary.usage_count + 1,
      last_seen_at = now(),
      canonical = EXCLUDED.canonical;  -- 최신 정정값 반영
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_glossary ON public.parse_corrections;
CREATE TRIGGER trg_sync_glossary
  AFTER INSERT ON public.parse_corrections
  FOR EACH ROW EXECUTE FUNCTION public.fn_sync_glossary_from_correction();

-- ---------------------------------------------------------------------
-- 4. RLS — admin 이상만 read/write
-- ---------------------------------------------------------------------
ALTER TABLE public.parse_corrections ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "corrections_read_admin" ON public.parse_corrections;
CREATE POLICY "corrections_read_admin"
  ON public.parse_corrections FOR SELECT
  USING (public.is_reviewer_or_higher());
DROP POLICY IF EXISTS "corrections_write_admin" ON public.parse_corrections;
CREATE POLICY "corrections_write_admin"
  ON public.parse_corrections FOR INSERT
  WITH CHECK (public.is_admin());

ALTER TABLE public.treatment_glossary ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "glossary_read_all" ON public.treatment_glossary;
CREATE POLICY "glossary_read_all"
  ON public.treatment_glossary FOR SELECT
  USING (true);  -- glossary는 Edge Function이 anon 권한으로도 읽을 수 있어야 함
DROP POLICY IF EXISTS "glossary_write_admin" ON public.treatment_glossary;
CREATE POLICY "glossary_write_admin"
  ON public.treatment_glossary FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ---------------------------------------------------------------------
-- 5. RPC — brand의 glossary 가져오기 (Edge Function이 호출)
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_brand_glossary(p_brand_id uuid, p_limit int DEFAULT 30)
RETURNS TABLE(term text, canonical text, field text, usage_count int)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT g.term, g.canonical, g.field, g.usage_count
  FROM public.treatment_glossary g
  WHERE g.brand_id = p_brand_id
  ORDER BY g.usage_count DESC, g.last_seen_at DESC
  LIMIT p_limit;
$$;

COMMIT;
