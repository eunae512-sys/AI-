// GET /api/billing/auth/fail?code=...&message=...
//
// Toss billingAuth 실패 시 redirect 콜백. 받은 사유를 그대로 /billing/fail 로 넘긴다.

import "server-only";

import { NextResponse, type NextRequest } from "next/server";

export const runtime = "nodejs";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code") ?? "unknown";
  const message = url.searchParams.get("message") ?? "";
  const params = new URLSearchParams({ reason: code });
  if (message) params.set("message", message);
  return NextResponse.redirect(`${APP_URL}/billing/fail?${params.toString()}`);
}
