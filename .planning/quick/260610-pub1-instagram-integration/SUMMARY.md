---
phase: quick-260610-pub1
status: code-complete (활성화는 운영자 수동 단계 대기)
date: 2026-06-10
---

# 발행 Phase 1 — Instagram 실연동 (코드 완료, 활성화 대기)

발행 로드맵 Phase 1. 인스타그램 실발행을 위한 코드(토큰 암호화·OAuth·Graph 발행 어댑터·배선)를
모두 작성. **실제 발행은 운영자의 수동 선행 작업(아래)이 끝나야 켜집니다.** 그 전까지는
미설정 상태로 정직하게 안내(연동 미설정 503).

## 만든 것 (코드)
- **토큰 암호화** `lib/publishing/crypto.ts` — AES-256-GCM(`CHANNEL_TOKEN_KEY`). 라운드트립 검증 OK.
- **InstagramAdapter** `lib/publishing/adapters/instagram.ts` — Instagram Graph Content Publishing:
  - 이미지(media→media_publish) / 캐러셀(child×N→CAROUSEL) / 릴스(REELS→status FINISHED 폴링→publish)
  - 토큰 복호화·KFTC `#AI생성` 보장·에러 재시도 분류(5xx·rate=재시도).
- **OAuth 라우트** `app/api/channels/instagram/{connect,callback}` — connect: Meta 동의 리다이렉트(CSRF state 쿠키), 미설정 503. callback: code→장기토큰→IG 비즈니스 계정 발견→channel_connections 암호화 upsert.
- **registry 배선** — `isInstagramConfigured()`(META_APP_ID/SECRET + CHANNEL_TOKEN_KEY) 시 InstagramAdapter, 아니면 mock.
- **env 예시** `.env.example` — META_APP_ID/SECRET·CHANNEL_TOKEN_KEY 문서화.

## 검증 (코드로 가능한 범위)
- tsc 0.
- connect 미설정 → 503 `instagram_not_configured`. callback 미설정 → 307 `/channels?instagram=not_configured`.
- crypto encrypt→decrypt 라운드트립 ✅.
- ⚠️ **실 발행 E2E 미검증** — Meta 자격증명·App Review·연결 계정 없이는 불가(아래 수동 단계 후 가능).

## 운영자 수동 선행 작업 (활성화 체크리스트)
1. **Meta 개발자 앱 생성** (developers.facebook.com) — Instagram Graph API 제품 추가.
2. **App Review 신청** — 권한: `instagram_content_publish`, `instagram_basic`, `pages_show_list`, `pages_read_engagement`, `business_management`. (수주 소요 → 가장 먼저 신청.)
3. **사업자 인증**(Business Verification) — 회사: 주식회사 어블러.
4. OAuth redirect URI 등록: `{NEXT_PUBLIC_APP_URL}/api/channels/instagram/callback`.
5. env 설정(.env.local + Vercel): `META_APP_ID`, `META_APP_SECRET`, `CHANNEL_TOKEN_KEY`(`openssl rand -hex 32`).
6. 각 사장님: IG 계정을 **비즈니스/크리에이터**로 전환 + **FB 페이지에 연결** → 앱에서 "Instagram 연결".

위 1~5가 끝나면 코드가 자동으로 실 OAuth/발행 경로로 전환됨(registry 게이트).

## 다음 (Phase 1 잔여 / Phase 2~)
- **UI 배선**: `components/channels` 연결 버튼을 `/api/channels/instagram/connect` 로, `distribution`/검수→발행을 publish_jobs 큐로(현재 데모 표기 유지 중).
- **HITL**: `/review-queue` 승인 건만 enqueue 되도록 연결.
- **토큰 갱신 cron**: 장기 토큰(~60일) 만료 전 갱신.
- **Phase 2**: 유튜브 쇼츠·틱톡 어댑터. **Phase 3**: 네이버/카카오 반자동. **Phase 4**: 인스타 Insights 실성과.
