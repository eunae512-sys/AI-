// Vercel Cron → POST /api/cron/recurring-billing
//
// 스케줄: vercel.json 의 "0 0 * * *" = UTC 00:00 = KST 09:00 매일
// 인증: `Authorization: Bearer ${CRON_SECRET}` 헤더 검증.
//       Vercel Cron 은 자동으로 이 헤더를 붙인다.

import "server-only";

import { NextResponse, type NextRequest } from "next/server";

import { runRecurringBilling } from "@/lib/billing/recurring";

export const runtime = "nodejs";
export const maxDuration = 300; // Vercel: 최대 5분 (이 한도는 Pro 플랜 기준)

export async function POST(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const result = await runRecurringBilling();
  return NextResponse.json(result);
}

// GET 도 허용 — Vercel Cron 은 GET 으로 호출.
export async function GET(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const result = await runRecurringBilling();
  return NextResponse.json(result);
}

function authorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    console.error("[cron] CRON_SECRET 미설정");
    return false;
  }
  const header = req.headers.get("authorization") ?? "";
  return header === `Bearer ${secret}`;
}
