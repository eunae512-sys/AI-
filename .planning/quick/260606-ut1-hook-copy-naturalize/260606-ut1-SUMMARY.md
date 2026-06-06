---
phase: quick-260606-ut1
plan: "01"
subsystem: cardnews/copy
tags: [hook-copy, copy-quality, honesty, korean-tone]
dependency_graph:
  requires: []
  provides: [clean-hook-copy]
  affects: [cardnews-slide-1-headline]
tech_stack:
  added: []
  patterns: [korean-copywriting, honest-metrics]
key_files:
  modified:
    - briq-app/lib/cardnews/hook-generator.ts
    - briq-app/lib/cardnews/hook-patterns.ts
decisions:
  - "가짜 수치(+2.4배, 1년에 60일, 저장 상위 N곳)를 측정 근거 없는 단정 표현으로 보고 전면 제거"
  - "전보문체(자리 한정, 빠르게)를 사장님 구어체(자리 미리 잡아두시면 좋아요)로 교체"
  - "numeric[0] fallback '60'은 토픽 숫자 없을 때 임의 발사되는 가짜 수치이므로 희소성 표현으로 대체"
metrics:
  duration: "~5min"
  completed: "2026-06-06"
  tasks_completed: 2
  files_modified: 2
---

# Quick Task 260606-ut1: Hook Copy Naturalize — Summary

**One-liner:** 카드뉴스 HOOK 표제 5라인에서 가짜 수치·중복 시즌어·전보문체를 사장님 구어체로 교체하여 CLAUDE.md 정직성·카피 톤 철칙 준수.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | hook-generator.ts 가짜수치·중복·전보문체 4라인 리라이트 | 8be0438 | hook-generator.ts |
| 2 | hook-patterns.ts numeric 패턴 가짜 기본 숫자 "60" 제거 | 8be0438 | hook-patterns.ts |

## Changes Applied (5 exact replacements)

### hook-generator.ts

**[1] HOOK_NEW_MENU line 263 — "1년에 60일" 제거**
- Old: `` `1년에 60일,\n그 60일이 시작됐습니다. ${c.t.subject || c.v.signature}.` ``
- New: `` `제철에만 잠깐 나오는,\n${c.t.subject || c.v.signature}.` ``

**[2] HOOK_SEASON line 283 — 시즌어 중복 + 전보문체 "자리 한정, 빠르게" 제거**
- Old: `` `${c.t.timeWord ?? "이번 시즌"} 한 번뿐인 ${c.t.subject || c.v.unit}.\n자리 ${c.t.limitWord ?? "한정"}, 빠르게.` ``
- New: `` `지금 아니면 다음 시즌인 ${c.t.subject || c.v.unit},\n자리 미리 잡아두시면 좋아요.` ``

**[3] HOOK_SEASON line 286 — "+2.4배" 가짜 통계 제거**
- Old: `` `${c.t.timeWord ?? "어버이날"} 직전 주\n예약 평소 대비 +2.4배. 미리 잡으세요.` ``
- New: `` `${c.t.timeWord ?? "어버이날"} 가까워지면\n예약이 일찍 차요. 미리 잡아두세요.` ``

**[4] HOOK_TREND line 327 — "저장 상위 N곳" 가짜 랭킹 제거**
- Old: `` `${c.v.city} ${c.v.catShort} 저장 상위 ${c.t.number ?? "3"}곳,\n오늘 알려드립니다.` ``
- New: `` `${c.v.city}에서 ${c.v.catShort} 찾으실 때\n참고하기 좋은 곳, 오늘 정리했어요.` ``

### hook-patterns.ts

**[5] numeric[0] — `c.t.number ?? "60"` fallback 제거**
- Old: `` `1년에 ${c.t.number ?? "60"}일,\n그 ${c.t.number ?? "60"}일이 시작됐습니다.` ``
- New: `` `1년 중 잠깐 나오는,\n${c.t.subject || c.v.signature}.` ``

## Verification Results

### tsc --noEmit
```
(no output = 0 errors)
```

### jiti Probe — 42 combinations (6 brands × 7 kinds)
```
=== ASSERT RESULT ===
Total combinations tested: 42
Failures: 0
OK: 가짜수치·중복시즌어·전보문체 부재 — 모든 후크 정상
```

### Sample New Hooks (first 8)
| Brand | Kind | Hook |
|-------|------|------|
| miokdang | 신메뉴 | "강남 한정식 100곳 중, / 봄나물 코스를 이렇게 하는 곳은 1곳." |
| miokdang | 시즌 | "비싸 보여 망설였다는 분도 / 결국 다시 찾는 수박 코스." |
| miokdang | 예약 | "1년에 딱 한 시즌, / 다시 돌아온 코스." |
| miokdang | 단골 | "단골만 아는 / 감사 메뉴, 이맘때에만 나와요." |
| miokdang | 리뷰 | "비싸 보여 망설였다는 분도 / 결국 다시 찾는 봄나물." |
| miokdang | 트렌드 | "한정식 동향, / 어디서 제대로 받을지 고민이셨다면." |
| miokdang | 이벤트 | "5월, 선착순 10분. / 5월까지만 받아요." |
| roastery-1985 | 신메뉴 | "비싸 보여 망설였다는 분도 / 결국 다시 찾는 콜드브루." |

## Preserved (수정 금지 확인)

- line 259 "100곳 중 ... 1곳" — 관용 수사, 보존 확인
- line 337 HOOK_EVENT "선착순 N분" — 정당한 한정 안내, 보존 확인
- hook-patterns.ts numeric[1] "100곳 중 ... 한 곳" — 보존 확인
- hook-patterns.ts numeric[2] "1년에 딱 한 시즌" — 단정 배수 없는 정당 표현, 보존 확인

## Deviations from Plan

None — plan executed exactly as written. All 5 old_string → new_string replacements applied verbatim.

## Self-Check: PASSED

- [x] briq-app/lib/cardnews/hook-generator.ts modified (4 replacements)
- [x] briq-app/lib/cardnews/hook-patterns.ts modified (1 replacement)
- [x] Commit 8be0438 exists
- [x] tsc 0 errors
- [x] jiti probe 42/42 pass, 0 failures
- [x] No banned phrases in any output
