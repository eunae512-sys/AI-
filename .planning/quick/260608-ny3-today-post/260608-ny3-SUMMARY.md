---
phase: quick-260608-ny3
plan: 01
subsystem: dashboard / today-post
tags: [honesty, real-data, tone-wrapper, deterministic, seasonal]
requires: [getSeasonalTopics, getSeasonContext, UserBrandData, useBrand.userBrands]
provides: [실주제 주입형 today post 생성기, 정직한 시즌-추정 라벨]
affects: [components/dashboard/Dashboard.tsx, components/dashboard/CoverStory, InstagramMobilePreview(무손상)]
tech-stack:
  added: []
  patterns: [resolveSubject 우선순위 도출, 톤=문체 래퍼 템플릿, deterministicPick datestamp 시드]
key-files:
  created:
    - briq-app/lib/dummy/today-shift.test.ts
  modified:
    - briq-app/lib/dummy/today-shift.ts
    - briq-app/components/dashboard/Dashboard.tsx
decisions:
  - "주제(subject)는 데이터에서, 톤은 그 subject를 감싸는 문체 템플릿으로 완전 분리"
  - "honesty 라벨은 today post에 한정 — Feature 영역 '시즌 추천 기반 예시' 캡션. AutomationStatus는 범위 밖으로 미터치(스코프 엄수)"
metrics:
  duration: ~10m
  completed: 2026-06-08
---

# Quick 260608-ny3: 오늘의 한 컷 실데이터 전환 + 정직성 라벨 Summary

대시보드 "오늘의 한 컷"(FEATURE/today post)의 주제를 업종×톤별 하드코딩 더미("오늘은 60개" 등 영구 고정 풀)에서 브랜드 실데이터(시그니처 메뉴 → 캠페인 → 현시즌 추천 주제)로 전환하고, 5개 톤을 같은 실주제를 감싸는 문체 래퍼로 재구성. 시그니처 메뉴 실입력이 없는 추정(시즌) 출처일 때 "시즌 추천 기반 예시" 라벨을 정직하게 노출.

## What changed

### Task 1 — `lib/dummy/today-shift.ts` (실주제 주입형 톤 래퍼)
- `resolveSubject(brand, realData, tone, now)` 신설: ① `realData.signatureMenu`(실입력, 여러 개면 datestamp 시드로 그날 1개) → `source="menu"`, ② `brand.campaign`(placeholder "· 첫 캠페인" 아닐 때 무드태그 떼고 실주제) → `source="campaign"`, ③ `getSeasonalTopics(brand.industry, undefined, now)`에서 deterministicPick 1개 → `source="season"`.
- 구 하드코딩 풀 5종(`editorialPool`/`minimalPool`/`warmShopPool`/`wittyPool`/`premiumPool`) + `copyPool` 전부 삭제. 대신 `editorialTemplate`/`minimalTemplate`/`warmShopTemplate`/`wittyTemplate`/`premiumTemplate`가 `ResolvedSubject`를 받아 같은 subject를 톤별 문체·라벨·titleFont로 감쌈. 고정 주제 문자열("60개"·"에티오피아"·"휘낭시에"·"히메컷" 등) 제거.
- `getShopHand` 4번째 옵셔널 인자 `realData?: { signatureMenu?; tagline? }` 추가 — 하위호환(기존 데모 호출 무손상).
- `reasoning`(Editor's Note)에 도출 출처 정직 1줄(시그니처 메뉴 / 캠페인 / 시즌 예시).
- 결정론 유지: `deterministicPick` 31-해시 + datestamp 시드, `Math.random` 없음. `TodayPost` 타입 형태 불변. `buildGreeting`/`buildWeek`/`buildReactions`/`moodGradient`/`pickPublishTime` 보존.

### Task 2 — `components/dashboard/Dashboard.tsx` (실데이터 배선 + 정직 라벨)
- `useBrand()`에서 `userBrands` 추가 구조분해 → `activeUser = userBrands.find(b => b.id === brand.id)` (멀티브랜드/대행사 정합, 단일 primary 사용 안 함).
- `getShopHand(brand, tone, new Date(), { signatureMenu: activeUser?.signatureMenu, tagline: activeUser?.tagline })`, useEffect deps에 `activeUser` 반영.
- `isEstimated = !(activeUser?.signatureMenu?.length)` → `CoverStory`에 `estimated` prop 전달. 추정 시 Feature 영역에 "시즌 추천 기반 예시" 캡션(zinc-muted=INK_MUTE 결, `word-break:keep-all`, tracking 0.01em, 새 색/이모지/그라데이션 없음).
- `InstagramMobilePreview`·`CoverStory`의 `shop` 형태 불변(props 변경 0). AutomationStatus는 범위 밖으로 미터치.

## Verification
- `tsc --noEmit -p tsconfig.json` → 0 에러 (양 태스크 후 각각 확인).
- `vitest run lib/dummy/today-shift.test.ts` → 8/8 green (실메뉴 5톤 반영·폴백 시즌 주제·결정론·가짜수치 0·톤별 문체 차이·하위호환·reasoning 출처).
- 스크린샷 육안 검증(Task 3, checkpoint:human-verify)은 오케스트레이터가 dev 서버 + CDP로 처리 예정 — 본 실행 범위 외.

## Deviations from Plan
None — plan executed as written. AutomationStatus의 "Auto operations · live" 토닝은 plan #4의 조건부("필요시")였고, today post honesty가 Feature 영역 라벨로 충족되어 스코프 엄수 차원에서 미적용(범위 밖 over-touch 회피).

## Commits
- `4749ed2` test(quick-260608-ny3): RED — 실주제 톤 래퍼 failing test
- `a483b07` feat(quick-260608-ny3): GREEN — today post 실데이터 전환
- `4023c20` feat(quick-260608-ny3): 활성 브랜드 실데이터 배선 + 정직 라벨

## Self-Check: PASSED
- briq-app/lib/dummy/today-shift.ts — FOUND
- briq-app/lib/dummy/today-shift.test.ts — FOUND
- briq-app/components/dashboard/Dashboard.tsx — FOUND
- commit 4749ed2 / a483b07 / 4023c20 — FOUND
