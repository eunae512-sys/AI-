// 사용량 트래킹 — 월별 카운터.
//
// 두 가지 백엔드를 지원:
//   1) 서버 (Supabase) — 로그인 사용자 / 운영 모드. 진실의 단일 출처.
//   2) localStorage — 비로그인 데모 / SSR fallback.
//
// 클라이언트 코드는 useUsage() 훅을 통해 일관된 API 로 접근. 이 파일의 함수들은
// 훅이 내부에서 호출하는 저수준 헬퍼.
//
// API 라우트: /api/usage (GET 조회, POST 증분)

import type { PlanId } from "./plans";
import { getPlan } from "./plans";

export type UsageKind = "cardnews" | "blog" | "aiImage";

export type Usage = {
  month: string; // "2026-05"
  cardnews: number;
  blog: number;
  aiImage: number;
};

const PLAN_KEY = "briq:active-plan";

// 현재 월 키 — 한국 시간 (UTC+9) 기준
export function currentMonth(): string {
  const now = new Date();
  const seoul = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
  const y = seoul.getFullYear();
  const m = String(seoul.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// localStorage 백엔드 (비로그인 데모용)
// ─────────────────────────────────────────────────────────────────────────────

function storageKey(month: string): string {
  return `briq:usage:${month}`;
}

export function loadUsageLocal(month: string = currentMonth()): Usage {
  if (typeof window === "undefined") {
    return { month, cardnews: 0, blog: 0, aiImage: 0 };
  }
  try {
    const raw = localStorage.getItem(storageKey(month));
    if (!raw) return { month, cardnews: 0, blog: 0, aiImage: 0 };
    const parsed = JSON.parse(raw) as Partial<Usage>;
    return {
      month,
      cardnews: parsed.cardnews ?? 0,
      blog: parsed.blog ?? 0,
      aiImage: parsed.aiImage ?? 0,
    };
  } catch {
    return { month, cardnews: 0, blog: 0, aiImage: 0 };
  }
}

export function saveUsageLocal(usage: Usage): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(storageKey(usage.month), JSON.stringify(usage));
    window.dispatchEvent(new CustomEvent("briq:usage-updated"));
  } catch {
    /* quota 무시 */
  }
}

export function incrementUsageLocal(kind: UsageKind, by: number = 1): Usage {
  const month = currentMonth();
  const cur = loadUsageLocal(month);
  const next: Usage = { ...cur, [kind]: cur[kind] + by };
  saveUsageLocal(next);
  return next;
}

// 하위 호환 — 기존 import 가 깨지지 않도록 같은 이름 유지.
// 새 코드는 useUsage() 훅을 사용하는 게 권장. 직접 호출 시:
//   loadUsage()      — 즉시 동기 반환 (localStorage). 서버 진실은 useUsage() refresh 로.
//   incrementUsage() — 동기 반환 + 백그라운드 서버 동기화 (fire-and-forget).
export const loadUsage = loadUsageLocal;
export const saveUsage = saveUsageLocal;

/**
 * 사용량 카운터 증분. localStorage 즉시 반영하고 서버에도 비동기로 동기화.
 *
 * 서버에서 한도 초과를 발견하면 응답 무시 (이미 클라이언트에 보였으므로) — 다음
 * useUsage() refresh 가 진실값을 가져온다. 한도를 사전에 정확히 막고 싶다면
 * API 라우트에서 ensurePlanAndQuota() 를 사용할 것.
 */
export function incrementUsage(kind: UsageKind, by: number = 1): Usage {
  const result = incrementUsageLocal(kind, by);
  if (typeof window !== "undefined") {
    void incrementUsageServer(kind, by).catch(() => {
      // 401/503 등은 로그만, 데모 동작은 유지
    });
  }
  return result;
}

// ─────────────────────────────────────────────────────────────────────────────
// 서버 백엔드 (로그인 사용자) — REST API 래퍼
// ─────────────────────────────────────────────────────────────────────────────

export type ServerUsage = Usage & {
  planId: PlanId;
  limits: {
    cardnewsPerMonth: number | null;
    blogPerMonth: number | null;
    aiImagesPerMonth: number | null;
  };
};

/** /api/usage 호출. 401 면 null (비로그인). */
export async function loadUsageServer(): Promise<ServerUsage | null> {
  if (typeof window === "undefined") return null;
  const res = await fetch("/api/usage", { cache: "no-store" });
  if (res.status === 401) return null;
  if (!res.ok) throw new Error(`usage fetch failed: ${res.status}`);
  return (await res.json()) as ServerUsage;
}

export type ServerIncrementResult =
  | { ok: true; kind: UsageKind; value: number }
  | { ok: false; error: "limit_exceeded"; kind: UsageKind; used: number; limit: number }
  | { ok: false; error: "unauthorized" };

/** /api/usage POST. 403 limit_exceeded 도 정상 응답으로 처리. */
export async function incrementUsageServer(
  kind: UsageKind,
  by = 1,
): Promise<ServerIncrementResult> {
  const res = await fetch("/api/usage", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ kind, by }),
  });
  if (res.status === 401) return { ok: false, error: "unauthorized" };
  if (res.status === 403) {
    const j = (await res.json()) as {
      error: "limit_exceeded";
      kind: UsageKind;
      used: number;
      limit: number;
    };
    return { ok: false, ...j };
  }
  if (!res.ok) throw new Error(`usage POST failed: ${res.status}`);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("briq:usage-updated"));
  }
  return (await res.json()) as { ok: true; kind: UsageKind; value: number };
}

// ─────────────────────────────────────────────────────────────────────────────
// 플랜 조회 — 서버 우선, localStorage fallback.
// ─────────────────────────────────────────────────────────────────────────────
//
// getActivePlanId() 는 동기 함수라 useUsage() 훅이 mount 후 서버에서 fetch 한
// 결과로 덮어쓴다. 비로그인이거나 fetch 전이면 localStorage 의 값을 잠시 노출.

export function getActivePlanId(): PlanId {
  if (typeof window === "undefined") return "free";
  try {
    const v = localStorage.getItem(PLAN_KEY);
    if (v === "free" || v === "pro" || v === "studio" || v === "agency") return v;
  } catch {
    /* 무시 */
  }
  return "free";
}

/** localStorage 캐시 갱신 — 서버 fetch 후 호출하면 다음 SSR/CSR 빠른 표시. */
export function setActivePlan(planId: PlanId): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(PLAN_KEY, planId);
    window.dispatchEvent(new CustomEvent("briq:plan-updated"));
  } catch {
    /* 무시 */
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 한도 체크 — 현재 플랜 + 현재 사용량 기준 "다음 생성이 한도 안쪽인지" 판단.
// ─────────────────────────────────────────────────────────────────────────────

export type LimitCheck = {
  allowed: boolean;
  used: number;
  limit: number | null;
  unit: string;
  reason?: string;
};

export function checkLimit(
  kind: UsageKind,
  planId: PlanId = getActivePlanId(),
  usage: Usage = loadUsageLocal(),
): LimitCheck {
  const plan = getPlan(planId);
  const usedMap: Record<UsageKind, number> = {
    cardnews: usage.cardnews,
    blog: usage.blog,
    aiImage: usage.aiImage,
  };
  const limitMap: Record<UsageKind, number | null> = {
    cardnews: plan.limits.cardnewsPerMonth,
    blog: plan.limits.blogPerMonth,
    aiImage: plan.limits.aiImagesPerMonth,
  };
  const unitMap: Record<UsageKind, string> = {
    cardnews: "편",
    blog: "편",
    aiImage: "장",
  };

  const used = usedMap[kind];
  const limit = limitMap[kind];
  const unit = unitMap[kind];

  if (limit === null) {
    return { allowed: true, used, limit: null, unit };
  }
  if (used >= limit) {
    const kindLabel =
      kind === "cardnews" ? "카드뉴스" : kind === "blog" ? "네이버 블로그 본문" : "ChatGPT 이미지";
    return {
      allowed: false,
      used,
      limit,
      unit,
      reason: `이번 달 ${kindLabel} 한도 ${limit}${unit}을(를) 모두 사용하셨습니다. 상위 플랜으로 업그레이드하시면 무제한 사용 가능합니다.`,
    };
  }
  return { allowed: true, used, limit, unit };
}

// ─────────────────────────────────────────────────────────────────────────────
// 친화 메시지 — 한도 도달 모달
// ─────────────────────────────────────────────────────────────────────────────

export function upgradePromptForKind(
  kind: UsageKind,
  fromPlan: PlanId = getActivePlanId(),
): { headline: string; body: string; ctaPlan: PlanId } {
  if (fromPlan === "free") {
    if (kind === "cardnews") {
      return {
        headline: "이번 달 카드뉴스 한도 도달",
        body: "Pro 부터는 카드뉴스를 무제한 만드실 수 있어요. 매주 발행하시면 한 달에 8-12편이 평균입니다.",
        ctaPlan: "pro",
      };
    }
    if (kind === "blog") {
      return {
        headline: "네이버 블로그 본문은 Pro 부터",
        body: "Free 에서는 카드뉴스만 가능합니다. Pro 부터 1500자 이상 SEO 본문을 월 8편까지 사용하실 수 있어요.",
        ctaPlan: "pro",
      };
    }
    if (kind === "aiImage") {
      return {
        headline: "ChatGPT 이미지 생성은 Pro 부터",
        body: "Free 에서는 Pexels 사진 검색·직접 업로드만 가능합니다. Pro 부터 ChatGPT 이미지를 월 50장 무료로 사용하실 수 있어요.",
        ctaPlan: "pro",
      };
    }
  }
  if (fromPlan === "pro") {
    if (kind === "blog") {
      return {
        headline: "이번 달 블로그 본문 한도 도달 (8편)",
        body: "Studio 부터는 무제한입니다. 대행사·여러 매장 운영하시는 분께 권장드립니다.",
        ctaPlan: "studio",
      };
    }
    if (kind === "aiImage") {
      return {
        headline: "이번 달 ChatGPT 이미지 한도 도달 (50장)",
        body: "ChatGPT 이미지 추가 100장 ₩9,000 으로 구매하시거나, Studio (월 300장 포함) 로 업그레이드 가능합니다.",
        ctaPlan: "studio",
      };
    }
  }
  return {
    headline: "한도 도달",
    body: "더 높은 플랜으로 업그레이드하시면 무제한 사용 가능합니다.",
    ctaPlan: "pro",
  };
}
