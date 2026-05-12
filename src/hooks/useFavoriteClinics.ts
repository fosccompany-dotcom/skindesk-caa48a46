/**
 * useFavoriteClinics
 *
 * DB-backed favorite clinic brands (`user_favorite_clinics` table).
 * Provides list + add / remove + reorder operations.
 */

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ClinicBrandLite {
  id: string;
  name: string;
  slug: string | null;
}

export interface FavoriteClinic {
  id: string;              // user_favorite_clinics.id
  brand_id: string;        // clinic_brands.id
  priority: number;
  brand: ClinicBrandLite | null;
}

export function useFavoriteClinics() {
  const [favorites, setFavorites] = useState<FavoriteClinic[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // load
  const reload = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setUserId(null);
      setFavorites([]);
      setLoading(false);
      return;
    }
    setUserId(user.id);

    const { data, error } = await supabase
      .from('user_favorite_clinics')
      .select('id, clinic_brand_id, priority, clinic_brands(id, name, slug)')
      .eq('user_id', user.id)
      .order('priority', { ascending: true });

    if (error) {
      console.error('[useFavoriteClinics] load error:', error);
      setFavorites([]);
      setLoading(false);
      return;
    }

    const mapped: FavoriteClinic[] = (data ?? []).map((row: any) => ({
      id: row.id,
      brand_id: row.clinic_brand_id,
      priority: row.priority,
      brand: row.clinic_brands
        ? {
            id: row.clinic_brands.id,
            name: row.clinic_brands.name,
            slug: row.clinic_brands.slug ?? null,
          }
        : null,
    }));
    setFavorites(mapped);
    setLoading(false);
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  /** brand 즐겨찾기 추가 (이미 있으면 무시) */
  const addFavorite = useCallback(
    async (brandId: string) => {
      if (!userId) return;
      // 이미 있는지 체크
      if (favorites.some((f) => f.brand_id === brandId)) return;

      // 다음 priority
      const nextPriority =
        favorites.length === 0
          ? 0
          : Math.max(...favorites.map((f) => f.priority)) + 1;

      const { error } = await supabase
        .from('user_favorite_clinics')
        .insert({
          user_id: userId,
          clinic_brand_id: brandId,
          priority: nextPriority,
        });

      if (error) {
        console.error('[useFavoriteClinics] add error:', error);
        return;
      }
      await reload();
    },
    [userId, favorites, reload],
  );

  /** brand 즐겨찾기 제거 */
  const removeFavorite = useCallback(
    async (brandId: string) => {
      if (!userId) return;
      const { error } = await supabase
        .from('user_favorite_clinics')
        .delete()
        .eq('user_id', userId)
        .eq('clinic_brand_id', brandId);

      if (error) {
        console.error('[useFavoriteClinics] remove error:', error);
        return;
      }
      await reload();
    },
    [userId, reload],
  );

  /** 토글 (있으면 제거, 없으면 추가) */
  const toggleFavorite = useCallback(
    async (brandId: string) => {
      const exists = favorites.some((f) => f.brand_id === brandId);
      if (exists) await removeFavorite(brandId);
      else await addFavorite(brandId);
    },
    [favorites, addFavorite, removeFavorite],
  );

  const isFavorite = useCallback(
    (brandId: string) => favorites.some((f) => f.brand_id === brandId),
    [favorites],
  );

  const favoriteBrandIds = favorites.map((f) => f.brand_id);

  return {
    favorites,
    favoriteBrandIds,
    loading,
    isFavorite,
    addFavorite,
    removeFavorite,
    toggleFavorite,
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
