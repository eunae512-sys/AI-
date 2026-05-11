"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { Check, X } from "lucide-react";
import { LandingNav } from "@/components/landing/Nav";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const PLANS = [
  {
    id: "free",
    name: "FREE",
    price: "₩0",
    sub: "처음 BRIQ를 써보시는 분",
    cta: "무료 시작",
    highlight: false,
    features: [
      { text: "1 브랜드", on: true },
      { text: "월 3건 릴스", on: true },
      { text: "월 10건 카드뉴스", on: true },
      { text: "브랜드 톤 메모리 v1", on: true },
      { text: "AI Assistant 30회/월", on: true },
      { text: "예약 발행", on: false },
      { text: "리뷰 자동 답변", on: false },
      { text: "성과 분석", on: false },
    ],
  },
  {
    id: "starter",
    name: "STARTER",
    price: "₩39,000",
    sub: "1인 자영업 · 카페 · 디저트샵",
    cta: "시작하기",
    highlight: false,
    features: [
      { text: "1 브랜드", on: true },
      { text: "월 30건 릴스", on: true },
      { text: "무제한 카드뉴스", on: true },
      { text: "브랜드 톤 메모리 v3", on: true },
      { text: "AI Assistant 500회/월", on: true },
      { text: "예약 발행 (3 채널)", on: true },
      { text: "콘텐츠 캘린더", on: true },
      { text: "기본 성과 분석", on: true },
    ],
  },
  {
    id: "pro",
    name: "PRO",
    price: "₩99,000",
    sub: "5인 미만 매장 · 단골 운영",
    cta: "PRO 시작",
    highlight: true,
    features: [
      { text: "3 브랜드", on: true },
      { text: "무제한 콘텐츠", on: true },
      { text: "톤 메모리 진화 무제한", on: true },
      { text: "AI Assistant 무제한", on: true },
      { text: "예약 발행 (5 채널)", on: true },
      { text: "리뷰 자동 답변 (4 채널)", on: true },
      { text: "성과 분석 풀 + ROI", on: true },
      { text: "지역 트렌드 1km", on: true },
      { text: "자동 브랜드 키트", on: true },
    ],
  },
  {
    id: "agency",
    name: "AGENCY",
    price: "₩299,000",
    sub: "광고대행사 · 다 브랜드 운영",
    cta: "상담 신청",
    highlight: false,
    features: [
      { text: "10 브랜드", on: true },
      { text: "모든 PRO 기능", on: true },
      { text: "팀 협업 5 시트", on: true },
      { text: "화이트라벨", on: true },
      { text: "API 액세스", on: true },
      { text: "커스텀 톤 격리", on: true },
      { text: "전담 매니저", on: true },
      { text: "월간 리포트", on: true },
    ],
  },
];

export default function PricingPage() {
  return (
    <>
      <LandingNav />
      <main className="pt-20">
        <section className="px-6 pb-10 text-center">
          <div className="text-[11px] uppercase tracking-widest text-zinc-400 font-semibold">PRICING</div>
          <h1 className="mt-3 text-4xl sm:text-5xl font-semibold tracking-tight">
            소상공인이 부담 없이
            <br />
            <span className="gradient-text">시작하는 가격</span>
          </h1>
          <p className="mt-5 text-base text-zinc-600 dark:text-zinc-400 max-w-xl mx-auto">
            광고대행사 월 ₩200~500만원이 부담스러우셨다면. 신용카드 없이 무료로 시작하세요.
          </p>
        </section>

        <section className="px-6 pb-16">
          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {PLANS.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                className={cn(
                  "rounded-2xl p-7 transition-all hover:-translate-y-1",
                  p.highlight
                    ? "border-2 border-transparent bg-gradient-to-b from-white to-white dark:from-[#0f0f12] dark:to-[#0f0f12] relative shadow-[0_30px_60px_-20px_rgba(99,102,241,0.4)]"
                    : "border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-[#0f0f12] hover:border-zinc-400 dark:hover:border-zinc-600"
                )}
                style={
                  p.highlight
                    ? {
                        backgroundImage:
                          "linear-gradient(var(--bg-card),var(--bg-card)),linear-gradient(135deg,#6366f1,#ec4899)",
                        backgroundOrigin: "border-box",
                        backgroundClip: "padding-box,border-box",
                      }
                    : undefined
                }
              >
                {p.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-bold px-3 py-1 rounded-full bg-gradient-to-r from-indigo-500 to-pink-500 text-white shadow-lg">
                    가장 인기 ★
                  </div>
                )}
                <div className={cn("text-xs font-semibold uppercase tracking-wider", p.highlight ? "gradient-text" : "text-zinc-500")}>
                  {p.name}
                </div>
                <div className="mt-3">
                  <span className="text-4xl font-semibold tabular-nums">{p.price}</span>
                  <span className="text-sm text-zinc-500"> / 월</span>
                </div>
                <p className="mt-3 text-xs text-zinc-500 leading-relaxed">{p.sub}</p>
                <Button
                  asChild
                  variant={p.highlight ? "default" : "outline"}
                  className="mt-6 w-full"
                  size="lg"
                >
                  <Link href="/onboarding">{p.cta}</Link>
                </Button>
                <ul className="mt-7 space-y-2.5 text-xs">
                  {p.features.map((f) => (
                    <li key={f.text} className="flex gap-2">
                      {f.on ? (
                        <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                      ) : (
                        <X className="h-3.5 w-3.5 text-zinc-300 dark:text-zinc-700 shrink-0 mt-0.5" />
                      )}
                      <span className={cn(!f.on && "text-zinc-400 dark:text-zinc-600")}>{f.text}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </section>

        <section className="py-20 px-6 bg-zinc-50/40 dark:bg-zinc-950/40 border-y border-zinc-100 dark:border-zinc-900">
          <div className="max-w-3xl mx-auto rounded-2xl border border-zinc-100 dark:border-zinc-800 p-8 text-center bg-white dark:bg-[#0d0d10]">
            <div className="text-[11px] uppercase tracking-widest text-zinc-400 font-semibold">간단 ROI</div>
            <h3 className="mt-2 text-2xl font-semibold tracking-tight">PRO 가입 시, 매월 절감되는 가치</h3>
            <div className="mt-6 grid grid-cols-3 gap-4">
              <div><div className="text-3xl font-semibold tabular-nums text-emerald-600">₩1,400,000</div><div className="text-[11px] text-zinc-500 mt-1">광고대행사 외주 절감</div></div>
              <div><div className="text-3xl font-semibold tabular-nums text-emerald-600">42h</div><div className="text-[11px] text-zinc-500 mt-1">사장님 시간 절감</div></div>
              <div><div className="text-3xl font-semibold tabular-nums text-emerald-600">+147%</div><div className="text-[11px] text-zinc-500 mt-1">인스타 도달 평균</div></div>
            </div>
            <div className="mt-7 text-xs text-zinc-500">PRO 월 ₩99,000 → 실 ROI <b>1,414%</b> · 투자 1원당 14원 회수.</div>
          </div>
        </section>
      </main>
    </>
  );
}
