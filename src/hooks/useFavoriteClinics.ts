/**
 * useFavoriteClinics
 *
 * DB-backed favorite clinic brands + locations (`user_favorite_clinics` table).
 *
 * Data model:
 *   - Brand mark row: (user, brand_id, location_id=NULL)
 *   - Active location row: (user, brand_id, location_id=<UUID>)
 *
 * 한 user가 같은 brand에 brand-mark 1개 + 여러 location row를 동시 가질 수 있음.
 */

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/** 활성 지점 최대 개수 — 시술 이벤트 비교 최적화 */
export const MAX_ACTIVE_LOCATIONS = 5;

export interface ClinicBrandLite {
  id: string;
  name: string;
  slug: string | null;
}

export interface ClinicLocationLite {
  id: string;
  branch_name: string;
}

export interface FavoriteRow {
  id: string;
  brand_id: string;
  location_id: string | null; // NULL = brand mark
  priority: number;
  brand: ClinicBrandLite | null;
  location: ClinicLocationLite | null;
}

export interface FavoriteClinic {
  id: string;
  brand_id: string;
  priority: number;
  brand: ClinicBrandLite | null;
}

export function useFavoriteClinics() {
  const [rows, setRows] = useState<FavoriteRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setUserId(null);
      setRows([]);
      setLoading(false);
      return;
    }
    setUserId(user.id);

    const { data, error } = await supabase
      .from('user_favorite_clinics')
      .select('id, clinic_brand_id, clinic_location_id, priority, created_at, clinic_brands(id, name, slug), clinic_locations(id, branch_name)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('[useFavoriteClinics] load error:', error);
      setRows([]);
      setLoading(false);
      return;
    }

    const mapped: FavoriteRow[] = (data ?? []).map((row: any) => ({
      id: row.id,
      brand_id: row.clinic_brand_id,
      location_id: row.clinic_location_id ?? null,
      priority: row.priority,
      brand: row.clinic_brands
        ? {
            id: row.clinic_brands.id,
            name: row.clinic_brands.name,
            slug: row.clinic_brands.slug ?? null,
          }
        : null,
      location: row.clinic_locations
        ? {
            id: row.clinic_locations.id,
            branch_name: row.clinic_locations.branch_name,
          }
        : null,
    }));
    setRows(mapped);
    setLoading(false);
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  /** 현재 user의 brand-mark 즐겨찾기 (location_id NULL) */
  const favorites: FavoriteClinic[] = rows
    .filter((r) => r.location_id === null)
    .map((r) => ({ id: r.id, brand_id: r.brand_id, priority: r.priority, brand: r.brand }));

  /** 즐겨찾기한 brand id 배열 */
  const favoriteBrandIds = favorites.map((f) => f.brand_id);

  /** 활성화된 location id 배열 (location_id NOT NULL) */
  const activeLocationIds = rows.filter((r) => r.location_id !== null).map((r) => r.location_id!) as string[];

  /** 활성 지점이 최대치에 도달했는지 */
  const isAtLocationLimit = activeLocationIds.length >= MAX_ACTIVE_LOCATIONS;

  /** brand가 즐겨찾기 됐는지 (brand-mark row 존재 — 옛 로직, 호환용) */
  const isFavorite = useCallback(
    (brandId: string) => rows.some((r) => r.brand_id === brandId && r.location_id === null),
    [rows],
  );

  /** 그 brand에 활성 지점이 1개 이상 있는지 — UI active 판단의 새 기준 */
  const hasActiveLocations = useCallback(
    (brandId: string) =>
      rows.some((r) => r.brand_id === brandId && r.location_id !== null),
    [rows],
  );

  /** 그 brand에 활성 지점 개수 */
  const countActiveLocations = useCallback(
    (brandId: string) =>
      rows.filter((r) => r.brand_id === brandId && r.location_id !== null).length,
    [rows],
  );

  /** location이 활성화 됐는지 */
  const isActiveLocation = useCallback(
    (locationId: string) => rows.some((r) => r.location_id === locationId),
    [rows],
  );

  /** uid 보충 헬퍼 */
  const ensureUserId = useCallback(async (): Promise<string | null> => {
    if (userId) return userId;
    const { data: { user } } = await supabase.auth.getUser();
    const uid = user?.id ?? null;
    if (uid) setUserId(uid);
    return uid;
  }, [userId]);

  /** brand 즐겨찾기 추가 (brand-mark row) */
  const addFavorite = useCallback(
    async (brandId: string) => {
      const uid = await ensureUserId();
      if (!uid) {
        toast.error('로그인이 필요해요');
        return;
      }
      if (isFavorite(brandId)) return;

      // priority는 1~5 CHECK 제약 있어 모든 row에 1 고정 (정렬은 created_at)
      const FIXED_PRIORITY = 1;

      // Optimistic
      const tempId = `temp-${Date.now()}`;
      const optimistic: FavoriteRow = {
        id: tempId,
        brand_id: brandId,
        location_id: null,
        priority: FIXED_PRIORITY,
        brand: null,
      };
      setRows((prev) => [...prev, optimistic]);

      const { error } = await supabase.from('user_favorite_clinics').insert({
        user_id: uid,
        clinic_brand_id: brandId,
        clinic_location_id: null,
        priority: FIXED_PRIORITY,
      } as any);

      if (error) {
        console.error('[useFavoriteClinics] add brand error:', error);
        setRows((prev) => prev.filter((r) => r.id !== tempId));
        toast.error(`즐겨찾기 추가 실패: ${error.message ?? '알 수 없는 오류'}`);
        return;
      }
      await reload();
    },
    [ensureUserId, isFavorite, rows, reload],
  );

  /** brand 즐겨찾기 제거 (brand-mark + 해당 brand의 모든 location row까지 삭제) */
  const removeFavorite = useCallback(
    async (brandId: string) => {
      const uid = await ensureUserId();
      if (!uid) {
        toast.error('로그인이 필요해요');
        return;
      }

      const prevRows = rows;
      setRows((prev) => prev.filter((r) => r.brand_id !== brandId));

      const { error } = await supabase
        .from('user_favorite_clinics')
        .delete()
        .eq('user_id', uid)
        .eq('clinic_brand_id', brandId);

      if (error) {
        console.error('[useFavoriteClinics] remove brand error:', error);
        setRows(prevRows);
        toast.error(`즐겨찾기 제거 실패: ${error.message ?? '알 수 없는 오류'}`);
        return;
      }
      await reload();
    },
    [ensureUserId, rows, reload],
  );

  /** brand 토글 */
  const toggleFavorite = useCallback(
    async (brandId: string) => {
      if (isFavorite(brandId)) await removeFavorite(brandId);
      else await addFavorite(brandId);
    },
    [isFavorite, addFavorite, removeFavorite],
  );

  /** 지점 활성화 추가 */
  const addLocation = useCallback(
    async (brandId: string, locationId: string) => {
      const uid = await ensureUserId();
      if (!uid) {
        toast.error('로그인이 필요해요');
        return;
      }
      if (isActiveLocation(locationId)) return;

      // 활성 지점 최대 개수 체크
      const currentActiveCount = rows.filter((r) => r.location_id !== null).length;
      if (currentActiveCount >= MAX_ACTIVE_LOCATIONS) {
        toast.error(`활성 지점은 최대 ${MAX_ACTIVE_LOCATIONS}개까지 가능해요`);
        return;
      }

      // priority는 1~5 CHECK 제약 있어 모든 row에 1 고정
      const FIXED_PRIORITY = 1;

      const tempId = `temp-loc-${Date.now()}`;
      const optimistic: FavoriteRow = {
        id: tempId,
        brand_id: brandId,
        location_id: locationId,
        priority: FIXED_PRIORITY,
        brand: null,
      };
      setRows((prev) => [...prev, optimistic]);

      const { error } = await supabase.from('user_favorite_clinics').insert({
        user_id: uid,
        clinic_brand_id: brandId,
        clinic_location_id: locationId,
        priority: FIXED_PRIORITY,
      } as any);

      if (error) {
        console.error('[useFavoriteClinics] add location error:', error);
        setRows((prev) => prev.filter((r) => r.id !== tempId));
        toast.error(`지점 추가 실패: ${error.message ?? '알 수 없는 오류'}`);
        return;
      }
      await reload();
    },
    [ensureUserId, isActiveLocation, rows, reload],
  );

  /** 지점 활성화 제거 */
  const removeLocation = useCallback(
    async (locationId: string) => {
      const uid = await ensureUserId();
      if (!uid) {
        toast.error('로그인이 필요해요');
        return;
      }

      const prevRows = rows;
      setRows((prev) => prev.filter((r) => r.location_id !== locationId));

      const { error } = await supabase
        .from('user_favorite_clinics')
        .delete()
        .eq('user_id', uid)
        .eq('clinic_location_id', locationId);

      if (error) {
        console.error('[useFavoriteClinics] remove location error:', error);
        setRows(prevRows);
        toast.error(`지점 제거 실패: ${error.message ?? '알 수 없는 오류'}`);
        return;
      }
      await reload();
    },
    [ensureUserId, rows, reload],
  );

  /** 지점 토글 */
  const toggleLocation = useCallback(
    async (brandId: string, locationId: string) => {
      if (isActiveLocation(locationId)) await removeLocation(locationId);
      else await addLocation(brandId, locationId);
    },
    [isActiveLocation, addLocation, removeLocation],
  );

  return {
    rows,
    favorites,
    favoriteBrandIds,
    activeLocationIds,
    isAtLocationLimit,
    loading,
    isFavorite,
    hasActiveLocations,
    countActiveLocations,
    isActiveLocation,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    addLocation,
    removeLocation,
    toggleLocation,
    reload,
  };
}

/** 25개 brand 전체 목록 (검색용) */
export function useAllClinicBrands() {
  const [brands, setBrands] = useState<ClinicBrandLite[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      const { data, error } = await supabase
        .from('clinic_brands')
        .select('id, name, slug')
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (!mounted) return;
      if (error) {
        console.error('[useAllClinicBrands] error:', error);
        setBrands([]);
      } else {
        setBrands((data ?? []) as ClinicBrandLite[]);
      }
      setLoading(false);
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  return { brands, loading };
}
