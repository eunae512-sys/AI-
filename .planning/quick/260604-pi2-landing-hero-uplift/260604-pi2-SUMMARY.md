---
quick_id: 260604-pi2
slug: landing-hero-uplift
description: 랜딩 Hero를 1등 수준으로 고도화 (매거진 에디토리얼 결 유지)
date: 2026-06-04
status: complete
commits:
  - ed4a8d2  # feat(landing): Hero 1등 고도화 1차
---

# SUMMARY — 랜딩 Hero 1등 고도화 (1차)

## 한 일

매거진 에디토리얼 결을 유지한 채 Hero의 craft·전환·신뢰를 보강. 단일 커밋 `ed4a8d2`.

| # | 개선 | 파일 |
|---|------|------|
| 1 | 한글 가짜 이탤릭 전면 제거 (헤드라인·필드노트·다이어리) — 라틴 이탤릭만 유지 | Hero.tsx |
| 2 | 주 CTA 한글화 (`14일 무료로 시작`·`데모 둘러보기`·`무료로 시작`) + 자간/대문자 보정 | Hero.tsx |
| 3 | 미검증 '200+ 가게' 제거 + 라이브 수치에 '실제 운영 화면 예시' 라벨 | Hero.tsx |
| 4 | `INK_MUTE` `#8C8881`→`#767268` 대비 보정 | tokens.ts |

## 검증

- `tsc --noEmit` → exit 0 (에러 없음)
- dev (`next dev -p 3000`) 재컴파일 OK, `GET / 200`
- 헤드리스 Chrome 스크린샷: 헤드라인 '자동으로' upright, 한글 CTA, '예시' 라벨 확인

## 비고 / 다음

- **오케스트레이션 일탈**: 타이포 craft 정밀 작업이라 gsd-executor(sonnet) 하청 대신
  orchestrator(Opus)가 직접 편집. PLAN/SUMMARY는 추적 보존용으로 사후 작성.
- **남은 1등 고도화 후보**: 헤드라인 외 Sections.tsx의 한글 이탤릭 잔재 점검,
  CasesSection 사례 데이터 정직화, FAQ/FinalCTA 카피 톤, 모션 절제 일관성.
- **다음 우선순위(STATE 기준)**: 온보딩(활성화) → 결제/요금제(신뢰) → 대시보드.
- 환경: OpenAI 쿼터·fal 잔액 소진 → 텍스트/이미지/영상/음악 Gemini·데모 폴백 동작.
