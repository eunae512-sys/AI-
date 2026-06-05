---
phase: quick-260605-vea
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - briq-app/lib/cardnews/video-query.ts
  - briq-app/lib/cardnews/hook-generator.ts
autonomous: true
requirements: [VEA-PEXELS-01]
must_haves:
  truths:
    - "한국어 음료 주제(레몬에이드/자몽에이드/청귤 스무디 등)가 Pexels 검색어에 영문 음료 키워드로 들어간다"
    - "translateSubject가 주제를 영문화하지 못해도 imageQueryFor가 주제를 통째로 버리지 않는다 (부분 토큰이라도 결합)"
    - "buildVideoQueryDetailed가 hasDetail=false 폴백 시에도 추출 가능한 핵심 명사를 검색어에 남긴다"
    - "기존 매칭 항목(콜드브루·봄나물 코스 등)이 회귀하지 않는다"
  artifacts:
    - path: "briq-app/lib/cardnews/video-query.ts"
      provides: "보강된 음료/형용사 사전 + 주제 드롭 방지 폴백"
      contains: "lemonade"
    - path: "briq-app/lib/cardnews/hook-generator.ts"
      provides: "translateTopicToEN 재사용 폴백을 적용한 imageQueryFor"
      contains: "translateTopicToEN"
  key_links:
    - from: "briq-app/lib/cardnews/hook-generator.ts"
      to: "briq-app/lib/cardnews/video-query.ts"
      via: "import { translateTopicToEN }"
      pattern: "translateTopicToEN"
    - from: "briq-app/components/campaigns/CardnewsCarousel.tsx"
      to: "imageQueryFor 출력"
      via: "s.imageQuery (주제 박힌 쿼리 자동 반영)"
      pattern: "imageQuery"
---

<objective>
키워드→자동 릴스/카드뉴스 이미지 매칭 버그를 수정한다. 한국어 주제를 영문 Pexels 검색어로 번역하는 정적 사전이 음료(레몬에이드·에이드·스무디 등)에서 비어 있어, 번역 실패 시 주제를 통째로 버리고 업종 일반 이미지로 폴백하는 문제를 해결한다.

근본 원인(오케스트레이터가 정밀 추적 완료, 재조사 불필요):
1. `lib/cardnews/video-query.ts`의 `INGREDIENT_KO_EN`·`TOPIC_EXTRA_KO_EN`에 음료 명사·형용사 누락 → `extractVideoTokens` 0건 → `buildVideoQueryDetailed`의 `hasDetail=false` → 업종 일반 컨텍스트로 폴백.
2. `lib/cardnews/hook-generator.ts`의 `imageQueryFor`(@648)가 `translateSubject`(@612)가 한 글자도 못 바꾸면(`topicSubject === ctx.t.subject`) 주제를 드롭하고 `industrySubject`만 사용 — 이게 카드뉴스 이미지 핵심 버그.

Purpose: 사용자가 준 캠페인 키워드가 실제 영상/이미지 매칭에 반영되도록 해 "주제와 무관한 핑크 그라데이션" 증상 제거. 직원 반복 업무(수동 이미지 교체)를 줄이는 코어 밸류에 직결.
Output: 보강된 사전 + 주제 드롭 방지 폴백. 표현·검색어 빌더만 수정, 로직/과금/발행 무손상.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@./CLAUDE.md

<interfaces>
<!-- video-query.ts 기존 export (Task 2가 재사용). 코드 탐색 불필요. -->
From briq-app/lib/cardnews/video-query.ts:
```typescript
export type VideoTopicTokens = { ingredients: string[]; menu: string[]; season: string[]; time: string[]; mood: string[]; };
export function extractVideoTokens(topic: string): VideoTopicTokens;
// 한국어 주제 → 영문 핵심 명사. 사전(INGREDIENT/MENU/TOPIC_EXTRA) 매칭. 0건이면 "".
export function translateTopicToEN(topic: string): string;
export function buildVideoQueryDetailed(opts: {
  industry?: Brand["industry"]; topic?: string; campaignHeadline?: string;
  signatureMenu?: string[]; mood?: Brand["mood"]; seedQuery?: string;
}): string;
```

From briq-app/lib/cardnews/hook-generator.ts (현행, 버그 위치):
```typescript
// @612 — 사전 미스 시 입력 그대로 반환
function translateSubject(subject: string): string;
// @648 — topicSubject===ctx.t.subject 일 때 주제 드롭하고 industrySubject만 사용
function imageQueryFor(role: SlideRole, ctx: Ctx): string;
```
기존 import 라인은 `@/types`, `@/components/campaigns/types`, `@/lib/brand/brand-context`, `@/lib/utils/korean-particles`, `@/lib/cardnews/hook-patterns`. (video-query 미import — Task 2에서 추가.)
</interfaces>

<verify_tooling>
<!-- 이 레포에는 tsx/ts-node 가 없음. TS 모듈을 일회용으로 실행하려면 이미 설치된 jiti 를 쓴다.
     briq-app 디렉터리 안에 임시 .cjs 프로브를 쓰고(모듈 해석을 위해 반드시 briq-app 내부), 실행 후 삭제.
     video-query.ts 의 `import type { Brand }` 는 타입 전용이라 런타임에 소거됨 → @ 별칭 해석 불필요. 검증됨. -->
패턴(verify 블록에서 사용):
```
cd briq-app && cat > .vea-probe.cjs <<'EOF'
const { createJiti } = require('jiti');
const jiti = createJiti(__filename);
(async () => {
  const m = await jiti.import('./lib/cardnews/video-query.ts');
  for (const t of ['상큼한 레몬에이드','여름 자몽에이드','청귤 스무디','5월 봄나물 코스','콜드브루 신메뉴']) {
    console.log(t, '=>', m.buildVideoQueryDetailed({industry:'cafe', topic:t}), '| topicEN:', JSON.stringify(m.translateTopicToEN(t)));
  }
})().catch(e => { console.error('ERR', e.message); process.exit(1); });
EOF
node .vea-probe.cjs; rm -f .vea-probe.cjs
```
</verify_tooling>
</context>

<tasks>

<task type="auto">
  <name>Task 1: video-query.ts 사전 보강 + hasDetail 폴백 시 핵심 명사 잔류</name>
  <files>briq-app/lib/cardnews/video-query.ts</files>
  <action>
이 파일이 음료·형용사 사전의 단일 진리 원천이 되도록 보강한다. Task 2의 hook-generator가 `translateTopicToEN`을 재사용하므로, 보강은 여기 한 곳에서만 한다.

(1) `INGREDIENT_KO_EN`(@17~108)에 누락 음료/디저트 명사 추가 (기존 키와 중복 금지 — 이미 있는 콜드브루·라떼·에스프레소·빙수·마카롱 등은 손대지 말 것). 최소 추가:
  레몬에이드: "lemonade", 레모네이드: "lemonade", 에이드: "fruit ade sparkling drink",
  자몽에이드: "grapefruit ade", 자몽: "grapefruit", 청귤: "green tangerine citrus",
  한라봉: "hallabong citrus", 라임: "lime", 모히토: "mojito mint lime",
  스무디: "fruit smoothie", 셰이크: "milkshake", 밀크쉐이크: "milkshake",
  프라페: "frappe iced blended", 망고: "mango", 딸기라떼: "strawberry latte",
  아인슈페너: "einspanner cream coffee",
  복숭아아이스티: "peach iced tea", 자몽차: "grapefruit tea", 유자차: "yuzu citron tea",
  아이스티: "iced tea", 콜라: "cola soda", 사이다: "lemon lime soda",
  과일: "fresh fruit", 청포도: "green grape", 블루베리: "blueberry", 레몬: "lemon".
  주의: 동일 키를 두 번 쓰지 말 것(JS 객체 리터럴 중복 키는 뒤 값이 덮어씀). "자몽에이드"를 "자몽"보다 위에 두면 가독성↑(extractVideoTokens는 전 키 순회라 둘 다 들어가도 무해 — "여름 자몽에이드"는 grapefruit ade + grapefruit 둘 다 매칭되어도 OK).

(2) 주제 형용사를 `MOOD_KO_EN`(@152~159)에 추가하고, 검색어에 1개가 들어가도록 buildVideoQueryDetailed를 한 줄 보강. 최소 추가(영문 톤 키워드 형태):
  상큼한: "fresh citrus bright", 시원한: "cold refreshing icy",
  달콤한: "sweet", 새콤한: "tangy sour fresh", 청량한: "refreshing crisp",
  진한: "rich deep", 고소한: "nutty savory".
  현재 buildVideoQueryDetailed는 `tokens.mood`를 검색어에 안 넣는다(@336~337은 season/time만 push). 따라서 season/time push 다음, 브랜드 mood(@340) 앞에 한 줄 추가:
  `if (tokens.mood.length > 0) parts.push(tokens.mood[0]);`
  10단어 한도(@351)가 있어 과다 추가 위험 없음. 이로써 "상큼한 레몬에이드"의 "상큼한"이 `fresh citrus bright`로 검색어에 반영된다.

(3) `TOPIC_EXTRA_KO_EN`(@229~237): 음료 명사는 (1)에서 INGREDIENT_KO_EN 에 넣었으므로 translateTopicToEN(@247 `[...t.ingredients, ...t.menu]`)에 자동 반영된다. 따라서 TOPIC_EXTRA 에 음료 명사를 중복 추가하지 말 것 — 단일 원천 유지. (비식재료 보조어가 추가로 필요하면 그것만, 하지만 이 버그 범위에선 불필요.)

(4) 폴백(주제 드롭 방지)은 이미 부분적으로 안전하다: @317~318은 hasDetail 여부와 무관하게 ingredients/menu를 push하므로, 사전 보강만으로 음료가 잡히면 hasDetail=false 폴백 경로에서도 음료 키워드가 검색어에 남는다. (2)의 mood push가 형용사까지 커버. 별도 구조 변경 불필요 — (1)(2)로 충분함을 확인하고 불필요한 리팩터링은 하지 말 것.

CLAUDE.md 준수: 이 파일은 영문 검색어 빌더라 한글 이탤릭·카피 톤과 무관. MusicMood/플랜/한도/발행 등 무관 코드 절대 손대지 말 것. extractVideoTokens·buildVideoQueryDetailed·translateTopicToEN 의 시그니처·export 불변.
  </action>
  <verify>
    <automated>cd briq-app && ./node_modules/.bin/tsc --noEmit -p tsconfig.json 2>&1 | tail -5</automated>
    <automated>cd briq-app && printf '%s\n' "const { createJiti } = require('jiti');" "const jiti = createJiti(__filename);" "(async () => {" "  const m = await jiti.import('./lib/cardnews/video-query.ts');" "  for (const t of ['상큼한 레몬에이드','여름 자몽에이드','청귤 스무디','5월 봄나물 코스','콜드브루 신메뉴']) {" "    console.log(t, '=>', m.buildVideoQueryDetailed({industry:'cafe', topic:t}), '| topicEN:', JSON.stringify(m.translateTopicToEN(t)));" "  }" "})().catch(e => { console.error('ERR', e.message); process.exit(1); });" > .vea-probe.cjs && node .vea-probe.cjs; rm -f .vea-probe.cjs</automated>
  </verify>
  <done>
- tsc --noEmit 0 에러.
- "상큼한 레몬에이드" → 검색어에 `lemonade` 포함(가능하면 `fresh citrus bright`도).
- "여름 자몽에이드" → `grapefruit` 계열 포함, "청귤 스무디" → `green tangerine` 또는 `smoothie` 포함.
- 회귀 확인: "5월 봄나물 코스" 검색어에 `spring vegetables namul` + `tasting course` 잔존, "콜드브루 신메뉴" → `cold brew` 잔존.
  </done>
</task>

<task type="auto">
  <name>Task 2: hook-generator.ts — translateSubject 보강 + imageQueryFor 주제 드롭 방지</name>
  <files>briq-app/lib/cardnews/hook-generator.ts</files>
  <action>
카드뉴스 이미지 경로의 핵심 버그를 고친다. `imageQueryFor`(@648~677)가 translateSubject 실패 시 주제를 통째로 버리지 않도록 한다.

(1) 파일 상단 import 블록(@19~25 영역)에 추가:
  `import { translateTopicToEN } from "@/lib/cardnews/video-query";`

(2) `translateSubject`(@612~646) 사전(@614~637 map)에 자주 쓰는 음료 명사 몇 개를 보강(핵심 명사 위주, 형용사는 불필요 — (3) 폴백이 명사를 잡고 video-query mood 토큰이 형용사를 잡음). 추가 예:
  레몬에이드: "lemonade", 레모네이드: "lemonade", 에이드: "fruit ade sparkling",
  자몽: "grapefruit", 청귤: "green tangerine", 한라봉: "hallabong citrus",
  스무디: "fruit smoothie", 셰이크: "milkshake", 빙수: "korean shaved ice bingsu",
  망고: "mango", 딸기: "strawberry".
  (Task 1에서 video-query 사전을 단일 원천으로 키웠으므로, 여기는 "이미지 쿼리에 빠르게 박히는 1차 명사구"만 최소로. 누락분은 (3) 폴백이 커버.) 동일 키 중복 금지.

(3) imageQueryFor 의 주제 드롭 방지(핵심). 현행 @661~663:
  ```
  const topicSubject = translateSubject(ctx.t.subject);
  const subject = topicSubject !== ctx.t.subject ? `${topicSubject}, ${industrySubject}` : industrySubject;
  ```
  를 아래로 교체:
  ```
  const direct = translateSubject(ctx.t.subject);
  const translated = direct !== ctx.t.subject ? direct : translateTopicToEN(ctx.t.subject);
  const subject = translated && translated.trim().length > 0
    ? `${translated}, ${industrySubject}`
    : industrySubject;
  ```
  - translateSubject 성공 시 그것 우선.
  - 실패 시(`direct === ctx.t.subject`)에도 주제를 버리지 말고 `translateTopicToEN(ctx.t.subject)`로 부분 토큰 확보.
  - 부분 토큰이 비어있지 않으면 결합, 완전히 비면(번역 0건)만 현행대로 industrySubject only.
  이로써 "상큼한 레몬에이드"는 lemonade 를 확보해 `lemonade, specialty cafe minimal still life`처럼 주제가 살아 들어간다.

(4) CardnewsCarousel 은 `s.imageQuery ?? buildEditorialQuery(...)`로 imageQueryFor 출력을 그대로 쓰므로 추가 prop 배선 불필요 — 이 task 만으로 슬라이드 이미지에 자동 반영. CardnewsCarousel.tsx 는 건드리지 말 것.

무관 코드 절대 손대지 말 것: CAPTION_OPENERS·해시태그·MOOD_IMAGE_STYLE·CTA 풀·발행·과금 로직 불변. 카피 생성(한글 문구) 경로는 손대지 않음 — translateSubject/imageQueryFor 는 영문 Pexels 검색어 전용이라 CLAUDE.md 한글 이탤릭/카피 톤 철칙과 무관.
  </action>
  <verify>
    <automated>cd briq-app && ./node_modules/.bin/tsc --noEmit -p tsconfig.json 2>&1 | tail -5</automated>
    <automated>cd briq-app && printf '%s\n' "const { createJiti } = require('jiti');" "const jiti = createJiti(__filename);" "(async () => {" "  const m = await jiti.import('./lib/cardnews/video-query.ts');" "  for (const s of ['상큼한 레몬에이드','여름 자몽에이드','청귤 스무디','5월 봄나물 코스','콜드브루']) {" "    console.log(s, '=> topicEN:', JSON.stringify(m.translateTopicToEN(s)));" "  }" "})().catch(e => { console.error('ERR', e.message); process.exit(1); });" > .vea-probe.cjs && node .vea-probe.cjs; rm -f .vea-probe.cjs</automated>
    <automated>cd briq-app && grep -n "translateTopicToEN" lib/cardnews/hook-generator.ts</automated>
  </verify>
  <done>
- tsc --noEmit 0 에러.
- translateTopicToEN("상큼한 레몬에이드")가 `lemonade`를 포함(비어있지 않음) → imageQueryFor 가 주제를 살린다.
- grep 확인: hook-generator.ts 에 `translateTopicToEN` import + imageQueryFor 사용 라인 2건 이상 존재.
- 코드 리뷰: imageQueryFor 가 translateSubject 실패 시에도 translateTopicToEN 폴백을 거쳐, 번역 0건일 때만 industry-only 로 떨어진다.
- 회귀: "콜드브루"·"5월 봄나물 코스" 등 기존 매칭이 여전히 주제를 살려 결합한다.
  </done>
</task>

</tasks>

<verification>
- `cd briq-app && ./node_modules/.bin/tsc --noEmit -p tsconfig.json` → 0 에러 (양 task 후).
- jiti 프로브(위 verify)로 "상큼한 레몬에이드"·"여름 자몽에이드"·"청귤 스무디"가 buildVideoQueryDetailed/translateTopicToEN 출력에 영문 음료 키워드를 실제로 포함하는지 콘솔 확인. (이 레포에는 tsx 없음 → 설치된 jiti 사용, briq-app 내부 임시 .cjs.)
- 회귀: "5월 봄나물 코스"·"콜드브루" 등 기존 매칭 1~2개가 그대로 동작.
- (선택) dev 서버(포트 3000)가 main 트리에서 핫리로드 중이므로, /reels 또는 캠페인 카드뉴스 드래프트를 음료 키워드로 생성해 헤드리스 Chrome 스크린샷(`--headless=new --screenshot`)으로 영상/슬라이드 이미지가 주제와 맞는지 육안 확인.
</verification>

<success_criteria>
- 한국어 음료 주제(레몬에이드·에이드·자몽·청귤·스무디 등)가 릴스 영상 검색어와 카드뉴스 슬라이드 이미지 쿼리에 영문 키워드로 반영된다.
- translateSubject/사전 미스 시에도 주제가 통째로 드롭되지 않는다(부분 토큰 우선 결합, 0건일 때만 industry-only 폴백).
- 기존 매칭(콜드브루·봄나물 코스 등) 회귀 없음.
- 로직/과금/발행/MusicMood/한글 카피 톤 전부 무손상. 표현·검색어 빌더 2개 파일만 변경.
</success_criteria>

<output>
After completion, create `.planning/quick/260605-vea-pexels/260605-vea-SUMMARY.md`
</output>
