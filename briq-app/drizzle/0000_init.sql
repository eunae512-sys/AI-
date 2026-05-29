-- Phase 1 / Migration 0000 — Toss 자동결제 인프라 초기 스키마
--
-- 적용 방법
--   1) Supabase Studio → SQL Editor 에 이 파일을 통째로 붙여넣어 실행
--      또는
--   2) DATABASE_URL 환경변수가 설정된 상태에서 `pnpm db:push`
--
-- 0001_rls_and_triggers.sql 을 반드시 이 다음에 적용해야 RLS 가 켜진다.

BEGIN;

-- ───────── Enums ─────────
CREATE TYPE "plan_id" AS ENUM ('free', 'pro', 'studio', 'agency');
CREATE TYPE "subscription_status" AS ENUM ('trialing', 'active', 'past_due', 'cancelled');
CREATE TYPE "billing_cycle" AS ENUM ('monthly', 'annual');
CREATE TYPE "payment_status" AS ENUM ('pending', 'paid', 'failed', 'cancelled');
CREATE TYPE "webhook_status" AS ENUM ('received', 'processed', 'failed');

-- ───────── profiles ─────────
CREATE TABLE "profiles" (
  "id"                  uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  "email"               text NOT NULL,
  "display_name"        text,
  "plan_id"             plan_id NOT NULL DEFAULT 'free',
  "current_period_end"  timestamptz,
  "trial_ends_at"       timestamptz,
  "created_at"          timestamptz NOT NULL DEFAULT now(),
  "updated_at"          timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX "profiles_email_idx"      ON "profiles" ("email");
CREATE INDEX "profiles_period_end_idx" ON "profiles" ("current_period_end");

-- ───────── billing_keys ─────────
CREATE TABLE "billing_keys" (
  "id"                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id"             uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  "toss_billing_key"    text NOT NULL,
  "customer_key"        text NOT NULL,
  "card_company"        text,
  "card_number_masked"  text,
  "card_type"           text,
  "issuer_code"         text,
  "owner_type"          text,
  "created_at"          timestamptz NOT NULL DEFAULT now(),
  "deleted_at"          timestamptz
);
-- 한 사용자에게 활성 카드는 동시에 최대 1개
CREATE UNIQUE INDEX "billing_keys_user_active_uq"
  ON "billing_keys" ("user_id")
  WHERE "deleted_at" IS NULL;
CREATE UNIQUE INDEX "billing_keys_customer_key_uq"
  ON "billing_keys" ("customer_key");

-- ───────── subscriptions ─────────
CREATE TABLE "subscriptions" (
  "id"                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id"                uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  "plan_id"                plan_id NOT NULL,
  "status"                 subscription_status NOT NULL,
  "billing_cycle"          billing_cycle NOT NULL,
  "billing_key_id"         uuid REFERENCES "billing_keys"("id") ON DELETE SET NULL,
  "trial_ends_at"          timestamptz,
  "current_period_start"   timestamptz NOT NULL,
  "current_period_end"     timestamptz NOT NULL,
  "price_amount"           integer NOT NULL,
  "failure_count"          integer NOT NULL DEFAULT 0,
  "last_failure_at"        timestamptz,
  "cancel_at_period_end"   boolean NOT NULL DEFAULT false,
  "cancelled_at"           timestamptz,
  "cancel_reason"          text,
  "created_at"             timestamptz NOT NULL DEFAULT now(),
  "updated_at"             timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX "subscriptions_user_idx"
  ON "subscriptions" ("user_id");
CREATE INDEX "subscriptions_status_period_end_idx"
  ON "subscriptions" ("status", "current_period_end");
-- 한 사용자에게 활성/체험중 구독은 동시에 최대 1개 (해지된 행은 히스토리로 남음)
CREATE UNIQUE INDEX "subscriptions_one_active_per_user_uq"
  ON "subscriptions" ("user_id")
  WHERE "status" IN ('trialing', 'active', 'past_due');

-- ───────── payment_history ─────────
CREATE TABLE "payment_history" (
  "id"                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id"           uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  "subscription_id"   uuid NOT NULL REFERENCES "subscriptions"("id") ON DELETE CASCADE,
  "order_id"          text NOT NULL,
  "toss_payment_key"  text,
  "method"            text,
  "receipt_url"       text,
  "amount"            integer NOT NULL,
  "status"            payment_status NOT NULL,
  "failure_code"      text,
  "failure_message"   text,
  "requested_at"      timestamptz NOT NULL DEFAULT now(),
  "paid_at"           timestamptz
);
CREATE UNIQUE INDEX "payment_history_order_id_uq" ON "payment_history" ("order_id");
CREATE INDEX        "payment_history_user_idx"         ON "payment_history" ("user_id");
CREATE INDEX        "payment_history_subscription_idx" ON "payment_history" ("subscription_id");

-- ───────── usage_monthly ─────────
CREATE TABLE "usage_monthly" (
  "user_id"         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  "year_month"      text NOT NULL,                       -- "2026-05"
  "cardnews_count"  integer NOT NULL DEFAULT 0,
  "blog_count"      integer NOT NULL DEFAULT 0,
  "ai_image_count"  integer NOT NULL DEFAULT 0,
  "updated_at"      timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("user_id", "year_month")
);

-- ───────── webhook_events ─────────
CREATE TABLE "webhook_events" (
  "id"               bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  "idempotency_key"  text NOT NULL,
  "event_type"       text NOT NULL,
  "payload"          jsonb NOT NULL,
  "status"           webhook_status NOT NULL DEFAULT 'received',
  "received_at"      timestamptz NOT NULL DEFAULT now(),
  "processed_at"     timestamptz,
  "error_message"    text
);
CREATE UNIQUE INDEX "webhook_events_idempotency_uq" ON "webhook_events" ("idempotency_key");
CREATE INDEX        "webhook_events_status_idx"     ON "webhook_events" ("status");

COMMIT;
