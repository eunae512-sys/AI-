---
phase: quick-260608-tpy
plan: 01
subsystem: ai-gen / short-form content
tags: [faceless, honesty, brand-tokens, ai-cut]
requires: [lib/ai-gen/model-scenes.ts (unchanged), lib/landing/tokens.ts]
provides: ["얼굴 없는 AI 제품·매장·손길 컷 생성기", "호스트(쇼츠·릴스) AI 컷 라벨 통일"]
affects: [ShortsScreen, ReelsScreen]
key-files:
  modified:
    - briq-app/components/ai-gen/AiModelGenerator.tsx
    - briq-app/components/shorts/ShortsScreen.tsx
    - briq-app/components/reels/ReelsScreen.tsx
decisions:
  - "FACELESS = frame closeup|overhead || role product — portrait·lifestyle(얼굴) 차단"
  - "추천: getRecommendedScenes(seed) → FACELESS 필터 → seed 회전 오프셋으로 backfill(중복없이 4컷)"
  - "Badge에 SAGE tone 없음 → AI 표면 배지는 중립 tone=default(ink), 강조 아이콘만 inline SAGE"
  - "model-scenes.ts 미변경(데이터·promptEN·fallbackQuery 보존) — 필터링은 컴포넌트에서만"
metrics:
  duration: ~45m
  completed: 2026-06-08
---

# Phase quick-260608-tpy: 얼굴 없는 AI 제품·매장 컷 전환 Summary

가짜 사람 얼굴을 그리던 "AI 출연자 생성"을 신뢰를 깎지 않는 **얼굴 없는 AI 제품·매장·손길 컷**으로 전환하고, off-brand UI(violet/sky/amber/emerald·rounded-xl)를 에디토리얼 토큰(단일 SAGE·사각 헤어라인·솔리드 잉크)으로 정합시켰다. 기능은 삭제하지 않고 변형.

## What changed

### 1. AiModelGenerator.tsx (핵심, commit a7f9a51)
- **FACELESS 필터** 추가: `s.frame === "closeup" || s.frame === "overhead" || s.role === "product"`. allScenes = `getScenesForIndustry(industry).filter(FACELESS)`.
- **recommended** = `getRecommendedScenes(industry, seedNum)`를 FACELESS로 필터 후, 부족분을 faceless 전체 풀에서 seed 회전 오프셋으로 중복 없이 backfill(최대 4컷). seedNum 변주 유지 → 브랜드/주제별 다른 추천.
- **성별/연령 제거**: gender/age state·selectScene 동기화·UI 블록·`ModelGender`/`ModelAge`/`GENDER_LABELS`/`AGE_LABELS`/`SceneRole` import 제거. promptEN은 `{ signatureMenu }`만 전달(gender/age 옵셔널). generate body에서 gender 인자 제거. themeSubject·topicEN 로직 유지.
- **정직 카피**: 헤더 "AI 제품·매장 컷", h3 "사람 없이 — 음식·공간·손길 컷을 그려드려요", sub "음식·제품·매장·손길 컷을 골라 한 장 생성 — 촬영·모델 비용 없음", 안내 박스 "사람 얼굴이 들어가지 않는 음식·공간·손길 컷만 생성합니다…KFTC 라벨 자동 부착", 토스트/버튼 "AI 컷 만들기/생성 완료/사진 적용됨", ShieldCheck "사람 없음 · 촬영비 없음".
- **디자인 토큰**: violet/sky/amber/emerald 전부 제거 → 강조는 inline `style={{color:SAGE}}`(Sparkles·Info·ChevronDown·전체보기·ShieldCheck), 활성 씬 카드 = SAGE 보더 + faint SAGE bg, 안내 박스 = 중립 PAPER+RULE, 배지 3종 tone="default"(ink), "이 사진 사용" = 기본 솔리드 Button, rounded-xl/2xl → rounded-sm.
- **무손상**: onGenerated/buildAiMeta(role/title/industry)/watermark/KFTC/COST_KRW/generate-image body(fallbackQuery·frame·slideId).

### 2. ShortsScreen.tsx (commit 7c0b980)
- 소스 탭 "AI 출연자 생성"→"AI 컷 생성", 아이콘 UserCircle2→ImageIcon(SAGE), 신규 배지 tone="default".
- Step1 h2 아이콘 violet→SAGE, sub "사람 없이 음식·공간·손길 컷을 AI로 — 모델·촬영 비용 없음".
- 업로드 dropzone dragOver violet→SAGE(inline) + rounded-2xl→rounded-sm.
- onGenerated 토스트 "AI 컷 적용", 미리보기 배지 "AI 컷"(violet→default), 분석 배지(업종/씬/무드) violet/amber/sky/rose→default, 분석 문구 "AI 생성 컷", 미리보기 카드 rounded-xl→rounded-sm.
- annotateForAi 주석·"AI 컷 먼저 만들어주세요" 토스트 정합. 미사용 UserCircle2 import 제거.

### 3. ReelsScreen.tsx (commit 7c0b980)
- "AI 출연자" 라벨 전반 → "AI 컷": 토스트(302), 추천 토스트(443), 추천 카드 Eyebrow "추천 AI 컷"(911), "AI 컷 추가 →"(917), 토글 버튼 "AI 컷"(1644), 주석들(237/367/427/880).
- 사람 아이콘 UserCircle2→ImageIcon 2곳(추천 카드·토글 버튼). import에서 UserCircle2→`Image as ImageIcon`.
- AiModelGenerator props(industry/signatureMenu/topic/seed/onGenerated/onClose/compact) 무손상. 이 범위는 이미 에디토리얼 토큰(SAGE/RULE/INK)이라 violet 잔재 없음.

## Verification

**1. tsc**: `cd briq-app && ./node_modules/.bin/tsc --noEmit -p tsconfig.json` → **통과(0 에러)** (컴포넌트 커밋 전·호스트 커밋 전 각 1회).

**2. 스크린샷(헤드리스 Chrome, localhost:3000)**:
- `/reels`: 토글 버튼 "AI 컷", 우측 "AI 영상 만들기" 패널, 추천 카드 "추천 AI 컷"(ImageIcon) 정상. 에디토리얼 토큰 일관(종이·잉크·SAGE·사각).
- `/shorts` AI 컷 탭(CDP로 탭 클릭 후 캡처 + 패널 클립 확대): **(a)** 추천 컷 4개 전부 faceless — "직원 — 음식 서빙(손·디테일 클로즈업)", "테이블 위에서(인물 없음)", "대표 메뉴 클로즈업(인물 없음)", "요리사 플레이팅(손·디테일 클로즈업)"; 정면 인물/일상 씬 0. **(b)** 성별/연령 컨트롤 없음. **(c)** 활성 카드 SAGE 보더+faint SAGE bg·사각, 안내 박스 중립 PAPER+RULE(SAGE info 아이콘), "AI 컷 만들기" 솔리드 잉크 — violet/amber/emerald·rounded-xl 잔재 없음. **(d)** 카피 정직("AI 제품·매장 컷"/"사람 없이 — 음식·공간·손길"/"사람 얼굴이 들어가지 않는…").
- 패널 텍스트 자동 assert: `성별|연령` 0건, `출연자|사람을 그려|정면 인물|자연스러운 일상` 0건, 정직 카피 문구 present.

**3. grep**: `grep -nE "violet|emerald|tone=\"sky\"|tone=\"amber\"|rounded-(xl|2xl)|출연자|사람을 그려"` on 세 파일:
- AiModelGenerator.tsx: 0 (단 1건은 전환 설명 **코드 주석** "구 AI 출연자" — 허용).
- ShortsScreen.tsx: AI-cut 표면 **0건**. 남은 매치는 모두 범위 밖(Step2 톤 picker·Step3 결과·하단 feature 카드·PlatformCard 미리보기·페이지 Hero eyebrow/preset 배너 244·285) — /shorts 전체 에디토리얼 미이관 잔재(아래 Deferred).
- ReelsScreen.tsx: 1건(1225)은 자막 편집 textarea의 rounded-2xl — AI-cut과 무관.

## Deviations from Plan

**[Rule 2 - 정합성] 사람 아이콘 → ImageIcon 교체(릴스 2곳·쇼츠 탭)**: 플랜은 쇼츠 탭 아이콘만 명시했으나, "얼굴 없는 컷" 기능에 사람 아이콘(UserCircle2)이 남으면 메시지가 모순되어 릴스 추천 카드·토글 버튼 아이콘도 ImageIcon으로 교체. 미사용된 UserCircle2 import도 정리(쇼츠 tsc/lint clean).

그 외 플랜대로 실행.

## Deferred Issues (범위 밖)

- **/shorts 전체 에디토리얼 미이관**: Hero eyebrow(244), preset 배너(285-293), Step2 톤 picker(457/473), Step3 결과/발행 카드(504/540/542/563/580-586/608), PlatformCard 미리보기(650/666/748/779/827)에 violet/emerald/rounded-xl 잔존. /reels(260605-i6k)처럼 /shorts 전면 에디토리얼 이관이 별도 필요. 이번 플랜은 AI-cut 표면만 정합(scope boundary 준수).
- **ReelsScreen 자막 편집 textarea(1225) rounded-2xl**: 키네틱 자막 편집 UI, AI-cut 무관.
- **startAiSceneForSuggested(reels)**: suggestedSceneRole이 owner/customer(얼굴 역할)일 수 있으나, 패널이 faceless만 노출하므로 사용자가 실제 얼굴 씬을 선택 불가 — 기능상 안전. role 데이터 자체는 미변경(model-scenes.ts 보존 제약).

## Known Stubs

None — 데모 토픽 라벨("5월 봄나물 코스")은 기존 데모 캠페인 표기로 이번 범위 밖.

## Self-Check: PASSED
- briq-app/components/ai-gen/AiModelGenerator.tsx — FOUND
- briq-app/components/shorts/ShortsScreen.tsx — FOUND
- briq-app/components/reels/ReelsScreen.tsx — FOUND
- commit a7f9a51 — FOUND
- commit 7c0b980 — FOUND
