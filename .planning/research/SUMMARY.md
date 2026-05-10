# Research Summary — AdOps AI

**Project:** AI 마케팅 운영 플랫폼 (한국 SMB 광고대행사 사내 도구)
**Researched:** 2026-05-10
**Stack (locked by user):** Next.js + Supabase + OpenAI/Claude API + Tailwind CSS
**Overall confidence:** HIGH

---

## 핵심 결론

이 제품의 본질은 "**클라이언트 브랜드 프로필 + 톤 + 캠페인 브리프 → 채널별 한국어 카피**"라는 단일 생성 프리미티브를, 사용자가 명시한 10개 콘텐츠 종류에 동일 패턴으로 적용하는 것이다.

리서치 4개 영역(Stack/Features/Architecture/Pitfalls)이 한 가지 결론으로 수렴한다:

> **개별 생성 기능을 만들기 *전*에 플랫폼 레이어(Auth + RLS + 브랜드 프로필 + AI 게이트웨이 + 잡 큐 + 검토 큐 + 비용 미터)를 먼저 구축해야 한다.** 이걸 건너뛰고 "광고 카피 먼저 출시"로 가는 것이 가장 비싼 실수다 — retrofit 비용이 폭증한다.

---

## Stack 권고 (락인 + 보강)

**락인 (사용자 결정):**
- Next.js 15+ App Router · TypeScript
- Supabase (Postgres + Auth + Storage + RLS + pgvector)
- OpenAI GPT + Anthropic Claude (kind별 라우팅; Claude는 prompt caching ~90% 비용 절감)
- Tailwind CSS + shadcn/ui

**락인 위에 권장:** Vercel AI SDK 5 (provider-agnostic 스트리밍), Drizzle ORM 또는 Supabase 자동 타입, Zod (입출력 검증), **Tiptap v2** (한글 IME — Lexical은 IME 버그), Pretendard 폰트 서브셋, TanStack Query, Sentry + Langfuse, Sharp (KFTC AI 라벨링 워터마크).

**선택적 보강 (락인 외, 필요 시점에만 도입):**
- HyperCLOVA X / Solar Pro 3 — Phase 5에서 Naver Blog 한국어 품질 측정 후 부족하면 도입
- Trigger.dev v3 — Phase 6에서 HITL Waitpoints / 장시간 워크플로우가 실제 고통이 되면 승격
- 이미지 생성 (Ideogram/Imagen/FLUX) — v1 범위 외, v1.x 또는 v2

---

## Features — 사용자 락인 10가지 + 평가

| # | Feature | 카테고리 | 한 줄 |
|---|---|---|---|
| F1 | 클라이언트 브랜드 정보 저장 | Table stakes | Client Facts Sheet (상호·업종·negative facts·금지 표현 등 1급 시민) |
| F2 | 브랜드 톤앤매너 학습 | Differentiator | per-client 톤 + few-shot, 모든 생성에 system 단계 주입 |
| F3 | 광고 캠페인 생성 | Table stakes | 목표·타겟·기간 → AI 브리프 (메시지·채널 믹스·KPI) |
| F4 | 채널별 콘텐츠 자동 변환 | Differentiator | 한 브리프 → 채널별 길이/형식/톤 fan-out |
| F5 | 광고 카피 생성 | Table stakes | Meta/Google/네이버 검색광고 단문 카피 (deny-list + critic) |
| F6 | 릴스 스크립트 생성 | Table stakes | 샷 단위 outline (텍스트만, 영상 합성은 OOS) |
| F7 | 블로그 초안 생성 | Differentiator | 네이버 블로그 SEO 친화 장문 |
| F8 | 상세페이지 카피 생성 | Table stakes | 랜딩/PDP 섹션 구조 |
| F9 | 쇼핑몰 상품 설명 | Differentiator | 스마트스토어/쿠팡 형식 |
| F10 | 카드뉴스 제작 | Table stakes | 슬라이드 단위 텍스트 + 이미지 프롬프트 |

**공통 필수 (any feature를 쓸 수 있게 만드는 인프라):** 역할 기반 인증, HITL 검토/승인 UI, 콘텐츠 히스토리, 자산 라이브러리, 한국어 글자수 카운트, AI 비용 로깅, 클립보드/Markdown 내보내기.

**v2/Out of Scope (재확인):** 매체 API 직접 게재, 성과 분석, 영상 합성, 클라이언트 셀프서비스, 이미지 직접 생성, 풀 자율 에이전트.

---

## Architecture — 모듈러 모놀리식 + AI Gateway 단일 진입점

```text
[Frontend RSC + Server Actions]
            │
[Domain modules]      [Job Queue + Workers]
            │                │
[★ AI Gateway (단일 통로) ★] ← provider 라우팅·캐시·가드레일·비용 미터
            │                │
[Supabase (Postgres+RLS+pgvector+Storage+Auth)]
```

**Day-1 핵심 결정:**
1. **AI 게이트웨이가 first-class 컴포넌트.** 도메인 코드는 OpenAI/Anthropic SDK를 직접 import 금지. 첫 카피 기능보다 *먼저* 구축.
2. **Postgres RLS day-1.** 모든 도메인 테이블에 `agency_id` + `client_id`. v1이 1개 회사여도 retrofit 비용 폭증 방지.
3. **비동기 fan-out via Job Queue.** 채널 4개 × LLM 30초 = 동기 호출은 timeout. Supabase queue + worker로 시작, 필요 시 Trigger.dev로 승격.
4. **HITL 검토 큐는 state machine** (`pending → approved | edited | rejected`). 절대 자동 게시 안 함.
5. **Multi-tenant unit = 클라이언트(브랜드)**, 에이전시 아님. 모든 데이터 격리 키.

---

## 치명적 함정 Top 5 (각 페이즈 산출물로 직접 대응)

| # | 함정 | 대응 페이즈 | 핵심 방어 |
|---|---|---|---|
| 1 | **광고 규제 위반 카피** (의료법 §56, 표시광고법 §3, 식약처/금융위) | Phase 3 (생성 기능과 동시 출시) | 업종 deny-list + post-gen regex + LLM-as-critic + 사전심의 게이트 |
| 2 | **브랜드 사실 환각** (소상공인일수록 LLM 학습 데이터 빈약) | Phase 1 | Client Facts Sheet 1급 시민화 + negative facts 명시 + 클레임 추출 UI |
| 3 | **LLM 비용 폭주** (fan-out × retry × no-cache 야간 청구서) | Phase 2 | pre-request 토큰·KRW 한도 게이트 + Anthropic `cache_control` + circuit breaker + 실시간 알람 |
| 4 | **검토 무력화 (rubber-stamping)** (하루 100~200건이면 검토자 통과) | Phase 3 | 클레임 단위 체크 UI + 위험 기반 라우팅 + 5% 무작위 감사 + 수정-비율 metric |
| 5 | **PIPA §26 위탁 + 국외 이전** (광고주 고객 데이터가 OpenAI/Anthropic 미국으로) | Phase 1 | PII 업로드 마스킹 + 벤더 학습 opt-out 계약 + 위탁 동의 플로우 |

기타: 멀티테넌시 retrofit, 한국어 어색함(어색한 직역체·종결어미 비일관), 카피 동질화, 직원 변화관리.

---

## 권장 Phase 구성 (6 phase + 향후)

| # | Phase | 핵심 산출물 | 매핑 기능 |
|---|---|---|---|
| 1 | **Foundation & Data Model** | Next.js + Supabase 부트스트랩, Auth + RLS day-1, 멀티테넌시 스키마, Client Facts Sheet, 자산 라이브러리, PII 마스킹, 감사 로그 | F1 |
| 2 | **AI Gateway + Cost Control + Brand Voice** | 게이트웨이 단일 통로, 캐시·비용 미터·예산 게이트, 톤 학습, 가드레일/critic 스캐폴드, 잡 큐 | F2 + 인프라 |
| 3 | **Campaign + HITL Review** | 캠페인 + AI 브리프 생성, 클레임 기반 검토 큐, 의료/금융/식품 active 가드레일 | F3 + 검토 |
| 4 | **Short-form Channel Cluster** | 채널 fan-out 오케스트레이션, 광고 카피 (Meta/Google/네이버 검색) | F4, F5 |
| 5 | **Long-form Channel Cluster** | 릴스·블로그·상세페이지·상품 설명·카드뉴스 — 채널별 prompt 템플릿 + 업종 few-shot | F6, F7, F8, F9, F10 |
| 6 | **Reuse / Optimization / Hardening** | 콘텐츠 검색 (한국어 nori + pgvector semantic), 위너 라이브러리, 시즌 캘린더, 한국어 스타일 린터, 다양성 모니터, 스타일 가이드라인 자동화 | 운영성 |
| 7+ | (deferred) | 매체 API 직접 게재, 성과 대시보드, SaaS, 클라이언트 셀프서비스, 이미지 생성 | v2 |

**페이즈 순서의 핵심 원칙:**
- Platform before features (Phase 1~2가 Phase 3+의 전제)
- Brand profile before generation (환각·규제 방어가 생성 *전*에 있어야 의미 있음)
- AI Gateway before any LLM call (한 번의 야간 청구서가 부트스트랩을 끝낸다)
- HITL same-day as generation (이미 게시된 잘못된 카피를 검토하는 건 너무 늦다)
- Short-form before long-form (검증 루프 빠름, 빈도 높음)
- Optimization last (실제 분포 없으면 튜닝 불가)

---

## 페이즈별 추가 리서치 권장

| Phase | 이유 |
|---|---|
| Phase 3 | 의료법 §56 / 표시광고법 §3 / 식약처 / 금융위 deny-list와 critic 프롬프트 — 도메인 특화·고위험 |
| Phase 5 | 네이버 블로그 SEO·네이버 플레이스·카카오 비즈메시지 의무 표기·스마트스토어/쿠팡 인증 — 채널별 룰 매년 변동 |
| (해당 시) Phase 7 | 이미지 생성 한글 렌더링 품질 — 벤더 문서 미공개, 실측 필요 |

표준 패턴이라 깊은 리서치 불필요한 페이즈: 1, 2, 4, 6.

---

## Open Questions (페이즈 진입 시 해결)

- 한국어 카피 품질의 실제 모델별 차이 (Claude vs GPT) — Phase 2에서 100-prompt 수정-비율 벤치마크
- 의료광고 자율심의 사전심의 워크플로우 — Phase 3 진입 전 법무 검토
- HyperCLOVA X / Solar Pro 3 승격 여부 — Phase 5 측정 결과로 결정
- KFTC AI 라벨링 (2025-12) 적용 범위·방식 — 이미지 도입 시점에 재확인

---
*Confidence: HIGH (stack/architecture/regulation), MEDIUM (Korean copy quality empirics — Phase 2에서 측정)*
*Ready for roadmap: yes*
