-- ============================================================================
-- Enforce & PIN Row Level Security on core PII / financial tables
-- ----------------------------------------------------------------------------
-- Context: these 7 tables were originally created via the Lovable dashboard, so
-- their RLS policies live ONLY in the live database and are absent from version
-- control. A live probe (2026-07-21, unauthenticated anon key) confirmed all 7
-- currently return 0 rows -> RLS is presently enforced. This migration PINS that
-- correct state into git as idempotent DDL, so a future dashboard change cannot
-- silently drop or weaken it without a tracked diff.
--
-- Safety:
--   * Idempotent — DROP POLICY IF EXISTS + CREATE, safe to re-run.
--   * Owner-only per-user scoping via auth.uid(); matches key columns verified
--     in src/integrations/supabase/types.ts (6 tables key on user_id;
--     user_profiles keys on its PK id).
--   * delete-account uses the service-role key and BYPASSES RLS, so these
--     policies do NOT break account deletion.
--
-- Apply: run against the live DB (Supabase SQL Editor or `supabase db push`)
--        ONLY after the owner approves. Re-run the anon probe afterwards; every
--        target table must still report 0 rows for an unauthenticated caller.
-- ============================================================================

BEGIN;

-- Six tables keyed by user_id: owner-only CRUD ------------------------------
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'treatment_records','payment_records','point_transactions',
    'treatment_cycles','clinic_balances','treatment_packages'
  ] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', t);
    EXECUTE format('DROP POLICY IF EXISTS "%1$s_own" ON public.%1$s;', t);
    EXECUTE format($f$
      CREATE POLICY "%1$s_own" ON public.%1$s
        FOR ALL TO authenticated
        USING (auth.uid() = user_id)
        WITH CHECK (auth.uid() = user_id);
    $f$, t);
  END LOOP;
END $$;

-- user_profiles: PK id == auth.uid() ---------------------------------------
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "user_profiles_own" ON public.user_profiles;
CREATE POLICY "user_profiles_own" ON public.user_profiles
  FOR ALL TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

COMMIT;

-- Post-apply verification (run manually, expect 0 rows for anon):
--   SELECT tablename, rowsecurity FROM pg_tables
--   WHERE schemaname='public' AND tablename IN
--     ('treatment_records','payment_records','point_transactions',
--      'treatment_cycles','clinic_balances','treatment_packages','user_profiles');
--   -- every rowsecurity must be true, each with exactly one *_own policy.
