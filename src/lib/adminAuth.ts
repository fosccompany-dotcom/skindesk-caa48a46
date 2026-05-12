/**
 * Admin Authorization
 *
 * Owner-only access via email whitelist.
 * Matches `is_admin()` SQL function in Supabase.
 */

import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

/** Owner email — must match `is_admin()` SQL function */
export const ADMIN_EMAILS = ['fosccompany@gmail.com'] as const;

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return (ADMIN_EMAILS as readonly string[]).includes(email);
}

/**
 * useIsAdmin — React hook to check whether the current user is admin.
 * Returns { isAdmin, loading }.
 */
export function useIsAdmin() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getUser().then(({ data }) => {
      if (!mounted) return;
      const email = data.user?.email ?? null;
      setIsAdmin(isAdminEmail(email));
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      const email = session?.user?.email ?? null;
      setIsAdmin(isAdminEmail(email));
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return { isAdmin, loading };
}
