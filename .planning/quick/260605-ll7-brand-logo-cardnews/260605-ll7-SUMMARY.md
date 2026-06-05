---
quick_id: 260605-ll7
slug: brand-logo-cardnews
description: 카드뉴스 슬라이드에 브랜드 로고 이미지 반영 (없으면 워드마크 폴백)
date: 2026-06-05
status: complete
commit: (no code change — feature pre-existing; docs-only)
---

# Summary — 260605-ll7 카드뉴스 브랜드 로고

## 결론
**이미 완전히 구현·배선되어 있었다.** 코드 변경 없음(0줄). 본 태스크는 검증으로 종료.

## 이미 존재했던 것 (배선 포함)
| 레이어 | 위치 | 상태 |
|--------|------|------|
| 타입 `logoDataUrl` | `components/campaigns/types.ts` `BrandMarkConfig` | 존재 |
| 로고 업로드 UI (이미지→data URL) | `components/campaigns/BrandMarkPicker.tsx` (`FileReader`, 2MB 제한, 교체/삭제) | 존재 |
| 영속화 (brandId별) | `lib/brand/brand-mark.ts` `loadBrandMark`/`saveBrandMark` (localStorage) | 존재 |
| 슬라이드 렌더 분기 | `CardnewsCarousel.tsx` `BrandMark` — logo면 `<img>`(에디토리얼 사이즈·틴트·opacity), 아니면 워드마크 | 존재 |
| 5개 컴포지션 호출 | masthead/pillar-left/paper-split/overlay-card/type-hero | 존재 |
| IG 아바타 분기 | `PhoneShell` 헤더 (`mark.logoDataUrl ? img : 이니셜`) | 존재 |
| 캐러셀에 전달 | `CampaignDraftCard.tsx` → `brandId` + `brandWordmark(brand)` | 존재 |
| 데모 폴백 | 데모 브랜드는 logo 미설정 → 워드마크 (가짜 로고 없음) | 존재 |

## 추가/배선한 것
없음. 신규 코드 0줄.

## 검증
- `tsc --noEmit` → **EXIT 0** (변경 전·후 동일)
- 임시 라우트 `app/(app)/zztest-logo` 로 두 케이스 렌더 → 헤드리스 스크린샷:
  - **로고 있음(logo-brand)**: 데스크탑 슬라이드 마스트헤드에 BRIQ 로고 이미지(어두운 배경에 라이트 틴트), 모바일 IG 아바타에 로고 — 확인됨
  - **로고 없음(word-brand)**: 슬라이드 마스트헤드 "미옥당" 워드마크 텍스트, IG 아바타 "미" 이니셜 — 폴백 확인됨
- 임시 라우트 삭제 완료. git status 에 소스 변경 없음 (pre-existing untracked 만 잔존, 미스테이징).

## 비고
- 영속 `Brand` 타입(@/types)엔 logo 필드 없음 — 기존 저장 경로(brandId별 localStorage)가
  이미 존재하므로 그대로 사용(태스크 지침: "이미 저장 경로 있으면 그대로 사용").
  온보딩/브랜드킷에 로고 입력 추가는 불필요(BrandMarkPicker 가 캐러셀 인라인으로 그 역할 수행).
