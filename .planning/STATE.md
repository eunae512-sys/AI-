# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-05-10)

**Core value:** 광고대행사 직원 1명이 처리할 수 있는 클라이언트·캠페인 처리량을 2배 이상으로 끌어올린다.
**Current focus:** Phase 1 — Foundation & Multi-Tenant Data Model

## Current Position

Phase: 1 of 6 (Foundation & Multi-Tenant Data Model)
Plan: 0 of TBD in current phase
Status: Ready to plan
Last activity: 2026-06-05 — /reels (ReelsScreen.tsx) 죽은/무의미 요소 정리 (260605-n83). 직전 감사로 확정된 5건: ①데드 TEMPLATES 배열 삭제(참조 0) ②DEFAULT_PHOTOS 죽은 grad 문자열 제거 — gradient 시드 칸은 빈 PAPER 사각형으로만 렌더되므로 grad 값 미사용, 6개 시드는 SEED_SLOT_COUNT 상수로 유지·Photo 타입 `{kind:"gradient"}` 로 단순화 ③activeTpl/defaultTpl/INDUSTRY_DEFAULT_TPL 체인 삭제(UI에 템플릿 선택 없음, AnimatePresence key 폴백→상수 "empty", 브랜드전환 activeHook 초기화 effect 는 보존) ④no-op 팔로우 버튼→비인터랙티브 span(pointer-events-none, IG목업 균형 유지·하단 장식 아이콘과 통일) ⑤빈 상태(사진 0장) 자막 겹침 — HOOKS 샘플 자막이 "예시 화면" 안내문 위에 겹쳐 가독성 해침을 스크린샷으로 확정, 자막 캡션 오버레이를 `!compiled && currentCut` 으로 게이트해 해소. tsc --noEmit 0, /reels 헤드리스 스크린샷 전후 비교로 정상 렌더+겹침 해소 육안 확인, grep 으로 TEMPLATES/activeTpl/INDUSTRY_DEFAULT_TPL/죽은 grad 잔재 0. BGM·AI음악·트렌드·컴파일·발행·컷스트립·자막트랙 핸들러 전부 보존. 커밋 9db5e49. 직전: /blog "샘플 검증 모드(QA 샌드박스)" 완전 제거 (옵션 A). BlogScreen.tsx 에서 sampleBrand state·applySample/clearSample·UI 패널(샘플 픽커·검증 사실 카드)·생성 분기(ctxBrandName 등 sampleBrand 우선 로직)·knownFacts 주입·sample-real-brands import 제거, 헤더/analyzeKeyword/analyzeAndGenerate 의 sampleBrand 참조도 정리. 일반 brand 컨텍스트 생성 경로·autosave·SERP 분석·발행 흐름 보존. lib/dummy/sample-real-brands.ts 는 타 사용처 없어 파일째 git rm. tsc 0, /blog 헤드리스 스크린샷으로 패널 사라짐·레이아웃 정상 육안 확인 (260605-blqa). 직전: /cardnews letterhead 로고 위치 토글 (260605-cnp)

Progress: [░░░░░░░░░░] 0%

## Performance Metrics

**Velocity:**
- Total plans completed: 0
- Average duration: —
- Total execution time: 0 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 1. Foundation & Multi-Tenant Data Model | 0 | — | — |
| 2. AI Gateway + Cost Control + Brand Voice | 0 | — | — |
| 3. Campaign Brief + HITL Review | 0 | — | — |
| 4. Short-form Content Cluster | 0 | — | — |
| 5. Long-form Content Cluster | 0 | — | — |
| 6. Operations & Hardening | 0 | — | — |

**Recent Trend:**
- Last 5 plans: —
- Trend: — (no execution yet)

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- 스택 락인: Next.js + Supabase + OpenAI/Claude API + Tailwind CSS (사용자 명시)
- Supabase RLS day-1 적용 (agency_id + client_id 격리) — Phase 1 핵심
- AI 게이트웨이 단일 진입점 `lib/ai/gateway.ts` — Phase 2 핵심, 첫 카피 기능보다 먼저
- 콘텐츠 종류 10가지 모두 텍스트+프롬프트 산출, 이미지 직접 합성은 v2
- 휴먼-인-더-루프 필수 (HITL) — Phase 3에서 first-class 구축

### Pending Todos

None yet. (Use `/gsd-add-todo` to capture ideas during sessions.)

### Blockers/Concerns

- **Phase 3 research gate**: 진입 전 의료법 §56 / 표시광고법 §3 / 식약처 / 금융위 deny-list와 critic 프롬프트 추가 리서치 필요 (도메인 특화·고위험).
- **Phase 5 research gate**: 진입 전 네이버 블로그 SEO·네이버 플레이스·카카오 비즈메시지 의무 표기·스마트스토어/쿠팡 채널 룰 최신 재확인 필요 (매년 변동).
- **PIPA §26 위탁 + 국외 이전**: OpenAI/Anthropic 미국 전송에 대한 위탁 계약·정보주체 동의 플로우는 Phase 1에서 정책·UI 레벨로 자리 잡아야 함.
- **REQUIREMENTS.md 카운트 불일치**: 헤더에 "v1 requirements: 64 total"로 적혀 있으나 실제 항목 수는 68. 트레이서빌리티는 68 기준으로 매핑됨.

### Quick Tasks Completed

| # | Description | Date | Commit | Directory |
|---|-------------|------|--------|-----------|
| 260603-w7i | 쇼츠 페이지 이름·문구 정리 (멀티 플랫폼 카피 생성기 명확화) | 2026-06-03 | cef54be | [260603-w7i-shorts-copy-cleanup](./quick/260603-w7i-shorts-copy-cleanup/) |
| 260604-cn1 | 캠페인 카드뉴스 카피 문맥 정리 (후킹→내용→유도 일관성) | 2026-06-04 | 89841d7 | [260604-cn1-cardnews-coherence](./quick/260604-cn1-cardnews-coherence/) |
| 260604-cn2 | 카드뉴스·릴스 자막 카피 전문가 마케터 톤 고도화 | 2026-06-04 | d25dcf3 | [260604-cn2-cardnews-voice](./quick/260604-cn2-cardnews-voice/) |
| 260604-cn3 | AI 생성 프롬프트 전문가 마케터 톤 통일 (few-shot + 클리셰 차단) | 2026-06-04 | 5f591ee | [260604-cn3-ai-prompt-voice](./quick/260604-cn3-ai-prompt-voice/) |
| 260604-md1 | 가입 무드를 릴스·카드뉴스 이미지·영상 생성에 반영 | 2026-06-04 | d830b3b | [260604-md1-mood-propagation](./quick/260604-md1-mood-propagation/) |
| 260604-md2 | 무드를 카드뉴스 카피 톤(후크·캡션)에도 반영 | 2026-06-04 | 1021f50 | [260604-md2-mood-copy-tone](./quick/260604-md2-mood-copy-tone/) |
| 260604-md3 | 업로드 사진 팔레트로 무드 자동 추천 | 2026-06-04 | 19552c6 | [260604-md3-mood-autodetect](./quick/260604-md3-mood-autodetect/) |
| 260604-ai1 | AI 출연자 생성을 캠페인 주제에 맞게 (주제 무관 결과 해결) | 2026-06-04 | 264871a | [260604-ai1-aimodel-topic](./quick/260604-ai1-aimodel-topic/) |
| 260604-ai2 | AI 출연자 주제 영문 변환으로 매칭 정확도 향상 | 2026-06-04 | 0e30baa | [260604-ai2-topic-translate](./quick/260604-ai2-topic-translate/) |
| 260604-rl1 | 릴스 화면 직관화 (자동회전 제거·참고그리드 삭제·컷 썸네일 편집) | 2026-06-04 | 6597e5e | [260604-rl1-reels-simplify](./quick/260604-rl1-reels-simplify/) |
| 260604-bg1 | BGM 가사를 실제로 부르는 보컬 음악 생성 (fal minimax-music) | 2026-06-04 | 1291b32 | [260604-bg1-vocal-music](./quick/260604-bg1-vocal-music/) |
| 260604-tx1 | OpenAI 쿼터 소진 시 텍스트 생성 Gemini 자동 폴백 | 2026-06-04 | f1b99a6 | [260604-tx1-gemini-fallback](./quick/260604-tx1-gemini-fallback/) |
| 260604-pi2 | 랜딩 Hero+Sections 1등 고도화 (이탤릭 제거·CTA 한글화·정직화·페르소나 플레이트·keep-all) | 2026-06-04 | 864e9a3 | [260604-pi2-landing-hero-uplift](./quick/260604-pi2-landing-hero-uplift/) |
| 260605-ob1 | 온보딩 매거진 에디토리얼 디자인 시스템 전면 이관 (랜딩과 한 결) | 2026-06-05 | 35919bb | [260605-ob1-onboarding-editorial](./quick/260605-ob1-onboarding-editorial/) |
| 260605-lzm | /cardnews 슬라이드 letterhead 에 브랜드 로고 배선 (기존 brand-mark 인프라 재사용, 폴백=이니셜) | 2026-06-05 | 2734830 | [260605-lzm-cardnews-brand-logo](./quick/260605-lzm-cardnews-brand-logo/) |
| 260605-pr1 | 결제/요금제 1등 고도화 (가격 한글 이탤릭·emerald→SAGE + 결제 플로우 에디토리얼 이관) | 2026-06-05 | 413c188 | [260605-pr1-pricing-billing-editorial](./quick/260605-pr1-pricing-billing-editorial/) |
| 260605-rl2 | 자동 릴스 버그 — 자막 주제별 생성(반복 해결) + 자막 트랙 편집 안정화 | 2026-06-05 | d831a0b | [260605-rl2-reels-subtitle-fix](./quick/260605-rl2-reels-subtitle-fix/) |
| 260605-db1 | 대시보드 1등 고도화 (한글 가짜 이탤릭 제거 — 이미 에디토리얼) | 2026-06-05 | e13ba3e | [260605-db1-dashboard-italic](./quick/260605-db1-dashboard-italic/) |
| 260605-cp1 | 카드뉴스·릴스 자동 문구 휴먼 톤 + 문맥 정합성 (AI 클리셰·DM트리거·저장강박·조각자막 제거) | 2026-06-05 | f9aed4b | [260605-cp1-copy-human-coherence](./quick/260605-cp1-copy-human-coherence/) |
| 260605-mp1 | 인스타 모바일 미리보기 빈 화면 수정 (SmartTextOverlay position 충돌 붕괴·cqh 폰트·CORS) | 2026-06-05 | ffb8d36 | [260605-mp1-mobile-preview-empty](./quick/260605-mp1-mobile-preview-empty/) |
| 260605-i6k | /reels 에디토리얼 디자인 시스템 전면 이관 (SaaS 색·그라데이션·이모지·다크모드 제거 → 종이+잉크·세리프·헤어라인·SAGE) + 밀도 완화로 공간 확보, 로직 무손상 | 2026-06-05 | 96c7e94 | [260605-i6k-reels-editorial-rework](./quick/260605-i6k-reels-editorial-rework/) |
| 260605-ck1 | 카드뉴스 주제 키워드 유실 버그 — 라벨 제거·subject 폴백·kind 우선으로 주제별 차별화 복구 | 2026-06-05 | 0a76f5a | [260605-ck1-cardnews-keyword-fix](./quick/260605-ck1-cardnews-keyword-fix/) |
| 260605-ll7 | 카드뉴스 브랜드 로고 — 검증 결과 이미 완전 구현·배선됨(코드 0줄), 로고 있음→슬라이드 마스트헤드/IG아바타 로고, 없음→워드마크 폴백 스크린샷 확인 | 2026-06-05 | (docs-only) | [260605-ll7-brand-logo-cardnews](./quick/260605-ll7-brand-logo-cardnews/) |
| 260605-n83 | /reels 죽은 요소 정리 — 데드 TEMPLATES·INDUSTRY_DEFAULT_TPL·activeTpl 체인 삭제(key 폴백→"empty"), DEFAULT_PHOTOS 죽은 grad 문자열 제거(시드 6개는 SEED_SLOT_COUNT 상수 유지), no-op 팔로우 버튼→비인터랙티브 span, 빈 상태 자막 겹침 수정(currentCut 있을 때만 자막 오버레이). tsc 0·스크린샷 확인, 기능 무손상 | 2026-06-05 | 9db5e49 | [260605-n83-clean-up-dead-no-op-elements-in-reels-re](./quick/260605-n83-clean-up-dead-no-op-elements-in-reels-re/) |

## Deferred Items

Items acknowledged and carried forward from previous milestone close:

| Category | Item | Status | Deferred At |
|----------|------|--------|-------------|
| *(none — first milestone)* | | | |

## Session Continuity

**Active goal:** 소상공인 자동화 마케팅 플랫폼 — 전세계 1등 사이트 (디테일 고도화 모드)

**다음 작업 (NEXT): /reels 페이지 전면 리워크 → `.planning/HANDOFF-reels-rework.md` 참조**
- 대상: `briq-app/components/reels/ReelsScreen.tsx` (~1688줄)
- 목표: 에디토리얼 디자인 시스템 전면 이관 + "공간 확보"(밀도 완화·여백·위계). 로직 100% 보존.
- 새 세션 시작 시: **먼저 `CLAUDE.md` Conventions + `.planning/HANDOFF-reels-rework.md` 읽기.**
- 재개 명령 예: "/reels 페이지 에디토리얼 이관 + 공간 확보 — HANDOFF 참조"

**완료된 1등 고도화(이번 사이클):** 랜딩(Hero/Sections) · 온보딩 · 가격 · 결제(start/success/fail) · 대시보드 · 카드뉴스·릴스 카피 톤 · 인스타 미리보기(빈화면·겹침). 디자인 시스템·철칙은 `CLAUDE.md` Conventions 에 박제됨.
**남은 후보:** /reels(다음) → /cardnews 편집 디테일 → 쿨 zinc 중립색 INK 토큰화(가격·대시보드).

**환경 메모:** dev 서버는 `pnpm dev` 가 의존성 검증서 실패 → `cd briq-app && ./node_modules/.bin/next dev -p 3000` 로 직접 띄울 것. OpenAI 쿼터·fal 잔액 소진 상태(텍스트/이미지/영상/음악은 Gemini 폴백으로 동작, 보컬음악·AI영상은 결제 충전 필요).

Last session: 2026-06-04
Resume file: STATE.md (이 블록)