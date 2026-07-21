-- ============================================================================
-- Enable & PIN Row Level Security on tables missing it in version control
-- ----------------------------------------------------------------------------
-- Companion to 20260721_enforce_core_rls.sql, which covered the 7 core PII /
-- financial tables. This one closes three gaps found in the pre-launch audit:
--
--   1. package_options — 20260329101150_*.sql creates FOUR well-formed policies
--      but never runs ALTER TABLE ... ENABLE ROW LEVEL SECURITY. Policies on a
--      table without RLS enabled are INERT: Postgres does not evaluate them, so
--      the table is readable and writable by anyone holding the anon key.
--      This is the highest-value statement in this file.
--
--   2/3. clinic_brands, clinic_locations — no CREATE TABLE and no RLS statement
--      in any migration (dashboard-created, like the core 7). Their live state
--      cannot be determined from this repository.
--
-- Design: the clinic catalogue is public reference data by design (brand names,
-- branch addresses, business hours) and carries no user PII — ClinicEvents.tsx
-- renders it to every signed-in user. So SELECT stays open, matching the
-- existing clinic_events pattern in 20260523_admin_rbac.sql:119-122, while
-- writes are narrowed to is_admin(). Today those writes come from
-- parse-clinic-event via the service-role key, which BYPASSES RLS entirely —
-- so this does not break the ingestion path.
--
-- Safety:
--   * Idempotent — ENABLE is a no-op if already on; DROP POLICY IF EXISTS
--     before CREATE. Safe to re-run.
--   * package_options keeps its existing policies untouched; only the missing
--     ENABLE is added. Verified against 20260329101150_*.sql:6-37.
--   * delete-account and the parse functions use service-role and are unaffected.
--
-- Apply: run against the live DB (Supabase SQL Editor or `supabase db push`)
--        ONLY after the owner approves, and AFTER 20260721_enforce_core_rls.sql.
--        Smoke-test afterwards: sign in, open /treatments/events and /packages —
--        both must still render their lists.
-- ============================================================================

BEGIN;

-- 1) package_options: activate the policies that already exist ---------------
--    No policy changes here — turning RLS on is what makes them take effect.
ALTER TABLE public.package_options ENABLE ROW LEVEL SECURITY;

-- 2/3) Clinic catalogue: public read, admin-only write -----------------------
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['clinic_brands','clinic_locations'] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', t);

    EXECUTE format('DROP POLICY IF EXISTS "%1$s_select_public" ON public.%1$s;', t);
    EXECUTE format($f$
      CREATE POLICY "%1$s_select_public" ON public.%1$s
        FOR SELECT
        USING (true);
    $f$, t);

    EXECUTE format('DROP POLICY IF EXISTS "%1$s_write_admin" ON public.%1$s;', t);
    EXECUTE format($f$
      CREATE POLICY "%1$s_write_admin" ON public.%1$s
        FOR ALL TO authenticated
        USING (public.is_admin())
        WITH CHECK (public.is_admin());
    $f$, t);
  END LOOP;
END $$;

COMMIT;

-- Post-apply verification (run manually):
--   SELECT tablename, rowsecurity FROM pg_tables
--   WHERE schemaname='public'
--     AND tablename IN ('package_options','clinic_brands','clinic_locations');
--   -- all three rowsecurity must be true.
--
--   SELECT tablename, policyname, cmd FROM pg_policies
--   WHERE schemaname='public'
--     AND tablename IN ('package_options','clinic_brands','clinic_locations')
--   ORDER BY tablename, policyname;
--   -- package_options must list pkg_options_{select,insert,update,delete}.
--
-- Then re-run the anon probe: clinic_brands / clinic_locations should still
-- return rows (public catalogue), while package_options rows with a non-null
-- package_id must NOT be reachable without a matching signed-in user.
