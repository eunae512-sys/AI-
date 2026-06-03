"use client";

// 사용량 + 플랜 React 훅 — 컴포넌트에서 useUsage() 한 줄로 끝남.
//
// 동작:
//   · 마운트 후 GET /api/usage 로 서버 데이터 fetch (Supabase 진실)
//   · 401 면 비로그인 → localStorage fallback
//   · "briq:usage-updated" / "briq:plan-updated" 이벤트로 다른 컴포넌트와 동기화
//
// 호환:
//   · 기존 시그니처 { usage, plan, planId, check, isMounted } 유지
//   · 추가로 source: "server"|"local"|"loading" 노출

import * as React from "react";

import {
  checkLimit,
  currentMonth,
  getActivePlanId,
  loadUsageLocal,
  loadUsageServer,
  setActivePlan,
  type LimitCheck,
  type Usage,
  type UsageKind,
} from "./usage";
import { getPlan, type Plan, type PlanId } from "./plans";

export type UseUsageResult = {
  usage: Usage;
  plan: Plan;
  planId: PlanId;
  check: (kind: UsageKind) => LimitCheck;
  isMounted: boolean;
  source: "server" | "local" | "loading";
  refresh: () => Promise<void>;
};

export function useUsage(): UseUsageResult {
  const [usage, setUsage] = React.useState<Usage>(() => ({
    month: currentMonth(),
    cardnews: 0,
    blog: 0,
    aiImage: 0,
    aiVideo: 0,
  }));
  const [planId, setPlanId] = React.useState<PlanId>("free");
  const [isMounted, setIsMounted] = React.useState(false);
  const [source, setSource] = React.useState<"server" | "local" | "loading">(
    "loading",
  );

  const refresh = React.useCallback(async () => {
    // 서버 우선
    try {
      const server = await loadUsageServer();
      if (server) {
        setUsage({
          month: server.month,
          cardnews: server.cardnews,
          blog: server.blog,
          aiImage: server.aiImage,
          aiVideo: server.aiVideo,
        });
        setPlanId(server.planId);
        setActivePlan(server.planId); // localStorage 캐시 갱신
        setSource("server");
        return;
      }
    } catch (e) {
      console.warn("[useUsage] server fetch 실패 → localStorage fallback", e);
    }
    // fallback
    setUsage(loadUsageLocal());
    setPlanId(getActivePlanId());
    setSource("local");
  }, []);

  React.useEffect(() => {
    setIsMounted(true);
    refresh();

    const onUsage = () => {
      refresh();
    };
    const onPlan = () => {
      refresh();
    };
    window.addEventListener("briq:usage-updated", onUsage);
    window.addEventListener("briq:plan-updated", onPlan);
    return () => {
      window.removeEventListener("briq:usage-updated", onUsage);
      window.removeEventListener("briq:plan-updated", onPlan);
    };
  }, [refresh]);

  const plan = React.useMemo(() => getPlan(planId), [planId]);

  const check = React.useCallback(
    (kind: UsageKind) => checkLimit(kind, planId, usage),
    [planId, usage],
  );

  return { usage, plan, planId, check, isMounted, source, refresh };
}
