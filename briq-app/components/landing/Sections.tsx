"use client";

// 랜딩 sections — "AI 기능 소개" 제거, 운영 시스템 톤으로 단순화.
// 매거진 결: 큰 여백, hairline 보더, serif 헤드라인, 단어 위주 카피.
//
// 색·룰은 모두 lib/landing/tokens 에서 공유 — Hero/Nav/Footer 와 한 결.

import { motion } from "motion/react";
import Link from "next/link";
import {
  INK,
  INK_SOFT,
  INK_MUTE,
  RULE,
  RULE_SOFT,
  PAPER_HOVER,
  HL,
  SERIF_LATIN,
  SERIF_HANGUL,
} from "@/lib/landing/tokens";
import { BusinessFooter } from "@/components/layout/BusinessFooter";

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
  <div
    className="text-[10.5px] tracking-[0.22em] uppercase"
    style={{ color: INK_MUTE, fontFamily: SERIF_LATIN, fontStyle: "italic" }}
  >
    {children}
  </div>
);

const Headline = ({ children, size = "lg" }: { children: React.ReactNode; size?: "lg" | "md" }) => (
  <h2
    className={`mt-4 leading-[1.04] tracking-[-0.025em] ${
      size === "lg"
        ? "text-[40px] sm:text-[56px] md:text-[64px]"
        : "text-[28px] sm:text-[36px]"
    }`}
    style={{ fontFamily: SERIF_LATIN, fontWeight: 400, color: INK, wordBreak: "keep-all" }}
  >
    {children}
  </h2>
);

const Lede = ({ children }: { children: React.ReactNode }) => (
  <p
    className="mt-5 max-w-[640px] text-[15px] sm:text-[16px] leading-[1.7]"
    style={{ fontFamily: SERIF_HANGUL, color: INK_SOFT, wordBreak: "keep-all" }}
  >
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

      <motion.ol
        {...reveal}
        className="mt-14"
        style={{ borderTop: `0.5px solid ${RULE}`, borderBottom: `0.5px solid ${RULE}` }}
      >
        {[
          { num: "01", label: "오늘 뭐 올릴지 매일 고민", out: "이번 주 한 번에 자동 큐레이션" },
          { num: "02", label: "사진 찍고 캡션 쓰고 해시태그 정리", out: "사진 한 장이면 카드뉴스·릴스·캡션 자동" },
          { num: "03", label: "댓글·DM 응대 시간", out: "브랜드 톤 학습된 답변 제안 (검수 후 발송)" },
          { num: "04", label: "발행 시간·요일 결정", out: "검수 후, 채널별 반응 데이터로 예약 발행" },
          { num: "05", label: "효과 분석 시간", out: "한 줄 노트로 매주 정리됨" },
        ].map((row, i) => (
          <li
            key={row.num}
            className="grid grid-cols-12 items-baseline gap-3 py-5"
            style={{ borderTop: i === 0 ? "none" : `0.5px solid ${RULE_SOFT}` }}
          >
            <div
              className="col-span-2 sm:col-span-1 text-[10.5px] tracking-[0.22em] uppercase tabular-nums italic"
              style={{ color: INK_MUTE, fontFamily: SERIF_LATIN }}
            >
              {row.num}
            </div>
            <div
              className="col-span-10 sm:col-span-5 text-[14.5px] line-through decoration-[0.5px]"
              style={{ fontFamily: SERIF_HANGUL, color: INK_MUTE }}
            >
              {row.label}
            </div>
            <div className="col-span-12 sm:col-span-6 text-[15px]" style={{ fontFamily: SERIF_HANGUL, color: INK }}>
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

// 전속 모델 = 일관된 인물 + 일관된 말투. 사진 대신 '캐스팅 시트' 활자로 증명한다.
// (이미지 자산 확보 시, 각 플레이트 상단에 작은 초상 썸네일만 끼워넣으면 됨 — 구조 불변)
const PERSONAS = [
  { plate: "Plate I", title: "한정식 · 미옥당", archetype: "단정한 30대 안주인. 제철을 직접 고르는 손.", voice: "오늘 두릅, 딱 스무 접시." },
  { plate: "Plate II", title: "스페셜티 카페 · 로스터리 1985", archetype: "말수 적은 바리스타. 매일 같은 시간 로스팅.", voice: "오늘 원두, 케냐 AA." },
  { plate: "Plate III", title: "한옥 스테이 · 서촌", archetype: "빛을 살피는 호스트. 아침 햇살을 먼저 안내.", voice: "창호로 드는 여섯 시의 빛." },
  { plate: "Plate IV", title: "뷰티 살롱", archetype: "손이 정확한 디자이너. 결을 살리는 한 컷.", voice: "이번 봄, 당신의 결." },
  { plate: "Plate V", title: "피트니스", archetype: "군더더기 없는 코치. 핑계를 두지 않는 톤.", voice: "오늘 30분, 그거면 충분." },
  { plate: "Plate VI", title: "동네 셀렉트숍", archetype: "취향 까다로운 큐레이터. 좋은 것만 골라두는 눈.", voice: "이번 주 입고, 딱 다섯 점." },
];

export function ReelsFeature() {
  return (
    <SectionContainer pad="wide" id="features">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-x-10 md:gap-x-14 gap-y-10">
        <motion.div {...reveal} className="md:col-span-4">
          <Eyebrow>Brand Persona</Eyebrow>
          <Headline size="md">전속 모델이 있는 가게</Headline>
          <Lede>
            가게 컨셉에 맞는 전속 AI 모델을 한 번 정해두면, 이후 모든 콘텐츠가 같은 인물·같은 말투로 운영됩니다. 매번 다른 사람이 등장하지 않고, 진짜 전속 모델처럼.
          </Lede>
        </motion.div>
        <motion.div {...reveal} className="md:col-span-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-9">
            {PERSONAS.map((p) => (
              <div key={p.title} className="pt-5" style={{ borderTop: `0.5px solid ${RULE}` }}>
                <div
                  className="text-[10px] tracking-[0.22em] uppercase italic"
                  style={{ color: INK_MUTE, fontFamily: SERIF_LATIN }}
                >
                  {p.plate}
                </div>
                <h3
                  className="mt-2.5 text-[16px] leading-snug tracking-tight"
                  style={{ fontFamily: SERIF_HANGUL, color: INK, fontWeight: 600, wordBreak: "keep-all" }}
                >
                  {p.title}
                </h3>
                <p
                  className="mt-2 text-[13px] leading-[1.6]"
                  style={{ fontFamily: SERIF_HANGUL, color: INK_SOFT }}
                >
                  {p.archetype}
                </p>
                <div
                  className="mt-4 pt-3.5 text-[14px] leading-[1.5]"
                  style={{ borderTop: `0.5px solid ${RULE_SOFT}`, fontFamily: SERIF_HANGUL, color: INK }}
                >
                  <span aria-hidden style={{ color: INK_MUTE }}>“</span>
                  {p.voice}
                  <span aria-hidden style={{ color: INK_MUTE }}>”</span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-7 text-[12.5px]" style={{ fontFamily: SERIF_HANGUL, color: INK_MUTE }}>
            한 번 정하면 — 모든 콘텐츠가 같은 인물·같은 말투로.
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
            title: "검수 후, 최적 시간에 발행",
            body: "확인을 누르면 채널별 반응 좋은 시간에 인스타·블로그로 예약 발행, 카카오는 공식 메시지로 발송. 댓글·DM 은 톤 맞춘 답변 제안.",
          },
        ].map((step) => (
          <li key={step.n} className="pt-5" style={{ borderTop: `0.5px solid ${RULE}` }}>
            <div
              className="text-[10.5px] tracking-[0.22em] uppercase tabular-nums italic"
              style={{ color: INK_MUTE, fontFamily: SERIF_LATIN }}
            >
              {step.n}
            </div>
            <h3
              className="mt-3 text-[20px] tracking-tight"
              style={{ fontFamily: SERIF_HANGUL, color: INK, fontWeight: 500 }}
            >
              {step.title}
            </h3>
            <p className="mt-3 text-[14px] leading-[1.75]" style={{ fontFamily: SERIF_HANGUL, color: INK_SOFT }}>
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
          "매일 인스타 한 컷 자동 생성 → 검수 후 발행",
          "주 1회 네이버 블로그 1500자 본문 자동 작성",
          "댓글·DM 브랜드 톤 답변 제안 (검수 후 발송)",
          "반응 좋은 게시물 60일 후 자동 리믹스 → 검수 후 재발행",
          "리뷰 스토리 자동 큐레이션",
          "동네 검색어 분석 → 다음 주 콘텐츠 큐 자동 갱신",
          "발행 시간 채널별 최적 자동 픽 (검수 후 예약)",
          "이번 주 성과 한 줄 노트 자동 정리",
        ].map((line) => (
          <li
            key={line}
            className="text-[14.5px] leading-relaxed pb-3"
            style={{ fontFamily: SERIF_HANGUL, color: INK, borderBottom: `0.5px solid ${RULE_SOFT}` }}
          >
            <span className="mr-3" style={{ color: INK_MUTE }}>·</span>
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
        <Eyebrow>Example scenarios</Eyebrow>
        <Headline size="md">이런 가게라면, 이렇게 굴러갑니다</Headline>
        <div className="mt-3 text-[12px]" style={{ fontFamily: SERIF_HANGUL, color: INK_MUTE }}>
          실제 고객사가 아닌, 업종별 운영 예시입니다.
        </div>
      </motion.div>
      <motion.div {...reveal} className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-8">
        {[
          { name: "미옥당 한정식", note: "강남구 한정식 · 평일 점심 자리 안내", run: "주 7회" },
          { name: "로스터리 1985", note: "서촌 스페셜티 카페 · 원두 입고 안내", run: "주 6회" },
          { name: "서촌 한옥스테이", note: "종로 한옥 숙소 · 평일 예약 유도", run: "주 5회" },
        ].map((c) => (
          <div key={c.name} className="pt-5" style={{ borderTop: `0.5px solid ${RULE}` }}>
            <div
              className="text-[10.5px] tracking-[0.22em] uppercase italic"
              style={{ color: INK_MUTE, fontFamily: SERIF_LATIN }}
            >
              Example
            </div>
            <h3
              className="mt-3 text-[19px] tracking-tight"
              style={{ fontFamily: SERIF_HANGUL, color: INK, fontWeight: 500 }}
            >
              {c.name}
            </h3>
            <div className="mt-2 text-[12.5px]" style={{ color: INK_SOFT, fontFamily: SERIF_HANGUL }}>
              {c.note}
            </div>
            <div className="mt-6 flex items-baseline gap-2">
              <span
                className="text-[40px] tracking-tight"
                style={{ fontFamily: SERIF_HANGUL, fontWeight: 500, color: INK }}
              >
                {c.run}
              </span>
              <span
                className="text-[10.5px] uppercase tracking-[0.18em]"
                style={{ color: INK_MUTE }}
              >
                주간 발행
              </span>
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
      <motion.dl
        {...reveal}
        className="mt-10"
        style={{ borderTop: `0.5px solid ${RULE}`, borderBottom: `0.5px solid ${RULE}` }}
      >
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
            a: "인스타는 검수 후 발행(상위 플랜은 자동 발행) · 네이버 블로그는 본문 자동 작성에 게시 확인 한 번 · 카카오 채널 메시지는 공식 API로 발송. 채널 연결은 1분.",
          },
          {
            q: "기존 콘텐츠가 사라지지 않나요?",
            a: "직접 만드신 콘텐츠는 그대로. BRIQ 는 새 콘텐츠만 발행합니다. 사장님 콘텐츠 학습해서 톤만 맞춥니다.",
          },
        ].map((f, i) => (
          <div
            key={i}
            className="py-6 grid grid-cols-12 gap-x-6"
            style={{ borderTop: i === 0 ? "none" : `0.5px solid ${RULE_SOFT}` }}
          >
            <dt
              className="col-span-12 sm:col-span-4 text-[14px]"
              style={{ fontFamily: SERIF_HANGUL, color: INK, fontWeight: 500 }}
            >
              {f.q}
            </dt>
            <dd
              className="col-span-12 sm:col-span-8 mt-2 sm:mt-0 text-[14px] leading-relaxed"
              style={{ fontFamily: SERIF_HANGUL, color: INK_SOFT }}
            >
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
      <motion.div
        {...reveal}
        className="py-16 sm:py-24 text-center"
        style={{ borderTop: `0.5px solid ${RULE}`, borderBottom: `0.5px solid ${RULE}` }}
      >
        <Eyebrow>Set up in 3 minutes</Eyebrow>
        <h2
          className="mt-5 text-[36px] sm:text-[56px] leading-[1.05] tracking-[-0.025em]"
          style={{ fontFamily: SERIF_LATIN, fontWeight: 400, color: INK }}
        >
          내일 아침,
          <br />
          {/* 한글 강조는 이탤릭(가짜 기울임) 금지 — Hero 와 같은 크림 하이라이트 결 */}
          <span className="relative inline-block">
            <span className="relative z-10">첫 발행이</span>
            <span
              aria-hidden
              className="absolute inset-x-[-2px] bottom-[6px] sm:bottom-[10px] h-[12px] sm:h-[18px] -z-0"
              style={{ background: HL, opacity: 0.9 }}
            />
          </span>{" "}
          올라가 있습니다.
        </h2>
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
          <Link
            href="/onboarding"
            className="inline-flex items-center gap-3 h-[46px] px-7 text-[13.5px] tracking-[0.01em] font-medium transition-colors"
            style={{ background: "#14130F", color: "#FAF7EE" }}
          >
            14일 무료로 시작
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
  const eyebrow = "text-[10.5px] tracking-[0.22em] uppercase italic";
  const eyebrowStyle: React.CSSProperties = { color: INK_MUTE, fontFamily: SERIF_LATIN };
  const linkBase = "transition-colors hover:opacity-100";

  return (
    <footer style={{ background: "#FAF7EE", borderTop: `0.5px solid ${RULE}` }}>
      <div className="max-w-[1240px] mx-auto px-6 sm:px-14 py-14 grid grid-cols-1 sm:grid-cols-3 gap-10">
        <div>
          <div
            className="text-[24px] leading-none tracking-[-0.02em]"
            style={{ fontFamily: SERIF_LATIN, fontWeight: 500, color: INK }}
          >
            BRIQ
          </div>
          <p
            className="mt-4 text-[13px] leading-[1.7] max-w-[280px]"
            style={{ fontFamily: SERIF_HANGUL, color: INK_SOFT }}
          >
            소상공인 대신 SNS 를 운영해주는, 가만한 AI 운영자.
          </p>
        </div>
        <div>
          <div className={eyebrow} style={eyebrowStyle}>Product</div>
          <ul className="mt-3.5 space-y-2 text-[13px]" style={{ fontFamily: SERIF_HANGUL, color: INK_SOFT }}>
            <li><Link href="/onboarding" className={linkBase} style={{ color: INK_SOFT }}>가게 등록</Link></li>
            <li><Link href="/dashboard" className={linkBase} style={{ color: INK_SOFT }}>데모 보기</Link></li>
            <li><Link href="/pricing" className={linkBase} style={{ color: INK_SOFT }}>요금제</Link></li>
            <li><Link href="/contact" className={linkBase} style={{ color: INK_SOFT }}>도입 문의</Link></li>
          </ul>
        </div>
        <div>
          <div className={eyebrow} style={eyebrowStyle}>Account</div>
          <ul className="mt-3.5 space-y-2 text-[13px]" style={{ fontFamily: SERIF_HANGUL, color: INK_SOFT }}>
            <li><Link href="/login" className={linkBase} style={{ color: INK_SOFT }}>로그인</Link></li>
            <li><Link href="/settings" className={linkBase} style={{ color: INK_SOFT }}>설정</Link></li>
            <li><Link href="/terms" className={linkBase} style={{ color: INK_SOFT }}>이용약관</Link></li>
            <li><Link href="/privacy" className={linkBase} style={{ color: INK_SOFT }}>개인정보처리방침</Link></li>
            <li><Link href="/refund-policy" className={linkBase} style={{ color: INK_SOFT }}>환불 정책</Link></li>
          </ul>
        </div>
      </div>
      <BusinessFooter />
      <div
        className="py-5 text-center text-[10px] tracking-[0.22em] uppercase italic"
        style={{ borderTop: `0.5px solid ${RULE}`, color: INK_MUTE, fontFamily: SERIF_LATIN }}
      >
        © BRIQ MMXXVI · Issued from Seoul · Set in Cormorant &amp; Nanum Myeongjo
      </div>
    </footer>
  );
}
