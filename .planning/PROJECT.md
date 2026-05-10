# AI 마케팅 운영 플랫폼 (AdOps AI)

## What This Is

소상공인 광고대행사의 내부 업무를 자동화하는 AI 마케팅 운영 플랫폼. 기획자·운영자가 클라이언트별 광고 캠페인을 빠르게 기획하고, 채널별(네이버, 인스타그램, 카카오, 메타/구글 광고 등) 콘텐츠를 AI로 일괄 생성·관리할 수 있는 사내 SaaS 형태의 웹앱.

## Core Value

**광고대행사 직원 1명이 처리할 수 있는 클라이언트 수와 캠페인 처리량을 2배 이상으로 끌어올린다** — 모든 기능 결정의 기준은 "이 기능이 직원의 반복 업무를 실제로 줄이는가"다.

## Requirements

### Validated

<!-- Shipped and confirmed valuable. -->

(아직 없음 — 출시 후 검증)

### Active

<!-- Current scope. Building toward these. v1 의 10가지 핵심 기능 (사용자 명시). -->

- [ ] **F1. 클라이언트 브랜드 정보 저장** — 광고주(소상공인) 브랜드 프로필·자산·과거 캠페인 보관
- [ ] **F2. 브랜드 톤앤매너 학습** — 샘플 카피·이미지 업로드로 AI가 톤 프로파일 추출, 이후 모든 생성에 적용
- [ ] **F3. 광고 캠페인 생성** — 목표·타겟·기간 입력 → AI가 캠페인 브리프(메시지·채널 믹스·KPI) 초안 생성
- [ ] **F4. 채널별 콘텐츠 자동 변환** — 한 브리프를 채널별(SNS/블로그/광고매체)로 형식·길이·톤 변환
- [ ] **F5. 광고 카피 생성** — 페이드·오가닉 광고 카피(헤드라인·본문·CTA·해시태그)
- [ ] **F6. 릴스 스크립트 생성** — 인스타 릴스/숏폼 영상 스크립트(샷 단위·자막·내레이션)
- [ ] **F7. 블로그 초안 생성** — 네이버 블로그 등 SEO 친화 장문 초안
- [ ] **F8. 상세페이지 카피 생성** — 랜딩/제품 상세페이지 섹션별 카피
- [ ] **F9. 쇼핑몰 상품 설명 생성** — 스마트스토어/쿠팡/자사몰용 상품 설명·셀링 포인트
- [ ] **F10. 카드뉴스 제작** — 슬라이드 단위 텍스트(제목/소제목/본문/CTA) + 이미지 프롬프트
- [ ] (공통) 직원 검토·수정·승인 휴먼-인-더-루프
- [ ] (공통) 역할 구분(기획자/운영자/디자이너) + 작업 큐
- [ ] (공통) 한국어 UI·한국어 카피 품질 최우선

### Out of Scope

<!-- Explicit boundaries. Includes reasoning to prevent re-adding. -->

- 광고 매체 API 직접 집행(메타/구글 광고 자동 게재) — v1은 콘텐츠 생성·관리까지. 매체 API 연동은 컴플라이언스·계정 권한 복잡도 높아 v2 이후
- 클라이언트가 직접 로그인해 사용하는 셀프서비스 모드 — 내부 도구로 시작, 외부 노출은 별도 결정
- 성과 분석/리포트 대시보드 — 데이터 소스가 매체 API에 묶여 있어 v2로 미룸
- 영상 콘텐츠 자동 생성(릴스/숏폼 영상 합성) — 텍스트·정적 이미지 우선, 영상은 별도 페이즈

## Context

- **사용자**: 운영자(소상공인 광고대행사 대표) 본인 + 사내 직원(기획자, 운영자, 디자이너). 시작은 1개 회사 내부 도구로 운영, 검증되면 다른 대행사 대상 SaaS로 확장 가능성 열어둠.
- **클라이언트(광고주) 특성**: 소상공인 — 음식점, 미용실, 학원, 병원, 동네 매장 등. 브랜드 톤이 일관되지 않고, 짧은 사이클로 캠페인이 자주 바뀜.
- **반복 업무 패턴**: 클라이언트마다 비슷한 기획 프로세스를 매번 처음부터 작성, 채널별 카피 미세 변형 작업이 많음, 같은 시즌·업종에 같은 패턴이 반복됨 → AI로 가장 큰 레버리지를 낼 수 있는 영역.
- **시장 환경**: 국내 SMB 마케팅 SaaS는 매체 집행/리포트 중심 도구가 대부분 — 기획·콘텐츠 제작 자동화는 빈 시장.
- **AI 활용**: LLM(카피·기획안 생성), 이미지 생성(썸네일·광고 소재 프롬프트), 검색·자료 수집 보조.

## Constraints

- **언어**: 한국어 우선 — 카피·기획안 품질이 핵심 가치이므로 영문 모델 출력 그대로 쓰면 안 됨
- **사용자 규모**: 초기에는 1개 대행사 내부(5~20명) — 멀티테넌시는 v1 범위에는 가벼운 수준만
- **예산**: 1인 운영자 기반의 부트스트랩 — AI API 비용 통제(캐싱·토큰 관리)가 일찍 들어와야 함
- **데이터 민감도**: 클라이언트 영업 정보 포함 — 자체 호스팅 가능한 구조 권장(클라우드 SaaS여도 데이터 격리 명확히)
- **법적**: 의료·금융 등 광고 규제 업종 카피 생성 시 표현 규제 준수 가드레일 필요

## Key Decisions

<!-- Decisions that constrain future work. -->

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| v1은 사내 도구로 시작, SaaS는 v2 결정 | 검증 비용 최소화. 내부에서 매일 쓰며 fit 확인 | — Pending |
| 매체 집행 자동화는 v2로 미룸 | API 권한·정책 복잡도. v1은 콘텐츠 자동화만으로도 충분한 시간 절감 | — Pending |
| 휴먼-인-더-루프 필수 | 광고 카피 품질·법적 리스크 — AI 단독 게재 안 함 | — Pending |
| 한국어·한국 시장 특화 | 글로벌 도구는 네이버·카카오 채널 대응 약함 — 차별점 | — Pending |
| **스택 락인: Next.js + Supabase + OpenAI/Claude API + Tailwind CSS** | 사용자 명시 선택. 1인 부트스트랩 운영자 기준 단일 빌·서울 리전 가까움·shadcn/ui 친화 | — Pending |
| **Supabase RLS day 1 적용** (agency_id + client_id 격리) | 멀티 테넌시는 v1에 1개 회사라도 retrofit 비용 폭증 방지 | — Pending |
| **AI 게이트웨이 단일 진입점** (`lib/ai/gateway.ts`) | 비용 측정·캐싱·가드레일·provider 라우팅을 첫 카피 기능보다 먼저 구축 | — Pending |
| **콘텐츠 종류 10가지 모두 텍스트+프롬프트 산출** (이미지 직접 합성은 v2) | v1 범위 통제. 이미지는 프롬프트만 제공, 디자이너가 별도 도구로 합성 | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-05-10 after initialization*
