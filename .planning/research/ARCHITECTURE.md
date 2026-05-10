# Architecture Research

**Domain:** Internal AI Marketing Operations Platform (Korean SMB ad agency, LLM-heavy content generation, HITL review)
**Researched:** 2026-05-10
**Confidence:** HIGH (backed by AWS Well-Architected GenAI Lens, Supabase official docs, LiteLLM/Inngest production patterns; modular-monolith and HITL gating well-established for this scale)

## Standard Architecture

### System Overview

A **modular monolith** Next.js app (one deployable, clear internal module boundaries) plus an **out-of-process job worker** for LLM/image generation. The single most important architectural decision for this project is keeping LLM orchestration behind a dedicated abstraction layer (the "AI Gateway") so cost control, caching, fallbacks, and prompt versioning live in one place.

```
┌──────────────────────────────────────────────────────────────────────┐
│                       FRONTEND (Next.js App Router)                  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────┐ │
│  │ Clients  │ │ Campaign │ │ Generate │ │  Review  │ │  Library   │ │
│  │   Mgmt   │ │ Planner  │ │   Hub    │ │  Queue   │ │ (Assets)   │ │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘ └─────┬──────┘ │
│       │            │            │            │             │         │
│       └─── Server Actions / Route Handlers (RSC + tRPC) ────┘        │
├──────────────────────────────────────────────────────────────────────┤
│                       APPLICATION (Domain Modules)                   │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────┐ │
│  │  Auth /  │ │ Clients  │ │ Campaigns│ │  Review  │ │  Assets /  │ │
│  │  Roles   │ │ /Brands  │ │ /Briefs  │ │  /Audit  │ │  Templates │ │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └────────────┘ │
│        │            │            │            │             │        │
│        └────────────┴───── Domain Services ───┴─────────────┘        │
├──────────────────────────────────────────────────────────────────────┤
│                       AI GATEWAY (first-class layer)                 │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  Prompt Templates │ Provider Router │ Cache │ Cost Meter │ Log │ │
│  │  (versioned)      │ (OpenAI/Claude) │ (3-tier) │ (per-tenant) │ │
│  └────────────────────────────────────────────────────────────────┘ │
├──────────────────────────────────────────────────────────────────────┤
│                       JOB QUEUE (async generation)                   │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  Inngest / BullMQ workers — multi-step LLM pipelines, retries  │ │
│  └────────────────────────────────────────────────────────────────┘ │
├──────────────────────────────────────────────────────────────────────┤
│  PERSISTENCE                                                         │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌─────────────┐ │
│  │   Postgres   │ │  Object      │ │    Redis     │ │  Vector     │ │
│  │  (RLS, audit)│ │  Storage     │ │  (cache,queue│ │  (pgvector  │ │
│  │              │ │  (S3/R2)     │ │   ratelimit) │ │   inline)   │ │
│  └──────────────┘ └──────────────┘ └──────────────┘ └─────────────┘ │
└──────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
                   ┌────────────────────────────┐
                   │  EXTERNAL: OpenAI, Claude, │
                   │  Gemini, image gen (DALL-E,│
                   │  Imagen, Stable Diffusion) │
                   └────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| **Frontend (Next.js)** | UI for clients/campaigns/review queue, Korean-first UX, optimistic UI for fast iteration on copy | Next.js 15 App Router, RSC, shadcn/ui, TanStack Query |
| **Auth & Roles** | Internal-only login, role distinction (planner / operator / designer / admin), session/JWT for RLS | Supabase Auth or Auth.js with org+role claims |
| **Clients/Brands module** | CRUD for client profiles, brand tone, target persona; foundation for every downstream feature | Domain service + Postgres tables w/ RLS |
| **Campaigns/Briefs module** | Campaign lifecycle (draft → reviewed → approved → archived), brief metadata, channel mix | Domain service; emits events to Job Queue |
| **AI Gateway** | Single chokepoint for all LLM/image calls — prompt templates, provider routing, caching, cost metering, guardrails (regulated industries) | Custom thin layer wrapping LiteLLM or Vercel AI SDK |
| **Job Queue / Workers** | Async multi-channel content generation, retries, per-step observability, fan-out per channel | Inngest (serverless) or BullMQ+Redis |
| **Review Queue module** | Pending generations → human approval/edit/reject; routes flagged outputs (low confidence, regulated industry) to specific reviewer roles | DB-backed queue table + UI; integrates HITL "interrupt" pattern |
| **Asset Library** | Client logos, past creatives, reference images, generated outputs; versioned with relationship metadata (which campaign, which brief) | Postgres metadata + S3-compatible storage (R2/S3/Supabase Storage) |
| **Prompt Template Store** | Versioned prompts per channel (네이버 블로그, Instagram, Meta, Google), per industry guardrails, A/B variants | Git-tracked YAML/MDX files OR DB table with version column |
| **Audit Log** | Every LLM call, every approval, every edit — required for cost analysis and brand-safety post-mortems | Append-only Postgres table + structured logs |

## Recommended Project Structure

```
adops-ai/
├── apps/
│   └── web/                          # Next.js app (single deployable)
│       ├── app/                      # App Router routes
│       │   ├── (auth)/               # Login, role gates
│       │   ├── clients/              # 클라이언트 관리
│       │   ├── campaigns/            # 캠페인 기획 + 브리프
│       │   │   └── [id]/generate/    # 멀티채널 콘텐츠 생성 허브
│       │   ├── review/               # 휴먼-인-더-루프 검토 큐
│       │   ├── library/              # 자산/템플릿 라이브러리
│       │   └── api/                  # Route handlers (webhooks, queue triggers)
│       └── components/               # Shared UI (shadcn/ui, Korean-locale)
├── packages/
│   ├── db/                           # Drizzle/Prisma schema + migrations
│   │   ├── schema/                   # tenant_id on every table; RLS policies
│   │   └── migrations/
│   ├── domain/                       # Domain modules — pure TS, no framework deps
│   │   ├── clients/                  # Brand profile aggregate
│   │   ├── campaigns/                # Brief, Campaign, Channel aggregates
│   │   ├── review/                   # Review item state machine
│   │   ├── assets/                   # Asset metadata + storage adapter
│   │   └── audit/                    # Audit log writer
│   ├── ai-gateway/                   # FIRST-CLASS LAYER — every LLM call goes through here
│   │   ├── providers/                # OpenAI, Anthropic, Gemini adapters
│   │   ├── prompts/                  # Versioned templates per channel × industry
│   │   │   ├── brief/                # 캠페인 기획안 템플릿
│   │   │   ├── naver-blog/
│   │   │   ├── instagram/
│   │   │   ├── meta-ads/
│   │   │   └── google-ads/
│   │   ├── cache/                    # 3-tier: exact / semantic / prompt-prefix
│   │   ├── guardrails/               # 의료·금융 광고 규제 필터
│   │   ├── cost-meter/               # Per-tenant token + $ accounting
│   │   └── router.ts                 # Provider selection + fallback
│   ├── jobs/                         # Background workers (Inngest functions)
│   │   ├── generate-brief.ts
│   │   ├── generate-channel-copy.ts  # Fan-out per channel
│   │   ├── generate-image.ts
│   │   └── notify-reviewer.ts
│   └── ui/                           # Shared components
├── infra/
│   ├── docker-compose.yml            # Postgres + Redis for local dev
│   └── deploy/                       # Self-host friendly (per Constraints)
└── .planning/                        # GSD planning artifacts
```

### Structure Rationale

- **Modular monolith in `packages/domain/`:** Each domain module (clients, campaigns, review, assets) has its own folder with its own types and services. They communicate via TypeScript imports today — but the boundary is explicit so a future split is mechanical, not a rewrite.
- **`packages/ai-gateway/` as a first-class package:** This is the single biggest lever for cost control and the place where most production pain happens. Isolating it lets you swap providers, run shadow tests, and cap spend without touching domain code.
- **`packages/jobs/` separate from app:** Generation must run async (LLM latency 5-30s, image gen 10-60s). Putting jobs in their own package lets the worker process scale independently and makes per-step observability natural.
- **`packages/db/` with RLS at the schema level:** Multi-tenant-lite (one agency, many client brands) means `tenant_id` (the brand/client) on every table from day one. RLS policies enforce isolation in Postgres so application bugs cannot leak data across clients. (Confidence: HIGH — Supabase + AWS RDS multi-tenant guidance.)
- **`prompts/` versioned in code:** Prompts are product. Treat them like code — git history, PR review, environment-pinned. A DB-backed override layer can be added later for non-engineer editing.

## Architectural Patterns

### Pattern 1: AI Gateway (Single Chokepoint)

**What:** Every LLM and image-gen call goes through one internal module that handles provider selection, caching, cost metering, prompt resolution, and guardrails. No domain code talks to OpenAI/Anthropic SDKs directly.

**When to use:** Mandatory for this project. Cost control on a bootstrap budget is impossible without it; provider lock-in is dangerous (pricing changes monthly in 2025-2026).

**Trade-offs:**
- **Pro:** One place to add caching → instant 30-90% cost reduction. One place to swap providers when pricing/quality shifts. One place to enforce regulated-industry guardrails.
- **Con:** Slight indirection cost; team must resist "just one direct call" temptation.

**Example:**
```typescript
// packages/ai-gateway/src/index.ts
export async function generate(req: GenerateRequest): Promise<GenerateResult> {
  // 1. Resolve prompt template (versioned, channel + industry-specific)
  const prompt = await resolvePrompt(req.templateId, req.variables);

  // 2. Check 3-tier cache (exact → semantic → prompt-prefix on provider)
  const cached = await cache.get(prompt, req.tenantId);
  if (cached) return cached;

  // 3. Apply guardrails (medical/financial industry restrictions)
  await guardrails.validate(prompt, req.industry);

  // 4. Per-tenant budget gate — fail BEFORE the API call
  await costMeter.requireBudget(req.tenantId, estimateTokens(prompt));

  // 5. Provider routing with fallback (Anthropic → OpenAI → Gemini)
  const result = await router.call(prompt, { fallback: true });

  // 6. Record cost, log for audit, populate cache
  await costMeter.record(req.tenantId, result.usage);
  await cache.set(prompt, result, req.tenantId);
  await audit.log({ tenantId: req.tenantId, prompt, result });

  return result;
}
```

### Pattern 2: Async Fan-Out for Multi-Channel Generation

**What:** A campaign brief triggers a parent job that fans out child jobs — one per channel (네이버 블로그, Instagram, Meta 광고, Google 광고). Each channel job runs independently, retries independently, and writes its result back to the brief.

**When to use:** Whenever a single user action triggers >1 LLM call. Sequential generation feels slow (15s × 4 channels = 60s wall clock); parallel fan-out makes it 15s.

**Trade-offs:**
- **Pro:** UI returns immediately, user sees progress per channel, partial failures don't block the whole brief.
- **Con:** Requires job-queue infrastructure (Redis or Inngest); slightly harder local dev.

**Example:**
```typescript
// packages/jobs/generate-brief.ts (Inngest function)
export const generateBrief = inngest.createFunction(
  { id: "generate-brief" },
  { event: "brief/requested" },
  async ({ event, step }) => {
    const brief = await step.run("create-brief", () =>
      aiGateway.generate({ templateId: "brief/v3", variables: event.data })
    );

    // Fan-out per channel — runs in parallel
    const channels = event.data.channels; // ["naver-blog", "instagram", ...]
    const results = await Promise.all(
      channels.map((ch) =>
        step.invoke(`channel-${ch}`, {
          function: generateChannelCopy,
          data: { briefId: brief.id, channel: ch },
        })
      )
    );

    // Push to review queue once all channels done
    await step.run("enqueue-review", () =>
      reviewQueue.add({ briefId: brief.id, items: results })
    );
  }
);
```

### Pattern 3: Human-in-the-Loop Interrupt + Resume

**What:** Generated content is never published or marked "final" by AI alone. It enters a `review_items` table in `pending` state. A human reviewer (planner/operator role) approves, edits, or rejects. Rejection feeds back as signal for prompt improvement.

**When to use:** Mandatory per `Key Decisions` (광고 카피 품질·법적 리스크 — AI 단독 게재 안 함). Especially critical for regulated industries (의료·금융).

**Trade-offs:**
- **Pro:** Brand safety, legal compliance, quality floor, builds training data for future fine-tuning.
- **Con:** Adds latency to publish; reviewer becomes bottleneck if volume grows. Mitigate with confidence-based auto-approval thresholds (later phase).

**Example:**
```typescript
// Generation result lands here, NOT published
type ReviewItem = {
  id: string;
  tenantId: string;       // RLS-enforced
  briefId: string;
  channel: "naver-blog" | "instagram" | "meta" | "google";
  state: "pending" | "approved" | "edited" | "rejected";
  aiOutput: string;
  finalOutput: string | null;  // populated on approve/edit
  confidence: number;          // from gateway; <0.7 → auto-flag
  flags: string[];             // ["medical-industry", "low-confidence"]
  reviewerId: string | null;
  decidedAt: Date | null;
};

// On reject, capture WHY for prompt iteration
type RejectionReason = "off-brand" | "factually-wrong" | "compliance" | "tone" | "other";
```

### Pattern 4: Versioned Prompt Templates

**What:** Prompts live in `packages/ai-gateway/prompts/` as MDX/YAML files with frontmatter (version, channel, industry, model, temperature). Resolved at runtime by ID + version.

**When to use:** As soon as you have >3 prompts. Prompt iteration is the fastest path to quality wins; without versioning you cannot A/B test or roll back regressions.

**Trade-offs:**
- **Pro:** Git history of every prompt change, PR review, easy A/B variants.
- **Con:** Non-engineers must work through engineering to edit. Acceptable for v1 (5-20 internal users); add DB-backed override later.

### Pattern 5: Postgres-First (RLS + Audit + pgvector)

**What:** Postgres is the system of record for everything except blob assets and ephemeral cache. Use `tenant_id` + RLS for isolation, append-only audit table, and `pgvector` extension for semantic cache embeddings — all in one DB.

**When to use:** Every project at this scale (5-20 users, bootstrapped). One DB to operate, back up, and reason about.

**Trade-offs:**
- **Pro:** Single ops surface, transactional consistency between domain data and audit, no separate vector DB to operate.
- **Con:** pgvector is fine to ~1M embeddings — beyond that consider dedicated vector DB. Not a v1 concern.

## Data Flow

### Core Loop: Client → Brief → Multi-Channel Content → Review → Archive

```
[직원: 클라이언트 선택 + 캠페인 목표 입력]
            │
            ▼
   [Frontend: Server Action]
            │ (validates, persists campaign draft)
            ▼
   [Campaigns Module] ──── emits "brief/requested" event ────▶ [Job Queue]
            │                                                       │
            │                                                       ▼
            │                                          [Worker: generate-brief]
            │                                                       │
            │                                                       ▼
            │                                              [AI Gateway]
            │                                          ┌─────┼──────┴──────┐
            │                                          ▼     ▼             ▼
            │                                       [Cache][Guardrails][Provider]
            │                                          │     │             │
            │                                          └─────┴──────┬──────┘
            │                                                       │
            │                                          [Brief stored, fan-out]
            │                                                       │
            │              ┌─────────────┬────────────┬─────────────┴────────────┐
            │              ▼             ▼            ▼                          ▼
            │       [네이버 블로그]  [Instagram]  [Meta 광고 카피]        [Google 광고]
            │              │             │            │                          │
            │              └─────────────┴────────────┴──────────────┬───────────┘
            │                                                        │
            │                                                        ▼
            │                                              [Review Queue: pending]
            │                                                        │
            ▼                                                        ▼
   [Frontend: progress UI ◀─── realtime (Postgres LISTEN/NOTIFY or polling) ─── ]
            │
            ▼
   [직원: 검토 화면에서 승인/수정/거부]
            │
            ▼
   [Review Module: 상태 전이 → approved]
            │
            ▼
   [Asset Library: 캠페인 히스토리 + 재사용 가능한 콘텐츠로 보관]
            │
            ▼
   [Audit Log: 누가 무엇을 언제 승인했는지 영구 기록]
```

### State Management (Frontend)

```
[Server State: TanStack Query]
    ↓ (fetched via Server Actions / API)
[React Components] ←→ [Optimistic Updates] → [Server Action] → [Postgres]
                                                    ↓
                                            [Revalidate query]
```

### Key Data Flows

1. **Brief generation flow:** User submits campaign goals → Server Action persists draft → Inngest event emitted → worker calls AI Gateway → result written to DB → frontend revalidates / receives realtime update → review queue populated.

2. **Channel content fan-out:** Single brief approval triggers N parallel channel-generation jobs → each job hits AI Gateway with channel-specific prompt template → results written individually → review queue shows per-channel review items.

3. **Review decision flow:** Reviewer opens queue → sees AI output side-by-side with brand context → approves/edits/rejects → state transition logged in audit → on approval, item moves to Asset Library → on rejection, reason captured for prompt iteration.

4. **Asset reuse flow:** New campaign for same client → planner browses Asset Library → past approved content fed as few-shot examples to AI Gateway → generation quality improves over time without fine-tuning.

5. **Cost metering flow:** Every AI Gateway call → costMeter records tokens/$ → tagged by tenant_id (client/brand), user_id (employee), channel, template version → daily rollup feeds admin dashboard for spend visibility.

## Build Order (CRITICAL — informs roadmap phasing)

These layers must exist in this order. Each is a prerequisite for the next.

| # | Layer | Why First/When |
|---|-------|----------------|
| **0** | Project skeleton + DB + Auth + Roles | Nothing works without users, sessions, role distinction. RLS policies must be in place before any tenant data is written — retrofitting RLS is painful. |
| **1** | Clients/Brands CRUD | Every other feature is "for a client." No generation makes sense until you can pick a client. |
| **2** | Asset Library (read/upload) basics | Even if generation isn't built yet, planners need somewhere to put logos/reference materials so generation has context. Can be MVP-thin. |
| **3** | AI Gateway (without caching) | Build the abstraction BEFORE the first generation call. Even minimal — provider adapter + prompt loader + cost logging. Adding the gateway later means rewriting every call site. |
| **4** | Job Queue infrastructure | Sync calls feel broken at LLM latency. Queue + worker must exist before generation features ship. |
| **5** | Brief generation (single-shot) | First end-to-end LLM feature. Validates: gateway works, queue works, prompts work, RLS works. |
| **6** | Review Queue (basic approve/reject) | The instant generation works, you need HITL. Do not ship generation without review — Key Decisions mandates HITL. |
| **7** | Multi-channel fan-out generation | Builds on brief generation; same pattern, parallelized. Now you have the table-stakes loop. |
| **8** | Caching (exact + prompt-prefix) | Add once you have real prompts in production — caching empty prompts is pointless. Provider-level prompt caching first (Anthropic/OpenAI native), then exact-match Redis layer. |
| **9** | Image generation | Higher cost, lower frequency than copy. Add after copy loop is solid. Start with prompt-only (planner copies prompt to external tool), then direct generation. |
| **10** | Cost dashboard + per-tenant budgets | Once you see bills, you'll want this. The metering hooks should exist from step 3, but the UI/limits come now. |
| **11** | Semantic cache + few-shot library reuse | Optimization layer. Past approved outputs as RAG context for new generations. |
| **12** | Regulated-industry guardrails (의료·금융) | Specific filter prompts + post-generation validators. Add once those clients are onboarded. |

**Critical sequencing rule:** Steps 0-3 are all "platform" work that has no user-visible feature output. Resist the temptation to skip ahead to step 5 — the platform investment in steps 0-3 is what makes everything from step 5 onward feasible at one-person scale.

## Multi-Tenant Data Isolation

**Tenant model:** This is "multi-tenant-lite" — one ad agency runs the platform, but the agency manages many client brands. The natural tenant unit is the **client/brand**, NOT the agency. Per `Constraints`: "클라이언트 영업 정보 포함 — 자체 호스팅 가능한 구조 권장(클라우드 SaaS여도 데이터 격리 명확히)."

**Approach:** Single Postgres database, shared schema, `tenant_id` (= `client_brand_id`) column on every domain table, Postgres RLS policies enforcing isolation. Agency-level admins have explicit cross-tenant policies; regular employees see only the clients assigned to them.

**Implementation notes:**
- RLS policy on every table: `USING (tenant_id = current_setting('app.tenant_id')::uuid)`.
- Set `app.tenant_id` per request from session JWT (Supabase Auth pattern, or manual `SET LOCAL` in connection middleware).
- Index on `tenant_id` is mandatory — RLS adds an implicit `WHERE` to every query.
- Separate `agency_role` (admin vs employee) policies for cross-client visibility (admins can see all brands).
- Object storage uses tenant-prefixed keys: `s3://bucket/{tenant_id}/{asset_id}.png`. Signed URLs gate access.
- Future SaaS expansion (per Key Decisions) is then natural: add an `agency_id` layer above `tenant_id` and extend RLS — no rewrite.

## Where Caching and Cost Control Sit

**Single answer: in the AI Gateway, never in domain code.** This is the single most important architectural rule for this project.

Three caching layers, all inside `packages/ai-gateway/cache/`:

1. **Provider-level prompt-prefix caching** (Anthropic, OpenAI). Free 50-90% cost reduction on long system prompts + brand context. Just send the right cache headers — automatic. Confidence: HIGH.

2. **Exact-match cache (Redis)**. Hash(prompt + model + temperature) → response. Saves 100% on repeat calls. Common for "regenerate" buttons, retries, dev iteration. TTL ~24h.

3. **Semantic cache (pgvector)**. Embed prompt → cosine-search recent prompts in same tenant → if similarity > 0.95, return cached response. Captures paraphrased re-runs. Add LATER (step 11) — premature for v1 because you don't know your prompt distribution yet.

**Cost control hooks** (also in gateway):
- **Per-tenant token budget** — daily/monthly cap per client/brand. Block before API call, not after.
- **Model selection by stakes** — brief generation uses cheaper model (gpt-4o-mini, claude-haiku); final ad copy uses premium (claude-sonnet, gpt-4o). Routing decision in gateway, not in domain code.
- **Audit log of every call** with tenant, user, template version, tokens, $ cost. Even when cached (mark as cache-hit). Required for cost analysis and prompt-quality regression detection.

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| **5-20 users (v1, internal agency)** | Modular monolith on a single VPS or Vercel + Supabase + Upstash Redis. Inngest free tier or self-hosted BullMQ. Single Postgres. **No optimization needed beyond gateway caching.** |
| **100-500 users (multi-agency SaaS)** | Add semantic cache. Move workers to dedicated container (Railway/Render). Read replica for analytics queries. Per-tenant model tier selection (paying customers get premium models). |
| **1000+ users** | Re-evaluate: queue partition per tenant tier, dedicated vector DB if pgvector hits limits, consider extracting AI Gateway to separate service if multiple apps share it. |

### Scaling Priorities (what breaks first)

1. **First bottleneck: LLM API rate limits and bills.** Hit before any infrastructure stress. Mitigation: caching (already in gateway), provider fallback (already in gateway), per-tenant budgets.
2. **Second bottleneck: review queue throughput (human bottleneck, not technical).** Reviewers can't keep up with generation volume. Mitigation: confidence-based auto-approval for low-stakes channels, role-based queue partitioning, batched review UI.
3. **Third bottleneck: Postgres write contention on audit log.** Append-only inserts on every LLM call. Mitigation: partitioned table by month; offload to columnar store if it ever matters (it won't at v1 scale).

## Anti-Patterns

### Anti-Pattern 1: Direct LLM SDK calls scattered across domain code

**What people do:** `import OpenAI from "openai"` in the campaigns module, the briefs module, the review module. Each call site re-implements retry, cost logging, prompt construction.

**Why it's wrong:** No central place for caching → 0% cache hit rate. Provider switch becomes a multi-week refactor. Cost analysis impossible. Prompt versions diverge.

**Do this instead:** All calls through `packages/ai-gateway`. Lint rule forbidding direct provider SDK imports outside the gateway package.

### Anti-Pattern 2: Synchronous LLM calls in request/response cycle

**What people do:** Server Action calls OpenAI, awaits 15-30s, returns response. UI shows spinner.

**Why it's wrong:** Vercel/serverless function timeouts (10-60s) hit. User leaves the page → request abandoned. Multi-channel generation becomes 60s+ wall clock. Retries on transient failures impossible.

**Do this instead:** Server Action enqueues a job and returns immediately. Frontend polls or subscribes to realtime updates. Worker has minutes, not seconds, of budget. Failures retry without user knowing.

### Anti-Pattern 3: Skipping HITL "to ship faster"

**What people do:** "We'll add review later, just publish the AI output for now."

**Why it's wrong:** Violates `Key Decisions` (휴먼-인-더-루프 필수). One bad medical/financial ad copy → legal liability. Even one off-brand campaign for a real client → trust loss. Reviewing an existing piece of bad content is far worse than reviewing a draft.

**Do this instead:** HITL is in the v1 critical path. Output → review queue → human action → publish. Build the queue at step 6 of the build order, before adding more channels.

### Anti-Pattern 4: One giant prompt for "generate all channel content"

**What people do:** Single 4000-token prompt asking the LLM to produce blog post + Instagram + Meta + Google copy in one call.

**Why it's wrong:** Worse output quality (model attention degrades), no per-channel retry, no per-channel A/B, can't cache at channel level, can't use different models per channel (cheap for hashtags, premium for blog).

**Do this instead:** Per-channel prompt templates, parallel fan-out via job queue. Channel-specific guardrails and post-processing.

### Anti-Pattern 5: Storing prompts in the database from day one

**What people do:** "Prompts are content, put them in Postgres so non-engineers can edit." Build a CRUD UI for prompts before the product works.

**Why it's wrong:** No git history, no PR review, no rollback, no dev/staging/prod parity. Non-engineers don't actually edit prompts in v1 — engineers do, multiple times per week. Premature flexibility.

**Do this instead:** Prompts as code in `packages/ai-gateway/prompts/`. Add DB-backed override layer in v2 if a real non-engineer editor materializes.

### Anti-Pattern 6: Forgetting RLS until "we get hacked"

**What people do:** Application-layer `WHERE tenant_id = ?` filtering only. Postgres has no idea what tenant means.

**Why it's wrong:** One missing `WHERE` in an admin query, one ORM bug, one debug endpoint → cross-tenant leak. With client sales data in scope, this is a business-ending bug.

**Do this instead:** RLS on every domain table from migration #1. Set `app.tenant_id` from session in a connection-level hook. Tests that verify cross-tenant queries return zero rows.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| OpenAI / Anthropic / Gemini | Through AI Gateway only; LiteLLM SDK or Vercel AI SDK as base | Always with fallback chain. Anthropic prompt caching for brand-context system prompts. |
| Image gen (DALL-E 3, Imagen, SDXL) | Async via job queue; long-running (10-60s) | Output → object storage → asset library row. Never block UI. |
| Object storage (S3 / R2 / Supabase Storage) | Direct upload via signed URLs from frontend; metadata in Postgres | Tenant-prefixed key structure. Signed URLs scoped to tenant. |
| Email / Slack notifications | Job-queue triggered when review queue receives new item | Non-blocking; failures don't affect generation. |
| Future: 네이버, 카카오, Meta, Google Ads APIs | Out of scope for v1 (per PROJECT.md) | Architecture allows adding "Publish" module later that reads from Asset Library. |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| Frontend ↔ Domain modules | Server Actions / Route Handlers | Type-safe via tRPC or Server Actions w/ Zod validation |
| Domain modules ↔ Domain modules | Direct TS imports (modular monolith) | Rule: no module imports another's internal types — only public service interfaces |
| Domain modules ↔ AI Gateway | Function call (gateway is in-process) | Gateway interface is stable; provider implementations swap behind it |
| Domain modules ↔ Job Queue | Event emit (Inngest) or `queue.add` (BullMQ) | Domain emits intent ("brief/requested"); doesn't know who handles it |
| Workers ↔ DB | Through same domain services as web app | Workers are NOT a parallel codebase — they import the same `packages/domain/` |
| Everything ↔ Postgres | Drizzle/Prisma; RLS-aware connection per request | One connection pool per app + one per worker. `SET LOCAL app.tenant_id` per transaction. |

## Sources

**HIGH confidence (official docs / well-established patterns):**
- [Authorization via Row Level Security | Supabase Features](https://supabase.com/features/row-level-security)
- [Multi-tenant data isolation with PostgreSQL Row Level Security | AWS](https://aws.amazon.com/blogs/database/multi-tenant-data-isolation-with-postgresql-row-level-security/)
- [Multi-tenant generative AI platform scenario | AWS Generative AI Lens](https://docs.aws.amazon.com/wellarchitected/latest/generative-ai-lens/multi-tenant-generative-ai-platform-scenario.html)
- [Architectural Approaches for AI and ML in Multitenant Solutions | Microsoft Azure Architecture Center](https://learn.microsoft.com/en-us/azure/architecture/guide/multitenant/approaches/ai-ml)
- [LiteLLM — unified LLM gateway](https://github.com/BerriAI/litellm)
- [Building Generative AI prompt chaining workflows with human in the loop | AWS](https://aws.amazon.com/blogs/machine-learning/building-generative-ai-prompt-chaining-workflows-with-human-in-the-loop/)
- [Optimize LLM response costs and latency with effective caching | AWS](https://aws.amazon.com/blogs/database/optimize-llm-response-costs-and-latency-with-effective-caching/)

**MEDIUM confidence (multiple credible sources agree):**
- [Inngest vs BullMQ vs Trigger.dev for SaaS 2026 — StarterPick](https://starterpick.com/guides/inngest-vs-bullmq-vs-triggerdev-boilerplates-2026)
- [Prompt Caching Infrastructure | Introl Blog](https://introl.com/blog/prompt-caching-infrastructure-llm-cost-latency-reduction-guide-2025)
- [Microservices vs Monolith for Startups: 2026 Architecture Guide](https://technijian.com/software-development/microservices-vs-monolith-for-startups-the-honest-2026-decision-guide/)
- [Human-in-the-Loop AI Review Queues: Workflow Patterns | AllDaysTech](https://alldaystech.com/guides/artificial-intelligence/human-in-the-loop-ai-review-queue-workflows)
- [Adding Durable Human-in-the-Loop to AI Applications | Temporal](https://learn.temporal.io/tutorials/ai/building-durable-ai-applications/human-in-the-loop/)
- [Multi-Tenant Applications with RLS on Supabase | AntStack](https://www.antstack.com/blog/multi-tenant-applications-with-rls-on-supabase-postgress/)

---
*Architecture research for: Internal AI Marketing Operations Platform (AdOps AI), Korean SMB ad agency*
*Researched: 2026-05-10*
