// GET /api/channels/status — 채널 연결 실상태 (현재 instagram 만 실연동).
// 인증 사용자. configured(자격증명 설정 여부) + connected(연결 여부) 반환.

import "server-only";
import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";

import { getAuthedUser } from "@/lib/billing/auth-helper";
import { adminDb } from "@/lib/db/admin";
import { channelConnections } from "@/lib/db/schema";
import { isInstagramConfigured } from "@/lib/publishing/registry";

export const runtime = "nodejs";

export async function GET() {
  const auth = await getAuthedUser();
  if (!auth.ok) return auth.response;

  const [ig] = await adminDb
    .select({ connected: channelConnections.connected, ref: channelConnections.externalAccountId })
    .from(channelConnections)
    .where(and(eq(channelConnections.userId, auth.user.id), eq(channelConnections.channel, "instagram")))
    .limit(1);

  return NextResponse.json({
    ok: true,
    configured: { instagram: isInstagramConfigured() },
    connections: {
      instagram: { connected: !!ig?.connected, externalAccountId: ig?.ref ?? null },
    },
  });
}
