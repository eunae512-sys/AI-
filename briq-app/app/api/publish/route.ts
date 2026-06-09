// POST /api/publish — 생성물을 발행 큐에 등록(enqueue).
//
// 인증 사용자만. (발행은 AI 생성이 아니므로 quota 게이팅 없이 인증만.)
// auto 채널은 cron 처리기가 자동 발행, assisted 채널은 큐에 남아 후속 핸드오프.

import "server-only";
import { NextResponse, type NextRequest } from "next/server";

import { getAuthedUser } from "@/lib/billing/auth-helper";
import { adminDb } from "@/lib/db/admin";
import { publishJobs } from "@/lib/db/schema";
import { getCapability, isPublishChannel } from "@/lib/publishing/registry";
import type { PublishAsset } from "@/lib/publishing/types";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const auth = await getAuthedUser();
  if (!auth.ok) return auth.response;

  let body: Record<string, unknown> = {};
  try {
    body = (await req.json()) ?? {};
  } catch {
    body = {};
  }

  const channel = body.channel;
  if (!isPublishChannel(channel)) {
    return NextResponse.json({ ok: false, error: "유효하지 않은 채널" }, { status: 400 });
  }
  const asset = (body.asset ?? {}) as PublishAsset;
  if (!asset || typeof asset !== "object") {
    return NextResponse.json({ ok: false, error: "발행 자산(asset)이 비었습니다" }, { status: 400 });
  }

  let scheduledFor: Date | null = null;
  if (typeof body.scheduledFor === "string") {
    const d = new Date(body.scheduledFor);
    if (!Number.isNaN(d.getTime())) scheduledFor = d;
  }

  const [job] = await adminDb
    .insert(publishJobs)
    .values({
      userId: auth.user.id,
      channel,
      capability: getCapability(channel),
      status: "queued",
      payload: asset,
      scheduledFor,
    })
    .returning({ id: publishJobs.id });

  return NextResponse.json({ ok: true, jobId: job.id, capability: getCapability(channel) });
}
