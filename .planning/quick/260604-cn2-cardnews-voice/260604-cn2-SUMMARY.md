---
quick_id: 260604-cn2
slug: cardnews-voice
date: 2026-06-04
status: complete
commit: d25dcf3
---

# Quick Task 260604-cn2 — Summary

## What changed
카드뉴스 + 릴스 자막 카피를 "AI가 쓴 느낌"(시적·상투적)에서 실제 10년차 마케터가 쓴 자연스러운 결로 고도화.

### 카드뉴스 (`hook-generator.ts`, `hook-patterns.ts`)
- **outcomePhrase** 6업종 클리셰 교체: "한 상의 정성이 차려집니다"→"국물 맛이 한층 깊어집니다", "결의 마무리가 또렷"→"결이 한결 자연스러워집니다" 등 구체 감각
- **VALUE_POOL** 재작성: "그 이상은 더하지 않습니다"·"손길이 자기 자리를 잡습니다"·"단단한 가게" 제거 → "남들 하는 방식 말고, 여기 결대로 합니다" / "한 번 와본 분이 조용히 다시 ~ 곳입니다"
- **PROOF_POOL** 재작성: "차곡차곡"·"한 줄씩 그대로 옮깁니다" 제거 → 실 브랜드 값(저장률/팔로워/도달) + 후기체("또 올 것 같아요 — 지난주 손님 한마디")
- **CAPTION_BODY_LINES** 상투구 제거, 구어체로
- hook-patterns: 이중 "한 한 잔" 버그 + "정성껏 차립니다" 수정

### 릴스 자막 (`hook-pool.ts`)
- `INDUSTRY_HOOK_POOL` 6업종 × 12 = 72줄 전면 재작성
- 시적·AI톤("한 점, 한 결의 시간", "산미의 결을 느끼세요", "광택의 마침표 — 5초") → 저장각 구어체("창가 자리는 일찍 가야 잡아요", "단면 보고 바로 저장했어요")

### 캠페인 하드코딩 자막 (`campaigns/page.tsx`)
- 2개 릴스 자막 블록 자연어화 ("한 호흡, 그대로." → "직접 보고 정했어요")

## Verification
- `tsc --noEmit` 통과
- `scripts/test-copy-quality.mjs` **32/32 통과** (안티패턴·날조숫자 0 회귀)
- 6브랜드 7컷 전수 덤프 육안 — 클리셰 0, 업종 일관, 후킹→내용→유도 자연스러움
- 결정론 구조·업종 안전성 유지

## Notes
- 이 수정은 캠페인 페이지가 쓰는 **로컬 생성기**(generateCardnewsCampaign) + 릴스 자막 풀 대상. `voice-bank.ts`의 릴스 후크는 이미 자연스러워 유지.
- **후속 후보:** AI 경로(compose-cardnews) 시스템 프롬프트에 동일한 안티-클리셰 가이드 + few-shot 반영하면 키 있을 때 생성물도 같은 톤.
- stay의 "사장님 손 거친 1박 패키지" 등 일부 표현은 의미 통하나 업종 핏 약간 약함 — 추후 stay 전용 VALUE 분기로 개선 가능.

## Commit
- `d25dcf3` feat(cardnews): 카드뉴스·릴스 자막 카피를 전문가 마케터 톤으로 고도화
