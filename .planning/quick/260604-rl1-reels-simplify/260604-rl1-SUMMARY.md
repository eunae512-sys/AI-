---
quick_id: 260604-rl1
slug: reels-simplify
date: 2026-06-04
status: complete
commits: [6eeee24, 6597e5e]
---

# Quick Task 260604-rl1 — Summary

## 사용자 요청
1. 자동 릴스 자막 수정이 안 됨 + 추천 자막이 계속 반복되는 오류
2. "스텝별로 넘어가는게 어색해 직관적으로 작업 가능하게 정리, 불필요한 부분 다 삭제해도 좋아"
3. "UX/UI 전문가로서 획기적·직관적, 편리함+실용성"

## 진단
- `ReelsScreen`이 프리뷰 컷을 **1.2초마다 자동 회전**(setInterval) → 자막 클릭하면 컷 전환과 동시에 편집 모드가 꺼져 "수정 안 됨", 같은 추천 자막 세트가 계속 돌아 "반복" 오류처럼 보이고, 스텝이 멋대로 넘어가 산만.
- 페이지가 3컬럼 + 상단 배너 + 하단 대형 '참고 릴스 포맷' 그리드로 분산 → 흐름 불명확.

## 변경 (`components/reels/ReelsScreen.tsx`)
1. **자동 회전 인터벌 제거** (`6eeee24`) — 컷은 수동 탐색만. 자막 편집 끊김·반복 보임·산만함 해결.
2. **참고 릴스 포맷 대형 그리드 제거** (128줄) — 핵심 흐름(업로드→자막→BGM→영상)에 집중, 페이지가 한 화면에 들어옴.
3. **컷 썸네일 스트립 신설** — 모든 컷을 썸네일로 한눈에, 탭하면 그 컷으로 이동 + 자막 즉시 편집. 컷별 자막 1줄 미리보기 + 번호 + 활성 링.
4. **헤더 버튼 명확화** — '변형 생성' → '자막 새로 추천'.

## Verification
- `tsc --noEmit` 통과 / `next build` 통과
- 재설계 후 스크린샷 확인 — 참고 그리드 제거로 레이아웃이 1화면으로 압축됨

5. **데드코드 정리** (`ede9a75`) — 그리드 제거로 미사용이 된 weeklyVideos 머신 125줄 삭제(WeeklyVideo 타입·state·Pexels fetch effect·applyWeekly + 관련 import 3종). 마운트마다 낭비되던 Pexels 영상 fetch 제거.

## Notes
- `appliedTrend` 배너·`startAiMusic/SceneForSuggested`는 캘린더 딥링크 경로로 여전히 동작(그리드/weekly 제거와 무관)하므로 보존.

## Commits
- `6eeee24` fix(reels): 자막 자동 회전 제거
- `6597e5e` refactor(reels): 참고 그리드 제거 + 컷 썸네일 편집
- `ede9a75` chore(reels): weeklyVideos 데드코드 125줄 정리
