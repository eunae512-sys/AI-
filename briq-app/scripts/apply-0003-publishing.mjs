// 일회성 인프라 적용:
//   drizzle/0003_publishing.sql 을 라이브 Supabase DB 에 적용 (멱등, additive)
//   → channel_connections · publish_jobs 테이블 생성 + RLS.
// 실행: node --env-file=.env.local scripts/apply-0003-publishing.mjs
import { readFile } from "node:fs/promises";
import postgres from "postgres";

const log = (...a) => console.log(...a);

async function applyMigration() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL 없음");
  const sql = await readFile(new URL("../drizzle/0003_publishing.sql", import.meta.url), "utf8");
  const client = postgres(url, { prepare: false, max: 1 });
  try {
    await client.unsafe(sql); // 파일에 BEGIN/COMMIT 포함 → 트랜잭션 실행
    log("✅ 0003 마이그레이션 적용 완료");
    const [{ cc }] = await client`
      SELECT count(*)::int AS cc FROM information_schema.tables WHERE table_name='channel_connections'`;
    const [{ pj }] = await client`
      SELECT count(*)::int AS pj FROM information_schema.tables WHERE table_name='publish_jobs'`;
    const [{ en }] = await client`
      SELECT count(*)::int AS en FROM pg_type WHERE typname='publish_job_status'`;
    log(`   검증: channel_connections=${cc ? "OK" : "없음"}, publish_jobs=${pj ? "OK" : "없음"}, publish_job_status enum=${en ? "OK" : "없음"}`);
  } finally {
    await client.end();
  }
}

applyMigration().catch((e) => {
  console.error("❌ 적용 실패:", e?.message ?? e);
  process.exit(1);
});
