---
quick_id: 260605-ob1
slug: onboarding-editorial
description: 온보딩을 랜딩과 같은 매거진 에디토리얼 디자인 시스템으로 1등 고도화
date: 2026-06-05
status: complete
commits:
  - 35919bb  # feat(onboarding): 매거진 에디토리얼 디자인 시스템 전면 이관
---

# SUMMARY — 온보딩 1등 고도화 (디자인 시스템 이관)

## 문제

랜딩(매거진 에디토리얼: 잉크+종이·세리프·헤어라인)에서 'Begin'을 누르면 온보딩이
**제네릭 SaaS 폼**(zinc/indigo→pink/violet/emerald/fuchsia 그라데이션, gradient-text,
이모지, 큰 그림자, rounded-xl)으로 떨어져 브랜드가 단절됐다. → 1등 첫인상의 최대 누수.

## 한 일 (`35919bb`)

`components/onboarding/Onboarding.tsx` 전면 리스킨. `lib/landing/tokens` 채택,
라이트 전용(랜딩 동일), **플로우 로직 100% 보존**(state·effect·업로드·팔레트 추출·
saveUserBrand·라우팅 그대로).

| 영역 | Before → After |
|------|----------------|
| 진행바 | indigo→pink 그라데이션 → 잉크 헤어라인 세그먼트 |
| 표제 | sans font-semibold → 세리프(Nanum) + `word-break: keep-all` |
| STEP 라벨 | sans 회색 → 이탤릭 라틴 eyebrow (영문, 진짜 이탤릭) |
| 분석 상태(Step5) | violet/emerald 박스 → 잉크·세이지 헤어라인 |
| gradient-text(Step6) | → 잉크 + 크림 하이라이트(랜딩 강조 결) |
| IG 배지(Step3/7) | fuchsia·pink·orange → 정자 헤어라인 |
| 카드/입력/버튼 | rounded-xl·shadow → 헤어라인(RULE) 사각, 버튼 솔리드 잉크 + disabled 톤다운 |
| 이모지 | 📷→`Camera`, 🖼️→`Images` (lucide) |
| 한글 가짜 이탤릭 | 플랜 배너 '…플랜으로 시작합니다' 정자화 |
| 무드 무드보드 | 유지 (제품 컬러칩, 절제된 팔레트라 그대로) |

## 검증

- `tsc --noEmit` → exit 0
- `/onboarding` → 200, 헤드리스 스크린샷(Step 01)으로 랜딩과 한 결 확인
- 라이트 전용으로 통일(랜딩이 다크모드 없음) — dark: variant 제거

## 다음

- Step 2~7은 동일 패턴이라 코드상 일관 적용됨 — 실제 클릭 플로우 육안 점검 권장
  (사진 업로드→분석→결과→완료)
- AI 출연자(전속 모델) 실제 초상은 fal/OpenAI 쿼터 복구 후
- STATE 우선순위 다음: 결제/요금제(신뢰) → 대시보드(운영 효율)
