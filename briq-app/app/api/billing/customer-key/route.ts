// POST /api/billing/customer-key
//
// 로그인 사용자의 Toss customerKey 를 발급/조회.
//  · 이미 활성 billing_keys 행이 있으면 그 customerKey 재사용
//  · 없으면 새 UUID 생성. 단 아직 billing_keys 행은 만들지 않음 (authKey 콜백 시 INSERT)
//
// 응답: { customerKey: string }
//
// 사용처: 프론트가 Toss SDK 의 requestBillingAuth() 호출 직전에 customerKey 를 받는다.

import "server-only";

import { and, eq, isNull } from "drizzle-orm";
import { NextResponse } from "next/server";

import { adminDb } from "@/lib/db/admin";
import { billingKeys } from "@/lib/db/schema";
import { getAuthedUser } from "@/lib/billing/auth-helper";
import { newCustomerKey } from "@/lib/billing/billing-domain";

export const runtime = "nodejs";

export async function POST() {
  const auth = await getAuthedUser();
  if (!auth.ok) return auth.response;

  const existing = await adminDb
    .select({ customerKey: billingKeys.customerKey })
    .from(billingKeys)
    .where(and(eq(billingKeys.userId, auth.user.id), isNull(billingKeys.deletedAt)))
    .limit(1);

  const customerKey = existing[0]?.customerKey ?? newCustomerKey();

  return NextResponse.json({ customerKey });
}
