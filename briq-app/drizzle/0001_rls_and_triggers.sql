-- Phase 1 / Migration 0001 — RLS 정책 + auth.users 가입 trigger
--
-- 적용 방법
--   0000_init.sql 적용 후 Supabase Studio SQL Editor 또는 `pnpm db:push` 로 실행.
--
-- 핵심 원칙
--   · 모든 사용자 데이터 테이블은 RLS 강제. user_id = auth.uid() 인 행만 SELECT/INSERT/UPDATE/DELETE.
--   · billing_keys / subscriptions / payment_history 의 쓰기는 service_role 만 (사용자가
--     클라이언트에서 임의로 구독 상태를 만들 수 없게). 사용자는 자기 행 READ 만.
--   · webhook_events 는 service_role 전용. anon/authenticated 는 접근 불가.
--   · auth.users 에 새 사용자가 만들어지면 profiles 행을 자동 생성.

BEGIN;

-- ───────────────────────────────────────────────
-- 1) RLS 활성화
-- ───────────────────────────────────────────────

ALTER TABLE "profiles"         ENABLE ROW LEVEL SECURITY;
ALTER TABLE "billing_keys"     ENABLE ROW LEVEL SECURITY;
ALTER TABLE "subscriptions"    ENABLE ROW LEVEL SECURITY;
ALTER TABLE "payment_history"  ENABLE ROW LEVEL SECURITY;
ALTER TABLE "usage_monthly"    ENABLE ROW LEVEL SECURITY;
ALTER TABLE "webhook_events"   ENABLE ROW LEVEL SECURITY;

-- ───────────────────────────────────────────────
-- 2) profiles 정책
-- ───────────────────────────────────────────────
--  사용자는 자기 행을 읽고 직접 수정(display_name 등)할 수 있다.
--  plan_id / current_period_end 같은 결제 상태 컬럼은 트리거 또는 service_role 만 변경.
--  (앱 레벨에서 plan_id 변경을 막을 수 없으므로, 신뢰 경계는 RPC + service_role 호출로.)

CREATE POLICY "profiles_select_own"
  ON "profiles" FOR SELECT
  USING ( id = auth.uid() );

CREATE POLICY "profiles_update_own"
  ON "profiles" FOR UPDATE
  USING ( id = auth.uid() )
  WITH CHECK ( id = auth.uid() );

-- INSERT 는 trigger 와 service_role 만 (정책 없음 = 거부)

-- ───────────────────────────────────────────────
-- 3) billing_keys 정책
-- ───────────────────────────────────────────────
--  사용자는 자기 활성 카드 정보를 읽기만. 등록/삭제는 모두 server route → service_role.

CREATE POLICY "billing_keys_select_own"
  ON "billing_keys" FOR SELECT
  USING ( user_id = auth.uid() );

-- INSERT/UPDATE/DELETE 정책 없음 = authenticated 는 거부 → service_role 만

-- ───────────────────────────────────────────────
-- 4) subscriptions 정책
-- ───────────────────────────────────────────────

CREATE POLICY "subscriptions_select_own"
  ON "subscriptions" FOR SELECT
  USING ( user_id = auth.uid() );

-- 쓰기는 service_role 만

-- ───────────────────────────────────────────────
-- 5) payment_history 정책
-- ───────────────────────────────────────────────

CREATE POLICY "payment_history_select_own"
  ON "payment_history" FOR SELECT
  USING ( user_id = auth.uid() );

-- 쓰기는 service_role 만

-- ───────────────────────────────────────────────
-- 6) usage_monthly 정책
-- ───────────────────────────────────────────────
--  사용량은 사용자가 자기 행을 읽고, 서버 측 RPC 가 증분.
--  사용자 직접 UPDATE 를 허용하면 가짜 카운터로 limit 우회 가능 → 쓰기는 service_role 만.

CREATE POLICY "usage_monthly_select_own"
  ON "usage_monthly" FOR SELECT
  USING ( user_id = auth.uid() );

-- ───────────────────────────────────────────────
-- 7) webhook_events 정책
-- ───────────────────────────────────────────────
--  authenticated/anon 모두 접근 불가. 정책을 만들지 않으면 RLS 가 모든 행을 가린다.
--  service_role 만 접근.

-- (의도적으로 정책 없음)

-- ───────────────────────────────────────────────
-- 8) auth.users insert → profiles 자동 생성 trigger
-- ───────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, plan_id)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', NULL),
    'free'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ───────────────────────────────────────────────
-- 9) updated_at 자동 갱신 trigger
-- ───────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_touch_updated_at
  BEFORE UPDATE ON "profiles"
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TRIGGER subscriptions_touch_updated_at
  BEFORE UPDATE ON "subscriptions"
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TRIGGER usage_monthly_touch_updated_at
  BEFORE UPDATE ON "usage_monthly"
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ───────────────────────────────────────────────
-- 10) 기존 auth.users 백필 (이미 가입한 사용자에게 profiles 생성)
-- ───────────────────────────────────────────────

INSERT INTO public.profiles (id, email, display_name, plan_id)
SELECT
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', NULL),
  'free'
FROM auth.users u
ON CONFLICT (id) DO NOTHING;

COMMIT;
