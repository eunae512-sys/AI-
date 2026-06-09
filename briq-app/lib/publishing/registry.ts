// 채널 → 발행 어댑터 레지스트리 (Phase 0)
//
// 지금은 전 채널이 Mock. 자동 채널(instagram/youtube/tiktok)은 auto mock,
// 반자동 채널(naver_blog/kakao)은 assisted mock — capability 만 정확히 구분해
// 처리기/ UI 가 자동 vs 반자동을 올바르게 분기하도록 한다.
// Phase 1+ 에서 채널별 실 어댑터로 교체.

import { MockPublishAdapter } from "./adapters/mock";
import { InstagramAdapter } from "./adapters/instagram";
import type { PublishAdapter, PublishCapability, PublishChannel } from "./types";

/** 인스타 실연동 활성 조건 — Meta 앱 자격증명 + 토큰 암호화 키 설정 시. */
export function isInstagramConfigured(): boolean {
  return (
    (process.env.META_APP_ID ?? "").length > 0 &&
    (process.env.META_APP_SECRET ?? "").length > 0 &&
    (process.env.CHANNEL_TOKEN_KEY ?? "").length > 0
  );
}

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
  // Phase 1: 인스타는 자격증명 설정 시 실 어댑터, 아니면 mock(개발/스모크).
  // 나머지 채널은 후속 Phase 까지 mock(capability 만 정확).
  if (channel === "instagram" && isInstagramConfigured()) {
    return new InstagramAdapter();
  }
  return new MockPublishAdapter(channel, CAPABILITY[channel]);
}
