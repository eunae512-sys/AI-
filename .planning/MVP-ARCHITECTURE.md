# AdOps AI — MVP 아키텍처 설계 (실무형 SaaS 구조)

> **스택 (락인)**: Next.js 15 (App Router, TypeScript) · Supabase (Postgres + Auth + Storage + RLS) · OpenAI / Anthropic Claude API · Tailwind CSS + shadcn/ui
> **배포**: Vercel (Seoul `icn1` 리전)
> **목표**: 1인 부트스트랩 운영자가 유지 가능한 모듈러 모놀리식 SaaS — 향후 SaaS 확장 시 `agency` 단위 멀티테넌시로 확장 가능
> **v1 핵심 기능**: 클라이언트 브랜드 → 톤 학습 → 캠페인 → 10종 콘텐츠 생성 (광고카피/릴스/블로그/상세/상품설명/카드뉴스 등)

---

## 1. 폴더 구조

```text
project1/
├── app/                                  # Next.js App Router (모든 라우트의 진입점)
│   ├── (auth)/                           # ─── 비로그인 그룹 ──────────────────
│   │   ├── login/page.tsx
│   │   └── signup/page.tsx
│   │
│   ├── (dashboard)/                      # ─── 로그인 그룹 (middleware 보호) ─
│   │   ├── layout.tsx                    # 사이드바 + 탑바
│   │   ├── page.tsx                      # 홈: 작업 큐 + 최근 캠페인
│   │   │
│   │   ├── clients/                      # 클라이언트(광고주) 도메인
│   │   │   ├── page.tsx                  # 목록
│   │   │   ├── new/page.tsx              # 신규 등록
│   │   │   └── [id]/
│   │   │       ├── page.tsx              # 상세 (요약 + 톤 + 자산 + 최근 캠페인)
│   │   │       ├── edit/page.tsx
│   │   │       ├── tone/page.tsx         # 톤앤매너 학습 (F2)
│   │   │       └── assets/page.tsx       # 자산 라이브러리
│   │   │
│   │   ├── campaigns/                    # 캠페인 도메인
│   │   │   ├── page.tsx                  # 목록
│   │   │   ├── new/page.tsx              # 신규 (클라이언트 선택 → 브리프 AI 생성, F3)
│   │   │   └── [id]/
│   │   │       ├── page.tsx              # 캠페인 상세 + 채널 탭
│   │   │       └── generate/page.tsx     # 콘텐츠 종류 선택 → 생성 (F4~F10)
│   │   │
│   │   ├── content/                      # 생성물 도메인
│   │   │   └── [id]/page.tsx             # 단건 편집·승인·재생성·복사
│   │   │
│   │   ├── review/                       # 검토 큐 (HITL)
│   │   │   └── page.tsx
│   │   │
│   │   └── settings/
│   │       ├── page.tsx                  # 에이전시·요금
│   │       ├── members/page.tsx          # 멤버·역할
│   │       └── billing/page.tsx          # AI 비용 대시보드
│   │
│   ├── api/                              # ─── 서버 API (Route Handlers) ──────
│   │   ├── clients/
│   │   │   ├── route.ts                  # GET, POST
│   │   │   └── [id]/route.ts             # GET, PATCH, DELETE
│   │   ├── campaigns/
│   │   │   ├── route.ts
│   │   │   └── [id]/route.ts
│   │   ├── contents/
│   │   │   ├── route.ts
│   │   │   └── [id]/
│   │   │       ├── route.ts
│   │   │       ├── approve/route.ts      # POST
│   │   │       └── revise/route.ts       # POST
│   │   ├── ai/                           # AI 생성 엔드포인트 (모두 게이트웨이 경유)
│   │   │   ├── tone-train/route.ts       # F2
│   │   │   ├── brief/route.ts            # F3
│   │   │   ├── transform/route.ts        # F4 채널 변환
│   │   │   ├── adcopy/route.ts           # F5
│   │   │   ├── reels/route.ts            # F6
│   │   │   ├── blog/route.ts             # F7
│   │   │   ├── detail-page/route.ts      # F8
│   │   │   ├── product-desc/route.ts     # F9
│   │   │   └── card-news/route.ts        # F10
│   │   └── webhooks/
│   │       └── supabase/route.ts
│   │
│   ├── layout.tsx                        # 루트 레이아웃 (font, providers)
│   └── globals.css                       # tailwind base
│
├── components/                           # ─── UI 컴포넌트 ──────────────────────
│   ├── ui/                               # shadcn/ui 프리미티브 (button, input, …)
│   ├── client/
│   │   ├── ClientCard.tsx
│   │   ├── ClientForm.tsx
│   │   ├── BrandKitEditor.tsx            # 톤 키워드·로고·컬러 편집
│   │   └── ToneTrainer.tsx               # 샘플 업로드 → 톤 추출 (F2)
│   ├── campaign/
│   │   ├── CampaignCard.tsx
│   │   ├── CampaignWizard.tsx            # 신규 캠페인 단계 폼 (F3)
│   │   └── BriefViewer.tsx
│   ├── content/
│   │   ├── ContentEditor.tsx             # 편집기 (Tiptap, 한글 IME 친화)
│   │   ├── ChannelTabs.tsx
│   │   ├── GenerationModal.tsx           # 콘텐츠 종류 선택 + 옵션
│   │   ├── ApprovalPanel.tsx             # 승인/반려 UI
│   │   ├── ClaimChecklist.tsx            # 사실·법적 클레임 검토 체크리스트
│   │   └── kinds/                        # 콘텐츠 종류별 뷰어/편집기
│   │       ├── AdCopyView.tsx
│   │       ├── ReelsScriptView.tsx       # 샷 단위 테이블
│   │       ├── BlogView.tsx
│   │       ├── DetailPageView.tsx        # 섹션 단위
│   │       ├── ProductDescView.tsx
│   │       └── CardNewsView.tsx          # 슬라이드 단위
│   ├── review/
│   │   └── ReviewQueueRow.tsx
│   └── shared/
│       ├── Sidebar.tsx
│       ├── Topbar.tsx
│       ├── EmptyState.tsx
│       └── CostBadge.tsx                 # 토큰·비용 표시
│
├── lib/                                  # ─── 도메인 로직 (server) ────────────
│   ├── supabase/
│   │   ├── client.ts                     # 브라우저용
│   │   ├── server.ts                     # RSC·Route Handler용
│   │   └── middleware.ts                 # 세션 갱신
│   │
│   ├── ai/                               # ★ AI 게이트웨이 (단일 진입점)
│   │   ├── gateway.ts                    # 모든 AI 호출의 포트 (provider 라우팅 + 캐싱 + 비용 + 가드레일)
│   │   ├── providers/
│   │   │   ├── openai.ts                 # OpenAI SDK 래퍼
│   │   │   └── anthropic.ts              # Anthropic SDK 래퍼 (prompt caching)
│   │   ├── cache.ts                      # Supabase에 system+brand-kit 해시 캐싱
│   │   ├── cost.ts                       # 토큰 → KRW 환산, prompt_logs 기록
│   │   ├── safety.ts                     # 의료법·표시광고법 deny-list, claim 추출
│   │   └── types.ts
│   │
│   ├── prompts/                          # ★ 프롬프트 모듈 (콘텐츠 종류별)
│   │   ├── shared/
│   │   │   ├── system.ts                 # 공통 시스템 프롬프트
│   │   │   ├── brandKit.ts               # brand_kit jsonb → 프롬프트 블록 직렬화
│   │   │   ├── guardrails.ts             # 업종(의료/금융/식품)별 금지 표현
│   │   │   └── fewshot.ts                # 업종 × 콘텐츠 종류 few-shot 예시
│   │   ├── toneAnalyze.ts                # F2
│   │   ├── brief.ts                      # F3
│   │   ├── transform.ts                  # F4
│   │   ├── adcopy.ts                     # F5
│   │   ├── reels.ts                      # F6
│   │   ├── blog.ts                       # F7
│   │   ├── detailPage.ts                 # F8
│   │   ├── productDesc.ts                # F9
│   │   └── cardNews.ts                   # F10
│   │
│   ├── domain/                           # 도메인 서비스 (라우트와 DB 사이)
│   │   ├── clients.ts
│   │   ├── campaigns.ts
│   │   ├── contents.ts
│   │   └── approvals.ts
│   │
│   ├── types/                            # 공통 타입 (DB row, API 입출력)
│   │   ├── db.ts                         # supabase gen types --typescript 출력
│   │   ├── api.ts
│   │   └── content.ts                    # 콘텐츠 본문 jsonb 스키마 (zod)
│   │
│   ├── auth.ts                           # 권한 헬퍼 (역할 체크)
│   └── utils/
│       ├── env.ts                        # zod로 env 검증
│       ├── error.ts
│       └── ratelimit.ts                  # IP/유저 단위 호출 제한
│
├── supabase/
│   ├── migrations/                       # SQL 마이그레이션
│   │   ├── 0001_init_schema.sql
│   │   ├── 0002_rls_policies.sql
│   │   └── 0003_indexes.sql
│   ├── seed.sql                          # 데모 데이터
│   └── config.toml
│
├── public/                               # 정적 자산
├── tailwind.config.ts
├── next.config.js
├── middleware.ts                         # 라우트 가드 (세션·역할)
├── .env.example
├── package.json
└── tsconfig.json
```

**왜 이런 모양인가**
- App Router의 라우트 그룹 `(auth)` / `(dashboard)`로 레이아웃 분리. 미들웨어 단계에서 그룹별 보호.
- `lib/ai/gateway.ts`를 **모든 LLM 호출의 단일 통로**로 둔다. 직접 SDK 호출 금지 — 비용 측정·캐싱·가드레일이 절대 빠지지 않게.
- `lib/prompts/*`는 콘텐츠 종류별로 분리하되, `shared/`로 시스템 프롬프트·브랜드킷 직렬화·가드레일을 공유. 각 모듈은 `{ build, parse, model_pref }` 인터페이스를 같은 시그니처로 따르게.
- `components/content/kinds/*` — 콘텐츠 본문이 jsonb이고 종류별로 구조가 다르므로(릴스=샷 배열, 카드뉴스=슬라이드 배열, 블로그=섹션 트리) 뷰어/편집기를 분리.

---

## 2. DB 구조 (Supabase / Postgres + RLS)

### 2.1 ERD (요약)

```text
auth.users ──< profiles ──┐
                          │ (agency_id)
                  agencies ──< clients ──< brand_assets
                                       └─< brand_tone_profiles
                                       └─< campaigns ──< contents ──< content_revisions
                                                                  └─< approvals
                                                                  └─< prompt_logs
                  agencies ──< invitations
                  agencies ──< ai_cost_daily   (집계 뷰)
```

### 2.2 핵심 테이블

```sql
-- 0001_init_schema.sql (요약)

create extension if not exists "uuid-ossp";
create extension if not exists vector;     -- 향후 톤·과거 카피 임베딩 검색용

-- 에이전시 (v1은 1행, v2 SaaS 확장 대비 day1 분리)
create table agencies (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  created_at timestamptz default now()
);

-- 사용자 프로필 (auth.users 1:1)
create type role_t as enum ('admin','planner','operator','designer','viewer');
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  agency_id uuid not null references agencies(id),
  role role_t not null default 'planner',
  display_name text,
  created_at timestamptz default now()
);
create index on profiles (agency_id);

-- 클라이언트(광고주) — 멀티테넌시 격리 키 1순위
create table clients (
  id uuid primary key default uuid_generate_v4(),
  agency_id uuid not null references agencies(id),
  name text not null,
  industry text,                        -- '음식점' | '미용' | '학원' | '의료' | '쇼핑몰' ...
  status text not null default 'active',
  brand_kit jsonb not null default '{}'::jsonb,
  -- brand_kit 예: { logo_url, primary_color, secondary_color, slogan, do_not_say:[], must_say:[] }
  tags text[] default '{}',
  created_by uuid references profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index on clients (agency_id);

-- 클라이언트 자산 (Supabase Storage 참조)
create table brand_assets (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid not null references clients(id) on delete cascade,
  kind text not null,                   -- 'logo' | 'product_image' | 'past_copy' | 'tone_sample' | 'reference'
  storage_path text not null,           -- supabase storage object path
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz default now()
);
create index on brand_assets (client_id);

-- 브랜드 톤 프로파일 (F2 학습 결과)
create table brand_tone_profiles (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid not null references clients(id) on delete cascade,
  version int not null,
  summary jsonb not null,               -- { voice, vocabulary[], do[], dont[], formality, persona }
  examples jsonb,                       -- 입력 샘플 + 추출 근거
  embedding vector(1536),               -- 톤 검색·재사용
  created_by uuid references profiles(id),
  created_at timestamptz default now(),
  unique (client_id, version)
);

-- 캠페인 (F3)
create type campaign_status_t as enum ('draft','active','paused','done','archived');
create table campaigns (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid not null references clients(id) on delete cascade,
  name text not null,
  goal text,                            -- '신규고객 유입' | '재방문' | '구매전환' ...
  target_audience text,
  period_start date,
  period_end date,
  status campaign_status_t not null default 'draft',
  brief jsonb,                          -- AI가 생성한 브리프 본문
  created_by uuid references profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index on campaigns (client_id);

-- 콘텐츠 (F4~F10 결과물 통합 테이블; body jsonb 스키마는 kind마다 다름)
create type content_kind_t as enum (
  'adcopy','reels','blog','detail_page','product_desc','card_news','transform_variant'
);
create type content_status_t as enum ('draft','in_review','approved','rejected','published');
create table contents (
  id uuid primary key default uuid_generate_v4(),
  campaign_id uuid not null references campaigns(id) on delete cascade,
  client_id uuid not null,              -- denormalized for RLS speed
  kind content_kind_t not null,
  channel text,                         -- 'naver_blog' | 'instagram' | 'kakao' | 'meta_ads' | 'google_ads' | 'smartstore' | null
  status content_status_t not null default 'draft',
  body jsonb not null,                  -- 종류별 스키마 (Zod로 검증)
  model text,                           -- 'gpt-4o' | 'claude-sonnet-4-6' ...
  tokens_in int default 0,
  tokens_out int default 0,
  cost_krw numeric(12,2) default 0,
  created_by uuid references profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index on contents (campaign_id);
create index on contents (client_id);
create index on contents (status) where status = 'in_review';

-- 콘텐츠 수정 이력
create table content_revisions (
  id uuid primary key default uuid_generate_v4(),
  content_id uuid not null references contents(id) on delete cascade,
  body jsonb not null,
  edited_by uuid references profiles(id),
  note text,
  created_at timestamptz default now()
);

-- 승인 워크플로우
create type approval_decision_t as enum ('approve','reject','request_change');
create table approvals (
  id uuid primary key default uuid_generate_v4(),
  content_id uuid not null references contents(id) on delete cascade,
  reviewer_id uuid not null references profiles(id),
  decision approval_decision_t not null,
  comment text,
  created_at timestamptz default now()
);

-- 프롬프트 로그 (비용·품질 분석)
create table prompt_logs (
  id uuid primary key default uuid_generate_v4(),
  content_id uuid references contents(id) on delete set null,
  client_id uuid,                       -- denormalized for RLS
  prompt_kind text not null,            -- 'brief' | 'adcopy' | ...
  provider text not null,               -- 'openai' | 'anthropic'
  model text not null,
  cache_hit boolean default false,
  tokens_in int,
  tokens_out int,
  cost_krw numeric(12,2),
  latency_ms int,
  created_at timestamptz default now()
);
create index on prompt_logs (client_id, created_at desc);

-- 일별 비용 집계 (matview)
create materialized view ai_cost_daily as
select date_trunc('day', created_at)::date as d,
       client_id,
       prompt_kind,
       sum(tokens_in) as tokens_in,
       sum(tokens_out) as tokens_out,
       sum(cost_krw) as cost_krw,
       count(*) as calls
from prompt_logs group by 1,2,3;
```

### 2.3 RLS 정책 (요지)

```sql
-- 0002_rls_policies.sql
alter table clients enable row level security;
alter table clients force row level security;

create policy "agency members read clients"
on clients for select
using (
  exists (
    select 1 from profiles p
    where p.id = auth.uid() and p.agency_id = clients.agency_id
  )
);

create policy "planners write clients"
on clients for insert with check (
  exists (
    select 1 from profiles p
    where p.id = auth.uid()
      and p.agency_id = clients.agency_id
      and p.role in ('admin','planner')
  )
);
-- (update/delete 정책 동일 패턴)

-- contents·brand_assets·campaigns 등 모든 자식 테이블은 client_id 또는 campaign_id 경유로
-- 부모(clients.agency_id)에 매핑되는 헬퍼 함수 + 정책으로 격리
```

**RLS 원칙**
1. 앱 사용자 = 비-owner (BYPASSRLS 금지)
2. 모든 테이블 `force row level security`
3. 마이그레이션마다 새 테이블에 정책 누락 검사 — CI에서 `pg_policies` 카운트로 자동 게이트
4. Service-role 키는 서버에서만, Route Handler에서 권한 강제 후 쿼리

---

## 3. 페이지 구조 (라우트 맵)

| 경로 | 역할 | 주요 컴포넌트 | 매핑 기능 |
|---|---|---|---|
| `/login`, `/signup` | 인증 | `LoginForm`, `SignupForm` | — |
| `/` (dashboard 홈) | 작업 큐 + 최근 활동 | `ReviewQueueRow`, `CampaignCard` | 공통 |
| `/clients` | 클라이언트 목록 (검색·태그·업종 필터) | `ClientCard` | F1 |
| `/clients/new` | 신규 등록 | `ClientForm`, `BrandKitEditor` | F1 |
| `/clients/[id]` | 상세 | 요약 카드 + `BrandKitEditor`(읽기) + 톤 프로파일 카드 + 자산 그리드 | F1 |
| `/clients/[id]/edit` | 편집 | `ClientForm` | F1 |
| `/clients/[id]/tone` | **톤앤매너 학습** | `ToneTrainer` (샘플 업로드 → AI 분석 → 프로파일 저장) | F2 |
| `/clients/[id]/assets` | 자산 라이브러리 | 업로드, 카테고리 | F1 |
| `/campaigns` | 캠페인 목록 (status 탭) | `CampaignCard` | F3 |
| `/campaigns/new` | **신규 캠페인** (단계 위저드) | `CampaignWizard` (1.클라이언트 → 2.목표/타겟 → 3.AI 브리프 생성 → 4.저장) | F3 |
| `/campaigns/[id]` | 캠페인 상세 | `BriefViewer`, `ChannelTabs`, 콘텐츠 그리드 | F3, F4 |
| `/campaigns/[id]/generate` | **콘텐츠 생성** | `GenerationModal` (kind 선택: 광고카피/릴스/블로그/상세/상품/카드뉴스 + 채널 + 옵션) | F4~F10 |
| `/content/[id]` | 단건 편집/승인/재생성 | `ContentEditor` + 종류별 뷰어 (`AdCopyView`, `ReelsScriptView`, …) + `ApprovalPanel` + `ClaimChecklist` | F4~F10 |
| `/review` | 검토 큐 (역할별 필터) | `ReviewQueueRow` | 공통 |
| `/settings` | 에이전시·요금·테마 | — | 공통 |
| `/settings/members` | 멤버·역할 관리 | — | 공통 |
| `/settings/billing` | AI 비용 대시보드 (일·클라이언트별) | 차트 | 공통 |

**보호 미들웨어** (`middleware.ts`): 세션 없는 요청은 `/login`, role guard 위반은 403 페이지로.

---

## 4. 컴포넌트 구조

### 4.1 shadcn/ui 프리미티브 (`components/ui/*`)
button, input, textarea, dialog, sheet, tabs, dropdown-menu, command, table, badge, avatar, toast, skeleton, separator, scroll-area — 표준.

### 4.2 도메인 컴포넌트

| 컴포넌트 | 책임 | Props 시그니처 (요약) |
|---|---|---|
| **ClientCard** | 목록/홈에서 카드 | `{ client: Client, onClick }` |
| **ClientForm** | 등록/편집 폼 (zod) | `{ initial?: Client, onSubmit }` |
| **BrandKitEditor** | 톤 키워드·컬러·로고·금지어 편집 | `{ value: BrandKit, onChange, readOnly? }` |
| **ToneTrainer** | 톤 샘플 업로드 → 결과 미리보기 → 저장 (F2) | `{ clientId }` |
| **CampaignCard** | 카드 (상태·기간·KPI) | `{ campaign }` |
| **CampaignWizard** | 4-step 폼 + 스트리밍 브리프 생성 (F3) | `{ clientId? }` |
| **BriefViewer** | 브리프 jsonb를 섹션별 렌더링 | `{ brief }` |
| **GenerationModal** | 콘텐츠 종류·채널·옵션 선택 → 생성 트리거 | `{ campaignId, defaults? }` |
| **ContentEditor** | Tiptap 기반 편집기 | `{ content, onSave }` |
| **kinds/*View** | 종류별 본문 렌더 (광고카피·릴스·블로그·상세·상품·카드뉴스) | `{ body, onChange?, readOnly? }` |
| **ChannelTabs** | 채널별 변환 결과 탭 | `{ campaignId }` |
| **ApprovalPanel** | 승인/반려/수정요청 + 코멘트 | `{ contentId }` |
| **ClaimChecklist** | 본문에서 추출한 사실/광고 클레임 체크 (가드레일) | `{ claims }` |
| **ReviewQueueRow** | 검토 큐 한 줄 | `{ content }` |
| **CostBadge** | 토큰·KRW 비용 인라인 배지 | `{ tokens, krw }` |

### 4.3 컴포넌트 작성 규칙
- **Server Components 우선** — 인터랙션 필요한 부분만 `"use client"`로 격리.
- `kinds/*View`는 모두 `body: ContentBody[Kind]` 한 가지 입력 받게 (zod 타입 가드로 디스패치).
- 스트리밍 응답(`/api/ai/*`)은 `useReadableStream` 훅으로 토큰 단위 렌더.
- 상태 관리는 가능하면 server actions + URL state, 클라이언트 store는 안 씀 (Zustand 등 회피).

---

## 5. API 구조 (Next.js Route Handlers)

### 5.1 도메인 CRUD

| 메서드 | 경로 | 본문 | 응답 |
|---|---|---|---|
| GET | `/api/clients` | `?q=&industry=&page=` | `Client[]` |
| POST | `/api/clients` | `ClientCreateInput` | `Client` |
| GET | `/api/clients/[id]` | — | `ClientDetail` |
| PATCH | `/api/clients/[id]` | `ClientPatchInput` | `Client` |
| DELETE | `/api/clients/[id]` | — | `204` |
| GET | `/api/campaigns` | `?clientId=&status=` | `Campaign[]` |
| POST | `/api/campaigns` | `CampaignCreateInput` | `Campaign` |
| GET | `/api/campaigns/[id]` | — | `CampaignDetail` |
| GET | `/api/contents` | `?campaignId=&kind=&status=` | `Content[]` |
| GET | `/api/contents/[id]` | — | `ContentDetail` |
| PATCH | `/api/contents/[id]` | `body, status` | `Content` |
| POST | `/api/contents/[id]/approve` | `{ comment? }` | `Approval` |
| POST | `/api/contents/[id]/revise` | `{ note, body }` | `ContentRevision` |

### 5.2 AI 생성 엔드포인트 (모두 Streaming)

| 경로 | 입력 | 출력 | 사용 프롬프트 |
|---|---|---|---|
| `/api/ai/tone-train` | `{ clientId, sampleAssetIds[] }` | 톤 프로파일 저장 후 `BrandToneProfile` | `prompts/toneAnalyze.ts` |
| `/api/ai/brief` | `{ campaignId }` | `Stream → brief jsonb` | `prompts/brief.ts` |
| `/api/ai/transform` | `{ campaignId, sourceContentId, targetChannels[] }` | 채널별 콘텐츠 N건 생성 | `prompts/transform.ts` |
| `/api/ai/adcopy` | `{ campaignId, channel, options }` | adcopy `Content` | `prompts/adcopy.ts` |
| `/api/ai/reels` | `{ campaignId, options }` | reels `Content` (샷 배열) | `prompts/reels.ts` |
| `/api/ai/blog` | `{ campaignId, options }` | blog `Content` (섹션 트리) | `prompts/blog.ts` |
| `/api/ai/detail-page` | `{ campaignId, options }` | detail_page `Content` | `prompts/detailPage.ts` |
| `/api/ai/product-desc` | `{ campaignId, productInfo, options }` | product_desc `Content` | `prompts/productDesc.ts` |
| `/api/ai/card-news` | `{ campaignId, slideCount, options }` | card_news `Content` (슬라이드 배열) | `prompts/cardNews.ts` |

### 5.3 모든 AI 라우트의 공통 흐름

```ts
// app/api/ai/_runner.ts (개념)
export async function runAi(req: Request, kind: PromptKind) {
  const user = await requireSession();
  const body = parseInput(kind, await req.json());          // zod
  await assertCanAccessClient(user, body.clientId);          // RLS + role 추가 체크
  await rateLimit(user.id, kind);

  const brandKit = await loadBrandKit(body.clientId);
  const tone = await loadLatestTone(body.clientId);

  const promptModule = await import(`@/lib/prompts/${kind}`);
  const messages = promptModule.build({ brandKit, tone, ...body });

  // ★ 모든 호출은 게이트웨이 단일 통로
  const stream = await aiGateway.stream({
    kind,
    messages,
    modelPref: promptModule.modelPref,                       // provider 라우팅 힌트
    cacheKey: hashCacheKey(kind, brandKit, tone),            // prompt caching
    safety: { industry: brandKit.industry },                  // deny-list 적용
  });

  // 클라이언트로 스트림. 종료 시 contents 행 + prompt_logs + cost 기록
  return streamingResponse(stream, async (final, usage) => {
    const parsed = promptModule.parse(final);
    await persistContent({ ...body, kind, body: parsed, usage });
  });
}
```

### 5.4 가드레일 & 안전장치
- **요청 단계**: zod 입력 검증, role 검사, rate limit, 일일 비용 한도 체크 (`ai_cost_daily` 조회 → 초과시 429).
- **응답 단계**: `safety.ts`가 의료/금융/식품 deny-list 매치 → critic LLM 1회 더 호출하여 재작성.
- **로그**: 모든 호출 `prompt_logs` 기록 (cache_hit, tokens, cost, latency).
- **에러 표면화**: 사용자에게는 한국어 안전 메시지, 내부에는 `error.ts`에서 표준화된 코드.

---

## 6. 프롬프트 구조

### 6.1 공통 인터페이스

```ts
// lib/prompts/_types.ts
export interface PromptModule<I, O> {
  kind: PromptKind;
  modelPref: ('claude-sonnet-4-6' | 'gpt-4o' | 'gpt-4o-mini')[];
  build(input: I & SharedInput): Message[];
  parse(text: string): O;                  // jsonb 본문으로 검증·정규화
  schema: ZodSchema<O>;                    // body jsonb 스키마
}

interface SharedInput {
  brandKit: BrandKit;
  tone?: BrandToneProfile;
  industry: Industry;
  channel?: Channel;
}
```

### 6.2 시스템 프롬프트 레이어 (캐시 친화)

```text
┌──────────────────────────────────────────────────────────┐
│ SYSTEM (캐시됨)                                           │
│ - 역할: "한국 SMB 광고대행사 카피라이터/플래너"            │
│ - 공통 규칙: 한국어 우선, 단정적 효능 표현 금지, …          │
│ - 출력 포맷: JSON schema 명시                              │
├──────────────────────────────────────────────────────────┤
│ BRAND KIT (캐시됨, 클라이언트별)                          │
│ - 브랜드명, 슬로건, 톤 키워드, do/don't, 금지어            │
├──────────────────────────────────────────────────────────┤
│ INDUSTRY GUARDRAILS (캐시됨, 업종별)                      │
│ - 의료광고법: 치료 효과 보장 표현 금지 …                   │
│ - 표시광고법: "최고", "1위", "100%" 사용 금지 …            │
├──────────────────────────────────────────────────────────┤
│ FEW-SHOT (캐시됨, 업종 × 콘텐츠 종류)                     │
│ - 1~3개 모범 예시                                          │
├──────────────────────────────────────────────────────────┤
│ USER (매번 다름)                                          │
│ - 캠페인 브리프 + 채널 + 옵션                              │
└──────────────────────────────────────────────────────────┘
```

> 위 4개 블록까지를 prompt cache 대상으로 묶어 Anthropic의 `cache_control` 또는 OpenAI의 자동 캐시에 태운다. 5번째 블록(USER)만 매 호출 변동.

### 6.3 모듈별 책임 요약

| 모듈 | 입력 핵심 | 출력 jsonb 스키마 |
|---|---|---|
| `toneAnalyze.ts` | 샘플 텍스트/이미지 캡션 모음 | `{ voice, formality, persona, vocabulary[], do[], dont[], examples[] }` |
| `brief.ts` | 캠페인 목표·타겟·기간 | `{ message, channels[], kpi[], hooks[], schedule_hint }` |
| `transform.ts` | source content + targetChannels[] | 채널별 `Content[]` |
| `adcopy.ts` | brief + channel + 길이/톤 옵션 | `{ headline, subhead, body, cta, hashtags[] }` |
| `reels.ts` | brief + 30s/60s | `{ hook, shots:[{ scene, dialog, caption, b_roll }], music_hint, cta }` |
| `blog.ts` | brief + 키워드 + 길이 | `{ title, meta_description, sections:[{ h2, body, image_prompt? }], tags[] }` |
| `detailPage.ts` | brief + 제품정보 | `{ hero:{ headline, sub, cta }, sections:[{ kind, copy, image_prompt }] }` |
| `productDesc.ts` | 제품 spec + 채널(스마트스토어/쿠팡) | `{ title, bullets[], description, search_keywords[] }` |
| `cardNews.ts` | brief + 슬라이드 수 + 톤 | `{ slides:[{ index, title, sub?, body, image_prompt, cta? }] }` |

### 6.4 프롬프트 작성 규칙
1. **모든 출력은 JSON.** 자연어 산문은 사람이 보는 단계에서 렌더. → 파서 안정성·검증 가능.
2. **금지어 deny-list는 system 단계에서 박는다.** user 단계에서는 늦어 — 모델이 이미 토큰을 뱉어냄.
3. **Few-shot은 업종 × 콘텐츠 종류 매트릭스로 1~3개씩.** 새 업종 추가 = JSON 한 줄 추가, 코드 변경 없음 (`lib/prompts/shared/fewshot.ts`).
4. **출력 길이 제어는 옵션 객체로 일관성 유지** (`{ tone: 'friendly|premium|casual', length: 'short|medium|long', cta_strength }`).
5. **재생성/리비전 시 이전 본문 + 사용자 노트를 user에 추가.** system은 그대로 두어 캐시 적중률 유지.

---

## 7. MVP를 끝까지 끌고 가는 단계 순서 (6 phase 제안)

| # | Phase | 산출물 | 핵심 가치 |
|---|---|---|---|
| 0 | **Bootstrap** | Next.js 프로젝트, Tailwind/shadcn, Supabase 프로젝트 생성, RLS day-1, 인증 + middleware, 기본 레이아웃 | 빌드 토대 |
| 1 | **Clients & Brand Kit** (F1) | 클라이언트 CRUD, 자산 업로드, 브랜드킷 편집, 멤버·역할 | 도메인 중심 데이터 |
| 2 | **AI Gateway + Tone Trainer** (F2) | `lib/ai/gateway.ts` + 비용 로그 + prompt cache + safety, 톤 학습 화면 | AI 비용·안전 인프라 (가장 레버리지 높은 결정) |
| 3 | **Campaign + Brief Generator** (F3) | 캠페인 CRUD, 위저드, 스트리밍 브리프 생성, BriefViewer | 첫 AI 가치 |
| 4 | **Content Generators v1** (F5, F7, F9) | 광고카피·블로그·상품설명 — 단일 모델 + 단일 채널 우선 | 직원 시간 절감 시작 |
| 5 | **확장 콘텐츠** (F6, F8, F10, F4) | 릴스·상세페이지·카드뉴스 + 채널 변환(F4) | 풀 라인업 |
| 6 | **Review/Approve + Cost Dashboard** | 검토 큐, 승인 워크플로우, AI 비용 대시보드, 가드레일 critic LLM | 운영 안전성 + 회수 |

> Phase 2의 AI 게이트웨이를 **콘텐츠 생성 기능보다 먼저** 두는 게 핵심. 비용·캐싱·가드레일이 1주만 늦게 들어가도 Phase 3~5 전반에 흩어진다.

---

## 8. 운영·보안 체크리스트 (V1 출시 전)

- [ ] `.env`는 `lib/utils/env.ts`에서 zod로 검증, 서버 전용 키는 클라이언트로 새지 않음 (`NEXT_PUBLIC_*` 분리)
- [ ] Supabase service-role 키는 Route Handler에서만, 절대 RSC에서 직접 사용 금지
- [ ] 모든 테이블 RLS + FORCE, 신규 테이블 정책 누락을 막는 CI 체크
- [ ] AI 호출 일/월 한도 (전역, 에이전시별, 클라이언트별)
- [ ] PII (사장님 연락처/주소) 업로드 시 입력 단계에서 마스킹 옵션
- [ ] 의료·금융 업종 클라이언트는 콘텐츠 status `in_review` → `approved` 전이 시 critic LLM 통과 필수
- [ ] Storage 버킷 공개/비공개 분리: 로고 등은 public, 사장님 자료는 private + signed URL
- [ ] Sentry/PostHog로 에러·비용 알람 (운영자 슬랙/카카오톡 알림 채널)
- [ ] 백업: Supabase PITR 활성화, 매일 schema dump

---

*이 문서는 v1 MVP 빌드의 기술적 청사진이다. 페이즈 진입 시 `/gsd-plan-phase N`이 이 문서와 PROJECT.md / RESEARCH 결과를 함께 읽어 PLAN.md를 만든다.*
