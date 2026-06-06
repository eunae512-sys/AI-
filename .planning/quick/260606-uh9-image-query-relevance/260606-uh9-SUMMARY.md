---
phase: quick-260606-uh9
plan: "01"
subsystem: cardnews/image-query
tags: [cardnews, image-query, pexels, photo-relevance]
dependency_graph:
  requires: []
  provides: [imageQueryFor-role-modifiers, VALUE_COMPOSITIONS]
  affects: [briq-app/lib/cardnews/hook-generator.ts]
tech_stack:
  added: []
  patterns: [role-modifier-composition, variant-distribution]
key_files:
  modified:
    - briq-app/lib/cardnews/hook-generator.ts
  created:
    - briq-app/scripts/probe-image-query.mjs
decisions:
  - "VALUE_COMPOSITIONS const 배열(3구도)로 value 슬라이드 3·4·5 차별화"
  - "장소어(welcoming entrance, quiet corner)·모순어(candid vs no people) 제거"
  - "variant 기본값 0 — hook/problem/proof/cta 호출부 무손상 유지"
metrics:
  duration: "~12 min"
  completed: "2026-06-06"
  tasks_completed: 2
  files_changed: 2
---

# Phase quick-260606-uh9 Plan 01: imageQueryFor 피사체 구도어 교체 Summary

**One-liner:** imageQueryFor의 장소어/모순어 역할 모디파이어를 6업종 범용 피사체 구도어로 교체하고 VALUE_COMPOSITIONS 3구도 배열로 value 슬라이드 3·4·5 사진 반복을 제거.

## What Was Done

### Task 1: imageQueryFor 역할 모디파이어 교체 + value variant 추가

`briq-app/lib/cardnews/hook-generator.ts` 단일 파일 수정:

**EDIT 1 — VALUE_COMPOSITIONS 상수 + 시그니처 variant 추가**
```typescript
const VALUE_COMPOSITIONS = [
  "macro detail close up",
  "overhead flat lay",
  "side angle soft light",
] as const;

function imageQueryFor(role: SlideRole, ctx: Ctx, variant = 0): string {
```

**EDIT 2 — switch 역할 모디파이어 교체**
| role    | 이전 (장소어/모순어)              | 이후 (피사체 구도어)                     |
|---------|----------------------------------|------------------------------------------|
| problem | `quiet corner`                   | `moody side angle, soft shadow`          |
| value   | `detail close up` (3슬라이드 동일) | `VALUE_COMPOSITIONS[variant % 3]` (3구도 분배) |
| proof   | `intimate scene, candid`         | `styled still life`                      |
| cta     | `welcoming entrance`             | `styled flat lay`                        |
| hook    | `hero overhead composition`      | 변경 없음                                |

**EDIT 3 — value 호출부 3곳 variant 전달**
- slide 3: `imageQueryFor("value", ctx, 0)` → macro detail close up
- slide 4: `imageQueryFor("value", ctx, 1)` → overhead flat lay
- slide 5: `imageQueryFor("value", ctx, 2)` → side angle soft light

### Task 2: jiti 프로브 검증

`briq-app/scripts/probe-image-query.mjs` 작성 및 실행 — 6업종×3토픽 18조합 전부 PASS.

## Verification

### tsc
```
./node_modules/.bin/tsc --noEmit -p tsconfig.json  → exit 0 (출력 없음)
```

### jiti 프로브 출력 (핵심 발췌)

```
restaurant | 시즌 딸기 케이크          | PASS
restaurant | 여름 망고 빙수           | PASS
restaurant | 크리스마스 슈톨렌          | PASS
cafe       | 시즌 딸기 케이크          | PASS
cafe       | 여름 망고 빙수           | PASS
cafe       | 크리스마스 슈톨렌          | PASS
dessert    | 시즌 딸기 케이크          | PASS
  [SAMPLE dessert/딸기케이크 CTA  ] cake slice, korean dessert tablescape styled flat lay, warm golden hour light, cozy inviting, soft natural light, editorial magazine, shallow depth of field, film aesthetic, no people
  [SAMPLE dessert/딸기케이크 value1] cake slice, korean dessert tablescape macro detail close up, ...no people
  [SAMPLE dessert/딸기케이크 value2] cake slice, korean dessert tablescape overhead flat lay, ...no people
  [SAMPLE dessert/딸기케이크 value3] cake slice, korean dessert tablescape side angle soft light, ...no people
dessert    | 여름 망고 빙수           | PASS
dessert    | 크리스마스 슈톨렌          | PASS
beauty     | 시즌 딸기 케이크          | PASS
beauty     | 여름 망고 빙수           | PASS
beauty     | 크리스마스 슈톨렌          | PASS
stay       | 시즌 딸기 케이크          | PASS
stay       | 여름 망고 빙수           | PASS
stay       | 크리스마스 슈톨렌          | PASS
local      | 시즌 딸기 케이크          | PASS
local      | 여름 망고 빙수           | PASS
local      | 크리스마스 슈톨렌          | PASS

────────────────────────────────────────────
TOTAL: 18 combos — PASS 18 / FAIL 0
ALL ASSERTS PASS
```

**Assert 결과:**
- (a) 어떤 쿼리에도 'welcoming entrance' / 'quiet corner' / 'candid' 없음 — PASS
- (b) value 슬라이드 3·4·5 쿼리 3개 모두 서로 다름 (Set size = 3) — PASS
- (c) 음식 토픽 키워드(cake/mango/stollen)가 쿼리 앞 60자에 포함 — PASS
- (d) 모든 쿼리에 'no people' 포함 — PASS

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None.

## Future Note

추후 search-pexels 라우트의 top5 Math.random pick 을 deterministic pickIndex(seed, slideId) 로 바꾸면 결정성·슬라이드 간 사진 차별을 더 강화할 수 있음 (이번 범위 밖).

## Commits

- `a012676` fix(cardnews): imageQueryFor 역할 모디파이어를 피사체 구도어로 교체 + value 3구도 분배

## Self-Check: PASSED

- `briq-app/lib/cardnews/hook-generator.ts` — modified, committed
- `briq-app/scripts/probe-image-query.mjs` — created, committed
- Commit `a012676` verified in git log
