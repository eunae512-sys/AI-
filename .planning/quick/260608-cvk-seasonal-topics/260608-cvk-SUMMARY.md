---
phase: quick-260608-cvk
plan: "01"
subsystem: blog
tags: [blog, season, topics, ux, kst]
dependency_graph:
  requires: []
  provides: [season-context, seasonal-topics]
  affects: [BlogScreen]
tech_stack:
  added: []
  patterns: [pure-function injection, useMemo season-aware selection]
key_files:
  created:
    - briq-app/lib/content/season.ts
  modified:
    - briq-app/components/blog/BlogScreen.tsx
decisions:
  - "Tasks 2 and 3 committed together (same file, tsc only passes when both applied)"
  - "SEASONAL_TOPICS placed inline in BlogScreen.tsx per plan artifact spec"
  - "localizeTopic comment mentioning 어버이날 kept as-is (doc comment, not topic data)"
metrics:
  duration: "~12 min"
  completed: "2026-06-08"
  tasks_completed: 3
  files_modified: 2
---

# Phase quick-260608-cvk Plan 01: Seasonal Blog Topics Summary

**One-liner:** KST season context pure function + 6×4 SEASONAL_TOPICS grid wired to BlogScreen presets useMemo, replacing static 어버이날/5월-hardcoded TOPIC_PRESETS.

## What Was Built

### Task 1 — `briq-app/lib/content/season.ts` (new)
Commit: `e18d247`

Pure deterministic function `getSeasonContext(now?: Date): SeasonContext` that:
- Calculates KST (UTC+9) month directly without date-fns
- Maps months 3-5→봄, 6-8→여름, 9-11→가을, 12/1/2→겨울
- Accepts optional `now` injection for testability
- Exports `SeasonKey` type and `SeasonContext` interface

### Tasks 2 + 3 — `briq-app/components/blog/BlogScreen.tsx` (modified)
Commit: `72ddb5d`

- Replaced `TOPIC_PRESETS` (6 industries, fixed topics) with `SEASONAL_TOPICS` (6 industries × 4 seasons, 3 topics each = 72 topics)
- Added `import { getSeasonContext, type SeasonKey }` from the new season module
- `season` useMemo: `getSeasonContext()` called once per mount, stable reference
- `presets` useMemo: selects `SEASONAL_TOPICS[brand.industry][season.seasonKey]`, falls back to `.spring`, then applies `localizeTopic` for city substitution — dependency array includes `season.seasonKey`
- Added `activePreset` range guard useEffect to prevent out-of-bounds when presets length changes on season/brand switch
- Added `{season.monthLabel} · {season.seasonLabel} 기준` hint under "추천 주제" header

## Jiti Probe Results

### All months → season mapping (deterministic KST)
```
month 1  -> winter / 1월   ✓
month 4  -> spring / 4월   ✓
month 6  -> summer / 6월   ✓
month 7  -> summer / 7월   ✓
month 10 -> autumn / 10월  ✓
month 12 -> winter / 12월  ✓
OK all months
```

### June (current) probe
```
OK june=6월 여름 (seasonKey=summer)
```

### Stay industry — June (summer) output
Topics served to stay industry in summer:
1. "여름 휴가 한옥 1박 — 더위 피하는 마루·바람길"
2. "장마철 빗소리 한옥 1박 — 마루에서 듣는 비"
3. "객실 비교 — 마루·창호·온돌 디테일"

Confirmed: "어버이날", "5월" — **absent**. Summer/장마/휴가 themes — **present**.

## Deviations from Plan

### Tasks 2 + 3 committed together (not separately)

**Found during:** Task 2 execution

**Issue:** After replacing `TOPIC_PRESETS` with `SEASONAL_TOPICS` (Task 2), the presets `useMemo` still referenced the deleted `TOPIC_PRESETS`, causing tsc errors (`Cannot find name 'TOPIC_PRESETS'`). The file cannot produce a clean compile until the `presets` useMemo is also updated (Task 3).

**Fix:** Applied Task 3 changes (presets useMemo + season guard + header hint) in the same edit session and committed both as a single commit with a combined message covering both tasks.

**Files modified:** `briq-app/components/blog/BlogScreen.tsx`
**Commit:** `72ddb5d`

## Integrity Checks

- SEASONAL_TOPICS: 6 industries × 4 seasons × 3 topics = 72 topics in data
- No fake stats (`%`, `N배`, `별점`) in any topic title
- `어버이날` — 1 occurrence total (in a code comment only, not in topic data)
- `5월` — 0 occurrences in topic data
- `localizeTopic`, `normalizeCityName`, `KOREAN_DISTRICTS` — unchanged
- Blog generate/SERP/publish logic — unchanged
- `TOPIC_PRESETS` — 0 references remain in file

## Self-Check: PASSED

- [x] `briq-app/lib/content/season.ts` exists with `getSeasonContext` export
- [x] `briq-app/components/blog/BlogScreen.tsx` has `SEASONAL_TOPICS` and no `TOPIC_PRESETS`
- [x] Commits `e18d247` and `72ddb5d` exist in git log
- [x] tsc 0 errors
- [x] Jiti probe: OK all months + OK june
