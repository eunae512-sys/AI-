# 발행 연동 로드맵 (Publishing Integration Roadmap)

> 작성일: 2026-06-09 · 대상: BRIQ (AI 마케팅 운영 플랫폼)
> 배경: 현재 채널연결·예약·발행은 전부 **데모 시뮬레이션**(`ChannelsScreen.tsx` 명시 — "실제 SNS 계정과 연결되지 않습니다"). 실제 소셜 발행 API 연동 0건(읽기 전용 `analyze-naver-blogs` SERP 분석만 존재). 핵심 가치("직원 1명 처리량 2배")는 발행이 자동이어야 성립 → 현재는 "운영 플랫폼"이 아니라 "초안 생성기".

## 설계 원칙

1. **정직성 우선.** 공식 발행 API가 있는 채널만 "자동"으로 표기. 없는 채널은 "반자동(검수 후 붙여넣기)" 배지를 명확히 — 자동인 척 금지(CLAUDE.md 정직성 #7).
2. **한 채널이라도 닫힌 고리부터.** 생성→예약→자동발행→성과까지 한 번 닫는 게 제품 가치의 분기점. 데모 채널 확장 금지.
3. **HITL 유지.** 발행 전 검수(`/review-queue`) 통과 건만 발행. KFTC "AI 생성 콘텐츠" 라벨·#AI생성 해시태그를 발행본에 보장.

---

## 0. 채널 현실 분류 (2026 기준 — 출시 전 각 플랫폼 정책 재검증 필요)

| 채널 | 공식 발행 API | 자동발행 | 전제조건 / 블로커 |
|------|----------------|----------|-------------------|
| **인스타그램** | Graph **Content Publishing API** | ✅ 가능 | IG **비즈니스/크리에이터** 계정 + FB 페이지 연결, Meta 앱 **App Review** + 사업자 인증, 이미지=공개 URL |
| **유튜브 쇼츠** | YouTube Data API `videos.insert` | ✅ 가능 | Google OAuth, 영상 파일, 미검증 앱 할당 제한(심사 시 해제) |
| **틱톡** | Content Posting API | ✅ 가능 | TikTok 앱 심사(direct post audit), 영상 |
| **네이버 블로그** | ❌ 일반 글쓰기 API 사실상 없음 | ⚠️ 반자동 | 공식 발행 API 미제공 → 클립보드+글쓰기 딥링크 유지 |
| **네이버 플레이스(스마트플레이스)** | ❌ 파트너 전용·제한적 | ⚠️ 반자동 | 소상공인 직접 발행 API 없음 |
| **카카오 채널** | ❌ 피드 자동발행 빈약(스토리 종료) | ⚠️ 반자동 | 알림톡/친구톡은 템플릿 심의·발신프로필(별개 영역) |
| **메타/구글 유료광고** | 가능하나 commerce review | 🚫 v2 | PROJECT.md 범위 밖 |

> **냉정한 결론:** 소상공인 핵심인 네이버·카카오는 공식 자동발행이 막혀 있음. 진짜 자동이 되는 건 인스타·유튜브·틱톡. → "인스타 1채널을 진짜로" 만드는 게 사활.

---

## 단계별 로드맵

### Phase 0 — 발행 인프라 기반 (2~3주) · *코드 없는 약속을 코드로*
지금 `ChannelsScreen`/`scheduler`/`distribution`은 전부 데모. 실발행의 토대부터.

- **토큰 저장소**: Supabase `channel_connections`(userId, channel, access/refresh token **암호화**, scope, expiresAt). RLS로 격리. PIPA — 토큰은 서버 전용, 클라 노출 금지.
- **발행 잡 큐**: Trigger.dev v3(스택 권장)로 `publish_jobs` — 예약 시각·재시도·상태머신(`queued→processing→published/failed`). 현 데모 큐를 실제 잡으로 교체.
- **발행 상태 UI**: `distribution` 로그를 실제 잡 상태에 바인딩(성공/실패/재시도, 실패 사유 표시). KFTC 라벨·#AI생성 발행 시점 보장.
- **산출물**: "예약하면 실제로 큐에 잡이 잡히고 상태가 닫힌다"(발행 어댑터는 아직 mock 1개).

### Phase 1 — 인스타그램 실발행 MVP (3~5주) · ★최우선·제품 증명
생성→예약→**자동 발행**→상태 닫힘을 **한 채널로 완성**.

- Meta 앱 생성 + **App Review**(`instagram_content_publish`, `pages_show_list`, `business_management`) + 사업자 인증. (리드타임 길어 **가장 먼저 착수**)
- 사장님 온보딩: "인스타 비즈니스 전환 + FB 페이지 연결" 가이드(여기서 이탈 많음 → 단계 최소화·체크리스트).
- 발행 어댑터: 이미지/카드뉴스(carousel)/릴스. 이미지 공개 URL은 이미 Supabase Storage(`briq-assets`, public) 보유 → 바로 활용.
- 캡션+해시태그+첫 댓글 자동 배치. 검수(`/review-queue`) 통과 건만 발행(HITL Waitpoint).
- **이게 되면** "예쁜 생성기"에서 "운영 플랫폼"으로 넘어가는 변곡점.

### Phase 2 — 영상 채널 (유튜브 쇼츠 + 틱톡) (3~4주)
- 릴스/쇼츠 생성물(현 Pexels/fal 영상)을 실제 업로드.
- YouTube Data API `videos.insert`(Shorts), TikTok Content Posting API. 각 앱 심사.
- 영상 채널이 붙으면 "쇼츠 자동 홍보" 카피가 비로소 사실이 됨.

### Phase 3 — 반자동 채널 정직 고도화 (2주)
- 네이버 블로그/플레이스·카카오: **자동 불가를 인정**하고 마찰만 제거.
  - 본문/이미지 클립보드 자동복사 + 글쓰기 딥링크 + "여기 붙여넣기" 1스텝 가이드(현 방식 다듬기).
  - UI에 **"반자동(검수 후 붙여넣기)" 배지** 명확히 — 자동인 척 금지.
  - "예약" = 발행 가능 채널은 자동, 반자동 채널은 "지금 올릴 시간이에요" 알림 + 원클릭 복사.

### Phase 4 — 성과 닫힌 고리 (3주) · *재구독 근거*
- 인스타 Insights API로 발행물 **실제 reach/저장/댓글** 수집 → 대시보드 데모 수치를 **실데이터로 교체**.
- "이 카피/이 사진이 실제로 더 잘 됐다"를 보여줘야 사장님이 계속 결제함. (현재 가장 비어 있는 축)

---

## 기술 아키텍처

```
생성(현존) → 검수(/review-queue, HITL) → publish_jobs 큐(Trigger.dev)
   → 채널 어댑터(adapter 패턴: instagram/youtube/tiktok = 자동, naver/kakao = 반자동 핸드오프)
   → 상태머신·재시도·로그(distribution) → 성과 수집(insights) → 대시보드 실데이터
```

- **어댑터 패턴**: `PublishAdapter { connect(); publish(asset); fetchInsights() }` — 채널별 구현, `capability: "auto" | "assisted"` 플래그로 UI가 자동/반자동 표기.
- **토큰 갱신**: refresh 토큰 cron(만료 전 갱신), 실패 시 "재연결 필요" 알림.
- **교체 대상(현 데모)**: `components/channels/ChannelsScreen.tsx`(연결 시뮬), `components/distribution/*`(발행 로그), `app/(app)/scheduler`(데모 큐).

## 규제·리스크 체크

- **PIPA**: SNS 토큰·고객정보 서버 전용 암호화, LLM에 PII 전달 금지(기존 DLP 유지).
- **KFTC**: AI 생성물 라벨이 **발행본에도** 유지되는지 어댑터에서 보장.
- **플랫폼 정책**: 자동발행 남용 시 계정 제한 — 발행 빈도 throttle, 스팸성 차단.
- **App Review 리드타임**(메타/틱톡 수주 소요)이 일정의 최대 변수 → Phase 1 착수와 동시에 심사 신청.

## 추천 시작점

> **Phase 0 + Phase 1(인스타)** 만 먼저. "한 채널이라도 생성→자동발행→성과가 닫히는" 증명이 제품 가치를 가르는 분기점. 그 전에 채널을 넓히면 "데모 채널만 늘어나는" 함정.

### 즉시 착수 가능한 첫 작업 (Phase 0 첫 PR)
- `channel_connections` Supabase 스키마 + Drizzle 마이그레이션 + RLS
- Trigger.dev `publish_jobs` 잡 골격(상태머신·재시도) + 어댑터 인터페이스 `PublishAdapter`
- `distribution` UI를 실제 잡 상태에 바인딩(mock 어댑터 1개로 end-to-end 흐름 검증)
