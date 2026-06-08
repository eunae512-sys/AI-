---
phase: quick-260608-s9k
plan: 01
subsystem: campaigns / cardnews media
tags: [cardnews, pexels, dedup, image-assignment]
requires:
  - /api/search-pexels (returnCandidates 후보 풀)
provides:
  - 카드뉴스 7장 슬라이드 간 사진 중복 0건 (후보 풀 충분 시)
  - search-pexels 실 Pexels 경로 slideId 결정적 픽
affects:
  - briq-app/components/campaigns/CardnewsCarousel.tsx
  - briq-app/app/api/search-pexels/route.ts
tech-stack:
  added: []
  patterns:
    - "2-pass distinct 배정 (병렬 후보 수집 → used Set 단일 동기 패스)"
key-files:
  created: []
  modified:
    - briq-app/components/campaigns/CardnewsCarousel.tsx
    - briq-app/app/api/search-pexels/route.ts
decisions:
  - "B(릴스 영상)는 무변경 스킵 — 단일 표시 surface라 중복 문제 부재, 초기 쿼리가 이미 토픽 반영"
metrics:
  duration: ~25m
  completed: 2026-06-08
requirements:
  - MEDIA-DEDUP-01
---

# Phase quick-260608-s9k Plan 01: 카드뉴스/릴스 미디어 중복 제거 Summary

카드뉴스 캐러셀 7장이 같은 명사 subject(Pexels가 꼬리 modifier 무시 → 동일 풀)일 때도 서로 다른 사진을 표시하도록, 클라이언트에서 후보 풀을 병렬 수집한 뒤 used Set으로 distinct 배정하는 2-pass 로직으로 교체하고, 서버 단일 픽에는 slideId 결정적 오프셋을 방어선으로 추가했다.

## What Changed

### A1 — CardnewsCarousel.tsx 이미지 로드 useEffect 2-pass 재작성
- **1차(병렬):** 각 슬라이드마다 `/api/search-pexels`를 `returnCandidates:true, candidateCount:9, perPage:30`로 호출해 후보 url 배열(`data.candidates.map(c=>c.url).filter(Boolean)`, 없으면 `[data.image]`)을 모아 `pools: string[][]` 구성.
- **2차(단일 동기 패스):** `used` Set 유지. 슬라이드 순서대로 자기 풀에서 `used`에 없는 첫 url → 없으면 전역 풀(`pools.flat()`)에서 `used`에 없는 첫 url → 픽 시 `used.add`.
- **state 반영:** 한 번에 `setSlides`(race 방지). 업로드 cover 보존 가드 유지(`cover && !cover.startsWith("http")` → 건너뜀). 배정 실패/빈 풀 슬라이드는 기존 cover 유지. `cancelled` cleanup·의존성 배열 `[slideContentKey, industry, brandId]`·eslint-disable 주석 모두 유지.

### A2 — search-pexels route 실 Pexels 경로 결정적 픽 (방어)
- 라인 220 부근: `pickIndex` 미지정이고 `slideId`가 유효 정수(number 또는 정수 문자열)면, top-N 풀에서 `((slideId-1) % topN.length + topN.length) % topN.length` 결정적 오프셋으로 픽. `slideId`·`pickIndex` 둘 다 없을 때만 기존 `Math.random()` 픽 유지(다양성).
- 기존 `pickIndex` 동작·`candidates` 반환은 불변.

### B — ReelsPreview (보조) : 무변경 스킵
- **사유:** 릴스는 단일 영상 표시 surface라 카드뉴스 같은 "슬라이드 간 중복" 문제가 구조적으로 없다. 초기 페치(`ReelsPreview.tsx:94`)는 이미 `buildVideoQuery({ industry, title, campaignHeadline, signatureMenu, mood })`로 캠페인 헤드라인/타이틀을 반영하고 있고, "다른 컷" 재생성은 `excludeIds(seenIdsRef)`로 이미 다양성을 보장한다. `search-pexels-video`에 slideId/seed 분산을 넣는 것은 단일 표시 대비 위험 대비 효익이 낮아(플랜의 "위험하면 스킵" 가이드) 변경하지 않았다.

## Verification Results

### 1. tsc --noEmit
```
cd briq-app && ./node_modules/.bin/tsc --noEmit -p tsconfig.json
EXIT: 0  (출력 없음 — 통과)
```

### 2. distinctness 체크 (라이브 API, /tmp 임시 probe 실행 후 삭제)
worst-case(7장 모두 동일 noun subject `korean dessert tablescape` + 꼬리 구도어만 상이)로 클라이언트 2-pass를 라이브 `/api/search-pexels`(실 Pexels 경로, photoId 숫자 확인)에 그대로 재현:
```
pool sizes: 9, 9, 9, 9, 9, 9, 9
7 assigned covers:
  slide 1: pexels-photo-23355671.jpeg
  slide 2: pexels-photo-4618561.jpeg
  slide 3: pexels-photo-31297773.jpeg
  slide 4: pexels-photo-23355682.jpeg
  slide 5: pexels-photo-11785649.jpeg
  slide 6: pexels-photo-34801166.jpeg
  slide 7: pexels-photo-10295077.jpeg

assigned: 7/7, distinct: 7, duplicates: 0
OLD (naive top-pick) distinct: 6/7 -> duplicates: 1
```
→ 신규 2-pass: **중복 0건**. 동일 풀 OLD 방식(슬라이드별 독립 top-pick)은 중복 1건 발생 → 회귀 대비 개선 확인. 임시 probe(`/tmp/dedup-probe.mjs`)는 검증 후 삭제.

### 3. 업로드 cover(data URL) 보존 회귀
2차 패스 state 반영에서 `existing.cover && !existing.cover.startsWith("http")`면 `continue`로 건너뛰어 업로드 data URL 보존 — 기존 가드 동작 유지(로직 보존).

### 4. 디자인 토큰/철칙
이번 변경은 데이터 로직(이미지 배정·서버 픽)만, UI 토큰/마크업 무변경 → CLAUDE.md 디자인 토큰·철칙 위반 없음.

## Deviations from Plan

None — 플랜대로 실행. A(A1+A2)는 단일 사진-dedup 논리 단위라 한 커밋으로 묶음(플랜 "A·B 분리" 권장 충족, A 내부는 하나의 수정). B는 플랜이 허용한 "무변경 스킵"으로 처리.

## Commits

- `3d613e0` fix(campaigns): 카드뉴스 슬라이드 간 사진 중복 제거 — 후보 풀 distinct 배정 (A1 + A2)

## Self-Check

- briq-app/components/campaigns/CardnewsCarousel.tsx — modified (FOUND)
- briq-app/app/api/search-pexels/route.ts — modified (FOUND)
- commit 3d613e0 — FOUND

## Self-Check: PASSED
