# AI-

**AdOps AI** — 한국 소상공인 광고대행사를 위한 AI 마케팅 운영 플랫폼.

> 클라이언트 브랜드 → 톤 학습 → 캠페인 브리프 → 채널별 한국어 콘텐츠(광고 카피·릴스·블로그·상세·상품·카드뉴스) 생성·검토·관리.
>
> **목표**: 광고대행사 직원 1명이 처리할 수 있는 클라이언트·캠페인 처리량을 2배 이상으로.

## v1 핵심 기능 (10가지)

| # | Feature |
|---|---|
| F1 | 클라이언트 브랜드 정보 저장 |
| F2 | 브랜드 톤앤매너 학습 |
| F3 | 광고 캠페인 생성 (AI 브리프) |
| F4 | 채널별 콘텐츠 자동 변환 |
| F5 | 광고 카피 생성 |
| F6 | 릴스 스크립트 생성 |
| F7 | 블로그 초안 생성 |
| F8 | 상세페이지 카피 생성 |
| F9 | 쇼핑몰 상품 설명 생성 |
| F10 | 카드뉴스 제작 |

## 기술 스택

- **Frontend**: Next.js 15 (App Router) · TypeScript · Tailwind CSS · shadcn/ui · Pretendard
- **Backend**: Supabase (Postgres + Auth + Storage + RLS + pgvector)
- **AI**: OpenAI / Anthropic Claude (단일 게이트웨이 통한 라우팅 + prompt cache + 비용 게이트)
- **Editor**: Tiptap (한글 IME 친화)
- **호스팅**: Vercel (Seoul `icn1`)

## 프로젝트 구조

```
.planning/                    # GSD 워크플로우 산출물
├── PROJECT.md                # 프로젝트 컨텍스트
├── REQUIREMENTS.md           # v1 68개 요구사항
├── ROADMAP.md                # 6 페이즈 로드맵
├── MVP-ARCHITECTURE.md       # 폴더/DB/페이지/API/프롬프트 청사진
├── research/                 # 도메인 리서치 (stack/features/architecture/pitfalls/summary)
└── STATE.md                  # 프로젝트 상태

mockups/                      # 5-페이지 UI 목업 (Tailwind + Pretendard, standalone HTML)
├── index.html
├── 01-login.html
├── 02-clients.html
├── 03-brand-detail.html
├── 04-campaign-new.html
└── 05-content-result.html

CLAUDE.md                     # Claude Code 작업 가이드
```

## 6-페이즈 로드맵

| # | Phase | Goal |
|---|---|---|
| 1 | Foundation & Multi-Tenant Data Model | Auth + RLS day-1, 클라이언트/브랜드킷/자산 라이브러리 |
| 2 | AI Gateway + Cost Control + Brand Voice | 단일 게이트웨이, prompt cache, 비용 게이트, 톤 학습 |
| 3 | Campaign Brief + HITL Review | AI 브리프 스트리밍, 클레임 기반 검토 큐, 의료/금융 가드레일 |
| 4 | Short-form Content Cluster | 채널 fan-out + 광고 카피 |
| 5 | Long-form Content Cluster | 릴스·블로그·상세·상품·카드뉴스 |
| 6 | Operations & Hardening | 비용 대시보드·Sentry·모바일·검색 |

## UI 목업 미리보기

```bash
open mockups/index.html
```

Notion + Stripe + Linear 톤의 미니멀한 관리자 대시보드 5종.

## 개발

> Phase 1 진입 시 실제 Next.js + Supabase 스캐폴딩 시작 — 현재는 기획 산출물만 존재.

```bash
# (예정) Phase 1 진입 후
npm install
npm run dev
```

## 라이선스

Private — Internal use only.
