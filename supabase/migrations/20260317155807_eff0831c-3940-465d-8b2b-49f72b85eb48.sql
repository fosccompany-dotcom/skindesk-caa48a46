-- Drop FK constraints that reference auth.users so anonymization can set user_id to a non-existent UUID

ALTER TABLE public.treatment_records
  DROP CONSTRAINT IF EXISTS treatment_records_user_id_fkey;

ALTER TABLE public.treatment_packages
  DROP CONSTRAINT IF EXISTS treatment_packages_user_id_fkey;

ALTER TABLE public.point_transactions
  DROP CONSTRAINT IF EXISTS point_transactions_user_id_fkey;

ALTER TABLE public.payment_records
  DROP CONSTRAINT IF EXISTS payment_records_user_id_fkey;

ALTER TABLE public.treatment_cycles
  DROP CONSTRAINT IF EXISTS treatment_cycles_user_id_fkey;

ALTER TABLE public.clinic_balances
  DROP CONSTRAINT IF EXISTS clinic_balances_user_id_fkey;

ALTER TABLE public.user_profiles
  DROP CONSTRAINT IF EXISTS user_profiles_id_fkey;

ALTER TABLE public.reservations
  DROP CONSTRAINT IF EXISTS reservations_user_id_fkey;