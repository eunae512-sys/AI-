# HANDOFF — /reels 페이지 전면 리워크 (새 세션용)

**작성:** 2026-06-05 | **상태:** 착수 전, 모든 선행 작업 커밋 완료(작업 트리 깨끗)

## 먼저 읽을 것
1. `CLAUDE.md` → **Conventions** 섹션 (디자인 시스템·철칙·카피 톤 — 이번 리워크의 헌법).
2. `briq-app/lib/landing/tokens.ts` (토큰 원천).
3. 이관 레퍼런스(이미 완료): 온보딩 `briq-app/components/onboarding/Onboarding.tsx`(커밋 35919bb), 가격 `app/pricing/page.tsx`(709d33b), 결제 `app/billing/*`(413c188) — **이 패턴 그대로 적용**.

## 대상
- 화면: `/reels` (앱 내부, Topbar 아래)
- 파일: **`briq-app/components/reels/ReelsScreen.tsx` (~1688줄, 큰 파일)**
- 라우트: `app/(app)/reels/page.tsx`

## 현재 문제 (스크린샷 기준)
제네릭 SaaS 스타일 + 밀집 레이아웃:
- 피치·핑크 그라데이션 폰 목업, indigo/pink 등 다색.
- 3컬럼(좌: 컷 리스트+BGM / 중앙: 폰 프리뷰 / 우: 영상 만들기·업로드·발행)이 빽빽함.
- 업로드 사진 자리가 그라데이션 플레이스홀더(빈 느낌).

## 목표
1. **에디토리얼 디자인 시스템 전면 이관** — CLAUDE.md Conventions 철칙 그대로(종이+잉크·세리프 표제·헤어라인·SAGE 단일 액센트·SaaS 색/그라데이션/이모지 제거·한글 이탤릭 금지·keep-all).
2. **"공간 확보"** — 밀도 완화. 큰 여백, 명확한 위계, 3컬럼 빽빽함을 정리(섹션 분리·여백·헤어라인 룰로 호흡). 빈 플레이스홀더는 '예시/안내'로 의도적으로 보이게.
3. 표제 카피도 한글·구어체 톤 점검(`사진 5~10장이면 30초 릴스가 자동 완성` 등은 톤 OK, 영문 액센트만 절제).

## 반드시 보존 (로직 100%)
- 사진 업로드 / BGM 선택 / **AI 출연자 생성** / "영상으로 만들기" / "인스타로 발행" 플로우·상태·핸들러·API 호출.
- 컷 리스트(한 컷 3초 순서) 편집.
- 큰 파일이라 **표현(className/style)만** 바꾸고 로직은 손대지 말 것. 가능하면 컴포넌트 단위로 나눠 안전하게.

## 이미 고친 것 (재파손 금지)
- 릴스 자막 **주제별 생성** + **자막 트랙 편집 안정화** (커밋 d831a0b) — `ReelsPreview.tsx`/`CampaignOneLineInput.tsx`. ReelsScreen 과 별개지만 릴스 도메인이므로 인지.
- 자동 문구 휴먼 톤 (f9aed4b).

## 작업 방식
- GSD quick, 섹션/패널 단위로: 감사 → 이관 → `tsc --noEmit` → 헤드리스 스크린샷 검증 → 원자 커밋.
- 검증: `cd briq-app && ./node_modules/.bin/next dev -p 3000` (환경 메모 참조), `/reels` 는 앱 내부라 브랜드 컨텍스트 필요 — 헤드리스로 안 뜨면 임시 라우트로 컴포넌트 단독 렌더해 확인.

## 환경
- dev: `pnpm dev` 실패 → `cd briq-app && ./node_modules/.bin/next dev -p 3000` 직접.
- OpenAI 쿼터·fal 잔액 소진 → 텍스트/이미지/영상/음악 Gemini·데모 폴백 동작(AI 영상·보컬음악은 결제 필요).
- 스크린샷: `"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --disable-gpu --window-size=W,H --screenshot=/tmp/x.png --virtual-time-budget=6000 URL`

## 완료 정의
`/reels` 가 랜딩~대시보드와 한 결(에디토리얼) + 여백·위계로 덜 빽빽 + 로직 무손상 + tsc 0 + 스크린샷 확인.
