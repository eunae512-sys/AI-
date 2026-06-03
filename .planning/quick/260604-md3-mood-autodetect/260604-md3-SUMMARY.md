---
quick_id: 260604-md3
slug: mood-autodetect
date: 2026-06-04
status: complete
commit: 19552c6
---

# Quick Task 260604-md3 — Summary

## What changed
가입 시 업로드한 **사진의 팔레트로 무드를 자동 추천** — "사진의 컨셉"이 무드를 결정하게 함. (md1 비주얼 + md2 카피 톤에 이은 마무리: 무드의 *입력*을 사진에서 자동 도출.)

### `lib/brand/mood-detect.ts` (신규)
- `inferMoodFromPalette(palette)`: population 가중 평균 명도·채도 + 따뜻한 색 비율로 6무드 매핑
  - 어두움+저채도 → **luxury**
  - 어두움+색감 → **moody**
  - 선명·밝음 → **playful**
  - 밝고 저채도 → **modern**
  - 차분·뮤트 → **natural**
  - 따뜻한 색 우세 → **warm**

### `components/onboarding/Onboarding.tsx`
- 단계 순서상 무드 선택(step2)이 사진 업로드(step4)보다 먼저라, **팔레트 추출 직후(step5) 무드를 자동 적용**
- step6 분석 결과에 "사진 분석 추천 무드" 표시 + **무드 칩 재선택** UI(직접 변경 가능 → `moodAutoDetected=false`)로 사용자 통제 유지

## Verification
- `tsc --noEmit` 통과
- 6 대표 팔레트 추론 정확도 100% (luxury/moody/playful/modern/natural/warm)

## Notes
- 자동 적용은 step2 수동 선택을 덮어쓰되, step6에서 투명하게 표시하고 칩으로 되돌릴 수 있음.
- 이 무드는 `userBrand.moodId → Brand.mood`(md1)로 흘러 이미지·영상(md1)·카피 톤(md2)에 모두 반영됨 → 사진 한 번으로 전 채널 톤이 정렬.

## 무드 작업 3종 묶음
- md1 `d830b3b` 무드 → 이미지·영상 생성
- md2 `1021f50` 무드 → 카드뉴스 카피 톤
- md3 `19552c6` 사진 팔레트 → 무드 자동 추천

## Commit
- `19552c6` feat(mood): 업로드 사진 팔레트로 무드 자동 추천
