// GET /api/billing/me
//
// 로그인 사용자의 결제 상태를 한 번에 반환:
//   · 활성 카드 (없으면 null)
//   · 활성 구독 (없으면 null)
//   · 최근 결제 내역 5건

import "server-only";

import { and, desc, eq, inArray, isNull } from "drizzle-orm";
import { NextResponse } from "next/server";

import { adminDb } from "@/lib/db/admin";
import {
  billingKeys,
  paymentHistory,
  subscriptions,
} from "@/lib/db/schema";
import { getAuthedUser } from "@/lib/billing/auth-helper";

export const runtime = "nodejs";

export async function GET() {
  const auth = await getAuthedUser();
  if (!auth.ok) return auth.response;

  const [card] = await adminDb
    .select({
      id: billingKeys.id,
      cardCompany: billingKeys.cardCompany,
      cardNumberMasked: billingKeys.cardNumberMasked,
      cardType: billingKeys.cardType,
      createdAt: billingKeys.createdAt,
    })
    .from(billingKeys)
    .where(and(eq(billingKeys.userId, auth.user.id), isNull(billingKeys.deletedAt)))
    .limit(1);

  const [sub] = await adminDb
    .select()
    .from(subscriptions)
    .where(
      and(
        eq(subscriptions.userId, auth.user.id),
        inArray(subscriptions.status, ["trialing", "active", "past_due"]),
      ),
    )
    .limit(1);

  const history = await adminDb
    .select({
      id: paymentHistory.id,
      orderId: paymentHistory.orderId,
      amount: paymentHistory.amount,
      status: paymentHistory.status,
      receiptUrl: paymentHistory.receiptUrl,
      paidAt: paymentHistory.paidAt,
      requestedAt: paymentHistory.requestedAt,
      failureCode: paymentHistory.failureCode,
      failureMessage: paymentHistory.failureMessage,
    })
    .from(paymentHistory)
    .where(eq(paymentHistory.userId, auth.user.id))
    .orderBy(desc(paymentHistory.requestedAt))
    .limit(5);

  return NextResponse.json({
    card: card ?? null,
    subscription: sub ?? null,
    history,
  });
}
