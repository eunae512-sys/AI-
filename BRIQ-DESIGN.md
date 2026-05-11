# BRIQ — 소상공인을 위한 AI 브랜드 운영 시스템

> "사장님 대신 브랜드를 운영해주는 AI 직원."
> 콘텐츠를 만드는 툴이 아니라, 사장님 대신 **운영해주는 시스템**.

---

## 1. 정보 구조 (IA)

### 1.1 톱-레벨 메뉴

```
BRIQ
├── 🏠 홈 (대시보드)              ← 오늘 추천 + 4 KPI + 활동 피드
│
├── 📋 클라이언트                  ← 브랜드 목록 (에이전시 모드)
├── 📦 캠페인                       ← 캠페인 단위 묶음
│
├── AI 콘텐츠
│   ├── 🎴 카드뉴스
│   ├── 🎬 릴스 스튜디오
│   ├── 📝 콘텐츠 결과
│   └── 📅 콘텐츠 캘린더
│
├── 자동화
│   ├── ✅ 검토 큐                 ← 발행 전 톤·금지어 검수
│   ├── 💬 리뷰 답변               ← 4 채널 통합 자동 답변
│   └── 📤 업로드 예약             ← 인스타+블로그+Threads 큐
│
├── 인사이트
│   ├── 📊 성과 분석               ← ROI · Before/After
│   └── 🌎 지역 트렌드             ← 1km 반경 분석
│
└── 브랜드
    ├── 🎨 브랜드 톤               ← 5축 슬라이더 + 금지어
    └── 🧰 브랜드 키트             ← 컬러·폰트·템플릿 자동
```

### 1.2 페이지 매핑

| 라우트 | 역할 | 상태 |
|---|---|---|
| `landing.html` | 마케팅 / 가입 유도 | ✓ |
| `onboarding.html` | 7-step 첫 사용 흐름 | ✓ |
| `pricing.html` | 4티어 요금제 | ✓ |
| `01-login.html` | 로그인 / OAuth | 기존 |
| `index.html` | 홈 대시보드 (추천 허브) | ✓ |
| `02-clients.html` | 브랜드 목록 (에이전시) | 기존 |
| `03-brand-detail.html` | 브랜드 상세 | 기존 |
| `04-campaign-new.html` | 캠페인 생성 | 기존 |
| `05-content-result.html` | 7채널 콘텐츠 결과 | 기존 |
| `06-cardnews-image.html` | 카드뉴스 6장 생성 | 기존 |
| `07-review-queue.html` | 검토 큐 | 기존 |
| `08-reels-studio.html` | 릴스 자동 편집 | 기존 |
| `09-brand-memory.html` | 브랜드 톤 메모리 | ✓ |
| `10-reviews.html` | 리뷰 자동 답변 | ✓ |
| `11-calendar.html` | 콘텐츠 캘린더 | ✓ |
| `12-analytics.html` | 성과 분석 | ✓ |
| `13-brand-kit.html` | 자동 브랜드 키트 | ✓ |
| `14-trends.html` | 지역 트렌드 | ✓ |
| `15-schedule.html` | 업로드 예약 | ✓ |

### 1.3 사용자 흐름 (User Flow)

**최초 가입 흐름**
```
landing.html
  ↓ "3분 만에 시작" CTA
onboarding.html
  ├─ Step 1. 업종 선택 (카페 · 디저트 · 숙소 · 음식점 · 미용 · 로컬)
  ├─ Step 2. 분위기 선택 (따뜻 · 모던 · 감성 · 발랄 · 내추럴 · 럭셔리)
  ├─ Step 3. 인스타 연결 (OAuth / @핸들 / 스킵)
  ├─ Step 4. 사진 5~10장 업로드
  ├─ Step 5. AI 분석 (47초 · 6 단계 시뮬레이션)
  ├─ Step 6. 브랜드 키트 + 톤 메모리 결과 확인
  └─ Step 7. 첫 릴스 자동 생성 (인스타+카드뉴스+블로그까지)
  ↓
index.html (대시보드)
```

**일상 사용 흐름**
```
index.html (오늘 추천 카드 클릭)
  → 08-reels-studio.html?id=miokdang  (장마 릴스 1클릭 생성)
    → 자동 발행 큐로 이동
  → 15-schedule.html (큐 확인)
  → 발행 후 12-analytics.html (성과 확인)
```

**리뷰 응대 흐름**
```
10-reviews.html (3건 알림)
  ├─ 진상 의심 → 사장님 검토 → 수정 → 발송
  ├─ 단골 → 자동 발송 (이름·방문횟수 인지)
  └─ 신규 → 자동 발송 + 다음 방문 유도
```

### 1.4 사이드바 구조

좌측 60px 고정 사이드바, 4 그룹으로 묶어 인지 부하 최소화:

- **운영** (3): 홈 · 클라이언트 · 캠페인
- **AI 콘텐츠** (4): 카드뉴스 · 릴스 · 결과 · 캘린더
- **자동화** (3): 검토 · 리뷰 · 예약 (각 배지로 대기 건수)
- **인사이트** (2): 성과 · 트렌드
- **브랜드** (2): 톤 · 키트

총 14개. 더 늘어나도 그룹 헤더로 시각 구분되어 복잡해 보이지 않음.

### 1.5 모바일 UX 구조

```
모바일 (≤768px)
├─ 상단 미니 헤더 (로고 + ⌘K + AI Assistant)
├─ 하단 탭바 4개: 홈 · 콘텐츠 · 캘린더 · 더보기
├─ 사이드바 → 햄버거 메뉴 / 더보기 페이지로 이동
└─ 카드 뷰 우선 · 테이블은 가로 스크롤
```

기능 우선순위:
- **고정 노출**: 홈 / 콘텐츠 / 캘린더 / AI Assistant
- **더보기 안**: 클라이언트 · 분석 · 트렌드 · 예약 큐 · 톤 / 키트

---

## 2. 온보딩 UX

### 2.1 목표
> "와 이거 알아서 다 해주네" — 3분 안에 도달.

### 2.2 7-Step 상세

| Step | 화면 | 입력 | 출력 |
|---|---|---|---|
| 1 | 업종 선택 | 6 카드 중 1 | `industry` |
| 2 | 분위기 선택 | 6 카드 중 1 (그라데이션 미리보기) | `mood` |
| 3 | 인스타 연결 | OAuth / @핸들 / 스킵 | 학습 자료 |
| 4 | 사진 업로드 | 5~10장 드롭 | 분석 input |
| 5 | AI 분석 | (자동 47초) — 6 단계 라이브 진행바 | 톤 + 컬러 + 가이드 |
| 6 | 결과 확인 | 컬러·톤·금지어 표시 | 승인/조정 |
| 7 | 첫 릴스 | 폰 mockup + 생성된 자산 5종 | 대시보드 진입 |

### 2.3 인터랙션 디자인

- 상단 7개 progress pill (현재 단계 그라데이션 확장)
- 카드 클릭 시 600ms 후 자동 다음 단계 (지체감 제거)
- Step 5는 단계별 체크 애니메이션 + ai-shimmer 효과
- Step 7 결과는 폰 mockup으로 시각 임팩트 극대화

### 2.4 디자인 원칙

- 한 화면에 한 결정 — 인지 부하 ↓
- 기본값을 똑똑하게 (sensible defaults) — 빠른 진입
- 결과를 먼저 보여주고 (Step 6, 7) 수정 옵션은 작은 글씨
- "스킵" 항상 제공 — 부담 없는 진입

---

## 3. 비즈니스 모델

### 3.1 4 티어 요금제

| 플랜 | 월 | 타겟 | 핵심 한도 |
|---|---|---|---|
| **FREE** | ₩0 | 체험 | 1 브랜드 · 릴스 3/월 · AI 30회 |
| **STARTER** | ₩19,000 | 1인 자영업 | 1 브랜드 · 릴스 30/월 · 예약 발행 + 캘린더 |
| **PRO** ★ | ₩49,000 | 5인 미만 매장 | **3 브랜드 · 무제한** · 리뷰 + ROI + 트렌드 |
| **AGENCY** | ₩149,000 | 광고대행사 | 10 브랜드 · API · 화이트라벨 · 5 시트 |

### 3.2 가격 설계 논리

- **FREE의 목적**: 가입 마찰 0, 첫 콘텐츠로 wow 경험 → STARTER 전환
- **STARTER가 핵심 진입점**: 광고대행사 ₩200~500만원 대비 ₩19,000 = 부담 없음
- **PRO가 매출 견인**: 단골 운영 + ROI 시각화 → 필연적 업그레이드
- **AGENCY = LTV 부스터**: 1 계정이 10 브랜드 운영 = 평균 ₩400/M LTV

### 3.3 애드온

- 추가 브랜드 슬롯: ₩9,000/월
- 추가 시트: ₩7,000/월
- 영상 분량 확장 (60s+): ₩19,000/월

### 3.4 할인 정책

- 연 결제: 2개월 무료 (₩588K → ₩490K)
- 사업자등록증: STARTER 첫 3개월 50% off
- 청년창업(만39세↓): PRO 첫 6개월 30% off

### 3.5 7일 환불 무조건 가능 (마찰 제거)

---

## 4. MVP 우선순위 (Phase 로드맵)

### Phase 1 — "한 번 써보면 놀라는 경험" (MVP, 0~3개월)
**목표**: 사진 5장 → 30초 안에 완성된 릴스. 한 번의 wow.

- ✅ AI 릴스 자동 생성 (`08-reels-studio.html`)
- ✅ 브랜드 톤 메모리 v1~v3 (`09-brand-memory.html`)
- ✅ 콘텐츠 캘린더 + 자동 추천 (`11-calendar.html`)
- ✅ 카드뉴스 6장 생성 (`06-cardnews-image.html`)
- ✅ 온보딩 7-step (`onboarding.html`)
- ✅ 홈 대시보드 추천 (`index.html`)

**핵심 KPI**: 가입 → 첫 콘텐츠 발행 < 5분, D7 잔존율 > 40%

### Phase 2 — "운영을 맡긴다" (3~6개월)
**목표**: 매일 BRIQ 열 이유 만들기.

- ✅ 리뷰 자동 답변 (`10-reviews.html`)
- ✅ 업로드 예약 큐 (`15-schedule.html`)
- ✅ 성과 분석 + ROI (`12-analytics.html`)
- ⬜ 카톡 채널 연동
- ⬜ 푸시 알림 (모바일 앱)
- ⬜ 사장님 V-log 자동 편집

**핵심 KPI**: 월 활성 일수 > 15일, PRO 전환율 > 12%

### Phase 3 — "AI 브랜드 매니저" (6~12개월)
**목표**: 사장님이 결정만 내리면 되는 수준.

- ✅ 지역 트렌드 분석 (`14-trends.html`)
- ⬜ 경쟁업체 자동 모니터링
- ⬜ AI 브랜드 매니저 — 캠페인 전략 자동 제안
- ⬜ 자동 A/B 테스트
- ⬜ 매출 데이터 연동 (POS · 예약 시스템)

**핵심 KPI**: AGENCY/PRO 비율 > 30%, NPS > 50

### Phase 4 — 확장 (12개월~)
- 글로벌: 영어/일본어 톤
- 매체 광고비 집행 자동화
- B2B 화이트라벨

---

## 5. 컴포넌트 단위 설계 (Next.js + Tailwind v4 + shadcn/ui)

### 5.1 폴더 구조 제안

```
briq/
├── app/                          # Next.js 16 App Router
│   ├── (marketing)/
│   │   ├── page.tsx              # landing
│   │   ├── pricing/page.tsx
│   │   └── onboarding/[step]/page.tsx
│   ├── (app)/                    # 인증 영역
│   │   ├── layout.tsx            # 사이드바 + 토픽바
│   │   ├── page.tsx              # /home (대시보드)
│   │   ├── brands/
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── content/
│   │   │   ├── cardnews/page.tsx
│   │   │   ├── reels/page.tsx
│   │   │   └── calendar/page.tsx
│   │   ├── automation/
│   │   │   ├── reviews/page.tsx
│   │   │   ├── queue/page.tsx
│   │   │   └── schedule/page.tsx
│   │   ├── insights/
│   │   │   ├── analytics/page.tsx
│   │   │   └── trends/page.tsx
│   │   └── brand/
│   │       ├── memory/page.tsx
│   │       └── kit/page.tsx
│   ├── api/
│   │   ├── ai/
│   │   │   ├── reels/route.ts    # Vercel AI SDK
│   │   │   ├── card/route.ts
│   │   │   └── tone/route.ts
│   │   └── webhooks/
│   └── globals.css
│
├── components/
│   ├── ui/                       # shadcn/ui
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   └── ...
│   ├── sidebar/
│   │   ├── Sidebar.tsx
│   │   ├── NavGroup.tsx
│   │   └── NavItem.tsx
│   ├── topbar/
│   │   ├── Topbar.tsx
│   │   ├── SearchCommand.tsx     # ⌘K
│   │   └── ThemeToggle.tsx
│   ├── ai-assistant/
│   │   ├── AssistantDrawer.tsx   # 우측 패널
│   │   ├── QuickActions.tsx
│   │   └── ChatThread.tsx
│   ├── content/
│   │   ├── ReelsPlayer.tsx
│   │   ├── CardNewsSlide.tsx
│   │   ├── CalendarMonth.tsx
│   │   └── BrandToneSlider.tsx
│   ├── reviews/
│   │   ├── ReviewItem.tsx
│   │   ├── ReplyTemplate.tsx
│   │   └── PlatformBadge.tsx
│   ├── analytics/
│   │   ├── KpiCard.tsx
│   │   ├── BeforeAfter.tsx
│   │   └── ChannelSplit.tsx
│   ├── brand-kit/
│   │   ├── ColorPalette.tsx
│   │   ├── FontPicker.tsx
│   │   └── TemplateGrid.tsx
│   └── onboarding/
│       ├── StepProgress.tsx
│       ├── IndustryPicker.tsx
│       ├── MoodPicker.tsx
│       ├── PhotoUpload.tsx
│       └── AnalysisStages.tsx
│
├── lib/
│   ├── ai/
│   │   ├── tone-memory.ts        # Claude Sonnet 4.6
│   │   ├── reels-generator.ts    # Vercel AI SDK
│   │   ├── card-generator.ts
│   │   └── reply-generator.ts
│   ├── db/
│   │   ├── schema.ts             # Drizzle ORM
│   │   ├── client.ts
│   │   └── queries/
│   ├── auth/
│   │   └── supabase.ts           # Supabase Auth + RLS
│   ├── jobs/
│   │   └── trigger.ts            # Trigger.dev v3
│   └── utils/
│       ├── kr-date.ts            # date-fns-tz Asia/Seoul
│       └── tone-validator.ts     # Zod 금지어
│
└── hooks/
    ├── useBrand.ts
    ├── useToneMemory.ts
    └── useAssistant.ts
```

### 5.2 핵심 컴포넌트 시그니처 예시

```tsx
// components/sidebar/Sidebar.tsx
export function Sidebar() {
  const groups = [
    { title: '운영', items: [{ icon: Home, label: '홈', href: '/' }, ...] },
    { title: 'AI 콘텐츠', items: [...] },
    ...
  ];
  return (
    <aside className="w-60 border-r ...">
      <BrandLogo />
      <nav>
        {groups.map((g) => <NavGroup key={g.title} {...g} />)}
      </nav>
      <UserCard />
    </aside>
  );
}

// components/ai-assistant/AssistantDrawer.tsx
export function AssistantDrawer() {
  const [open, setOpen] = useAssistant();  // ⌘K 트리거
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent side="right" className="w-[420px]">
        <QuickActions actions={[
          { icon: '🎬', label: '릴스 생성', action: () => router.push('/content/reels') },
          { icon: '📢', label: '광고 문구', action: ... },
          ...
        ]} />
        <ChatThread />
      </SheetContent>
    </Sheet>
  );
}

// lib/ai/tone-memory.ts
export async function applyToneMemory(brandId: string, draft: string) {
  const tone = await db.query.brandTones.findFirst({ where: eq(brandTones.brandId, brandId) });
  const result = await streamText({
    model: anthropic('claude-sonnet-4-5'),
    system: buildToneSystemPrompt(tone),  // 5축 + 금지어 + 자주 쓰는 표현
    prompt: draft,
  });
  return result;
}
```

### 5.3 데이터 모델 (Drizzle)

```ts
// lib/db/schema.ts
export const brands = pgTable('brands', {
  id: uuid().primaryKey().defaultRandom(),
  ownerId: uuid().references(() => users.id),
  name: text().notNull(),
  industry: text().notNull(),
  logoUrl: text(),
  createdAt: timestamp().defaultNow(),
});

export const brandTones = pgTable('brand_tones', {
  id: uuid().primaryKey().defaultRandom(),
  brandId: uuid().references(() => brands.id),
  version: integer().notNull(),  // v1, v2, ...
  formality: integer(),  // 1-5
  emotional: integer(),
  traditional: integer(),
  forbidden: jsonb().$type<string[]>(),
  preferred: jsonb().$type<string[]>(),
  summary: text(),  // AI-generated one-liner
  createdAt: timestamp().defaultNow(),
});

export const contents = pgTable('contents', {
  id: uuid().primaryKey().defaultRandom(),
  brandId: uuid().references(() => brands.id),
  type: text().$type<'reels' | 'cardnews' | 'blog' | 'reply'>().notNull(),
  status: text().$type<'draft' | 'scheduled' | 'published' | 'failed'>().notNull(),
  payload: jsonb(),
  scheduledFor: timestamp(),
  publishedAt: timestamp(),
  metrics: jsonb().$type<{ reach: number; saves: number; ctr: number }>(),
});

export const reviews = pgTable('reviews', {
  id: uuid().primaryKey().defaultRandom(),
  brandId: uuid().references(() => brands.id),
  platform: text().$type<'naver' | 'google' | 'baemin' | 'yogiyo' | 'kakao'>().notNull(),
  rating: integer(),
  body: text(),
  customerType: text().$type<'new' | 'regular' | 'difficult'>(),  // BRIQ 자동 분류
  reply: text(),
  replyStatus: text().$type<'pending' | 'auto-sent' | 'manual-sent'>(),
});
```

### 5.4 핵심 라이브러리 (CLAUDE.md 권고와 일치)

- **Next.js 16 App Router** + RSC + Server Actions
- **Tailwind v4** + **shadcn/ui** (CLI 설치, 컴포넌트 소유)
- **Drizzle ORM** + **Supabase** (Postgres + Auth + RLS)
- **Vercel AI SDK 5** + **Anthropic Claude Sonnet 4.6** (브랜드 톤 핵심)
- **Trigger.dev v3** (긴 AI 작업 + HITL Waitpoint)
- **Tiptap v2** (한국어 IME 안정)
- **Pretendard Variable** (한국 UI 폰트)
- **Langfuse + Sentry** (LLM 트레이싱 + 에러)

### 5.5 AI 라우팅 전략

| 작업 | 모델 | 이유 |
|---|---|---|
| 브랜드 톤 학습/적용 | Claude Sonnet 4.6 + prompt caching | 톤 일관성 + 90% 비용 절감 |
| 릴스 자막 / 후크 | GPT-5 | 짧은 텍스트 대량 |
| 네이버 블로그 SEO | HyperCLOVA X | 한국어 토크나이저 + Naver 관성 |
| 이미지 생성 (텍스트) | Ideogram v3 | Hangul 가독성 |
| 이미지 생성 (사진풍) | Imagen 4 | 포토리얼 |
| 리뷰 답변 | Claude Haiku 4.5 | 빠른 응답 + 톤 유지 |

---

## 6. UX 원칙

### 6.1 디자인 시스템

- **여백 중심** — 카드 padding 24~28px, 섹션 80~120px
- **타이포** — Pretendard Variable, 본문 14px, 제목 24~48px
- **컬러** — 라이트(흰+회색+그라디언트 액센트) / 다크(zinc-950 + 인디고/핑크 글로우)
- **애니메이션** — fade-in 400ms / cubic-bezier(.2,.8,.2,1) / 스크롤 reveal
- **그리드** — 12 컬럼 / max-width 1152px

### 6.2 인터랙션 원칙

| 원칙 | 설명 |
|---|---|
| **버튼 수 최소화** | 한 화면에 주요 CTA 1개 |
| **결과 우선** | 입력 폼보다 미리보기 카드를 크게 |
| **원클릭 느낌** | "생성 →" 한 번이면 30초 안에 완성 |
| **스마트 디폴트** | "추천" / "최적" 자동 표기, 사장님은 승인만 |
| **다크모드** | 모든 페이지 지원, localStorage 영속 |
| **모바일** | ≤768px 자동 사이드바 숨김 + 하단 탭바 |

### 6.3 한국형 감성

- **명조체** (Nanum Myeongjo) — 한식·전통 브랜드 헤드라인
- **계절 단어** — "새벽 4시", "한 입에 봄이", "장마", "수국축제"
- **정성/시간 강조** — "직접 담그는", "한 그릇의 시간"
- **이모지 절제** — 1콘텐츠 1이모지 이하

### 6.4 글로벌 SaaS UI

- Notion: 그룹 헤더 + 작은 캡션
- Linear: 진동 사이드바 + 단축키 (⌘K)
- Stripe: 그라디언트 액센트 + 큰 KPI 숫자
- Framer: fade-in + 부드러운 마이크로 인터랙션

---

## 7. 핵심 메시지

> 사용자는 AI 기능보다
> '내 브랜드를 대신 운영해주는 느낌'을 받아야 한다.

각 페이지마다 이걸 검증:
- 사장님이 "내가 뭐 해야 해?" 라고 묻지 않게
- BRIQ가 추천하고 사장님은 승인만
- 결과가 먼저, 설정은 나중에
