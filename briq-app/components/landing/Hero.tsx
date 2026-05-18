"use client";

// Landing Hero — 2026 SaaS 랜딩 디자인 원칙
//
// 모노톤 + 단일 액센트(sage). 29CM · Aesop · Linear · Vercel 결.
// 모바일 우선 — 24px 가장자리, 풍부한 수직 리듬, 단일 검정 CTA.
//
// 정보 위계:
//   ① Eyebrow — 카테고리 식별
//   ② Headline — 한 줄 가치 제안 (세리프, 핵심 단어 하이라이트)
//   ③ Sub-deck — 보조 한 문장
//   ④ Trust strip — 즉시 신뢰 증거
//   ⑤ Primary CTA — 검정 단일 버튼 + 부가 텍스트 링크
//   ⑥ Live board — 운영 중 표시 (단일 톤)
//   ⑦ Editorial calendar — 발행 일정
//   ⑧ Mobile sticky CTA

import * as React from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { ArrowRight, Check } from "lucide-react";

// ─────────────────────────────────────────────────────────────
// 컬러 토큰 — 한 곳에서 관리 (light/dark 통일)
// ─────────────────────────────────────────────────────────────
const SAGE = "#5C6F5A";          // 사지 그린 액센트
const CREAM_HL = "#E8E4D5";      // 헤드라인 하이라이트 (cream)
const SAGE_DARK = "#7A8B78";     // dark mode sage

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-[color:var(--bg)]">
      {/* 절제된 단색 블롭 — sage 단일 톤, 매우 부드럽게 */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div
          className="absolute -top-40 -right-32 h-[520px] w-[520px] rounded-full opacity-[0.18] dark:opacity-[0.08]"
          style={{
            background: `radial-gradient(closest-side, ${SAGE} 0%, transparent 70%)`,
            filter: "blur(80px)",
          }}
        />
        <div
          className="absolute top-1/2 -left-32 h-[400px] w-[400px] rounded-full opacity-[0.10] dark:opacity-[0.06]"
          style={{
            background: `radial-gradient(closest-side, ${CREAM_HL} 0%, transparent 70%)`,
            filter: "blur(100px)",
          }}
        />
      </div>

      <div className="relative max-w-[1180px] mx-auto px-6 sm:px-12 pt-14 sm:pt-28 pb-20 sm:pb-28">
        {/* ── 1. Eyebrow + Trust signal (한 줄로 통합) ──────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-2.5"
        >
          <span
            className="inline-block h-1.5 w-1.5 rounded-full"
            style={{ background: SAGE }}
          />
          <span className="text-[11px] tracking-[0.18em] uppercase font-medium text-zinc-700 dark:text-zinc-300">
            BRIQ
          </span>
          <span className="text-zinc-300 dark:text-zinc-700 text-[11px]">·</span>
          <span className="text-[11px] tracking-[0.08em] text-zinc-500 dark:text-zinc-500">
            소상공인 SNS 자동화 · 2026
          </span>
        </motion.div>

        {/* ── 2. Headline ──────────────────────────────────────────────── */}
        <motion.h1
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.2, 0.7, 0.2, 1], delay: 0.05 }}
          className="mt-8 sm:mt-12 text-[40px] sm:text-[68px] md:text-[88px] leading-[1.02] sm:leading-[0.98] tracking-[-0.025em] font-medium max-w-[1000px] text-zinc-900 dark:text-zinc-50"
          style={{ fontFamily: "'Cormorant Garamond', 'Nanum Myeongjo', serif", fontWeight: 500 }}
        >
          사장님은{" "}
          <span className="relative inline-block">
            <span className="relative z-10">장사만</span>
            {/* 크림 하이라이트 — 절제된 결 */}
            <span
              aria-hidden
              className="absolute inset-x-0 bottom-1 h-[10px] sm:h-[14px] -z-0"
              style={{ background: CREAM_HL, opacity: 0.85 }}
            />
          </span>{" "}
          하세요.
          <br />
          <span className="text-zinc-400 dark:text-zinc-600">SNS 는 </span>
          <em
            className="italic font-medium"
            style={{ color: SAGE, fontStyle: "italic" }}
          >
            자동으로
          </em>{" "}
          <span className="text-zinc-400 dark:text-zinc-600">굴러갑니다.</span>
        </motion.h1>

        {/* ── 3. Sub-deck ──────────────────────────────────────────────── */}
        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="mt-6 sm:mt-8 max-w-[580px] text-[15px] sm:text-[17px] leading-[1.65] text-zinc-600 dark:text-zinc-400"
        >
          매일 한 컷씩 발행되고, 댓글이 응답되고, 다음 주 일정이 미리 짜집니다.
          사장님은 가게에 집중하시고, 인스타·블로그·카카오 운영은 BRIQ 가 대신합니다.
        </motion.p>

        {/* ── 4. CTA + Trust ───────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.25 }}
          className="mt-10 sm:mt-12"
        >
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-5">
            {/* Primary — ink 단일 버튼 (그라데이션·그림자 제거) */}
            <Link
              href="/onboarding"
              className="group inline-flex items-center justify-center gap-2.5 h-14 sm:h-[52px] px-7 sm:px-9 bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 text-[14.5px] sm:text-[14px] tracking-[0.02em] font-medium hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors"
            >
              지금 바로 시작
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            {/* Secondary — 텍스트 링크 (절제) */}
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center sm:justify-start gap-1 text-[14px] tracking-[0.02em] text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-50 underline underline-offset-[6px] decoration-[0.5px] decoration-zinc-300 dark:decoration-zinc-700 hover:decoration-zinc-900 dark:hover:decoration-zinc-50"
            >
              데모 먼저 보기
            </Link>
          </div>

          {/* Trust micro — CTA 아래 작은 한 줄, 절제 */}
          <ul className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-[12px] text-zinc-500 dark:text-zinc-500">
            <li className="inline-flex items-center gap-1.5">
              <Check className="h-3 w-3" style={{ color: SAGE }} />
              14일 무료
            </li>
            <li className="inline-flex items-center gap-1.5">
              <Check className="h-3 w-3" style={{ color: SAGE }} />
              신용카드 입력 X
            </li>
            <li className="inline-flex items-center gap-1.5">
              <Check className="h-3 w-3" style={{ color: SAGE }} />
              3분 가입
            </li>
            <li className="hidden sm:inline-flex items-center gap-1.5 ml-2">
              <span className="inline-block h-1 w-1 rounded-full" style={{ background: SAGE }} />
              한국 소상공인 200+ 가게가 사용 중
            </li>
          </ul>
        </motion.div>

        {/* ── 5. Live operations board ─────────────────────────────────── */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="mt-20 sm:mt-32"
        >
          <div className="flex items-baseline justify-between mb-5 sm:mb-6">
            <div className="editorial-label">지금 가게에서</div>
            <div className="text-[11px] text-zinc-500 dark:text-zinc-500 tabular-nums">
              <NowClock /> · 자동 갱신
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-0 gap-y-10 sm:gap-y-12 border-y border-zinc-200 dark:border-zinc-800 py-8 sm:py-10">
            <LiveStat label="오늘 자동 발행" value="2" unit="건" detail="오전 10:18 · 오후 7:12" />
            <LiveStat label="이번 주 예약" value="12" unit="건" detail="인스타 9 · 블로그 3" />
            <LiveStat label="자동 응답" value="ON" detail="댓글·DM 평균 3분 회신" pill />
            <LiveStat label="이번 주 캠페인" value="2" unit="개" detail="신메뉴 · 어버이날" />
          </div>
        </motion.section>

        {/* ── 6. This week schedule (editorial calendar) ─────────────────── */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.5 }}
          className="mt-16 sm:mt-20"
        >
          <div className="editorial-label mb-5 sm:mb-6">이번 주 발행 일정</div>
          <ol className="divide-y divide-zinc-200 dark:divide-zinc-800 border-y border-zinc-200 dark:border-zinc-800">
            {WEEK.map((w) => (
              <li
                key={w.day}
                className="grid grid-cols-12 items-baseline gap-3 py-4 sm:py-4 hover:bg-zinc-50/40 dark:hover:bg-zinc-900/40 transition-colors px-2 -mx-2"
              >
                <div className="col-span-2 sm:col-span-1 editorial-label">{w.day}</div>
                <div className="col-span-3 sm:col-span-2 text-[11px] tracking-[0.12em] uppercase text-zinc-500 dark:text-zinc-500">
                  {w.channel}
                </div>
                <div
                  className="col-span-5 sm:col-span-7 text-[13.5px] sm:text-[14.5px] leading-snug text-zinc-800 dark:text-zinc-200"
                  style={{ fontFamily: "'Nanum Myeongjo', serif" }}
                >
                  {w.title}
                </div>
                <div className="col-span-2 sm:col-span-2 text-right">
                  <StatusChip status={w.status} />
                </div>
              </li>
            ))}
          </ol>
        </motion.section>
      </div>

      {/* ── 7. Mobile sticky CTA ───────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.9 }}
        className="sm:hidden fixed bottom-4 left-4 right-4 z-30"
      >
        <Link
          href="/onboarding"
          className="flex items-center justify-center gap-2 w-full h-13 leading-[3.25rem] text-center bg-zinc-900 text-white text-[14px] tracking-[0.04em] font-medium hover:bg-zinc-800 transition-colors"
          style={{
            // 절제된 그림자 — 그라데이션 제거, 깊이감만
            boxShadow: "0 8px 24px -6px rgba(0,0,0,0.25), 0 2px 6px -2px rgba(0,0,0,0.1)",
          }}
        >
          3분 만에 시작하기
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </motion.div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────

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
  pill = false,
}: {
  label: string;
  value: string;
  unit?: string;
  detail: string;
  /** ON/OFF 같은 상태 값 — pill 형태로 강조 */
  pill?: boolean;
}) {
  return (
    <div className="px-5 first:pl-0 md:border-l md:border-zinc-200 dark:md:border-zinc-800 md:first:border-l-0">
      <div className="inline-flex items-center gap-1.5">
        <span
          className="inline-block h-1 w-1 rounded-full"
          style={{ background: SAGE }}
        />
        <div className="editorial-label">{label}</div>
      </div>
      <div className="mt-3 flex items-baseline gap-1.5">
        {pill ? (
          <span
            className="inline-flex items-center h-7 px-2.5 text-[12px] tracking-[0.08em] font-medium uppercase text-white dark:text-zinc-900"
            style={{ background: SAGE }}
          >
            {value}
          </span>
        ) : (
          <>
            <div
              className="text-[36px] sm:text-[44px] tabular-nums leading-none tracking-tight font-medium text-zinc-900 dark:text-zinc-50"
              style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 500 }}
            >
              {value}
            </div>
            {unit && <div className="text-[13px] text-zinc-500 dark:text-zinc-500">{unit}</div>}
          </>
        )}
      </div>
      <div className="mt-2 text-[11.5px] text-zinc-500 dark:text-zinc-500 leading-snug">
        {detail}
      </div>
    </div>
  );
}

function StatusChip({ status }: { status: string }) {
  // 절제된 단일 톤 시스템 — sage 변형 + zinc
  const tone: Record<string, { bg: string; text: string }> = {
    발행됨: { bg: "rgba(92,111,90,0.10)", text: SAGE },
    예약: { bg: "rgba(92,111,90,0.06)", text: SAGE },
    초안: { bg: "rgba(24,24,27,0.04)", text: "#52525b" },
    대기: { bg: "rgba(24,24,27,0.04)", text: "#71717a" },
    자동: { bg: "rgba(92,111,90,0.08)", text: SAGE },
    쉼: { bg: "transparent", text: "#a1a1aa" },
  };
  const t = tone[status] ?? tone.초안;
  return (
    <span
      className="inline-block px-2 py-0.5 text-[10.5px] tracking-[0.04em]"
      style={{ background: t.bg, color: t.text }}
    >
      {status}
    </span>
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

// SAGE_DARK reserved for future dark-mode swap if needed
void SAGE_DARK;
