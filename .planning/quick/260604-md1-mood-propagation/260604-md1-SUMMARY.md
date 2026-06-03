---
quick_id: 260604-md1
slug: mood-propagation
date: 2026-06-04
status: complete
commit: d830b3b
---

# Quick Task 260604-md1 — Summary

## Problem
가입(온보딩) 시 고른 비주얼 무드(moody/warm/luxury 등)가 릴스·카드뉴스 **제작에 반영되지 않음**.

## Root cause
- `Brand` 타입에 `mood` 필드가 없음 → `toBrand(userBrand)` 변환에서 `moodId`가 **버려짐**.
- 카드뉴스 이미지 쿼리(`imageQueryFor`)는 **고정** tail `"soft warm tone"` 한 가지만 사용.
- 영상 쿼리(`buildVideoQueryDetailed`)는 토픽 텍스트에서만 무드 추출, 브랜드 무드 미수신.

## Fix (흐름 연결: 온보딩 → userBrand.moodId → Brand.mood → 생성기)
| 파일 | 변경 |
|------|------|
| `types/index.ts` | `Brand.mood?: Mood` 추가 |
| `lib/brand/user-brand.ts` | `toBrand()`에서 `mood: u.moodId` 전달 |
| `lib/dummy/brands.ts` | 더미 6개에 mood 부여(warm/moody/natural/playful/luxury/modern) |
| `lib/cardnews/hook-generator.ts` | `MOOD_IMAGE_STYLE` 추가, imageQueryFor tail을 무드별로, 역할별 고정 톤어 제거 |
| `lib/cardnews/video-query.ts` | `mood` 옵션 + `MOOD_VIDEO_EN` 주입 |
| `components/reels/ReelsScreen.tsx` | 영상 쿼리·AI 프롬프트에 `brand.mood` 전달 |
| `components/campaigns/ReelsPreview.tsx` | `mood` prop → buildVideoQuery 전달 |
| `components/campaigns/CampaignDraftCard.tsx` | `mood={brand.mood}` 전달 |

## Verification
- `tsc --noEmit` 통과 / `test-copy-quality.mjs` 32/32
- 6브랜드 무드별 IMG/VID 쿼리 차별 확인:
  - warm → warm golden hour light
  - moody → moody cinematic low light dramatic
  - natural → organic natural textures, earthy muted
  - playful → bright vivid colors / vivid colorful playful
  - luxury → elegant refined / elegant luxurious refined
  - modern → clean minimal / bright clean modern

## Notes
- 이미지 실생성(Pexels/AI)·영상은 이 쿼리 문자열을 그대로 사용 → 무드별 결과물 톤이 갈림.
- **후속 후보:** (1) 무드를 카드뉴스 **카피 톤**에도 반영(현재는 비주얼만), (2) 온보딩 사진에서 추출한 팔레트/실제 무드 분석을 moodId에 자동 매핑(현재는 사용자가 카드 선택).
