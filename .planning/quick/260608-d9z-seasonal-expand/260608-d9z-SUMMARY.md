---
phase: quick-260608-d9z
plan: 01
subsystem: content/blog/cardnews/dashboard
tags: [season, refactor, shared-lib, bug-fix]
dependency_graph:
  requires: []
  provides: [SEASON-SHARE, CARDNEWS-SEASON, DASH-SEASON]
  affects: [blog, cardnews, dashboard]
tech_stack:
  added: [briq-app/lib/content/seasonal-topics.ts]
  patterns: [shared-lib extraction, season-aware useMemo]
key_files:
  created:
    - briq-app/lib/content/seasonal-topics.ts
  modified:
    - briq-app/components/blog/BlogScreen.tsx
    - briq-app/components/cardnews/CardnewsScreen.tsx
    - briq-app/components/dashboard/Dashboard.tsx
decisions:
  - "getSeasonalTopics 폴백을 ?? byIndustry.spring 으로 블로그와 동일하게 맞춰 회귀 0 보장"
  - "SeasonKey import 없이 Dashboard Record 키를 인라인 4개 고정으로 타입 안전 유지"
metrics:
  duration: ~15min
  completed: 2026-06-08
  tasks_completed: 3
  tasks_total: 3
  files_changed: 4
---

# Quick Task 260608-d9z: 시즌 인식 확장 + 공유 lib 추출 Summary

시즌 주제를 단일 소스(seasonal-topics.ts)로 통합하고, 카드뉴스 placeholder 월 매트릭스 버그 제거 + 대시보드 event 무브를 현재 KST 시즌 동적 반영으로 전환.

## Tasks Completed

| Task | Description | Commit |
|------|-------------|--------|
| 1 | SEASONAL_TOPICS 공유 lib 추출 + BlogScreen 전환(회귀 0) | b234259 |
| 2 | CardnewsScreen topicPlaceholder 버그 수정 + 시즌화 | 07b030c |
| 3 | Dashboard "이번 시즌 이벤트" 시즌 인식 | 49ecf40 |

## Verification Results

### tsc
```
TSC: 0 errors (전 태스크 공통)
```

### Probe (PROBE-OK)
- 6월(2026-06-15T03:00Z) → summer: stay 여름 주제 3개 정상
- 12월(2026-12-15T03:00Z) → winter: stay 겨울/연말 주제 3개 정상
- 6업종 × 4시즌 각 ≥2 개: 모두 통과
- stay summer 회귀: SEASONAL_TOPICS.stay.summer 원본 == getSeasonalTopics("stay","summer") 동일
- 가짜 수치(%·명·배·위·만명) 0건

### June 6월 Runtime Values
**CardnewsScreen topicPlaceholder (restaurant, June):**
```
예: 여름 보양 한 상 — 강남 제철 코스 · 냉(冷) 메뉴가 있는 한정식 — 더위 식히는 한 상 · 한정식 1인 가격대별 추천
```

**CardnewsScreen topicPlaceholder (stay, June):**
```
예: 여름 휴가 한옥 1박 — 더위 피하는 마루·바람길 · 장마철 빗소리 한옥 1박 — 마루에서 듣는 비 · 객실 비교 — 마루·창호·온돌 디테일
```

**Dashboard event title (June):** `여름 시즌 이벤트`

**Dashboard event desc (June):** `여름 제철·이벤트(여름 휴가·장마)를 광고티 없이 자연스럽게 안내.`

### Grep Checks
- `tableByIndustry` in CardnewsScreen: 0건 (버그 완전 제거)
- `getSeasonalTopicTitles` in CardnewsScreen: 2건
- `getSeasonContext` in Dashboard: 2건
- static `어버이날·여름 휴가·크리스마스` in Dashboard: 0건

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None.

## Threat Flags

None. Changes are pure frontend display logic (useMemo, placeholder text, static label rendering). No new network endpoints, auth paths, or data schema changes.

## Self-Check: PASSED
- briq-app/lib/content/seasonal-topics.ts: FOUND
- briq-app/components/blog/BlogScreen.tsx: modified (local SEASONAL_TOPICS removed)
- briq-app/components/cardnews/CardnewsScreen.tsx: modified (tableByIndustry removed)
- briq-app/components/dashboard/Dashboard.tsx: modified (getSeasonContext added)
- Commits b234259, 07b030c, 49ecf40: FOUND
- Probe script probe-d9z-1.mjs: DELETED (not committed)
