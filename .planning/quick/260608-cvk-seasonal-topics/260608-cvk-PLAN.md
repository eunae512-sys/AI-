---
phase: quick-260608-cvk
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - briq-app/lib/content/season.ts
  - briq-app/components/blog/BlogScreen.tsx
autonomous: true
requirements:
  - QUICK-260608-cvk
must_haves:
  truths:
    - "블로그 '추천 주제'가 현재 KST 월/계절에 맞게 자동으로 바뀐다 (6월=여름)"
    - "6월에는 stay 추천 주제에서 '어버이날'·'5월' 표현이 사라지고 여름/장마/휴가 류가 나타난다"
    - "getSeasonContext 는 now 인자를 주입하면 결정론적으로 같은 출력을 낸다 (서버/클라 무관 KST)"
    - "6업종 × 4시즌 전부 최소 2개의 주제가 보장된다"
    - "신규 시즌 주제에 가짜 수치(%/배/별점)·미검증 통계가 없다 (CLAUDE.md 정직성)"
    - "기존 도시명 치환(localizeTopic)·블로그 생성/SERP/발행 로직은 무손상"
  artifacts:
    - path: "briq-app/lib/content/season.ts"
      provides: "KST 시즌 컨텍스트 순수함수 getSeasonContext + SeasonKey 타입"
      contains: "export function getSeasonContext"
    - path: "briq-app/components/blog/BlogScreen.tsx"
      provides: "업종×시즌 SEASONAL_TOPICS + 시즌 인식 presets useMemo"
      contains: "SEASONAL_TOPICS"
  key_links:
    - from: "briq-app/components/blog/BlogScreen.tsx"
      to: "briq-app/lib/content/season.ts"
      via: "import { getSeasonContext }"
      pattern: "getSeasonContext"
    - from: "presets useMemo"
      to: "SEASONAL_TOPICS[industry][seasonKey]"
      via: "현재 seasonKey 로 시즌 풀 선택 후 localizeTopic 적용"
      pattern: "SEASONAL_TOPICS\\[.*\\]\\[.*\\]"
---

<objective>
블로그 화면의 "추천 주제"가 현재 시기(KST 월/계절)에 자동으로 맞춰 바뀌게 한다.

현재 버그: `TOPIC_PRESETS[industry]` 가 업종별 3개 고정이고 시기가 하드코딩(stay "어버이날 한옥 1박" / "북촌 5월 산책", dessert "수박 케이크 7월 한정", beauty "장마철"/"S/S 26" 등)이라 `presets` useMemo 는 도시명만 치환(`localizeTopic`)하고 시기는 그대로 둔다. → 6월(지금)인데 5월·어버이날 주제가 노출된다.

Purpose: 사장님이 매달 추천 주제를 손보지 않아도 그 계절에 자연스러운 SEO 주제를 받게 해 반복 업무를 줄인다.
Output: KST 시즌 컨텍스트 순수함수(`lib/content/season.ts`) + 업종×시즌 주제 풀(`SEASONAL_TOPICS`) + 시즌 인식 `presets` 연결.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@briq-app/components/blog/BlogScreen.tsx
@briq-app/lib/dummy/brands.ts

<interfaces>
<!-- 실행자가 코드베이스를 다시 탐색할 필요 없도록 핵심 계약을 박아둠 -->

types/index.ts:
```typescript
export type Industry = "cafe" | "dessert" | "stay" | "restaurant" | "beauty" | "local";
```

BlogScreen.tsx — Topic 모양 (인라인 타입):
```typescript
type Topic = { title: string; keywords: string[]; intent: string };
```

BlogScreen.tsx 현재 presets useMemo (@139-145) — 이 블록을 시즌 인식으로 교체:
```typescript
const presets = React.useMemo(() => {
  const base = TOPIC_PRESETS[brand.industry] ?? TOPIC_PRESETS.restaurant;
  return base.map((p) => ({ ...p, title: localizeTopic(p.title, brand.city) }));
}, [brand.industry, brand.city]);
```

BlogScreen.tsx — localizeTopic / normalizeCityName / KOREAN_DISTRICTS 는 그대로 유지(@49-75).
브랜드 도시 샘플: restaurant=강남구, cafe=서촌, stay=종로구, dessert=성수동, beauty=강남구, local=한남동.

tsconfig paths: `@/*` → 프로젝트 루트(briq-app). jiti, node 사용 가능.
TOPIC_PRESETS / localizeTopic 는 BlogScreen.tsx 외부에서 import 되지 않음(grep 확인). → 자유롭게 재편 가능.
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: lib/content/season.ts — KST 시즌 컨텍스트 순수함수</name>
  <files>briq-app/lib/content/season.ts</files>
  <action>
아래 파일을 그대로 생성한다. 결정론적 순수함수 — Math.random·Date.now 분기 금지(now 미지정 시에만 Date.now 1회 호출). KST(UTC+9)는 date-fns 없이 직접 계산.

```typescript
// 현재 시기(KST) 기준 시즌 컨텍스트. 블로그 추천 주제가 계절에 맞게 자동 변경되도록 한다.
// 순수함수·결정론: 같은 now 입력이면 항상 같은 출력. 서버/클라 무관하게 KST(UTC+9)로 계산.

export type SeasonKey = "spring" | "summer" | "autumn" | "winter";

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

const SEASON_LABEL: Record<SeasonKey, string> = {
  spring: "봄",
  summer: "여름",
  autumn: "가을",
  winter: "겨울",
};

// 월(1~12) → 시즌. 3~5 봄 / 6~8 여름 / 9~11 가을 / 12·1·2 겨울.
function monthToSeason(month: number): SeasonKey {
  if (month >= 3 && month <= 5) return "spring";
  if (month >= 6 && month <= 8) return "summer";
  if (month >= 9 && month <= 11) return "autumn";
  return "winter"; // 12, 1, 2
}

export interface SeasonContext {
  month: number;        // 1~12 (KST)
  seasonKey: SeasonKey;
  seasonLabel: string;  // 한글: 봄/여름/가을/겨울
  monthLabel: string;   // "N월"
}

/**
 * 현재(또는 주입한 now)의 KST 월/계절 컨텍스트를 반환.
 * @param now 테스트용 주입. 미지정 시 현재 시각.
 */
export function getSeasonContext(now?: Date): SeasonContext {
  const baseMs = (now ?? new Date()).getTime();
  // UTC ms + 9h → 해당 시각의 KST 벽시계를 UTC 메서드로 읽는다(로컬 타임존 영향 제거).
  const kst = new Date(baseMs + KST_OFFSET_MS);
  const month = kst.getUTCMonth() + 1; // 1~12
  const seasonKey = monthToSeason(month);
  return {
    month,
    seasonKey,
    seasonLabel: SEASON_LABEL[seasonKey],
    monthLabel: `${month}월`,
  };
}
```
  </action>
  <verify>
    <automated>cd briq-app && ./node_modules/.bin/jiti -e "import('./lib/content/season.ts').then(m=>{const cases=[[0,'winter','1월'],[3,'spring','4월'],[5,'summer','6월'],[6,'summer','7월'],[9,'autumn','10월'],[11,'winter','12월']];for(const [mIdx,sk,ml] of cases){const d=new Date(Date.UTC(2026,mIdx,15,3,0,0));const c=m.getSeasonContext(d);if(c.seasonKey!==sk||c.monthLabel!==ml){throw new Error('FAIL '+JSON.stringify(c)+' expected '+sk+'/'+ml)}}console.log('OK season')})"</automated>
  </verify>
  <done>season.ts 존재, getSeasonContext 가 1/4/6/7/10/12월(UTC mid-day 주입) → winter/spring/summer/summer/autumn/winter + monthLabel 정확. "OK season" 출력.</done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: BlogScreen — SEASONAL_TOPICS 업종×시즌 주제 풀로 재편</name>
  <files>briq-app/components/blog/BlogScreen.tsx</files>
  <behavior>
    - SEASONAL_TOPICS 에 6업종(restaurant/cafe/dessert/stay/beauty/local) × 4시즌(spring/summer/autumn/winter) 전부 존재, 각 ≥2개 Topic.
    - 모든 title 에 가짜 수치 없음: %, "배"(N배), 별점(★/점) 패턴 부재. (가격대 "3만~7만원" 같은 사실형 안내는 허용 — 단 통계·효능 수치는 금지. 안전하게 신규 주제엔 수치 자체를 넣지 않는다.)
    - stay summer 주제에 "어버이날"·"5월" 부재, 여름/장마/휴가 류 존재.
  </behavior>
  <action>
BlogScreen.tsx 상단에서 다음을 수행:

1. import 추가 (파일 상단 import 블록, @/lib/utils import 부근):
```typescript
import { getSeasonContext, type SeasonKey } from "@/lib/content/season";
```

2. 기존 `TOPIC_PRESETS` 상수(@16-47) 전체를 삭제하고, 아래 `Topic` 타입 + `SEASONAL_TOPICS` 로 교체한다. 톤=사장님 구어/단정, 시기 표현은 해당 계절만. 가짜 수치·가짜 통계 없음(CLAUDE.md 정직성). 기존 좋은 주제는 알맞은 시즌에 재배치, 지역명(강남/서촌/북촌 등)은 localizeTopic 이 도시 치환하므로 그대로 둔다.

```typescript
type Topic = { title: string; keywords: string[]; intent: string };

// 업종 × 시즌 추천 주제. 현재 KST 계절에 맞춰 자동 선택된다(getSeasonContext).
// 시기 표현은 해당 계절에만. 가짜 수치·통계 금지(정직성).
const SEASONAL_TOPICS: Record<string, Record<SeasonKey, Topic[]>> = {
  restaurant: {
    spring: [
      { title: "봄나물 코스 — 강남 제철 한 상", keywords: ["봄나물 한정식", "강남 봄정식"], intent: "시즌 정보" },
      { title: "상견례 봄 코스 — 강남 룸 예약 가이드", keywords: ["강남 상견례 한정식", "상견례 룸"], intent: "예약 전환" },
      { title: "한정식 1인 가격대별 추천", keywords: ["한정식 1인 가격", "강남 한정식 추천"], intent: "비교/리뷰" },
    ],
    summer: [
      { title: "여름 보양 한 상 — 강남 제철 코스", keywords: ["여름 보양식 강남", "복날 한정식"], intent: "시즌 정보" },
      { title: "냉(冷) 메뉴가 있는 한정식 — 더위 식히는 한 상", keywords: ["여름 한정식", "강남 시원한 한식"], intent: "시즌 가이드" },
      { title: "한정식 1인 가격대별 추천", keywords: ["한정식 1인 가격", "강남 한정식 추천"], intent: "비교/리뷰" },
    ],
    autumn: [
      { title: "가을 제철 코스 — 버섯·전어 한 상", keywords: ["가을 한정식", "강남 제철 코스"], intent: "시즌 정보" },
      { title: "추석 상차림 예약 가이드 — 강남 룸 추천", keywords: ["추석 한정식 강남", "명절 상차림"], intent: "예약 전환" },
      { title: "한정식 1인 가격대별 추천", keywords: ["한정식 1인 가격", "강남 한정식 추천"], intent: "비교/리뷰" },
    ],
    winter: [
      { title: "겨울 따뜻한 한 상 — 국물·전골 코스", keywords: ["겨울 한정식", "강남 전골 코스"], intent: "시즌 정보" },
      { title: "연말 모임 한정식 — 강남 단체 룸 가이드", keywords: ["연말 모임 한정식", "강남 단체 룸"], intent: "예약 전환" },
      { title: "한정식 1인 가격대별 추천", keywords: ["한정식 1인 가격", "강남 한정식 추천"], intent: "비교/리뷰" },
    ],
  },
  cafe: {
    spring: [
      { title: "봄 한정 시즌 음료 — 우리가 고른 향", keywords: ["봄 시즌 음료", "서촌 카페"], intent: "시즌 한정" },
      { title: "서촌 봄 산책 후 들르기 좋은 자리", keywords: ["서촌 카페", "서촌 봄 나들이"], intent: "지역 가이드" },
      { title: "에티오피아 예가체프 — 우리가 고른 농장", keywords: ["예가체프 원두 추천", "스페셜티 원두"], intent: "산지 스토리" },
    ],
    summer: [
      { title: "콜드브루 추출 비율 — 집에서 따라하는 법", keywords: ["콜드브루 추출법", "콜드브루"], intent: "HowTo 정보" },
      { title: "여름 아이스 메뉴 — 우리가 권하는 한 잔", keywords: ["여름 아이스 음료", "서촌 카페"], intent: "시즌 가이드" },
      { title: "서촌 작업 카페 — 콘센트·와이파이 자리", keywords: ["서촌 작업 카페", "서촌 카페"], intent: "지역 비교" },
    ],
    autumn: [
      { title: "가을 원두 — 깊은 바디의 한 잔", keywords: ["가을 원두 추천", "스페셜티 원두"], intent: "산지 스토리" },
      { title: "서촌 단풍 산책 후 들르기 좋은 카페", keywords: ["서촌 카페", "서촌 가을 나들이"], intent: "지역 가이드" },
      { title: "핸드드립 — 집에서 맛 살리는 법", keywords: ["핸드드립 방법", "원두"], intent: "HowTo 정보" },
    ],
    winter: [
      { title: "겨울 따뜻한 라떼 — 우리가 데우는 우유 온도", keywords: ["겨울 라떼", "서촌 카페"], intent: "시즌 가이드" },
      { title: "겨울 원두 블렌드 — 진하고 단단한 한 잔", keywords: ["겨울 원두 추천", "스페셜티 원두"], intent: "산지 스토리" },
      { title: "서촌 작업 카페 — 콘센트·와이파이 자리", keywords: ["서촌 작업 카페", "서촌 카페"], intent: "지역 비교" },
    ],
  },
  dessert: {
    spring: [
      { title: "봄 딸기 디저트 — 제철 한 접시", keywords: ["봄 딸기 케이크", "성수동 디저트"], intent: "시즌 한정" },
      { title: "벚꽃 시즌 선물 디저트 — 포장 추천", keywords: ["봄 디저트 선물", "성수동 디저트"], intent: "선물 가이드" },
      { title: "비건 케이크 — 맛·알러지 비교", keywords: ["비건 케이크 서울", "성수동 디저트"], intent: "비교" },
    ],
    summer: [
      { title: "여름 빙수 — 제철 과일로 올린 한 그릇", keywords: ["여름 빙수", "성수동 디저트"], intent: "시즌 한정" },
      { title: "수박 케이크 — 농장 직거래 한 통", keywords: ["수박 케이크", "성수 디저트"], intent: "시즌 한정" },
      { title: "여름 디저트 가이드 — 시원함·당도로 고르기", keywords: ["여름 디저트 추천"], intent: "시즌 가이드" },
    ],
    autumn: [
      { title: "가을 밤·단호박 디저트 — 제철 한 접시", keywords: ["가을 디저트", "밤 케이크"], intent: "시즌 한정" },
      { title: "마롱·고구마 라떼와 어울리는 구움과자", keywords: ["가을 구움과자", "성수동 디저트"], intent: "페어링" },
      { title: "비건 케이크 — 맛·알러지 비교", keywords: ["비건 케이크 서울", "성수동 디저트"], intent: "비교" },
    ],
    winter: [
      { title: "겨울 따뜻한 디저트 — 데워 먹는 한 접시", keywords: ["겨울 디저트", "성수동 디저트"], intent: "시즌 한정" },
      { title: "연말 선물 케이크 — 포장·예약 가이드", keywords: ["연말 케이크 예약", "성수동 디저트"], intent: "선물 가이드" },
      { title: "비건 케이크 — 맛·알러지 비교", keywords: ["비건 케이크 서울", "성수동 디저트"], intent: "비교" },
    ],
  },
  stay: {
    spring: [
      { title: "봄꽃 산책 코스 — 도보 10분 동선", keywords: ["북촌 산책 코스", "북촌 한옥스테이"], intent: "동네 가이드" },
      { title: "봄나들이 한옥 1박 — 마당에 햇살 드는 방", keywords: ["봄 한옥스테이", "서울 전통 숙소"], intent: "시즌 가이드" },
      { title: "객실 비교 — 마루·창호·온돌 디테일", keywords: ["서울 전통 숙소"], intent: "객실 비교" },
    ],
    summer: [
      { title: "여름 휴가 한옥 1박 — 더위 피하는 마루·바람길", keywords: ["여름 한옥스테이", "여름 휴가 숙소"], intent: "시즌 가이드" },
      { title: "장마철 빗소리 한옥 1박 — 마루에서 듣는 비", keywords: ["장마 감성 스테이", "북촌 한옥스테이"], intent: "시즌 가이드" },
      { title: "객실 비교 — 마루·창호·온돌 디테일", keywords: ["서울 전통 숙소"], intent: "객실 비교" },
    ],
    autumn: [
      { title: "단풍 든 한옥 마당 — 가을빛 1박", keywords: ["가을 한옥스테이", "북촌 단풍"], intent: "시즌 가이드" },
      { title: "북촌 가을 산책 코스 — 도보 10분 동선", keywords: ["북촌 산책 코스", "북촌 한옥스테이"], intent: "동네 가이드" },
      { title: "객실 비교 — 마루·창호·온돌 디테일", keywords: ["서울 전통 숙소"], intent: "객실 비교" },
    ],
    winter: [
      { title: "온돌 데운 겨울 한옥 1박 — 따뜻한 방 고르기", keywords: ["겨울 한옥스테이", "온돌 숙소"], intent: "시즌 가이드" },
      { title: "연말 한옥 1박 — 조용히 보내는 마무리", keywords: ["연말 숙소", "북촌 한옥스테이"], intent: "시즌 가이드" },
      { title: "객실 비교 — 마루·창호·온돌 디테일", keywords: ["서울 전통 숙소"], intent: "객실 비교" },
    ],
  },
  beauty: {
    spring: [
      { title: "봄 환절기 두피·헤어 케어 루틴", keywords: ["봄 헤어 관리", "환절기 두피 케어"], intent: "시즌 HowTo" },
      { title: "봄 컬러 — 톤 매칭 가이드", keywords: ["봄 헤어 컬러", "강남 헤어"], intent: "트렌드" },
      { title: "데이트 헤어 — 우리가 픽한 스타일", keywords: ["데이트 헤어", "강남 미용실"], intent: "스타일 가이드" },
    ],
    summer: [
      { title: "장마철 헤어 케어 루틴 — 결 살리는 단계", keywords: ["장마철 헤어 관리", "결 살리는 케어"], intent: "시즌 HowTo" },
      { title: "여름 두피 케어 — 땀·열에 지친 두피 식히기", keywords: ["여름 두피 케어", "강남 헤어"], intent: "시즌 HowTo" },
      { title: "여름 컬러 — 톤 매칭 가이드", keywords: ["여름 헤어 컬러", "강남 헤어"], intent: "트렌드" },
    ],
    autumn: [
      { title: "가을 환절기 빠지는 머리 — 두피 케어 루틴", keywords: ["가을 탈모 관리", "환절기 두피 케어"], intent: "시즌 HowTo" },
      { title: "가을 컬러 — 차분한 톤 매칭 가이드", keywords: ["가을 헤어 컬러", "강남 헤어"], intent: "트렌드" },
      { title: "데이트 헤어 — 우리가 픽한 스타일", keywords: ["데이트 헤어", "강남 미용실"], intent: "스타일 가이드" },
    ],
    winter: [
      { title: "건조한 겨울 두피·헤어 케어 루틴", keywords: ["겨울 두피 케어", "건조 헤어 관리"], intent: "시즌 HowTo" },
      { title: "겨울 컬러 — 깊은 톤 매칭 가이드", keywords: ["겨울 헤어 컬러", "강남 헤어"], intent: "트렌드" },
      { title: "연말 모임 헤어 — 우리가 픽한 스타일", keywords: ["연말 헤어", "강남 미용실"], intent: "스타일 가이드" },
    ],
  },
  local: {
    spring: [
      { title: "봄 룩 — 컬러·실루엣·소재 제안", keywords: ["봄 룩 코디", "컨템포러리 패션"], intent: "스타일 가이드" },
      { title: "Wool × Linen — 우리가 선택한 한 mill", keywords: ["wool linen 블렌드"], intent: "원단 스토리" },
      { title: "한국 컨템포러리 — 소재·핏으로 고르기", keywords: ["한국 디자이너 브랜드"], intent: "브랜드 비교" },
    ],
    summer: [
      { title: "여름 룩 — 린넨·통기성 소재 제안", keywords: ["여름 룩 코디", "린넨 셔츠"], intent: "스타일 가이드" },
      { title: "땀에 강한 여름 원단 — 우리가 고른 소재", keywords: ["여름 원단", "컨템포러리 패션"], intent: "원단 스토리" },
      { title: "한국 컨템포러리 — 소재·핏으로 고르기", keywords: ["한국 디자이너 브랜드"], intent: "브랜드 비교" },
    ],
    autumn: [
      { title: "가을 레이어드 — 컬러·실루엣 제안", keywords: ["가을 룩 코디", "레이어드 코디"], intent: "스타일 가이드" },
      { title: "Wool × Linen — 우리가 선택한 한 mill", keywords: ["wool linen 블렌드"], intent: "원단 스토리" },
      { title: "한국 컨템포러리 — 소재·핏으로 고르기", keywords: ["한국 디자이너 브랜드"], intent: "브랜드 비교" },
    ],
    winter: [
      { title: "겨울 아우터 — 보온·실루엣으로 고르기", keywords: ["겨울 아우터", "코트 추천"], intent: "스타일 가이드" },
      { title: "겨울 니트 소재 — 우리가 선택한 원사", keywords: ["겨울 니트", "원사 스토리"], intent: "원단 스토리" },
      { title: "한국 컨템포러리 — 소재·핏으로 고르기", keywords: ["한국 디자이너 브랜드"], intent: "브랜드 비교" },
    ],
  },
};
```
  </action>
  <verify>
    <automated>cd briq-app && ./node_modules/.bin/tsc --noEmit -p tsconfig.json && grep -n "SEASONAL_TOPICS" components/blog/BlogScreen.tsx | head -1</automated>
  </verify>
  <done>tsc 0 에러. TOPIC_PRESETS 삭제됨(파일 내 잔존 참조 0). SEASONAL_TOPICS 6업종×4시즌 존재, 각 ≥2개. stay summer 에 "어버이날"/"5월" 없음.</done>
</task>

<task type="auto">
  <name>Task 3: BlogScreen — presets useMemo 시즌 연결 + 시즌 힌트 + 가드 + 검증</name>
  <files>briq-app/components/blog/BlogScreen.tsx</files>
  <action>
1. `BlogScreen()` 컴포넌트 본문에서 brand 구조분해 직후, presets 위에 시즌 컨텍스트를 한 번 계산:
```typescript
  // 현재 KST 계절 — 추천 주제를 시기에 맞게 자동 선택.
  const season = React.useMemo(() => getSeasonContext(), []);
```

2. 기존 presets useMemo(@139-145)를 시즌 인식으로 교체. localizeTopic 도시 치환은 유지, season.seasonKey 의존성 추가:
```typescript
  // 업종 × 현재 시즌 풀 선택 → 사장님 가게 도시로 추천 주제 자동 치환.
  const presets = React.useMemo(() => {
    const byIndustry = SEASONAL_TOPICS[brand.industry] ?? SEASONAL_TOPICS.restaurant;
    const base = byIndustry[season.seasonKey] ?? byIndustry.spring;
    return base.map((p) => ({ ...p, title: localizeTopic(p.title, brand.city) }));
  }, [brand.industry, brand.city, season.seasonKey]);
```

3. activePreset 범위 가드 — 시즌/브랜드로 presets 길이가 바뀌어도 안전하게. 기존 브랜드 전환 useEffect(@192-198)는 그대로 두되, topic 초기값/리셋이 presets[0] 에 의존하므로 추가 가드 useEffect 를 그 아래에 삽입:
```typescript
  // presets 가 바뀌어 activePreset 이 범위를 벗어나면 0 으로 보정.
  React.useEffect(() => {
    if (activePreset > presets.length - 1) {
      setActivePreset(0);
      setTopic(presets[0]?.title ?? "");
    }
  }, [presets, activePreset]);
```

4. "추천 주제" 헤더(@406-412)에 현재 시즌 힌트 한 줄 추가 — 과하지 않게, 기준 노출. 헤더 `<div>` 의 `<h3>...추천 주제</h3>` 와 Badge 사이/아래에 작은 메타 텍스트. 기존 디자인 결(절제)에 맞춰 헤더 블록을 아래로 교체:
```tsx
            <div className="flex items-center justify-between mb-3">
              <div className="min-w-0">
                <h3 className="text-sm font-semibold flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-violet-500" /> 추천 주제
                </h3>
                <div className="mt-0.5 text-[10.5px] text-zinc-400">
                  {season.monthLabel} · {season.seasonLabel} 기준
                </div>
              </div>
              <Badge tone="default">{brand.industryLabel}</Badge>
            </div>
```
  </action>
  <verify>
    <automated>cd briq-app && ./node_modules/.bin/tsc --noEmit -p tsconfig.json && ./node_modules/.bin/jiti -e "import('./lib/content/season.ts').then(m=>{const c=m.getSeasonContext(new Date(Date.UTC(2026,5,8,3,0,0)));if(c.seasonKey!=='summer'||c.monthLabel!=='6월')throw new Error('june fail '+JSON.stringify(c));console.log('OK june='+c.monthLabel+' '+c.seasonLabel)})"</automated>
  </verify>
  <done>
tsc 0 에러. 6월 주입 → summer/"6월"/"여름" 확인. presets 가 SEASONAL_TOPICS[industry][seasonKey] 에서 선택되고 localizeTopic 도시 치환 유지. "추천 주제" 옆 "6월 · 여름 기준" 힌트 노출. activePreset 범위 가드 동작. stay(종로구) 6월 추천에 "어버이날"/"5월" 부재, "여름 휴가"/"장마철" 존재.
  </done>
</task>

</tasks>

<verification>
1. 타입: `cd briq-app && ./node_modules/.bin/tsc --noEmit -p tsconfig.json` → 0 에러.
2. 시즌 함수 결정론(jiti 주입): 1/4/6/7/10/12월(UTC mid-day) → winter/spring/summer/summer/autumn/winter, monthLabel 정확.
3. 6월(현재) 출력: `getSeasonContext(2026-06-08)` → seasonKey=summer, monthLabel="6월", seasonLabel="여름".
4. 주제 풀 무결성(육안 또는 grep): SEASONAL_TOPICS 6업종×4시즌 전부 ≥2개. 신규 주제 title 에 가짜 수치(%/N배/별점) 없음.
5. stay summer 정합: "어버이날"·"5월" 부재, "여름 휴가"/"장마철 빗소리"/"바람길" 류 존재.
6. (선택) dev 서버(3000) `/blog` 헤드리스 스크린샷 — 현재(6월=여름) 추천 주제가 여름 결로 바뀌고 어버이날/5월 카드가 사라졌는지 육안. 헤더에 "6월 · 여름 기준" 표시.
7. 무손상: localizeTopic·도시 치환·SERP 분석·generate-blog 호출·발행(네이버 글쓰기) 로직 변경 없음. 워크트리 미사용.
</verification>

<success_criteria>
- [ ] lib/content/season.ts 존재 — getSeasonContext 순수·결정론, KST 직접 계산, now 주입 가능.
- [ ] SEASONAL_TOPICS 6업종×4시즌, 각 ≥2개, 사장님 구어 톤, 시기 표현은 해당 계절만.
- [ ] 신규 주제에 가짜 수치·통계 없음(CLAUDE.md 정직성).
- [ ] presets useMemo 가 현재 seasonKey 풀을 선택하고 도시 치환 유지(industry/city/seasonKey 의존성).
- [ ] activePreset 범위 가드로 시즌/브랜드 전환 시 안전.
- [ ] "추천 주제" 옆 "{N월} · {계절} 기준" 힌트 노출.
- [ ] tsc 0 에러, jiti 시즌 프로브 통과.
- [ ] 6월에 stay 추천에서 어버이날/5월 사라지고 여름 주제 노출.
</success_criteria>

<output>
After completion, create `.planning/quick/260608-cvk-seasonal-topics/260608-cvk-SUMMARY.md`
</output>
