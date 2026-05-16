/**
 * useClinicLocations
 *
 * 특정 brand의 지점(location) 목록 조회.
 * 국내 + active 지점만.
 */

import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ClinicLocationLite {
  id: string;
  brand_id: string;
  branch_name: string;
  region_sido: string | null;
  region_gugun: string | null;
  address: string | null;
}

export function useClinicLocations(brandId: string | null) {
  const [locations, setLocations] = useState<ClinicLocationLite[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!brandId) {
      setLocations([]);
      return;
    }

    let mounted = true;
    setLoading(true);
    const load = async () => {
      const { data, error } = await supabase
        .from('clinic_locations')
        .select('id, brand_id, branch_name, region_sido, region_gugun, address')
        .eq('brand_id', brandId)
        .eq('is_active', true)
        .or('is_overseas.is.null,is_overseas.eq.false')
        .order('branch_name', { ascending: true });

      if (!mounted) return;
      if (error) {
        console.error('[useClinicLocations] error:', error);
        setLocations([]);
      } else {
        setLocations((data ?? []) as ClinicLocationLite[]);
      }
      setLoading(false);
    };
    load();
    return () => {
      mounted = false;
    };
  }, [brandId]);

  return { locations, loading };
}
