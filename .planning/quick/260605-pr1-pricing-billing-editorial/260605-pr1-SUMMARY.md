---
quick_id: 260605-pr1
slug: pricing-billing-editorial
description: 결제/요금제(가격 페이지 + 체험 결제 플로우) 1등 에디토리얼 고도화
date: 2026-06-05
status: complete
commits:
  - 709d33b  # feat(pricing): 가격 페이지 1등 디테일
  - 413c188  # feat(billing): 결제 플로우 에디토리얼 이관
---

# SUMMARY — 결제/요금제 1등 고도화

## 1. 가격 페이지 `app/pricing/page.tsx` (`709d33b`)

이미 매거진 톤(LandingNav·editorial-label·Cormorant·헤어라인)이라 잔여 이슈만 정리.

- **한글 가짜 이탤릭 제거**: 헤드라인·ROI '한 달 무한 발행.', 최종 CTA
  '내일 첫 카드뉴스를…' → 크림 하이라이트(`Hi`, Hero/온보딩과 동일 결).
  플랜 태그라인(한글)은 Cormorant italic → 명조 정자.
- **단일 액센트 규율**: emerald-500/600(SaaS 그린) → **SAGE**(#4F5F4B).
  할인%·연간 절약·포함 체크·ROI 수치·'사장님께 추천' 배지 통일. '가장 많이
  선택' 배지는 잉크.
- **한글 CTA**: 플랜/최종 CTA `tracking 0.1em·uppercase` → `0.02em` 정상 케이스.
- 하이라이트 카드 그림자 톤다운(따뜻한 잉크, 약하게).
- (남김) 쿨 zinc 중립 그레이는 따뜻한 종이 위에서 미세 차이라 이번엔 보류.

## 2. 결제 플로우 `app/billing/{start,success,fail}` (`413c188`)

제네릭 SaaS(zinc bg·rounded-2xl·ring·emerald·red-500) → 에디토리얼.
**동작·라우팅·상태 로직 100% 보존.**

- 종이 배경 + 헤어라인 사각 카드(ring·rounded-2xl·shadow 제거).
- 세리프 표제 + keep-all, 명조 본문.
- 체크·ShieldCheck·단계표시 emerald → SAGE.
- 오류 red-500 → 따뜻한 테라코타(#A1473D) (의미 유지).
- 버튼 zinc-900 → 솔리드 잉크.

## 검증

- `tsc --noEmit` → exit 0
- `/pricing` 200 · `/billing/fail` 200 · `/billing/success` 200 (스크린샷 확인)
- `/billing/start` 307 (로그인 게이트 — 정상, 스킨은 동일 패턴/tsc로 확인)
- `SubscribeButton`(zinc-900≈잉크, 공용 컴포넌트)은 유지

## 다음

- STATE 우선순위 다음: 대시보드(운영 효율)
- `SubscribeButton` 잉크 사각으로 미세 통일은 선택 사항
