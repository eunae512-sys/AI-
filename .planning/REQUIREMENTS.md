# Requirements: AdOps AI

**Defined:** 2026-05-10
**Core Value:** 광고대행사 직원 1명이 처리할 수 있는 클라이언트·캠페인 처리량을 2배 이상으로 끌어올린다 — 모든 기능 결정 기준은 "이 기능이 직원의 반복 업무를 실제로 줄이는가"

---

## v1 Requirements

### Authentication & Workspace (AUTH)

- [ ] **AUTH-01**: 직원이 이메일·비밀번호로 회원가입한다
- [ ] **AUTH-02**: 가입 시 이메일 인증 메일이 발송된다
- [ ] **AUTH-03**: 비밀번호 재설정 링크를 이메일로 받을 수 있다
- [ ] **AUTH-04**: 세션이 브라우저 새로고침 후에도 유지된다
- [ ] **AUTH-05**: 관리자(admin)가 멤버를 초대하고 역할(admin/planner/operator/designer/viewer)을 지정할 수 있다
- [ ] **AUTH-06**: 보호된 라우트에 비로그인 접근 시 `/login`으로 리다이렉트된다
- [ ] **AUTH-07**: 모든 도메인 테이블에 RLS가 day-1부터 활성화되며 `agency_id` 또는 `client_id`로 격리된다

### Clients & Brand Kit — F1 (CLNT)

- [ ] **CLNT-01**: 사용자가 클라이언트(광고주)를 생성한다 — 이름·업종·태그·상태
- [ ] **CLNT-02**: 사용자가 클라이언트 목록을 검색·필터(업종·상태·태그)로 조회한다
- [ ] **CLNT-03**: 사용자가 클라이언트 상세를 조회하며 요약·브랜드킷·자산·최근 캠페인을 본다
- [ ] **CLNT-04**: 사용자가 브랜드킷(슬로건·톤 키워드·컬러·로고·금지어·필수어)을 편집·저장한다
- [ ] **CLNT-05**: 사용자가 브랜드 자산(로고·제품 이미지·과거 카피·참고자료)을 업로드한다 — Supabase Storage, 비공개 버킷 + signed URL
- [ ] **CLNT-06**: 사용자가 클라이언트를 편집·아카이브한다

### Brand Tone Learning — F2 (TONE)

- [ ] **TONE-01**: 사용자가 톤 학습용 샘플(과거 카피·이미지 캡션 등)을 업로드한다
- [ ] **TONE-02**: AI가 샘플로부터 톤 프로파일(voice·formality·persona·vocabulary·do/dont)을 추출한다
- [ ] **TONE-03**: 사용자가 추출된 톤 프로파일을 미리보고 수정해 저장한다 (버전 관리)
- [ ] **TONE-04**: 가장 최신 활성 톤 프로파일이 모든 콘텐츠 생성 프롬프트에 자동 주입된다

### Campaign & Brief — F3 (CAMP)

- [ ] **CAMP-01**: 사용자가 캠페인을 생성한다 — 클라이언트·이름·목표·타겟·기간
- [ ] **CAMP-02**: 캠페인 생성 위저드에서 AI가 브리프(메시지·채널 믹스·KPI·후크·일정 힌트)를 스트리밍으로 생성한다
- [ ] **CAMP-03**: 사용자가 생성된 브리프를 편집·확정한다
- [ ] **CAMP-04**: 캠페인 목록을 상태(draft/active/paused/done)로 필터한다
- [ ] **CAMP-05**: 캠페인 상세에서 브리프·채널 탭·생성된 콘텐츠를 한 화면에서 확인한다

### Channel Transformation — F4 (XFRM)

- [ ] **XFRM-01**: 한 콘텐츠(또는 브리프)를 선택해 대상 채널 N개를 지정하면 채널별 변환본이 일괄 생성된다
- [ ] **XFRM-02**: 채널별 길이·형식·톤이 자동 조정된다 (인스타 캡션 vs 네이버 블로그 SEO vs 메타 광고)
- [ ] **XFRM-03**: 변환본은 원본 콘텐츠와 캠페인에 트레이서블하게 연결된다 (`source_content_id`)

### Ad Copy Generation — F5 (ADCP)

- [ ] **ADCP-01**: 사용자가 캠페인·채널·옵션(길이/톤/CTA 강도)을 지정해 광고 카피를 생성한다
- [ ] **ADCP-02**: 출력은 `{ headline, subhead, body, cta, hashtags[] }` 구조의 JSON으로 검증된다
- [ ] **ADCP-03**: 카피 생성 결과는 `contents` 테이블에 `kind=adcopy` 로 저장되며 토큰·비용이 기록된다

### Reels Script — F6 (REEL)

- [ ] **REEL-01**: 사용자가 길이(30s/60s)·후크 옵션을 지정해 릴스 스크립트를 생성한다
- [ ] **REEL-02**: 출력은 샷 단위 배열(`{ scene, dialog, caption, b_roll }[]`) + hook + cta + music_hint 구조로 검증된다
- [ ] **REEL-03**: 릴스 뷰어에서 샷 단위 인라인 편집이 가능하다

### Blog Draft — F7 (BLOG)

- [ ] **BLOG-01**: 사용자가 키워드·길이·SEO 옵션을 지정해 블로그 초안을 생성한다
- [ ] **BLOG-02**: 출력은 `{ title, meta_description, sections:[{ h2, body, image_prompt? }], tags[] }` 구조로 검증된다
- [ ] **BLOG-03**: 블로그 뷰어에서 섹션 단위 재생성·편집이 가능하다

### Detail Page Copy — F8 (DTL)

- [ ] **DTL-01**: 사용자가 제품 정보·랜딩 목적을 입력해 상세페이지 카피를 생성한다
- [ ] **DTL-02**: 출력은 `{ hero:{ headline,sub,cta }, sections:[{ kind, copy, image_prompt }] }` 구조로 검증된다
- [ ] **DTL-03**: 섹션 단위 추가·삭제·재생성을 지원한다

### Product Description — F9 (PROD)

- [ ] **PROD-01**: 사용자가 제품 사양·채널(스마트스토어/쿠팡/자사몰)을 입력해 상품 설명을 생성한다
- [ ] **PROD-02**: 출력은 `{ title, bullets[], description, search_keywords[] }` 구조로 검증된다
- [ ] **PROD-03**: 채널별 길이·키워드 규칙(스마트스토어 50자 등)이 옵션으로 적용된다

### Card News — F10 (CARD)

- [ ] **CARD-01**: 사용자가 슬라이드 수·톤·목적을 지정해 카드뉴스를 생성한다
- [ ] **CARD-02**: 출력은 슬라이드 배열(`{ index, title, sub?, body, image_prompt, cta? }[]`) 구조로 검증된다
- [ ] **CARD-03**: 카드뉴스 뷰어에서 슬라이드 단위 추가·삭제·재정렬·재생성을 지원한다

### Card News AI Image — F10+ (CIMG)  ← v2 → v1 승격 (SPEC-CARDNEWS-IMAGE.md)

- [ ] **CIMG-01**: 카드뉴스 텍스트가 생성된 콘텐츠에서 슬라이드별 이미지 생성을 트리거할 수 있다
- [ ] **CIMG-02**: 슬라이드 텍스트 + 브랜드킷에서 영어 이미지 프롬프트가 자동 생성되며, 사용자가 편집 가능하다
- [ ] **CIMG-03**: gpt-image-1 호출이 `lib/ai/image-gateway.ts` 단일 통로를 통과하며 토큰·비용·latency가 `prompt_logs`에 기록된다
- [ ] **CIMG-04**: 한 세트(6~10장)가 같은 `style_seed`로 생성되어 시각 일관성이 유지된다
- [ ] **CIMG-05**: 이미지 위에 한글 텍스트는 절대 새기지 않는다 — 모든 한글은 Canvas 오버레이로 합성된다
- [ ] **CIMG-06**: Canvas 오버레이는 Pretendard / 나눔명조 폰트와 브랜드 컬러를 자동 적용한다
- [ ] **CIMG-07**: 사이즈 1080×1350 (4:5) / 1080×1080 (1:1) 옵션을 선택할 수 있다
- [ ] **CIMG-08**: 스타일 프리셋(정통 / 모던 / 감성 / 일러스트) 변경 시 전체 슬라이드가 동일 시드로 재생성된다
- [ ] **CIMG-09**: 시각 가드레일(사장님 얼굴 / 경쟁 로고 / 의료 시술 시각화 등) 위반 자동 감지 시 검토 큐에 플래그된다
- [ ] **CIMG-10**: 슬라이드 단위 재생성·변형(같은 프롬프트, 다른 시드) 지원 (일일 5회 한도)
- [ ] **CIMG-11**: 이미지는 Supabase Storage 비공개 버킷 + signed URL(1h 만료)로 보관된다
- [ ] **CIMG-12**: 전체 슬라이드를 PNG zip / 인스타 캐러셀 메타 JSON / Figma JSON(베타) / CMYK PDF로 내보낼 수 있다
- [ ] **CIMG-13**: 이미지 일/월 비용 한도(전역·에이전시·클라이언트별)가 텍스트 한도와 별도로 운영되며 초과 시 429로 사전 차단된다

### AI Gateway & Cost Control (AIGW)

- [ ] **AIGW-01**: 모든 LLM 호출이 `lib/ai/gateway.ts` 단일 진입점을 통과한다 (직접 SDK 호출 금지)
- [ ] **AIGW-02**: 게이트웨이가 OpenAI ↔ Claude 간 provider 라우팅을 수행한다 (kind별 modelPref 기반)
- [ ] **AIGW-03**: 시스템 + 브랜드킷 + 가드레일 + few-shot 블록을 prompt cache 대상으로 묶어 캐시 적중률을 측정한다
- [ ] **AIGW-04**: 모든 호출의 토큰·비용·latency·cache_hit이 `prompt_logs`에 기록된다
- [ ] **AIGW-05**: 일/월 비용 한도 (전역·에이전시·클라이언트별)를 초과하면 429로 차단된다
- [ ] **AIGW-06**: AI 호출은 모두 스트리밍 응답으로 사용자에게 토큰 단위 렌더된다

### Safety & Guardrails (SAFE)

- [ ] **SAFE-01**: 시스템 프롬프트 단계에서 표시광고법 금지 표현(최고/100%/1위 등) deny-list가 주입된다
- [ ] **SAFE-02**: 의료·금융·식품 업종 클라이언트의 콘텐츠는 critic LLM 1회 통과 후에만 승인 가능하다
- [ ] **SAFE-03**: 출력에서 사실 클레임이 자동 추출되어 `ClaimChecklist` UI로 검토자에게 노출된다
- [ ] **SAFE-04**: 업종별 가드레일 deny-list/must-include 매핑은 `lib/prompts/shared/guardrails.ts`에서 관리된다

### Review & Approval (RVW)

- [ ] **RVW-01**: 모든 생성된 콘텐츠는 `status=draft`로 저장되어 자동 게시되지 않는다 (HITL)
- [ ] **RVW-02**: 사용자가 콘텐츠를 `in_review`로 제출한다
- [ ] **RVW-03**: 권한 있는 검토자가 승인·반려·수정요청 결정을 코멘트와 함께 남긴다
- [ ] **RVW-04**: 모든 결정이 `approvals` 테이블에 감사 로그로 남는다
- [ ] **RVW-05**: 콘텐츠 수정마다 `content_revisions`에 본문 스냅샷이 기록된다
- [ ] **RVW-06**: 검토 큐(`/review`)에서 역할별·클라이언트별 필터로 자기 작업을 본다

### Operations & Cost Dashboard (OPS)

- [ ] **OPS-01**: AI 비용 대시보드(`/settings/billing`)에서 일/주/월 단위 토큰·KRW 비용을 본다
- [ ] **OPS-02**: 클라이언트별·콘텐츠 종류별 비용 breakdown을 본다
- [ ] **OPS-03**: cache_hit 비율이 대시보드에 노출된다
- [ ] **OPS-04**: env 키는 zod로 검증되며 서버 전용 키는 클라이언트 번들로 새지 않는다 (`NEXT_PUBLIC_*` 분리)
- [ ] **OPS-05**: Sentry/PostHog로 에러·예외가 수집된다

### Korean Language & UI (UI)

- [ ] **UI-01**: 모든 UI 텍스트는 한국어 우선이다
- [ ] **UI-02**: 텍스트 편집기(Tiptap/ProseMirror)는 한글 IME 조합을 정확히 처리한다
- [ ] **UI-03**: shadcn/ui + Tailwind CSS로 일관된 디자인 시스템을 유지한다
- [ ] **UI-04**: 모바일 기본 대응 (대시보드·검토 큐 화면) — 캠페인/콘텐츠 생성은 데스크톱 우선

---

## v2 Requirements

향후 출시. 현재 로드맵에 포함되지 않음.

### Media Publishing (PUB)
- **PUB-01**: 메타·구글 광고 API 자동 게재
- **PUB-02**: 네이버 블로그 자동 발행
- **PUB-03**: 카카오 채널 메시지 발송 자동화

### Performance Analytics (PERF)
- **PERF-01**: 매체 API 연동 광고 성과 리포트
- **PERF-02**: 클라이언트별 ROAS·CTR 트렌드
- **PERF-03**: 자동 인사이트 생성

### Self-Serve SaaS (SAAS)
- **SAAS-01**: 외부 광고대행사 가입·결제
- **SAAS-02**: 에이전시별 가격 플랜·요금제
- **SAAS-03**: 사용량 기반 과금

### Advanced AI (AAI)
- **AAI-01**: 클라이언트별 fine-tuning / lightweight tuning
- **AAI-02**: 임베딩 기반 과거 카피 재사용 검색 (pgvector)
- **AAI-03**: 영상 콘텐츠 자동 생성 (릴스 영상 합성)
- ~~**AAI-04**: 이미지 직접 생성 (DALL-E/Imagen/FLUX)~~ → **카드뉴스 한정으로 v1 활성** (CIMG 카테고리). 다른 콘텐츠 종류 이미지 생성은 v1.x

### Compliance Automation (COMP)
- **COMP-01**: 의료광고 사전심의 자율심의기구 연동
- **COMP-02**: 카카오 비즈메시지 의무 표기 자동 검사

---

## Out of Scope

명시적 제외. scope creep 방지를 위한 기록.

| Feature | Reason |
|---------|--------|
| 매체 API 직접 집행 (메타/구글/네이버 자동 게재) | 권한·정책·법무 복잡도 — v1은 콘텐츠 생성·관리까지로 한정 |
| 광고 성과 분석 대시보드 | 데이터 소스가 매체 API에 묶여 있음 — v2 |
| 영상 자동 합성 | v1은 텍스트·이미지 프롬프트까지. 영상은 별도 페이즈 |
| 클라이언트 셀프서비스 모드 | 내부 도구로 시작. SaaS 확장은 v2 결정 |
| 모바일 네이티브 앱 | 웹 우선. iOS/Android는 검증 후 |
| 실시간 협업 편집 (Figma 식) | 1인 편집 + 검토 큐로 충분 |
| 다국어 카피 생성 | v1은 한국어 단일 — 모델 선택·품질 검증 비용 절감 |
| 음성/팟캐스트 스크립트 | v1 콘텐츠 종류 10개 외 |

---

## Traceability

요구사항 ↔ 페이즈 매핑. 2026-05-10 로드맵 생성 후 채워짐.

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | Phase 1 | Pending |
| AUTH-02 | Phase 1 | Pending |
| AUTH-03 | Phase 1 | Pending |
| AUTH-04 | Phase 1 | Pending |
| AUTH-05 | Phase 1 | Pending |
| AUTH-06 | Phase 1 | Pending |
| AUTH-07 | Phase 1 | Pending |
| CLNT-01 | Phase 1 | Pending |
| CLNT-02 | Phase 1 | Pending |
| CLNT-03 | Phase 1 | Pending |
| CLNT-04 | Phase 1 | Pending |
| CLNT-05 | Phase 1 | Pending |
| CLNT-06 | Phase 1 | Pending |
| TONE-01 | Phase 2 | Pending |
| TONE-02 | Phase 2 | Pending |
| TONE-03 | Phase 2 | Pending |
| TONE-04 | Phase 2 | Pending |
| CAMP-01 | Phase 3 | Pending |
| CAMP-02 | Phase 3 | Pending |
| CAMP-03 | Phase 3 | Pending |
| CAMP-04 | Phase 3 | Pending |
| CAMP-05 | Phase 3 | Pending |
| XFRM-01 | Phase 4 | Pending |
| XFRM-02 | Phase 4 | Pending |
| XFRM-03 | Phase 4 | Pending |
| ADCP-01 | Phase 4 | Pending |
| ADCP-02 | Phase 4 | Pending |
| ADCP-03 | Phase 4 | Pending |
| REEL-01 | Phase 5 | Pending |
| REEL-02 | Phase 5 | Pending |
| REEL-03 | Phase 5 | Pending |
| BLOG-01 | Phase 5 | Pending |
| BLOG-02 | Phase 5 | Pending |
| BLOG-03 | Phase 5 | Pending |
| DTL-01 | Phase 5 | Pending |
| DTL-02 | Phase 5 | Pending |
| DTL-03 | Phase 5 | Pending |
| PROD-01 | Phase 5 | Pending |
| PROD-02 | Phase 5 | Pending |
| PROD-03 | Phase 5 | Pending |
| CARD-01 | Phase 5 | Pending |
| CARD-02 | Phase 5 | Pending |
| CARD-03 | Phase 5 | Pending |
| AIGW-01 | Phase 2 | Pending |
| AIGW-02 | Phase 2 | Pending |
| AIGW-03 | Phase 2 | Pending |
| AIGW-04 | Phase 2 | Pending |
| AIGW-05 | Phase 2 | Pending |
| AIGW-06 | Phase 2 | Pending |
| SAFE-01 | Phase 2 | Pending |
| SAFE-02 | Phase 3 | Pending |
| SAFE-03 | Phase 3 | Pending |
| SAFE-04 | Phase 2 | Pending |
| RVW-01 | Phase 3 | Pending |
| RVW-02 | Phase 3 | Pending |
| RVW-03 | Phase 3 | Pending |
| RVW-04 | Phase 3 | Pending |
| RVW-05 | Phase 3 | Pending |
| RVW-06 | Phase 3 | Pending |
| OPS-01 | Phase 6 | Pending |
| OPS-02 | Phase 6 | Pending |
| OPS-03 | Phase 6 | Pending |
| OPS-04 | Phase 1 | Pending |
| OPS-05 | Phase 6 | Pending |
| UI-01  | Phase 1 | Pending |
| UI-02  | Phase 3 | Pending |
| UI-03  | Phase 1 | Pending |
| UI-04  | Phase 6 | Pending |

**Coverage:**
- v1 requirements: 68 total (note: itemized count is 68, header summary previously said 64)
- Mapped to phases: 68 ✓
- Unmapped: 0 ✓

**Phase distribution:**
- Phase 1 (Foundation & Multi-Tenant Data Model): 16 requirements
- Phase 2 (AI Gateway + Cost Control + Brand Voice): 12 requirements
- Phase 3 (Campaign Brief + HITL Review): 14 requirements
- Phase 4 (Short-form Content Cluster): 6 requirements
- Phase 5 (Long-form Content Cluster): 15 requirements
- Phase 6 (Operations & Hardening): 5 requirements

---
*Requirements defined: 2026-05-10*
*Last updated: 2026-05-10 after roadmap creation (traceability filled)*
