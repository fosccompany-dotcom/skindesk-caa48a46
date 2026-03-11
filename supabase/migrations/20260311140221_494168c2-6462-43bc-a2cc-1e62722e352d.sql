
ALTER TABLE public.treatment_records
  ADD COLUMN IF NOT EXISTS clinic_kakao_id text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS clinic_district text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS clinic_address text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS input_method text DEFAULT 'manual';
