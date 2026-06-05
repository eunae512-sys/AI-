---
phase: quick-260606-2lx
plan: 01
subsystem: cardnews
tags: [layout, composition, auto-vary, determinism, seed]
dependency_graph:
  requires: []
  provides: [buildAutoSequence, auto-preset, paperTone-rewire]
  affects: [CardnewsCarousel, hook-generator, layout-preset]
tech_stack:
  added: []
  patterns: [seed-based-determinism, industry-bias, anchor-slots]
key_files:
  created: []
  modified:
    - briq-app/lib/brand/layout-preset.ts
    - briq-app/lib/cardnews/hook-generator.ts
    - briq-app/components/campaigns/CardnewsCarousel.tsx
decisions:
  - "buildAutoSequence 알고리즘: bias 2 + fill 2 비인접쌍(0,2)/(1,3)/(0,3) 패턴으로 3연속 구조적 불가능"
  - "DEFAULT_PRESET_ID = auto — 신규 캐러셀은 항상 자동 변주로 시작"
  - "paperTone: paper-split/overlay-card/type-hero 에만 부여, pillar-left/masthead 는 undefined"
metrics:
  duration: "~15 min"
  completed: "2026-06-06"
  tasks_completed: 3
  files_modified: 3
---

# Phase quick-260606-2lx Plan 01: Auto-Vary Layout Summary

## One-liner

업종 편향 + (brand, topic, kind) 시드 기반 결정론 변주로 카드뉴스 중간 슬라이드 4개의 컴포지션을 자동으로 다르게 짜는 `buildAutoSequence` 순수함수 도입 — 기존 5종 컴포지션 배치만 바꾸고 새 종류 추가 없음.

## What Was Built

### Task 1: layout-preset.ts — auto 프리셋 + buildAutoSequence

- `LayoutPresetId` 에 `"auto"` 추가
- `LAYOUT_PRESETS` 맨 앞에 "자동" 항목 삽입 (label: "자동", description: "브랜드·주제마다 결을 자동으로 바꿔 짭니다.")
- `DEFAULT_PRESET_ID` → `"auto"`
- `buildAutoSequence(industry, kind, seed)` 순수함수 export:
  - 앵커 [0]=masthead · [5]=type-hero · [6]=masthead 고정
  - 중간 [1..4]: 업종 편향 2슬롯 + 비인접쌍 비-bias fill 2슬롯
  - INDUSTRY_BIAS: restaurant/dessert/stay=paper-split, cafe/local=overlay-card, beauty=pillar-left
  - 결정론: seed ^ strHash(kind) 로 토픽/종류별 다른 배열, Math.random 없음

### Task 2: hook-generator.ts — buildAutoSequence 적용 + paperTone 재배선

- `import { buildAutoSequence }` 추가, `SlideComposition` 타입 import 추가
- 하드코딩 composition 7개 → `comps[0..6]` 치환
- `toneFor(idx, comp)` 헬퍼: paper-split/overlay-card/type-hero 에만 pickTone 반환, 나머지 undefined
- 기존 역할/순서/caption/subtext/imageQuery/ink/textAt/footer 모두 무손상

### Task 3: CardnewsCarousel.tsx — 기본 auto + 생성기 composition 존중

- presetId 기본 state `"editorial"` → `"auto"`
- effect 분기: `presetId === "auto"` 일 때 `base.map((s) => ({ ...s }))` — 생성기 composition 미덮어쓰기
- 수동 프리셋: 기존 `sequence[idx] ?? s.composition` 덮어쓰기 유지
- sameContent·이미지 보존 로직 무손상
- effect 의존성 배열에 `presetId` 명시 추가

## Commits

| Task | Commit | Message |
|------|--------|---------|
| 1    | d6eb626 | feat(cardnews): layout-preset auto 프리셋 + buildAutoSequence 순수함수 |
| 2    | 75c5e38 | feat(cardnews): hook-generator buildAutoSequence 적용 + paperTone 재배선 |
| 3    | 2c82cd1 | feat(cardnews): CardnewsCarousel 기본 auto + auto 시 생성기 composition 존중 |

## Verification

### TypeScript (tsc --noEmit)

모든 3개 태스크 후 0 에러 확인.

### jiti 프로브 — buildAutoSequence 결정론·편향·앵커·제약 단언

```
restaurant  신메뉴  -> masthead, paper-split, overlay-card, paper-split, pillar-left, type-hero, masthead
restaurant  단골   -> masthead, paper-split, pillar-left, overlay-card, paper-split, type-hero, masthead
restaurant  시즌   -> masthead, pillar-left, paper-split, overlay-card, paper-split, type-hero, masthead
restaurant  리뷰   -> masthead, pillar-left, paper-split, overlay-card, paper-split, type-hero, masthead
dessert     신메뉴  -> masthead, paper-split, overlay-card, paper-split, pillar-left, type-hero, masthead
dessert     단골   -> masthead, paper-split, pillar-left, overlay-card, paper-split, type-hero, masthead
dessert     시즌   -> masthead, pillar-left, paper-split, overlay-card, paper-split, type-hero, masthead
dessert     리뷰   -> masthead, pillar-left, paper-split, overlay-card, paper-split, type-hero, masthead
stay        신메뉴  -> masthead, paper-split, overlay-card, paper-split, pillar-left, type-hero, masthead
stay        단골   -> masthead, paper-split, pillar-left, overlay-card, paper-split, type-hero, masthead
stay        시즌   -> masthead, pillar-left, paper-split, overlay-card, paper-split, type-hero, masthead
stay        리뷰   -> masthead, pillar-left, paper-split, overlay-card, paper-split, type-hero, masthead
cafe        신메뉴  -> masthead, overlay-card, paper-split, overlay-card, pillar-left, type-hero, masthead
cafe        단골   -> masthead, overlay-card, pillar-left, paper-split, overlay-card, type-hero, masthead
cafe        시즌   -> masthead, pillar-left, overlay-card, paper-split, overlay-card, type-hero, masthead
cafe        리뷰   -> masthead, pillar-left, overlay-card, paper-split, overlay-card, type-hero, masthead
local       신메뉴  -> masthead, overlay-card, paper-split, overlay-card, pillar-left, type-hero, masthead
local       단골   -> masthead, overlay-card, pillar-left, paper-split, overlay-card, type-hero, masthead
local       시즌   -> masthead, pillar-left, overlay-card, paper-split, overlay-card, type-hero, masthead
local       리뷰   -> masthead, pillar-left, overlay-card, paper-split, overlay-card, type-hero, masthead
beauty      신메뉴  -> masthead, pillar-left, overlay-card, pillar-left, paper-split, type-hero, masthead
beauty      단골   -> masthead, pillar-left, paper-split, overlay-card, pillar-left, type-hero, masthead
beauty      시즌   -> masthead, paper-split, pillar-left, overlay-card, pillar-left, type-hero, masthead
beauty      리뷰   -> masthead, paper-split, pillar-left, overlay-card, pillar-left, type-hero, masthead
gen "봄나물 신메뉴" comps: masthead, pillar-left, paper-split, overlay-card, paper-split, type-hero, masthead
gen "단골 감사 이벤트" comps: masthead, pillar-left, paper-split, overlay-card, paper-split, type-hero, masthead

✅ ALL PASS
```

검증 항목:
- (a) 같은 브랜드 다른 토픽 = 중간 배열 다름 (restaurant 신메뉴 vs 단골 vs 시즌 다름)
- (b) 업종별 우세 컴포지션 중간 4슬롯 중 정확히 2회 등장 (restaurant=paper-split 2회, cafe=overlay-card 2회, beauty=pillar-left 2회)
- (c) 결정론: 같은 (industry, kind, SEED) → 같은 출력
- (d) 앵커 [0]=masthead, [5]=type-hero, [6]=masthead 고정 · 3연속 없음 · 중간 최소 2종
- paperTone: gen comps 에서 paper-split/overlay-card/type-hero 에만 톤 부여 확인

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None.

## Threat Flags

None — no new network endpoints, auth paths, or trust boundary changes.

## Self-Check: PASSED

- briq-app/lib/brand/layout-preset.ts: FOUND
- briq-app/lib/cardnews/hook-generator.ts: FOUND
- briq-app/components/campaigns/CardnewsCarousel.tsx: FOUND
- Commit d6eb626: FOUND
- Commit 75c5e38: FOUND
- Commit 2c82cd1: FOUND
