// 분배 실 동작 어댑터.
//
// 세 가지 경로:
//   · webhook  — 외부 자동화 (Make/Zapier/n8n) 로 fire-and-forget POST.
//   · api      — 플랫폼 공식 API 호출. 토큰 미설정 시 명시적 실패.
//   · manual   — 클립보드 복사 + 발행 페이지 새 탭 오픈.
//
// 모두 결과를 SendResult 로 통일해 호출부에서 한 결로 처리한다.

import type { PlatformId } from "@/lib/content/multi-channel-types";
import type { WebhookConfig } from "./types";

export type SendResult =
  | { ok: true; mode: "webhook" | "api" | "manual"; detail: string }
  | { ok: false; mode: "webhook" | "api" | "manual"; reason: string };

export type SendPayload = {
  platform: PlatformId;
  brandId: string;
  brandName: string;
  campaign: string;
  scheduledAt?: string;
  primary: string;
  blocks: { label: string; value: string }[];
};

// ─────────────────────────────────────────────────────────────────────────────
// Webhook — 외부 자동화로 fire-and-forget POST.
// CORS 가 막혀도 사용자 자동화 시나리오에 도착하면 성공. 실패 사유는 명시적으로 노출.
// ─────────────────────────────────────────────────────────────────────────────

export async function sendViaWebhook(payload: SendPayload, cfg: WebhookConfig): Promise<SendResult> {
  if (!cfg.url) {
    return { ok: false, mode: "webhook", reason: "Webhook URL 미설정 — 설정 모달에서 등록 필요" };
  }
  try {
    const body = {
      type: "distribute",
      platform: payload.platform,
      brandId: payload.brandId,
      brandName: payload.brandName,
      campaign: payload.campaign,
      scheduledAt: payload.scheduledAt,
      content: {
        primary: payload.primary,
        blocks: payload.blocks,
      },
      at: new Date().toISOString(),
    };
    const res = await fetch(cfg.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(cfg.secret ? { "X-Webhook-Secret": cfg.secret } : {}),
      },
      body: JSON.stringify(body),
      // Make/Zapier 는 즉시 200/202 반환. 일부는 CORS no-cors 만 받는다.
      // 우선 cors 모드로 시도하고 실패하면 no-cors fallback.
      mode: "cors",
    });
    if (res.ok) {
      return { ok: true, mode: "webhook", detail: `Webhook 응답 ${res.status} · ${new URL(cfg.url).host}` };
    }
    return { ok: false, mode: "webhook", reason: `Webhook 응답 ${res.status}` };
  } catch (e) {
    // CORS 실패 시 — 사용자 자동화엔 이미 도착했을 가능성. no-cors 로 한 번 더 시도.
    try {
      await fetch(cfg.url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform: payload.platform,
          brandId: payload.brandId,
          campaign: payload.campaign,
          primary: payload.primary,
        }),
        mode: "no-cors",
      });
      return {
        ok: true,
        mode: "webhook",
        detail: `Webhook 전송 완료 (no-cors · 응답 미확인) · ${new URL(cfg.url).host}`,
      };
    } catch {
      return {
        ok: false,
        mode: "webhook",
        reason: e instanceof Error ? `네트워크 오류 — ${e.message}` : "네트워크 오류",
      };
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// API — Instagram Graph / Facebook Pages / 카카오 채널 등 공식 API.
// MVP: 토큰 미설정 시 명시적 실패. 실 호출은 Phase 3 (서버사이드 OAuth 흐름) 에서.
// ─────────────────────────────────────────────────────────────────────────────

const API_TOKEN_KEYS: Partial<Record<PlatformId, string>> = {
  "instagram-cardnews": "briq:api-token:instagram",
  "instagram-caption": "briq:api-token:instagram",
  "instagram-reels": "briq:api-token:instagram",
  "facebook": "briq:api-token:facebook",
};

export function getApiToken(platform: PlatformId): string | null {
  if (typeof window === "undefined") return null;
  const k = API_TOKEN_KEYS[platform];
  if (!k) return null;
  try {
    return localStorage.getItem(k);
  } catch {
    return null;
  }
}

export function setApiToken(platform: PlatformId, token: string): void {
  if (typeof window === "undefined") return;
  const k = API_TOKEN_KEYS[platform];
  if (!k) return;
  try {
    if (token) localStorage.setItem(k, token);
    else localStorage.removeItem(k);
  } catch {
    /* ignore */
  }
}

export async function sendViaApi(payload: SendPayload): Promise<SendResult> {
  const token = getApiToken(payload.platform);
  if (!token) {
    return {
      ok: false,
      mode: "api",
      reason: "API 토큰 미설정 — 연결 상태 스트립에서 토큰을 입력하거나 Webhook 경로로 전환",
    };
  }
  // 실 API 호출은 서버사이드 OAuth 가 필요 — 현재는 토큰 존재만 검증.
  // 다음 단계(Phase 3)에서 /api/distribute/[platform] 라우트로 라우팅.
  return {
    ok: false,
    mode: "api",
    reason: "API 직결은 다음 단계에서 활성화됩니다 (토큰 등록됨 — 서버 OAuth 흐름 대기)",
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Manual — 클립보드 복사 + 발행 페이지 새 탭 오픈.
// 사용자 동작으로 트리거되는 경우에만 호출. (브라우저 팝업 차단 회피)
// ─────────────────────────────────────────────────────────────────────────────

const MANUAL_PUBLISH_URL: Partial<Record<PlatformId, string>> = {
  "naver-place": "https://new.smartplace.naver.com/",
  "naver-blog": "https://blog.naver.com/PostWriteForm.naver",
  "naver-clip": "https://clip.naver.com/",
  "kakao-channel": "https://center-pf.kakao.com",
  "threads": "https://www.threads.net",
  "tiktok": "https://www.tiktok.com/upload",
  "youtube-shorts": "https://www.youtube.com/upload",
};

export async function sendViaManual(payload: SendPayload): Promise<SendResult> {
  const fullText = formatForClipboard(payload);
  try {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(fullText);
    }
  } catch {
    /* clipboard 실패해도 계속 — 새 탭은 열어준다 */
  }
  const url = MANUAL_PUBLISH_URL[payload.platform];
  if (url && typeof window !== "undefined") {
    window.open(url, "_blank", "noopener,noreferrer");
    return {
      ok: true,
      mode: "manual",
      detail: `복사 + 발행 페이지 새 탭 오픈 · ${new URL(url).host}`,
    };
  }
  return {
    ok: true,
    mode: "manual",
    detail: "클립보드 복사 완료 — 발행 페이지를 직접 열어 붙여넣으세요",
  };
}

function formatForClipboard(p: SendPayload): string {
  const parts: string[] = [p.primary];
  for (const b of p.blocks) {
    parts.push("");
    parts.push(`[${b.label}]`);
    parts.push(b.value);
  }
  return parts.join("\n");
}
