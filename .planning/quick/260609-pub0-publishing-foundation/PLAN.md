---
phase: quick-260609-pub0
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - briq-app/lib/db/schema.ts
  - briq-app/drizzle/0003_publishing.sql
  - briq-app/scripts/apply-0003-publishing.mjs
  - briq-app/lib/publishing/types.ts
  - briq-app/lib/publishing/adapters/mock.ts
  - briq-app/lib/publishing/registry.ts
  - briq-app/app/api/publish/route.ts
  - briq-app/app/api/cron/process-publish-jobs/route.ts
  - briq-app/vercel.json
requirements:
  - PUB-SCHEMA-01
  - PUB-ADAPTER-02
  - PUB-QUEUE-03

must_haves:
  truths:
    - "channel_connections·publish_jobs 테이블이 Drizzle 스키마+마이그레이션으로 존재하고 라이브 DB에 적용된다 (additive·비파괴, RLS 격리)"
    - "PublishAdapter 추상화(capability: auto|assisted)가 존재하고 mock 어댑터가 등록된다 — 채널별 실연동은 후속 Phase에서 이 인터페이스로 끼움"
    - "POST /api/publish 가 인증 사용자만 publish_jobs 행을 enqueue(status=queued) 한다"
    - "GET/POST /api/cron/process-publish-jobs 가 CRON_SECRET 인증 후 due 큐 잡을 어댑터로 처리하고 상태머신(queued→processing→published/failed, 재시도 카운트)을 갱신한다"
    - "발행본 KFTC AI 라벨/정직성 정책 자리(메타)가 잡 페이로드에 보존된다 (실제 라벨 부착은 채널 어댑터 책임)"
    - "tsc 통과 + 라이브 스모크: 잡 1건 enqueue→cron 처리→status=published 확인, /api/publish 미인증 401"
  artifacts:
    - path: "briq-app/lib/db/schema.ts"
      provides: "channelConnections·publishJobs 테이블 + publishJobStatusEnum"
      contains: "publishJobs"
    - path: "briq-app/lib/publishing/types.ts"
      provides: "PublishAdapter 인터페이스 + capability"
      contains: "PublishAdapter"
    - path: "briq-app/app/api/cron/process-publish-jobs/route.ts"
      provides: "발행 잡 처리기(상태머신·재시도)"
      contains: "CRON_SECRET"
  key_links:
    - from: "briq-app/app/api/cron/process-publish-jobs/route.ts"
      to: "lib/publishing/registry"
      via: "getAdapter(channel).publish(asset) 호출 + 상태 갱신"
      pattern: "getAdapter"
---

<objective>
발행 연동 로드맵(.planning/PUBLISHING-ROADMAP.md) Phase 0 — 발행 인프라 기반을 구축한다. 외부 서비스(Trigger.dev·Meta App Review) 없이 자체 완결: 토큰/잡 스키마 + 어댑터 추상화 + enqueue 라우트 + cron 처리기 + mock 어댑터로 end-to-end 흐름을 닫는다. 채널별 실연동(인스타 등)은 후속 Phase에서 이 어댑터 인터페이스에 끼운다.

Trigger.dev 미설치 → 기존 Vercel cron + CRON_SECRET 패턴(app/api/cron/recurring-billing 참조)을 v1 처리기로 사용. (로드맵엔 Trigger.dev가 향후 권장으로 기록됨.)
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@./CLAUDE.md
@.planning/PUBLISHING-ROADMAP.md
@.planning/STATE.md

<conventions>
- Drizzle 스키마: briq-app/lib/db/schema.ts. pgEnum 예: `planIdEnum`, `videoJobStatusEnum = pgEnum("video_job_status",[...])`. 테이블 예: videoJobs(uuid id defaultRandom, userId uuid, text, enum status default, timestamps, index/unique). 타입 export: `export type X = typeof t.$inferSelect`.
- 마이그레이션: drizzle/000N_*.sql. RLS/트리거 패턴은 drizzle/0001_rls_and_triggers.sql 참조(service_role 정책 등). 적용은 idempotent node 스크립트(scripts/apply-0002-and-bucket.mjs 패턴: `postgres(url,{prepare:false,max:1})`, `client.unsafe(sql)`, `node --env-file=.env.local`). CREATE TABLE IF NOT EXISTS / DROP POLICY IF EXISTS 로 멱등.
- cron 인증: app/api/cron/recurring-billing/route.ts — GET·POST 둘 다, `authorization === Bearer ${CRON_SECRET}`, runtime nodejs, maxDuration 300. vercel.json "crons" 배열에 등록.
- enqueue 인증: lib/billing/auth-helper.ts `getAuthedUser()` → `{ok:true,user}` | `{ok:false,response}`. (발행은 AI 생성이 아니므로 quota 게이팅 없이 인증만.)
- DB 클라: lib/db 의 기존 drizzle 인스턴스 사용(다른 라우트 참조).
</conventions>

<tasks>

## 1. 스키마 — lib/db/schema.ts
- `publishJobStatusEnum = pgEnum("publish_job_status", ["queued","processing","published","failed","canceled"])`.
- `channelConnections` 테이블: id(uuid pk defaultRandom), userId(uuid notNull), channel(text — "instagram"|"youtube"|"tiktok"|"naver_blog"|"kakao" 등 문자열), accessToken(text, nullable), refreshToken(text, nullable), scope(text nullable), externalAccountId(text nullable), connected(boolean default false), expiresAt(timestamptz nullable), createdAt/updatedAt. unique(userId, channel). 토큰은 평문 저장 금지 주석 — 후속에서 암호화(지금은 nullable·미사용, 스키마 자리만).
- `publishJobs` 테이블: id(uuid pk), userId(uuid notNull), channel(text notNull), capability(text notNull — "auto"|"assisted"), status(publishJobStatusEnum default "queued"), payload(jsonb notNull — {caption?, hashtags?, mediaUrls?, title?, body?, aiLabeled?:boolean, sourceId?}), scheduledFor(timestamptz nullable — null=즉시), attempts(integer default 0), maxAttempts(integer default 3), resultRef(text nullable — 발행된 외부 post id/url), errorMessage(text nullable), createdAt/updatedAt. index(userId), index(status, scheduledFor).
- 타입 export(ChannelConnection/PublishJob + insert).

## 2. 마이그레이션 — drizzle/0003_publishing.sql + 적용 스크립트
- 0003_publishing.sql: 위 enum/2테이블 CREATE (IF NOT EXISTS), 인덱스, **RLS enable + 정책**(0001 패턴): 본인 행만 select/insert/update(`auth.uid() = user_id`), service_role 전체 허용. enum은 `DO $$ ... CREATE TYPE ... EXCEPTION WHEN duplicate_object` 멱등.
- scripts/apply-0003-publishing.mjs: apply-0002 패턴으로 0003 sql 적용 + 검증(information_schema 로 두 테이블 존재 확인). `node --env-file=.env.local scripts/apply-0003-publishing.mjs`.

## 3. 어댑터 추상화 — lib/publishing/
- types.ts:
  - `export type PublishChannel = "instagram"|"youtube"|"tiktok"|"naver_blog"|"kakao";`
  - `export type PublishCapability = "auto"|"assisted";`
  - `export type PublishAsset = { caption?: string; hashtags?: string[]; mediaUrls?: string[]; title?: string; body?: string; aiLabeled?: boolean };`
  - `export type PublishResult = { ok: true; externalRef?: string } | { ok: false; error: string; retryable: boolean };`
  - `export interface PublishAdapter { channel: PublishChannel; capability: PublishCapability; isConnected(userId: string): Promise<boolean>; publish(userId: string, asset: PublishAsset): Promise<PublishResult>; }`
- adapters/mock.ts: `MockPublishAdapter`(channel "instagram", capability "auto") — isConnected→true, publish→성공(externalRef "mock://...") 반환. (스모크/개발용. 정직성: 실제 발행 아님을 주석 명시.)
- registry.ts: `getAdapter(channel): PublishAdapter` — 지금은 전부 mock 반환(또는 instagram=mock, 나머지 assisted-mock). `getCapability(channel)` 도 노출.

## 4. enqueue 라우트 — app/api/publish/route.ts
- runtime nodejs. POST: getAuthedUser() — 미인증이면 그 response 반환(401). body {channel, asset, scheduledFor?} 검증(channel 유효·asset 존재). capability=getCapability(channel). publish_jobs insert(userId, channel, capability, status "queued", payload=asset, scheduledFor). 반환 {ok:true, jobId}.
- (assisted 채널은 자동발행 대상 아님 — 잡은 만들되 처리기가 "assisted는 알림/핸드오프"로 분기. 이번엔 자리만: 처리기에서 assisted는 skip+상태 유지 또는 별도 처리. 최소구현: auto만 처리, assisted는 그대로 queued 유지하고 주석.)

## 5. 처리기 cron — app/api/cron/process-publish-jobs/route.ts
- recurring-billing cron 패턴 복제(GET·POST, CRON_SECRET Bearer, runtime nodejs, maxDuration 300).
- 로직: 처리 함수(lib/publishing/process-jobs.ts 또는 라우트 내): status="queued" AND capability="auto" AND (scheduledFor IS NULL OR scheduledFor<=now) 인 잡 N건(예 limit 20) 조회 → 각: status="processing"로 마킹 → getAdapter(channel).publish(userId, payload) → 성공이면 status="published"+resultRef, 실패+retryable+attempts<maxAttempts면 status="queued"+attempts++ (다음 틱 재시도), 실패+비재시도(또는 attempts 초과)면 status="failed"+errorMessage. updatedAt 갱신. 반환 {processed, published, failed, retried}.
- vercel.json crons 에 `{ "path":"/api/cron/process-publish-jobs", "schedule":"*/5 * * * *" }` 추가(5분마다).

</tasks>

<verification>
1. cd briq-app && ./node_modules/.bin/tsc --noEmit -p tsconfig.json 통과.
2. 마이그레이션 적용: node --env-file=.env.local scripts/apply-0003-publishing.mjs → channel_connections·publish_jobs 존재 확인(스크립트 검증 출력). (additive·비파괴 — 기존 테이블 무영향.)
3. 라이브 스모크(node --env-file 스크립트, briq-app 안에 두고 실행 후 삭제):
   a. service-role(또는 직접 postgres)로 publish_jobs 에 queued 잡 1건 insert(channel "instagram", capability "auto", payload 샘플, scheduledFor null).
   b. /api/cron/process-publish-jobs 를 `Authorization: Bearer $CRON_SECRET` 로 호출.
   c. 해당 잡 status="published", resultRef 채워짐 확인. → end-to-end 닫힘.
4. /api/publish 를 인증 없이 POST → 401 (게이팅 확인).
5. 회귀 없음: 기존 마이그레이션/cron(recurring-billing)·다른 라우트 무영향.

정직성: mock 어댑터는 "실제 발행 아님"을 코드/주석에 명시. UI(channels/distribution)의 "데모" 표기는 이번 범위에서 변경하지 않음(후속 Phase에서 실연동과 함께).
</verification>

<constraints>
- 라이브 DB 변경은 additive(새 테이블·enum·정책)만 — 기존 테이블 ALTER/DROP 금지. 멱등 스크립트로 적용.
- 토큰 컬럼은 자리만(평문 저장·실사용 금지) — 실 OAuth/암호화는 후속 Phase 1.
- UI 재배선·실 채널 연동은 이번 범위 밖(스키마·큐·어댑터 골격까지).
- 원자 커밋, 한국어. 분리 권장: (a)스키마+마이그레이션+적용스크립트 (b)어댑터 추상화 (c)enqueue+cron 처리기+vercel.json.
</constraints>
