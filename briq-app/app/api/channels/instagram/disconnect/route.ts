// POST /api/channels/instagram/disconnect — 연결 해제(토큰 폐기).
// 인증 사용자. channel_connections 행 삭제(토큰까지 제거).

import "server-only";
import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";

import { getAuthedUser } from "@/lib/billing/auth-helper";
import { adminDb } from "@/lib/db/admin";
import { channelConnections } from "@/lib/db/schema";

export const runtime = "nodejs";

export async function POST() {
  const auth = await getAuthedUser();
  if (!auth.ok) return auth.response;

  await adminDb
    .delete(channelConnections)
    .where(and(eq(channelConnections.userId, auth.user.id), eq(channelConnections.channel, "instagram")));

  return NextResponse.json({ ok: true });
}
