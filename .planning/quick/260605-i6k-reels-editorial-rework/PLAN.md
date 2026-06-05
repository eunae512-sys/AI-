---
quick_id: 260605-i6k
slug: reels-editorial-rework
date: 2026-06-05
---

# /reels 에디토리얼 디자인 시스템 전면 이관

## 목표
`briq-app/components/reels/ReelsScreen.tsx` (~1689줄) 를 랜딩~온보딩과 한 결(매거진 에디토리얼)으로 이관하고 밀도를 완화해 공간을 확보한다.

## 철칙 (CLAUDE.md Conventions)
- 진리의 원천: `lib/landing/tokens.ts` (INK/INK_SOFT/INK_MUTE/RULE/RULE_SOFT/PAPER/PAPER_HOVER/SAGE/HL/SERIF).
- SaaS 색(violet/indigo/pink/rose/emerald/amber/sky/slate/stone) · 그라데이션 · 큰 그림자 · rounded-xl/2xl · 이모지 · 다크모드 클래스 제거.
- 카드 = 헤어라인(RULE) 사각. 버튼 = 솔리드 INK + PAPER 텍스트, disabled = rgba(20,19,15,0.10)+INK_MUTE.
- 한글 가짜 이탤릭 금지. 영문 eyebrow/folio 만 italic(SERIF_LATIN). 한글 표제=SERIF_HANGUL, word-break:keep-all.
- 단일 액센트 SAGE. 오류만 테라코타 #A1473D.
- 밀도 완화: 큰 여백, 명확한 위계, 섹션 헤어라인 분리.

## 보존 (로직 100%)
모든 state/handler/effect/API 호출 — 사진 업로드, BGM 선택·합성, AI 출연자 생성, 영상 합성/AI 영상, 발행/예약 큐, 컷 자막 편집. **className/style/카피만** 변경.

## 작업 단위 (원자 커밋)
1. 토큰 import + 에디토리얼 헬퍼(Eyebrow/Folio/SectionLabel) + Hero 헤더.
2. appliedTrend 배너 + StyleChip.
3. 좌측 컬럼 — viral 훅 카드, BGM 카드.
4. 중앙 — 폰 목업(테두리/글로우/IG헤더/자막/액션), 컷 썸네일 스트립, 상태 바.
5. 우측 — 영상 만들기 카드, 업로드 사진 카드, 컷별 자막 카드, 발행 카드.
6. 전역 잔여(DEFAULT_PHOTOS 그라데이션, TEMPLATES grad 등) 정리 + 최종 스크린샷.

## 검증
각 단계 `./node_modules/.bin/tsc --noEmit -p tsconfig.json` → 헤드리스 스크린샷 → 원자 커밋.
