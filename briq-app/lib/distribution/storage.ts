// 분배 상태 영구 저장 — localStorage 기반 (Supabase 마이그레이션 시 같은 API 유지).

import type { PlatformId } from "@/lib/content/multi-channel-types";
import type {
  CampaignDistribution,
  DistributionLogEvent,
  DistributionStatus,
  PlatformConnection,
  PlatformDistributionState,
  WebhookConfig,
} from "./types";

const K = {
  campaign: (key: string) => `briq:distribution:campaign:${key}`,
  log: () => `briq:distribution:log`,
  connections: () => `briq:distribution:connections`,
  webhook: () => `briq:distribution:webhook`,
};

// ─────────────────────────────────────────────────────────────────────────────
// 캠페인별 플랫폼 분배 상태
// ─────────────────────────────────────────────────────────────────────────────

export function campaignKey(brandId: string, topic: string): string {
  // 간단 해시 — Postgres 마이그레이션 시 캠페인 ID 로 교체
  let h = 2166136261;
  for (let i = 0; i < topic.length; i++) {
    h ^= topic.charCodeAt(i);
    h = (h * 16777619) >>> 0;
  }
  return `${brandId}__${(h >>> 0).toString(36)}`;
}

export function loadCampaignDistribution(key: string): CampaignDistribution | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(K.campaign(key));
    return raw ? (JSON.parse(raw) as CampaignDistribution) : null;
  } catch {
    return null;
  }
}

export function saveCampaignDistribution(cd: CampaignDistribution) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(K.campaign(cd.key), JSON.stringify(cd));
  } catch {
    /* ignore quota */
  }
}

export function initCampaignDistribution(
  brandId: string,
  topic: string,
  platformIds: PlatformId[],
): CampaignDistribution {
  const key = campaignKey(brandId, topic);
  const existing = loadCampaignDistribution(key);
  if (existing) {
    // 새 플랫폼이 추가됐다면 채워넣음
    for (const id of platformIds) {
      if (!existing.platforms[id]) {
        existing.platforms[id] = { platformId: id, status: "draft" };
      }
    }
    return existing;
  }
  const platforms: Record<string, PlatformDistributionState> = {};
  for (const id of platformIds) platforms[id] = { platformId: id, status: "draft" };
  const cd: CampaignDistribution = {
    key,
    brandId,
    topic,
    createdAt: new Date().toISOString(),
    platforms,
  };
  saveCampaignDistribution(cd);
  return cd;
}

export function updatePlatformStatus(
  cd: CampaignDistribution,
  platformId: PlatformId,
  patch: Partial<PlatformDistributionState>,
): CampaignDistribution {
  const next: CampaignDistribution = {
    ...cd,
    platforms: {
      ...cd.platforms,
      [platformId]: {
        ...(cd.platforms[platformId] ?? { platformId, status: "draft" as DistributionStatus }),
        ...patch,
        platformId,
      },
    },
  };
  saveCampaignDistribution(next);
  return next;
}

// ─────────────────────────────────────────────────────────────────────────────
// 분배 로그
// ─────────────────────────────────────────────────────────────────────────────

const LOG_MAX = 200;

export function loadLog(): DistributionLogEvent[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(K.log());
    return raw ? (JSON.parse(raw) as DistributionLogEvent[]) : [];
  } catch {
    return [];
  }
}

export function appendLog(ev: Omit<DistributionLogEvent, "id" | "at"> & { at?: string }) {
  if (typeof window === "undefined") return;
  const log = loadLog();
  const next: DistributionLogEvent = {
    id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    at: ev.at ?? new Date().toISOString(),
    brandId: ev.brandId,
    platformId: ev.platformId,
    action: ev.action,
    detail: ev.detail,
  };
  const trimmed = [next, ...log].slice(0, LOG_MAX);
  try {
    localStorage.setItem(K.log(), JSON.stringify(trimmed));
    window.dispatchEvent(new CustomEvent("briq:distribution-log-updated"));
  } catch {
    /* ignore quota */
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 플랫폼 연결 상태 (계정 인증 mock — 실 OAuth 는 Phase 3)
// ─────────────────────────────────────────────────────────────────────────────

export const DEFAULT_CONNECTIONS: PlatformConnection[] = [
  { id: "instagram-cardnews", label: "Instagram 피드", mode: "api", connected: true },
  { id: "instagram-caption", label: "Instagram 캡션", mode: "api", connected: true },
  { id: "instagram-reels", label: "Instagram 릴스", mode: "api", connected: true },
  { id: "naver-place", label: "네이버 플레이스", mode: "manual", connected: true, note: "스마트플레이스 매니저로 직접 발행 — 한국 소상공인 1순위 채널" },
  { id: "naver-blog", label: "네이버 블로그", mode: "manual", connected: false, note: "공식 API 종료 — 발행 보조" },
  { id: "naver-clip", label: "네이버 클립", mode: "manual", connected: false },
  { id: "facebook", label: "페이스북", mode: "api", connected: true },
  { id: "threads", label: "스레드", mode: "webhook", connected: false, note: "Make/Zapier 위임" },
  { id: "tiktok", label: "틱톡", mode: "webhook", connected: false },
  { id: "youtube-shorts", label: "유튜브 쇼츠", mode: "webhook", connected: false },
  { id: "kakao-channel", label: "카카오 채널", mode: "manual", connected: true },
];

export function loadConnections(): PlatformConnection[] {
  if (typeof window === "undefined") return DEFAULT_CONNECTIONS;
  try {
    const raw = localStorage.getItem(K.connections());
    if (!raw) return DEFAULT_CONNECTIONS;
    const parsed = JSON.parse(raw) as PlatformConnection[];
    // 새 플랫폼 추가 시 머지
    const known = new Set(parsed.map((p) => p.id));
    const merged = [...parsed];
    for (const def of DEFAULT_CONNECTIONS) {
      if (!known.has(def.id)) merged.push(def);
    }
    return merged;
  } catch {
    return DEFAULT_CONNECTIONS;
  }
}

export function saveConnections(conns: PlatformConnection[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(K.connections(), JSON.stringify(conns));
    window.dispatchEvent(new CustomEvent("briq:distribution-connections-updated"));
  } catch {
    /* ignore */
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Webhook 설정
// ─────────────────────────────────────────────────────────────────────────────

export function loadWebhook(): WebhookConfig {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(K.webhook());
    return raw ? (JSON.parse(raw) as WebhookConfig) : {};
  } catch {
    return {};
  }
}

export function saveWebhook(cfg: WebhookConfig) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(K.webhook(), JSON.stringify(cfg));
    window.dispatchEvent(new CustomEvent("briq:distribution-webhook-updated"));
  } catch {
    /* ignore */
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Status 라벨 / 색 매핑
// ─────────────────────────────────────────────────────────────────────────────

export const STATUS_LABEL: Record<DistributionStatus, string> = {
  draft: "초안",
  ready: "준비됨",
  scheduled: "예약됨",
  published: "발행됨",
  failed: "실패",
  skipped: "건너뜀",
};

export const STATUS_TONE: Record<DistributionStatus, { bg: string; text: string; dot: string }> = {
  draft: { bg: "bg-zinc-100 dark:bg-zinc-900", text: "text-zinc-600 dark:text-zinc-400", dot: "bg-zinc-400" },
  ready: { bg: "bg-amber-50 dark:bg-amber-500/10", text: "text-amber-700 dark:text-amber-300", dot: "bg-amber-500" },
  scheduled: { bg: "bg-sky-50 dark:bg-sky-500/10", text: "text-sky-700 dark:text-sky-300", dot: "bg-sky-500" },
  published: { bg: "bg-emerald-50 dark:bg-emerald-500/10", text: "text-emerald-700 dark:text-emerald-300", dot: "bg-emerald-500" },
  failed: { bg: "bg-rose-50 dark:bg-rose-500/10", text: "text-rose-700 dark:text-rose-300", dot: "bg-rose-500" },
  skipped: { bg: "bg-zinc-100 dark:bg-zinc-900", text: "text-zinc-500", dot: "bg-zinc-300" },
};
