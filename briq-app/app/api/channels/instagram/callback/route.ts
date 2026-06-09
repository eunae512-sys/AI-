// GET /api/channels/instagram/callback — Meta OAuth 콜백.
//
// code → 장기 토큰 교환 → 연결된 IG 비즈니스 계정 id 발견 → channel_connections 에
// 암호화 저장. 성공/실패는 /channels 로 리다이렉트(쿼리로 결과 전달).

import "server-only";
import { NextResponse, type NextRequest } from "next/server";

import { getAuthedUser } from "@/lib/billing/auth-helper";
import { adminDb } from "@/lib/db/admin";
import { channelConnections } from "@/lib/db/schema";
import { encryptToken } from "@/lib/publishing/crypto";
import { isInstagramConfigured } from "@/lib/publishing/registry";

export const runtime = "nodejs";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
const GRAPH = "https://graph.facebook.com/v21.0";

function back(result: string): NextResponse {
  return NextResponse.redirect(`${APP_URL}/channels?instagram=${result}`);
}

export async function GET(req: NextRequest) {
  if (!isInstagramConfigured()) return back("not_configured");

  const auth = await getAuthedUser();
  if (!auth.ok) return NextResponse.redirect(`${APP_URL}/login?next=/channels`);

  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const cookieState = req.cookies.get("ig_oauth_state")?.value;
  if (url.searchParams.get("error")) return back("denied");
  if (!code || !state || !cookieState || state !== cookieState) return back("bad_state");

  const appId = process.env.META_APP_ID ?? "";
  const appSecret = process.env.META_APP_SECRET ?? "";
  const redirectUri = `${APP_URL}/api/channels/instagram/callback`;

  try {
    // 1) code → 단기 토큰
    const tokRes = await fetch(
      `${GRAPH}/oauth/access_token?client_id=${appId}&client_secret=${appSecret}&redirect_uri=${encodeURIComponent(redirectUri)}&code=${encodeURIComponent(code)}`,
    );
    const tok = (await tokRes.json()) as { access_token?: string; error?: { message?: string } };
    if (!tok.access_token) return back("token_failed");

    // 2) 단기 → 장기(약 60일) 토큰
    const llRes = await fetch(
      `${GRAPH}/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${tok.access_token}`,
    );
    const ll = (await llRes.json()) as { access_token?: string; expires_in?: number };
    const longToken = ll.access_token ?? tok.access_token;
    const expiresAt = ll.expires_in ? new Date(Date.now() + ll.expires_in * 1000) : null;

    // 3) 연결된 페이지 → IG 비즈니스 계정 id 발견
    const pagesRes = await fetch(`${GRAPH}/me/accounts?fields=instagram_business_account,access_token&access_token=${longToken}`);
    const pages = (await pagesRes.json()) as { data?: { instagram_business_account?: { id: string }; access_token?: string }[] };
    const page = (pages.data ?? []).find((p) => p.instagram_business_account?.id);
    const igUserId = page?.instagram_business_account?.id;
    if (!igUserId) return back("no_ig_account");
    // 페이지 토큰이 있으면 발행에 더 적합(없으면 사용자 장기 토큰)
    const publishToken = page?.access_token ?? longToken;

    // 4) channel_connections upsert (토큰 암호화)
    const now = new Date();
    await adminDb
      .insert(channelConnections)
      .values({
        userId: auth.user.id,
        channel: "instagram",
        accessToken: encryptToken(publishToken),
        externalAccountId: igUserId,
        scope: "instagram_content_publish",
        connected: true,
        expiresAt,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: [channelConnections.userId, channelConnections.channel],
        set: {
          accessToken: encryptToken(publishToken),
          externalAccountId: igUserId,
          connected: true,
          expiresAt,
          updatedAt: now,
        },
      });

    return back("connected");
  } catch {
    return back("error");
  }
  // state 쿠키는 짧은 maxAge(600s)로 자동 만료.
}
