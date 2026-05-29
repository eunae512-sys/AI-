// GET /api/billing/auth/success?authKey=...&customerKey=...
//
// Toss billingAuth 성공 후 redirect 콜백.
//  1. authKey 를 billingKey 로 교환 (POST /v1/billing/authorizations/issue)
//  2. billing_keys 에 INSERT — 기존 활성 키는 deletedAt 으로 soft-delete
//  3. /billing/success?... 로 사용자 redirect (UI 페이지가 친절히 안내)
//
// 실패하면 /billing/fail?reason=... 로 redirect.

import "server-only";

import { and, eq, isNull } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";

import { adminDb } from "@/lib/db/admin";
import { billingKeys } from "@/lib/db/schema";
import { getAuthedUser } from "@/lib/billing/auth-helper";
import { issueBillingKey, TossApiError } from "@/lib/billing/toss-server";

export const runtime = "nodejs";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const authKey = url.searchParams.get("authKey");
  const customerKey = url.searchParams.get("customerKey");

  if (!authKey || !customerKey) {
    return NextResponse.redirect(
      `${APP_URL}/billing/fail?reason=missing_params`,
    );
  }

  const auth = await getAuthedUser();
  if (!auth.ok) {
    // 인증 없이 callback 으로 진입한 경우 → 로그인 후 다시 시도
    return NextResponse.redirect(`${APP_URL}/login?next=/pricing`);
  }

  try {
    const resp = await issueBillingKey({ authKey, customerKey });

    // 기존 활성 카드 soft-delete (한 사용자 = 활성 카드 1장)
    await adminDb
      .update(billingKeys)
      .set({ deletedAt: new Date() })
      .where(
        and(eq(billingKeys.userId, auth.user.id), isNull(billingKeys.deletedAt)),
      );

    await adminDb.insert(billingKeys).values({
      userId: auth.user.id,
      tossBillingKey: resp.billingKey,
      customerKey: resp.customerKey,
      cardCompany: resp.cardCompany ?? null,
      cardNumberMasked: resp.card?.number ?? null,
      cardType: resp.card?.cardType ?? null,
      issuerCode: resp.card?.issuerCode ?? null,
      ownerType: resp.card?.ownerType ?? null,
    });

    return NextResponse.redirect(`${APP_URL}/billing/success`);
  } catch (err) {
    const code =
      err instanceof TossApiError ? err.code : "issue_billing_key_failed";
    console.error("[billing/auth/success]", err);
    return NextResponse.redirect(
      `${APP_URL}/billing/fail?reason=${encodeURIComponent(code)}`,
    );
  }
}
