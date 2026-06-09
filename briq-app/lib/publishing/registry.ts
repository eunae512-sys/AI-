// 채널 → 발행 어댑터 레지스트리 (Phase 0)
//
// 지금은 전 채널이 Mock. 자동 채널(instagram/youtube/tiktok)은 auto mock,
// 반자동 채널(naver_blog/kakao)은 assisted mock — capability 만 정확히 구분해
// 처리기/ UI 가 자동 vs 반자동을 올바르게 분기하도록 한다.
// Phase 1+ 에서 채널별 실 어댑터로 교체.

import { MockPublishAdapter } from "./adapters/mock";
import type { PublishAdapter, PublishCapability, PublishChannel } from "./types";

const CAPABILITY: Record<PublishChannel, PublishCapability> = {
  instagram: "auto",
  youtube: "auto",
  tiktok: "auto",
  naver_blog: "assisted",
  kakao: "assisted",
};

const VALID_CHANNELS = Object.keys(CAPABILITY) as PublishChannel[];

export function isPublishChannel(v: unknown): v is PublishChannel {
  return typeof v === "string" && (VALID_CHANNELS as string[]).includes(v);
}

export function getCapability(channel: PublishChannel): PublishCapability {
  return CAPABILITY[channel];
}

export function getAdapter(channel: PublishChannel): PublishAdapter {
  // Phase 0: 전부 Mock. capability 만 채널별로 정확히 반영.
  return new MockPublishAdapter(channel, CAPABILITY[channel]);
}
