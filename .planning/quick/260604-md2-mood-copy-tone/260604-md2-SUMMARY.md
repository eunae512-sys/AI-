---
quick_id: 260604-md2
slug: mood-copy-tone
date: 2026-06-04
status: complete
commit: 1021f50
---

# Quick Task 260604-md2 — Summary

## What changed
가입 무드를 **카피 톤**에도 반영 (md1의 비주얼 반영에 이은 후속 — 이제 무드가 그림+글 양쪽에 걸림).

### `lib/cardnews/hook-generator.ts`
- **MOOD_CAPTION_OPENER**: 인스타 캡션 첫 줄을 무드별 목소리로
  - warm: "다니다 괜히 또 생각나는 곳 / 가면 마음이 놓여요"
  - moody: "아는 사람만 조용히 가요 / 오늘 살짝 보여드려요"
  - playful: "이건 진짜예요! / 저장 안 하면 손해예요"
  - luxury: "격이 다른 ~ 한 곳 / 아는 분은 이미 알아요"
  - natural: "꾸밈없이 그대로 좋아요 / 보시면 압니다"
  - modern: "군더더기 없이 깔끔해요 / 핵심만 보여드릴게요"
- **MOOD_HOOK_OFFSET**: 같은 캠페인 후크 풀에서 무드별 다른 후크 픽 → 카드 헤드라인도 무드를 탐 (캠페인 종류 적합성은 유지, 변수 자리만 → 문법 안전)

### `lib/cardnews/hook-patterns.ts`
- 무드 오프셋이 노출한 기존 버그 수정: situational hook "카페 한 한 잔"(이중 한) → "카페에서 한 잔"

### 기존 버그 (hook-generator)
- HOOK_SEASON "부모님 모시고 가기 좋은 곳"(식당 전용) → "챙겨드리기 좋은 곳"(헤어·디저트·스테이 등 전 업종)

## Verification
- `tsc --noEmit` 통과 / `test-copy-quality.mjs` 32/32
- 6무드 후크·캡션 오프너 차별 + 이중 한·업종 미스핏 0 확인

## Notes
- 카드 본문(VALUE/PROOF) 자체를 무드별로 다시 쓰진 않음 — 헤드라인(후크)+캡션 오프너로 톤을 잡음(고비용/문법위험 회피). 필요 시 무드별 CTA 에너지까지 확장 가능.
- **남은 후속:** 온보딩 업로드 사진 팔레트(명도·채도·색상)에서 moodId 자동 추천 → "사진의 컨셉" 자체가 무드를 결정 (현재는 카드 수동 선택).

## Commit
- `1021f50` feat(mood): 무드를 카드뉴스 카피 톤에도 반영
