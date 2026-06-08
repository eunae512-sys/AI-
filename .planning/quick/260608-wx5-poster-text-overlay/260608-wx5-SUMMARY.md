---
phase: quick-260608-wx5
plan: 01
subsystem: ai-gen / shorts
tags: [poster, image-edit, canvas, korean-text, honesty]
requires: [poster-templates.ts, watermark.ts, generate-poster route]
provides: [poster-compositor.ts, no-text poster prompts, app text overlay]
affects: [PosterStudio.tsx, ShortsScreen.tsx]
tech-stack:
  patterns: [canvas image+text 합성(watermark.ts 재사용), document.fonts.load 폰트 보장]
key-files:
  created: [briq-app/lib/ai-gen/poster-compositor.ts]
  modified:
    - briq-app/lib/ai-gen/poster-templates.ts
    - briq-app/components/ai-gen/PosterStudio.tsx
    - briq-app/components/shorts/ShortsScreen.tsx
decisions:
  - "AI 는 글자 0개(no-text) — 한글 텍스트는 앱이 canvas 로 정확히 합성"
  - "워터마크는 최종 합성본(이미지+텍스트)에 적용 — 미리보기는 raw AI + DOM 오버레이"
metrics:
  duration: ~35m
  completed: 2026-06-08
---

# quick-260608-wx5: 포스터 한글 텍스트 오버레이 (깨진 글자 수정) Summary

AI 가 깨진 한글("맛의 민결"·"둥단")을 그리고 사진을 프레임만 씌우던 포스터 결함을, **AI 프롬프트에서 모든 글자 렌더링을 금지(빈 여백 + 배경 화이트 교체·재구도)하고, 정확한 한글 텍스트는 앱이 canvas 로 합성**하는 하이브리드로 고쳤다.

## 무엇이 바뀌었나

### 1. 글자 없는 변환 프롬프트 (poster-templates.ts)
- `COMMON_EDIT_TAIL`: "한국어 라벨·타이포 포함될 수 있다" → **이미지 내 모든 글자·문자·숫자·로고 금지**(한글 강제문 + `CRITICAL: render NO text…` 영문). + "단순 액자 금지, 배경 화이트 교체·재구도로 실제 변환".
- 13개 템플릿 body 전부: 콜아웃/헤드라인/메뉴 라벨을 **글자 없는 그래픽·빈 여백**으로 재작성.
- `PosterStyle.textZone: "top"|"bottom"|"lower-third"` 추가 — cover/space=lower-third, infographic/menu/card=top. 합성기가 텍스트 위치 결정.
- `PosterStyleOpts` 에서 `signature`·`handwriting` 텍스트 인자 제거(깨진 글자 원인), `accentColor`(색감)만 유지.

### 2. poster-compositor.ts (신규) — 이미지+텍스트 단일 PNG
- `composePoster({imageSrc, title?, subtitle?, zone, handwriting?, accentColor?})` → canvas: 이미지 draw → zone 위치에 제목(Nanum Myeongjo upright, keep-all 줄바꿈) + 부제(INK_SOFT), PAPER 반투명 밴드로 사진 위 가독 확보 → PNG dataURL.
- `document.fonts.load` 폰트 보장(1.5s 타임아웃/실패 시 Pretendard 폴백). 한글 italic 금지(철칙) — handwriting 은 라틴/숫자 제목에만. 텍스트 비면 이미지 그대로 PNG.

### 3. PosterStudio.tsx — 편집 가능한 텍스트 + 합성
- props `brandName?`/`tagline?` 추가. 제목/부제 인풋(사각·RULE·INK) 노출, 실데이터 프리필(title=`signatureMenu[0]||brandName`, subtitle=`tagline`).
- generate 는 글자 없는 프롬프트(signature/handwriting 인자 제거).
- 미리보기에 라이브 DOM 텍스트 오버레이(zone 위치, Nanum Myeongjo upright).
- "이 포스터 사용": `composePoster` → `applyAiWatermark` → `onGenerated`. 텍스트 비면 이미지+워터마크만.

### 4. ShortsScreen.tsx
- `PosterStudio` 에 `brandName={brand.name} tagline={tagline}` 전달.

## 검증 결과

| # | 검증 | 결과 |
|---|------|------|
| 1 | `tsc --noEmit -p tsconfig.json` | ✅ 0 errors |
| 2 | 라이브 no-text 1장 (Nano Banana gemini-2.5-flash-image, 실제 Pexels 음식사진 + NEW restaurant infographic 프롬프트) | ✅ 저장본(`/tmp/wx5-notext-result.png`): **(a) 이미지 내 글자·깨진 한글 0개** — 콜아웃/헤드라인 전부 빈 박스·빈 여백. **(b) 실제 변환** — 배경 깨끗한 화이트로 교체, 음식 중앙 원형 재구도, 가는 연결선 + 재료 인셋. 프롬프트 수정이 깨진 글자를 제거함을 입증 |
| 3 | /shorts 헤드리스 Chrome + CDP (포스터 탭→사진 업로드→스타일→생성) | ✅ 제목/부제 입력칸 노출·프리필("미옥당 본점"), 생성 성공, **AI 이미지 글자 없음**(`/tmp/wx5-preview-crop.png`) + 앱 텍스트 오버레이가 Nanum Myeongjo 로 또렷 렌더(DOM `overlayTitleText="미옥당 본점"` 확인), 콘솔 에러 0. 스크린샷: `/tmp/wx5-shorts-inputs.png`, `/tmp/wx5-shorts-preview.png` |
| 4 | grep `violet\|emerald\|tone="sky"\|tone="amber"\|rounded-(xl\|2xl)` (3파일) | ✅ 0 hits (PosterStudio.tsx 의 1건은 금지 항목을 나열한 주석 자체 — 실제 사용 아님). 프롬프트 가짜 수치 0 |
| 5 | generate-poster/generate-image route·watermark.ts 무손상 | ✅ `git diff HEAD~3 HEAD` 4개 계획 파일만 변경, 라우트·워터마크 무변경 |

## 커밋

- `20c91c3` feat(poster-templates): 글자 없는 변환 프롬프트 + 스타일별 텍스트 존
- `2f88815` feat(poster-compositor,PosterStudio): 정확한 한글 텍스트 오버레이 + 단일 PNG 합성
- `cf9979f` feat(ShortsScreen): PosterStudio 에 brandName/tagline 전달

## Deviations from Plan

None — plan executed as written. 임시 node 스크립트(라이브 1장)·CDP 스크립트·Chrome 프로파일은 검증 후 삭제, 검증 산출물 PNG 는 `/tmp/` 에 보존.

## Deferred Items

- `generate-poster/route.ts` 의 주석("포스터는 타이포가 핵심" / "no-text 강화 금지")은 이제 의미가 바뀌었지만(프롬프트 자체가 no-text), 라우트 동작은 변경 불필요(constraint #5)라 코드·주석 무손상으로 둠. 추후 주석 갱신 가능(범위 밖).
- 합성기 PAPER 밴드 색은 토큰값(#FAF7EE)을 인라인 rgba 로 사용 — 향후 토큰 헬퍼화 가능(선택).

## Self-Check: PASSED

4 파일 + SUMMARY 존재 확인, 커밋 20c91c3·2f88815·cf9979f 존재 확인.
