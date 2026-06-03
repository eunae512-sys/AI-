---
quick_id: 260604-cn3
slug: ai-prompt-voice
date: 2026-06-04
status: complete
commit: 5f591ee
---

# Quick Task 260604-cn3 — Summary

## What changed
AI 생성 경로(키 있을 때 카드뉴스 편집기가 타는 `compose-cardnews`)의 프롬프트를 로컬 생성기 고도화(cn2)와 같은 전문가 마케터 톤으로 통일.

### `lib/viral/system-prompt.ts` (모든 AI 카피 공유)
- **AI_CLICHES 확장**: 카드뉴스/감성 시(詩)적 상투구 추가 — 차곡차곡 · 단단한 가게 · 그 이상은 더하지 · 한 줄씩 그대로 · 한 호흡 · 손길이 자기 자리 · 마침표 · 한 결의 · 결을 느끼 · 오롯이 · 고스란히 · 마음을 담은 · 기다림의 미학 · 한 폭의 · 결이 살아 · 시간이 멈춘 · 여운이 남는
- **few-shot 예시 블록 `PRO_VS_AI_EXAMPLES`** 신설 → viral·formal 두 모드에 모두 주입. "10년차 마케터처럼 쓴다" before/after 6쌍 + 원칙 4가지(추상명사→구체 장면/숫자/실제 대사, 형용사→동사, 운율 금지, 실제 말투).

### `app/api/compose-cardnews/route.ts`
- 역할 프레이밍을 "소상공인 카드뉴스 10년차 마케터"로, AI 느낌 금지 명시
- DEMO_COMPOSITION(폴백) 카피 클리셰 제거("정성스레 조리"·"한자리에서 오래 이어 온 결"·"정갈하게 4종" → 구어체 구체 카피)

## Verification
- `tsc --noEmit` 통과
- `test-copy-quality.mjs` 32/32 통과
- 로컬 생성기·풀에 새 금지 클리셰 잔존 0건
- buildViralMandate 렌더 확인 (few-shot 포함, 2469자)

## Notes
- `buildViralMandate` 는 공유 빌더라 `generate-text`·`generate-blog` 등 다른 AI 카피도 동일 톤·예시를 받음 → 전 채널 톤 통일.
- 실제 LLM 출력 품질은 모델·temperature에 따라 변동 — few-shot + 클리셰 차단 + 런타임 detectCliches 플래깅 3중으로 가드.
- 후속: detectCliches flagged 결과를 편집기 UI에서 사장님에게 노출/자동 교체 제안하면 루프 완성.

## Commit
- `5f591ee` feat(ai): AI 생성 프롬프트도 전문가 마케터 톤으로 통일
