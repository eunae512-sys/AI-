// 발행 잡 처리기 (Phase 0) — cron 이 호출.
//
// status=queued · capability=auto · (scheduled_for IS NULL OR <= now) 인 잡을
// 어댑터로 발행하고 상태머신을 갱신한다:
//   queued → processing → published (성공)
//                       → queued    (재시도 가능 + attempts < maxAttempts)
//                       → failed    (비재시도 또는 attempts 소진)
// assisted 채널(naver/kakao)은 자동 발행 대상이 아니므로 처리하지 않는다(큐에 남겨 둠 →
// 후속 Phase 에서 "지금 올릴 시간" 알림/핸드오프로 소비).

import "server-only";
import { and, asc, eq, isNull, lte, or } from "drizzle-orm";

import { adminDb } from "@/lib/db/admin";
import { publishJobs } from "@/lib/db/schema";
import { getAdapter, isPublishChannel } from "./registry";
import type { PublishAsset } from "./types";

export type ProcessResult = {
  processed: number;
  published: number;
  failed: number;
  retried: number;
};

export async function processPublishJobs(limit = 20): Promise<ProcessResult> {
  const now = new Date();
  const due = await adminDb
    .select()
    .from(publishJobs)
    .where(
      and(
        eq(publishJobs.status, "queued"),
        eq(publishJobs.capability, "auto"),
        or(isNull(publishJobs.scheduledFor), lte(publishJobs.scheduledFor, now)),
      ),
    )
    .orderBy(asc(publishJobs.createdAt))
    .limit(limit);

  const res: ProcessResult = { processed: 0, published: 0, failed: 0, retried: 0 };

  for (const job of due) {
    res.processed++;
    const attempts = job.attempts + 1;

    // 잡 시작 표시 + 시도 횟수 증가
    await adminDb
      .update(publishJobs)
      .set({ status: "processing", attempts, updatedAt: new Date() })
      .where(eq(publishJobs.id, job.id));

    try {
      if (!isPublishChannel(job.channel)) {
        await fail(job.id, `지원하지 않는 채널: ${job.channel}`);
        res.failed++;
        continue;
      }
      const adapter = getAdapter(job.channel);
      const result = await adapter.publish(job.userId, (job.payload ?? {}) as PublishAsset);

      if (result.ok) {
        await adminDb
          .update(publishJobs)
          .set({ status: "published", resultRef: result.externalRef ?? null, errorMessage: null, updatedAt: new Date() })
          .where(eq(publishJobs.id, job.id));
        res.published++;
      } else if (result.retryable && attempts < job.maxAttempts) {
        // 다음 cron 틱에서 재시도
        await adminDb
          .update(publishJobs)
          .set({ status: "queued", errorMessage: result.error, updatedAt: new Date() })
          .where(eq(publishJobs.id, job.id));
        res.retried++;
      } else {
        await fail(job.id, result.error);
        res.failed++;
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (attempts < job.maxAttempts) {
        await adminDb
          .update(publishJobs)
          .set({ status: "queued", errorMessage: msg, updatedAt: new Date() })
          .where(eq(publishJobs.id, job.id));
        res.retried++;
      } else {
        await fail(job.id, msg);
        res.failed++;
      }
    }
  }

  return res;
}

async function fail(id: string, error: string): Promise<void> {
  await adminDb
    .update(publishJobs)
    .set({ status: "failed", errorMessage: error.slice(0, 500), updatedAt: new Date() })
    .where(eq(publishJobs.id, id));
}
