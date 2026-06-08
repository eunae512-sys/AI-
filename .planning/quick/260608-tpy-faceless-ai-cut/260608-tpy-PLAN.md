---
phase: quick-260608-tpy
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - briq-app/components/ai-gen/AiModelGenerator.tsx
  - briq-app/components/shorts/ShortsScreen.tsx
  - briq-app/components/reels/ReelsScreen.tsx
autonomous: false
requirements:
  - FACELESS-CUT-01
  - BRAND-TOKENS-02
user_setup: []

must_haves:
  truths:
    - "AI 생성 컷에 식별 가능한 가짜 사람 얼굴이 들어가지 않는다 (portrait·lifestyle 프레임 제거, 음식·제품·매장·손길만)"
    - "성별/연령 컨트롤이 제거된다 (얼굴 없으니 무의미)"
    - "카피가 정직하다 — '사람을 그려드려요'류 가짜 인물 프레이밍 제거, '사람 없이 음식·공간·손길' 명시"
    - "CLAUDE.md 디자인 철칙 정합 — violet/sky/amber/emerald 다색·rounded-xl/2xl 제거 → 단일 SAGE 액센트·사각 헤어라인·솔리드 잉크 버튼"
    - "쇼츠·릴스 호스트의 탭/배지/문구도 'AI 출연자' → 'AI 컷'(제품·매장)으로 통일"
    - "기존 생성·워터마크·KFTC 라벨·onGenerated 콜백·발행 흐름 무손상 (scene.role/frame 기반 메타 유지)"
    - "tsc --noEmit 통과"
  artifacts:
    - path: "briq-app/components/ai-gen/AiModelGenerator.tsx"
      provides: "얼굴 없는 제품·매장·손길 컷 생성기 (faceless 필터 + 정직 카피 + 브랜드 토큰)"
      contains: "faceless"
  key_links:
    - from: "briq-app/components/shorts/ShortsScreen.tsx"
      to: "AiModelGenerator"
      via: "sourceMode ai-model 탭에서 임베드, 탭 라벨 'AI 컷'"
      pattern: "AiModelGenerator"
---

<objective>
"AI 출연자 생성"(존재하지 않는 가짜 사람을 그려 홍보물에 넣는 기능)을 신뢰를 깎지 않는 **"AI 제품·매장 컷"(사람 얼굴 없음)** 으로 수정한다. 동네 가게의 무기는 진짜다움인데 가짜 인물+AI라벨은 "사진 다 가짜"라는 역효과를 낳음. 음식점·카페·디저트가 파는 건 사람이 아니라 음식·공간·손길 — 카드뉴스의 기존 allowPeople:false(사람 차단) 철학과도 정합시킨다.

Purpose: 가짜 얼굴 제거로 신뢰 회복 + 진짜 가치(촬영·모델비 없는 좋은 비주얼) 유지.
Output: faceless 씬만 노출하는 정직·온브랜드 생성기 + 호스트 라벨 통일.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@./CLAUDE.md
@.planning/STATE.md

<scene_facts>
lib/ai-gen/model-scenes.ts (변경 불필요 — 컴포넌트에서 필터):
- SceneRole = owner(13)|staff(11)|customer(12)|product(12)
- FrameStyle = portrait(7)|lifestyle(14)|overhead(6)|closeup(21)
- 얼굴/전신 인물이 나오는 건 portrait·lifestyle. 얼굴 없는(손·음식·제품·공간) 건 closeup·overhead 및 role=product.
- ROLE_LABELS/FRAME_LABELS export 존재. getScenesForIndustry(industry)·getRecommendedScenes(industry, seed)·hashSeed 존재.
</scene_facts>

<tasks>

## 1. AiModelGenerator.tsx — faceless 재구성 (핵심)

### 1a. faceless 필터
- `const FACELESS = (s: ModelScene) => s.frame === "closeup" || s.frame === "overhead" || s.role === "product";` 정의.
- `allScenes` = getScenesForIndustry(industry).filter(FACELESS).
- recommended = faceless 풀에서 seed 기반 4컷 선택(결정론). 기존 getRecommendedScenes는 owner/customer(얼굴) 포함하므로, 그 결과를 FACELESS로 필터한 뒤 부족분을 faceless 풀에서 backfill(중복 없이 최대 4). seed=seedNum 유지(브랜드/주제별 변주 유지).
- visibleScenes = showAll ? allScenes(faceless 전체) : recommended. showAll 토글 라벨/카운트는 faceless 기준 숫자로.
- 초기 scene/state가 faceless 첫 컷이 되도록 보장.

### 1b. 성별/연령 컨트롤 제거
- gender/age state·UI 블록(현 247-289 라인)·GENDER/AGE import 제거. promptEN 호출에서 gender/age 인자는 생략(옵셔널이라 안전) 또는 기본값. defaultGender/defaultAge 참조 제거.
- promptEN의 themeSubject(signatureMenu/topicEN) 반영 로직은 유지.

### 1c. 정직 카피 + 라벨
- 헤더 "AI 출연자 생성" → "AI 제품·매장 컷".
- h3 "직접 출연 대신 AI가 사람을 그려드려요" → "사람 없이 — 음식·공간·손길 컷을 그려드려요".
- sub "사장님·직원·손님 씬을 골라..." → "음식·제품·매장·손길 컷을 골라 한 장 생성 — 촬영·모델 비용 없음 · 약 {COST_KRW}원/장".
- 안내 박스 "모든 출연자는 AI 생성 인물..." → "사람 얼굴이 들어가지 않는 음식·공간·손길 컷만 생성합니다. 결과물 우하단에 법령(KFTC, 2025.12) 'AI 생성 콘텐츠' 라벨이 자동 부착됩니다."
- 생성/적용 토스트·버튼 문구의 "AI 출연자" → "AI 컷"(예: "AI 컷 만들기", "AI 컷 생성 완료", "AI 컷 사진 적용됨"). RefreshCw "다시 생성 (다른 컷)" 유지.
- 결과 미리보기 ShieldCheck 문구 "초상권 안전..."는 "사람 없음 · 촬영비 없음 · 약 {COST_KRW}원"로 정직화.

### 1d. 디자인 철칙 정합 (CLAUDE.md 위반 제거)
tofrom briq-app/lib/landing/tokens.ts 결을 따른다(SAGE=#4F5F4B 단일 액센트, INK, RULE 헤어라인, 라이트 전용):
- text-violet-*/border-violet-*/bg-violet-* → SAGE 또는 INK 계열. 강조(Sparkles 아이콘·활성 씬 카드 보더)는 SAGE.
- 활성 씬 카드: `border-violet-500 bg-violet-50` → SAGE 보더 + 아주 옅은 SAGE/PAPER hover. 비활성은 RULE(zinc-200) 헤어라인 유지.
- rounded-xl/rounded-2xl → 사각 또는 rounded-sm(헤어라인 사각 카드). 철칙 "rounded-xl/2xl 금지" 준수. min-h 등 레이아웃 보존.
- Badge tone="violet"/"sky"/"amber" → 중립(ink) 또는 SAGE. "AI 생성" 법령 라벨 배지는 중립 ink로(에러색 아님). amber 안내 박스 배경도 중립 PAPER+RULE 또는 옅은 SAGE 톤으로(다색 amber 제거).
- "이 사진 사용" 버튼 `bg-emerald-600 hover:bg-emerald-700` → 기본 Button(솔리드 INK). 철칙 #5.
- 한글 라벨에 italic/uppercase 금지(현 코드 영문 위주라 확인만).

## 2. ShortsScreen.tsx — 호스트 라벨/문구 통일
- Step1 h2 "1. 사진 한 장 — 직접 올리거나, AI가 그려드려요" 유지 가능하나 sub "사장님이 출연하기 어려우면 AI 출연자가 대신 — 모델·촬영 비용 없음" → "사람 없이 음식·공간·손길 컷을 AI로 — 모델·촬영 비용 없음".
- 소스 탭 "AI 출연자 생성" → "AI 컷 생성"(아이콘 UserCircle2 → ImageIcon/Sparkles 등 사람 아이콘 회피). Badge tone="violet" 신규 → 중립/SAGE.
- onGenerated 토스트 "AI 출연자 적용" → "AI 컷 적용". file.aiSceneTitle 흐름 유지.
- 미리보기 Badge tone="violet" "AI 출연자" → 중립 "AI 컷". 분석결과 문구 "AI 생성 출연자" → "AI 생성 컷".
- 업로드 dropzone의 text-violet/border-violet(dragOver) → SAGE. (철칙 정합 — 이 화면 violet 잔재 정리)
- h2 아이콘 text-violet-500 → SAGE 또는 INK.

## 3. ReelsScreen.tsx — 호스트 라벨/문구 통일
- "AI 출연자" 라벨 전반(237 주석 제외 UI 노출): 302 토스트 "AI 출연자 추가" → "AI 컷 추가", 443 "AI 출연자 만들기" 안내 → "AI 컷 만들기", 911 Eyebrow "추천 AI 출연자" → "추천 AI 컷", 1644 버튼 "AI 출연자" → "AI 컷", 917 "출연자 추가 →" → "AI 컷 추가 →".
- AiModelGenerator 임베드(1665) props 무손상.
- violet 잔재 있으면 SAGE/INK로 정합(범위 내).

</tasks>

<verification>
1. cd briq-app && ./node_modules/.bin/tsc --noEmit -p tsconfig.json 통과.
2. dev 서버(localhost:3000 실행 중) /shorts·/reels 헤드리스 Chrome 스크린샷 — AI 컷 탭/패널이 (a)얼굴 있는 씬(정면 인물/일상) 미노출 (b)성별/연령 컨트롤 없음 (c)violet/amber/emerald·rounded-xl 잔재 없이 SAGE·사각·잉크 (d)카피 정직 확인.
3. grep으로 컴포넌트 내 잔여 가짜인물 프레이밍("사람을 그려", "출연자"가 UI 노출 위치에) 0건, 잔여 violet/emerald className 0건(범위 파일).
4. 생성→이 컷 사용→Step2 톤 진입 흐름 무손상(스크린샷 또는 임시 디버그).
</verification>

<constraints>
- model-scenes.ts 씬 데이터·promptEN·COMMON_TAIL·watermark·KFTC 라벨·과금(COST_KRW)·generate-image route 무변경(컴포넌트 필터링만).
- onGenerated/ buildAiMeta/ file.aiGenerated 발행 흐름 무손상.
- 원자 커밋, 한국어 메시지(fix(ai-gen): ...). 컴포넌트와 호스트 라벨을 논리 단위로 분리 커밋 권장.
</constraints>
</context>
