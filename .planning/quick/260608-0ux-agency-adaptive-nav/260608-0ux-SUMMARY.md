---
phase: quick-260608-0ux
plan: 01
subsystem: brand
tags: [multi-brand, brand-switcher, agency-nav, onboarding-append, localStorage]
dependency_graph:
  requires: []
  provides: [multi-brand-storage, brand-switcher-ui, agency-nav-gating, onboarding-append]
  affects: [briq-app/components/brand/BrandProvider.tsx, briq-app/components/layout/Sidebar.tsx, briq-app/lib/nav.ts]
tech_stack:
  added: [vitest, jsdom, @vitest/ui]
  patterns: [localStorage-multi-key-migration, event-driven-brand-sync, editorial-token-component]
key_files:
  created:
    - briq-app/lib/brand/user-brand.test.ts
    - briq-app/components/layout/BrandSwitcher.tsx
    - briq-app/vitest.config.ts
  modified:
    - briq-app/lib/brand/user-brand.ts
    - briq-app/components/brand/BrandProvider.tsx
    - briq-app/components/layout/Sidebar.tsx
    - briq-app/lib/nav.ts
    - briq-app/components/onboarding/Onboarding.tsx
    - briq-app/components/clients/ClientsScreen.tsx
decisions:
  - "allBrands: 실브랜드>0이면 실브랜드만(더미 제외), 0이면 데모 더미 7개"
  - "isAgency 정의: userBrands.length >= 2 (실브랜드 기준)"
  - "클라이언트 nav 게이팅: isAgency || allBrands.length >= 2 (데모 포함)"
  - "단일→다중 마이그레이션: BRANDS_KEY 없을 때 1회 자동"
  - "BRANDS_KEY=briq:user-brands, 기존 STORAGE_KEY=briq:user-brand 유지(호환)"
metrics:
  duration: "~50분"
  completed: 2026-06-08
  tasks: 5
  files_modified: 8
---

# Phase quick-260608-0ux Plan 01: 적응형 nav 대행사 레이어 Summary

**One-liner:** 다중 브랜드 localStorage 저장 + 단일→다중 자동 마이그레이션 + BrandSwitcher 에디토리얼 드롭다운 + agencyOnly nav 게이팅 + 온보딩 append 분기 구현

## What Was Built

단일 브랜드 가정이었던 데이터/네비 구조를 dual-persona(솔로 + 대행사)로 확장했다.

### Task 1: 다중 브랜드 저장 API (user-brand.ts)

- `BRANDS_KEY = "briq:user-brands"` 신규 도입 (기존 `"briq:user-brand"` 유지)
- 신규 exports: `saveUserBrands`, `loadUserBrands`, `addUserBrand`, `removeUserBrand`
- 단일키만 있을 때 `loadUserBrands()` 호출 시 1회 자동 마이그레이션
- `saveUserBrand` 보강: 기존 단일키 저장 후 다중 목록에도 upsert
- Vitest 설치 + 8개 유닛 테스트 전체 통과

### Task 2: BrandProvider 확장

- Ctx 타입에 `userBrands`, `isAgency`, `addBrand` 추가
- `allBrands`: 실브랜드>0이면 실브랜드만, 0이면 데모 더미 7개
- `setBrandId`: 단일 `userBrand` 비교 → `userBrands` 배열 `.some()` 비교로 교체
- storage 동기화: `briq:user-brands` 키 이벤트 추가
- SSR 가드(mounted): `userBrands/isAgency` 포함

### Task 3: BrandSwitcher + Sidebar 유저 플레이트

- `BrandSwitcher.tsx` 신규: `allBrands >= 2` 시 드롭다운, `== 1` 시 단일 텍스트
- 드롭다운: 브랜드 목록 + active Check(SAGE) + RULE 구분선 + "브랜드 추가(→?add=1)"
- 에디토리얼 토큰(INK/INK_MUTE/RULE/PAPER/SAGE) 준수, 그라데이션/rounded-xl 없음
- Sidebar: `otherCount/shopSummary` 제거, 유저 플레이트에 BrandSwitcher 삽입

### Task 4: nav agencyOnly 게이팅 + 온보딩 append 모드

- `NavItem.agencyOnly?: boolean` 타입 추가
- `navGroups`에 클라이언트 항목(`agencyOnly: true, icon: Briefcase`) 추가, HIDDEN_ROUTES에서 제거
- Sidebar 게이팅: `!(item.agencyOnly && !(isAgency || allBrands.length >= 2))` — 솔로(실1) 숨김, 데모(더미7)/대행사(실2+) 노출
- Onboarding: `useBrand().addBrand` 도입, `?add=1` 분기로 기존 브랜드 무손상 추가·활성화
- ClientsScreen: 브랜드 추가 경로 `/onboarding?add=1` 으로 변경

### Task 5 (checkpoint): 시각 검증

임시 `_debug-seed` 라우트 생성 후 Chrome DevTools Protocol로 3상태 헤드리스 스크린샷 촬영. 검증 후 라우트 삭제 완료.

## Screenshot Observations

| 상태 | 클라이언트 메뉴 | BrandSwitcher | 헤더 브랜드 | 평가 |
|------|----------------|---------------|------------|------|
| 데모 (실0, 더미7) | 보임 (클라이언트) | 드롭다운 (▼) | 미옥당 본점 | 기대 일치 |
| 솔로 (실1) | 숨김 | 단일 텍스트 (▼없음) | 솔로 카페 | 기대 일치 |
| 대행사 (실2) | 보임 (클라이언트) | 드롭다운 (▼) | 브랜드A 카페 | 기대 일치 |

- BrandSwitcher: INK/INK_MUTE/RULE/PAPER 에디토리얼 톤 적용 확인, 그라데이션/rounded-xl 없음
- 한글 이탤릭 없음, 한글 CTA uppercase 없음

## Test Results

```
vitest run lib/brand/user-brand.test.ts
  Test Files  1 passed (1)
  Tests       8 passed (8)
  Duration    ~340ms
```

```
tsc --noEmit -p tsconfig.json → 0 errors (all tasks)
```

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] refreshUserBrand가 savedActive 실브랜드 발견 시 brandId 미갱신**
- **Found during:** Task 5 (시각 검증)
- **Issue:** `refreshUserBrand()` 내부에서 `savedActive`가 userBrands 목록에 있어도 `setBrandIdState` 미호출 → 이벤트 기반 재로드 후 brandId가 DEFAULT_ID로 유지되어 더미 브랜드가 active로 표시
- **Fix:** `savedActive && list.some(b => b.id === savedActive)` 조건 추가 → 즉시 `setBrandIdState(savedActive)` 호출
- **Files modified:** `briq-app/components/brand/BrandProvider.tsx`
- **Commit:** 69a79c5

**2. [Rule 3 - Blocking] Vitest 미설치**
- **Found during:** Task 1 (TDD 실행 시)
- **Issue:** 프로젝트에 vitest 없음
- **Fix:** `pnpm add -D vitest @vitest/ui jsdom` + `vitest.config.ts` 생성
- **Files modified:** `briq-app/package.json`, `briq-app/pnpm-lock.yaml`, `briq-app/vitest.config.ts`
- **Commit:** 0c4df09

**3. [Rule 1 - Bug] Test fixture의 ExtractedColor.population 필드 누락**
- **Found during:** Task 1 (tsc 검증)
- **Issue:** `ExtractedColor` 타입에 `population: number` 필수 필드 존재, 테스트 fixture에 누락
- **Fix:** `population: 1` 추가
- **Files modified:** `briq-app/lib/brand/user-brand.test.ts`
- **Commit:** 0c4df09

## Commits

| Hash | Message |
|------|---------|
| 0c4df09 | feat(brand): 다중 브랜드 저장 API + 단일→다중 1회 마이그레이션 |
| eea3d17 | feat(brand): BrandProvider 확장 — userBrands/isAgency/addBrand + allBrands 재정의 |
| a9b5e36 | feat(brand): BrandSwitcher 에디토리얼 컴포넌트 + Sidebar 유저 플레이트 교체 |
| 7311ca9 | feat(nav): agencyOnly 게이팅 + 온보딩 append 모드 |
| 69a79c5 | fix(brand): refreshUserBrand가 savedActive 실브랜드 발견 시 brandId 즉시 업데이트 |

## Self-Check

All files verified present:
- briq-app/lib/brand/user-brand.ts: FOUND
- briq-app/lib/brand/user-brand.test.ts: FOUND
- briq-app/components/brand/BrandProvider.tsx: FOUND
- briq-app/components/layout/BrandSwitcher.tsx: FOUND
- briq-app/components/layout/Sidebar.tsx: FOUND
- briq-app/lib/nav.ts: FOUND
- briq-app/components/onboarding/Onboarding.tsx: FOUND
- app/_debug-seed/: DELETED (as required)

All commits verified in git log.

## Self-Check: PASSED
