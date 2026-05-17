"use client";

// 사용량 + 플랜 React 훅 — 컴포넌트에서 useUsage() 한 줄로 끝남.

import * as React from "react";
import {
  loadUsage,
  getActivePlanId,
  checkLimit,
  type Usage,
  type UsageKind,
  type LimitCheck,
} from "./usage";
import { getPlan, type Plan, type PlanId } from "./plans";

export function useUsage(): {
  usage: Usage;
  plan: Plan;
  planId: PlanId;
  check: (kind: UsageKind) => LimitCheck;
  isMounted: boolean;
} {
  const [usage, setUsage] = React.useState<Usage>(() => loadUsage());
  const [planId, setPlanId] = React.useState<PlanId>(() => "free"); // SSR 안전 디폴트
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    // 마운트 후에야 localStorage 안전하게 읽음
    setIsMounted(true);
    setUsage(loadUsage());
    setPlanId(getActivePlanId());

    const onUsage = () => setUsage(loadUsage());
    const onPlan = () => setPlanId(getActivePlanId());
    window.addEventListener("briq:usage-updated", onUsage);
    window.addEventListener("briq:plan-updated", onPlan);
    return () => {
      window.removeEventListener("briq:usage-updated", onUsage);
      window.removeEventListener("briq:plan-updated", onPlan);
    };
  }, []);

  const plan = React.useMemo(() => getPlan(planId), [planId]);

  const check = React.useCallback(
    (kind: UsageKind) => checkLimit(kind, planId),
    [planId],
  );

  return { usage, plan, planId, check, isMounted };
}
