-- Rollback for Stage 1 diagnosis and recommendation schema foundation.
-- Note: current_season values changed to no_care cannot be restored without a backup.

DROP TABLE IF EXISTS public.user_favorite_clinics;
DROP TABLE IF EXISTS public.diagnosis_snapshots;

ALTER TABLE public.treatment_records
  DROP CONSTRAINT IF EXISTS treatment_records_axis_weights_object,
  DROP COLUMN IF EXISTS axis_weights;

ALTER TABLE public.user_profiles
  DROP CONSTRAINT IF EXISTS user_profiles_score_p_range,
  DROP CONSTRAINT IF EXISTS user_profiles_score_o_range,
  DROP CONSTRAINT IF EXISTS user_profiles_score_i_range,
  DROP CONSTRAINT IF EXISTS user_profiles_score_h_range,
  DROP CONSTRAINT IF EXISTS user_profiles_score_a_range,
  DROP COLUMN IF EXISTS score_p,
  DROP COLUMN IF EXISTS score_o,
  DROP COLUMN IF EXISTS score_i,
  DROP COLUMN IF EXISTS score_h,
  DROP COLUMN IF EXISTS score_a,
  DROP COLUMN IF EXISTS diagnosis_updated_at;
