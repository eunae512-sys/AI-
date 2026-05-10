# Roadmap: AdOps AI

## Overview

AdOps AI는 한국 SMB 광고대행사의 사내 도구로, 클라이언트 브랜드 프로필 → 톤 → 캠페인 브리프 → 채널별 한국어 카피·릴스·블로그·상세·상품·카드뉴스를 일괄 생성·검토하는 AI 마케팅 운영 플랫폼이다. 본 로드맵은 리서치 결론과 MVP-ARCHITECTURE.md가 공통적으로 강조하는 **플랫폼-우선 순서**(Foundation → AI Gateway → Campaign+HITL → Short-form → Long-form → Operations)를 6개 페이즈로 구현한다. Phase 1~2는 사용자에게 직접 보이는 산출물 없이 멀티테넌시·RLS·AI 게이트웨이·비용 통제·가드레일·톤 학습이라는 플랫폼 레이어를 만든다 — 이걸 건너뛰면 retrofit 비용이 폭증하고, 한 번의 야간 LLM 청구서 또는 한 건의 의료광고 위반이 부트스트랩을 끝낼 수 있다. Phase 3에서 첫 사용자 가치(캠페인 브리프 + HITL 검토 큐)가 도달하고, Phase 4~5에서 10가지 콘텐츠 종류(F4~F10)를 짧은 형식 → 긴 형식 순서로 추가하며, Phase 6에서 비용 대시보드·검색·역할 관리·한국어 스타일 린터로 운영성을 마무리한다.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Foundation & Multi-Tenant Data Model** - Next.js + Supabase 부트스트랩, Auth + RLS day-1, 멀티테넌시 스키마, 클라이언트/브랜드킷/자산 라이브러리, PII 마스킹, 감사 로그 (covers F1)
- [ ] **Phase 2: AI Gateway + Cost Control + Brand Voice** - 게이트웨이 단일 통로, prompt cache, 일/월 비용 게이트, 의료/금융/식품 deny-list 인프라, 톤 학습 (covers F2 + AIGW + SAFE infra)
- [ ] **Phase 3: Campaign Brief + HITL Review** - 캠페인 엔티티, AI 브리프 스트리밍 생성, 클레임 기반 검토 큐, 의료/금융/식품 active critic 가드레일 (covers F3 + RVW)
- [ ] **Phase 4: Short-form Content Cluster** - 채널 fan-out 오케스트레이션 + 광고 카피 (Meta/Google/네이버 검색) (covers F4 + F5)
- [ ] **Phase 5: Long-form Content Cluster** - 릴스 스크립트 + 블로그 초안 + 상세페이지 + 상품 설명 + 카드뉴스 (covers F6 + F7 + F8 + F9 + F10)
- [ ] **Phase 6: Operations & Hardening** - 비용 대시보드, 검색·재사용, 한국어 스타일 린터, 역할/멤버 관리, 모바일 대응, Sentry/PostHog (covers OPS + UI polish)

## Phase Details

### Phase 1: Foundation & Multi-Tenant Data Model
**Goal**: 멀티테넌시·인증·RLS·도메인 스키마·클라이언트 브랜드킷·자산 라이브러리가 day-1부터 안전하게 동작한다 — 이후 모든 페이즈가 이 위에 retrofit 없이 쌓인다.
**Depends on**: Nothing (first phase)
**Requirements**: AUTH-01, AUTH-02, AUTH-03, AUTH-04, AUTH-05, AUTH-06, AUTH-07, CLNT-01, CLNT-02, CLNT-03, CLNT-04, CLNT-05, CLNT-06, OPS-04, UI-01, UI-03
**Success Criteria** (what must be TRUE):
  1. 직원이 이메일·비밀번호로 가입·로그인하고, 비밀번호 재설정 메일을 받을 수 있으며, 세션이 새로고침 후에도 유지된다 (AUTH-01..04 검증).
  2. 보호된 라우트(`/clients`, `/campaigns` 등)에 비로그인 접근 시 `/login`으로 리다이렉트되고, 관리자(admin)가 멤버를 초대해 admin/planner/operator/designer/viewer 역할을 지정할 수 있다 (AUTH-05, AUTH-06).
  3. 모든 도메인 테이블(`clients`, `brand_assets`, `campaigns`, `contents`, `content_revisions`, `approvals`, `prompt_logs` 등)에 RLS가 force 모드로 활성화되며, 다른 에이전시/클라이언트의 데이터에 직접 SQL이나 API로 접근하면 0행이 반환된다 (AUTH-07).
  4. 사용자가 클라이언트(광고주)를 생성·검색·필터(업종/상태/태그)·편집·아카이브하며, 상세 화면에서 요약·브랜드킷(슬로건/톤 키워드/컬러/로고/금지어/필수어)·자산·최근 캠페인을 한 화면에서 본다 (CLNT-01..04, CLNT-06).
  5. 사용자가 브랜드 자산(로고·제품 이미지·과거 카피·참고자료)을 비공개 Supabase Storage 버킷에 업로드하고 signed URL로만 접근하며, env 키는 zod로 검증되어 서버 전용 키가 클라이언트 번들로 새지 않는다 (CLNT-05, OPS-04).
  6. UI 텍스트가 모두 한국어이며 shadcn/ui + Tailwind CSS 기반의 일관된 디자인 시스템으로 렌더된다 (UI-01, UI-03).
**Plans**: TBD

### Phase 2: AI Gateway + Cost Control + Brand Voice
**Goal**: 모든 LLM 호출이 단일 게이트웨이를 통과해 캐싱·비용 측정·예산 게이트·가드레일이 적용되며, 클라이언트별 톤 프로파일이 추출·저장되어 이후 모든 콘텐츠 생성에 자동 주입된다 — 첫 카피 기능이 나가기 전에 비용·안전 인프라가 자리 잡는다.
**Depends on**: Phase 1
**Requirements**: TONE-01, TONE-02, TONE-03, TONE-04, AIGW-01, AIGW-02, AIGW-03, AIGW-04, AIGW-05, AIGW-06, SAFE-01, SAFE-04
**Success Criteria** (what must be TRUE):
  1. 모든 LLM 호출이 `lib/ai/gateway.ts` 단일 진입점을 통과하며 (도메인 코드의 직접 SDK import는 lint로 차단), 게이트웨이가 kind별 modelPref 기반으로 OpenAI ↔ Anthropic Claude 라우팅을 수행한다 (AIGW-01, AIGW-02).
  2. 시스템 + 브랜드킷 + 가드레일 + few-shot 블록이 prompt cache 대상으로 묶여 Anthropic `cache_control` / OpenAI 자동 캐시에 태워지고, cache_hit 비율이 `prompt_logs`에 기록·측정된다 (AIGW-03, AIGW-04).
  3. 일/월 비용 한도(전역·에이전시·클라이언트별)가 설정되어 초과 시 LLM 호출 자체가 429로 사전 차단되며, 모든 호출의 토큰·KRW 비용·latency가 `prompt_logs`에 영속된다 (AIGW-05, AIGW-04).
  4. 사용자가 톤 학습용 샘플을 업로드하면 AI가 톤 프로파일(voice/formality/persona/vocabulary/do/dont)을 추출하고, 사용자가 미리보기·수정 후 버전 관리되어 저장되며, 이후 모든 콘텐츠 생성 프롬프트에 가장 최신 활성 프로파일이 자동 주입된다 (TONE-01..04).
  5. 시스템 프롬프트 단계에서 표시광고법 금지 표현(최고/100%/1위/완치 등) deny-list가 주입되며, 업종별 deny-list/must-include 매핑이 `lib/prompts/shared/guardrails.ts`에서 단일 소스로 관리된다 (SAFE-01, SAFE-04).
  6. 톤 학습 결과 미리보기 등 모든 AI 호출이 사용자에게 토큰 단위 스트리밍으로 렌더된다 (AIGW-06).
**Plans**: TBD

### Phase 3: Campaign Brief + HITL Review
**Goal**: 사용자가 캠페인을 생성하고 AI가 스트리밍으로 브리프를 만들며, 모든 생성된 콘텐츠가 자동 게시되지 않고 클레임 기반 검토 큐를 거쳐야 승인되도록 — 광고 카피 품질·법적 리스크 방어선이 첫 콘텐츠 생성보다 먼저 자리 잡는다.
**Depends on**: Phase 2
**Requirements**: CAMP-01, CAMP-02, CAMP-03, CAMP-04, CAMP-05, RVW-01, RVW-02, RVW-03, RVW-04, RVW-05, RVW-06, SAFE-02, SAFE-03, UI-02
**Success Criteria** (what must be TRUE):
  1. 사용자가 캠페인 위저드(클라이언트 → 목표/타겟 → 기간 → AI 브리프 생성)를 통해 캠페인을 생성하며, AI가 메시지·채널 믹스·KPI·후크·일정 힌트를 토큰 스트리밍으로 출력하고 사용자가 편집·확정한다 (CAMP-01, CAMP-02, CAMP-03).
  2. 캠페인 목록을 status(draft/active/paused/done) 탭으로 필터하고, 캠페인 상세에서 브리프·채널 탭·생성된 콘텐츠를 한 화면에서 확인한다 (CAMP-04, CAMP-05).
  3. 모든 생성된 콘텐츠는 `status=draft`로 저장되고 자동 게시되지 않으며, 사용자가 `in_review`로 제출하면 권한 있는 검토자가 승인·반려·수정요청 결정을 코멘트와 함께 남긴다 — 모든 결정이 `approvals`에 감사 로그로, 본문 변경이 `content_revisions`에 스냅샷으로 영속된다 (RVW-01, RVW-02, RVW-03, RVW-04, RVW-05).
  4. 검토 큐(`/review`)에서 검토자가 역할별·클라이언트별 필터로 자기 작업을 보고, Tiptap 기반 편집기가 한글 IME 조합을 정확히 처리한다 (RVW-06, UI-02).
  5. 의료·금융·식품 업종으로 태깅된 클라이언트의 콘텐츠는 critic LLM 1회를 통과해야만 승인 상태로 전이 가능하며, 출력에서 사실 클레임이 자동 추출되어 `ClaimChecklist` UI로 검토자에게 노출된다 (SAFE-02, SAFE-03).
**Plans**: TBD

**Research flag**: Phase 3 진입 전 추가 리서치 필수 — 의료법 §56, 표시광고법 §3, 식약처/식품광고 가이드, 금융위 광고 가이드라인을 deny-list 표현 사전과 critic 프롬프트에 반영. 도메인 특화·고위험 영역으로 표준 패턴이 아니다.

### Phase 4: Short-form Content Cluster
**Goal**: 한 캠페인 브리프가 채널 N개로 fan-out되어 짧은 형식 광고 카피(헤드라인/본문/CTA/해시태그)가 일괄 생성되며, 변환본은 원본과 캠페인에 트레이서블하게 연결된다 — 첫 사용자 가치(F4 채널 변환 + F5 광고 카피)가 도달한다.
**Depends on**: Phase 3
**Requirements**: XFRM-01, XFRM-02, XFRM-03, ADCP-01, ADCP-02, ADCP-03
**Success Criteria** (what must be TRUE):
  1. 사용자가 한 콘텐츠(또는 브리프)를 선택해 대상 채널 N개를 지정하면 채널별 변환본이 일괄 생성되고, 채널별로 길이·형식·톤이 자동 조정된다 (인스타 캡션 vs 네이버 블로그 SEO vs 메타 광고) (XFRM-01, XFRM-02).
  2. 모든 변환본은 `source_content_id`로 원본 콘텐츠와 캠페인에 트레이서블하게 연결되어 검토 큐와 캠페인 상세에서 추적 가능하다 (XFRM-03).
  3. 사용자가 캠페인·채널·옵션(길이/톤/CTA 강도)을 지정해 광고 카피를 생성하면 `{ headline, subhead, body, cta, hashtags[] }` 구조의 JSON으로 검증된 출력이 나온다 (ADCP-01, ADCP-02).
  4. 카피 생성 결과는 `contents` 테이블에 `kind=adcopy`로 저장되며 토큰·비용이 기록되고, Phase 3의 검토 큐를 거쳐야 승인된다 (ADCP-03).
**Plans**: TBD
**UI hint**: yes

### Phase 5: Long-form Content Cluster
**Goal**: 릴스 스크립트(샷 단위) + 블로그 초안(섹션 트리) + 상세페이지(섹션 카드) + 상품 설명(스마트스토어/쿠팡/자사몰) + 카드뉴스(슬라이드 배열) — 사용자가 명시한 10가지 콘텐츠 종류 중 긴 형식 5종이 모두 동작한다.
**Depends on**: Phase 4
**Requirements**: REEL-01, REEL-02, REEL-03, BLOG-01, BLOG-02, BLOG-03, DTL-01, DTL-02, DTL-03, PROD-01, PROD-02, PROD-03, CARD-01, CARD-02, CARD-03
**Success Criteria** (what must be TRUE):
  1. 사용자가 길이(30s/60s)·후크 옵션을 지정해 릴스 스크립트를 생성하면 `{ hook, shots:[{ scene, dialog, caption, b_roll }], cta, music_hint }` 구조로 검증되며, 릴스 뷰어에서 샷 단위 인라인 편집이 가능하다 (REEL-01, REEL-02, REEL-03).
  2. 사용자가 키워드·길이·SEO 옵션을 지정해 블로그 초안을 생성하면 `{ title, meta_description, sections:[{ h2, body, image_prompt? }], tags[] }` 구조로 검증되며, 블로그 뷰어에서 섹션 단위 재생성·편집이 가능하다 (BLOG-01, BLOG-02, BLOG-03).
  3. 사용자가 제품 정보·랜딩 목적을 입력해 상세페이지 카피를 생성하면 `{ hero:{ headline, sub, cta }, sections:[{ kind, copy, image_prompt }] }` 구조로 검증되며, 섹션 단위 추가·삭제·재생성이 가능하다 (DTL-01, DTL-02, DTL-03).
  4. 사용자가 제품 사양·채널(스마트스토어/쿠팡/자사몰)을 입력해 상품 설명을 생성하면 `{ title, bullets[], description, search_keywords[] }` 구조로 검증되고 채널별 길이·키워드 규칙(스마트스토어 50자 등)이 옵션으로 적용된다 (PROD-01, PROD-02, PROD-03).
  5. 사용자가 슬라이드 수·톤·목적을 지정해 카드뉴스를 생성하면 `{ slides:[{ index, title, sub?, body, image_prompt, cta? }] }` 구조로 검증되며, 카드뉴스 뷰어에서 슬라이드 단위 추가·삭제·재정렬·재생성을 지원한다 (CARD-01, CARD-02, CARD-03).
**Plans**: TBD
**UI hint**: yes

**Research flag**: Phase 5 진입 전 추가 리서치 필수 — 네이버 블로그 SEO(2026 가이드), 네이버 플레이스 사장님 영역, 카카오 비즈메시지 의무 표기(광고/수신거부/발송 시간), 스마트스토어/쿠팡 상품 등록 규칙. 채널별 룰이 매년 변동되므로 페이즈 진입 시점 기준 최신 가이드 재확인.

### Phase 6: Operations & Hardening
**Goal**: 비용 대시보드·콘텐츠 검색/재사용·한국어 스타일 린터·모바일 대응·에러 모니터링 — 운영 안전성과 회수 메커니즘이 마무리되어 v1을 사내 도구로 매일 쓸 수 있는 상태로 만든다.
**Depends on**: Phase 5
**Requirements**: OPS-01, OPS-02, OPS-03, OPS-05, UI-04
**Success Criteria** (what must be TRUE):
  1. 사용자가 `/settings/billing` AI 비용 대시보드에서 일/주/월 단위 토큰·KRW 비용을 보고, 클라이언트별·콘텐츠 종류별 breakdown을 본다 (OPS-01, OPS-02).
  2. cache_hit 비율이 비용 대시보드에 노출되어 캐싱이 실제로 작동하는지 운영자가 한눈에 확인할 수 있다 (OPS-03).
  3. Sentry/PostHog로 에러·예외가 자동 수집되며 운영자에게 슬랙/이메일 알람이 도달한다 (OPS-05).
  4. 모바일에서 대시보드와 검토 큐 화면이 정상 동작해 외근 중 운영자/대표가 검토를 처리할 수 있다 (캠페인/콘텐츠 생성은 데스크톱 우선이라도) (UI-04).
**Plans**: TBD
**UI hint**: yes

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation & Multi-Tenant Data Model | 0/TBD | Not started | - |
| 2. AI Gateway + Cost Control + Brand Voice | 0/TBD | Not started | - |
| 3. Campaign Brief + HITL Review | 0/TBD | Not started | - |
| 4. Short-form Content Cluster | 0/TBD | Not started | - |
| 5. Long-form Content Cluster | 0/TBD | Not started | - |
| 6. Operations & Hardening | 0/TBD | Not started | - |

## Coverage Summary

**Total v1 requirements:** 68 (across 16 categories — note: REQUIREMENTS.md header says 64; actual itemized count is 68)
**Mapped:** 68/68 ✓
**Orphaned:** 0

| Category | Count | Phase Mapping |
|----------|-------|---------------|
| AUTH (Authentication & Workspace) | 7 | All in Phase 1 |
| CLNT (Clients & Brand Kit, F1) | 6 | All in Phase 1 |
| TONE (Brand Tone Learning, F2) | 4 | All in Phase 2 |
| CAMP (Campaign & Brief, F3) | 5 | All in Phase 3 |
| XFRM (Channel Transformation, F4) | 3 | All in Phase 4 |
| ADCP (Ad Copy, F5) | 3 | All in Phase 4 |
| REEL (Reels Script, F6) | 3 | All in Phase 5 |
| BLOG (Blog Draft, F7) | 3 | All in Phase 5 |
| DTL (Detail Page, F8) | 3 | All in Phase 5 |
| PROD (Product Description, F9) | 3 | All in Phase 5 |
| CARD (Card News, F10) | 3 | All in Phase 5 |
| AIGW (AI Gateway & Cost Control) | 6 | All in Phase 2 |
| SAFE (Safety & Guardrails) | 4 | SAFE-01, SAFE-04 → Phase 2; SAFE-02, SAFE-03 → Phase 3 |
| RVW (Review & Approval) | 6 | All in Phase 3 |
| OPS (Operations & Cost Dashboard) | 5 | OPS-04 → Phase 1; OPS-01, OPS-02, OPS-03, OPS-05 → Phase 6 |
| UI (Korean Language & UI) | 4 | UI-01, UI-03 → Phase 1; UI-02 → Phase 3; UI-04 → Phase 6 |

## Locked v1 Feature → Phase Mapping (10 features from PROJECT.md)

| # | Feature | Phase |
|---|---------|-------|
| F1 | 클라이언트 브랜드 정보 저장 | Phase 1 |
| F2 | 브랜드 톤앤매너 학습 | Phase 2 |
| F3 | 광고 캠페인 생성 | Phase 3 |
| F4 | 채널별 콘텐츠 자동 변환 | Phase 4 |
| F5 | 광고 카피 생성 | Phase 4 |
| F6 | 릴스 스크립트 생성 | Phase 5 |
| F7 | 블로그 초안 생성 | Phase 5 |
| F8 | 상세페이지 카피 생성 | Phase 5 |
| F9 | 쇼핑몰 상품 설명 생성 | Phase 5 |
| F10 | 카드뉴스 제작 | Phase 5 |
| 공통 | HITL 검토·수정·승인 | Phase 3 (entrenched throughout) |
| 공통 | 역할 구분 + 작업 큐 | Phase 1 (auth/role) + Phase 3 (review queue) |
| 공통 | 한국어 UI·카피 품질 | Phase 1 (UI-01) + Phase 2 (한국어 system prompt + few-shot) |

---
*Roadmap created: 2026-05-10*
*Mode: standard (Horizontal Layers — platform-first ordering per research/SUMMARY.md and MVP-ARCHITECTURE.md §7)*
*Granularity: standard (6 phases)*
