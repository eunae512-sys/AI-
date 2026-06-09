// GET /api/channels/instagram/connect — Meta OAuth 동의 화면으로 리다이렉트.
//
// 자격증명(META_APP_ID 등) 미설정이면 정직하게 503(연동 미설정) 안내.
// 로그인 필요. CSRF state 를 httpOnly 쿠키로 보관해 callback 에서 검증.

import "server-only";
import { NextResponse, type NextRequest } from "next/server";
import { randomBytes } from "node:crypto";

import { getAuthedUser } from "@/lib/billing/auth-helper";
import { isInstagramConfigured } from "@/lib/publishing/registry";

export const runtime = "nodejs";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
const SCOPES = [
  "instagram_content_publish",
  "instagram_basic",
  "pages_show_list",
  "pages_read_engagement",
  "business_management",
].join(",");

export async function GET(req: NextRequest) {
  if (!isInstagramConfigured()) {
    return NextResponse.json(
      { ok: false, error: "instagram_not_configured", message: "Instagram 연동이 아직 설정되지 않았습니다 (Meta 앱 심사·자격증명 필요)." },
      { status: 503 },
    );
  }
  const auth = await getAuthedUser();
  if (!auth.ok) {
    return NextResponse.redirect(`${APP_URL}/login?next=/channels`);
  }

  const state = randomBytes(16).toString("hex");
  const redirectUri = `${APP_URL}/api/channels/instagram/callback`;
  const dialog = new URL("https://www.facebook.com/v21.0/dialog/oauth");
  dialog.searchParams.set("client_id", process.env.META_APP_ID ?? "");
  dialog.searchParams.set("redirect_uri", redirectUri);
  dialog.searchParams.set("scope", SCOPES);
  dialog.searchParams.set("state", state);
  dialog.searchParams.set("response_type", "code");

  const res = NextResponse.redirect(dialog.toString());
  res.cookies.set("ig_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });
  return res;
}
