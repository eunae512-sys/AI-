---
quick_id: 260604-ai1
slug: aimodel-topic
date: 2026-06-04
status: complete
commit: 264871a
---

# Quick Task 260604-ai1 — Summary

## Problem
자동 홍보(쇼츠)의 "AI 출연자 생성" 카드가 캠페인 주제와 안 맞는 인물·장면을 계속 냄.

## Root cause
`AiModelGenerator`가 **`industry`만 받고 주제(theme/topic)를 안 받음**. 씬을 업종으로만 고르고(`getRecommendedScenes(industry)`), promptEN에 주제가 전혀 안 들어가서 캠페인 주제(예: "여름 수박 케이크")와 무관한 일반 씬이 생성됨.

## Fix
| 파일 | 변경 |
|------|------|
| `components/ai-gen/AiModelGenerator.tsx` | `topic?` prop 추가. 씬 소재(signatureMenu 슬롯)에 `signatureMenu?.[0] || topic` 주입. 소재를 직접 안 쓰는 씬(사장님/손님)엔 `The scene is visually themed around "<주제>"` 컨텍스트 append |
| `components/shorts/ShortsScreen.tsx` | `topic={preset?.themeTitle ?? brand.campaign}` 전달 |
| `components/reels/ReelsScreen.tsx` | `topic={brand.campaign}` 전달 |

## Verification
- `tsc --noEmit` 통과
- "여름 수박 케이크" 주제로 씬 프롬프트 확인:
  - 손님 씬 → "...bite into 여름 수박 케이크..."
  - 플랫레이 → "Overhead flat-lay of 여름 수박 케이크..."
  - 소재 미사용 씬 → "...themed around \"여름 수박 케이크\"." 추가

## Notes
- 실제 키 경로(gpt-image/gemini)는 프롬프트에 섞인 한국어 주제를 잘 처리. 데모 Pexels 폴백 매칭엔 영향 적음.
- 후속 후보: 주제 한국어 → 영문 변환(translateSubject 재사용)으로 폴백 매칭률·모델 정확도 추가 향상. 씬 자체를 주제 적합도로 정렬하는 것도 가능.

## Commit
- `264871a` fix(ai-model): AI 출연자 생성을 캠페인 주제에 맞게
