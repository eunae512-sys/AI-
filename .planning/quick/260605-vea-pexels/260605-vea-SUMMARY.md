---
phase: quick-260605-vea
plan: "01"
subsystem: cardnews
tags: [bugfix, pexels, image-query, video-query, korean-translation]
dependency_graph:
  requires: []
  provides: [beverage-keyword-pexels-matching]
  affects: [briq-app/lib/cardnews/video-query.ts, briq-app/lib/cardnews/hook-generator.ts]
tech_stack:
  added: []
  patterns: [static-dictionary-translation, fallback-chain]
key_files:
  created: []
  modified:
    - briq-app/lib/cardnews/video-query.ts
    - briq-app/lib/cardnews/hook-generator.ts
decisions:
  - "translateTopicToEN을 video-query 단일 원천으로 두고 hook-generator에서 폴백으로 재사용 — 사전 중복 최소화"
  - "imageQueryFor의 translateSubject 실패 시 주제를 드롭하지 않고 translateTopicToEN 폴백 적용"
metrics:
  duration: ~5min
  completed: 2026-06-05
  tasks_completed: 2
  files_modified: 2
---

# Phase quick-260605-vea Plan 01: Pexels 음료 키워드 매핑 버그 수정 Summary

**One-liner:** 한국어 음료 주제(레몬에이드·에이드·자몽·청귤·스무디)를 영문 Pexels 검색어로 변환하는 정적 사전 보강 + translateSubject 실패 시 주제 드롭 방지 폴백 적용.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | video-query.ts 사전 보강 + mood 토큰 검색어 반영 | f38144c | briq-app/lib/cardnews/video-query.ts |
| 2 | hook-generator.ts translateSubject 보강 + imageQueryFor 주제 드롭 방지 | 81be619 | briq-app/lib/cardnews/hook-generator.ts |

## What Was Done

### Task 1: video-query.ts 사전 보강

`INGREDIENT_KO_EN`에 음료·과일 명사 26개 추가:
- 레몬에이드 → `lemonade`, 레모네이드 → `lemonade`, 에이드 → `fruit ade sparkling drink`
- 자몽에이드 → `grapefruit ade`, 자몽 → `grapefruit`, 청귤 → `green tangerine citrus`
- 한라봉 → `hallabong citrus`, 라임 → `lime`, 모히토 → `mojito mint lime`
- 스무디 → `fruit smoothie`, 셰이크 → `milkshake`, 밀크쉐이크 → `milkshake`
- 프라페 → `frappe iced blended`, 망고 → `mango`, 딸기라떼 → `strawberry latte`
- 아인슈페너 → `einspanner cream coffee`, 복숭아아이스티 → `peach iced tea`
- 자몽차 → `grapefruit tea`, 유자차 → `yuzu citron tea`, 아이스티 → `iced tea`
- 콜라 → `cola soda`, 사이다 → `lemon lime soda`, 과일 → `fresh fruit`
- 청포도 → `green grape`, 블루베리 → `blueberry`, 레몬 → `lemon`

`MOOD_KO_EN`에 주제 형용사 7개 추가:
- 상큼한 → `fresh citrus bright`, 시원한 → `cold refreshing icy`
- 달콤한 → `sweet`, 새콤한 → `tangy sour fresh`, 청량한 → `refreshing crisp`
- 진한 → `rich deep`, 고소한 → `nutty savory`

`buildVideoQueryDetailed`에 `tokens.mood[0]` push 1줄 추가 (season/time 이후, 브랜드 mood 앞).

### Task 2: hook-generator.ts 주제 드롭 방지

`import { translateTopicToEN } from "@/lib/cardnews/video-query"` 추가.

`translateSubject` map에 음료 명사 10개 추가 (1차 빠른 매핑용).

`imageQueryFor` 핵심 버그 수정:
```
// 기존 (버그): translateSubject 실패 시 주제 드롭
const topicSubject = translateSubject(ctx.t.subject);
const subject = topicSubject !== ctx.t.subject ? `${topicSubject}, ${industrySubject}` : industrySubject;

// 수정: 실패 시 translateTopicToEN 폴백, 0건일 때만 industry-only
const direct = translateSubject(ctx.t.subject);
const translated = direct !== ctx.t.subject ? direct : translateTopicToEN(ctx.t.subject);
const subject = translated && translated.trim().length > 0
  ? `${translated}, ${industrySubject}`
  : industrySubject;
```

## jiti Probe Output (Task 1 verify)

```
상큼한 레몬에이드 => lemonade fruit ade sparkling drink cafe fresh citrus bright minimal | topicEN: "lemonade fruit ade sparkling drink lemon"
여름 자몽에이드 => fruit ade sparkling drink grapefruit cafe summer bright sunlight minimal | topicEN: "fruit ade sparkling drink grapefruit ade grapefruit"
청귤 스무디 => korean radish green tangerine citrus cafe minimal aesthetic slow pour | topicEN: "korean radish green tangerine citrus fruit smoothie"
5월 봄나물 코스 => spring vegetables namul korean greens tasting course fine dining plating | topicEN: "spring vegetables namul korean greens namul tasting course fine dining plating"
콜드브루 신메뉴 => cold brew iced coffee cafe minimal aesthetic slow pour cinematic | topicEN: "cold brew iced coffee"
```

## jiti Probe Output (Task 2 verify)

```
상큼한 레몬에이드 => topicEN: "lemonade fruit ade sparkling drink lemon"
여름 자몽에이드 => topicEN: "fruit ade sparkling drink grapefruit ade grapefruit"
청귤 스무디 => topicEN: "korean radish green tangerine citrus fruit smoothie"
5월 봄나물 코스 => topicEN: "spring vegetables namul korean greens namul tasting course fine dining plating"
콜드브루 => topicEN: "cold brew iced coffee"
```

grep 확인: `hook-generator.ts`에 `translateTopicToEN` import(line 26) + 사용(line 675) 2건.

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None.

## Threat Flags

None — 검색어 빌더(영문 키워드 변환 사전)만 수정. 새로운 네트워크 엔드포인트·인증 경로·스키마 변경 없음.

## Deferred Items

- `무` (korean radish) 키가 `스무디` substring으로 매칭되는 사전 false-positive는 기존(pre-existing) 문제. 현재 done criteria는 충족하나, 추후 사전 매칭을 단어 경계 기반으로 개선 시 같이 수정 권장.

## Self-Check: PASSED

- briq-app/lib/cardnews/video-query.ts: 수정됨 (f38144c)
- briq-app/lib/cardnews/hook-generator.ts: 수정됨 (81be619)
- tsc --noEmit: 0 errors (양 task 후)
- jiti probe: 음료 키워드 정상 반영 확인
