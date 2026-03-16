
CREATE TABLE public.reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  date date NOT NULL,
  time text,
  clinic text NOT NULL,
  clinic_kakao_id text,
  clinic_district text,
  clinic_address text,
  treatment_name text NOT NULL,
  skin_layer text,
  body_area text,
  memo text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users own reservations"
  ON public.reservations
  FOR ALL
  TO public
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
