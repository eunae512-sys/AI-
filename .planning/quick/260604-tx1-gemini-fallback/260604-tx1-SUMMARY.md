---
quick_id: 260604-tx1
slug: gemini-fallback
date: 2026-06-04
status: complete
commit: f1b99a6
---

# Quick Task 260604-tx1 — Summary

## 사용자 보고
"텍스트 생성 실패: You exceeded your current quota, please check your plan and billing details."

## 진단
- OpenAI API 키 = **insufficient_quota** (결제 한도 소진) — 직접 호출로 확인.
- Gemini 키(`GOOGLE_GENAI_API_KEY`)는 **정상** 작동 확인.
- `compose-cardnews`는 Gemini 우선 폴백이 있지만, **`generate-text`·`generate-blog`는 OpenAI 전용**(폴백 없음) → 카드뉴스 텍스트 생성이 쿼터 에러로 죽음(CardnewsScreen 토스트 "텍스트 생성 실패").

## Fix
| 파일 | 변경 |
|------|------|
| `app/api/generate-text/route.ts` | Gemini 우선 → OpenAI 폴백 프로바이더 체인. 데모 가드를 `placeholder && !geminiTextConfigured()`로 보강 |
| `app/api/generate-blog/route.ts` | 본문 생성에 동일 체인 + Gemini 사용 시 OpenAI 확장 단계 생략. cost/usage·meta 동적 처리 |
- `TEXT_PROVIDER=openai` 면 기존처럼 OpenAI 우선(역호환).

## Verification
- `tsc --noEmit` 통과 / `next build` 통과
- dev 서버 실호출: `generate-text` `source=gemini` ok, `generate-blog` `source=gemini` ok (gemini-2.5-flash)

## Notes (별개 이슈 — 같은 세션에서 처리)
- **Codex CLI 인증 오류**(이전 메시지)는 별건이었음: `gpt-5.3-codex` 기본 모델이 ChatGPT 계정 미지원 → `~/.codex/config.toml`에 `model = "gpt-5.5"` 지정으로 해결(리포 밖 글로벌 설정이라 커밋 없음).
- **근본 해결책**: 사용자가 OpenAI 결제/크레딧을 채우면 OpenAI 경로 복구. 그 전까지 앱은 Gemini로 정상 동작(무료 티어).
- 이미지 생성은 기존 image provider 추상화(gemini 어댑터+폴백)로 이미 graceful degrade.

## 후속 (c36456b) — "본문 생성 실패 ... 폴백 템플릿"
폴백 추가 후에도 **긴 블로그(2000~3000자)**에서 실패가 재현됨. 원인:
- gemini-2.5-flash 의 **thinking 토큰이 maxOutputTokens 예산을 잠식** → JSON `{"body":"..."}` 가 ~1200자에서 잘림 → `JSON.parse` 실패(`Expected ',' or '}' at position 1246`) → OpenAI 폴백 → 쿼터 에러 노출.

수정:
- `lib/ai/text/gemini.ts`: `thinkingConfig.thinkingBudget=0` (구조화 생성엔 추론 불필요 → 출력 예산 전부 확보 + 속도/비용↓), `maxOutputTokens=8192` 명시.
- 두 라우트: 전체 실패 시 **주 프로바이더(Gemini) 에러 우선 노출**(OpenAI 영구 쿼터 문구가 진짜 원인을 가리지 않게).
- 검증: 2800자 목표 블로그가 잘림 없이 `source=gemini` 생성.

## Commits
- `f1b99a6` fix(text): OpenAI 쿼터 소진 시 Gemini 자동 폴백
- `c36456b` fix(text): 긴 본문 Gemini 잘림 해결 (thinking off + maxOutputTokens)
