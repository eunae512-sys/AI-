# Billing 인프라 운영 가이드

Toss 자동결제(정기결제) 통합 작업의 운영 매뉴얼. Phase 단위로 실행되며 이 문서는 **사람이 직접 해야 하는 모든 절차**를 모아둔다. 코드 작업은 [`/Users/heoeunae/.claude/plans/bubbly-soaring-frost.md`](../../.claude/plans/bubbly-soaring-frost.md) 의 Phase 1~5 가 동기 진행한다.

---

## Phase 1 — DB 스키마 적용 (지금)

이 페이즈는 **테이블·RLS·트리거** 만 만든다. 실제 결제 호출은 없다.

### 1) 의존성 설치

```sh
cd briq-app
pnpm install   # 또는 npm install
```

추가된 패키지: `drizzle-orm`, `drizzle-kit`, `postgres`.

### 2) 환경변수 채우기

`.env.local` 에 다음 4개를 추가 (없으면 Supabase Studio 에서 발급):

```
DATABASE_URL=postgres://postgres.<ref>:<password>@aws-0-<region>.pooler.supabase.com:6543/postgres
SUPABASE_SERVICE_ROLE_KEY=...
# 아래 둘은 Phase 2 부터 사용. 지금 비어 있어도 Phase 1 동작.
NEXT_PUBLIC_TOSS_CLIENT_KEY=
TOSS_SECRET_KEY=
```

- `DATABASE_URL` 은 Supabase **Session pooler (포트 6543)** 문자열을 써야 한다. Transaction pooler(6543 이 아닌) 는 prepared statement 가 깨져서 Drizzle 과 충돌.
- `SUPABASE_SERVICE_ROLE_KEY` 는 **서버 전용**. 절대 `NEXT_PUBLIC_*` 로 노출 금지.

### 3) 마이그레이션 적용

두 가지 방법 중 하나:

**A. Supabase Studio (권장 — 안전)**

1. Supabase Dashboard → SQL Editor
2. `briq-app/drizzle/0000_init.sql` 내용 통째로 복붙 → Run
3. `briq-app/drizzle/0001_rls_and_triggers.sql` 내용 통째로 복붙 → Run

**B. Drizzle Kit (자동)**

```sh
pnpm db:push
```

`db:push` 는 schema.ts 와 DB 의 차이를 비교해 자동 ALTER 한다. 마이그레이션 파일을 직접 쓰지 않고, RLS / trigger 는 별도 SQL 파일이라 어쨌든 수동 실행 필요.

### 4) 검증

Supabase Studio 의 Table editor 에서 다음을 확인:

- [ ] 6개 테이블 생성: `profiles` / `billing_keys` / `subscriptions` / `payment_history` / `usage_monthly` / `webhook_events`
- [ ] 각 테이블 우상단 **RLS 아이콘이 켜져 있음**
- [ ] `Authentication → Users` 에 기존 사용자가 있으면 `profiles` 에 해당 행이 backfill 됨 (`plan_id=free`)
- [ ] 새 사용자가 회원가입하면 `profiles` 에 자동 row 생성 (Google 로그인 1회로 테스트)

다음 SQL 로 RLS 정책이 의도대로 동작하는지 확인:

```sql
-- service_role 로 실행
SELECT count(*) FROM profiles;  -- 전체 보임

-- authenticated 사용자 컨텍스트로 실행 (Supabase Studio → SQL Editor → Role: authenticated)
SELECT count(*) FROM profiles;  -- 본인 행 1건만 보여야 함
SELECT count(*) FROM webhook_events;  -- 0건 (정책 없음 = 모두 차단)
```

---

## Phase 2 — 결제 백엔드 API (지금)

이 페이즈에서 추가된 라우트:

| 메서드 | 경로 | 책임 |
|--------|------|------|
| POST | `/api/billing/customer-key` | 사용자 customerKey 발급/조회 |
| GET | `/api/billing/auth/success` | Toss billingAuth 콜백 → billingKey 발급 → DB 저장 |
| GET | `/api/billing/auth/fail` | Toss billingAuth 실패 콜백 |
| POST | `/api/billing/subscribe` | trialing 구독 생성 (+14일 trial) |
| POST | `/api/billing/cancel` | 다음 결제일에 해지 예약 |
| POST | `/api/billing/resume` | 해지 예약 취소 |
| GET\|POST | `/api/cron/recurring-billing` | Vercel Cron — 매일 KST 09:00 정기 청구 |
| POST | `/api/webhooks/toss` | Toss 웹훅 수신, 결제 상태 동기화 |

핵심 비즈니스 로직: `lib/billing/recurring.ts` (retry 1d/3d/7d → 4차 실패 시 hard cancel).

### 사용자가 해야 할 일

1. **Toss Client Key 발급 (PG 심사 통과 후)** — 현재 `NEXT_PUBLIC_TOSS_CLIENT_KEY=` 비어 있음.
   Phase 3 의 프론트 SDK 통합 진입 시점에 발급 필요.
2. **Toss 웹훅 URL 등록 (배포 후)**
   - 가맹점 대시보드 → 개발자센터 → 웹훅
   - URL: `https://<배포도메인>/api/webhooks/toss`
   - 발급된 webhook secret 을 `.env.local` 의 `TOSS_WEBHOOK_SECRET` 에 입력
3. **Vercel Cron 활성화**
   - Vercel Dashboard → Project → Settings → Cron Jobs 에서 `vercel.json` 의 `0 0 * * *` 스케줄 확인
   - Vercel **Pro 플랜** 필요 (Hobby 는 cron 1일 1회 제한)
   - 환경변수 `CRON_SECRET` 이 Vercel Production env 에도 동일하게 등록돼 있어야 함

### 로컬 수동 검증

```sh
# 서버 켜기
pnpm dev

# cron 수동 트리거 (별 터미널)
curl -X POST http://localhost:3000/api/cron/recurring-billing \
  -H "Authorization: Bearer $CRON_SECRET"
# → { "scannedAt": "...", "totalCandidates": 0, ... } 형태 응답이면 OK
```

`totalCandidates: 0` 은 정상 — Phase 3 에서 구독이 만들어진 다음 검증.

## Phase 3 — 프론트 결제 흐름 (완료)

추가된 페이지:
- `/billing/success` & `/billing/fail` — Toss redirect 도착
- `/(app)/settings/billing` — 카드·구독·내역·해지/재개
- `components/billing/SubscribeButton.tsx` — 모든 SDK 진입점

온보딩 마지막 단계가 `selectedPlan ≠ free` 면 Toss 결제창으로 redirect.
Toss Client Key 가 비면 SubscribeButton 자동 disable. PG 심사 통과 전에는
공식 published 테스트 키(`test_ck_D5GePWvyJnrK0W0k6q8gLzN97Eoq`) 로 운영.

## Phase 4 — 사용량 · 플랜 서버화 (완료)

추가된 라우트:
- GET `/api/usage` — 현재 월 사용량 + 활성 플랜 + 한도
- POST `/api/usage` — 트랜잭션 기반 카운터 증분 (한도 초과 시 403)
- GET `/api/billing/me` — 카드·구독·결제내역 5건

`lib/billing/usage.ts` 의 `incrementUsage()` 는 호출자 시그니처는 그대로
유지하면서 백그라운드에 fire-and-forget 으로 서버 동기화. `useUsage()`
훅은 마운트 시 서버 fetch 우선 → 401 시 localStorage fallback.

서버 사이드 enforcement 가 필요한 API (예: `/api/generate-blog`) 는
`lib/billing/gate-server.ts` 의 `ensurePlanAndQuota({ feature, usage })` 호출.

## Phase 5 — 법적 페이지 + 사업자정보 (완료)

추가된 페이지:
- `/terms` — 이용약관
- `/privacy` — 개인정보처리방침 (PIPA 표준, 위탁 4사 명시)
- `/refund-policy` — 환불 · 정기결제 정책

사업자 정보 단일 출처: `app/legal/business-info.ts` — `BUSINESS_INFO` 객체.
사업자 정보 표시 컴포넌트: `components/layout/BusinessFooter.tsx`
랜딩 footer 의 "준비 중" placeholder 가 실제 3개 법적 페이지 링크 + 사업자
정보 블록으로 교체.

### ⚠️ Phase 5 — 사용자 직접 갱신 필수

`app/legal/business-info.ts` 의 `BUSINESS_INFO` 객체에 다음 7개 값이
**placeholder("준비중") 로 들어가 있음** — 사업자등록증·통신판매업 신고증을
보고 운영 배포 전 반드시 채울 것.

- `companyName` — 상호명
- `representative` — 대표자
- `businessRegistrationNo` — 사업자등록번호
- `ecommerceRegistrationNo` — 통신판매업 신고번호
- `address` — 사업장 주소
- `phone` — 고객센터 전화
- `email` — 고객센터 이메일

---

## 🟦 PG 심사 통과 후 해야 할 일

1. **Toss 운영 Client Key / Secret Key 발급** → `.env` 의
   `NEXT_PUBLIC_TOSS_CLIENT_KEY` / `TOSS_SECRET_KEY` 의 테스트 키 교체
2. **Toss 가맹점 대시보드 → 웹훅 등록**
   - URL: `https://<배포도메인>/api/webhooks/toss`
   - 발급된 webhook secret → `TOSS_WEBHOOK_SECRET`
3. **Vercel Pro 플랜 확인** — cron 동작
4. **사업자정보 7개 갱신** (위 ⚠️ 참조)
5. **첫 라이브 결제 검증** — Toss 테스트 카드 `4330-1234-1234-1234`
   → /billing/success → trialing 구독 row 생성 → 14일 후 cron 첫 청구 확인
