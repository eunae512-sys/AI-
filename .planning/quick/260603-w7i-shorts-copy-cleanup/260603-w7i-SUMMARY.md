---
quick_id: 260603-w7i
slug: shorts-copy-cleanup
date: 2026-06-03
status: complete
commit: cef54be
---

# Quick Task 260603-w7i — Summary

## What changed
쇼츠(`/shorts`) 페이지가 **멀티 플랫폼 홍보 카피 생성기**임이 드러나도록 문구 3건 정리. 릴스(`/reels`, 영상 편집기)와의 혼동 제거가 목적.

| 위치 | 이전 | 이후 |
|------|------|------|
| `app/(app)/shorts/page.tsx` metadata.title | `BRIQ · AI 자동 홍보` | `BRIQ · AI 자동 홍보 (멀티 플랫폼 카피)` |
| `app/(app)/shorts/page.tsx` breadcrumb | `릴스·틱톡·쇼츠 한 번에` | `사진 한 장 → 플랫폼별 홍보 카피 한 번에` |
| `app/(app)/pipeline/page.tsx` DIRECT_EDIT label | `쇼츠 직접 편집` | `플랫폼별 홍보 카피 생성` |

## Verification
- `tsc --noEmit` 통과 (exit 0)
- 텍스트/카피만 수정, 로직 무변경

## Notes
- 페이지 표시 제목(Topbar `title`)은 브랜드성 있는 `"AI 자동 홍보"` 유지 — breadcrumb가 성격을 보강.
- ShortsScreen 내부 카피는 이미 "홍보글/카피/4개 플랫폼"으로 정확해 손대지 않음.
- 실행은 quick 워크플로 인라인(트리비얼 3-문자열 변경이라 worktree 격리 executor 생략, GSD 아티팩트·원자 커밋·STATE 기록은 유지).

## Commit
- `cef54be` refactor(shorts): 쇼츠 페이지 이름·문구를 "멀티 플랫폼 카피 생성기"로 명확화
