-- =====================================================================
-- 어드민 권한 체계 (RBAC) — owner / admin / reviewer 3단계
-- =====================================================================
-- 목적:
--   1. admin_users.role을 3단계 enum-like로 제한 (CHECK)
--   2. 오너 1명 지정 (현재 fosccompany@gmail.com)
--   3. RPC: is_owner, is_admin, is_reviewer_or_higher
--   4. RLS: admin_users (read=어드민, write=owner), clinic_events·clinic_treatments
--   5. 락아웃 방지: 오너 본인이 자기 강등/삭제 불가 (트리거)
--   6. lookup_user_id_by_email RPC (오너만, 어드민 추가 UI용)
-- =====================================================================

BEGIN;

-- ---------------------------------------------------------------------
-- 1. role 값 제한 — 기존 CHECK 제약이 'owner' 허용 안 하므로 DROP 후 재생성
-- ---------------------------------------------------------------------
-- 기존 제약 제거 (이전 정의가 'admin' 같은 단일 값만 허용했을 수 있음)
ALTER TABLE public.admin_users DROP CONSTRAINT IF EXISTS admin_users_role_check;

-- 본인을 owner로 승격
UPDATE public.admin_users
SET role = 'owner'
WHERE user_id = '8c5b51d6-4dc9-4de4-92af-9d01291e2eb9'; -- fosccompany@gmail.com

-- 새 CHECK 제약 추가 (owner/admin/reviewer 3개 허용)
ALTER TABLE public.admin_users
  ADD CONSTRAINT admin_users_role_check
  CHECK (role IN ('owner','admin','reviewer'));

-- ---------------------------------------------------------------------
-- 2. 권한 체크 RPC
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_owner()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE user_id = auth.uid() AND role = 'owner'
  );
$$;

-- is_admin 재정의: owner + admin만 true (reviewer는 false → 쓰기 권한 없음)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE user_id = auth.uid() AND role IN ('owner','admin')
  );
$$;

CREATE OR REPLACE FUNCTION public.is_reviewer_or_higher()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE user_id = auth.uid() AND role IN ('owner','admin','reviewer')
  );
$$;

-- ---------------------------------------------------------------------
-- 3. 이메일로 user_id 조회 RPC (오너만 호출 가능)
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.lookup_user_id_by_email(p_email text)
RETURNS TABLE(user_id uuid, email text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  IF NOT public.is_owner() THEN
    RAISE EXCEPTION 'access denied: owner only';
  END IF;

  RETURN QUERY
  SELECT u.id, u.email::text
  FROM auth.users u
  WHERE lower(u.email) = lower(p_email)
  LIMIT 1;
END;
$$;

-- ---------------------------------------------------------------------
-- 4. RLS: admin_users
-- ---------------------------------------------------------------------
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_users_select_any_admin" ON public.admin_users;
CREATE POLICY "admin_users_select_any_admin"
  ON public.admin_users FOR SELECT
  USING (public.is_reviewer_or_higher());

DROP POLICY IF EXISTS "admin_users_modify_owner_only" ON public.admin_users;
CREATE POLICY "admin_users_modify_owner_only"
  ON public.admin_users FOR ALL
  USING (public.is_owner())
  WITH CHECK (public.is_owner());

-- ---------------------------------------------------------------------
-- 5. RLS: clinic_events
--    SELECT — 일반 사용자는 is_published만, 어드민(reviewer+)은 전부
--    WRITE  — admin/owner만 (reviewer는 쓰기 불가)
-- ---------------------------------------------------------------------
ALTER TABLE public.clinic_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "clinic_events_select_published_for_all" ON public.clinic_events;
CREATE POLICY "clinic_events_select_published_for_all"
  ON public.clinic_events FOR SELECT
  USING (is_published = true);

DROP POLICY IF EXISTS "clinic_events_select_all_for_admins" ON public.clinic_events;
CREATE POLICY "clinic_events_select_all_for_admins"
  ON public.clinic_events FOR SELECT
  USING (public.is_reviewer_or_higher());

DROP POLICY IF EXISTS "clinic_events_write_for_admin" ON public.clinic_events;
CREATE POLICY "clinic_events_write_for_admin"
  ON public.clinic_events FOR INSERT
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "clinic_events_update_for_admin" ON public.clinic_events;
CREATE POLICY "clinic_events_update_for_admin"
  ON public.clinic_events FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "clinic_events_delete_for_owner" ON public.clinic_events;
CREATE POLICY "clinic_events_delete_for_owner"
  ON public.clinic_events FOR DELETE
  USING (public.is_owner());

-- ---------------------------------------------------------------------
-- 6. RLS: clinic_treatments
-- ---------------------------------------------------------------------
ALTER TABLE public.clinic_treatments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "clinic_treatments_select_all" ON public.clinic_treatments;
CREATE POLICY "clinic_treatments_select_all"
  ON public.clinic_treatments FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "clinic_treatments_write_for_admin" ON public.clinic_treatments;
CREATE POLICY "clinic_treatments_write_for_admin"
  ON public.clinic_treatments FOR INSERT
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "clinic_treatments_update_for_admin" ON public.clinic_treatments;
CREATE POLICY "clinic_treatments_update_for_admin"
  ON public.clinic_treatments FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "clinic_treatments_delete_for_owner" ON public.clinic_treatments;
CREATE POLICY "clinic_treatments_delete_for_owner"
  ON public.clinic_treatments FOR DELETE
  USING (public.is_owner());

-- ---------------------------------------------------------------------
-- 7. 락아웃 방지 트리거
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_prevent_owner_lockout()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- 본인이 본인의 owner role을 다른 role로 강등 시도
  IF TG_OP = 'UPDATE'
     AND OLD.user_id = auth.uid()
     AND OLD.role = 'owner'
     AND NEW.role IS DISTINCT FROM 'owner' THEN
    RAISE EXCEPTION '자기 자신을 owner에서 강등할 수 없습니다 (락아웃 방지)';
  END IF;

  -- 본인을 admin_users에서 삭제 시도
  IF TG_OP = 'DELETE'
     AND OLD.user_id = auth.uid() THEN
    RAISE EXCEPTION '자기 자신을 admin_users에서 제거할 수 없습니다 (락아웃 방지)';
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_owner_lockout ON public.admin_users;
CREATE TRIGGER trg_prevent_owner_lockout
  BEFORE UPDATE OR DELETE ON public.admin_users
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_prevent_owner_lockout();

-- ---------------------------------------------------------------------
-- 8. 검증 (실행 후 참고)
-- ---------------------------------------------------------------------
-- 본인 role 확인
SELECT user_id, role, notes FROM public.admin_users;
-- → fosccompany@gmail.com이 owner여야 함

COMMIT;
