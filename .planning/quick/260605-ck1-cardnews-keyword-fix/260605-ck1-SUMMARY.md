---
quick_id: 260605-ck1
slug: cardnews-keyword-fix
description: 카드뉴스 자동 생성이 주제·키워드별로 안 달라지는 버그 — 키워드 유실 수정
date: 2026-06-05
status: complete
commits:
  - TBD  # fix(cardnews): 주제 키워드가 후크에 박히도록 — 라벨 제거·subject 폴백·kind 우선
---

# SUMMARY — 카드뉴스 주제 키워드 유실 버그

## 증상
같은 브랜드에 서로 다른 주제를 넣어도 슬라이드 문구가 비슷하고, 주제 핵심
키워드(봄나물 코스·딸기 케이크·어버이날 가족 외식)가 슬라이드(특히 1슬 후크)에
안 박혔다. `lib/cardnews/hook-generator.ts`.

## 근본 원인 (임시 디버그 라우트로 실측 확인 — 검증 후 삭제)
1. **`extractTopicTokens` subject 오염** — "신메뉴 봄나물 코스" → subject="신메뉴
   나물 코스". 캠페인 종류 라벨("신메뉴")이 subject 에 섞이고, TIME_PATTERN 이
   "봄나물"의 "봄"까지 부분 제거해 키워드가 깨짐.
2. **주제 무관 후크 픽** — 후크 풀 30개 중 다수(situational/promise/quote 및
   HOOK_SEASON "가장 먼저" 등)가 `t.subject` 를 아예 안 쓰고 `v.signature`/
   `v.city` 만 출력. 시드가 그런 템플릿을 고르면 키워드가 후크에서 사라짐.
3. **kind 오라우팅** — `inferKindFromTopic("신메뉴 봄나물 코스")` 가 "봄" 때문에
   "시즌"으로 라우팅 → 사장님이 명시한 "신메뉴" 의도 무시.

## 수정 (최소·정확)
- `extractTopicTokens`: 메타(시간/한정/숫자) 제거를 **띄어쓰기 토큰 단위**로만
  적용 → "봄나물" 보존, 단독 "봄"·"5월"만 제거. `KIND_LABEL_WORDS`(신메뉴/
  신상/시즌/단골…) 를 subject 에서 제외해 진짜 키워드만 남김. 라벨·메타만 있는
  입력엔 폴백 체인으로 빈 subject 방지.
- `pickHookWithSubject` 신설: 시드로 고른 후크가 진짜 키워드(`hasRealSubject`:
  2글자+한글+signature 와 다름)를 안 담으면, 풀에서 **subject 를 실제로 출력하는
  템플릿만** 추려 같은 시드로 재픽. 무드 오프셋·결정론 유지.
- `inferKindFromTopic`: "신메뉴"/"신상품·신상" 명시 의도를 시즌 단어보다 우선.

## Before / After (미옥당, 동일 브랜드 3주제 — 1슬 후크)
| 주제 | Before | After |
|------|--------|-------|
| 신메뉴 봄나물 코스 | 강남 한정식 중, **봄** 가장 먼저 예약 받습니다. | 강남 한정식 100곳 중, **봄나물 코스**를 이렇게 하는 곳은 1곳. |
| 딸기 생크림 케이크 신상 | (가변) | 이번 시즌 한정, **딸기 생크림 케이크**. |
| 어버이날 가족 외식 | 강남 한정식 중, 어버이날 가장 먼저 예약. | 어버이날 한 번뿐인 **가족 외식**. 자리 한정, 빠르게. |

→ 키워드가 후크에 박히고, VALUE/PROOF/CTA·릴스 자막(`reelSubtitlesFromGen`)도
이 슬라이드에서 파생되므로 함께 개선. 크로스 브랜드(한식/카페/디저트)는 업종
어휘(catShort·city·purchaseAction·signature) 그대로 차별화 유지.

## 검증
- `tsc --noEmit` exit 0
- `scripts/test-copy-quality.mjs` 32/32 통과 (AI 클리셰·날조 권위 숫자 0건, 구어체 유지)
- 임시 디버그 라우트 `app/api/debugcards` 로 before/after 실측 후 삭제 완료
