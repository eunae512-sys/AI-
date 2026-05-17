// 사용량 트래킹 — 월별 카운터.
//
// 정책:
//   · localStorage 기반 (Supabase 마이그레이션 시 같은 API 시그니처 유지)
//   · 키는 `briq:usage:${month}` — month = "YYYY-MM" (한국 시간 기준)
//   · 매월 1일 자동 리셋 — 새 키가 만들어지면 자동으로 0
//   · 한도 체크는 항상 현재 플랜 + 현재 월 기준

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
  // toLocaleString 으로 Asia/Seoul 환산 후 yyyy-mm 추출
  const seoul = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
  const y = seoul.getFullYear();
  const m = String(seoul.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function storageKey(month: string): string {
  return `briq:usage:${month}`;
}

export function loadUsage(month: string = currentMonth()): Usage {
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

export function saveUsage(usage: Usage): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(storageKey(usage.month), JSON.stringify(usage));
    window.dispatchEvent(new CustomEvent("briq:usage-updated"));
  } catch {
    /* quota 무시 */
  }
}

export function incrementUsage(kind: UsageKind, by: number = 1): Usage {
  const month = currentMonth();
  const cur = loadUsage(month);
  const next: Usage = { ...cur, [kind]: cur[kind] + by };
  saveUsage(next);
  return next;
}

// ─────────────────────────────────────────────────────────────────────────────
// 플랜 조회 — Supabase 가 붙기 전까지는 localStorage 의 active-plan 사용.
// 기본값 = "free". 결제 후 setPlan(id) 호출.
// ─────────────────────────────────────────────────────────────────────────────

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
  /** 한도 정보 — UI 에 노출 */
  used: number;
  limit: number | null; // null = 무제한
  /** 사용자에게 보일 한도 단위 (개) */
  unit: string;
  /** 막혔을 때 노출할 친화 메시지 */
  reason?: string;
};

export function checkLimit(kind: UsageKind, planId: PlanId = getActivePlanId()): LimitCheck {
  const plan = getPlan(planId);
  const usage = loadUsage();
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
    const kindLabel = kind === "cardnews" ? "카드뉴스" : kind === "blog" ? "네이버 블로그 본문" : "ChatGPT 이미지";
    return {
      allowed: false,
      used,
      limit,
      unit,
      reason: `이번 달 ${kindLabel} 한도 ${limit}${unit}을(를)모두 사용하셨습니다. Pro 로 업그레이드하면 무제한 사용 가능합니다.`,
    };
  }
  return { allowed: true, used, limit, unit };
}

// ─────────────────────────────────────────────────────────────────────────────
// 친화 메시지 — 한도 도달 모달에서 사용
// ─────────────────────────────────────────────────────────────────────────────

export function upgradePromptForKind(kind: UsageKind, fromPlan: PlanId = getActivePlanId()): { headline: string; body: string; ctaPlan: PlanId } {
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
