"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type RecTone = "rose" | "amber" | "violet" | "emerald";
const KIND_TONE_CLASS: Record<RecTone, string> = {
  rose: "text-rose-600 dark:text-rose-400",
  amber: "text-amber-600 dark:text-amber-400",
  violet: "text-violet-600 dark:text-violet-400",
  emerald: "text-emerald-600 dark:text-emerald-400",
};
const RECS: { id: number; kind: string; emoji: string; title: string; desc: string; brand: string; tone: RecTone; href: string }[] = [
  { id: 1, kind: "시즌 · 5/13~", emoji: "🌧", title: "장마 감성 릴스", desc: "미옥당 · 김치찌개 + 가마솥", brand: "미옥당", tone: "rose", href: "/reels?id=miokdang" },
  { id: 2, kind: "기념일 · 5/8~21", emoji: "💐", title: "가정의 달 효도 이벤트", desc: "서촌 한옥스테이 · 부모님 패키지", brand: "서촌스테이", tone: "amber", href: "/reels?id=seochon-stay" },
  { id: 3, kind: "지역 · 5/24~26", emoji: "🌸", title: "강남 수국축제 콘텐츠", desc: "루나헤어 · 봄 컬러 헤어 컷", brand: "루나헤어", tone: "violet", href: "/reels?id=luna-hair" },
  { id: 4, kind: "트렌드 · 5/27~", emoji: "📚", title: "중간고사 D-7", desc: "베스트영어 · 학부모 V-log", brand: "베스트영어", tone: "emerald", href: "/reels?id=best-eng" },
  { id: 5, kind: "날씨 · 5/30~", emoji: "🔥", title: "폭염 콜드 메뉴", desc: "로스터리 1985 · 콜드브루 신상", brand: "로스터리", tone: "amber", href: "/reels?id=roastery-1985" },
];

const DAYS_PRE = [26, 27, 28, 29, 30];
const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);
const DAYS_POST = [1, 2, 3, 4, 5, 6];
const TODAY = 11;

const HOLIDAYS: Record<number, string> = { 1: "근로자의날", 5: "어린이날", 8: "어버이날", 15: "스승의날", 25: "부처님오신날" };
const WEATHER: Record<number, string> = { 13: "🌧 장마", 30: "🔥 폭염" };

const EVENTS: Record<number, Array<{ tone: string; label: string }>> = {
  5: [{ tone: "emerald", label: "베스트영어" }],
  6: [{ tone: "rose", label: "미옥당 카드" }],
  8: [{ tone: "sky", label: "청담 효도" }],
  11: [{ tone: "rose", label: "미옥당" }, { tone: "fuchsia", label: "루나헤어" }],
  12: [{ tone: "amber", label: "로스터리" }],
  13: [{ tone: "rose", label: "미옥당 비오는날" }],
  14: [{ tone: "emerald", label: "베스트 학부모" }],
  15: [{ tone: "emerald", label: "베스트 감사" }],
  16: [{ tone: "stone", label: "FORUM 룩북" }],
  19: [{ tone: "rose", label: "미옥당 릴스" }],
  20: [{ tone: "sky", label: "청담 후속" }],
  22: [{ tone: "fuchsia", label: "루나 ASMR" }],
  26: [{ tone: "fuchsia", label: "루나 수국" }],
  27: [{ tone: "emerald", label: "베스트 시험" }],
  29: [{ tone: "rose", label: "미옥당 여정식" }],
  30: [{ tone: "amber", label: "로스터리 콜드브루" }],
};

const PILL_TONE: Record<string, string> = {
  rose: "bg-rose-50 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300",
  emerald: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300",
  sky: "bg-sky-50 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300",
  amber: "bg-amber-50 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300",
  fuchsia: "bg-fuchsia-50 text-fuchsia-700 dark:bg-fuchsia-500/20 dark:text-fuchsia-300",
  stone: "bg-stone-100 text-stone-700 dark:bg-stone-500/20 dark:text-stone-300",
};

export function CalendarScreen() {
  return (
    <div className="px-4 sm:px-6 py-4 sm:py-6">
      {/* Hero */}
      <div className="flex items-end justify-between gap-4 flex-wrap mb-6">
        <div>
          <div className="text-[11px] uppercase tracking-[0.15em] text-amber-600 font-semibold">CONTENT CALENDAR</div>
          <h1 className="mt-2 text-[22px] sm:text-2xl md:text-3xl font-semibold tracking-tight leading-[1.15]">콘텐츠 캘린더</h1>
          <p className="mt-1 text-sm text-zinc-500 max-w-2xl">공휴일 · 시즌 · 날씨 · 지역 축제 · 트렌드 자동 추천. 클릭 한 번으로 생성·예약.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center bg-zinc-100 dark:bg-zinc-900 rounded-md p-0.5">
            <button className="text-[11px] px-3 py-1.5 rounded bg-white dark:bg-zinc-800 font-medium shadow-sm">월간</button>
            <button className="text-[11px] px-3 py-1.5 text-zinc-500">주간</button>
            <button className="text-[11px] px-3 py-1.5 text-zinc-500">목록</button>
          </div>
          <Button size="sm">
            <Plus className="h-3 w-3" />직접 추가
          </Button>
        </div>
      </div>

      {/* Recommendation strip */}
      <div className="mb-5">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-[11px] uppercase tracking-[0.15em] text-indigo-600 dark:text-indigo-400 font-semibold">BRIQ 자동 추천</span>
          <span className="text-[11px] text-zinc-500">5월 11~31일 · 14건</span>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-6 px-6">
          {RECS.map((rec, i) => (
            <motion.div
              key={rec.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Link href={rec.href} className="block">
                <Card className="p-4 min-w-[260px] hover:border-zinc-900 dark:hover:border-zinc-100 hover:-translate-y-0.5 transition-all">
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] uppercase tracking-wider font-semibold ${KIND_TONE_CLASS[rec.tone]}`}>
                      {rec.kind}
                    </span>
                    <span className="text-2xl">{rec.emoji}</span>
                  </div>
                  <div className="mt-2 text-sm font-semibold">{rec.title}</div>
                  <div className="mt-1 text-[11px] text-zinc-500 leading-relaxed">{rec.desc}</div>
                  <div className="mt-3 flex items-center gap-2">
                    <Badge tone={rec.tone}>{rec.brand}</Badge>
                    <span className="ml-auto text-[11px] text-zinc-900 dark:text-zinc-100 font-medium">생성 →</span>
                  </div>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Calendar grid */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h3 className="text-base font-semibold">2026년 5월</h3>
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <ChevronRight className="h-4 w-4" />
            </Button>
            <button className="text-[11px] text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100">오늘</button>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-zinc-500">
            <span className="inline-flex items-center gap-1.5"><span className="w-2 h-2 rounded bg-rose-400" />미옥당</span>
            <span className="inline-flex items-center gap-1.5"><span className="w-2 h-2 rounded bg-amber-400" />로스터리</span>
            <span className="inline-flex items-center gap-1.5"><span className="w-2 h-2 rounded bg-fuchsia-400" />루나</span>
            <span className="inline-flex items-center gap-1.5"><span className="w-2 h-2 rounded bg-emerald-400" />베스트</span>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1.5 text-[10px] uppercase tracking-[0.15em] text-zinc-400 font-semibold mb-1.5">
          <div className="px-2 text-rose-500">일</div><div className="px-2">월</div><div className="px-2">화</div><div className="px-2">수</div><div className="px-2">목</div><div className="px-2">금</div><div className="px-2">토</div>
        </div>

        <div className="grid grid-cols-7 gap-1.5">
          {DAYS_PRE.map((d) => (
            <div key={`pre-${d}`} className="aspect-[1/0.85] min-h-[88px] rounded-lg border border-zinc-100 dark:border-zinc-800 p-1.5 opacity-40 text-[11px]">
              {d}
            </div>
          ))}
          {DAYS.map((d) => {
            const isToday = d === TODAY;
            const evts = EVENTS[d] || [];
            const holiday = HOLIDAYS[d];
            const weather = WEATHER[d];
            return (
              <button
                key={d}
                className={`aspect-[1/0.85] min-h-[88px] rounded-lg border p-1.5 text-left transition-colors ${
                  isToday
                    ? "bg-zinc-900 text-white border-zinc-900 dark:bg-white dark:text-zinc-900 dark:border-white"
                    : "border-zinc-100 dark:border-zinc-800 hover:border-zinc-900 dark:hover:border-zinc-100"
                }`}
              >
                <div className="text-[11px] font-semibold flex items-center gap-1">
                  {isToday ? `${d} · 오늘` : d}
                  {holiday && !isToday && <span className="text-[9px] text-rose-500 font-normal">{holiday}</span>}
                </div>
                {weather && <div className="text-[9px] text-blue-500 font-medium">{weather}</div>}
                <div className="mt-1 space-y-0.5">
                  {evts.slice(0, 2).map((e, i) => (
                    <div
                      key={i}
                      className={`text-[9px] px-1 py-0.5 rounded font-medium truncate ${
                        isToday ? "bg-white/20 text-white" : PILL_TONE[e.tone]
                      }`}
                    >
                      {e.label}
                    </div>
                  ))}
                </div>
              </button>
            );
          })}
          {DAYS_POST.map((d) => (
            <div key={`post-${d}`} className="aspect-[1/0.85] min-h-[88px] rounded-lg border border-zinc-100 dark:border-zinc-800 p-1.5 opacity-40 text-[11px]">
              {d}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
