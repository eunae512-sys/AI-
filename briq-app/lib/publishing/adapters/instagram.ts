// Instagram 발행 어댑터 (Phase 1) — 실제 Instagram Graph Content Publishing API.
//
// 전제: 사장님이 IG 비즈니스/크리에이터 계정을 FB 페이지에 연결하고 OAuth 완료
//   → channel_connections 에 (암호화된) 장기 토큰 + externalAccountId(IG user id) 보관.
// 발행 흐름(Graph v21.0):
//   · 이미지   : media(image_url,caption) → media_publish(creation_id)
//   · 캐러셀   : media(is_carousel_item) ×N → media(CAROUSEL,children) → media_publish
//   · 릴스     : media(REELS,video_url) → status_code FINISHED 폴링 → media_publish
// ⚠️ 실제 발행은 Meta 앱 자격증명 + App Review + 연결된 IG 계정이 있어야 동작.

import "server-only";
import { eq, and } from "drizzle-orm";

import { adminDb } from "@/lib/db/admin";
import { channelConnections } from "@/lib/db/schema";
import { decryptToken } from "../crypto";
import type { PublishAdapter, PublishAsset, PublishResult } from "../types";

const GRAPH = "https://graph.facebook.com/v21.0";
const KFTC_TAG = "#AI생성";

type Conn = { token: string; igUserId: string };

async function loadConnection(userId: string): Promise<Conn | null> {
  const [row] = await adminDb
    .select()
    .from(channelConnections)
    .where(and(eq(channelConnections.userId, userId), eq(channelConnections.channel, "instagram")))
    .limit(1);
  if (!row || !row.connected || !row.accessToken || !row.externalAccountId) return null;
  if (row.expiresAt && row.expiresAt.getTime() < Date.now()) return null;
  let token: string;
  try {
    token = decryptToken(row.accessToken);
  } catch {
    return null;
  }
  return { token, igUserId: row.externalAccountId };
}

function buildCaption(asset: PublishAsset): string {
  const tags = (asset.hashtags ?? []).join(" ");
  let caption = [asset.caption ?? "", tags].filter(Boolean).join("\n\n");
  // KFTC — AI 생성물이면 라벨 해시태그 보장
  if (asset.aiLabeled && !caption.includes(KFTC_TAG)) {
    caption = caption ? `${caption} ${KFTC_TAG}` : KFTC_TAG;
  }
  return caption;
}

async function graphPost(path: string, params: Record<string, string>, token: string): Promise<{ ok: true; id: string } | { ok: false; error: string; retryable: boolean }> {
  const body = new URLSearchParams({ ...params, access_token: token });
  let res: Response;
  try {
    res = await fetch(`${GRAPH}/${path}`, { method: "POST", body });
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "network", retryable: true };
  }
  const json = (await res.json().catch(() => ({}))) as { id?: string; error?: { message?: string; code?: number } };
  if (!res.ok || !json.id) {
    const code = json.error?.code ?? res.status;
    // 5xx / rate-limit(4,17,32,613) → 재시도 가능, 그 외(잘못된 토큰·권한) → 비재시도
    const retryable = res.status >= 500 || [4, 17, 32, 613].includes(Number(code));
    return { ok: false, error: json.error?.message ?? `Graph ${res.status}`, retryable };
  }
  return { ok: true, id: json.id };
}

async function publishContainer(igUserId: string, creationId: string, token: string): Promise<PublishResult> {
  const pub = await graphPost(`${igUserId}/media_publish`, { creation_id: creationId }, token);
  return pub.ok ? { ok: true, externalRef: `ig://${pub.id}` } : { ok: false, error: pub.error, retryable: pub.retryable };
}

export class InstagramAdapter implements PublishAdapter {
  readonly channel = "instagram" as const;
  readonly capability = "auto" as const;

  async isConnected(userId: string): Promise<boolean> {
    return (await loadConnection(userId)) !== null;
  }

  async publish(userId: string, asset: PublishAsset): Promise<PublishResult> {
    const conn = await loadConnection(userId);
    if (!conn) return { ok: false, error: "Instagram 계정이 연결되지 않았습니다", retryable: false };
    const { token, igUserId } = conn;
    const caption = buildCaption(asset);
    const media = asset.mediaUrls ?? [];
    const isVideo = media.length === 1 && /\.(mp4|mov)(\?|$)/i.test(media[0]);

    if (media.length === 0) {
      return { ok: false, error: "발행할 이미지/영상이 없습니다", retryable: false };
    }

    // 릴스(단일 영상)
    if (isVideo) {
      const create = await graphPost(igUserId, { media_type: "REELS", video_url: media[0], caption }, token);
      if (!create.ok) return { ok: false, error: create.error, retryable: create.retryable };
      const ready = await waitForContainer(create.id, token);
      if (!ready.ok) return ready;
      return publishContainer(igUserId, create.id, token);
    }

    // 단일 이미지
    if (media.length === 1) {
      const create = await graphPost(igUserId, { image_url: media[0], caption }, token);
      if (!create.ok) return { ok: false, error: create.error, retryable: create.retryable };
      return publishContainer(igUserId, create.id, token);
    }

    // 캐러셀(이미지 2~10장)
    const childIds: string[] = [];
    for (const url of media.slice(0, 10)) {
      const child = await graphPost(igUserId, { image_url: url, is_carousel_item: "true" }, token);
      if (!child.ok) return { ok: false, error: child.error, retryable: child.retryable };
      childIds.push(child.id);
    }
    const carousel = await graphPost(igUserId, { media_type: "CAROUSEL", children: childIds.join(","), caption }, token);
    if (!carousel.ok) return { ok: false, error: carousel.error, retryable: carousel.retryable };
    return publishContainer(igUserId, carousel.id, token);
  }
}

// 릴스 컨테이너 인코딩 완료 대기 (status_code FINISHED). 최대 ~60초.
async function waitForContainer(containerId: string, token: string): Promise<PublishResult> {
  for (let i = 0; i < 20; i++) {
    await new Promise((r) => setTimeout(r, 3000));
    const res = await fetch(`${GRAPH}/${containerId}?fields=status_code&access_token=${encodeURIComponent(token)}`);
    const json = (await res.json().catch(() => ({}))) as { status_code?: string };
    if (json.status_code === "FINISHED") return { ok: true };
    if (json.status_code === "ERROR") return { ok: false, error: "릴스 인코딩 실패", retryable: false };
  }
  return { ok: false, error: "릴스 인코딩 시간 초과", retryable: true };
}
