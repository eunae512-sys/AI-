---
phase: quick-260609-pub0
status: complete
date: 2026-06-10
---

# 발행 인프라 Phase 0 — 기반 구축 (완료)

발행 로드맵(.planning/PUBLISHING-ROADMAP.md) Phase 0. 외부 서비스 없이 자체 완결로
**생성물 발행 큐의 백엔드 기반**을 구축. 채널 실연동은 후속 Phase에서 어댑터로 끼움.

## 배경
- 직전 실행 에이전트가 소켓 에러(인프라성)로 ~2시간 후 결과물 0으로 사망 → 오케스트레이터가 직접 단계별로 재구축.

## 만든 것
- **스키마** `lib/db/schema.ts`: `channelConnections`(토큰 자리만·평문 저장 금지), `publishJobs`(큐), `publishJobStatusEnum`(queued/processing/published/failed/canceled).
- **마이그레이션** `drizzle/0003_publishing.sql` + 멱등 적용 스크립트 `scripts/apply-0003-publishing.mjs`. RLS: 본인 행 SELECT, 쓰기는 service_role(adminDb). additive·비파괴. **라이브 DB 적용·검증 완료**.
- **어댑터 추상화** `lib/publishing/`: `PublishAdapter`(capability `auto`|`assisted`), `MockPublishAdapter`(실발행 아님 명시), `registry`(채널→capability: instagram/youtube/tiktok=auto, naver_blog/kakao=assisted), `processPublishJobs`(상태머신·재시도).
- **라우트**: `POST /api/publish`(getAuthedUser 인증, quota 없음 → enqueue), `GET/POST /api/cron/process-publish-jobs`(CRON_SECRET, auto 잡 처리). `vercel.json` cron `*/5 * * * *` 추가.

## 검증
- **tsc**: 통과(0 에러).
- **마이그레이션**: apply-0003 실행 → channel_connections·publish_jobs·publish_job_status 모두 OK.
- **라이브 E2E**: queued 잡 insert → cron 호출(Bearer CRON_SECRET) → `processed:1, published:1`, 잡 status=`published`·result_ref=`mock://...`·attempts=1. 테스트 행 정리.
- **인증 게이팅**: `/api/publish` 미인증 401, cron no-secret 401.

## 커밋
- f30177e 스키마+마이그레이션+적용스크립트
- 6919301 어댑터 추상화+mock+처리기
- 91b9f6b enqueue 라우트+cron 처리기+vercel.json

## 다음 Phase 핸드오프 (Deferred)
- **Phase 1 (인스타 실발행)**: `channel_connections` 토큰 암호화 + 실 OAuth(Meta App Review 선착수), `InstagramAdapter` 구현(registry mock 교체). 토큰 컬럼은 현재 자리만.
- **UI 재배선**: `components/channels`(연결 데모)·`components/distribution`·`scheduler`를 실 channel_connections/publish_jobs 상태에 바인딩 — 이번 범위 밖(데모 표기 유지).
- **assisted 채널(naver/kakao)**: 처리기가 자동 발행 안 함(큐에 남김) → 후속에서 "지금 올릴 시간" 알림/클립보드 핸드오프로 소비.
- **잡 큐 격상**: 현 Vercel cron 5분 폴링 → 트래픽 증가 시 Trigger.dev v3로 격상(로드맵 권장).
