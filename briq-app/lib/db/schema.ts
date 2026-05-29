// Drizzle ORM 스키마 — Toss 자동결제 + 구독 상태 + 사용량.
//
// 디자인 원칙
//  · auth.users 의 id (uuid) 를 모든 사용자 테이블의 외래키 / RLS 기준으로 사용.
//  · "마지막 활성 구독" 같은 파생값은 컬럼이 아니라 쿼리로 — 진실은 항상 1개.
//  · 결제 사이드는 멱등성(idempotency_key, order_id) 으로 두 번 처리되지 않도록.
//  · 카드 raw 값은 절대 저장 X — Toss 가 반환한 마스킹 정보만.

import { sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

// ───────────────────────────────────────────────
// Enums
// ───────────────────────────────────────────────

export const planIdEnum = pgEnum("plan_id", ["free", "pro", "studio", "agency"]);

export const subscriptionStatusEnum = pgEnum("subscription_status", [
  "trialing", // 14일 무료체험 중
  "active", // 정상 결제 중
  "past_due", // 결제 실패 retry 중
  "cancelled", // 해지 완료
]);

export const billingCycleEnum = pgEnum("billing_cycle", ["monthly", "annual"]);

export const paymentStatusEnum = pgEnum("payment_status", [
  "pending", // Toss 호출 직전
  "paid", // 결제 성공
  "failed", // 결제 실패
  "cancelled", // 환불 / 취소
]);

export const webhookStatusEnum = pgEnum("webhook_status", [
  "received",
  "processed",
  "failed",
]);

// ───────────────────────────────────────────────
// profiles — auth.users 1:1 확장
// ───────────────────────────────────────────────
//
// auth.users 는 Supabase 가 관리하므로 여기서는 외래키 텍스트만 보관.
// 가입 trigger 가 자동으로 행을 만든다 (0001_rls_and_triggers.sql 참조).

export const profiles = pgTable(
  "profiles",
  {
    id: uuid("id").primaryKey(), // = auth.users.id
    email: text("email").notNull(),
    displayName: text("display_name"),

    // 현재 활성 플랜의 캐시 — 진실은 subscriptions 테이블, 여기는 hot-path 조회용
    planId: planIdEnum("plan_id").notNull().default("free"),

    // 현재 활성 구독의 종료일 (캐시) — cron 이 매일 만료 체크할 때 단일 인덱스 스캔
    currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }),
    trialEndsAt: timestamp("trial_ends_at", { withTimezone: true }),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    emailIdx: index("profiles_email_idx").on(t.email),
    periodEndIdx: index("profiles_period_end_idx").on(t.currentPeriodEnd),
  }),
);

// ───────────────────────────────────────────────
// billing_keys — Toss 자동결제용 카드 토큰
// ───────────────────────────────────────────────
//
// 한 사용자는 동시에 1개만 활성. 카드 교체 시 기존 행은 deletedAt 으로 soft-delete.
// customerKey 는 사용자별 UUID v4 — 한 번 만들면 재사용 (Toss 권장).

export const billingKeys = pgTable(
  "billing_keys",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull(),

    // Toss
    tossBillingKey: text("toss_billing_key").notNull(),
    customerKey: text("customer_key").notNull(), // 사용자별 1개, 영구

    // 마스킹된 카드 정보 (raw 값은 절대 X)
    cardCompany: text("card_company"), // "신한카드"
    cardNumberMasked: text("card_number_masked"), // "신한 4330-****-****-1234"
    cardType: text("card_type"), // "체크" | "신용"
    issuerCode: text("issuer_code"),
    ownerType: text("owner_type"), // "개인" | "법인"

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (t) => ({
    userActiveIdx: index("billing_keys_user_active_idx")
      .on(t.userId)
      .where(sql`deleted_at IS NULL`),
    customerKeyUq: unique("billing_keys_customer_key_uq").on(t.customerKey),
  }),
);

// ───────────────────────────────────────────────
// subscriptions — 구독 상태 = 진실
// ───────────────────────────────────────────────
//
// 한 사용자에게 active/trialing 행은 동시에 최대 1개 (부분 UNIQUE는 SQL 마이그레이션에서).
// 해지된 행은 히스토리로 남는다.

export const subscriptions = pgTable(
  "subscriptions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull(),

    planId: planIdEnum("plan_id").notNull(),
    status: subscriptionStatusEnum("status").notNull(),
    billingCycle: billingCycleEnum("billing_cycle").notNull(),

    billingKeyId: uuid("billing_key_id"), // billingKeys.id

    // 기간
    trialEndsAt: timestamp("trial_ends_at", { withTimezone: true }),
    currentPeriodStart: timestamp("current_period_start", { withTimezone: true }).notNull(),
    currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }).notNull(),

    // 가격 스냅샷 (요금 변경되더라도 이 구독 시점 가격 보존)
    priceAmount: integer("price_amount").notNull(), // 원, 한 사이클당 청구액

    // 실패 retry 카운트 (status=past_due 일 때)
    failureCount: integer("failure_count").notNull().default(0),
    lastFailureAt: timestamp("last_failure_at", { withTimezone: true }),

    // 해지 메타
    cancelAtPeriodEnd: boolean("cancel_at_period_end").notNull().default(false),
    cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
    cancelReason: text("cancel_reason"),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    userIdx: index("subscriptions_user_idx").on(t.userId),
    statusEndIdx: index("subscriptions_status_period_end_idx").on(t.status, t.currentPeriodEnd),
  }),
);

// ───────────────────────────────────────────────
// payment_history — 청구 시도/결과
// ───────────────────────────────────────────────
//
// orderId 는 우리가 생성한 멱등 키. Toss paymentKey 는 성공 시에만 채워짐.

export const paymentHistory = pgTable(
  "payment_history",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull(),
    subscriptionId: uuid("subscription_id").notNull(),

    // 우리가 만든 orderId (UUID) — Toss 에 보낼 멱등 키
    orderId: text("order_id").notNull(),

    // Toss 응답
    tossPaymentKey: text("toss_payment_key"),
    method: text("method"), // "카드" 등
    receiptUrl: text("receipt_url"),

    amount: integer("amount").notNull(), // 원
    status: paymentStatusEnum("status").notNull(),

    // 실패 시
    failureCode: text("failure_code"),
    failureMessage: text("failure_message"),

    requestedAt: timestamp("requested_at", { withTimezone: true }).notNull().defaultNow(),
    paidAt: timestamp("paid_at", { withTimezone: true }),
  },
  (t) => ({
    orderIdUq: unique("payment_history_order_id_uq").on(t.orderId),
    userIdx: index("payment_history_user_idx").on(t.userId),
    subIdx: index("payment_history_subscription_idx").on(t.subscriptionId),
  }),
);

// ───────────────────────────────────────────────
// usage_monthly — 월 단위 사용량 카운터
// ───────────────────────────────────────────────
//
// (userId, yearMonth) 가 PK. 매월 1일 KST 에 새 row 가 만들어지고 기존은 보존.

export const usageMonthly = pgTable(
  "usage_monthly",
  {
    userId: uuid("user_id").notNull(),
    yearMonth: text("year_month").notNull(), // "2026-05"

    cardnewsCount: integer("cardnews_count").notNull().default(0),
    blogCount: integer("blog_count").notNull().default(0),
    aiImageCount: integer("ai_image_count").notNull().default(0),

    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.userId, t.yearMonth] }),
  }),
);

// ───────────────────────────────────────────────
// webhook_events — Toss 웹훅 멱등 처리
// ───────────────────────────────────────────────
//
// idempotencyKey 는 Toss eventId 또는 (eventType + paymentKey) 조합.
// service_role 만 read/write — RLS 정책에서 보장.

export const webhookEvents = pgTable(
  "webhook_events",
  {
    id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
    idempotencyKey: text("idempotency_key").notNull(),
    eventType: text("event_type").notNull(),
    payload: jsonb("payload").notNull(),
    status: webhookStatusEnum("status").notNull().default("received"),

    receivedAt: timestamp("received_at", { withTimezone: true }).notNull().defaultNow(),
    processedAt: timestamp("processed_at", { withTimezone: true }),
    errorMessage: text("error_message"),
  },
  (t) => ({
    idempotencyUq: unique("webhook_events_idempotency_uq").on(t.idempotencyKey),
    statusIdx: index("webhook_events_status_idx").on(t.status),
  }),
);

// ───────────────────────────────────────────────
// 타입 익스포트 — 앱 코드에서 재사용
// ───────────────────────────────────────────────

export type Profile = typeof profiles.$inferSelect;
export type NewProfile = typeof profiles.$inferInsert;

export type BillingKey = typeof billingKeys.$inferSelect;
export type NewBillingKey = typeof billingKeys.$inferInsert;

export type Subscription = typeof subscriptions.$inferSelect;
export type NewSubscription = typeof subscriptions.$inferInsert;

export type PaymentHistoryRow = typeof paymentHistory.$inferSelect;
export type NewPaymentHistoryRow = typeof paymentHistory.$inferInsert;

export type UsageMonthly = typeof usageMonthly.$inferSelect;
export type NewUsageMonthly = typeof usageMonthly.$inferInsert;

export type WebhookEvent = typeof webhookEvents.$inferSelect;
export type NewWebhookEvent = typeof webhookEvents.$inferInsert;
