---
quick_id: 260605-db1
slug: dashboard-italic
description: 대시보드 1등 고도화 — 한글 가짜 이탤릭 제거 (이미 에디토리얼)
date: 2026-06-05
status: complete
commits:
  - e13ba3e  # fix(dashboard): 한글 가짜 이탤릭 제거
---

# SUMMARY — 대시보드 1등 고도화

## 진단

대시보드는 이미 매거진 에디토리얼 시스템 위에 잘 지어져 있었다:
SaaS 시그널 0 (emerald/indigo/gradient/rounded-xl/shadow 없음),
editorial-label·Cormorant·Nanum 사용. 따라서 전면 리스킨 불필요 — craft 디테일만.

## 한 일 (`e13ba3e`)

`components/dashboard/Dashboard.tsx` — 나눔명조/산세 한글에 `italic` 지정되어
합성 기울임(가짜 이탤릭)이던 3곳 정자화:
- 슬라이드 힌트 `t.slideHint` (Nanum italic → 정자)
- Editor's Note `today.reasoning` (Nanum italic → 정자)
- 반응 인용 `r.quote` (산세 italic → Nanum 정자, 인용 결 유지)

`titleFont` 헬퍼는 이미 "영문이면 Cormorant italic, 한국어면 정자"로 분기 → 유지.
`InstagramMobilePreview.tsx` 점검 — italic·SaaS 색 없음, 손댈 것 없음.

## 검증
- `tsc --noEmit` exit 0 · `/dashboard` 200 · 스크린샷으로 에디토리얼 결 확인

## 비고
- zinc 중립 그레이(쿨)는 따뜻한 종이 위 미세 차이라 보류(가격/대시보드 공통).
  필요 시 별도 패스에서 INK 토큰화 가능.
- 이로써 랜딩→온보딩→가격→결제→대시보드 전 경로가 한 결로 통일됨.
