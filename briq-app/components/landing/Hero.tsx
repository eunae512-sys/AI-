"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <section className="relative pt-28 pb-24 overflow-hidden">
      <div className="absolute inset-0 grid-bg pointer-events-none" />
      <div
        className="absolute top-20 left-1/2 -translate-x-1/2 w-[640px] h-[640px] rounded-full opacity-30 blur-3xl pointer-events-none"
        style={{ background: "radial-gradient(circle,#a855f7,#6366f1 50%,transparent 80%)" }}
      />

      <div className="relative max-w-5xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Link
            href="/onboarding"
            className="inline-flex items-center gap-2 text-[11px] font-medium px-3 py-1.5 rounded-full border border-zinc-200 dark:border-zinc-800 bg-white/60 dark:bg-zinc-900/60 backdrop-blur"
          >
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping"></span>
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
            </span>
            신규 가입 시 첫 콘텐츠 자동 제작 <ArrowRight className="h-3 w-3" />
          </Link>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.05 }}
          className="mt-8 text-5xl sm:text-6xl md:text-7xl font-semibold tracking-tight leading-[1.05]"
        >
          사장님 대신
          <br />
          <span className="gradient-text">브랜드를 운영해주는</span>
          <br />
          AI 직원
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="mt-7 text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-2xl mx-auto"
        >
          사진 몇 장만 올리면 BRIQ가 브랜드 톤을 기억하고
          <br />
          릴스·카드뉴스·블로그·리뷰 답변까지 알아서 합니다.
          <br />
          광고대행사 없이도 운영되는, 1인 브랜드의 온라인 직원.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.25 }}
          className="mt-10 flex items-center justify-center gap-3 flex-wrap"
        >
          <Button asChild size="lg">
            <Link href="/onboarding">
              <Sparkles className="h-4 w-4" />
              무료로 시작하기
              <span className="opacity-50 text-xs ml-1">3분</span>
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <a href="#features">기능 둘러보기</a>
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="mt-6 text-[11px] text-zinc-500"
        >
          신용카드 없이 시작 · 카페 · 숙소 · 디저트샵 · 로컬 브랜드 1,200+ 사용 중
        </motion.div>

        {/* Hero device mockup */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="mt-16 relative max-w-4xl mx-auto"
        >
          <div className="relative rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0d0d10] shadow-2xl overflow-hidden glow">
            <div className="h-9 bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-100 dark:border-zinc-900 flex items-center gap-1.5 px-4">
              <span className="h-2.5 w-2.5 rounded-full bg-rose-300/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber-300/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-300/70" />
              <span className="ml-4 text-[10px] text-zinc-400">briq.app · 미옥당 본점</span>
            </div>
            <div className="grid grid-cols-12 gap-3 p-5 bg-gradient-to-b from-white to-zinc-50/40 dark:from-[#0d0d10] dark:to-[#0a0a0b]">
              <div className="col-span-12 md:col-span-7 space-y-3">
                <div className="rounded-xl border border-zinc-100 dark:border-zinc-800 p-4">
                  <div className="text-[10px] uppercase tracking-widest text-rose-600 dark:text-rose-400 font-semibold">
                    오늘의 추천 콘텐츠
                  </div>
                  <div className="mt-2 text-sm font-semibold">장마 감성 릴스 · 비 오는 날 메뉴</div>
                  <div className="mt-1 text-[11px] text-zinc-500">5/13 장마 시작 예보 · 미옥당 톤 v3</div>
                  <div className="mt-3 flex items-center gap-2">
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">
                      자동 생성됨
                    </span>
                    <span className="text-[10px] text-zinc-500">예상 저장률 5.8%</span>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="aspect-[9/16] rounded-lg bg-gradient-to-br from-amber-200 via-rose-300 to-amber-400" />
                  <div className="aspect-[9/16] rounded-lg bg-gradient-to-br from-stone-700 to-stone-900" />
                  <div className="aspect-[9/16] rounded-lg bg-gradient-to-br from-amber-100 via-amber-200 to-orange-300" />
                </div>
              </div>
              <div className="col-span-12 md:col-span-5 space-y-3">
                <div className="rounded-xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/30 dark:bg-emerald-500/5 p-4">
                  <div className="text-[10px] uppercase tracking-widest text-emerald-700 dark:text-emerald-400 font-semibold">
                    브랜드 톤 자동 자연화
                  </div>
                  <div className="mt-2 text-xs text-zinc-500 line-through">탁월한 풍미를 선사합니다</div>
                  <div className="text-center text-zinc-400 my-1 text-[10px]">↓</div>
                  <div className="text-xs font-medium">한 입에 봄이 옵니다.</div>
                </div>
                <div className="rounded-xl border border-zinc-100 dark:border-zinc-800 p-4">
                  <div className="text-[10px] uppercase tracking-widest text-zinc-400 font-semibold">
                    예약 발행 큐
                  </div>
                  <ul className="mt-2 space-y-1.5 text-xs">
                    <li className="flex gap-2">
                      <span className="text-emerald-600 tabular-nums">11:30</span>
                      <span>미옥당 · 인스타 릴스</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-zinc-500 tabular-nums">19:45</span>
                      <span>루나헤어 · 카드뉴스</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-zinc-500 tabular-nums">21:10</span>
                      <span>청담의료 · 블로그</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
