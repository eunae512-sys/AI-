"use client";

// Landing Hero — "AI 기능 소개" 가 아니라 "이미 자동으로 돌아가는 상태" 노출
// 사용자가 들어왔을 때 "AI 툴" 이 아니라 "내 SNS 가 이미 운영되고 있다" 느끼게.

import * as React from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { ArrowRight, CheckCircle2, Sparkles } from "lucide-react";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-[color:var(--bg)]">
      {/* 부드러운 컬러 블롭 배경 — 매거진 결 유지하면서 차분한 입체감 */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 -right-20 h-[480px] w-[480px] rounded-full bg-amber-200/40 dark:bg-amber-500/10 blur-[120px]" />
        <div className="absolute top-32 -left-32 h-[420px] w-[420px] rounded-full bg-rose-200/30 dark:bg-rose-500/10 blur-[120px]" />
        <div className="absolute bottom-0 left-1/3 h-[360px] w-[360px] rounded-full bg-emerald-200/25 dark:bg-emerald-500/10 blur-[120px]" />
      </div>

      <div className="relative max-w-[1180px] mx-auto px-5 sm:px-12 pt-16 sm:pt-32 pb-16 sm:pb-24">
        {/* Masthead — 매거진 결 */}
        <div className="flex items-baseline justify-between border-b border-zinc-300 dark:border-zinc-700 pb-3">
          <div className="editorial-label">BRIQ</div>
          <div className="hidden xs:block editorial-label">자동으로 굴러가는 SNS 운영</div>
        </div>

        {/* 신뢰 배지 — 첫 화면 컬러 포인트 */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mt-8 sm:mt-12 inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-amber-300/60 dark:border-amber-500/30 bg-amber-50/80 dark:bg-amber-500/10 backdrop-blur-sm"
        >
          <Sparkles className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
          <span className="text-[11.5px] tracking-[0.04em] font-medium text-amber-800 dark:text-amber-200">
            한국 소상공인 200+ 가게가 사용 중
          </span>
        </motion.div>

        {/* 메인 헤드라인 — 핵심 단어에만 컬러 */}
        <motion.h1
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.2, 0.7, 0.2, 1] }}
          className="mt-5 sm:mt-8 text-[40px] sm:text-[68px] md:text-[96px] leading-[0.98] sm:leading-[0.95] tracking-[-0.025em] font-medium max-w-[1000px]"
          style={{ fontFamily: "'Cormorant Garamond', 'Nanum Myeongjo', serif", fontWeight: 500 }}
        >
          사장님은{" "}
          <span className="relative inline-block">
            <span className="relative z-10">장사만</span>
            <span aria-hidden className="absolute inset-x-0 bottom-1 h-3 sm:h-4 bg-amber-300/55 dark:bg-amber-400/30 -z-0" />
          </span>{" "}
          하세요.
          <br />
          SNS 는{" "}
          <em className="italic" style={{ color: "#d97706" }}>
            자동으로
          </em>{" "}
          굴러갑니다.
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mt-6 sm:mt-9 max-w-[600px] text-[15px] sm:text-[17px] leading-[1.65] text-zinc-600 dark:text-zinc-400"
        >
          매일 한 컷씩 발행되고, 댓글이 응답되고, 다음 주 일정이 미리 짜집니다. 사장님은 가게에 집중하시고, 인스타·블로그·카카오 운영은 BRIQ 가 대신합니다.
        </motion.p>

        {/* CTA 카드 — 신뢰 라벨 + 큰 버튼 + 부가 링크 */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-8 sm:mt-10"
        >
          {/* 신뢰 라벨 — 카드 결제·무료·시간 */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mb-4 text-[11.5px] text-zinc-600 dark:text-zinc-400">
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              14일 무료 체험
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              신용카드 입력 X
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              3분 가입
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
            <Link
              href="/onboarding"
              className="group inline-flex items-center justify-center gap-2 h-14 sm:h-13 px-6 sm:px-8 text-white text-[15px] sm:text-[14px] tracking-[0.04em] font-semibold transition-all shadow-[0_8px_24px_-8px_rgba(217,119,6,0.6)] hover:shadow-[0_12px_28px_-8px_rgba(217,119,6,0.7)] hover:-translate-y-0.5"
              style={{
                background: "linear-gradient(135deg, #d97706 0%, #b45309 100%)",
              }}
            >
              지금 바로 시작
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center gap-2 h-14 sm:h-13 px-6 text-[14px] tracking-[0.04em] font-medium border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
            >
              데모 먼저 보기
            </Link>
          </div>
        </motion.div>

        {/* 자동 운영 라이브 보드 — 실제 시스템이 돌아가는 모습 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.35 }}
          className="mt-16 sm:mt-24"
        >
          <div className="flex items-baseline justify-between mb-5">
            <div className="editorial-label">지금 가게에서</div>
            <div className="text-[11px] text-zinc-500 tabular-nums">
              <NowClock /> 기준 · 자동 갱신
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-0 gap-y-8 border-y border-zinc-200 dark:border-zinc-800 py-8">
            <LiveStat label="오늘 자동 발행" value="2" unit="건" detail="오전 10:18 · 오후 7:12" accent="amber" />
            <LiveStat label="이번 주 예약" value="12" unit="건" detail="인스타 9 · 블로그 3" accent="sky" />
            <LiveStat label="자동 응답" value="ON" detail="댓글·DM 평균 3분 회신" accent="emerald" />
            <LiveStat label="이번 주 캠페인" value="2" unit="개" detail="신메뉴 · 어버이날" accent="rose" />
          </div>
        </motion.div>

        {/* 이번 주 캘린더 — 매거진 목차 결 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.45 }}
          className="mt-14"
        >
          <div className="editorial-label mb-5">이번 주 발행 일정</div>
          <ol className="divide-y divide-zinc-200 dark:divide-zinc-800 border-y border-zinc-200 dark:border-zinc-800">
            {WEEK.map((w) => (
              <li key={w.day} className="grid grid-cols-12 items-baseline gap-3 py-3.5">
                <div className="col-span-2 sm:col-span-1 editorial-label">{w.day}</div>
                <div className="col-span-3 sm:col-span-2 text-[11px] tracking-[0.15em] uppercase text-zinc-400">
                  {w.channel}
                </div>
                <div className="col-span-5 sm:col-span-7 text-[13.5px] sm:text-[14px] leading-snug" style={{ fontFamily: "'Nanum Myeongjo', serif" }}>
                  {w.title}
                </div>
                <div className="col-span-2 sm:col-span-2 text-right">
                  <StatusChip status={w.status} />
                </div>
              </li>
            ))}
          </ol>
        </motion.div>
      </div>

      {/* 모바일 sticky CTA — 스크롤 중에도 항상 보이는 시작 버튼 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 1 }}
        className="sm:hidden fixed bottom-4 left-4 right-4 z-30"
      >
        <Link
          href="/onboarding"
          className="block w-full h-13 leading-[3.25rem] text-center text-white text-[14px] tracking-[0.04em] font-semibold rounded-full shadow-[0_10px_28px_-6px_rgba(217,119,6,0.55)] backdrop-blur"
          style={{
            background: "linear-gradient(135deg, #d97706 0%, #b45309 100%)",
          }}
        >
          3분 만에 시작하기 →
        </Link>
      </motion.div>
    </section>
  );
}

function StatusChip({ status }: { status: string }) {
  // 상태별 컬러 — 발행됨 emerald · 예약 sky · 초안 zinc · 대기 amber · 자동 violet · 쉼 zinc
  const tone: Record<string, string> = {
    발행됨: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
    예약: "bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300",
    초안: "bg-zinc-50 text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400",
    대기: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
    자동: "bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300",
    쉼: "bg-zinc-50 text-zinc-400 dark:bg-zinc-900 dark:text-zinc-600",
  };
  const cls = tone[status] ?? tone.초안;
  return (
    <span className={`inline-block px-2 py-0.5 text-[10px] tracking-[0.06em] font-medium ${cls}`}>
      {status}
    </span>
  );
}

function NowClock() {
  const [time, setTime] = React.useState("");
  React.useEffect(() => {
    setTime(new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }));
  }, []);
  return <span>{time}</span>;
}

function LiveStat({
  label,
  value,
  unit,
  detail,
  accent = "amber",
}: {
  label: string;
  value: string;
  unit?: string;
  detail: string;
  accent?: "amber" | "emerald" | "sky" | "rose";
}) {
  const accentClasses = {
    amber: "text-amber-600 dark:text-amber-400 bg-amber-500",
    emerald: "text-emerald-600 dark:text-emerald-400 bg-emerald-500",
    sky: "text-sky-600 dark:text-sky-400 bg-sky-500",
    rose: "text-rose-600 dark:text-rose-400 bg-rose-500",
  };
  const cls = accentClasses[accent];
  return (
    <div className="px-5 first:pl-0 sm:border-l sm:border-zinc-200 dark:sm:border-zinc-800 sm:first:border-l-0">
      <div className="inline-flex items-center gap-1.5">
        <span className={`inline-block h-1.5 w-1.5 rounded-full ${cls.split(" ").pop()}`} />
        <div className="editorial-label">{label}</div>
      </div>
      <div className="mt-2 flex items-baseline gap-1">
        <div
          className={`text-[36px] sm:text-[44px] tabular-nums leading-none tracking-tight ${cls.split(" ").slice(0, 2).join(" ")}`}
          style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 500 }}
        >
          {value}
        </div>
        {unit && <div className="text-[14px] text-zinc-500">{unit}</div>}
      </div>
      <div className="mt-2 text-[11.5px] text-zinc-500 dark:text-zinc-500">{detail}</div>
    </div>
  );
}

const WEEK = [
  { day: "월", channel: "인스타", title: "오늘 한 컷 · 점심 자리 안내", status: "발행됨" },
  { day: "화", channel: "네이버 블로그", title: "5월 봄나물 코스 — 산지 후기", status: "예약" },
  { day: "수", channel: "인스타", title: "오늘 한 컷 · 시그니처 메뉴", status: "초안" },
  { day: "목", channel: "인스타", title: "주말 예약 안내 카드뉴스", status: "초안" },
  { day: "금", channel: "인스타", title: "릴스 · 시즌 한 컷", status: "대기" },
  { day: "토", channel: "스토리", title: "토요일 영업 안내", status: "자동" },
  { day: "일", channel: "—", title: "쉼", status: "쉼" },
];
