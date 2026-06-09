// Mock 발행 어댑터 (Phase 0 — 개발/스모크용)
//
// ⚠️ 실제 발행이 아닙니다. 외부 SNS 로 아무것도 게시하지 않습니다.
// enqueue→cron 처리→상태머신 end-to-end 흐름을 닫기 위한 자리표시자.
// Phase 1 에서 InstagramAdapter 등 실연동으로 교체/추가.

import type { PublishAdapter, PublishAsset, PublishChannel, PublishCapability, PublishResult } from "../types";

export class MockPublishAdapter implements PublishAdapter {
  constructor(
    public readonly channel: PublishChannel = "instagram",
    public readonly capability: PublishCapability = "auto",
  ) {}

  async isConnected(): Promise<boolean> {
    return true; // mock: 항상 연결됨으로 간주
  }

  async publish(userId: string, asset: PublishAsset): Promise<PublishResult> {
    // 실제 API 호출 없음 — 성공으로 시뮬레이션하고 가짜 외부 ref 반환.
    const ref = `mock://${this.channel}/${userId.slice(0, 8)}/${(asset.sourceId ?? "post")}`;
    return { ok: true, externalRef: ref };
  }
}
