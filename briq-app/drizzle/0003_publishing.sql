-- 0003 — 발행(Publishing) 인프라 Phase 0 (additive, 비파괴)
--
--  · channel_connections — 채널별 OAuth 토큰 자리(평문 저장·실사용 금지, Phase 1에서 암호화)
--  · publish_jobs — 생성물 발행 큐 (cron 처리기가 capability=auto 잡 발행)
--  본인 행 읽기, 쓰기는 service_role 만 (server route → adminDb). 0001/0002 정책과 동일 결.

BEGIN;

-- ───────────────────────────────────────────────
-- 1) publish_job_status enum
-- ───────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE "publish_job_status" AS ENUM ('queued', 'processing', 'published', 'failed', 'canceled');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ───────────────────────────────────────────────
-- 2) channel_connections
-- ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "channel_connections" (
  "id"                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id"             uuid NOT NULL,
  "channel"             text NOT NULL,
  "access_token"        text,
  "refresh_token"       text,
  "scope"               text,
  "external_account_id" text,
  "connected"           boolean NOT NULL DEFAULT false,
  "expires_at"          timestamptz,
  "created_at"          timestamptz NOT NULL DEFAULT now(),
  "updated_at"          timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "channel_connections_user_channel_uq" ON "channel_connections" ("user_id", "channel");
CREATE INDEX IF NOT EXISTS "channel_connections_user_idx" ON "channel_connections" ("user_id");

ALTER TABLE "channel_connections" ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "channel_connections_select_own"
    ON "channel_connections" FOR SELECT
    USING ( user_id = auth.uid() );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DROP TRIGGER IF EXISTS channel_connections_touch_updated_at ON "channel_connections";
CREATE TRIGGER channel_connections_touch_updated_at
  BEFORE UPDATE ON "channel_connections"
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ───────────────────────────────────────────────
-- 3) publish_jobs
-- ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "publish_jobs" (
  "id"            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id"       uuid NOT NULL,
  "channel"       text NOT NULL,
  "capability"    text NOT NULL,
  "status"        "publish_job_status" NOT NULL DEFAULT 'queued',
  "payload"       jsonb NOT NULL,
  "scheduled_for" timestamptz,
  "attempts"      integer NOT NULL DEFAULT 0,
  "max_attempts"  integer NOT NULL DEFAULT 3,
  "result_ref"    text,
  "error_message" text,
  "created_at"    timestamptz NOT NULL DEFAULT now(),
  "updated_at"    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "publish_jobs_user_idx" ON "publish_jobs" ("user_id");
CREATE INDEX IF NOT EXISTS "publish_jobs_due_idx" ON "publish_jobs" ("status", "scheduled_for");

ALTER TABLE "publish_jobs" ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "publish_jobs_select_own"
    ON "publish_jobs" FOR SELECT
    USING ( user_id = auth.uid() );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DROP TRIGGER IF EXISTS publish_jobs_touch_updated_at ON "publish_jobs";
CREATE TRIGGER publish_jobs_touch_updated_at
  BEFORE UPDATE ON "publish_jobs"
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

COMMIT;
