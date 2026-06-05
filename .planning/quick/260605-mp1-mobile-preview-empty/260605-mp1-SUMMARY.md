---
quick_id: 260605-mp1
slug: mobile-preview-empty
description: 대시보드 인스타 미리보기(Feed/Reels/Story)가 비어 보이던 버그
date: 2026-06-05
status: complete
commits:
  - ffb8d36  # fix(preview): SmartTextOverlay 안 보이던 버그들 수정
  - 6ea0ea9  # fix(preview): 자막 겹침 — 캡션 블록 스택
---

# SUMMARY — 인스타 모바일 미리보기 빈 화면 수정

## 증상
대시보드 'Mobile preview / 인스타그램에서 이렇게 보입니다' 섹션의 Feed·Reels·Story
3프레임이 사진도 자막도 없이 통째로 비어 보임. (CoverStory 사진은 위에서 정상 표시)

## 근본 원인 (SmartTextOverlay — 유일 사용처라 사실상 처음부터 글자 못 그림)
1. **position 클래스 충돌(핵심)**: 루트 div 가 자체 `relative` + 호출부 className
   `absolute inset-0` 을 동시에 가짐 → 캐스케이드상 `relative` 가 이겨 `inset-0` 이
   무시됨. 자식이 전부 절대배치라 콘텐츠 높이 0 → 오버레이가 **높이 0 으로 붕괴** →
   배경·글자 통째로 안 보임. → 하드코딩 `relative` 제거, position 은 className 에 위임.
2. **폰트 단위 깨짐**: 글자 크기가 `cqh`(컨테이너 쿼리 높이)인데 `container-type: size`
   컨테이너가 없어 미해결(추가로 size 는 절대배치 박스를 붕괴시킴). → ResizeObserver
   로 컨테이너 높이를 측정해 **px 로 직접 계산**.

## 부수 개선 (빈 느낌 방지·견고성)
- 표시 `<img>` 에서 `crossOrigin` 제거 → 세일리언시(피사체 회피)는 별도 crossOrigin
  프로브 이미지로. CDN CORS 헤더 유무와 무관하게 **사진은 항상 표시**.
- 이미지 분석 없을 때(서버·로딩 전·CORS 실패) 글자색 **밝게 + 바닥 스크림 강제** →
  어두운 릴스/스토리에서 검은 글씨가 사라지던 문제 해결 (text-placement.ts).
- 이미지 없을 때 평평한 회색 → **따뜻한 다크 그라데이션** 폴백.

## 적용 흐름 (사용자 질문: "어떻게 적용되는건지")
`InstagramMobilePreview(imageUrl=coverUrl, shop, brand)` →
- 사진: CoverStory 가 Pexels 에서 고른 표지(coverUrl) 공유.
- 자막: `shop.today.slideLabel/slideTitle/slideHint`, 스토리는 brand.name + CTA.
- `SmartTextOverlay` 가 사진 피사체(세일리언시)·인스타 UI 안전영역을 피해 자동 배치.

## 후속 — 자막 겹침 (`6ea0ea9`)
빈 화면 수정 후, 라벨·제목·부제가 서로 겹쳐 보임. 원인: 세 항목을 각각 독립적으로
'best region' 배치 → 모두 상단 밴드를 골라 충돌. → 제목(앵커)의 세일리언시 결과를
따르되 모든 항목을 단일 flex-col 캡션 블록에 순서대로 스택(항목별 폰트·스타일 유지).

## 검증
- tsc exit 0
- 단독 테스트 라우트(대조군 비교)로 글자·배경 렌더 확인 → 삭제
- 실제 `/dashboard` Feed/Reels/Story 3프레임에 사진 + 자동배치 자막이 라벨→제목→
  부제로 깔끔히 스택(겹침 없음) 확인
