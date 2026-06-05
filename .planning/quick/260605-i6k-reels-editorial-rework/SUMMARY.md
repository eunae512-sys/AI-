---
quick_id: 260605-i6k
slug: reels-editorial-rework
date: 2026-06-05
status: complete
---

# /reels 에디토리얼 디자인 시스템 전면 이관 — 완료

`briq-app/components/reels/ReelsScreen.tsx` (~1689줄)를 랜딩~온보딩과 한 결(매거진 에디토리얼)로 전면 이관하고 밀도를 완화해 공간을 확보했다. 표현(className/style/카피)만 변경, 로직 100% 보존.

## 무엇을 했나 (원자 커밋 5개)
1. 4057dd2 — tokens.ts import + 공통 부속(Eyebrow/SectionLabel/cardStyle/TERRA) + Hero 헤더 에디토리얼.
2. 457136d — 트렌드 스타일 배너 + StyleChip 에디토리얼.
3. 4dc65c3 — 좌측 컬럼(첫 3초 훅·BGM) + 그리드 여백(gap 3→6/8).
4. 523e7b5 — 중앙 폰 프리뷰·컷 스트립·상태바 (글로우 제거·빈상태 예시화면·INK 베젤).
5. 96c7e94 — 우측 컬럼(영상 만들기·업로드·자막·발행), shadcn Button/Card 제거.

## 보존된 로직 (무손상)
사진 업로드·BGM 합성·AI 출연자·영상 합성·AI 영상 폴링·발행/예약 큐·컷 자막 편집·트렌드 적용·viral 훅 — 모든 state/effect/handler/API 호출 그대로.

## 검증
- 단계마다 tsc --noEmit → exit 0 (최종 재확인 포함).
- 헤드리스 Chrome 스크린샷 육안 확인 — 전 페이지 종이+잉크 매거진 결, 큰 여백·헤어라인 위계, SaaS 색/그라데이션/이모지/다크모드 0.

## 남은 것 (선택, 무영향)
- TEMPLATES.grad/saveDelta, DEFAULT_PHOTOS 그라데이션 문자열은 더 이상 렌더 안 되는 죽은 데이터(시드 카운트 로직과 결합돼 로직 보존 차원에서 의도적 미삭제). 화면 누출 없음.
- 폰 내부 IG 크롬(팔로우 pill·진행 점·자막 편집 박스)은 실제 인스타 UI 표현이라 유지(온보딩 step7과 동일 기조).
