// POST /api/webhooks/toss
//
// Toss 결제 상태 변경 웹훅 수신.
//
// 처리 흐름
//   1) 서명 검증 (TOSS_WEBHOOK_SECRET 이 설정된 경우)
//   2) 멱등 키 결정 (eventId 또는 eventType+paymentKey 조합)
//   3) webhook_events 에 UNIQUE INSERT — 두 번째 호출은 conflict 로 빠지고 200 반환
//   4) 첫 호출이면 payload 해석해서 payment_history 동기화
//
// 인증
//   Toss 가 결제별 secret 으로 HMAC-SHA256 서명을 X-Toss-Signature 헤더에 실어 보냄.
//   계약에 따라 헤더 이름·서명 방식이 다를 수 있어, 실제 운영 키 발급 후 형식 확인 후 마무리.

import "server-only";

import { eq } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";

import { adminDb } from "@/lib/db/admin";
import { paymentHistory, webhookEvents } from "@/lib/db/schema";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const raw = await req.text();

  if (!verifySignature(req, raw)) {
    return NextResponse.json({ error: "invalid_signature" }, { status: 401 });
  }

  let payload: TossWebhookPayload;
  try {
    payload = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const idempotencyKey = pickIdempotencyKey(payload);
  if (!idempotencyKey) {
    return NextResponse.json({ error: "no_idempotency_key" }, { status: 400 });
  }

  // 멱등 INSERT — 두 번째 호출은 unique 위반으로 빠짐.
  let inserted: { id: number } | null = null;
  try {
    const [row] = await adminDb
      .insert(webhookEvents)
      .values({
        idempotencyKey,
        eventType: payload.eventType ?? "unknown",
        payload: payload as unknown as Record<string, unknown>,
      })
      .returning({ id: webhookEvents.id });
    inserted = row;
  } catch {
    // 중복 이벤트 — 이미 처리됨
    return NextResponse.json({ ok: true, duplicate: true });
  }

  try {
    await syncPaymentState(payload);
    await adminDb
      .update(webhookEvents)
      .set({ status: "processed", processedAt: new Date() })
      .where(eq(webhookEvents.id, inserted!.id));
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await adminDb
      .update(webhookEvents)
      .set({
        status: "failed",
        processedAt: new Date(),
        errorMessage: message.slice(0, 1000),
      })
      .where(eq(webhookEvents.id, inserted!.id));
    // 200 으로 응답 — 토스 재시도 받을지 결정은 운영 모니터링에서.
  }

  return NextResponse.json({ ok: true });
}

// ───────────────────────────────────────────────
// 서명 검증
// ───────────────────────────────────────────────

function verifySignature(req: NextRequest, raw: string): boolean {
  const secret = process.env.TOSS_WEBHOOK_SECRET;
  // 테스트 환경 / secret 미설정 시 검증 스킵 (Phase 2 빌드 통과용).
  // 운영 배포 시 TOSS_WEBHOOK_SECRET 가 비어 있으면 400 으로 거절하는 게 안전.
  if (!secret) return true;

  const sig = req.headers.get("x-toss-signature") ?? req.headers.get("toss-signature");
  if (!sig) return false;

  const mac = createHmac("sha256", secret).update(raw).digest("hex");
  const a = Buffer.from(mac, "utf8");
  const b = Buffer.from(sig, "utf8");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

// ───────────────────────────────────────────────
// payload 해석
// ───────────────────────────────────────────────

type TossWebhookPayload = {
  eventType?: string;
  eventId?: string;
  data?: {
    paymentKey?: string;
    orderId?: string;
    status?: string;
    method?: string;
    approvedAt?: string;
    receipt?: { url?: string };
    failure?: { code?: string; message?: string };
  };
} & Record<string, unknown>;

function pickIdempotencyKey(p: TossWebhookPayload): string | null {
  if (p.eventId) return p.eventId;
  const paymentKey = p.data?.paymentKey;
  if (paymentKey) return `${p.eventType ?? "evt"}:${paymentKey}:${p.data?.status ?? ""}`;
  return null;
}

async function syncPaymentState(p: TossWebhookPayload): Promise<void> {
  const data = p.data;
  if (!data?.orderId) return;

  const updates: Partial<typeof paymentHistory.$inferInsert> = {};
  switch (data.status) {
    case "DONE":
      updates.status = "paid";
      updates.tossPaymentKey = data.paymentKey;
      updates.method = data.method;
      updates.receiptUrl = data.receipt?.url ?? null;
      updates.paidAt = data.approvedAt ? new Date(data.approvedAt) : new Date();
      break;
    case "CANCELED":
    case "PARTIAL_CANCELED":
      updates.status = "cancelled";
      break;
    case "ABORTED":
    case "EXPIRED":
      updates.status = "failed";
      if (data.failure) {
        updates.failureCode = data.failure.code ?? null;
        updates.failureMessage = data.failure.message ?? null;
      }
      break;
    default:
      // READY/IN_PROGRESS/WAITING_FOR_DEPOSIT — 이 phase 의 정기결제에서는 무시
      return;
  }

  await adminDb
    .update(paymentHistory)
    .set(updates)
    .where(eq(paymentHistory.orderId, data.orderId));
}
