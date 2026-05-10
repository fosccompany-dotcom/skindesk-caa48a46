-- Stage 1: diagnosis and recommendation schema foundation.
-- This migration keeps skin_tribe column in place, but clears old values.

ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS score_p smallint DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS score_o smallint DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS score_i smallint DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS score_h smallint DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS score_a smallint DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS diagnosis_updated_at timestamptz DEFAULT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'user_profiles_score_p_range'
      AND conrelid = 'public.user_profiles'::regclass
  ) THEN
    ALTER TABLE public.user_profiles
      ADD CONSTRAINT user_profiles_score_p_range
      CHECK (score_p IS NULL OR score_p BETWEEN 0 AND 10);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'user_profiles_score_o_range'
      AND conrelid = 'public.user_profiles'::regclass
  ) THEN
    ALTER TABLE public.user_profiles
      ADD CONSTRAINT user_profiles_score_o_range
      CHECK (score_o IS NULL OR score_o BETWEEN 0 AND 10);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'user_profiles_score_i_range'
      AND conrelid = 'public.user_profiles'::regclass
  ) THEN
    ALTER TABLE public.user_profiles
      ADD CONSTRAINT user_profiles_score_i_range
      CHECK (score_i IS NULL OR score_i BETWEEN 0 AND 10);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'user_profiles_score_h_range'
      AND conrelid = 'public.user_profiles'::regclass
  ) THEN
    ALTER TABLE public.user_profiles
      ADD CONSTRAINT user_profiles_score_h_range
      CHECK (score_h IS NULL OR score_h BETWEEN 0 AND 10);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'user_profiles_score_a_range'
      AND conrelid = 'public.user_profiles'::regclass
  ) THEN
    ALTER TABLE public.user_profiles
      ADD CONSTRAINT user_profiles_score_a_range
      CHECK (score_a IS NULL OR score_a BETWEEN 0 AND 10);
  END IF;
END $$;

UPDATE public.user_profiles
SET skin_tribe = NULL
WHERE skin_tribe IS NOT NULL;

UPDATE public.user_profiles
SET current_season = 'no_care'
WHERE current_season IN ('reset', 'recovery');

ALTER TABLE public.treatment_records
  ADD COLUMN IF NOT EXISTS axis_weights jsonb DEFAULT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'treatment_records_axis_weights_object'
      AND conrelid = 'public.treatment_records'::regclass
  ) THEN
    ALTER TABLE public.treatment_records
      ADD CONSTRAINT treatment_records_axis_weights_object
      CHECK (axis_weights IS NULL OR jsonb_typeof(axis_weights) = 'object');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.diagnosis_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  score_p smallint DEFAULT NULL,
  score_o smallint DEFAULT NULL,
  score_i smallint DEFAULT NULL,
  score_h smallint DEFAULT NULL,
  score_a smallint DEFAULT NULL,
  snapshot_at timestamptz NOT NULL DEFAULT now(),
  source text DEFAULT NULL,
  notes text DEFAULT NULL,
  CONSTRAINT diagnosis_snapshots_score_p_range CHECK (score_p IS NULL OR score_p BETWEEN 0 AND 10),
  CONSTRAINT diagnosis_snapshots_score_o_range CHECK (score_o IS NULL OR score_o BETWEEN 0 AND 10),
  CONSTRAINT diagnosis_snapshots_score_i_range CHECK (score_i IS NULL OR score_i BETWEEN 0 AND 10),
  CONSTRAINT diagnosis_snapshots_score_h_range CHECK (score_h IS NULL OR score_h BETWEEN 0 AND 10),
  CONSTRAINT diagnosis_snapshots_score_a_range CHECK (score_a IS NULL OR score_a BETWEEN 0 AND 10)
);

CREATE INDEX IF NOT EXISTS diagnosis_snapshots_user_snapshot_idx
  ON public.diagnosis_snapshots (user_id, snapshot_at DESC);

ALTER TABLE public.diagnosis_snapshots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "diagnosis_snapshots_select_own" ON public.diagnosis_snapshots;
CREATE POLICY "diagnosis_snapshots_select_own"
  ON public.diagnosis_snapshots
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "diagnosis_snapshots_insert_own" ON public.diagnosis_snapshots;
CREATE POLICY "diagnosis_snapshots_insert_own"
  ON public.diagnosis_snapshots
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "diagnosis_snapshots_update_own" ON public.diagnosis_snapshots;
CREATE POLICY "diagnosis_snapshots_update_own"
  ON public.diagnosis_snapshots
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "diagnosis_snapshots_delete_own" ON public.diagnosis_snapshots;
CREATE POLICY "diagnosis_snapshots_delete_own"
  ON public.diagnosis_snapshots
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.user_favorite_clinics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  clinic_brand_id uuid NOT NULL REFERENCES public.clinic_brands(id) ON DELETE CASCADE,
  priority smallint NOT NULL CHECK (priority BETWEEN 1 AND 5),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT user_favorite_clinics_user_brand_unique UNIQUE (user_id, clinic_brand_id)
);

CREATE INDEX IF NOT EXISTS user_favorite_clinics_user_priority_idx
  ON public.user_favorite_clinics (user_id, priority);

ALTER TABLE public.user_favorite_clinics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_favorite_clinics_select_own" ON public.user_favorite_clinics;
CREATE POLICY "user_favorite_clinics_select_own"
  ON public.user_favorite_clinics
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_favorite_clinics_insert_own" ON public.user_favorite_clinics;
CREATE POLICY "user_favorite_clinics_insert_own"
  ON public.user_favorite_clinics
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_favorite_clinics_update_own" ON public.user_favorite_clinics;
CREATE POLICY "user_favorite_clinics_update_own"
  ON public.user_favorite_clinics
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_favorite_clinics_delete_own" ON public.user_favorite_clinics;
CREATE POLICY "user_favorite_clinics_delete_own"
  ON public.user_favorite_clinics
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);
