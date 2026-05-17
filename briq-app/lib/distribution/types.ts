// 콘텐츠 분배 시스템 타입.
//
// 한 캠페인이 8 플랫폼에 어떤 결로 분배되는지를 표현한다.
// 각 플랫폼은 자기 상태·예약 시간·연결 여부·발행 채널 결을 가진다.

import type { PlatformId } from "@/lib/content/multi-channel-types";

export type DistributionStatus =
  | "draft"      // 초안 — 아직 결정 안 함
  | "ready"      // 검토 완료, 큐 등록 대기
  | "scheduled"  // 발행 시간 예약됨
  | "published"  // 발행 완료
  | "failed"     // 발행 실패
  | "skipped";   // 이 플랫폼 건너뜀

/** 플랫폼 분배 유형.
 *   api      — 플랫폼 API 직결 가능 (Meta·TikTok 등 정식 API)
 *   webhook  — Make/Zapier 같은 외부 자동화로 위임
 *   manual   — API 없음, 사용자가 직접 복사·붙여넣기 (네이버 블로그·클립 등)
 */
export type DistributionMode = "api" | "webhook" | "manual";

export type PlatformConnection = {
  id: PlatformId;
  label: string;
  mode: DistributionMode;
  connected: boolean;
  note?: string;
};

export type PlatformDistributionState = {
  platformId: PlatformId;
  status: DistributionStatus;
  /** ISO 시각 — 예약된 발행 시간 */
  scheduledAt?: string;
  /** 마지막 분배 시도 시각 (ISO) */
  lastActionAt?: string;
  /** 실패 시 사유 */
  errorReason?: string;
};

/** 분배 상태 — 캠페인 1건의 8 플랫폼 현황 */
export type CampaignDistribution = {
  /** 캠페인 식별자 — `${brandId}::${topicHash}` */
  key: string;
  brandId: string;
  topic: string;
  createdAt: string;
  /** 플랫폼별 상태 — keyed by platformId */
  platforms: Record<string, PlatformDistributionState>;
};

/** 분배 로그 이벤트 */
export type DistributionLogEvent = {
  id: string;          // ulid-like
  at: string;          // ISO
  brandId: string;
  platformId: PlatformId;
  action: "queue" | "schedule" | "publish" | "copy" | "skip" | "fail" | "webhook";
  detail: string;
};

/** 외부 자동화 (Make / Zapier) 연결 */
export type WebhookConfig = {
  url?: string;
  secret?: string;
  /** 마지막 ping 성공 여부 */
  lastPingOk?: boolean;
  lastPingAt?: string;
};
