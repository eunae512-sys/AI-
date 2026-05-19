"use client";

// 랜딩 sections — "AI 기능 소개" 제거, 운영 시스템 톤으로 단순화.
// 매거진 결: 큰 여백, hairline 보더, serif 헤드라인, 단어 위주 카피.

import { motion } from "motion/react";
import Link from "next/link";

const reveal = {
  initial: { opacity: 0, y: 16 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.6, ease: [0.2, 0.8, 0.2, 1] as const },
};

const SectionContainer = ({
  children,
  pad = "default",
  id,
}: {
  children: React.ReactNode;
  pad?: "default" | "wide";
  id?: string;
}) => (
  <section
    id={id}
    className={`max-w-[1180px] mx-auto px-6 sm:px-12 ${pad === "wide" ? "py-24 sm:py-32" : "py-20 sm:py-28"} scroll-mt-20`}
  >
    {children}
  </section>
);

const Eyebrow = ({ children }: { children: React.ReactNode }) => (
  <div className="editorial-label">{children}</div>
);

const Headline = ({ children, size = "lg" }: { children: React.ReactNode; size?: "lg" | "md" }) => (
  <h2
    className={`mt-4 leading-[1.05] tracking-[-0.02em] font-medium ${
      size === "lg"
        ? "text-[40px] sm:text-[56px] md:text-[64px]"
        : "text-[28px] sm:text-[36px]"
    }`}
    style={{ fontFamily: "'Cormorant Garamond', 'Nanum Myeongjo', serif", fontWeight: 500 }}
  >
    {children}
  </h2>
);

const Lede = ({ children }: { children: React.ReactNode }) => (
  <p className="mt-5 max-w-[640px] text-[15px] sm:text-[16px] text-zinc-600 dark:text-zinc-400 leading-[1.7]"
    style={{ fontFamily: "'Nanum Myeongjo', serif" }}>
    {children}
  </p>
);

// ─────────────────────────────────────────────────────────────
// Problem / 운영 부담 진단
// ─────────────────────────────────────────────────────────────

export function ProblemSection() {
  return (
    <SectionContainer>
      <motion.div {...reveal}>
        <Eyebrow>Why BRIQ exists</Eyebrow>
        <Headline>SNS 는 사장님 일이 아닙니다.</Headline>
        <Lede>
          좋은 가게가 좋은 콘텐츠를 매일 만들 시간은 없습니다. 하루 한 컷, 댓글 응답, 다음 주 일정,
          반응 데이터 — 이게 평일 매일 쌓이면 결국 가게 운영이 흔들립니다. BRIQ 는 이 작업을 직원처럼 대신 처리합니다.
        </Lede>
      </motion.div>

      <motion.ol {...reveal} className="mt-14 divide-y divide-zinc-200 dark:divide-zinc-800 border-y border-zinc-200 dark:border-zinc-800">
        {[
          { num: "01", label: "오늘 뭐 올릴지 매일 고민", out: "이번 주 한 번에 자동 큐레이션" },
          { num: "02", label: "사진 찍고 캡션 쓰고 해시태그 정리", out: "사진 한 장이면 카드뉴스·릴스·캡션 자동" },
          { num: "03", label: "댓글·DM 응대 시간", out: "브랜드 톤 학습된 자동 응답" },
          { num: "04", label: "발행 시간·요일 결정", out: "채널별 반응 데이터 기반 자동 픽" },
          { num: "05", label: "효과 분석 시간", out: "한 줄 노트로 매주 정리됨" },
        ].map((row) => (
          <li key={row.num} className="grid grid-cols-12 items-baseline gap-3 py-5">
            <div className="col-span-2 sm:col-span-1 editorial-label tabular-nums">{row.num}</div>
            <div className="col-span-10 sm:col-span-5 text-[14.5px] text-zinc-500 dark:text-zinc-500 line-through decoration-[0.5px]"
              style={{ fontFamily: "'Nanum Myeongjo', serif" }}>
              {row.label}
            </div>
            <div className="col-span-12 sm:col-span-6 text-[15px]" style={{ fontFamily: "'Nanum Myeongjo', serif" }}>
              {row.out}
            </div>
          </li>
        ))}
      </motion.ol>
    </SectionContainer>
  );
}

// ─────────────────────────────────────────────────────────────
// Brand Persona — AI 전속 모델
// ─────────────────────────────────────────────────────────────

export function ReelsFeature() {
  return (
    <SectionContainer pad="wide" id="features">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-x-10 md:gap-x-14 gap-y-8">
        <motion.div {...reveal} className="md:col-span-5">
          <Eyebrow>Brand Persona</Eyebrow>
          <Headline size="md">전속 모델이 있는 가게</Headline>
          <Lede>
            가게 컨셉에 맞는 전속 AI 모델을 한 번 정해두면, 이후 모든 콘텐츠가 같은 인물로 운영됩니다. 매번 다른 사람이 등장하지 않고, 진짜 전속 모델처럼.
          </Lede>
        </motion.div>
        <motion.div {...reveal} className="md:col-span-7">
          <div className="grid grid-cols-3 gap-3">
            {["cafe", "restaurant", "beauty", "fitness", "stay", "local"].map((ind) => (
              <div key={ind} className="aspect-[3/4] border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 flex items-end p-3">
                <div className="editorial-label">{ind}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </SectionContainer>
  );
}

// ─────────────────────────────────────────────────────────────
// 운영 흐름 — 사장님이 보는 것
// ─────────────────────────────────────────────────────────────

export function ToneFeature() {
  return (
    <SectionContainer pad="wide">
      <motion.div {...reveal}>
        <Eyebrow>How it runs</Eyebrow>
        <Headline size="md">사장님은 승인만 하시면 됩니다</Headline>
      </motion.div>
      <motion.ol {...reveal} className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-x-10 gap-y-10">
        {[
          {
            n: "01",
            title: "BRIQ 가 준비",
            body: "매일 가게 컨텍스트(요일·계절·재고·반응 데이터) 기반으로 한 컷 + 캡션을 자동 작성.",
          },
          {
            n: "02",
            title: "사장님이 한 번 확인",
            body: "오늘 게시물 미리보기. 마음에 들면 '이대로 발행'. 다른 결 보고 싶으면 한 번만 알려주세요.",
          },
          {
            n: "03",
            title: "최적 시간에 자동 발행",
            body: "채널별 반응 좋은 시간에 인스타·블로그·카카오로 동시 발행. 댓글·DM 도 자동 응답.",
          },
        ].map((step) => (
          <li key={step.n} className="border-t border-zinc-200 dark:border-zinc-800 pt-5">
            <div className="editorial-label tabular-nums">{step.n}</div>
            <h3 className="mt-3 text-[20px] tracking-tight" style={{ fontFamily: "'Nanum Myeongjo', serif" }}>{step.title}</h3>
            <p className="mt-3 text-[14px] text-zinc-600 dark:text-zinc-400 leading-[1.75]" style={{ fontFamily: "'Nanum Myeongjo', serif" }}>
              {step.body}
            </p>
          </li>
        ))}
      </motion.ol>
    </SectionContainer>
  );
}

// ─────────────────────────────────────────────────────────────
// 자동화 영역
// ─────────────────────────────────────────────────────────────

export function CalendarFeature() {
  return (
    <SectionContainer pad="wide">
      <motion.div {...reveal}>
        <Eyebrow>What runs automatically</Eyebrow>
        <Headline size="md">사장님이 따로 안 해도 되는 것</Headline>
      </motion.div>
      <motion.ul
        {...reveal}
        className="mt-12 grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-6"
      >
        {[
          "매일 인스타 한 컷 자동 발행",
          "주 1회 네이버 블로그 1500자 본문",
          "댓글·DM 브랜드 톤 자동 응답",
          "반응 좋은 게시물 60일 후 자동 리믹스 재발행",
          "리뷰 자동 스토리 큐레이션",
          "동네 검색어 분석 → 다음 주 콘텐츠 큐 자동 갱신",
          "발행 시간 채널별 최적 자동 픽",
          "이번 주 성과 한 줄 노트 자동 정리",
        ].map((line) => (
          <li
            key={line}
            className="text-[14.5px] leading-relaxed text-zinc-700 dark:text-zinc-300 border-b border-zinc-100 dark:border-zinc-900 pb-3"
            style={{ fontFamily: "'Nanum Myeongjo', serif" }}
          >
            <span className="editorial-label mr-3">·</span>
            {line}
          </li>
        ))}
      </motion.ul>
    </SectionContainer>
  );
}

// ─────────────────────────────────────────────────────────────
// 적용 가게들 — 가상이지만 정직한 톤
// ─────────────────────────────────────────────────────────────

export function CasesSection() {
  return (
    <SectionContainer pad="wide" id="cases">
      <motion.div {...reveal}>
        <Eyebrow>Currently running</Eyebrow>
        <Headline size="md">이런 가게가 쓰고 있습니다</Headline>
      </motion.div>
      <motion.div {...reveal} className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-8">
        {[
          { name: "미옥당 한정식", note: "강남구 한정식 · 평일 점심 자리 안내", reach: "+47%" },
          { name: "로스터리 1985", note: "서촌 스페셜티 카페 · 원두 입고 안내", reach: "+62%" },
          { name: "서촌 한옥스테이", note: "종로 한옥 숙소 · 평일 예약 유도", reach: "+38%" },
        ].map((c) => (
          <div key={c.name} className="border-t border-zinc-200 dark:border-zinc-800 pt-5">
            <div className="editorial-label">CASE</div>
            <h3 className="mt-3 text-[19px] tracking-tight" style={{ fontFamily: "'Nanum Myeongjo', serif" }}>
              {c.name}
            </h3>
            <div className="mt-2 text-[12.5px] text-zinc-500">{c.note}</div>
            <div className="mt-6 flex items-baseline gap-1">
              <span
                className="text-[36px] tabular-nums tracking-tight"
                style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 500 }}
              >
                {c.reach}
              </span>
              <span className="text-[11px] text-zinc-500 uppercase tracking-[0.15em]">monthly reach</span>
            </div>
          </div>
        ))}
      </motion.div>
    </SectionContainer>
  );
}

// ─────────────────────────────────────────────────────────────
// FAQ
// ─────────────────────────────────────────────────────────────

export function FAQSection() {
  return (
    <SectionContainer id="faq">
      <motion.div {...reveal}>
        <Eyebrow>FAQ</Eyebrow>
        <Headline size="md">자주 물으시는 것</Headline>
      </motion.div>
      <motion.dl {...reveal} className="mt-10 divide-y divide-zinc-200 dark:divide-zinc-800 border-y border-zinc-200 dark:border-zinc-800">
        {[
          {
            q: "AI 가 만든 콘텐츠 티가 나지 않나요?",
            a: "전속 모델 + 한국 디자이너 큐레이션 템플릿 + 브랜드 톤 학습으로 매거진 결의 결과물이 나옵니다. 광고티·도구티 가 안 보이게 설계되어 있습니다.",
          },
          {
            q: "사장님이 매번 확인해야 하나요?",
            a: "원하시면 자동 발행. 신뢰가 쌓이기 전에는 매일 한 번 미리보기 → '이대로 발행' 한 번. 그 외 시간은 BRIQ 가 알아서 처리합니다.",
          },
          {
            q: "인스타·블로그·카카오 다 됩니까?",
            a: "인스타 자동 발행 · 네이버 블로그 자동 작성·발행 · 카카오 채널 메시지 발송 까지. 채널 연결은 1분.",
          },
          {
            q: "기존 콘텐츠가 사라지지 않나요?",
            a: "직접 만드신 콘텐츠는 그대로. BRIQ 는 새 콘텐츠만 발행합니다. 사장님 콘텐츠 학습해서 톤만 맞춥니다.",
          },
        ].map((f, i) => (
          <div key={i} className="py-6 grid grid-cols-12 gap-x-6">
            <dt className="col-span-12 sm:col-span-4 text-[14px] text-zinc-700 dark:text-zinc-300"
              style={{ fontFamily: "'Nanum Myeongjo', serif" }}>
              {f.q}
            </dt>
            <dd className="col-span-12 sm:col-span-8 mt-2 sm:mt-0 text-[14px] text-zinc-500 dark:text-zinc-500 leading-relaxed"
              style={{ fontFamily: "'Nanum Myeongjo', serif" }}>
              {f.a}
            </dd>
          </div>
        ))}
      </motion.dl>
    </SectionContainer>
  );
}

// ─────────────────────────────────────────────────────────────
// Final CTA
// ─────────────────────────────────────────────────────────────

export function FinalCTA() {
  return (
    <SectionContainer pad="wide">
      <motion.div {...reveal} className="border-y border-zinc-200 dark:border-zinc-800 py-16 sm:py-24 text-center">
        <Eyebrow>가게 등록은 3분</Eyebrow>
        <h2
          className="mt-5 text-[36px] sm:text-[56px] leading-[1.05] tracking-[-0.02em] font-medium"
          style={{ fontFamily: "'Cormorant Garamond', 'Nanum Myeongjo', serif", fontWeight: 500 }}
        >
          내일 아침,
          <br />
          첫 발행이 올라가 있습니다.
        </h2>
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
          <Link
            href="/onboarding"
            className="inline-flex items-center gap-3 h-[46px] px-7 text-[12.5px] tracking-[0.18em] uppercase font-medium transition-colors"
            style={{ background: "#14130F", color: "#FAF7EE" }}
          >
            Begin
            <span aria-hidden className="text-[14px] tracking-normal">→</span>
          </Link>
          <Link
            href="/pricing"
            className="text-[12px] tracking-[0.04em] underline underline-offset-[6px] decoration-[0.5px]"
            style={{ color: "#4A4742", textDecorationColor: "rgba(20,19,15,0.20)" }}
          >
            가격 — 한 장으로 정리
          </Link>
        </div>
      </motion.div>
    </SectionContainer>
  );
}

// ─────────────────────────────────────────────────────────────
// Footer
// ─────────────────────────────────────────────────────────────

export function LandingFooter() {
  return (
    <footer className="border-t border-zinc-200 dark:border-zinc-800">
      <div className="max-w-[1180px] mx-auto px-6 sm:px-12 py-12 grid grid-cols-1 sm:grid-cols-3 gap-8">
        <div>
          <div className="editorial-label">BRIQ</div>
          <p className="mt-3 text-[12.5px] text-zinc-500 leading-relaxed">
            소상공인 대신 SNS 를 운영해주는 AI 마케팅 운영 시스템.
          </p>
        </div>
        <div>
          <div className="editorial-label">Product</div>
          <ul className="mt-3 space-y-1.5 text-[13px] text-zinc-600 dark:text-zinc-400">
            <li><Link href="/onboarding" className="hover:text-zinc-900 dark:hover:text-zinc-100">가게 등록</Link></li>
            <li><Link href="/dashboard" className="hover:text-zinc-900 dark:hover:text-zinc-100">데모</Link></li>
            <li><Link href="/pricing" className="hover:text-zinc-900 dark:hover:text-zinc-100">요금</Link></li>
          </ul>
        </div>
        <div>
          <div className="editorial-label">Legal</div>
          <ul className="mt-3 space-y-1.5 text-[13px] text-zinc-600 dark:text-zinc-400">
            <li><Link href="/settings" className="hover:text-zinc-900 dark:hover:text-zinc-100">개인정보·약관</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-zinc-200 dark:border-zinc-800 py-5 text-center text-[10.5px] tracking-[0.18em] uppercase text-zinc-400">
        © BRIQ 2026
      </div>
    </footer>
  );
}
