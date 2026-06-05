---
quick_id: 260605-n83
slug: clean-up-dead-no-op-elements-in-reels-re
date: 2026-06-05
status: complete
---

# Quick Task 260605-n83: /reels 데드 요소 정리

`briq-app/components/reels/ReelsScreen.tsx` (~1688줄)의 죽은/무의미 요소를
직전 감사로 확정된 5개 항목대로 제거·정리. 기능 코드 전부 보존.

## 작업 항목 (원자 커밋 단위)

1. **TEMPLATES 배열 삭제** (69–74행) — 참조 0건 확인됨. 통째 삭제.
2. **DEFAULT_PHOTOS grad 문자열 제거** — gradient 칸은 빈 PAPER 사각형으로만
   렌더(1646 근처)되고 grad 값은 className/style 에 안 쓰임. 시드 카운트 6은
   유지, Photo 타입의 `grad: string` 죽은 필드 정리.
3. **activeTpl/defaultTpl/INDUSTRY_DEFAULT_TPL 체인 삭제** (77, 123, 126, 376, 1161).
   UI에 템플릿 선택 없음. activeTpl 은 1161 AnimatePresence key 최후 폴백으로만 사용
   → 상수 `"empty"` 로 대체.
4. **no-op 팔로우 버튼** (1214행) — 클릭 안 되는 장식 버튼. 삭제 또는 비인터랙티브
   span 으로. 화면상 자연스러운 쪽 선택, 근거 보고.
5. **빈 상태 자막 겹침** (1188–1252) — 사진 0장일 때 안내문 위에 HOOKS 샘플 자막
   오버레이가 겹침(스크린샷으로 확정됨). currentCut 없을 때 자막 캡션 오버레이 숨김.

## 검증
- `cd briq-app && ./node_modules/.bin/tsc --noEmit -p tsconfig.json` → 0
- /reels 헤드리스 스크린샷: 정상 렌더 + 빈 상태 겹침 해소 확인
- grep 잔재 0: TEMPLATES / activeTpl / INDUSTRY_DEFAULT_TPL / 죽은 grad

## 절대 불변
BGM·AI음악·트렌드·컴파일·발행/큐·컷 스트립·자막 트랙 편집 핸들러, hook-generator.ts.
