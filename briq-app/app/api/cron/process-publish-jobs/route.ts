// Vercel Cron → GET/POST /api/cron/process-publish-jobs
//
// 스케줄: vercel.json "*/5 * * * *" (5분마다). 인증: `Authorization: Bearer ${CRON_SECRET}`.
// due 상태의 auto 발행 잡을 어댑터로 처리하고 상태머신을 갱신한다.

import "server-only";
import { NextResponse, type NextRequest } from "next/server";

import { processPublishJobs } from "@/lib/publishing/process-jobs";

export const runtime = "nodejs";
export const maxDuration = 300;

async function handle(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const result = await processPublishJobs();
  return NextResponse.json({ ok: true, ...result });
}

export async function GET(req: NextRequest) {
  return handle(req);
}

export async function POST(req: NextRequest) {
  return handle(req);
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
