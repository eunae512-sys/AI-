---
quick_id: 260604-cn1
slug: cardnews-coherence
date: 2026-06-04
status: complete
commit: 89841d7
---

# Quick Task 260604-cn1 — Summary

## What changed
캠페인 카드뉴스 7컷 카피 생성기(`lib/cardnews/hook-generator.ts` + `lib/cardnews/hook-patterns.ts`)의 문맥 깨짐을 전 업종(식당·카페·디저트·미용·숙소·패션) 실측 기반으로 정리. 후킹→내용→유도 흐름 일관성 확보.

| # | 문제 | 수정 |
|---|------|------|
| 1 | "손님 들이 ... 주문 하는 결" (모든 카드 slide3) | `이()` 헬퍼 + "주문하는" → "손님이 가장 자주 주문하는 결" |
| 2 | 헤어/패션 "어디 가야 잘 먹어요?", 스테이 "찐맛집" | `placeWord(industry)` + "어디가 좋을지" 업종 중립화 |
| 3 | 디저트/카페/헤어 "자리 한정", "같은 자리로" | vocab `slot`(재고/예약/객실) 사용 |
| 4 | CTA 슬라이드 "여름 끝나면 다시 못 잡습니다"(행동X) | 모든 CTA slide에 행동(저장/DM/공유) 보장 |
| 5 | "5월"→number 5→"5년 만에"/"올해도 5%" | NUM_PATTERN에서 월·일·주 제거 |
| 6 | "3년 만에 다시 나오는"(날조 연수) | "1년에 딱 한 시즌, 다시 돌아온" |
| 7 | "직접 가보고 후기"/"비싸 보였지만 또 갔습니다"(방문자 POV) | 3인칭/브랜드 보이스로 |
| 8 | "실제 가격 그대로 공개"(가격 미표시 약속 깨짐) | "합리적 구성 안내"로 |
| 9 | 저장률 X% 중복(VALUE+PROOF) | VALUE에서 제거, PROOF에서만 |
| 10 | 스테이/헤어 "공간은 산지에서 들어옵니다" | `sourcingLine(c)` 업종 분기 |
| 11 | "다듬은 1박"(단위 오류) | "다듬은 {ingredientWord}"(공간/결/재료/원두/원단) |
| 12 | 장마 등 시즌 토픽이 신메뉴로 분류 | `inferKindFromTopic` 시즌 정규식 보강 |

## Verification
- `tsc --noEmit` 통과 (exit 0)
- `scripts/test-copy-quality.mjs` **32/32 통과** (안티패턴·날조숫자 0건 회귀)
- 6개 브랜드 7컷 전수 덤프로 문맥 육안 확인 (잔여 깨짐 0)
- 결정론적 7컷 구조(같은 입력=같은 출력) 유지

## Notes
- 실 생성 경로는 키 있을 때 AI(compose-cardnews) 사용 — 이 수정은 로컬 폴백/프리뷰 생성기(`generateCardnewsCampaign`) 대상. 캠페인 페이지 카드 프리뷰가 이걸로 렌더됨.
- **후속 후보(미반영):** 해시태그 `#{city}맛집`·`#{city}점심`이 비-음식 업종(헤어/스테이/패션)에 그대로 붙음 — 문장 아닌 태그라 이번 범위 제외.
- 검증용 `scripts/dump-cardnews.mjs`는 throwaway라 커밋 전 삭제.

## Commit
- `89841d7` fix(cardnews): 캠페인 카드뉴스 카피 문맥 정리 — 후킹→내용→유도 일관성
