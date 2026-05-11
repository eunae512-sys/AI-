# BRIQ — AI 브랜드 운영 시스템

> 사장님 대신 브랜드를 운영해주는 AI 직원.
> Next.js 16 + TypeScript + Tailwind v4 + shadcn/ui + Framer Motion (motion).

## 빠른 시작

```bash
cd briq-app
pnpm install   # or npm install / yarn
pnpm dev       # http://localhost:3000
```

## 폴더 구조

```
briq-app/
├── app/                              # Next.js App Router
│   ├── layout.tsx                    # 루트 + ThemeProvider
│   ├── globals.css                   # Tailwind v4 + 디자인 토큰
│   ├── page.tsx                      # / 랜딩페이지
│   ├── login/page.tsx                # /login
│   ├── pricing/page.tsx              # /pricing
│   ├── onboarding/page.tsx           # /onboarding (7-step)
│   └── (app)/                        # 인증 영역 라우트 그룹
│       ├── layout.tsx                # 사이드바 + AssistantProvider
│       ├── dashboard/page.tsx        # 메인 대시보드
│       ├── clients/page.tsx          # 브랜드 목록
│       ├── reels/page.tsx            # AI 릴스 스튜디오
│       ├── calendar/page.tsx         # 콘텐츠 캘린더
│       ├── analytics/page.tsx        # 성과 분석
│       ├── brand-tone/page.tsx       # 브랜드 톤 메모리
│       ├── reviews/page.tsx          # 리뷰 자동 답변
│       ├── settings/page.tsx         # 설정
│       └── (cardnews|review-queue|schedule|trends|brand-kit)/  # Phase 2 stub
├── components/
│   ├── ui/                           # shadcn-style primitives
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── badge.tsx
│   │   └── input.tsx
│   ├── layout/
│   │   ├── ThemeProvider.tsx         # next-themes 래퍼
│   │   ├── ThemeToggle.tsx
│   │   ├── Sidebar.tsx               # 5 그룹 + Framer Motion 활성 인디케이터
│   │   ├── Topbar.tsx                # 검색바 (⌘K) + Assistant 버튼
│   │   └── ComingSoon.tsx
│   ├── ai-assistant/
│   │   ├── AssistantProvider.tsx     # Context + ⌘K 단축키
│   │   └── AssistantDrawer.tsx       # 우측 슬라이드 드로어 + 6 빠른 실행 + 채팅
│   ├── landing/
│   │   ├── Nav.tsx                   # 상단 nav (sticky blur)
│   │   ├── Hero.tsx                  # 히어로 + 폰 mockup
│   │   └── Sections.tsx              # 문제/릴스/톤/캘린더/케이스/FAQ/CTA
│   ├── onboarding/
│   │   └── Onboarding.tsx            # 7-step 인터랙티브
│   ├── dashboard/
│   │   └── Dashboard.tsx             # KPI + 추천 + 트렌드 + 활동
│   ├── reels/
│   │   └── ReelsScreen.tsx           # 폰 mockup + 템플릿/후크/BGM 선택
│   └── calendar/
│       └── CalendarScreen.tsx        # 월간 + 추천 캐러셀
├── lib/
│   ├── utils.ts                      # cn() · formatNumber/Currency/Relative
│   ├── nav.ts                        # 사이드바 nav 정의 (5 그룹 14 항목)
│   └── dummy/
│       ├── brands.ts                 # 6 브랜드 (미옥당/로스터리/서촌스테이/달콤/루나/FORUM)
│       └── recommendations.ts        # 추천/활동/트렌드 더미
└── types/
    └── index.ts                      # Brand · ContentItem · Review · Recommendation
```

## 기술 스택

| 레이어 | 선택 | 이유 |
|---|---|---|
| 프레임워크 | Next.js 16 App Router | RSC + Server Actions + 한국 icn1 리전 |
| 언어 | TypeScript 5.6+ | strict 모드 |
| 스타일 | Tailwind v4 | CSS-first config (globals.css) + 다크모드 class |
| UI 컴포넌트 | shadcn/ui (인라인) | CLI로 설치 가능, 코드 소유 |
| 애니메이션 | motion (framer-motion 후속) | 부드러운 페이지 전환 + 인디케이터 |
| 아이콘 | lucide-react | shadcn 표준 |
| 다크모드 | next-themes | localStorage 영속 + class 전환 |

## 라우팅 구조

### 공개 라우트
- `/` 랜딩페이지 (10 섹션: Hero · 문제 · 릴스 · 톤 · 캘린더 · 케이스 · FAQ · CTA)
- `/login` 로그인 (Google · 카카오 · 이메일 + 우측 에디토리얼)
- `/pricing` 4 티어 (Free · Starter ₩39K · Pro ₩99K★ · Agency ₩299K)
- `/onboarding` 7-step 인터랙티브

### 인증 라우트 (`(app)` 그룹)
- `/dashboard` 홈 — 4 KPI · 오늘 추천 · 인기 릴스 · 활동 피드
- `/clients` 브랜드 목록 — 6 브랜드 카드 그리드
- `/reels` AI 릴스 스튜디오 — 폰 mockup + 4 템플릿 + 후크/BGM 선택
- `/calendar` 콘텐츠 캘린더 — 추천 카드 + 월간 그리드
- `/analytics` 성과 분석 — 4 KPI 스파크 + Before/After + TOP 5
- `/brand-tone` 브랜드 톤 메모리 — 5축 슬라이더 + 금지어 + Before/After
- `/reviews` 리뷰 자동 답변 — 진상/단골 자동 분류
- `/settings` 설정 — 계정 · 결제 · 외부 연결
- `/cardnews · /review-queue · /schedule · /trends · /brand-kit` Phase 2 stub

## 디자인 시스템

### 토큰 (globals.css)
- 라이트: `#ffffff` / `#fafafa` / `#e5e7eb` / `#111827`
- 다크: `#0a0a0b` / `#0f0f12` / `#27272a` / `#fafafa`
- 그라데이션 액센트: `#6366f1 → #a855f7 → #ec4899` (`gradient-text` 유틸)

### 폰트
- UI: Pretendard Variable (CDN)
- 강조: Nanum Myeongjo (한식·전통 브랜드 헤드라인)

### 인터랙션
- 페이지 전환: `motion` `AnimatePresence` mode="wait"
- 사이드바 활성: `motion.span` `layoutId="nav-indicator"` 그라데이션 바
- ⌘K 단축키: AI Assistant 토글
- 다크모드: `class` 전략 + `next-themes`

## AI Assistant Drawer

전역 우측 드로어. 모든 `(app)` 페이지에서 사용 가능.

```tsx
const { open, close, toggle } = useAssistant();
```

- ⌘K / Ctrl+K → 토글
- Esc → 닫기
- 6 빠른 실행: 릴스 / 광고 문구 / 블로그 / 이벤트 / 카드뉴스 / 리뷰
- mock 채팅 (실 API 연결 시 `/api/ai/chat` route handler로 교체)

## 더미 데이터 → 실 API 연결 가이드

현재는 `lib/dummy/*.ts` 에서 정적 import. 실 서비스 연결 단계:

```
1. Supabase 스키마 정의 (BRIQ-DESIGN.md 참조)
2. lib/db/schema.ts (Drizzle) 생성
3. server actions: lib/actions/{brands,content,reviews}.ts
4. 페이지에서 import 변경:
   - import { brands } from "@/lib/dummy/brands"
   + import { getBrands } from "@/lib/actions/brands"
5. AI 연결: lib/ai/{tone-memory,reels-generator}.ts (Vercel AI SDK)
```

## 응답형

- ≥1024px: 사이드바(60px) + 메인 (12 컬럼 그리드)
- 768~1024px: 사이드바 유지, 메인 6 컬럼
- ≤768px: 사이드바 자동 숨김 (md:flex 조건)

## 다크모드

```tsx
import { useTheme } from "next-themes";
const { setTheme } = useTheme();
setTheme("dark"); // or "light" / "system"
```

모든 컴포넌트가 `dark:` Tailwind 변형 + CSS 변수로 양쪽 톤 대응.

## 다음 단계

### Phase 1 후속 (이미 스캐폴드됨)
- [x] 랜딩페이지 / 로그인 / 온보딩 / 대시보드
- [x] AI 릴스 스튜디오
- [x] 콘텐츠 캘린더
- [x] 성과 분석
- [x] 브랜드 톤 메모리
- [x] AI Assistant 드로어

### Phase 2 (구현 필요)
- [ ] `/cardnews` — 6장 캐러셀 생성 인터랙션
- [ ] `/review-queue` — 발행 전 검수 워크플로우
- [ ] `/schedule` — 멀티채널 예약 큐
- [ ] `/trends` — 1km 반경 분석
- [ ] `/brand-kit` — 자동 추출 + PDF export
- [ ] Supabase Auth 연동
- [ ] Vercel AI SDK 5 + Claude Sonnet 4.6
- [ ] Trigger.dev v3 (긴 AI 작업)

### Phase 3
- [ ] 모바일 하단 탭바 + PWA
- [ ] Drizzle ORM + RLS
- [ ] Stripe 결제
- [ ] Langfuse 트레이싱

## 라이선스

© 2026 BRIQ Inc. · Private (출시 전 사내 사용).
