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

index.html                    # 5-페이지 UI 목업 갤러리 (루트)
01-login.html                 # 로그인
02-clients.html               # 클라이언트 목록
03-brand-detail.html          # 브랜드 상세
04-campaign-new.html          # 캠페인 생성
05-content-result.html        # 생성 결과

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

배포: 루트 URL (Vercel `./`)에서 갤러리(`index.html`)가 바로 열립니다. 로컬에서는:

```bash
open index.html
```

Notion + Stripe + Linear 톤의 미니멀한 관리자 대시보드 5종.

## 로컬 실행 — 카드뉴스 이미지 생성 프로토타입

OpenAI **gpt-image-1**로 실제 카드뉴스 이미지를 생성하는 동작 프로토타입입니다.

### 1) OpenAI API 키 준비

[platform.openai.com/api-keys](https://platform.openai.com/api-keys) 에서 키 발급. 결제(billing) 활성화 + 이미지 생성 권한(Tier 1 이상) 필요.

### 2) 의존성 설치 + 키 입력

```bash
npm install
cp .env.example .env
# .env 파일을 편집해 OPENAI_API_KEY=sk-... 채우기
```

### 3) 서버 실행

```bash
npm start
```

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 AdOps AI · 로컬 서버 시작
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 카드뉴스: http://localhost:3000/06-cardnews-image.html
 갤러리:   http://localhost:3000/
```

### 4) 사용

1. 브라우저에서 `http://localhost:3000/06-cardnews-image.html`
2. 우측 상단 **"전체 재생성"** 클릭 → 6장 순차 생성 (각 ~$0.04, 약 4~7초)
3. 슬라이드별 **재생성** / **변형(시드 변경)** / **PNG** 버튼
4. 프롬프트(영문)는 `contenteditable` — 직접 수정 후 재생성 가능

### 비용 안내

- gpt-image-1 medium 품질: **$0.04 / 장**
- 6장 1세트: **$0.24 ≈ ₩336**
- 변형/재생성마다 추가 비용 발생 — `medium` 권장

### 다음 단계

- 한글 텍스트 캔버스 합성 (현재는 HTML 오버레이) — PNG export 시 정확한 합성
- 슬라이드 5처럼 검토 자동 플래그 (이미지 OCR로 텍스트 감지)
- 시드 통일 + reference image로 일관성 보강
- Vercel 배포 (`/api/generate-image.js` 그대로 서버리스 함수로 인식됨, env에 키만 설정)

## 라이선스

Private — Internal use only.
