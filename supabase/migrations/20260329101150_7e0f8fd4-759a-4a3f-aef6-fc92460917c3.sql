
-- Drop the existing overly permissive ALL policy
DROP POLICY IF EXISTS "users can view own package options" ON package_options;

-- SELECT: allow all authenticated users to read default catalog + own package options
CREATE POLICY "pkg_options_select" ON package_options
  FOR SELECT TO authenticated
  USING (
    package_id IS NULL
    OR auth.uid() IN (SELECT user_id FROM treatment_packages WHERE id = package_options.package_id)
  );

-- INSERT/UPDATE/DELETE: only allow on user's own package options (not shared catalog)
CREATE POLICY "pkg_options_insert" ON package_options
  FOR INSERT TO authenticated
  WITH CHECK (
    package_id IS NOT NULL
    AND auth.uid() IN (SELECT user_id FROM treatment_packages WHERE id = package_options.package_id)
  );

CREATE POLICY "pkg_options_update" ON package_options
  FOR UPDATE TO authenticated
  USING (
    package_id IS NOT NULL
    AND auth.uid() IN (SELECT user_id FROM treatment_packages WHERE id = package_options.package_id)
  )
  WITH CHECK (
    package_id IS NOT NULL
    AND auth.uid() IN (SELECT user_id FROM treatment_packages WHERE id = package_options.package_id)
  );

CREATE POLICY "pkg_options_delete" ON package_options
  FOR DELETE TO authenticated
  USING (
    package_id IS NOT NULL
    AND auth.uid() IN (SELECT user_id FROM treatment_packages WHERE id = package_options.package_id)
  );
