---
phase: quick-260607-w7f
plan: "01"
type: execute
subsystem: routing/navigation
tags: [route-cleanup, nav, IA, refactor]
dependency_graph:
  requires: []
  provides: [clean-IA, review-queue-visible, canonical-routes-only]
  affects: [nav, roadmap-strip, robots, reels, shorts, channels, settings, clients, dashboard, assistant-drawer]
tech_stack:
  added: []
  patterns: [git-rm-for-staged-deletions, next-build-to-refresh-types]
key_files:
  created: []
  modified:
    - briq-app/lib/nav.ts
    - briq-app/components/layout/RoadmapStrip.tsx
    - briq-app/components/ai-assistant/AssistantDrawer.tsx
    - briq-app/components/dashboard/Dashboard.tsx
    - briq-app/components/channels/ChannelsScreen.tsx
    - briq-app/components/settings/SettingsScreen.tsx
    - briq-app/app/(app)/clients/[id]/page.tsx
    - briq-app/components/shorts/ShortsScreen.tsx
    - briq-app/app/robots.ts
    - briq-app/components/reels/ReelsScreen.tsx
    - briq-app/lib/queue/publish-queue.ts
  deleted:
    - briq-app/app/(app)/analytics/page.tsx
    - briq-app/app/(app)/calendar/page.tsx
    - briq-app/app/(app)/pipeline/page.tsx
    - briq-app/app/(app)/schedule/page.tsx
    - briq-app/app/(app)/trends/page.tsx
    - briq-app/components/analytics/AnalyticsScreen.tsx
    - briq-app/components/calendar/CalendarScreen.tsx
    - briq-app/components/schedule/ScheduleScreen.tsx
    - briq-app/components/trends/TrendsScreen.tsx
decisions:
  - "RoadmapStrip STEP4/5 match 배열에서 삭제 라우트 제거, canonical 경로만 유지"
  - "robots.ts disallow 목록을 canonical 라우트 기준으로 재정비"
  - ".next/types/validator.ts 갱신을 위해 next build 실행 (tsc 단독으로 stale 타입 제거 불가)"
metrics:
  duration: "~15분"
  completed: "2026-06-08"
  tasks_completed: 4
  files_changed: 11
  files_deleted: 9
---

# Phase quick-260607-w7f Plan 01: Route Cleanup 1 Summary

**One-liner:** 5개 레거시/stub 라우트와 4개 orphan 컴포넌트를 삭제하고, 검수(/review-queue)를 메인 nav에 visible 승격, 모든 dangling 링크를 /scheduler·/insights로 재지정.

## Tasks Completed

| Task | Name | Commit |
|------|------|--------|
| 1 | nav.ts — 검수 visible 승격 + 5개 삭제 라우트 항목 제거 | 28d2a94 |
| 2 | RoadmapStrip + 링크 재지정 | 65e1a42 |
| 3 | 라우트·orphan 컴포넌트 삭제 | 320b6cb |
| 4 | 잔재 텍스트 정리 + tsc 검증 | 4750039 |

## Verification Results

### (a) tsc
```
cd briq-app && ./node_modules/.bin/tsc --noEmit -p tsconfig.json
# exit: 0
```

### (b) Dangling ref grep
```
cd briq-app && grep -rIn "/schedule\b\|/calendar\b\|/analytics\b\|/trends\b\|/pipeline\b" app components lib | grep -Ev "/scheduler|scheduled|/schedule-" | grep -E "href|push|from |import |hidden|match|disallow"
# exit: 1 (0 matches — CLEAN)
```

### (c) Route directory check
`ls app/(app)/` 확인 — analytics, calendar, pipeline, schedule, trends 5개 없음. scheduler, insights, discover, review-queue, clients 보존.

### (d) Dev server HTTP responses

| Route | Status |
|-------|--------|
| /scheduler | 200 |
| /insights | 200 |
| /discover | 200 |
| /review-queue | 200 |
| /dashboard | 200 |
| /campaigns | 200 |
| /schedule | 404 |
| /calendar | 404 |
| /analytics | 404 |
| /trends | 404 |
| /pipeline | 404 |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] .next/types/validator.ts stale 타입 참조**
- **Found during:** Task 4 tsc 검증
- **Issue:** tsc가 `.next/types/validator.ts`에서 삭제된 5개 라우트의 page.js 를 참조해 TS2307 오류 5개 발생. 이 파일은 `next build`/`next dev` 시 자동 재생성되는 generated 파일임.
- **Fix:** `next build` 실행하여 validator.ts 재생성 → tsc 재실행 0 오류 확인.
- **Files modified:** .next/types/validator.ts (generated, not tracked in git)
- **Commit:** 4750039 (tsc 검증 포함)

## Known Stubs

None — 이 플랜은 라우트 삭제·링크 재지정만 수행. UI 데이터 스텁 없음.

## Threat Flags

None — 라우트 삭제는 공격 표면을 줄임. 새로운 표면 추가 없음.

## Self-Check: PASSED

- nav.ts: ClipboardCheck import ✓, /review-queue visible ✓, 5개 삭제 항목 없음 ✓
- RoadmapStrip: STEP4 href=/scheduler ✓, STEP5 href=/insights ✓, match 배열 정리 ✓
- 5개 라우트 디렉터리 삭제 ✓ (ls 확인)
- 4개 orphan 컴포넌트 삭제 ✓
- dangling grep exit:1 (0 matches) ✓
- tsc exit:0 ✓
- curl canonical 6개 200 ✓, 삭제 5개 404 ✓
