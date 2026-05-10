# Feature Research

**Domain:** AI Marketing Operations Platform — internal tool for a Korean SMB-focused ad agency
**Researched:** 2026-05-10
**Confidence:** MEDIUM-HIGH (Korean channel specifics: HIGH from official Naver/Kakao guides; agency workflow patterns: MEDIUM from competitor analysis; AI copy quality nuances: MEDIUM)

---

## Feature Landscape

### Table Stakes (Users Expect These)

These are non-negotiable. If an internal agency tool launches without them, employees will keep using their existing Notion/Google Docs/Excel workflow and the product fails adoption.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Client (광고주) profile management** | Agency must store client info, brand tone, target market, industry (업종), historical assets in one place. Without this, every campaign restarts from scratch. | LOW | CRUD + tagging by industry (음식점/미용실/병원/학원/매장). Brand-tone fields: voice keywords, do/don't phrases, sample sentences. |
| **Campaign (캠페인) entity with lifecycle** | Every piece of content belongs to a campaign with goal, period, channels, target. Standard agency mental model. | LOW | States: draft → in-review → approved → archived. Link to client. |
| **AI campaign brief generator (기획안 초안 생성)** | Listed in PROJECT.md Active. Core promise: "input client info → AI drafts strategy." | MEDIUM | LLM prompt that takes client profile + campaign goal → outputs target/message/channel-mix/timeline. Korean output quality is the make-or-break detail. |
| **Per-channel content generation (채널별 카피 일괄 생성)** | The headline value prop. Generate Naver Blog post, Naver Place description, Instagram caption, Meta/Google ad copy from one brief in one click. | HIGH | Each channel needs its own template + character limits + tone. Korean copy review by humans is mandatory. |
| **Hashtag + CTA + image-prompt bundle** | Channel content is incomplete without these. Instagram needs hashtags; ads need CTAs; visuals need prompts (even if image generation is deferred, the prompt itself is an asset). | LOW | Generated alongside copy; one structured output. |
| **Human-in-the-loop review/approve UI** | Listed in PROJECT.md Active. Required for legal risk on regulated industries (의료/금융/건강기능식품) and for quality control. | MEDIUM | Per-content-item: edit, comment, approve/reject, request-revision. Status visible in queue. |
| **Content history + reuse (히스토리·재사용)** | Agencies' biggest unlock: "this clinic ran a similar promotion last spring — pull that copy and adapt." | MEDIUM | Searchable archive by client/campaign/channel/keyword. "Use as template" action. |
| **Role-based collaboration (기획자/디자이너/운영자)** | Listed in PROJECT.md Active. Multi-user with different permissions; queue-based work assignment. | MEDIUM | Roles: 기획자 (drafts), 디자이너 (image prompts), 운영자 (final approver). Assignment + notification. |
| **Korean-language UI and Korean-first AI output** | PROJECT.md constraint. Non-negotiable — English-translated output is a deal-breaker for Korean SMB copy quality. | MEDIUM | UI strings 100% Korean. LLM prompts written in Korean. Few-shot examples in Korean. |
| **Comments / feedback threads on content** | Reviewers and creators must communicate inline; otherwise feedback bounces to KakaoTalk and is lost. | LOW | Per-content-item comment thread, @mention. |
| **Per-client / per-campaign asset library** | Logos, prior images, product photos, menu PDFs — must be attached to the client and reused across campaigns. | LOW-MED | File upload, organize by client, reference in prompts. |
| **Search across clients / campaigns / content** | At even 20 clients × 10 campaigns × 4 channels, navigation breaks without search. | LOW | Full-text Korean search; filter by industry/channel/date/status. |
| **Basic auth + multi-user accounts** | 5-20 internal users (PROJECT.md). Login, password reset, user list. | LOW | Email/password sufficient v1; SSO later. |
| **Export/copy-out (복사·내보내기)** | Until media-API auto-publishing exists (out of scope v1), employees paste output into Naver, Kakao, Meta admin panels. Copy-to-clipboard / Markdown / TXT export is the bridge. | LOW | One-click copy per content block; bulk export per campaign. |

### Differentiators (Competitive Advantage)

These are where the product wins against Jasper/Copy.ai (English-first, no Naver/Kakao awareness) and domestic agency tools (집행/리포트 중심, 콘텐츠 제작 자동화 약함). Per PROJECT.md: "국내 SMB 마케팅 SaaS는 매체 집행/리포트 중심… 기획·콘텐츠 제작 자동화는 빈 시장."

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Naver Blog SEO-aware copy generation** | Naver holds ~46% of Korean search and prioritizes Naver Blog content. Generated posts must hit Naver-specific patterns: keyword density, title-first weighting, freshness, image insertion structure, 본문 길이 가이드. Generic LLM output ranks poorly. | HIGH | Naver-specific prompt template + ranking heuristics. Title-tag emphasis. Avoid 어뷰징 patterns Naver penalizes (반복 키워드 stuffing). |
| **Naver Place description / 영수증 리뷰 답글 / 사장님 톤** | Naver Place is the dominant local-business discovery channel for SMBs (음식점/미용실/병원). Has its own format: 업체 소개, 메뉴 설명, 답글 톤. Global tools cannot do this. | MEDIUM | Templates: 업체 소개문, 메뉴/시술 설명, 영수증 리뷰 답글, 새소식 글. Length-aware (Place description ~ 200~500 자). |
| **Kakao 채널 메시지 카피 생성 (8시-20시 50분 룰 인지)** | Kakao official guides require 광고 표시, 발신자 정보, 수신거부 안내, 그리고 발송 시간 제한. AI must produce copy that already includes these. | MEDIUM | Template includes [광고] 태그, sender placeholder, 수신거부 line. Length-aware (Kakao 메시지 형식별 제한). |
| **업종별 (industry) prompt templates** | Most repetition the agency does: 같은 업종 × 같은 시즌 = 같은 패턴. Pre-built libraries for 음식점/미용실/학원/병원/동네매장 × 신규오픈/시즌프로모션/이벤트/리뷰관리 = massive time saver. | MEDIUM | A 2D matrix of ~10 industries × ~6 campaign types = ~60 templates. Editable by agency. |
| **Brand-tone training per client (브랜드 보이스 학습)** | Jasper's killer feature, but for Korean. Upload past blog posts / Instagram captions / 사장님이 쓴 글 → derive tone keywords → all subsequent output sounds like that brand. | MEDIUM-HIGH | Few-shot LLM with client-specific examples + tone keywords (친근한/전문적/유쾌한/고급스러운/감성적). |
| **의료·금융·식품 광고 규제 가드레일 (compliance guardrail)** | 의료법 제56조 forbids "치료 효과 보장", "환자 후기", "비교 우위" claims. Generic AI generates exactly these phrases. Block + warn at generation time = legal moat. | HIGH | Industry-tagged client → enable rule set → post-generation linter that flags forbidden patterns + suggests safe rewrites. Cite 의료광고 가이드라인 (2판). |
| **One-brief → multi-channel fan-out (멀티채널 일괄 생성)** | One campaign brief produces Naver Blog + Place + Instagram + Kakao + Meta/Google copy in one action with channel-appropriate tone/length. This is the core 2× productivity unlock from PROJECT.md Core Value. | HIGH | Orchestration layer: brief → N parallel LLM calls with channel-specific prompts → unified review screen. |
| **Reusable "성공 캠페인" library (winners hub)** | After 3-6 months of use, the agency accumulates campaigns that "worked." Marking these as winners and surfacing them as templates compounds value. | LOW-MED | "Pin as template" + tag-based browse. (Actual performance scoring requires media-API data → v2.) |
| **AI cost dashboard (per-client / per-campaign 토큰 사용량)** | PROJECT.md constraint: "AI API 비용 통제(캐싱·토큰 관리)가 일찍 들어와야". For an internal tool to survive bootstrap economics, owner must see cost-per-client. | MEDIUM | Token logging per LLM call, attribute to client/campaign, simple dashboard. |
| **Prompt caching / semantic dedup for similar briefs** | 같은 업종 × 비슷한 캠페인 = LLM should not pay full price every time. Cache hits from prior outputs as starting point. | MEDIUM-HIGH | Embedding-based brief similarity → reuse-and-edit instead of full regeneration. Significant cost saver. |
| **Korean-first character-count + 어색한 표현 detection** | Channel limits matter (Naver Place ~500자, Instagram caption visible portion ~125자, Meta primary text 125자, 카카오 메시지 형식별 한도). Auto-warn if over. Plus a layer detecting AI-translation-stink (어색한 직역, 이상한 존댓말 혼용). | MEDIUM | Character counter built-in. Style linter using a smaller Korean model or rules. |
| **Seasonal/calendar campaign suggestion (한국 시즌 캘린더)** | Korean SMB calendar: 설/추석/빼빼로데이/수능/연말/봄축제/여름휴가/김장. AI proactively suggests "this client is a 미용실 — 졸업·입학 시즌 캠페인 제안" three weeks ahead. | MEDIUM | Industry × Korean-calendar mapping. Proactive prompt to operator. |

### Anti-Features (Commonly Requested, Often Problematic)

These will be requested by users or stakeholders. Documenting why NOT to build them in v1 prevents scope creep.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| **Direct media-API publishing (Meta/Google/Naver/Kakao 자동 게재)** | "If we generate the ad, why not just publish it?" PROJECT.md Out of Scope. | API-permission complexity (Meta business verification, Google Ads MCC, 네이버 검색광고 API 권한, 카카오 비즈채널 인증). Spam/규제 위반 시 계정 정지 위험. Each platform's review/rejection cycle adds debugging burden. | v1: copy-to-clipboard + structured export. Operator pastes manually. v2: reconsider per-channel. |
| **Performance analytics dashboard (CTR/CPC/ROAS)** | "How will we know it works?" PROJECT.md Out of Scope. | Data lives in 매체 API, which v1 doesn't connect to. Half-built dashboards lie to clients. | v1: track only in-app metrics (drafts/approved/time-to-approve). Real performance → v2 with media APIs. |
| **Auto-generated video / Reels / shorts** | "Instagram is video-first now." PROJECT.md Out of Scope. | Video gen is expensive, slow, quality-inconsistent in Korean. Distracts from text quality. | v1: generate strong image prompts + script outlines for human videographer. Video gen → separate phase. |
| **Client self-service portal (광고주가 직접 로그인)** | "Clients can review their own drafts!" PROJECT.md Out of Scope. | Different UX (simpler), permission complexity, support burden, exposes internal data. Agency loses control of relationship. | v1: agency exports PDF/link preview for client review out-of-band. v2 reconsider. |
| **"Fully autonomous AI agent that runs campaigns"** | Industry hype (agentic AI marketing). | PROJECT.md Key Decision: "휴먼-인-더-루프 필수 — 광고 카피 품질·법적 리스크 — AI 단독 게재 안 함." 의료광고법 violations carry fines. | All AI output is draft. Approval gate is mandatory. Use AI for speed, humans for accountability. |
| **Real-time co-editing (Google Docs-style)** | "We want to collaborate live." | High infra cost (CRDT/OT), edge cases dominate dev time, agencies of 5-20 don't actually collaborate live — they pass async. | Async comments + status + assignment. Lock-on-edit if conflicts emerge. |
| **Programmatic A/B test variant generation at scale (수십 개 카피 동시 생성)** | "Generate 50 ad variants, test all." | Without media-API performance data, variants are unevaluable. Burns tokens for fake choice. | v1: generate 2-3 variants per channel for human pick. Scale only after performance loop exists. |
| **General-purpose chat assistant ("AI 비서")** | "Can users just chat with AI?" | Unfocused chat invites every kind of request, makes the product feel like ChatGPT-with-extra-steps. Diffuses the value prop. | v1: structured forms with clear input/output. "Ask AI" only inside content edit context. |
| **Heavy multi-tenant SaaS infra (org/team/billing)** | "Make it scalable from day 1." PROJECT.md constraint: 1 agency × 5-20 users initially. | Premature: kills speed, complicates auth/data model. PROJECT.md key decision: "v1은 사내 도구로 시작, SaaS는 v2 결정." | Single-tenant or light-tenant (one org row). Multi-tenancy when v2 SaaS pivot is decided. |
| **Voice/dictation input for briefs** | "Operators want to talk, not type." | Korean STT quality is good but UX is finicky in office. Adds dev cost without clear ROI. | v1: typed forms. Voice → optional later if requested. |
| **Image generation in v1 (직접 이미지 합성)** | "We need images, not just prompts." | Korean text-in-image quality is poor (Korean glyphs in DALL·E/SD/Imagen still error-prone). Cost spikes. | v1: generate strong image *prompts* the designer/외주 uses. Image gen pilot in v1.x. |
| **Sentiment/review monitoring across the web** | "Know what customers say about our clients." | Scope explosion (네이버 리뷰, 인스타 댓글, 블로그 후기 크롤링). Legal gray zone. | Out of scope. If valuable, separate product. |

---

## Feature Dependencies

```
[Auth + Users + Roles]
    └──required by──> [Client management]
                          └──required by──> [Campaign entity]
                                                ├──required by──> [AI brief generator]
                                                │                     └──required by──> [Per-channel content generator]
                                                │                                            ├──required by──> [HITL review/approve]
                                                │                                            │                     └──required by──> [Content history/reuse]
                                                │                                            └──required by──> [Hashtag/CTA/image-prompt bundle]
                                                └──required by──> [Asset library]

[Brand-tone training] ──enhances──> [Per-channel content generator]
                                          ↑
[업종별 templates] ──enhances────────────────┘
                                          ↑
[Naver Blog SEO templates] ──specializes─┤
[Naver Place templates] ──specializes────┤
[Kakao 채널 templates] ──specializes──────┤
[Meta/Google ad templates] ──specializes──┘

[Compliance guardrail] ──gates──> [Content approval]
                            (must pass before approve enabled for 의료/금융)

[AI cost dashboard] ──observes──> [All AI generation features]
[Prompt caching] ──optimizes────> [All AI generation features]

[Korean-language UI/output] ──underlies──> [Everything]
[Korean character-count + style linter] ──gates──> [Per-channel content generator]

[Comments] ──enhances──> [HITL review]
[Search] ──enhances────> [Content history/reuse]
[Export/copy-out] ──completes──> [Per-channel content generator] (until media-API exists)

[Seasonal calendar suggestion] ──enhances──> [Campaign entity] (can defer to v1.x)
[Winners library / pin-as-template] ──enhances──> [Content history/reuse] (can defer to v1.x)
```

### Dependency Notes

- **Per-channel content generator REQUIRES Korean-language output quality:** This is the make-or-break dependency. If the Korean copy from the LLM is awkward, every downstream feature is worthless. Invest in prompt engineering + few-shot Korean examples + style linter EARLY.
- **HITL review REQUIRES content generator + comments + role permissions:** Approval gate is meaningless without something to approve and someone authorized to approve.
- **Compliance guardrail GATES approval for regulated industries:** For clients tagged 의료/한방/치과/금융, the linter must run and block (or warn) before "approve" button enables. This is a hard dependency for legal protection.
- **Brand-tone training ENHANCES per-channel generation:** The generator works without it (uses default tone), but quality jumps significantly with it. Add early in v1.x once base generator works.
- **업종별 templates and channel-specific templates are ORTHOGONAL:** A single content generation = (industry template) × (channel template). Both dimensions must be built; designing them as composable from the start prevents combinatorial template explosion.
- **AI cost dashboard depends on instrumented generation calls:** Add token logging at the same time as content generator, or retrofitting will be painful.
- **Prompt caching builds on history + brief embedding:** Defer to v1.x — first verify cost is actually a problem at the agency's scale, then optimize.
- **Export/copy-out is the v1 substitute for media-API publishing:** Without it, the platform is incomplete (operators have no way to ship). Cheap to build, do it in v1.
- **Search depends on content history + Korean tokenization:** Korean full-text search needs proper analyzer (nori or equivalent) — not free. Plan for it in storage layer choice.

---

## MVP Definition

### Launch With (v1)

The minimum to validate the Core Value: "광고대행사 직원 1명이 처리할 수 있는 클라이언트 수와 캠페인 처리량을 2배 이상으로 끌어올린다."

- [ ] **Auth + roles (기획자/운영자/디자이너)** — multi-user is in PROJECT.md Active; cannot defer.
- [ ] **Client management with industry tagging + brand-tone fields** — every campaign starts here.
- [ ] **Campaign entity with lifecycle states** — drafts/in-review/approved/archived.
- [ ] **Asset library per client** — logos, photos, menu PDFs uploadable, referenceable in prompts.
- [ ] **AI brief generator (기획안 초안)** — input client + goal → structured strategy.
- [ ] **Per-channel content generator** for the must-have set: Naver Blog, Naver Place, Instagram caption, Meta/Google ad copy. Each with channel-aware length + tone + hashtag/CTA bundle.
- [ ] **업종별 base templates** for the top 5 industries (음식점, 미용실, 학원, 병원, 동네매장) × top 3 campaign types (신규오픈, 시즌 프로모션, 이벤트). 15 templates is enough for validation.
- [ ] **HITL review/approve UI with comments** — edit, comment, approve, reject, request-revision.
- [ ] **Compliance guardrail (linter) for 의료/한방/치과 clients** — flag forbidden phrases per 의료법 제56조. Warn-mode acceptable in v1; can sharpen to block-mode in v1.x.
- [ ] **Content history + search by client/campaign/channel** — even basic list+filter is enough; no need for full-text v1.
- [ ] **Export/copy-out (per-content copy-to-clipboard + per-campaign Markdown/TXT export)** — bridge until media APIs.
- [ ] **Korean UI throughout, Korean-first prompts with few-shot examples** — non-negotiable.
- [ ] **AI cost logging (per call, per client, per campaign) + simple owner dashboard** — bootstrap economics demand visibility.
- [ ] **Korean character-count display per channel** — basic but vital.

### Add After Validation (v1.x)

After 1-2 months of internal use, add based on observed pain.

- [ ] **Brand-tone training (per-client few-shot)** — when default-tone output starts feeling generic across clients.
- [ ] **Reusable winners library / pin-as-template** — when the team starts saying "remember that 미용실 spring campaign? do that again."
- [ ] **Kakao 채널 메시지 templates with compliance lines built in** — once internal users prioritize Kakao over Meta/Google.
- [ ] **Korean style linter (어색한 표현 감지)** — once enough output is observed to derive rules.
- [ ] **Seasonal/calendar campaign suggestion** — when the same season questions ("벌써 추석인데 우리 클라이언트들 캠페인 누락 없나?") repeat.
- [ ] **Prompt caching / brief similarity reuse** — when token bills become uncomfortable.
- [ ] **Image-prompt previews (test render)** — pilot with one image-gen API; do not promise quality.
- [ ] **Bulk operations (e.g., regenerate all clients' 추석 promo)** — when scaling pain is real.
- [ ] **Approval audit trail / change history** — when accountability questions arise.

### Future Consideration (v2+)

- [ ] **Direct media-API publishing** (PROJECT.md Out of Scope reasoning intact — defer until there is a strong business case to take on the compliance burden).
- [ ] **Performance dashboards / ROAS / CTR** (requires media APIs).
- [ ] **Video / Reels / shorts generation** (separate phase per PROJECT.md).
- [ ] **Client self-serve portal** (only after agency-internal product is solid).
- [ ] **SaaS multi-tenant productization** (PROJECT.md key decision: pending v1 validation).
- [ ] **Cross-agency benchmarking** (only meaningful in SaaS mode).
- [ ] **Voice / dictation input.**
- [ ] **Sentiment monitoring / review crawling.**
- [ ] **Programmatic A/B test variant management at scale.**

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Korean UI + Korean-first AI prompts | HIGH | LOW (discipline, not cost) | P1 |
| Client management + industry tagging | HIGH | LOW | P1 |
| Campaign entity + lifecycle | HIGH | LOW | P1 |
| AI campaign brief generator | HIGH | MEDIUM | P1 |
| Per-channel content generator (Naver Blog/Place, Instagram, Meta/Google) | HIGH | HIGH | P1 |
| HITL review/approve + comments | HIGH | MEDIUM | P1 |
| Content history + basic search/filter | HIGH | LOW-MED | P1 |
| Export/copy-out (clipboard + Markdown) | HIGH | LOW | P1 |
| 업종별 templates (top 5 × top 3) | HIGH | MEDIUM | P1 |
| Compliance guardrail for 의료/한방/치과 | HIGH (legal moat) | HIGH | P1 (warn-mode acceptable) |
| Asset library per client | MEDIUM-HIGH | LOW | P1 |
| Auth + roles | HIGH | LOW | P1 |
| AI cost logging + dashboard | MEDIUM-HIGH (owner-critical) | LOW-MED | P1 |
| Korean character-count per channel | MEDIUM | LOW | P1 |
| Brand-tone training per client | HIGH | MEDIUM-HIGH | P2 |
| Kakao 채널 메시지 templates | HIGH (channel coverage) | MEDIUM | P2 |
| Reusable winners library / pin-as-template | MEDIUM-HIGH | LOW | P2 |
| Korean style linter (어색한 표현) | MEDIUM | MEDIUM | P2 |
| Seasonal calendar suggestion | MEDIUM | MEDIUM | P2 |
| Prompt caching / semantic dedup | MEDIUM (cost) | MEDIUM-HIGH | P2 |
| Image-prompt test render pilot | MEDIUM | MEDIUM | P2 |
| Audit trail / change history | MEDIUM | LOW-MED | P2 |
| Bulk operations | MEDIUM | MEDIUM | P3 |
| Voice input | LOW | MEDIUM | P3 |
| Direct media-API publishing | HIGH | VERY HIGH (compliance) | P3 (v2) |
| Performance dashboards | HIGH | VERY HIGH (depends on APIs) | P3 (v2) |
| Video generation | MEDIUM | HIGH | P3 (v2) |
| Client self-serve portal | LOW (in v1) / HIGH (in v2 SaaS) | HIGH | P3 (v2) |
| SaaS multi-tenancy | LOW (v1) / HIGH (v2) | HIGH | P3 (v2) |

**Priority key:**
- P1: Must have for launch (v1)
- P2: Should have, add as v1.x once core validated
- P3: Future / v2

---

## Competitor Feature Analysis

| Feature | Jasper / Copy.ai (global) | Domestic agency tools (메가존 Hyper DMP / 플레이디 / 애드이피션시) | AdsGPT / AdStellar (Meta-focused) | Our Approach |
|---------|---------------------------|------------------------------------------------------------|-----------------------------------|---------------|
| Brand voice / tone | Strong (Jasper Brand Voice — train on samples) | Weak / absent | Medium (BrandIQ stores logo/colors/voice) | Adopt Jasper's pattern, but Korean-first few-shot per client. |
| Channel templates | English + global channels (Facebook, LinkedIn, Twitter, Google) — no Naver/Kakao | Some Naver/Kakao support but oriented to media buying, not creative | Meta/Instagram only | Cover Naver Blog/Place + Kakao 채널 + Instagram + Meta/Google. This is the moat. |
| Industry templates | Generic (e-commerce, SaaS, real estate) | Often missing | Limited | Korean-SMB-specific (음식점/미용실/학원/병원/동네매장) — moat. |
| Compliance / regulation handling | Absent | Absent | Absent | 의료광고법 / 식품광고 가드레일 — strong legal moat for Korean clinics. |
| Multi-channel one-brief fan-out | Partial (Jasper Pipelines) | Weak (each channel separate tool) | Meta-only | One brief → all 4-5 Korean-relevant channels. |
| HITL approval | Limited (mostly individual editor) | Stronger (agency tools have approval) | Medium | First-class HITL with role queues. |
| Performance analytics | Partial (Jasper Insights) | STRONG (this is their core) | STRONG | Out of scope v1 — explicit focus differentiation. |
| Direct media publishing | Limited (some Meta) | STRONG | STRONG (Meta) | Out of scope v1 — copy-out only. |
| Korean language native quality | Weak (translation feel) | Native | Weak | Native Korean output is the price of entry, not a differentiator — but vs global tools it is one. |
| Cost / token visibility | Hidden behind seat pricing | Hidden | Hidden | Per-client/per-campaign token visibility — useful for owner-operator. |

---

## Korean-Context Notes (Critical for Quality Gate)

These are called out separately so they cannot be missed downstream.

- **네이버 (Naver) is not just SEO — it is an ecosystem.** Naver Blog, Naver Place, Naver 카페, 지식iN, Naver Shopping form a closed loop. Naver-prioritizes its own properties. SMB visibility flows mainly through Naver Blog (영향력 있는 블로거 콘텐츠) and Naver Place (지도 + 영수증 리뷰). Optimizing Naver Blog copy is a fundamentally different task from optimizing a Google blog post — Naver weights title, freshness, image-rich body structure, and on-platform engagement.
- **Naver Place 사장님 영역** (description, news 글, 영수증 리뷰 답글) is a distinct content type. Most global tools have nothing here.
- **카카오톡 채널** has hard rules: 메시지 발송은 08:00–20:50 KST only; 광고성 메시지에는 [광고] 표시, 발신자 정보, 무료 수신거부 안내가 의무. The AI output template must include placeholders for these.
- **한국어 카피 톤** is not just translation. Korean ad voice ranges (친근한·반말 / 정중한 존댓말 / 트렌디 (10·20대) / 신뢰감 있는 (병원·금융) / 감성적 (카페·미용)). Tone selection affects 종결어미, 외래어 사용, 이모티콘 빈도. Few-shot examples must cover these explicitly.
- **의료법 제56조** forbids: (a) treatment-effect guarantees, (b) patient testimonials (환자 후기), (c) comparative superiority claims (다른 의료인 대비 우수), (d) before/after surgery scenes, (e) under-6-month clinical experience boasts, (f) unverified new-medical-tech claims, (g) puffing of objective facts. Generic LLMs produce these by default — guardrail is essential.
- **유사 규제 also exists for 식품·건강기능식품 (식약처), 금융상품 (금감원).** Tag clients by regulated industry, run appropriate linter.
- **업종 × 시즌** drives most campaign repetition: 미용실/네일 = 졸업·입학·여름·연말; 학원 = 신학기·방학특강·수능; 음식점 = 점심특가·시즌메뉴·배달; 병원 = 환절기·건강검진. Templates organized along this 2D axis = highest leverage.
- **Korean SMB owner mental model**: 사장님들은 직접 글을 못 써서 대행사에 맡긴다. The agency's job is to produce text that *sounds like the 사장님 wrote it* — friendly, slightly informal for many industries. Pure corporate-tone AI output reads as cold and inauthentic and clients reject it.
- **Naver Shopping / Coupang product copy** is a related but separate template space — likely v1.x once e-commerce SMB clients arrive.

---

## Sources

- [Reinventing marketing workflows with agentic AI — McKinsey](https://www.mckinsey.com/capabilities/growth-marketing-and-sales/our-insights/reinventing-marketing-workflows-with-agentic-ai)
- [Top 8 AI Agent Platforms SMBs Can Trust in 2025 — The Journey Platform](https://thejourneyplatform.com/blog-posts/top-8-ai-agent-platforms-for-smbs-in-2025)
- [AI Marketing Automation: The Ultimate Guide for 2026 — Improvado](https://improvado.io/blog/ai-marketing-automation)
- [Clarvos AI-driven workflow platform for SMB marketing — SiliconANGLE](https://siliconangle.com/2026/04/07/clarvos-unveils-ai-driven-workflow-platform-streamline-smb-marketing/)
- [Naver SEO: A Complete Guide 2025 — InterAd](https://www.interad.com/en/insights/naver-seo-guide)
- [Mastering Korean Web Search: Naver Blog Optimization — The Egg](https://www.theegg.com/seo/korea/mastering-korean-web-search-naver-blog-optimization-for-seo-and-content-marketing)
- [Naver SEO Guide 2025 — Marketing Agency SG](https://marketingagency.sg/naver-seo-guide-how-to-do-naver-seo/)
- [Kakao Business — 채널 메시지 가이드](https://kakaobusiness.gitbook.io/main/channel/run/message)
- [Kakao Business — 채널 메시지 발송 유의사항](https://kakaobusiness.gitbook.io/main/ad/moment/start/messagead/operations)
- [Kakao Business — 카카오톡 채널 활성화 (SMB)](https://kakaobusiness.gitbook.io/main/partner/smb/channel)
- [의료광고 가이드라인 (강남구청 공지)](https://www.gangnam.go.kr/board/B_000001/1075332/view.do?mid=ID05_040101)
- [의료법 제56조 (의료광고의 금지 등) — 국가법령정보센터](https://www.law.go.kr/LSW//lsLawLinkInfo.do?lsJoLnkSeq=900350305&lsId=001788&chrClsCd=010202&print=print)
- [의료광고 가이드라인(2판) — 용인시](https://www.yongin.go.kr/user/bbs/BD_selectBbs.do?q_bbsCode=1019&q_bbscttSn=20250205144823941)
- [Jasper AI for Copywriting](https://www.jasper.ai/use-cases/copywriting)
- [AI Copywriting Tools: Features, Benefits, and Use Cases — Jasper Blog](https://www.jasper.ai/blog/ai-copywriting)
- [Best AI Ad Copy Generator For Meta — AdStellar](https://www.adstellar.ai/blog/ai-ad-copy-generator-for-meta)
- [Best Agency Meta Ads Management Solutions — AdStellar](https://www.adstellar.ai/blog/agency-meta-ads-management-solutions)
- [AdsGPT — Create Ads on Auto-Pilot](https://adsgpt.io/)
- [Human in the Loop guide — Zapier](https://zapier.com/blog/human-in-the-loop-guide/)
- [Building Human-In-The-Loop Agentic Workflows — Towards Data Science](https://towardsdatascience.com/building-human-in-the-loop-agentic-workflows/)
- [디지털 마케팅 전문가를 위한 워크플로우와 프로젝트 운영 — monday.com](https://monday.com/blog/ko/marketing-ko/tools-for-digital-marketing-agency/)
- [디지털 광고대행사의 제안서 종류 — 브런치](https://brunch.co.kr/@sparrowmill/25)

---
*Feature research for: AI Marketing Operations Platform — Korean SMB ad agency internal tool*
*Researched: 2026-05-10*
