-- 0002 — AI 릴스 영상 메터링
--
--  · usage_monthly.ai_video_count — 월 AI 영상 생성 카운터 (additive, 비파괴)
--  · video_jobs — fal.ai 비동기 영상 작업 추적 (service_role 쓰기, 본인 행 읽기)

BEGIN;

-- ───────────────────────────────────────────────
-- 1) usage_monthly 에 AI 영상 카운터 추가
-- ───────────────────────────────────────────────

ALTER TABLE "usage_monthly"
  ADD COLUMN IF NOT EXISTS "ai_video_count" integer NOT NULL DEFAULT 0;

-- ───────────────────────────────────────────────
-- 2) video_jobs — 비동기 영상 작업
-- ───────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE "video_job_status" AS ENUM ('queued', 'processing', 'completed', 'failed');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "video_jobs" (
  "id"             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id"        uuid NOT NULL,
  "request_id"     text NOT NULL,
  "provider"       text NOT NULL,
  "status"         "video_job_status" NOT NULL DEFAULT 'queued',
  "result_url"     text,
  "cost_usd_milli" integer NOT NULL DEFAULT 0,
  "counted"        boolean NOT NULL DEFAULT false,
  "error_message"  text,
  "created_at"     timestamptz NOT NULL DEFAULT now(),
  "updated_at"     timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "video_jobs_request_id_uq" ON "video_jobs" ("request_id");
CREATE INDEX IF NOT EXISTS "video_jobs_user_idx" ON "video_jobs" ("user_id");

-- RLS — 본인 행만 읽기, 쓰기는 service_role 만 (usage_monthly 와 동일 정책)
ALTER TABLE "video_jobs" ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "video_jobs_select_own"
    ON "video_jobs" FOR SELECT
    USING ( user_id = auth.uid() );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- updated_at 자동 갱신 트리거 (0001 의 touch_updated_at 재사용)
DROP TRIGGER IF EXISTS video_jobs_touch_updated_at ON "video_jobs";
CREATE TRIGGER video_jobs_touch_updated_at
  BEFORE UPDATE ON "video_jobs"
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

COMMIT;
