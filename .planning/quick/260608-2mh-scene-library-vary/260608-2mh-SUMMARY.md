---
phase: quick-260608-2mh
plan: 01
subsystem: ai-gen
tags: [scene-library, model-scenes, seed-recommendation, deterministic]
dependency_graph:
  requires: []
  provides: [seed-based-scene-recommendation, expanded-scene-library]
  affects: [reels, shorts, ai-model-generator]
tech_stack:
  added: [FNV-1a hashSeed]
  patterns: [deterministic-hash, role-based-variant-selection]
key_files:
  created: []
  modified:
    - briq-app/lib/ai-gen/model-scenes.ts
    - briq-app/components/ai-gen/AiModelGenerator.tsx
    - briq-app/components/reels/ReelsScreen.tsx
    - briq-app/components/shorts/ShortsScreen.tsx
decisions:
  - "signatureMenu 미반영 씬(stay-product-detail, beauty-product-shelf)에 선택적 반영 추가 — probe 충족"
metrics:
  duration: "~25min"
  completed: "2026-06-08"
  tasks_completed: 3
  files_modified: 4
---

# Phase quick-260608-2mh Plan 01: 씬 라이브러리 역할별 변형 확장 + 시드 기반 추천 Summary

**One-liner:** 씬 라이브러리를 48개로 확장하고 FNV-1a hashSeed + brand.id 시드로 역할별 변형을 결정론적으로 추천, 기준 라벨 UI 추가.

## What Was Built

- `MODEL_SCENES` 23개 → 48개 (기존 23 무수정, 신규 25개 추가)
- `hashSeed(input: string): number` — FNV-1a 변형, 결정론, Math.random 미사용
- `getRecommendedScenes(industry, seed?: number)` — seed로 역할별 변형 결정론 선택, seed 생략 시 기존 호환
- `AiModelGenerator` — `seed?: string` prop, brand.id 우선 / 없으면 industry|menu|topic 합성
- 씬 픽커 헤더 추천 기준 라벨 (topic 유무로 '맞춤' / '역할별 추천 1컷' 분기)
- ReelsScreen, ShortsScreen — `seed={brand.id}` 전달

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| Task 1 | `aee7c5e` | 씬 라이브러리 역할별 변형 25개 추가 + hashSeed + seed 기반 getRecommendedScenes |
| Task 2 | `0f9a96f` | AiModelGenerator seed prop + hashSeed 연동 + 추천 기준 라벨 |
| Task 3 | `3590f2b` | 호출처 seed={brand.id} 전달 + stay/beauty signatureMenu 반영 픽스 |

## Verification

### tsc
All 3 tasks: `tsc --noEmit` → 0 errors.

### jiti Probe Output

```
scene count: 48

--- Two-seeds-differ example (restaurant) ---
  seed=0: [rest-chef-plating, rest-customer-cheers, rest-owner-greeting, rest-product-closeup]
  seed=1: [rest-staff-serving, rest-customer-eating, rest-owner-cooking, rest-overhead-table]
  seed=2: [rest-chef-plating, rest-customer-cheers, rest-owner-greeting, rest-product-closeup]
  seed=3: [rest-staff-serving, rest-customer-eating, rest-owner-cooking, rest-overhead-table]
  seed=4: [rest-chef-plating, rest-customer-cheers, rest-owner-greeting, rest-product-closeup]

PASS: all scene-library assertions
```

Two-seeds-differ (restaurant): seed=0 → `[rest-chef-plating, rest-customer-cheers, rest-owner-greeting, rest-product-closeup]` vs seed=1 → `[rest-staff-serving, rest-customer-eating, rest-owner-cooking, rest-overhead-table]` — 4/4 씬이 모두 다른 변형.

(seed가 2개 단위로 순환하는 것은 restaurant가 각 역할에 정확히 2가지 변형을 가져 `variants.length=2` → `seed % 2` 패턴. 실제 brand.id는 hashSeed를 거쳐 큰 정수가 되므로 분포가 균등하게 분산된다.)

### Criteria Label Text

- topic 없을 때: `· 업종·역할별 추천 1컷`
- topic 있을 때 (예: "여름 수박 이벤트"): `· '여름 수박 이벤트' 맞춤 (업종·역할별 1컷)`

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] stay/beauty signatureMenu probe 충족**
- **Found during:** Task 3 jiti probe
- **Issue:** stay와 beauty 업종에 signatureMenu를 인자로 받는 씬이 없어 probe assertion `signatureMenu 반영 씬 없음` 실패
- **Fix:** stay-product-detail, beauty-product-shelf의 `promptEN`을 `() =>` → `({ signatureMenu }) =>` 로 변경하여 선택적 반영
- **Files modified:** briq-app/lib/ai-gen/model-scenes.ts
- **Commit:** 3590f2b

**2. [Note] scene count 48 (plan 예상 49)**
- 기존 씬을 직접 세어보니 23개 (restaurant×4, cafe×4, dessert×4, stay×4, beauty×4, local×3). 신규 25개 추가 → 48개. Plan의 "기존 24개"는 오계산. probe의 `< 45` assertion은 통과.

## Known Stubs

None.

## Threat Flags

None — 변경된 파일은 모두 클라이언트 측 UI/라이브러리 코드이며 새로운 네트워크 엔드포인트, 인증 경로, 또는 외부 노출 파일 없음.

## Self-Check: PASSED

- `briq-app/lib/ai-gen/model-scenes.ts` — exists, 48 scenes, hashSeed exported, getRecommendedScenes(industry, seed?) exported
- `briq-app/components/ai-gen/AiModelGenerator.tsx` — seed prop added, criteria label rendered
- `briq-app/components/reels/ReelsScreen.tsx` — seed={brand.id} at line 1670
- `briq-app/components/shorts/ShortsScreen.tsx` — seed={brand.id} at line 390
- Commits aee7c5e, 0f9a96f, 3590f2b — all verified in git log
