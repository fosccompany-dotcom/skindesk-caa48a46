/**
 * useClinicEvents
 *
 * Query clinic_events with brand + location join, with filtering.
 * - userEvents: 사용자 시술 화면용 (즐겨찾기 brand의 발행된 활성 이벤트만)
 * - adminEvents: admin용 (전체, 필터 가능)
 */

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ClinicEventRow {
  id: string;
  brand_id: string | null;
  location_id: string | null;
  title: string;
  description: string | null;
  image_url: string | null;
  source_url: string | null;
  source_type: string | null;
  discount_pct: number | null;
  discount_amount: number | null;
  start_date: string;
  end_date: string | null;
  is_published: boolean | null;
  created_at: string | null;
  updated_at: string | null;
  brand: {
    id: string;
    name: string;
    slug: string | null;
  } | null;
  location: {
    id: string;
    branch_name: string;
    region_sido: string | null;
    region_gugun: string | null;
  } | null;
}

const SELECT_FIELDS = `
  id, brand_id, location_id, title, description, image_url, source_url, source_type,
  discount_pct, discount_amount, start_date, end_date, is_published,
  created_at, updated_at,
  brand:clinic_brands(id, name, slug),
  location:clinic_locations(id, branch_name, region_sido, region_gugun)
`;

function normalizeRow(row: any): ClinicEventRow {
  return {
    ...row,
    brand: row.brand ?? null,
    location: row.location ?? null,
  } as ClinicEventRow;
}

/**
 * 사용자 시술 화면용 — 즐겨찾기 brand의 발행된 활성 이벤트
 *
 * @param favoriteBrandIds 즐겨찾기 brand id 배열
 */
export function useUserClinicEvents(favoriteBrandIds: string[]) {
  const [events, setEvents] = useState<ClinicEventRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    if (favoriteBrandIds.length === 0) {
      setEvents([]);
      setLoading(false);
      return;
    }

    const today = new Date().toISOString().slice(0, 10);

    const { data, error } = await supabase
      .from('clinic_events')
      .select(SELECT_FIELDS)
      .in('brand_id', favoriteBrandIds)
      .eq('is_published', true)
      .or(`end_date.is.null,end_date.gte.${today}`)
      .order('start_date', { ascending: false });

    if (error) {
      console.error('[useUserClinicEvents] error:', error);
      setEvents([]);
    } else {
      setEvents((data ?? []).map(normalizeRow));
    }
    setLoading(false);
  }, [favoriteBrandIds]);

  useEffect(() => {
    load();
  }, [load]);

  return { events, loading, reload: load };
}

/* ── Admin 전용 ─────────────────────────────────────────────────────────── */

export type AdminEventStatus = 'pending' | 'active' | 'expired' | 'all';

export function useAdminClinicEvents(status: AdminEventStatus = 'all') {
  const [events, setEvents] = useState<ClinicEventRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const today = new Date().toISOString().slice(0, 10);

    let query = supabase
      .from('clinic_events')
      .select(SELECT_FIELDS);

    if (status === 'pending') {
      query = query.eq('is_published', false);
    } else if (status === 'active') {
      query = query
        .eq('is_published', true)
        .or(`end_date.is.null,end_date.gte.${today}`);
    } else if (status === 'expired') {
      query = query.lt('end_date', today);
    }
    // 'all'은 필터 없음

    query = query.order('created_at', { ascending: false, nullsFirst: false });

    const { data, error } = await query;
    if (error) {
      console.error('[useAdminClinicEvents] error:', error);
      setEvents([]);
    } else {
      setEvents((data ?? []).map(normalizeRow));
    }
    setLoading(false);
  }, [status]);

  useEffect(() => {
    load();
  }, [load]);

  /** is_published 토글 */
  const setPublished = useCallback(
    async (eventId: string, value: boolean) => {
      const { error } = await supabase
        .from('clinic_events')
        .update({ is_published: value, updated_at: new Date().toISOString() })
        .eq('id', eventId);
      if (error) {
        console.error('[setPublished] error:', error);
        return false;
      }
      await load();
      return true;
    },
    [load],
  );

  /** 이벤트 삭제 */
  const removeEvent = useCallback(
    async (eventId: string) => {
      const { error } = await supabase
        .from('clinic_events')
        .delete()
        .eq('id', eventId);
      if (error) {
        console.error('[removeEvent] error:', error);
        return false;
      }
      await load();
      return true;
    },
    [load],
  );

  return { events, loading, reload: load, setPublished, removeEvent };
}

/** Admin 운영 카운트 */
export interface AdminStats {
  active: number;
  pending: number;
  expired: number;
  expiringSoon: number;
  byBrand: { brand_id: string; brand_name: string; active: number; pending: number; lastUpdate: string | null }[];
}

export function useAdminStats() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);
    const sevenLater = new Date(today);
    sevenLater.setDate(today.getDate() + 7);
    const sevenLaterStr = sevenLater.toISOString().slice(0, 10);

    const { data: allEvents, error } = await supabase
      .from('clinic_events')
      .select('id, brand_id, is_published, end_date, start_date, updated_at, brand:clinic_brands(id, name)');

    if (error) {
      console.error('[useAdminStats] error:', error);
      setStats(null);
      setLoading(false);
      return;
    }

    const rows = (allEvents ?? []) as any[];
    const active = rows.filter(
      (r) => r.is_published === true && (r.end_date === null || r.end_date >= todayStr),
    ).length;
    const pending = rows.filter((r) => r.is_published === false).length;
    const expired = rows.filter((r) => r.end_date && r.end_date < todayStr).length;
    const expiringSoon = rows.filter(
      (r) =>
        r.is_published === true &&
        r.end_date &&
        r.end_date >= todayStr &&
        r.end_date <= sevenLaterStr,
    ).length;

    // brand별 집계
    const brandMap = new Map<
      string,
      { brand_id: string; brand_name: string; active: number; pending: number; lastUpdate: string | null }
    >();
    for (const r of rows) {
      if (!r.brand_id || !r.brand) continue;
      const key = r.brand_id as string;
      if (!brandMap.has(key)) {
        brandMap.set(key, {
          brand_id: key,
          brand_name: r.brand.name,
          active: 0,
          pending: 0,
          lastUpdate: null,
        });
      }
      const entry = brandMap.get(key)!;
      if (r.is_published === true && (r.end_date === null || r.end_date >= todayStr)) {
        entry.active += 1;
      }
      if (r.is_published === false) entry.pending += 1;
      const upd = r.updated_at ?? r.start_date;
      if (upd && (!entry.lastUpdate || upd > entry.lastUpdate)) entry.lastUpdate = upd;
    }

    setStats({
      active,
      pending,
      expired,
      expiringSoon,
      byBrand: Array.from(brandMap.values()).sort((a, b) => b.active - a.active),
    });
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { stats, loading, reload: load };
}
