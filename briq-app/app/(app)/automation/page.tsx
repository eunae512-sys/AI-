"use client";

import * as React from "react";
import { Topbar } from "@/components/layout/Topbar";
import { cn } from "@/lib/utils";

// 자동화 룰은 구현 단계 별로 노출.
//   · live    — 실 동작 중 (분배 허브에서 webhook/manual 경로로 실행)
//   · soon    — 다음 릴리즈 예정 (토글 비활성)
//
// 거짓 토글 (mock 만 있고 실 동작 0) 은 사용자 신뢰를 크게 해친다 — 명시적으로 구분한다.

type RuleStage = "live" | "soon";
type Rule = {
  id: string;
  title: string;
  desc: string;
  stage: RuleStage;
  /** 실 동작 룰의 진입점 — 사장님이 어디서 운영 중인지 클릭 가능한 단서 */
  link?: { href: string; label: string };
  /** soon 룰의 ETA 안내 */
  eta?: string;
};

const RULES: Rule[] = [
  {
    id: "distribution-hub",
    title: "분배 허브 — Webhook · 수동 발행",
    desc: "한 캠페인 → 10 플랫폼 카드. Make/Zapier 위임 + 클립보드 + 발행 페이지 새 탭 — 지금 동작.",
    stage: "live",
    link: { href: "/content-distribution", label: "분배 허브 열기" },
  },
  {
    id: "manual-copy-flow",
    title: "수동 플랫폼 — 클립보드 + 발행 페이지 자동 오픈",
    desc: "네이버 블로그/클립/카카오 채널 — 카드의 \"분배\" 버튼이 텍스트를 복사하고 발행 페이지를 새 탭으로 엽니다.",
    stage: "live",
    link: { href: "/content-distribution", label: "확인하기" },
  },
  {
    id: "instagram-api",
    title: "Instagram Graph API 직결 — 자동 발행",
    desc: "Meta Business 토큰 등록 후 카드뉴스/캡션/릴스 자동 발행. 현재 토큰 입력 UI 와 어댑터 골격까지.",
    stage: "soon",
    eta: "서버사이드 OAuth 흐름 + 콘텐츠 컨테이너 → 발행 API. 다음 단계.",
  },
  {
    id: "auto-reply",
    title: "댓글·DM 자동 응답",
    desc: "브랜드 톤으로 첫 응답 → 예약/가격 질문은 사장님에게 전달.",
    stage: "soon",
    eta: "Instagram Basic Display + 키워드 분류기. 분배 허브 API 직결 이후.",
  },
  {
    id: "repost-winner",
    title: "반응 좋았던 게시물 재포스팅",
    desc: "60일 전 게시물 중 저장 30+ 받은 거 자동 리믹스 후 재발행.",
    stage: "soon",
    eta: "Insights 실 데이터 누적 + 발행 히스토리 DB. Supabase 마이그레이션 이후.",
  },
];

export default function AutomationPage() {
  const liveCount = RULES.filter((r) => r.stage === "live").length;
  const soonCount = RULES.filter((r) => r.stage === "soon").length;

  return (
    <>
      <Topbar title="Automation" breadcrumb="자동 운영 룰" />
      <div className="max-w-[1180px] mx-auto px-5 sm:px-10 md:px-14 pt-10 sm:pt-16 pb-24">
        <header className="pb-10 border-b border-zinc-200 dark:border-zinc-800">
          <div className="editorial-label">Always on</div>
          <h1
            className="mt-3 text-[32px] sm:text-[44px] leading-[0.98] tracking-[-0.02em] font-medium"
            style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 500 }}
          >
            <span className="tabular-nums">{liveCount}</span> live<span className="text-zinc-400"> · {soonCount} 준비 중</span>
          </h1>
          <p className="mt-4 max-w-[600px] text-[14px] text-zinc-600 dark:text-zinc-400 leading-relaxed">
            지금 실제 동작 중인 룰과, 다음 릴리즈 예정 룰을 분리해 둡니다. 거짓 토글 없이, 실 동작만 켜 둡니다.
          </p>
        </header>

        <section className="pt-10 space-y-3">
          {RULES.map((r) => {
            const isLive = r.stage === "live";
            return (
              <div
                key={r.id}
                className={cn(
                  "border p-5 sm:p-6 flex items-start gap-5 transition-colors",
                  isLive
                    ? "border-zinc-300 dark:border-zinc-700"
                    : "border-zinc-200/70 dark:border-zinc-800/70 opacity-80",
                )}
              >
                {/* 상태 dot — 토글 대신 명시적 stage */}
                <div className="shrink-0 mt-1 flex flex-col items-center gap-1.5">
                  <span
                    className={cn(
                      "inline-block h-2 w-2 rounded-full",
                      isLive ? "bg-emerald-500" : "bg-amber-400",
                    )}
                  />
                  <span className="text-[9px] tracking-[0.15em] uppercase text-zinc-400">
                    {isLive ? "Live" : "Soon"}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[16px] tracking-tight" style={{ fontFamily: "'Nanum Myeongjo', serif" }}>
                    {r.title}
                  </div>
                  <div className="mt-1.5 text-[12.5px] text-zinc-500 dark:text-zinc-500 leading-relaxed">
                    {r.desc}
                  </div>
                  {r.eta && (
                    <div className="mt-2.5 text-[11px] text-zinc-400 leading-relaxed">
                      <span className="editorial-label mr-2">ETA</span>
                      {r.eta}
                    </div>
                  )}
                  {r.link && (
                    <a
                      href={r.link.href}
                      className="mt-3 inline-flex items-center gap-1 text-[11px] tracking-[0.1em] uppercase text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 underline underline-offset-4 decoration-[0.5px]"
                    >
                      {r.link.label} →
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </section>
      </div>
    </>
  );
}
