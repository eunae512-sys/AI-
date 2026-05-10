# SPEC — 카드뉴스 AI 이미지 생성

**작성**: 2026-05-10
**상태**: 인터뷰 기반 v0.1 (PROJECT.md / REQUIREMENTS.md / ROADMAP.md 반영 대상)
**우선순위 변경**: v2 → **v1 Active** (사용자 결정)

---

## 1. 한 줄 정의

**카드뉴스 텍스트(F10)에 맞춰, 슬라이드별 배경 이미지를 OpenAI gpt-image-1로 자동 생성하고, 한글 텍스트는 Canvas로 오버레이해 인스타·블로그용 PNG/zip을 한 번에 만들어낸다.**

---

## 2. 인터뷰 결과 (가정 채움)

| 항목 | 결정 | 근거 |
|---|---|---|
| 1차 사용 케이스 | **카드뉴스** (인스타 · 블로그 공통 산출물) | 디자이너 시간이 가장 많이 들어가는 시각 작업. 6~10장씩 매 캠페인마다 |
| 빈도 | 클라이언트당 월 6~12세트 | 시즌·이벤트 마다 새로 |
| 표준 사이즈 | **1080×1350** (4:5, 인스타 카드뉴스 표준) | 1080×1080 (1:1) 옵션 보조 |
| AI 모델 | **OpenAI gpt-image-1** (medium 품질). DALL-E 3 fallback | Anthropic은 이미지 생성 미지원 — 텍스트는 Claude, 이미지는 OpenAI 분기 라우팅 |
| **한글 처리** | **이미지에 새기지 않음.** 한글은 Canvas 오버레이 (Pretendard / 나눔명조) | gpt-image-1 한글 렌더링 부정확 — 실무 정답 |
| 브랜드 일관성 | 브랜드킷 `brand_kit` (컬러 hex / 톤 / 무드 / 금지 시각요소) → system 프롬프트 자동 주입 + 6장 같은 스타일 시드 | F2 톤 학습과 동일 패턴 |
| 워크플로우 | F10 카드뉴스 텍스트 → 슬라이드별 이미지 생성 → Canvas 오버레이 → 검토 큐 → 승인 → 다운로드 | 기존 HITL과 통합 |
| 비용 | gpt-image-1 medium = **$0.04/장** → 6장 ≈ ₩336 (2026-05 기준 환율) | AIGW 게이트 일/월 한도 재사용. 이미지 전용 한도 분리 권장 |
| HITL | 기존 검토 큐 + **시각 가드레일** (사장님 얼굴 노출 / 경쟁 로고 / 의료 시술 전후 비교 등 deny-list) | 의료/금융 클라이언트는 critic 추가 |
| 권한 | designer + planner 생성 / operator + admin 승인 | RVW 워크플로우 동일 |
| 출력 | PNG 단건 + zip 일괄 + 인스타 캐러셀 순서 메타(.json) + Figma JSON(베타) + CMYK PDF(인쇄) | 운영자 요청 빈도 순 |

---

## 3. UX 흐름

```
[캠페인 상세] → [F10 카드뉴스 텍스트 생성 완료]
        ↓
[/content/[id] 카드뉴스 패널]
   ├ 슬라이드 1 : 표지 텍스트 ✓ + [이미지 생성] 버튼
   ├ 슬라이드 2 : 후크 텍스트 ✓ + [이미지 생성] 버튼
   ├ ...
        ↓ (전체 생성 클릭)
[/content/[id]/cardnews-image]   ← 본 SPEC의 핵심 화면 (= mockup 06)
   ├ 슬라이드별 미리보기 그리드 (배경 + 한글 오버레이)
   ├ 슬라이드별 [재생성 / 변형 / PNG]
   ├ 스타일 프리셋 + 컬러 + 사이즈 + 시드 컨트롤
   ├ 우측: 브랜드 일관성 / 시각 가드레일 / 비용 / 생성 로그 / 내보내기
        ↓ [승인 후 인스타 업로드] (또는 zip 다운로드)
[검토 큐 통과 → 캠페인 자산 라이브러리 보관]
```

---

## 4. 기술 설계

### 4.1 데이터 모델 추가/확장

`contents.body` (kind=`card_news`) 스키마 확장:

```ts
type CardNewsSlide = {
  index: number;
  role: 'title' | 'hook' | 'story' | 'menu' | 'cta' | 'custom';
  // 텍스트 (F10에서 이미 생성)
  title: string;
  sub?: string;
  body?: string;
  cta?: string;
  // 이미지 (이번 SPEC)
  image_prompt: string;          // AI가 만든 이미지 프롬프트 (편집 가능)
  image_url?: string;            // Supabase Storage signed URL
  image_seed?: string;           // 스타일 시드 (6장 통일)
  image_style?: 'traditional' | 'modern' | 'photo' | 'illustration';
  generated_at?: string;
  cost_usd?: number;
  status: 'pending' | 'generated' | 'approved' | 'flagged';
};
```

### 4.2 새 게이트웨이 모듈

`lib/ai/image-gateway.ts` — 텍스트 게이트웨이와 분리, 같은 비용 미터·가드레일 정책:

```ts
export interface ImageGenerateInput {
  clientId: string;
  contentId: string;
  slideIndex: number;
  prompt: string;
  size: '1024x1024' | '1024x1536' | '1536x1024';
  quality: 'low' | 'medium' | 'high';
  styleSeed: string;
  brandKit: BrandKit;
  visualGuardrails: string[];  // industry-specific deny-list
}

// 단일 통로 — 직접 OpenAI SDK 호출 금지
aiImageGateway.generate(input): Promise<{ url, costUsd, latencyMs }>
```

### 4.3 새 프롬프트 모듈

`lib/prompts/cardNewsImagePrompt.ts` — 슬라이드 텍스트 → 이미지 프롬프트 (Claude/GPT가 만듦, 영어로 작성하여 gpt-image-1 적합도 ↑):

```
input:  { slide.role, slide.title, slide.body, brandKit.tone, brandKit.colors, industry, season }
output: english image prompt, 60-120 words, ends with "no text in image"
```

핵심 프롬프트 규칙:
1. **항상 "no text in image"로 종료** — 한글이든 영문이든 텍스트 미생성
2. **컬러 팔레트는 hex 명시** — 브랜드킷 그대로
3. **무드 형용사 3-5개** — 톤 v3에서 추출 ("warm", "calm", "traditional Korean")
4. **negative space 명시** — 한글 오버레이가 들어갈 영역
5. **시드 단어 동일 주입** — 6장 일관성

### 4.4 Canvas 오버레이

`lib/canvas/cardNewsCompose.ts` — 클라이언트 사이드 합성:

```ts
compose(bgImageUrl, slide, brandKit): Blob (PNG)
// Pretendard / 나눔명조 (CSS @import → Canvas FontFace API)
// 슬라이드 번호, 로고 워터마크, 브랜드 컬러 액센트 자동
```

### 4.5 컴포넌트

```
components/content/cardnews-image/
├── CardNewsImageGenerator.tsx      # 메인 컨테이너 (mockup 06의 좌측)
├── SlideCard.tsx                   # 단일 슬라이드 카드 + 액션
├── SlideCanvas.tsx                 # 미리보기 (배경 img + 텍스트 div 합성)
├── StyleControlBar.tsx             # 프리셋 / 컬러 / 사이즈 / 시드
├── BrandConsistencyPanel.tsx       # 우측 패널
└── ExportMenu.tsx                  # zip / 캐러셀 메타 / Figma / PDF
```

### 4.6 API 라우트

```
POST /api/ai/cardnews-image
  body: { contentId, slideIndex?, regenerateAll?: boolean, styleSeed?: string }
  → 슬라이드 1개 또는 전체 N개 비동기 생성. 작업은 잡 큐로 fan-out.

POST /api/contents/[id]/cardnews-image/export
  body: { format: 'zip' | 'carousel-meta' | 'figma-json' | 'pdf' }
  → Supabase Storage에서 가져와 합성 후 다운로드 URL 응답
```

### 4.7 스토리지 경로

```
storage://cardnews/{client_id}/{content_id}/
  ├ slide-01-bg.png        # AI 원본
  ├ slide-01-final.png     # Canvas 합성 후 (텍스트 오버레이)
  ├ slide-02-bg.png
  └ ...
```

비공개 버킷 + signed URL (1h 만료). PII는 처음부터 안 들어감.

---

## 5. 새 요구사항 (REQUIREMENTS.md 추가 대상)

### Card News Image Generation — F10+ (CIMG)

- [ ] **CIMG-01**: 카드뉴스 텍스트가 생성된 콘텐츠에서 슬라이드별 이미지 생성을 트리거할 수 있다
- [ ] **CIMG-02**: 슬라이드 텍스트 + 브랜드킷에서 영어 이미지 프롬프트가 자동 생성되며, 사용자가 편집 가능하다
- [ ] **CIMG-03**: gpt-image-1 호출이 `lib/ai/image-gateway.ts` 단일 통로를 통과하며 토큰·비용·latency가 `prompt_logs`에 기록된다
- [ ] **CIMG-04**: 6장 한 세트가 같은 `style_seed`로 생성되어 시각 일관성이 유지된다
- [ ] **CIMG-05**: 이미지 위에 한글 텍스트는 절대 새기지 않는다 — 모든 한글은 Canvas 오버레이로 합성된다
- [ ] **CIMG-06**: Canvas 오버레이는 Pretendard / 나눔명조 폰트와 브랜드 컬러를 자동 적용한다
- [ ] **CIMG-07**: 사이즈 1080×1350 (4:5) / 1080×1080 (1:1) 옵션을 선택할 수 있다
- [ ] **CIMG-08**: 스타일 프리셋(정통 / 모던 / 감성 / 일러스트) 변경 시 6장 모두 재생성된다
- [ ] **CIMG-09**: 시각 가드레일(사장님 얼굴 / 경쟁 로고 / 의료 시술 시각화 등) 위반 자동 감지 시 검토 큐에 플래그된다
- [ ] **CIMG-10**: 슬라이드 단위 재생성·변형(같은 프롬프트, 다른 시드) 지원
- [ ] **CIMG-11**: 이미지는 Supabase Storage 비공개 버킷 + signed URL로 보관된다
- [ ] **CIMG-12**: 전체 슬라이드를 PNG zip / 인스타 캐러셀 메타 JSON / Figma JSON(베타) / CMYK PDF로 내보낼 수 있다
- [ ] **CIMG-13**: 이미지 일/월 비용 한도(전역·에이전시·클라이언트별)가 텍스트 한도와 별도로 운영되며 초과 시 429로 사전 차단된다

### Out-of-Scope에서 활성으로 이동
- ~~AAI-04: 이미지 직접 생성~~ → **F10+ 카드뉴스 한정으로 v1 활성**. 다른 콘텐츠 종류(블로그 썸네일 / 상세페이지 hero 등)의 이미지 생성은 v1.x

### 새로 OOS에 명시
- 이미지 인페인팅(부분 수정), 이미지 변환(스타일 트랜스퍼), 사람 얼굴 합성, 영상 합성 — v2

---

## 6. 페이즈 위치

**Phase 5 (Long-form Content Cluster) 확장** — F10 카드뉴스 텍스트 다음에 자연스럽게 붙는 단계.
- Phase 5 진입 전 추가 리서치 항목에 포함:
  - gpt-image-1 한글 인접 렌더링 실측 (50장 샘플로 negative space 일관성 확인)
  - Canvas FontFace API 한글 폰트 로딩 latency 벤치마크
  - 이미지 생성 비용 실측 (medium vs high 품질 차이)

대안: Phase 5.5로 별도 페이즈 분리 가능. 권고는 Phase 5에 포함 — 카드뉴스는 텍스트 + 이미지가 한 묶음으로 의미가 있음.

---

## 7. 가장 큰 리스크 3가지

| 리스크 | 완화 |
|---|---|
| **gpt-image-1이 negative space 약속 안 지킴** → 이미지에 의도치 않은 글자/잡음 | 프롬프트에 "no text" "no signage" 강제 + critic LLM이 출력 이미지에서 OCR로 텍스트 감지 → 발견 시 자동 재생성 |
| **6장 시각 일관성 깨짐** | style_seed 통일 + 동일 system prompt + 첫 장 결과를 reference image로 다음 장에 주입 (gpt-image-1 referencing 지원) |
| **비용 폭주** (디자이너가 재생성 무한 클릭) | 슬라이드별 재생성 일일 5회 한도 + 클라이언트별 월 $50 default cap + 실시간 KRW 표시 |

---

*Next: REQUIREMENTS.md에 CIMG 카테고리 13개 추가 → ROADMAP.md Phase 5 확장 → PROJECT.md Key Decisions 업데이트 → 커밋 → Vercel 자동 재배포.*
