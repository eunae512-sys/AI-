---
quick_id: 260604-ai2
slug: topic-translate
date: 2026-06-04
status: complete
commit: 0e30baa
---

# Quick Task 260604-ai2 — Summary

## What changed
ai1 후속 — AI 출연자 생성 시 한국어 주제를 **영문 소재로 변환**해 이미지 모델·Pexels 폴백 매칭 정확도를 높임.

### `lib/cardnews/video-query.ts`
- `translateTopicToEN(topic)` 추가 — `extractVideoTokens`의 식재료/메뉴 사전 + 보조 사전(룩북·디저트·파마·헤어·한옥·스테이·네일)으로 핵심 명사만 영문화. 매칭 0건이면 "".

### `components/ai-gen/AiModelGenerator.tsx`
- 주제를 `translateTopicToEN`으로 영문화 후 프롬프트 주입. 변환 실패 시 원문 한국어 폴백. 실제 시그니처 메뉴가 있으면 그걸 우선.

## Verification
- `tsc --noEmit` 통과
- 변환 결과:
  - 여름 수박 케이크 → watermelon cake patisserie
  - 5월 콜드브루 시즌 → cold brew iced coffee
  - S/S 26 룩북 → fashion lookbook
  - 5월 봄 컬러 → hair color salon
  - 장마 감성 스테이 → stay interior
  - 딸기 마카롱 → strawberry macaron
  - 어버이날 효도 패키지 → "" (→ 한국어 폴백)

## Notes
- 일부 변환이 다소 장황(예: 봄나물 코스) → slice(0,3)로 길이 제한. 필요 시 중복 토큰 dedup 추가 가능.
- 미매칭 주제(추상 캠페인명)는 한국어 그대로 모델에 전달 — 최신 이미지 모델은 한국어 토큰도 처리.

## Commit
- `0e30baa` feat(ai-model): AI 출연자 주제를 영문으로 변환해 매칭 정확도 향상
