---
quick_id: 260605-rl2
slug: reels-subtitle-fix
description: 자동 릴스 버그 — 자막 주제별 미반영(반복) + 자막 트랙 편집 불가
date: 2026-06-05
status: complete
commits:
  - d831a0b  # fix(reels): 자막 주제별 생성 + 자막 트랙 편집 안정화
---

# SUMMARY — 자동 릴스 자막 버그 2건

## Bug 2 — 자막이 주제마다 안 바뀌고 반복됨

`components/campaigns/CampaignOneLineInput.tsx` `buildDraftFromTopic()` 의 릴스
자막 4줄이 하드코딩 — 1번만 topic 사용, 2~4번은 모든 캠페인 동일("재료부터
다릅니다." 등).

**Fix:** `reelSubtitlesFromGen(gen, topic)` 신설. 같은 함수가 이미 만드는
카드뉴스 후킹 슬라이드(`gen.slides`: hook·value·value·proof·cta, 토픽·종류·
브랜드 반영)에서 hook→value[0]→value[1]→cta 캡션을 뽑아 자막 생성. 한 컷
안에서 같은 줄 중복 시 다른 후보로 대체. gen 없을 때만 토픽 기반 폴백.

**런타임 검증** (임시 라우트, 검증 후 삭제): 동일 브랜드(미옥당) 3개 토픽
→ 자막 hook/value/cta 모두 상이 확인.
- "신메뉴 봄나물 코스" → 강남 한정식 중, / … / 사장님이 직접 챙기는 점심 코스, / 봄 지나면 다음은 한참 뒤.
- "어버이날 이벤트" → 어버이날 이벤트, / … / 어버이날 한정이라 / 댓글로 인원만 남겨주세요.
- "단골 재방문 감사" → "이건 진짜 못 참겠다" / … / 팔로우 + 알림 ON.

## Bug 1 — 영상 위 자막 클릭 편집이 안 됨

`components/campaigns/ReelsPreview.tsx`. 편집 textarea 는 `editingIdx ===
currentSubIdx` 일 때만 마운트되는데, `currentSubIdx` 는 영상 `currentTime`(t)
에서 파생. 재생 중 자막을 클릭하면 onFocus 가 정지시키기 전에 t 가 흘러
currentSubIdx 가 바뀌고 textarea 가 즉시 언마운트 → 편집 실패(간헐적).

**Fix:** 자막 클릭 onClick 에서 `setPlaying(false)` 를 먼저 호출 → t 고정 →
currentSubIdx 안정 → textarea 안정적으로 마운트·포커스. 트랙 리스트 편집도
동일하게 클릭 시 정지.

## 검증
- `tsc --noEmit` exit 0
- 임시 디버그 라우트로 자막 변형 런타임 확인 (삭제 완료)
