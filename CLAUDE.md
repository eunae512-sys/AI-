<!-- GSD:project-start source:PROJECT.md -->
## Project

**AI 마케팅 운영 플랫폼 (AdOps AI)**

소상공인 광고대행사의 내부 업무를 자동화하는 AI 마케팅 운영 플랫폼. 기획자·운영자가 클라이언트별 광고 캠페인을 빠르게 기획하고, 채널별(네이버, 인스타그램, 카카오, 메타/구글 광고 등) 콘텐츠를 AI로 일괄 생성·관리할 수 있는 사내 SaaS 형태의 웹앱.

**Core Value:** **광고대행사 직원 1명이 처리할 수 있는 클라이언트 수와 캠페인 처리량을 2배 이상으로 끌어올린다** — 모든 기능 결정의 기준은 "이 기능이 직원의 반복 업무를 실제로 줄이는가"다.

### Constraints

- **언어**: 한국어 우선 — 카피·기획안 품질이 핵심 가치이므로 영문 모델 출력 그대로 쓰면 안 됨
- **사용자 규모**: 초기에는 1개 대행사 내부(5~20명) — 멀티테넌시는 v1 범위에는 가벼운 수준만
- **예산**: 1인 운영자 기반의 부트스트랩 — AI API 비용 통제(캐싱·토큰 관리)가 일찍 들어와야 함
- **데이터 민감도**: 클라이언트 영업 정보 포함 — 자체 호스팅 가능한 구조 권장(클라우드 SaaS여도 데이터 격리 명확히)
- **법적**: 의료·금융 등 광고 규제 업종 카피 생성 시 표현 규제 준수 가드레일 필요
<!-- GSD:project-end -->

<!-- GSD:stack-start source:research/STACK.md -->
## Technology Stack

## TL;DR — Prescriptive Stack
| Layer | Recommendation | One-line Why |
|-------|----------------|--------------|
| Runtime / Framework | **Next.js 16 (App Router) + TypeScript 5.6+** | Largest ecosystem, best AI SDK integration, Seoul (icn1) edge region available |
| UI | **shadcn/ui + Tailwind CSS v4 + Radix primitives** | De facto standard 2026, zero vendor lock, ships fast |
| DB + Auth + Storage | **Supabase (Postgres 16 + pgvector + Auth + Storage)** | One bill, RLS for multi-tenant, fits 1-person ops |
| ORM | **Drizzle ORM** | Tiny bundle, edge-ready, SQL-first — pairs cleanly with Supabase RLS |
| Primary LLM (copy) | **Claude Sonnet 4.5 / 4.6** with **prompt caching** | Best brand-voice consistency for ad copy, prompt caching cuts cost ~90% |
| Secondary LLM (volume) | **GPT-5 / GPT-5.2** via OpenRouter | Volume generation, Korean-strong, automatic caching |
| Korean cultural fallback | **HyperCLOVA X (CLOVA Studio)** or **Solar Pro 3** | When 한국어 cultural nuance / 네이버 SEO copy is critical |
| LLM gateway | **Vercel AI SDK 5** (primary) + **OpenRouter** (fallback / model swap) | Streaming, tool calls, multi-provider failover |
| Image gen — text on image | **Ideogram v3** | Best legible Hangul/text rendering for sale tiles, banners |
| Image gen — photoreal product | **Google Imagen 4** | Best product/lifestyle photorealism, transparent BG support |
| Image gen — brand consistency | **FLUX.1 Kontext Pro** (via Replicate or fal.ai) | Reference-image style matching for repeat clients |
| Background jobs | **Trigger.dev v3** (or Inngest) | Long-running AI workflows, human-in-loop checkpoints, observability |
| Hosting | **Vercel Pro (icn1 Seoul region)** | Lowest Korea latency on managed Next.js, no infra ops |
| Object storage | **Supabase Storage** (start) → **Cloudflare R2** (when egress > $20/mo) | Stay simple until cost demands the switch |
| Editor | **Tiptap v2** | ProseMirror foundation handles Korean IME composition correctly |
| Observability | **Langfuse** (LLM traces) + **Sentry** (app errors) | OSS-friendly, supports prompt cost attribution |
## Core Technologies
| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| **Next.js** | 16.x (App Router) | Full-stack React framework | Stabilized Turbopack, PPR GA, largest hiring/ecosystem pool, first-class Vercel AI SDK integration. Server Actions ideal for HITL approval flows. |
| **TypeScript** | 5.6+ | Type safety | Non-negotiable for an AI app where prompt schemas, tool calls, and structured outputs are everywhere. |
| **React** | 19.x | UI library | Required by Next.js 16. RSC + Server Actions reduce boilerplate for the agency-internal workflow. |
| **Tailwind CSS** | v4.x | Styling | shadcn/ui is on v4. CSS-first config, faster builds. |
| **shadcn/ui** | latest (CLI) | Component library | Copy-paste components — you own the code. No vendor breaking changes. Tailwind v4 + React 19 ready. |
| **Supabase** | Cloud (Postgres 16) | DB + Auth + Storage + Realtime | One service = one bill = one mental model for a solo operator. RLS handles tenant + role isolation natively. pgvector built in for content embedding/reuse. |
| **Drizzle ORM** | 0.36+ | TypeScript ORM | ~7kb runtime, edge-ready, SQL-first. Plays nicely with Supabase's session-mode connection (set `prepare: false`). Faster cold starts than Prisma on serverless. |
| **Vercel AI SDK** | 5.x | LLM client + streaming | 20M+ monthly downloads, dominant TS toolkit. `streamText`, `generateObject` (Zod schema), `stopWhen` multi-step loops cover 90% of needs. Provider-agnostic — swap models without rewriting. |
| **Anthropic Claude Sonnet 4.5/4.6** | API | Primary copy/brief LLM | Best at holding a defined brand voice across long sessions (proven for ad copy 2026). Prompt caching = 90% cost reduction on stable system prompts (brand kits, regulatory rules). Strong Korean output quality. |
| **OpenAI GPT-5 / 5.2** | API | Secondary / volume LLM | Strong KMMLU scores, automatic prompt caching (50% off cached input). Use for high-volume channel-variant generation where cost-per-call matters more than voice fidelity. |
| **Trigger.dev** | v3 | Background jobs / AI workflows | Designed for long-running LLM jobs (no serverless timeouts), Realtime Streams for token streaming to UI, Waitpoints for human-in-the-loop approval, OSS self-host option. Beats BullMQ for AI-shaped work. |
## Supporting Libraries
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| **Zod** | 3.23+ | Schema validation | Every structured LLM output (`generateObject`), every form. Required by AI SDK. |
| **next-intl** | 3.x | i18n (Korean + English UI) | Korean-first UI; keeps English admin labels possible. App Router native, RSC-friendly. |
| **TanStack Query** | v5 | Client data fetching | Optimistic updates on the HITL approval queue, caching of generated drafts. |
| **Tiptap** | v2 | Rich text editor for copy review | ProseMirror under the hood handles Korean IME composition (한글 조합 입력) correctly — Lexical has had open issues here. Extension ecosystem for tracked changes / comments. |
| **Langfuse** | latest (cloud or self-host) | LLM observability | Per-request cost attribution, prompt versioning, eval dataset replay. Critical for "is the brief generator drifting?" |
| **Sentry** | 8.x | App error monitoring | Standard. Has Next.js 16 SDK. |
| **react-hook-form + zod** | latest | Forms (client brief, brand kit) | Industry standard pairing. |
| **date-fns + date-fns-tz** | 3.x | Korean dates / 한국 시간 | Asia/Seoul timezone everywhere. Lighter than dayjs ecosystem with locale support. |
| **lucide-react** | latest | Icons | Default for shadcn/ui. |
| **OpenRouter SDK** | latest | Multi-provider fallback | Configure Claude → GPT-5 → HCX fallback chain for outage resilience. ~25ms overhead. Pay-as-you-go without separate vendor accounts. |
| **pgvector** (via Supabase) | 0.7+ | Embeddings for content reuse | "Find past campaigns similar to this brief" — major time-saver per the PROJECT.md "같은 시즌·업종에 같은 패턴이 반복됨". |
| **react-pdf / @react-pdf/renderer** | latest | Brief PDF export | Agencies hand briefs to designers/clients as PDFs. Korean font: pre-bundle Pretendard. |
| **Pretendard** | font (web) | Korean UI font | De facto Korean web font 2024-2026. Better than Noto Sans KR for UI density. Self-host. |
## LLM Strategy (Korean-specific)
### Recommended tiered routing
| Use case | Model | Rationale | Confidence |
|----------|-------|-----------|------------|
| **Brand brief generation** (long-form, voice-critical) | Claude Sonnet 4.5/4.6 | Best brand voice fidelity, cache the brand kit (90% off). Strong Korean. | HIGH |
| **Channel variants** (10+ Instagram caption variants per campaign) | GPT-5 or GPT-5.2 | Cheaper at volume, automatic caching, speed. | HIGH |
| **Naver Blog SEO copy** | HyperCLOVA X (CLOVA Studio HCX-005 / DASH) | Trained on 6,500x more Korean than GPT-4. Best at Naver-style 본문/제목 SEO and Korean cultural nuance. Korean tokenizer = 2x cheaper per Korean char. | MEDIUM |
| **Cheap drafts / refactors** | GPT-5 nano / Claude Haiku 4.5 | Quick reword, hashtag, CTA generation. | HIGH |
| **Image prompt expansion** | GPT-5 (text-only) | Don't burn Sonnet tokens on prompt-engineering glue. | HIGH |
### Korean tokenizer reality check
- Anglo tokenizers (GPT/Claude) use **~1.5–3x more tokens for Korean** than English. Build cost models with that multiplier.
- HyperCLOVA X has a **Korean-optimized tokenizer** — for Korean-heavy workloads (Naver Blog, long product descriptions), HCX can be 2x cheaper per equivalent Korean output even at higher per-token list price.
- Always benchmark on your own Korean prompts before locking choice.
### Cost control discipline (must implement Phase 1)
## Image Generation Strategy
| Need | Model | Access | Why |
|------|-------|--------|-----|
| Text-on-image (sale tiles, 할인 banners, event posters) | **Ideogram v3** | ideogram.ai API or Replicate | Best legible text rendering (~90-95% accuracy on Latin; verify Hangul yourself in Phase 1 — vendor docs do not guarantee Hangul accuracy). |
| Photoreal product / 음식점 / 매장 lifestyle | **Imagen 4 (Ultra)** | Google Vertex AI | Most photorealistic in 2026. Transparent BG output — useful for shopping ads. |
| Brand-consistent reruns (same client, multiple campaigns) | **FLUX.1 Kontext Pro** | fal.ai or Replicate | Reference-image conditioning preserves brand color/style across generations. |
| Cheap drafts / thumbnail iteration | Open-weight FLUX.1 [dev] on fal.ai | fal.ai | $0.008–0.04/image — 50–70% cheaper than premium APIs for throwaway iterations. |
## Compliance & Guardrails (Korean regulatory context)
| Concern | Mechanism | Stack tool |
|---------|-----------|------------|
| 의료법 광고 표현 금지 (cure/100%/specific outcome claims) | Industry-keyed regex blocklist + LLM-as-judge pre-publish check | Custom Zod-validated rule engine + Claude Haiku verifier |
| AI-generated label requirement (KFTC Dec 2025) | Auto-append "AI 생성 콘텐츠" tag, watermark on images | Sharp/ImageMagick post-processing |
| 의료 광고 사전심의 (medical industry) | Block direct-publish, require explicit human approval state | Trigger.dev Waitpoint |
| PIPA personal data | Don't send PII to LLM providers; mask client phone/RRN before prompt assembly | DLP middleware in AI SDK wrapper |
| Domestic representative requirement (Oct 2025+) | Use NCloud + Korean entity if processing >threshold | Operational, not stack |
## Hosting & Infrastructure
| Concern | Recommendation | Alternative |
|---------|----------------|-------------|
| Web hosting | **Vercel Pro, icn1 (Seoul) primary region** | Northflank / Railway if you need persistent workers |
| DB | **Supabase Cloud (Tokyo region — closest to Seoul, ~30-50ms)** | Self-host Supabase on NCloud if PIPA data residency becomes hard requirement |
| LLM API | Direct Anthropic + OpenAI accounts; **OpenRouter as secondary path** | NCloud CLOVA Studio for HCX |
| Image gen | fal.ai (aggregator, fast, cheap) for FLUX/Imagen; Ideogram direct | Replicate as fallback |
| Background jobs | Trigger.dev cloud (start) | Self-host Trigger.dev v3 (Apache 2.0) on Hetzner if cost grows |
| Object storage | Supabase Storage (start) | Cloudflare R2 once monthly egress > ~$20 (R2 zero-egress) |
| Email (invitations, brief PDFs) | Resend | AWS SES (Tokyo) for bulk |
| Monitoring | Sentry + Langfuse Cloud | Self-host Langfuse on $5 VPS |
## Development Tools
| Tool | Purpose | Notes |
|------|---------|-------|
| **pnpm** | Package manager | Faster, disk-efficient, Vercel-supported. |
| **Biome** | Linter + formatter | Replaces ESLint + Prettier in 2026 — 10x faster, single config. |
| **Vitest** | Unit testing | Faster than Jest, native ESM, TS-first. |
| **Playwright** | E2E testing | Standard 2026 choice. Covers Korean IME testing scenarios well. |
| **Drizzle Kit** | Migrations | Pairs with Drizzle ORM. SQL-first migrations are auditable. |
| **GitHub Actions** | CI/CD | Free for private repos at this scale. Vercel handles deploy preview. |
| **Cursor / Claude Code** | AI dev environment | Solo operator productivity multiplier. |
## Installation
# Project init
# shadcn/ui (Tailwind v4)
# Core
# Background jobs
# Observability
# Image processing (regulatory watermarking)
# Dev
## Alternatives Considered
| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Next.js 16 | Remix / React Router v7 | If team strongly prefers Web Fetch API + simpler mental model. Fine choice — but loses Vercel AI SDK first-class integration. |
| Next.js 16 | SvelteKit | Smaller bundle, faster DX. Reject for this project: smaller Korean dev hiring pool, less AI-tooling momentum. |
| Supabase | Neon + Clerk + R2 | If you grow past 50K MAU and want best-in-class per layer. More services to bill/monitor — wrong for solo operator at this stage. |
| Supabase Auth | Clerk | If you need orgs/RBAC out-of-box and willing to pay $0.02/MAU. Reasonable swap if Supabase RLS gets unwieldy — but RLS is the right multi-tenant pattern here. |
| Drizzle | Prisma 7 | If team prefers schema-first DSL and doesn't deploy to edge. Both are fine in 2026; Drizzle wins on bundle/edge. |
| Trigger.dev v3 | Inngest | If you want the most integrated Vercel/serverless story. Inngest is excellent — choose Trigger.dev specifically because AI workflows benefit from long-running compute + Waitpoints for HITL. |
| Trigger.dev v3 | BullMQ + Upstash Redis | If you already operate Redis. Overkill plumbing for solo operator. |
| Claude Sonnet (primary) | GPT-5 (primary) | If you need cheaper volume and brand voice matters less than throughput. Reverse the tiering. |
| HyperCLOVA X | Solar Pro 3 (Upstage) | Solar Pro 3 has transparent pricing and free tier through Mar 2026, MoE 102B. Good substitute if NCloud onboarding friction is too high. |
| Ideogram v3 | GPT Image 2 | If you already pay OpenAI and want one-vendor simplicity. Ideogram still wins on pure text rendering. |
| Tiptap | Lexical | If you need Meta-grade React Native parity. Tiptap wins for web + Korean IME stability. |
| Tailwind v4 + shadcn/ui | Mantine / Chakra | Reasonable for admin-heavy apps. Reject: shadcn/ui has won 2026 momentum and you own the code. |
## What NOT to Use
| Avoid | Why | Use Instead |
|-------|-----|-------------|
| **LangChain JS as primary orchestrator** | Heavy abstraction for what is fundamentally streaming + tool-calling. AI SDK gives 90% of value with 10% of complexity. | Vercel AI SDK 5; reach for LangGraph only if you build true agent graphs in v2 |
| **Prisma on edge runtime** (without Accelerate) | Bundle size + connection pooling pain. | Drizzle |
| **Firebase / Firestore** | Multi-tenant SaaS with role-based queues fights Firestore's data model. No SQL. Lock-in. | Supabase Postgres |
| **NextAuth/Auth.js v5 alone for RBAC** | No built-in roles/orgs/2FA — you reinvent it. | Supabase Auth + RLS, or Clerk |
| **MongoDB** | Brand kits, campaigns, approvals are deeply relational. SQL + RLS is the right answer for multi-tenant. | Postgres (Supabase) |
| **Pure self-rolled queue on Vercel cron** | Vercel function timeouts kill long LLM workflows; no observability; no retries. | Trigger.dev |
| **Sending raw GPT-4o output to publish** | Ad copy regulatory + brand-voice risk. PROJECT.md mandates HITL. | Always route through approval Waitpoint |
| **One LLM provider only** | Outages, model deprecations, Korean quality varies per task. | Multi-provider via OpenRouter fallback or AI SDK provider switch |
| **Lexical for Korean editor** | Has had open IME composition bugs (한글 조합 끊김). Verify before adopting. | Tiptap (ProseMirror) |
| **Noto Sans KR for UI** | Heavier, less optimized for screen UI density. | Pretendard |
| **Google Cloud Run / Cloud Functions** for primary | No Korea-near edge story matching Vercel icn1. Cold-start tradeoffs. | Vercel Pro + icn1 |
| **Building media-buying API integrations in v1** | PROJECT.md explicitly out-of-scope; Meta/Google ad APIs require commerce review. | Defer to v2 |
| **Translating English LLM output to Korean** | Quality drops below "agency-acceptable copy" bar. | Generate natively in Korean |
## Stack Patterns by Variant
- Promote **HyperCLOVA X** to primary for blog/place copy generation
- Keep Claude for brand brief reasoning (better at structured planning)
- Budget for both — likely $200–400/mo at 5–20 user agency scale
- Use **GPT-5** as sole provider initially (broad coverage, automatic caching, cheapest at volume)
- Upgrade specific tasks to Claude/HCX after measuring user-rated quality
- Self-host Supabase on Naver Cloud Platform
- Use HyperCLOVA X (CLOVA Studio runs in NCloud)
- Avoid Anthropic/OpenAI for that client's data; route to NCloud-hosted models only
- This is a v2 enterprise SKU — don't build for it in v1
- Pre-generate a small set of branded backgrounds per client, reuse with overlaid text
- Move to FLUX.1 [dev] open-weight via fal.ai for drafts ($0.008/img)
- Reserve Imagen 4 / Ideogram for final approved creatives only
- Migrate from Supabase Auth → Clerk Organizations (built-in org infra, custom roles)
- Migrate Supabase Storage → Cloudflare R2 (egress savings dominate)
- Consider Drizzle multi-schema-per-tenant; keep RLS as defense in depth
## Version Compatibility
| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| Next.js 16 | React 19, Tailwind v4 | Turbopack stable, PPR GA. Ensure Node 20+. |
| shadcn/ui (latest CLI) | Tailwind v4, React 19 | All components updated Feb 2025+. |
| Drizzle 0.36 | Postgres 15/16, Supabase | Set `prepare: false` for transaction pooling on Supabase session-mode. |
| Vercel AI SDK 5 | Anthropic SDK, OpenAI SDK | `streamText`, `generateObject`, `stopWhen` are the v5 APIs. v3/v4 patterns are legacy. |
| Trigger.dev v3 | Next.js 14+ (works with 16) | v3 dedicated compute; do not use v2 patterns. |
| Tiptap v2 | React 19 | Korean IME stable; verify against your build (open issue tracker). |
| Supabase Auth | Drizzle (separate auth schema) | Auth runs in `auth` schema; Drizzle handles `public`. Use RLS to bridge. |
| Anthropic API prompt caching | Sonnet 4 / 4.5 / 4.6, Opus 4.x | Requires `cache_control` markers in messages. 5 minute TTL by default. |
## Implementation Notes (gotchas)
## Confidence Assessment
| Area | Level | Rationale |
|------|-------|-----------|
| Web framework (Next.js 16) | HIGH | Multiple sources, official docs verified, ecosystem dominance. |
| Database/Auth (Supabase) | HIGH | Industry consensus for bootstrapped multi-tenant SaaS. |
| Vercel AI SDK as primary LLM client | HIGH | 20M monthly downloads, official Anthropic/OpenAI provider support. |
| Claude as primary copy LLM | HIGH (English) / MEDIUM (Korean) | Brand-voice consistency claim is well-sourced. Korean output quality is good per Anthropic's own multilingual eval, but you should A/B against HCX with Korean copywriters. |
| HyperCLOVA X for Korean copy | MEDIUM | Marketing claims of "6500x more Korean data" are vendor-stated. Pricing is opaque (contact-sales). Strong fit thesis; verify with trial. |
| Ideogram v3 for Hangul text-in-image | LOW-MEDIUM | Vendor docs claim multilingual; no public Hangul-specific benchmark found. Empirically test in Phase 1. |
| Trigger.dev for AI workflows | HIGH | Documented HITL/Waitpoints feature, OSS, designed for this use case. |
| Drizzle vs Prisma | HIGH | Either works; recommendation reflects edge/serverless bias. |
| KFTC AI ad-labeling regulation (Dec 2025) | HIGH | Multiple Korean news + Lexology sources confirm. |
| PIPA data residency interpretation | MEDIUM | Tokyo region acceptable for v1; consult counsel before processing health/finance verticals at scale. |
## Sources
### Frameworks & runtime
- [Next.js 16 / framework comparison 2026](https://dev.to/pockit_tools/nextjs-vs-remix-vs-astro-vs-sveltekit-in-2026-the-definitive-framework-decision-guide-lp5)
- [shadcn/ui Tailwind v4 docs](https://ui.shadcn.com/docs/tailwind-v4)
- [shadcn/ui Feb 2025 changelog](https://ui.shadcn.com/docs/changelog/2025-02-tailwind-v4)
- [Vercel AI SDK official docs](https://ai-sdk.dev/docs/introduction)
- [LangChain vs Vercel AI SDK 2026](https://strapi.io/blog/langchain-vs-vercel-ai-sdk-vs-openai-sdk-comparison-guide)
### Database / ORM / Auth
- [Drizzle vs Prisma 2026 — MakerKit](https://makerkit.dev/blog/tutorials/drizzle-vs-prisma)
- [Drizzle vs Prisma 2026 — Bytebase](https://www.bytebase.com/blog/drizzle-vs-prisma/)
- [Supabase vs Neon vs PlanetScale 2026](https://makerkit.dev/blog/tutorials/best-database-software-startups)
- [Better Auth vs Clerk vs NextAuth 2026](https://starterpick.com/blog/better-auth-clerk-nextauth-saas-showdown-2026)
- [Clerk Organizations + RBAC](https://clerk.com/articles/organizations-and-role-based-access-control-in-nextjs)
### LLM choice & cost
- [Claude Sonnet 4.6 vs GPT-5 for advertising — VibeMyAd](https://www.vibemyad.com/blog/claude-sonnet-4-6-vs-gpt-5-for-advertising)
- [Claude vs ChatGPT for Ad Copywriting 2026](https://www.get-ryze.ai/blog/claude-vs-chatgpt-ad-copywriting)
- [Anthropic prompt caching — DigitalOcean](https://www.digitalocean.com/blog/prompt-caching-with-digital-ocean)
- [Prompt caching cost reduction (90%) — ngrok](https://ngrok.com/blog/prompt-caching)
- [OpenRouter provider routing & fallbacks](https://openrouter.ai/docs/guides/routing/model-fallbacks)
- [Tokenization for Korean (CJK) — IntuitionLabs](https://intuitionlabs.ai/articles/token-optimization-chatgpt-claude-costs)
### Korean LLMs
- [HyperCLOVA X — CLOVA tech blog](https://clova.ai/en/tech-blog/introducing-hyperclova-x-our-state-of-the-art-ai-models-optimized-for-the-korean-language)
- [HyperCLOVA X — NAVER Corp](https://navercorp.com/en/tech/hyperclovax)
- [CLOVA Studio overview](https://guide.ncloud-docs.com/docs/en/clovastudio-overview)
- [Solar Pro 3 — Upstage blog](https://www.upstage.ai/blog/en/solar-pro-3-0127)
- [Korea LLM landscape — MarkTechPost](https://www.marktechpost.com/2025/08/21/meet-south-koreas-llm-powerhouses-hyperclova-ax-solar-pro-and-more/)
- [Korean LLM benchmarks (KMMLU, HAERAE, LogicKor) — HuggingFace](https://huggingface.co/blog/amphora/navigating-ko-llm-research-2)
### Image generation
- [Ideogram V3 text rendering — MindStudio](https://www.mindstudio.ai/blog/what-is-ideogram-v3)
- [AI image generators comparison 2026 — fal.ai](https://fal.ai/learn/tools/ai-image-generators)
- [AI image for ads: Midjourney vs Flux vs Imagen 2026](https://adlibrary.com/posts/ai-image-generation-for-ads-2026)
- [Image generation API pricing 2026](https://www.digitalapplied.com/blog/ai-image-generation-api-pricing-comparison-2026)
### Background jobs
- [Inngest vs BullMQ vs Trigger.dev 2026](https://starterpick.com/guides/inngest-vs-bullmq-vs-triggerdev-boilerplates-2026)
- [Trigger.dev vs Inngest vs Temporal 2026](https://trybuildpilot.com/610-trigger-dev-vs-inngest-vs-temporal-2026)
### Editor
- [Tiptap vs Lexical 2026 — Velt](https://velt.dev/blog/best-rich-text-editors-react-comparison)
### Hosting & storage
- [Vercel Seoul (icn1) regional pricing](https://vercel.com/docs/pricing/regional-pricing/icn1)
- [Cloudflare R2 vs Supabase Storage 2026](https://www.buildmvpfast.com/api-costs/cloud-storage)
### Korean regulatory
- [KFTC AI-generated ad labeling — Korea Times Dec 2025](https://www.koreatimes.co.kr/business/tech-science/20251210/korea-to-mandate-labeling-of-ai-generated-content-to-counter-fake-ads)
- [Korea AI false advertising measures — Lexology](https://www.lexology.com/library/detail.aspx?g=8aa8567b-55cf-467b-80cf-b32d445f44bb)
- [Korea PIPA SaaS guide — Complydog](https://complydog.com/blog/south-korea-pipa-privacy-information-protection-act-saas)
- [PIPA 2025 updates](https://crossborderadvisorysolutions.com/personal-information-protection-act-pipa-updates-2025/)
- [NAVER Cloud privacy/security](https://www.navercloudcorp.com/NAVER_Cloud_251114_EN.pdf)
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

### 디자인 시스템 — 매거진 에디토리얼 (전 화면 단일 결)

**진리의 원천:** `briq-app/lib/landing/tokens.ts`. 모든 화면(랜딩·온보딩·가격·결제·대시보드·앱 내부)은 이 토큰을 따라 **하나의 결**로 통일한다. 라이트 전용(다크모드 없음).

| 토큰 | 값 | 용도 |
|------|-----|------|
| `INK` | `#14130F` | 본문/표제 (warm black) |
| `INK_SOFT` | `#4A4742` | 보조 본문 |
| `INK_MUTE` | `#767268` | 메타·캡션 (AA 가독) |
| `RULE` / `RULE_SOFT` | `rgba(20,19,15,0.12)` / `0.06` | 0.5px 헤어라인 |
| `PAPER` / `PAPER_HOVER` | `#FAF7EE` / `rgba(20,19,15,0.025)` | 종이 배경 / hover |
| `SAGE` | `#4F5F4B` | **단일 컬러 액센트** (긍정·강조). 그 외 색 금지 |
| `HL` | `#E6DDC8` | 한글 강조용 크림 하이라이트 |
| `SERIF_LATIN` / `SERIF_HANGUL` | Cormorant / Nanum Myeongjo | 라틴 / 한글 세리프 |

오류 상태만 따뜻한 테라코타 `#A1473D`.

### 철칙 (위반 금지 — 이번 세션에서 전 화면에 적용됨)

1. **한글 가짜 이탤릭 금지.** 나눔명조/산세 한글에 `italic`/`fontStyle:"italic"` 절대 금지(합성 기울임=싸구려). 강조는 **색·무게·크림 하이라이트(`HL`)**. 진짜 이탤릭은 **라틴(Cormorant)에만** (eyebrow·STEP 라벨·타임스탬프·폴리오 등 영문 액센트).
2. **한글 CTA/라벨:** `tracking 0.01~0.02em`, `uppercase` 금지. `uppercase`+넓은 자간은 영문에만.
3. **단일 액센트 SAGE.** `emerald/indigo/violet/fuchsia/amber` 등 SaaS 색 금지 → 긍정·체크·절약·추천은 SAGE.
4. **SaaS 시그널 제거.** 그라데이션(브랜드 무드보드 제외)·다색·큰 그림자·`rounded-xl/2xl`·`gradient-text`·이모지 금지. 카드는 **헤어라인(RULE) 사각** 또는 상단 룰. 이모지 → lucide 아이콘.
5. **버튼:** 솔리드 잉크(`INK` bg + `PAPER` 텍스트), disabled `rgba(20,19,15,0.10)`+`INK_MUTE`. 사각.
6. **`word-break: keep-all`** — 한글 표제·본문 중간 줄바꿈 방지.
7. **정직성.** 미검증 수치·가짜 고객/후기 금지. 시연 데이터는 "예시 화면" 라벨 명시.
8. 표제=세리프, 큰 여백, 절제된 모션(opacity+1~6px nudge).

### 카피 톤 (자동 생성 — `briq-app/lib/cardnews/hook-generator.ts`)

- **AI 클리셰 금지:** `팔로우+알림 ON`, 영문 DM 트리거(`DM 'OPEN' 한 글자`), `저장각/저장 필수`, FOMO(`놓치지 마세요`). → 사장님 **구어체**(디엠 한 줄·댓글로·먼저 챙겨드릴게요).
- **문맥 정합:** 캠페인 종류별 풀이 어긋나지 않게(시즌 문구는 시즌 캠페인만). 릴스 자막은 슬라이드 2줄을 한 문장으로 이어 조각 방지.

### 검증 루틴

`./node_modules/.bin/tsc --noEmit -p tsconfig.json` → 헤드리스 Chrome 스크린샷(`--headless=new --screenshot`)으로 육안 확인 → 원자 커밋. 디자인/카피 변경은 반드시 스크린샷 또는 임시 디버그 라우트로 실제 출력 확인.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

Architecture not yet mapped. Follow existing patterns found in the codebase.
<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->
## Project Skills

No project skills found. Add skills to any of: `.claude/skills/`, `.agents/skills/`, `.cursor/skills/`, `.github/skills/`, or `.codex/skills/` with a `SKILL.md` index file.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->



<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
