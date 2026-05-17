"use client";

// Landing Hero — "AI 기능 소개" 가 아니라 "이미 자동으로 돌아가는 상태" 노출
// 사용자가 들어왔을 때 "AI 툴" 이 아니라 "내 SNS 가 이미 운영되고 있다" 느끼게.

import * as React from "react";
import Link from "next/link";
import { motion } from "motion/react";

export function Hero() {
  return (
    <section className="bg-[color:var(--bg)]">
      <div className="max-w-[1180px] mx-auto px-6 sm:px-12 pt-20 sm:pt-32 pb-16 sm:pb-24">
        {/* Masthead — 매거진 결 */}
        <div className="flex items-baseline justify-between border-b border-zinc-300 dark:border-zinc-700 pb-3">
          <div className="editorial-label">BRIQ</div>
          <div className="editorial-label">Auto-Running SNS Operations</div>
        </div>

        {/* 메인 헤드라인 */}
        <motion.h1
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.2, 0.7, 0.2, 1] }}
          className="mt-10 sm:mt-16 text-[44px] sm:text-[72px] md:text-[96px] leading-[0.95] tracking-[-0.025em] font-medium max-w-[1000px]"
          style={{ fontFamily: "'Cormorant Garamond', 'Nanum Myeongjo', serif", fontWeight: 500 }}
        >
          사장님은 장사만 하세요.
          <br />
          SNS 는 자동으로 굴러갑니다.
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mt-7 sm:mt-9 max-w-[600px] text-[15px] sm:text-[17px] leading-[1.65] text-zinc-600 dark:text-zinc-400"
        >
          매일 한 컷씩 발행되고, 댓글이 응답되고, 다음 주 일정이 미리 짜집니다. 사장님은 가게에 집중하시고, 인스타·블로그·카카오 운영은 BRIQ 가 대신합니다.
        </motion.p>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-10 flex items-center gap-4"
        >
          <Link
            href="/onboarding"
            className="group inline-flex items-center gap-3 h-12 px-6 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-[14px] tracking-[0.04em] uppercase font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
          >
            가게 등록하고 시작
            <span className="group-hover:translate-x-1 transition-transform">→</span>
          </Link>
          <Link
            href="/dashboard"
            className="text-[13.5px] text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 underline underline-offset-4 decoration-[0.5px]"
          >
            데모 보기
          </Link>
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
            <LiveStat label="오늘 자동 발행" value="2" unit="건" detail="오전 10:18 · 오후 7:12" />
            <LiveStat label="이번 주 예약" value="12" unit="건" detail="인스타 9 · 블로그 3" />
            <LiveStat label="자동 응답" value="ON" detail="댓글·DM 평균 3분 회신" />
            <LiveStat label="이번 주 캠페인" value="2" unit="개" detail="신메뉴 · 어버이날" />
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
                <div className="col-span-5 sm:col-span-7 text-[14px]" style={{ fontFamily: "'Nanum Myeongjo', serif" }}>
                  {w.title}
                </div>
                <div className="col-span-2 sm:col-span-2 text-right text-[10px] tracking-[0.15em] uppercase text-zinc-400">
                  {w.status}
                </div>
              </li>
            ))}
          </ol>
        </motion.div>
      </div>
    </section>
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
}: {
  label: string;
  value: string;
  unit?: string;
  detail: string;
}) {
  return (
    <div className="px-5 first:pl-0 sm:border-l sm:border-zinc-200 dark:sm:border-zinc-800 sm:first:border-l-0">
      <div className="editorial-label">{label}</div>
      <div className="mt-2 flex items-baseline gap-1">
        <div
          className="text-[36px] sm:text-[44px] tabular-nums leading-none tracking-tight"
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
  { day: "월", channel: "Instagram", title: "오늘 한 컷 · 점심 자리 안내", status: "Issued" },
  { day: "화", channel: "Naver Blog", title: "5월 봄나물 코스 — 산지 후기", status: "Scheduled" },
  { day: "수", channel: "Instagram", title: "오늘 한 컷 · 시그니처 메뉴", status: "Drafting" },
  { day: "목", channel: "Instagram", title: "주말 예약 안내 카드뉴스", status: "Drafting" },
  { day: "금", channel: "Instagram", title: "릴스 · 시즌 한 컷", status: "Queued" },
  { day: "토", channel: "Story", title: "토요일 영업 안내", status: "Auto" },
  { day: "일", channel: "—", title: "쉼", status: "Off" },
];
