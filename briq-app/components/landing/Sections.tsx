"use client";

import { motion } from "motion/react";
import Link from "next/link";

const reveal = {
  initial: { opacity: 0, y: 16 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.6, ease: [0.2, 0.8, 0.2, 1] as const },
};

export function ProblemSection() {
  return (
    <section className="py-28 relative">
      <div className="max-w-5xl mx-auto px-6">
        <motion.div className="text-center" {...reveal}>
          <div className="text-[11px] uppercase tracking-widest text-zinc-400 font-semibold">문제</div>
          <h2 className="mt-3 text-3xl sm:text-4xl font-semibold tracking-tight">
            콘텐츠 만들 시간이 없어요.
            <br />
            그렇다고 광고대행사를 쓰자니 너무 비싸요.
          </h2>
        </motion.div>
        <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            { stat: "12 시간/주", line: "사장님이 직접 인스타·블로그 운영에 쓰는 평균 시간." },
            { stat: "₩200~500 만/월", line: "광고대행사에 맡기면 월 비용. 1인 자영업자에겐 부담." },
            { stat: "2.3 %", line: "소상공인 평균 인스타 저장률. 사진만 올려서는 단골이 안 늘어요." },
          ].map((item, i) => (
            <motion.div
              key={i}
              className="rounded-2xl border border-zinc-100 dark:border-zinc-800 p-7"
              {...reveal}
              transition={{ ...reveal.transition, delay: i * 0.06 }}
            >
              <div className="text-3xl font-semibold tabular-nums">{item.stat}</div>
              <div className="mt-2 text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">{item.line}</div>
            </motion.div>
          ))}
        </div>
        <motion.div className="mt-10 text-center text-base font-medium text-zinc-700 dark:text-zinc-300" {...reveal}>
          BRIQ는 <span className="gradient-text font-semibold">월 ₩39,000</span> 으로 광고대행사가 하는 일을 매일 합니다.
        </motion.div>
      </div>
    </section>
  );
}

export function ReelsFeature() {
  return (
    <section
      id="features"
      className="py-28 bg-zinc-50/40 dark:bg-zinc-950/40 border-y border-zinc-100 dark:border-zinc-900"
    >
      <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <motion.div {...reveal}>
          <div className="text-[11px] uppercase tracking-widest text-violet-600 dark:text-violet-400 font-semibold">
            FEATURE 01 · AI REELS
          </div>
          <h2 className="mt-3 text-3xl sm:text-4xl font-semibold tracking-tight leading-tight">
            사진 몇 장이면
            <br />
            릴스가 자동으로 완성됩니다.
          </h2>
          <p className="mt-5 text-base text-zinc-600 dark:text-zinc-400 leading-relaxed">
            매장 사진 5~10장을 업로드하면 BRIQ가 컷을 분할하고, 자막을 만들고, 후크 문구를 쓰고, 트렌드 BGM을
            골라 30초 릴스를 만들어 드려요.
          </p>
          <ul className="mt-7 space-y-3 text-sm">
            <li className="flex items-start gap-3"><span className="mt-1 text-emerald-500">●</span><div><b>업종별 템플릿</b> · 카페 / 숙소 / 디저트샵 / 한식당 / 미용실</div></li>
            <li className="flex items-start gap-3"><span className="mt-1 text-emerald-500">●</span><div><b>자막 자동 생성</b> · 영상 분위기에 맞는 폰트·위치·전환</div></li>
            <li className="flex items-start gap-3"><span className="mt-1 text-emerald-500">●</span><div><b>트렌드 BGM 추천</b> · 인스타 인기 곡 데이터로 매주 갱신</div></li>
            <li className="flex items-start gap-3"><span className="mt-1 text-emerald-500">●</span><div><b>썸네일 자동</b> · 가장 시선이 가는 컷을 1:1 / 9:16 비율로 출력</div></li>
          </ul>
        </motion.div>
        <motion.div {...reveal} transition={{ ...reveal.transition, delay: 0.1 }} className="relative mx-auto" style={{ maxWidth: 340 }}>
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="relative rounded-[36px] border-[10px] border-zinc-900 dark:border-zinc-700 bg-zinc-900 shadow-2xl overflow-hidden"
          >
            <div className="aspect-[9/16] bg-gradient-to-br from-amber-200 via-rose-300 to-amber-400 relative">
              <div className="absolute top-4 left-4 right-4 flex items-center gap-2 text-white">
                <div className="h-7 w-7 rounded-full bg-white/20 backdrop-blur" />
                <div className="text-[11px] font-medium drop-shadow">미옥당 본점</div>
                <button className="ml-auto text-[11px] bg-white/20 backdrop-blur px-2.5 py-1 rounded-full">팔로우</button>
              </div>
              <div className="absolute bottom-32 left-4 right-4 text-white">
                <div className="text-2xl font-bold leading-tight drop-shadow-lg">새벽 4시,<br />시장이 깨어납니다</div>
                <div className="mt-2 text-xs opacity-90">한 그릇의 시간 · 5월 봄정식</div>
              </div>
              <div className="absolute right-3 bottom-32 flex flex-col gap-3 text-white text-center">
                <div><div className="text-2xl">♡</div><div className="text-[10px]">2.4K</div></div>
                <div><div className="text-2xl">💬</div><div className="text-[10px]">87</div></div>
                <div><div className="text-2xl">↗</div><div className="text-[10px]">141</div></div>
                <div><div className="text-2xl">⌅</div><div className="text-[10px]">312</div></div>
              </div>
              <div className="absolute bottom-4 left-4 right-4 text-white text-[10px] flex items-center gap-1.5">
                <span className="h-3 w-3 rounded bg-white/20" />♪ Lo-Fi Calm Morning · 트렌드
              </div>
            </div>
          </motion.div>
          <div className="absolute -inset-8 -z-10 rounded-full bg-gradient-to-br from-rose-300/20 via-violet-400/20 to-indigo-400/20 blur-3xl" />
        </motion.div>
      </div>
    </section>
  );
}

export function ToneFeature() {
  return (
    <section className="py-28">
      <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <motion.div className="lg:order-2" {...reveal}>
          <div className="text-[11px] uppercase tracking-widest text-rose-600 dark:text-rose-400 font-semibold">
            FEATURE 02 · BRAND VOICE
          </div>
          <h2 className="mt-3 text-3xl sm:text-4xl font-semibold tracking-tight leading-tight">
            결과물이
            <br />
            AI처럼 보이지 않습니다.
          </h2>
          <p className="mt-5 text-base text-zinc-600 dark:text-zinc-400 leading-relaxed">
            BRIQ는 사장님 인스타 캡션, 블로그, 메뉴 설명을 학습해서 브랜드만의 말투를 기억합니다. 금지어·자주 쓰는
            표현·업종 가이드까지 — 발행 전 자동 검수.
          </p>
          <ul className="mt-7 space-y-3 text-sm">
            <li className="flex items-start gap-3"><span className="mt-1 text-rose-500">●</span><div><b>5축 톤 슬라이더</b> · 단정/친근, 전통/모던, 감성/정보형</div></li>
            <li className="flex items-start gap-3"><span className="mt-1 text-rose-500">●</span><div><b>금지어 자동 차단</b> · "최고의" "100%" "탁월한" 등</div></li>
            <li className="flex items-start gap-3"><span className="mt-1 text-rose-500">●</span><div><b>업종 가이드라인</b> · 한정식 234건 · 카페 412건 학습</div></li>
            <li className="flex items-start gap-3"><span className="mt-1 text-rose-500">●</span><div><b>버전 진화</b> · 사장님 피드백+성과로 v1→v3 자동</div></li>
          </ul>
        </motion.div>
        <motion.div className="lg:order-1 space-y-4" {...reveal} transition={{ ...reveal.transition, delay: 0.1 }}>
          <div className="rounded-2xl border border-zinc-100 dark:border-zinc-800 p-6">
            <div className="text-[10px] uppercase tracking-widest text-zinc-400 font-semibold">BEFORE · GPT 기본</div>
            <p className="mt-3 text-base leading-relaxed text-zinc-500 line-through">
              탁월한 풍미를 선사하는 미옥당의 봄나물 정식, 신선한 재료로 완벽하게 준비됩니다.
            </p>
          </div>
          <div className="text-center text-zinc-400 text-sm">↓ 미옥당 톤 메모리 v3 자동 적용</div>
          <div className="rounded-2xl border-2 border-emerald-300 dark:border-emerald-800 p-6 bg-emerald-50/30 dark:bg-emerald-500/5 glow">
            <div className="text-[10px] uppercase tracking-widest text-emerald-700 dark:text-emerald-400 font-semibold">
              AFTER · BRIQ 출력
            </div>
            <p
              className="mt-3 text-base leading-relaxed font-medium"
              style={{ fontFamily: "'Nanum Myeongjo', serif" }}
            >
              한 입에 봄이 옵니다.
              <br />
              새벽 4시 양평 시장에서 직접 담아 온
              <br />
              두릅 · 머위 · 곰취.
            </p>
            <div className="mt-3 pt-3 border-t border-emerald-100 dark:border-emerald-900/40 flex items-center gap-2 text-[11px] text-emerald-700 dark:text-emerald-400">
              <span>✓ 한자 노출</span><span>·</span><span>✓ 식재료 산지</span><span>·</span><span>✓ 이모지 0</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export function CalendarFeature() {
  type FeatureTone = "rose" | "amber" | "violet" | "orange";
  const TONE_CLASS: Record<FeatureTone, string> = {
    rose: "text-rose-600 dark:text-rose-400",
    amber: "text-amber-600 dark:text-amber-400",
    violet: "text-violet-600 dark:text-violet-400",
    orange: "text-orange-600 dark:text-orange-400",
  };
  const items: { emoji: string; label: string; title: string; desc: string; tone: FeatureTone }[] = [
    { emoji: "🌧", label: "시즌 · 5/13~", title: "장마 감성 릴스", desc: "\"비 오는 날엔\" 후크 + 따뜻한 메뉴 컷", tone: "rose" },
    { emoji: "💐", label: "기념일 · 5/8~21", title: "가정의 달 효도 이벤트", desc: "카드뉴스 5장 + 카톡 발송 자동화", tone: "amber" },
    { emoji: "🌸", label: "지역 · 5/24~", title: "강남 수국축제 콘텐츠", desc: "근처 1km 인기 스타일 자동 학습", tone: "violet" },
    { emoji: "🔥", label: "날씨 · 5/30~", title: "폭염 · 콜드 메뉴 출시", desc: "기상청 폭염 예보 → 자동 캠페인", tone: "orange" },
  ];
  return (
    <section
      id="calendar"
      className="py-28 bg-zinc-50/40 dark:bg-zinc-950/40 border-y border-zinc-100 dark:border-zinc-900"
    >
      <div className="max-w-6xl mx-auto px-6">
        <motion.div className="text-center max-w-2xl mx-auto" {...reveal}>
          <div className="text-[11px] uppercase tracking-widest text-amber-600 dark:text-amber-400 font-semibold">
            FEATURE 03 · CONTENT CALENDAR
          </div>
          <h2 className="mt-3 text-3xl sm:text-4xl font-semibold tracking-tight leading-tight">
            "오늘 뭐 올리지?" 고민
            <br />
            이제 BRIQ가 합니다.
          </h2>
        </motion.div>
        <div className="mt-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {items.map((it, i) => (
            <motion.div
              key={it.title}
              className="rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-[#0d0d10] p-5"
              {...reveal}
              transition={{ ...reveal.transition, delay: i * 0.06 }}
            >
              <div className="text-3xl">{it.emoji}</div>
              <div className={`mt-3 text-[10px] uppercase tracking-wider font-semibold ${TONE_CLASS[it.tone]}`}>{it.label}</div>
              <div className="mt-1 text-sm font-semibold">{it.title}</div>
              <div className="mt-1 text-[12px] text-zinc-500 leading-relaxed">{it.desc}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function CasesSection() {
  const cases = [
    { id: "miokdang", grad: "from-rose-400 to-orange-400", letter: "미", name: "미옥당 본점", meta: "한정식 · 강남구", roi: "+312%", subtext: "월 도달 12K → 68K", quote: "BRIQ 도입 3개월 만에 인스타 도달이 5배. 사장님이 직접 안 써도 매주 톤이 일관돼서 단골이 늘었어요.", who: "허은애 대표" },
    { id: "roastery", grad: "from-amber-700 to-stone-800", letter: "R", name: "로스터리 1985", meta: "스페셜티 카페 · 서촌", roi: "+184%", subtext: "월 신규 방문 38건 → 108건", quote: "릴스 만들 시간이 없었는데 BRIQ가 사진 5장으로 30초 영상을 매주 만들어요. 카페 운영에 집중할 수 있어요.", who: "김민준 바리스타" },
    { id: "luna", grad: "from-violet-400 to-fuchsia-500", letter: "루", name: "루나 헤어", meta: "미용실 · 강남구", roi: "+94%", subtext: "월 예약 218건 → 422건", quote: "리뷰 답변 자동화가 진짜 신세계. 단골 손님 이름까지 기억하고 답변해 줘서 응대 시간이 87% 줄었어요.", who: "이가영 원장" },
  ];
  return (
    <section id="cases" className="py-28">
      <div className="max-w-6xl mx-auto px-6">
        <motion.div className="text-center max-w-2xl mx-auto" {...reveal}>
          <div className="text-[11px] uppercase tracking-widest text-zinc-400 font-semibold">실제 결과</div>
          <h2 className="mt-3 text-3xl sm:text-4xl font-semibold tracking-tight">3개월, 평균 매출 +147%</h2>
        </motion.div>
        <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-3">
          {cases.map((c, i) => (
            <motion.div
              key={c.id}
              className="rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-[#0d0d10] p-7"
              {...reveal}
              transition={{ ...reveal.transition, delay: i * 0.06 }}
            >
              <div className="flex items-center gap-3">
                <div className={`h-10 w-10 rounded-lg bg-gradient-to-br ${c.grad} grid place-items-center text-white font-bold`}>
                  {c.letter}
                </div>
                <div>
                  <div className="text-sm font-semibold">{c.name}</div>
                  <div className="text-[11px] text-zinc-500">{c.meta}</div>
                </div>
              </div>
              <div className="mt-5 text-3xl font-semibold tabular-nums text-emerald-600">{c.roi}</div>
              <div className="text-[11px] text-zinc-500">{c.subtext}</div>
              <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">"{c.quote}"</p>
              <div className="mt-4 text-[11px] text-zinc-400">— {c.who}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function FAQSection() {
  const items = [
    { q: "정말 사진 몇 장만 올리면 릴스가 나오나요?", a: "네. 최소 5장이면 30초 릴스가 자동 생성됩니다. 사진의 분위기와 메뉴/공간을 BRIQ가 분석해 컷을 분할하고 자막·BGM·전환을 자동으로 적용합니다." },
    { q: "결과물이 AI처럼 어색하지 않나요?", a: "브랜드 톤 메모리가 핵심입니다. 사장님 인스타·블로그·메뉴 설명을 학습해 그 가게만의 말투를 유지합니다. AI 인공 표현은 자동 차단됩니다." },
    { q: "어떤 업종이 잘 맞나요?", a: "현재 카페·디저트샵·숙소·미용실·한식당·로컬 브랜드에 최적화돼 있습니다. 업종별 1만건 이상의 콘텐츠로 학습된 가이드라인을 자동 적용합니다." },
    { q: "인스타·블로그에 자동으로 올려주나요?", a: "STARTER 이상 플랜에서 인스타 / 네이버 블로그 / Threads / 카카오 채널 예약 발행을 지원합니다." },
    { q: "광고대행사를 완전히 대체할 수 있나요?", a: "콘텐츠 생산·운영 영역은 대체 가능합니다. 1인~5인 매장 기준 월 ₩200~500만원의 운영비를 ₩39,000~₩99,000으로 줄여드립니다." },
    { q: "데이터는 안전한가요?", a: "PIPA(개인정보보호법) 준수, AWS 서울 리전 호스팅, 학습 데이터는 사장님 브랜드에만 사용됩니다." },
  ];
  return (
    <section id="faq" className="py-24 bg-zinc-50/40 dark:bg-zinc-950/40 border-t border-zinc-100 dark:border-zinc-900">
      <div className="max-w-3xl mx-auto px-6">
        <motion.div className="text-center" {...reveal}>
          <div className="text-[11px] uppercase tracking-widest text-zinc-400 font-semibold">FAQ</div>
          <h2 className="mt-3 text-3xl sm:text-4xl font-semibold tracking-tight">자주 묻는 질문</h2>
        </motion.div>
        <div className="mt-12 space-y-3">
          {items.map((it, i) => (
            <motion.details
              key={i}
              className="group rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-[#0d0d10]"
              {...reveal}
              transition={{ ...reveal.transition, delay: i * 0.04 }}
            >
              <summary className="cursor-pointer list-none p-5 flex items-center justify-between">
                <span className="text-sm font-medium">{it.q}</span>
                <span className="text-zinc-400 group-open:rotate-45 transition">+</span>
              </summary>
              <div className="px-5 pb-5 text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">{it.a}</div>
            </motion.details>
          ))}
        </div>
      </div>
    </section>
  );
}

export function FinalCTA() {
  return (
    <section className="py-32 relative overflow-hidden">
      <div className="absolute inset-0 grid-bg opacity-50 pointer-events-none" />
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] rounded-full opacity-30 blur-3xl pointer-events-none"
        style={{ background: "radial-gradient(circle,#a855f7,#6366f1 50%,transparent 70%)" }}
      />
      <motion.div className="relative max-w-3xl mx-auto px-6 text-center" {...reveal}>
        <h2 className="text-4xl sm:text-5xl font-semibold tracking-tight leading-tight">
          오늘부터 BRIQ가
          <br />
          <span className="gradient-text">사장님의 디지털 매니저</span>
        </h2>
        <p className="mt-6 text-base text-zinc-600 dark:text-zinc-400 leading-relaxed">
          신용카드 없이 3분이면 첫 콘텐츠가 만들어집니다.
        </p>
        <div className="mt-10 flex items-center justify-center gap-3 flex-wrap">
          <Link href="/onboarding" className="text-base font-medium px-7 py-4 rounded-lg bg-zinc-900 text-zinc-50 dark:bg-zinc-100 dark:text-zinc-900 hover:opacity-90">
            무료로 시작하기 →
          </Link>
          <Link href="/pricing" className="text-base font-medium px-7 py-4 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:border-zinc-900 dark:hover:border-zinc-100">
            요금제 보기
          </Link>
        </div>
      </motion.div>
    </section>
  );
}

export function LandingFooter() {
  return (
    <footer className="border-t border-zinc-100 dark:border-zinc-900 py-12">
      <div className="max-w-6xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-sm">
        <div>
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-md bg-gradient-to-br from-indigo-500 via-violet-600 to-pink-500 grid place-items-center text-white text-xs font-bold">B</div>
            <span className="text-sm font-semibold">BRIQ</span>
          </div>
          <p className="mt-3 text-xs text-zinc-500 leading-relaxed">소상공인을 위한<br />AI 브랜드 운영 시스템.</p>
        </div>
        <div><div className="text-xs font-semibold mb-3">제품</div><ul className="space-y-2 text-xs text-zinc-500">
          <li><a href="#features" className="hover:text-zinc-900 dark:hover:text-zinc-100">기능</a></li>
          <li><Link href="/pricing" className="hover:text-zinc-900 dark:hover:text-zinc-100">요금제</Link></li>
          <li><Link href="/onboarding" className="hover:text-zinc-900 dark:hover:text-zinc-100">시작하기</Link></li>
        </ul></div>
        <div><div className="text-xs font-semibold mb-3">회사</div><ul className="space-y-2 text-xs text-zinc-500">
          <li>소개</li><li>블로그</li><li>채용</li>
        </ul></div>
        <div><div className="text-xs font-semibold mb-3">법적</div><ul className="space-y-2 text-xs text-zinc-500">
          <li>이용약관</li><li>개인정보처리방침</li><li>PIPA</li>
        </ul></div>
      </div>
      <div className="max-w-6xl mx-auto px-6 mt-10 pt-6 border-t border-zinc-100 dark:border-zinc-900 text-[11px] text-zinc-400 flex items-center justify-between flex-wrap gap-2">
        <div>© 2026 BRIQ Inc. · 서울특별시 강남구</div>
        <div>made with ❤ in Seoul</div>
      </div>
    </footer>
  );
}
