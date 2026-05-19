"use client";

// Landing Hero — 매거진 스프레드 결.
//
// 10년차 베테랑 무브: SaaS 시그널(그라데이션·블롭·다색·큰 그림자) 전부 제거.
// 타이포가 디자인 그 자체가 되도록 — Aesop · Hermès · Apartamento · Kinfolk 결.
//
// 골격 (모두 매거진 본 권의 한 꼭지처럼):
//   I.   Folio — 발행 메타데이터 한 줄 (BRIQ · MMXXVI · VOL.I)
//   II.  Display — 헤드라인. 세리프 이탤릭 액센트 단어 두 개만 강조.
//   III. Lede — 본문 첫 문단. 드롭캡 없이도 위계 분명.
//   IV.  Apparatus — CTA + 미세 신뢰 라인 (헤어라인 룰 사이).
//   V.   Field Notes — 라이브 운영 상황. 박스 카드 대신 매거진 산문.
//   VI.  Diary — 이번 주 발행 일지. 시간 도장 이탤릭.
//   VII. Colophon — 푸터 한 줄. (Issued from Seoul · Daily, except Sundays.)
//
// 컬러: warm ink + paper. 액센트는 색이 아니라 *이탤릭*.

import * as React from "react";
import Link from "next/link";
import { motion } from "motion/react";
import {
  INK,
  INK_SOFT,
  INK_MUTE,
  RULE,
  PAPER,
  SAGE,
  HL,
  SERIF_LATIN,
  SERIF_HANGUL,
} from "@/lib/landing/tokens";

// 페이지 main 에 #FAF7EE 페이퍼 워시가 깔려 있어서 Hero 자체는 transparent.
// 단, sticky CTA 의 텍스트 색만 한 번 재참조.
const PAPER_WASH = PAPER;

// 모션 — 절제. 큰 translate 없음. 1~2px nudging + opacity.
const fade = {
  initial: { opacity: 0, y: 4 },
  animate: { opacity: 1, y: 0 },
};

export function Hero() {
  // 라이브 — 오늘의 요일·반(오전/오후) 한국어로 자연스러운 문장에 짜 넣음.
  // hydration 미스매치 방지: 마운트 후에만 set.
  const [today, setToday] = React.useState<{
    weekdayIdx: number; // 0=월 … 6=일
    weekdayKo: string;
    half: "오전" | "오후";
    timeHm: string;
  } | null>(null);
  React.useEffect(() => {
    const d = new Date();
    // Date.getDay(): 0=일, 1=월, … → 우리는 월=0 으로 변환
    const weekdayIdx = (d.getDay() + 6) % 7;
    const weekdays = ["월", "화", "수", "목", "금", "토", "일"];
    const half: "오전" | "오후" = d.getHours() < 12 ? "오전" : "오후";
    const hh = ((d.getHours() + 11) % 12 + 1).toString().padStart(2, "0");
    const mm = d.getMinutes().toString().padStart(2, "0");
    setToday({ weekdayIdx, weekdayKo: weekdays[weekdayIdx], half, timeHm: `${hh}:${mm}` });
  }, []);

  return (
    <section
      className="relative overflow-hidden"
      // 페이지 main 에 #FAF7EE 워시가 이미 입혀져 있어 Hero 는 투명으로 흘려보냄
    >
      {/* 좌측 editorial spine — 데스크탑에서만, 0.5px 라인 */}
      <div
        aria-hidden
        className="hidden lg:block absolute left-[88px] top-0 bottom-0"
        style={{ width: 0.5, background: RULE }}
      />

      <div className="relative max-w-[1240px] mx-auto px-6 sm:px-14 lg:pl-[160px] lg:pr-20 pt-10 sm:pt-20 pb-40 sm:pb-32">
        {/* ── I. Folio — 발행 메타 한 줄 ─────────────────────────────────── */}
        <motion.header
          {...fade}
          transition={{ duration: 0.5 }}
          className="flex items-center justify-between gap-6 pb-4 border-b"
          style={{ borderColor: RULE }}
        >
          <div className="flex items-center gap-3 sm:gap-4">
            <SectionMark numeral="I" />
            <div className="text-[10.5px] tracking-[0.24em] uppercase" style={{ color: INK }}>
              BRIQ
            </div>
            <div style={{ color: INK_MUTE }} className="text-[10px]">·</div>
            <div className="text-[10px] tracking-[0.18em] uppercase" style={{ color: INK_MUTE }}>
              An Operator for Small Businesses
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-3 text-[10px] tracking-[0.18em] uppercase" style={{ color: INK_MUTE }}>
            <span>Vol. I</span>
            <span>·</span>
            <span className="tabular-nums">MMXXVI</span>
            <span>·</span>
            <NowClock />
          </div>
          <div className="sm:hidden text-[10px] tracking-[0.18em] uppercase tabular-nums" style={{ color: INK_MUTE }}>
            <NowClock />
          </div>
        </motion.header>

        {/* ── II. Display ─────────────────────────────────────────────── */}
        <motion.div
          {...fade}
          transition={{ duration: 0.7, delay: 0.08, ease: [0.2, 0.7, 0.2, 1] }}
          className="mt-10 sm:mt-20 grid grid-cols-12 gap-x-6"
        >
          <div className="col-span-12 lg:col-span-1 lg:pt-3">
            <SectionMark numeral="II" />
          </div>
          <h1
            className="col-span-12 lg:col-span-11 text-[44px] sm:text-[80px] md:text-[104px] lg:text-[120px] leading-[0.96] tracking-[-0.035em] font-normal"
            style={{ fontFamily: SERIF_LATIN, fontWeight: 400, color: INK }}
          >
            <span className="block">
              사장님은{" "}
              <Hilight>장사만</Hilight>
              <span className="hidden sm:inline">,</span>
            </span>
            <span className="block mt-1 sm:mt-2">
              <Quiet>SNS 는{" "}</Quiet>
              <em
                className="italic"
                style={{ fontFamily: SERIF_LATIN, fontStyle: "italic", color: INK, fontWeight: 400 }}
              >
                자동으로
              </em>
              <Quiet>{" "}굴러갑니다.</Quiet>
            </span>
          </h1>
        </motion.div>

        {/* ── III. Lede ───────────────────────────────────────────────── */}
        <motion.div
          {...fade}
          transition={{ duration: 0.6, delay: 0.18 }}
          className="mt-14 sm:mt-20 grid grid-cols-12 gap-x-6"
        >
          <div className="col-span-12 lg:col-span-1">
            <SectionMark numeral="III" />
          </div>
          <p
            className="col-span-12 lg:col-span-7 text-[16px] sm:text-[19px] leading-[1.7]"
            style={{ fontFamily: SERIF_HANGUL, color: INK_SOFT }}
          >
            매일 한 컷이 발행되고, 댓글이 응답되고, 다음 주 일정이 미리
            짜집니다. 사장님은 가게에 집중하시고, 인스타·블로그·카카오 운영은
            BRIQ 가 대신합니다.
          </p>
          <aside
            className="col-span-12 lg:col-span-3 lg:col-start-10 mt-6 lg:mt-2 lg:pl-6 lg:border-l"
            style={{ borderColor: RULE }}
          >
            <div className="text-[10px] tracking-[0.22em] uppercase" style={{ color: INK_MUTE }}>
              At a glance
            </div>
            <ul className="mt-3 space-y-1.5 text-[12.5px]" style={{ color: INK_SOFT, fontFamily: SERIF_HANGUL }}>
              <li>· 14일 무료 · 카드 입력 없음</li>
              <li>· 3분 만에 가입</li>
              <li>· 한국 소상공인 <em className="not-italic tabular-nums">200+</em> 가게 사용 중</li>
            </ul>
          </aside>
        </motion.div>

        {/* ── IV. Apparatus — CTA ─────────────────────────────────────── */}
        <motion.div
          {...fade}
          transition={{ duration: 0.6, delay: 0.28 }}
          className="mt-14 sm:mt-20 grid grid-cols-12 gap-x-6"
        >
          <div className="col-span-12 lg:col-span-1">
            <SectionMark numeral="IV" />
          </div>
          <div
            className="col-span-12 lg:col-span-11 flex flex-col sm:flex-row items-stretch sm:items-baseline gap-x-8 gap-y-5 pb-6 border-b"
            style={{ borderColor: RULE }}
          >
            {/* Primary — 솔리드 잉크. 작고 단정. */}
            <Link
              href="/onboarding"
              className="group inline-flex items-center justify-center gap-3 h-12 sm:h-[46px] px-7 text-[12.5px] tracking-[0.16em] uppercase font-medium transition-colors"
              style={{ background: INK, color: PAPER_WASH }}
            >
              Begin
              <span aria-hidden className="text-[14px] tracking-normal transition-transform group-hover:translate-x-0.5">→</span>
            </Link>
            {/* Secondary — 헤어라인 outlined */}
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center gap-2 h-12 sm:h-[46px] px-6 text-[12.5px] tracking-[0.16em] uppercase transition-colors hover:bg-[rgba(20,19,15,0.04)]"
              style={{ border: `0.5px solid ${INK}`, color: INK }}
            >
              View the demo
            </Link>
            {/* Tertiary — pure underline link, 매거진 결 (모바일에서도 노출) */}
            <Link
              href="/pricing"
              className="self-center sm:self-auto text-[12px] sm:text-[12.5px] tracking-[0.04em] underline underline-offset-[6px] decoration-[0.5px]"
              style={{ color: INK_SOFT, textDecorationColor: RULE }}
            >
              가격 — 한 장으로 정리
            </Link>
          </div>
        </motion.div>

        {/* ── V. Field Notes — 운영 산문 ─────────────────────────────────── */}
        <motion.section
          {...fade}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="mt-20 sm:mt-32 grid grid-cols-12 gap-x-6"
        >
          <div className="col-span-12 lg:col-span-1">
            <SectionMark numeral="V" />
          </div>
          <div className="col-span-12 lg:col-span-11">
            <Kicker>Field Notes · 지금 가게에서</Kicker>
            {today && (
              <div
                className="mt-2 text-[12px] italic"
                style={{ fontFamily: SERIF_LATIN, color: INK_SOFT }}
              >
                오늘은 <em className="not-italic" style={{ fontFamily: SERIF_HANGUL, color: INK, fontWeight: 500 }}>{today.weekdayKo}요일</em>입니다.
              </div>
            )}
            <p
              className="mt-5 text-[18px] sm:text-[22px] leading-[1.55] max-w-[820px]"
              style={{ fontFamily: SERIF_HANGUL, color: INK }}
            >
              {today ? `오늘 ${today.half}` : "오늘 오전"}{" "}
              <Stamp>{today?.timeHm ?? "10:18"}</Stamp> 기준,
              이번 주 <Stamp>12</Stamp> 건이 예약되어 있고
              오늘 자동 발행은 <Stamp>2</Stamp> 건 완료되었습니다. 댓글·DM 자동
              응답은 <em className="italic" style={{ fontFamily: SERIF_LATIN }}>ON</em>{" "}
              — 평균 <Stamp>3분</Stamp> 안에 회신합니다. 이번 주 진행 중인
              캠페인은 두 개, <em className="italic" style={{ fontFamily: SERIF_LATIN }}>신메뉴</em>{" "}
              와 <em className="italic" style={{ fontFamily: SERIF_LATIN }}>어버이날</em>.
            </p>

            {/* 라이브 메트릭 — 박스 없이 본문 사이에 numbered figures */}
            <dl className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-x-0 gap-y-6 pt-6 border-t" style={{ borderColor: RULE }}>
              <Figure label="Today / posted" value="2" detail="10:18 · 19:12" />
              <Figure label="This week / scheduled" value="12" detail="인스타 9 · 블로그 3" />
              <Figure label="Auto-reply" value="ON" italic detail="comments · DMs · 3 min" />
              <Figure label="Campaigns" value="2" detail="신메뉴 · 어버이날" />
            </dl>
          </div>
        </motion.section>

        {/* ── VI. Diary — 이번 주 일지 ─────────────────────────────────── */}
        <motion.section
          {...fade}
          transition={{ duration: 0.7, delay: 0.5 }}
          className="mt-20 sm:mt-28 grid grid-cols-12 gap-x-6"
        >
          <div className="col-span-12 lg:col-span-1">
            <SectionMark numeral="VI" />
          </div>
          <div className="col-span-12 lg:col-span-11">
            <Kicker>Diary · 이번 주 발행 일지</Kicker>
            <ol className="mt-5 border-t" style={{ borderColor: RULE }}>
              {WEEK.map((w, i) => {
                const isToday = today?.weekdayIdx === i;
                return (
                <li
                  key={w.day}
                  className="group grid grid-cols-12 items-baseline gap-x-3 sm:gap-x-6 py-5 border-b transition-colors hover:bg-[rgba(20,19,15,0.025)]"
                  style={{
                    borderColor: RULE,
                    background: isToday ? "rgba(230,221,200,0.28)" : undefined,
                  }}
                >
                  {/* 인덱스 — 로만/타뷸러. 오늘은 작은 dot + Today 라벨 */}
                  <div
                    className="col-span-2 sm:col-span-1 text-[10.5px] tracking-[0.18em] uppercase tabular-nums inline-flex items-center gap-1.5"
                    style={{ color: isToday ? INK : INK_MUTE }}
                  >
                    {isToday ? (
                      <>
                        <span
                          aria-hidden
                          className="inline-block h-[5px] w-[5px] rounded-full"
                          style={{ background: INK }}
                        />
                        <span className="italic" style={{ fontFamily: SERIF_LATIN }}>
                          Today
                        </span>
                      </>
                    ) : (
                      String(i + 1).padStart(2, "0")
                    )}
                  </div>
                  {/* 요일 — 세리프, 오늘은 italic */}
                  <div
                    className="col-span-2 sm:col-span-1 text-[17px] sm:text-[19px] leading-none"
                    style={{
                      fontFamily: SERIF_HANGUL,
                      color: INK,
                      fontWeight: isToday ? 600 : 500,
                      fontStyle: isToday ? "italic" : "normal",
                    }}
                  >
                    {w.day}
                  </div>
                  {/* 시간 — 이탤릭 타뷸러 */}
                  <div
                    className="col-span-3 sm:col-span-2 text-[12.5px] tabular-nums italic"
                    style={{ color: isToday ? INK : INK_SOFT, fontFamily: SERIF_LATIN }}
                  >
                    {w.time}
                  </div>
                  {/* 채널 — small caps */}
                  <div
                    className="hidden sm:block col-span-2 text-[10.5px] tracking-[0.18em] uppercase"
                    style={{ color: INK_MUTE }}
                  >
                    {w.channel}
                  </div>
                  {/* 제목 — 본문 세리프 */}
                  <div
                    className="col-span-5 sm:col-span-5 text-[14px] sm:text-[15.5px] leading-snug"
                    style={{ fontFamily: SERIF_HANGUL, color: INK }}
                  >
                    {w.title}
                  </div>
                  {/* 상태 */}
                  <div className="col-span-12 sm:col-span-1 sm:text-right mt-1 sm:mt-0">
                    <StatusMark status={w.status} />
                  </div>
                </li>
                );
              })}
            </ol>
          </div>
        </motion.section>

        {/* ── VII. Colophon ─────────────────────────────────────────────── */}
        <motion.footer
          {...fade}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="mt-24 sm:mt-32 grid grid-cols-12 gap-x-6"
        >
          <div className="col-span-12 lg:col-span-1">
            <SectionMark numeral="VII" />
          </div>
          <div className="col-span-12 lg:col-span-11 flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-3 pt-6 border-t" style={{ borderColor: RULE }}>
            <div
              className="text-[11.5px] tracking-[0.04em]"
              style={{ color: INK_MUTE, fontFamily: SERIF_LATIN, fontStyle: "italic" }}
            >
              Issued from Seoul. Daily, except Sundays.
              <span aria-hidden className="mx-2" style={{ color: SAGE }}>¶</span>
              Operated quietly, in the background.
            </div>
            <div className="text-[10px] tracking-[0.22em] uppercase" style={{ color: INK_MUTE }}>
              BRIQ — Set in Cormorant &amp; Nanum Myeongjo
            </div>
          </div>
        </motion.footer>
      </div>

      {/* ── Mobile sticky CTA — 절제된 잉크 바, 라벨 미니멀 ─────────────── */}
      <motion.div
        {...fade}
        transition={{ duration: 0.5, delay: 0.9 }}
        className="sm:hidden fixed bottom-4 left-4 right-4 z-30"
      >
        <Link
          href="/onboarding"
          className="grid grid-cols-[1fr_auto_1fr] items-center w-full h-12 px-4 text-[12px] tracking-[0.18em] uppercase font-medium"
          style={{
            background: INK,
            color: PAPER_WASH,
            boxShadow: "0 6px 20px -8px rgba(20,19,15,0.35)",
          }}
        >
          <span aria-hidden className="text-left italic" style={{ fontFamily: SERIF_LATIN, fontStyle: "italic", letterSpacing: 0, textTransform: "none", opacity: 0.55 }}>
            3 min
          </span>
          <span className="text-center">Begin</span>
          <span aria-hidden className="text-right text-[14px] tracking-normal">→</span>
        </Link>
      </motion.div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
// Sub-components — 매거진 결의 작은 부속들
// ─────────────────────────────────────────────────────────────

/** 섹션 번호 마커 — 로만 숫자, 헤어라인 결 */
function SectionMark({ numeral }: { numeral: string }) {
  return (
    <div
      className="inline-flex items-baseline gap-1.5 text-[10.5px] tracking-[0.22em] uppercase tabular-nums"
      style={{ color: INK_MUTE, fontFamily: SERIF_LATIN, fontStyle: "italic" }}
    >
      <span aria-hidden style={{ color: RULE }}>—</span>
      <span>{numeral}.</span>
    </div>
  );
}

/** 본문 톤다운 텍스트 (헤드라인용) */
function Quiet({ children }: { children: React.ReactNode }) {
  return <span style={{ color: INK_MUTE }}>{children}</span>;
}

/** 크림 하이라이트 — 글자 뒤에 깔리는 종이결, 매우 절제 */
function Hilight({ children }: { children: React.ReactNode }) {
  return (
    <span className="relative inline-block">
      <span className="relative z-10">{children}</span>
      <span
        aria-hidden
        className="absolute inset-x-[-2px] bottom-[6px] sm:bottom-[10px] h-[10px] sm:h-[16px] -z-0"
        style={{ background: HL, opacity: 0.9 }}
      />
    </span>
  );
}

/** Field Notes 산문 안 숫자/시간 도장 — 이탤릭 + 헤어라인 박스 */
function Stamp({ children }: { children: React.ReactNode }) {
  return (
    <em
      className="inline-block tabular-nums italic px-[6px] py-[1px] mx-[1px] text-[0.92em]"
      style={{
        fontFamily: SERIF_LATIN,
        fontStyle: "italic",
        color: INK,
        borderBottom: `0.5px solid ${INK}`,
      }}
    >
      {children}
    </em>
  );
}

/** 섹션 키커 라인 — small caps, 헤어라인 룰 위 */
function Kicker({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <div className="text-[10.5px] tracking-[0.22em] uppercase" style={{ color: INK_MUTE }}>
        {children}
      </div>
      <div className="flex-1 h-px" style={{ background: RULE }} />
    </div>
  );
}

/** 라이브 메트릭 — 박스 없음, 매거진의 numbered figure */
function Figure({
  label,
  value,
  detail,
  italic = false,
}: {
  label: string;
  value: string;
  detail: string;
  italic?: boolean;
}) {
  return (
    <div className="px-0 sm:px-5 first:pl-0 md:border-l md:first:border-l-0" style={{ borderColor: RULE }}>
      <div className="text-[10px] tracking-[0.22em] uppercase" style={{ color: INK_MUTE }}>
        {label}
      </div>
      <div
        className="mt-2 text-[40px] sm:text-[52px] leading-none tabular-nums"
        style={{
          fontFamily: SERIF_LATIN,
          fontWeight: 400,
          color: INK,
          fontStyle: italic ? "italic" : "normal",
        }}
      >
        {value}
      </div>
      <div className="mt-2.5 text-[11.5px] tabular-nums" style={{ color: INK_SOFT, fontFamily: SERIF_LATIN, fontStyle: "italic" }}>
        {detail}
      </div>
    </div>
  );
}

/** 상태 — 색 없이 점 한 개 + 텍스트. 진정한 절제. */
function StatusMark({ status }: { status: string }) {
  const dot = (() => {
    switch (status) {
      case "발행됨":
      case "자동":
        return INK;
      case "예약":
        return SAGE;
      case "초안":
      case "대기":
        return INK_MUTE;
      default:
        return "transparent";
    }
  })();
  return (
    <span
      className="inline-flex items-center gap-1.5 text-[10.5px] tracking-[0.18em] uppercase"
      style={{ color: INK_SOFT }}
    >
      <span aria-hidden className="inline-block h-[5px] w-[5px] rounded-full" style={{ background: dot }} />
      {status}
    </span>
  );
}

function NowClock() {
  const [time, setTime] = React.useState("");
  React.useEffect(() => {
    setTime(
      new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })
    );
  }, []);
  return <span className="tabular-nums">{time || "—"}</span>;
}

const WEEK = [
  { day: "월", time: "10:18", channel: "Instagram", title: "오늘 한 컷 — 점심 자리 안내", status: "발행됨" },
  { day: "화", time: "11:24", channel: "Naver", title: "5월 봄나물 코스 · 산지 후기", status: "예약" },
  { day: "수", time: "10:42", channel: "Instagram", title: "오늘 한 컷 · 시그니처 메뉴", status: "초안" },
  { day: "목", time: "12:08", channel: "Instagram", title: "주말 예약 안내 카드뉴스", status: "초안" },
  { day: "금", time: "18:30", channel: "Instagram", title: "릴스 — 시즌 한 컷", status: "대기" },
  { day: "토", time: "09:00", channel: "Story", title: "토요일 영업 안내", status: "자동" },
  { day: "일", time: "—",     channel: "—",         title: "쉼.",                       status: "쉼" },
];
