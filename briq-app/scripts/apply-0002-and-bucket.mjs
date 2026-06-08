// 일회성 인프라 적용:
//  1) drizzle/0002_ai_video_usage.sql 을 라이브 Supabase DB 에 적용 (멱등)
//  2) Storage 공개 버킷 "briq-assets" 생성 (이미 있으면 무시)
// 실행: node --env-file=.env.local scripts/apply-0002-and-bucket.mjs
import { readFile } from "node:fs/promises";
import postgres from "postgres";
import { createClient } from "@supabase/supabase-js";

const log = (...a) => console.log(...a);

// ── 1) 마이그레이션 적용 ────────────────────────────────
async function applyMigration() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL 없음");
  const sql = await readFile(new URL("../drizzle/0002_ai_video_usage.sql", import.meta.url), "utf8");
  const client = postgres(url, { prepare: false, max: 1 });
  try {
    await client.unsafe(sql); // 파일에 BEGIN/COMMIT 포함 → 트랜잭션으로 실행됨
    log("✅ 0002 마이그레이션 적용 완료");
    const [{ col }] = await client`
      SELECT count(*)::int AS col FROM information_schema.columns
      WHERE table_name='usage_monthly' AND column_name='ai_video_count'`;
    const [{ tbl }] = await client`
      SELECT count(*)::int AS tbl FROM information_schema.tables WHERE table_name='video_jobs'`;
    log(`   검증: usage_monthly.ai_video_count=${col ? "OK" : "없음"}, video_jobs 테이블=${tbl ? "OK" : "없음"}`);
  } finally {
    await client.end();
  }
}

// ── 2) 버킷 생성 ───────────────────────────────────────
async function createBucket() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("SUPABASE URL/SERVICE_ROLE_KEY 없음");
  const sb = createClient(url, key, { auth: { persistSession: false } });

  const { data: existing } = await sb.storage.getBucket("briq-assets");
  if (existing) {
    log(`✅ 버킷 'briq-assets' 이미 존재 (public=${existing.public})`);
    if (!existing.public) {
      await sb.storage.updateBucket("briq-assets", { public: true });
      log("   → public 으로 전환");
    }
    return;
  }
  const { error } = await sb.storage.createBucket("briq-assets", { public: true });
  if (error) throw error;
  log("✅ 버킷 'briq-assets' 생성 완료 (public read)");
}

await applyMigration();
await createBucket();
log("\n🎉 전체 완료");
