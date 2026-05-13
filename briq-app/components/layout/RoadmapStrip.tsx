"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Check, ChevronRight, ChevronLeft, ArrowRight, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

// BRIQ 워크플로우 — 사장님이 SNS 운영을 끝낼 때까지의 5단계
// 사이드바·대시보드와 별개로, 모든 (app) 페이지 상단에 노출되는 공용 진행 가이드
type Step = {
  n: number;
  title: string;
  short: string;       // 모바일에서 보일 짧은 제목
  href: string;
  match: string[];     // 어떤 경로에 있을 때 "현재 단계" 로 잡을지
  desc: string;        // 호버 시 보조 설명
};

export const WORKFLOW_STEPS: Step[] = [
  {
    n: 1,
    title: "가게 정보",
    short: "가게",
    href: "/brand-kit",
    match: ["/onboarding", "/brand-kit", "/brand-tone", "/clients"],
    desc: "가게 이름 · 색 · 시그니처 메뉴",
  },
  {
    n: 2,
    title: "SNS 연결",
    short: "SNS",
    href: "/channels",
    match: ["/channels"],
    desc: "인스타·틱톡·블로그 연결",
  },
  {
    n: 3,
    title: "오늘 홍보 만들기",
    short: "만들기",
    href: "/shorts",
    match: ["/shorts", "/reels", "/cardnews", "/threads", "/blog"],
    desc: "릴스·카드뉴스·블로그 자동",
  },
  {
    n: 4,
    title: "올릴 시간 정하기",
    short: "예약",
    href: "/schedule",
    match: ["/schedule", "/calendar", "/review-queue"],
    desc: "잘 올리는 시간에 자동 발행",
  },
  {
    n: 5,
    title: "반응 보기",
    short: "반응",
    href: "/analytics",
    match: ["/analytics", "/trends", "/discover", "/reviews"],
    desc: "저장 · 도달 · 후기 한눈에",
  },
];

// 사장님의 진행 상태 — localStorage 기반 정밀 추적
// 각 단계가 끝났다고 판단하는 명확한 시그널 검사:
//   STEP 1 (브랜드): user-brand 존재 + tagline OR signatureMenu 입력 (= 단순 등록 아닌 의미있는 입력)
//   STEP 2 (채널): connected 채널 ≥ 1
//   STEP 3 (콘텐츠): publish-queue 에 어떤 항목이든 있음
//   STEP 4 (발행 예약): publish-queue 에 status === "scheduled" 인 항목 있음
//   STEP 5 (분석): publish-queue 에 status === "published" 항목 있음 (지금은 항상 false)
function deriveProgress(): Record<number, "done" | "active" | "pending"> {
  if (typeof window === "undefined") return { 1: "pending", 2: "pending", 3: "pending", 4: "pending", 5: "pending" };

  // STEP 1 — 브랜드 의미있게 설정됨?
  let brandMeaningful = false;
  let activeBrandId: string | null = null;
  try {
    const raw = localStorage.getItem("briq:user-brand");
    if (raw) {
      const userBrand = JSON.parse(raw);
      activeBrandId = userBrand?.id ?? null;
      // 의미있는 입력: tagline 또는 시그니처 메뉴 1개 이상
      const hasTagline = typeof userBrand?.tagline === "string" && userBrand.tagline.trim().length > 0;
      const hasMenu = Array.isArray(userBrand?.signatureMenu) && userBrand.signatureMenu.length > 0;
      brandMeaningful = hasTagline || hasMenu;
    }
  } catch {
    // 무시
  }
  const brandExists = !!activeBrandId;

  // STEP 2 — 채널 연결 (브랜드별 분리 저장)
  let channelsConnectedCount = 0;
  if (activeBrandId) {
    try {
      const connsRaw = localStorage.getItem(`briq:channel-connections:${activeBrandId}`);
      if (connsRaw) {
        const conns = JSON.parse(connsRaw);
        if (Array.isArray(conns)) {
          channelsConnectedCount = conns.filter((c: { connected?: boolean }) => c.connected).length;
        }
      }
    } catch {
      // 무시
    }
  }
  const channelsDone = channelsConnectedCount > 0;

  // STEP 3/4/5 — publish-queue 검사
  let queueItems: Array<{ status?: string; brandId?: string }> = [];
  try {
    const queueRaw = localStorage.getItem("briq:publish-queue:v1");
    if (queueRaw) {
      const all = JSON.parse(queueRaw);
      if (Array.isArray(all)) {
        // 활성 브랜드 기준으로 필터 (활성 브랜드 없으면 전체)
        queueItems = activeBrandId
          ? all.filter((q) => q.brandId === activeBrandId)
          : all;
      }
    }
  } catch {
    // 무시
  }
  const hasContent = queueItems.length > 0;
  const hasScheduled = queueItems.some((q) => q.status === "scheduled");
  const hasPublished = queueItems.some((q) => q.status === "published");

  // 단계 상태 도출
  // done = 끝남 / active = 현재 권장 단계 / pending = 아직
  const s1: "done" | "active" | "pending" = brandMeaningful
    ? "done"
    : brandExists
      ? "active"
      : "active"; // 첫 진입은 항상 1단계 active
  const s2: "done" | "active" | "pending" =
    !brandExists ? "pending" : channelsDone ? "done" : "active";
  const s3: "done" | "active" | "pending" =
    !brandExists || !channelsDone ? "pending" : hasContent ? "done" : "active";
  const s4: "done" | "active" | "pending" =
    !hasContent ? "pending" : hasScheduled ? "done" : "active";
  const s5: "done" | "active" | "pending" =
    !hasScheduled ? "pending" : hasPublished ? "done" : "active";

  return { 1: s1, 2: s2, 3: s3, 4: s4, 5: s5 };
}

export function RoadmapStrip({
  variant = "default",
  className,
}: {
  variant?: "default" | "compact"; // compact = 페이지 하단 미니 버전
  className?: string;
}) {
  const pathname = usePathname() ?? "";
  const [progress, setProgress] = React.useState<Record<number, "done" | "active" | "pending">>({
    1: "pending", 2: "pending", 3: "pending", 4: "pending", 5: "pending",
  });

  React.useEffect(() => {
    setProgress(deriveProgress());
    const refresh = () => setProgress(deriveProgress());
    window.addEventListener("storage", refresh);
    window.addEventListener("briq:user-brand-updated", refresh);
    window.addEventListener("briq:queue-updated", refresh);
    window.addEventListener("briq:hide-demo-updated", refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("briq:user-brand-updated", refresh);
      window.removeEventListener("briq:queue-updated", refresh);
      window.removeEventListener("briq:hide-demo-updated", refresh);
    };
  }, [pathname]);

  // 현재 페이지가 어느 단계인지 — match 배열 안의 prefix 와 일치하면
  const currentStep = WORKFLOW_STEPS.find((s) =>
    s.match.some((m) => pathname === m || pathname.startsWith(m + "/") || pathname.startsWith(m)),
  )?.n;

  return (
    <div
      className={cn(
        "w-full rounded-xl border border-zinc-200/70 dark:border-zinc-800/70 bg-white/60 dark:bg-zinc-950/60 backdrop-blur",
        variant === "compact" ? "p-2.5" : "p-3 sm:p-3.5",
        className,
      )}
      aria-label="BRIQ 워크플로우 5단계"
    >
      <div className="flex items-stretch gap-1 overflow-x-auto -mx-1 px-1">
        {WORKFLOW_STEPS.map((s, i) => {
          const state = currentStep === s.n ? "active" : progress[s.n];
          const isLast = i === WORKFLOW_STEPS.length - 1;
          return (
            <React.Fragment key={s.n}>
              <Link
                href={s.href}
                aria-current={currentStep === s.n ? "step" : undefined}
                className={cn(
                  "group flex items-center gap-2 px-2.5 py-1.5 rounded-lg shrink-0 transition-all min-h-[40px]",
                  state === "active"
                    ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900"
                    : state === "done"
                      ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-500/15"
                      : "text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900",
                )}
                title={s.desc}
              >
                <span
                  className={cn(
                    "h-5 w-5 rounded-full grid place-items-center text-[10px] font-bold tabular-nums shrink-0",
                    state === "active"
                      ? "bg-white/20 dark:bg-zinc-900/20 text-current"
                      : state === "done"
                        ? "bg-emerald-500 text-white"
                        : "bg-zinc-200 dark:bg-zinc-800 text-zinc-500",
                  )}
                >
                  {state === "done" ? <Check className="h-3 w-3" /> : s.n}
                </span>
                <span className="text-xs font-semibold sm:hidden">{s.short}</span>
                <span className="text-xs font-semibold hidden sm:inline whitespace-nowrap">{s.title}</span>
              </Link>
              {!isLast && (
                <span className="self-center text-zinc-300 dark:text-zinc-700 shrink-0" aria-hidden>
                  <ChevronRight className="h-3 w-3" />
                </span>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

// 페이지 하단에 표시하는 "이전 / 현재 / 다음" 워크플로우 푸터
// 사장님이 어디서 왔고 어디로 가는지 한눈에 보이게
export function NextStepCard({
  currentHref,
  className,
}: {
  currentHref?: string;
  className?: string;
}) {
  const pathname = usePathname() ?? "";
  const href = currentHref ?? pathname;
  const currentIdx = WORKFLOW_STEPS.findIndex((s) =>
    s.match.some((m) => href === m || href.startsWith(m + "/") || href.startsWith(m)),
  );
  const prev = currentIdx > 0 ? WORKFLOW_STEPS[currentIdx - 1] : null;
  const next = currentIdx >= 0 && currentIdx < WORKFLOW_STEPS.length - 1
    ? WORKFLOW_STEPS[currentIdx + 1]
    : null;
  const current = currentIdx >= 0 ? WORKFLOW_STEPS[currentIdx] : null;

  // 워크플로우 어디에도 없는 페이지 (e.g. /settings) 면 렌더 안 함
  if (!current) return null;

  return (
    <div
      className={cn(
        "grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] gap-2 sm:gap-3 items-stretch rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-900/40 p-3",
        className,
      )}
    >
      {/* 이전 단계 */}
      {prev ? (
        <Link
          href={prev.href}
          className="group flex items-center gap-2.5 rounded-lg px-3 py-2.5 bg-white dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 hover:border-zinc-900 dark:hover:border-zinc-100 transition-all min-h-[56px]"
        >
          <div className="h-7 w-7 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 grid place-items-center shrink-0 group-hover:-translate-x-0.5 transition-transform">
            <ArrowLeft className="h-3.5 w-3.5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[10px] uppercase tracking-widest text-zinc-400 font-semibold">
              이전 · STEP {prev.n}
            </div>
            <div className="text-xs font-semibold tracking-tight truncate">{prev.title}</div>
          </div>
        </Link>
      ) : (
        <div className="hidden sm:block" />
      )}

      {/* 현재 단계 표시 — 가운데 점 */}
      <div className="hidden sm:flex flex-col items-center justify-center px-2">
        <div className="text-[10px] uppercase tracking-widest text-zinc-400 font-semibold">
          현재
        </div>
        <div className="text-xs font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 mt-0.5">
          STEP {current.n} · {current.title}
        </div>
        <div className="mt-1 flex items-center gap-1">
          {WORKFLOW_STEPS.map((s) => (
            <span
              key={s.n}
              className={cn(
                "h-1 w-3 rounded-full",
                s.n < current.n
                  ? "bg-emerald-500"
                  : s.n === current.n
                    ? "bg-zinc-900 dark:bg-zinc-100"
                    : "bg-zinc-200 dark:bg-zinc-800",
              )}
            />
          ))}
        </div>
      </div>

      {/* 다음 단계 — primary CTA */}
      {next ? (
        <Link
          href={next.href}
          className="group flex items-center gap-2.5 rounded-lg px-3 py-2.5 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:opacity-95 transition-all min-h-[56px]"
        >
          <div className="min-w-0 flex-1 text-right sm:text-left">
            <div className="text-[10px] uppercase tracking-widest opacity-70 font-semibold">
              다음 · STEP {next.n}
            </div>
            <div className="text-xs font-semibold tracking-tight truncate">
              {next.title}
              <span className="opacity-70 font-normal hidden sm:inline"> · {next.desc}</span>
            </div>
          </div>
          <div className="h-7 w-7 rounded-full bg-white/15 dark:bg-zinc-900/15 grid place-items-center shrink-0 group-hover:translate-x-0.5 transition-transform">
            <ArrowRight className="h-3.5 w-3.5" />
          </div>
        </Link>
      ) : (
        <div className="hidden sm:block" />
      )}
    </div>
  );
}
