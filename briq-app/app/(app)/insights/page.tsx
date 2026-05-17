"use client";

import { Topbar } from "@/components/layout/Topbar";
import { useBrand } from "@/components/brand/BrandProvider";
import { brandSearchKeywords } from "@/lib/brand/brand-context";

// 매거진식 발견 노트.
//
// 숫자로만 늘어놓지 않는다 — 가게가 어떤 결로 움직이고 있는지 문장으로.
// "이번 주 한 줄 / 변화 / 콘텐츠 결 / 검색 유입 / 단골 vs 신규 / 다음 주" 6 섹션.

const HEADLINE = {
  oneLine: "이번 주, 가게가 더 단단해졌습니다.",
  body:
    "지난주 대비 노출은 +18%, 저장은 +24% 증가했습니다. 특히 수요일 점심 발행이 평소보다 1.6배 reach 를 만들었고, 주말 예약 문의가 평일 대비 두 배로 들어왔습니다.",
};

const DELTAS = [
  { label: "노출 (Reach)", value: "+18%", detail: "vs 지난주", tone: "up" as const },
  { label: "저장", value: "+24%", detail: "댓글 12 · 저장 47", tone: "up" as const },
  { label: "프로필 방문", value: "+9%", detail: "이번 주 1,240", tone: "up" as const },
  { label: "팔로우 전환", value: "+2.1%p", detail: "저장 → 팔로우", tone: "up" as const },
];

const CONTENT_NOTES = [
  {
    n: "01",
    title: "저장이 댓글보다 잘 받는 가게입니다.",
    body:
      "이번 달 댓글 12, 저장 47. 저장 위주 콘텐츠 (메뉴 안내·재료 사진·자리 배치 안내) 를 더 자주 발행할 만합니다. 인스타 알고리즘에서도 저장은 댓글보다 도달에 더 크게 작용합니다.",
  },
  {
    n: "02",
    title: "릴스보다 카드뉴스가 더 잘 받습니다.",
    body:
      "최근 4주 릴스 평균 reach 8,200 vs 카드뉴스 12,400. 짧고 묵직한 한 컷이 우리 가게 결에는 더 맞습니다. 릴스는 시즌 한 번씩으로 유지해도 좋습니다.",
  },
  {
    n: "03",
    title: "수요일 점심 발행이 가장 효과적입니다.",
    body:
      "최근 4주 평균 reach 가 다른 요일·시간대보다 1.6배. 다음 주 화·수 점심 발행으로 비중을 옮겨봅니다. BRIQ 가 자동으로 그렇게 짜둘 거예요.",
  },
];

// SEARCH 키워드는 브랜드별 useBrand() 로 파생 — 페이지 안에서 호출.

const AUDIENCE = {
  newRatio: 64,
  returningRatio: 36,
  newCount: 1820,
  returningCount: 1024,
  note: "신규 유입이 단골보다 빠르게 늘고 있습니다. 다음 단계는 한 번 와본 분이 다시 오는 흐름 — 단골 재방문 캠페인이 적기.",
};

const NEXT_WEEK_ACTIONS = [
  {
    title: "신메뉴 봄나물 코스 캠페인을 키우세요.",
    why: "검색 키워드 '강남 봄나물 코스' 가 신규로 7% 점유 — 시즌 끝나기 전 화·수 점심 발행으로 확장.",
  },
  {
    title: "단골 재방문 캠페인을 켜는 게 좋겠습니다.",
    why: "지난 60일 1회 방문 후 미재방문 손님 412명. 카카오 채널 + 인스타 DM 으로 자동 안내.",
  },
  {
    title: "어버이날 5/8 자리는 미리 알리세요.",
    why: "작년 어버이날 직전 주 예약 +2.4배. 5/4~5/7 발행 + Story 카운트다운이 가장 빠르게 자리를 채웠습니다.",
  },
];

export default function InsightsPage() {
  const { brand } = useBrand();
  const SEARCH = brandSearchKeywords(brand);
  return (
    <>
      <Topbar title="Performance Insights" breadcrumb="이번 주 발견" />
      <div className="max-w-[1180px] mx-auto px-5 sm:px-10 md:px-14 pt-10 sm:pt-16 pb-24">
        {/* Masthead */}
        <header className="pb-12 border-b border-zinc-200 dark:border-zinc-800">
          <div className="editorial-label">Findings · Week 20</div>
          <h1
            className="mt-4 text-[36px] sm:text-[56px] leading-[0.98] tracking-[-0.02em] font-medium max-w-[820px]"
            style={{ fontFamily: "'Cormorant Garamond', 'Nanum Myeongjo', serif", fontWeight: 500 }}
          >
            {HEADLINE.oneLine}
          </h1>
          <p
            className="mt-6 max-w-[680px] text-[15.5px] leading-[1.8] text-zinc-700 dark:text-zinc-300"
            style={{ fontFamily: "'Nanum Myeongjo', serif" }}
          >
            {HEADLINE.body}
          </p>
        </header>

        {/* 변화 — 숫자로 한 줄씩 */}
        <section className="pt-10">
          <div className="editorial-label mb-5">이번 주 변화</div>
          <dl className="grid grid-cols-2 sm:grid-cols-4 gap-x-0 gap-y-6 border-y border-zinc-200 dark:border-zinc-800 py-7">
            {DELTAS.map((d) => (
              <div
                key={d.label}
                className="px-5 first:pl-0 sm:border-l sm:border-zinc-200 dark:sm:border-zinc-800 sm:first:border-l-0"
              >
                <dt className="editorial-label">{d.label}</dt>
                <dd
                  className="mt-2 text-[36px] sm:text-[42px] tabular-nums leading-none tracking-tight"
                  style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 500 }}
                >
                  {d.value}
                </dd>
                <dd className="mt-2 text-[11.5px] text-zinc-500">{d.detail}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* 콘텐츠 결 */}
        <section className="pt-14">
          <div className="editorial-label mb-5">콘텐츠 결</div>
          <div className="space-y-10">
            {CONTENT_NOTES.map((n) => (
              <article key={n.n} className="grid grid-cols-12 gap-x-8">
                <div className="col-span-12 sm:col-span-2 editorial-label tabular-nums">{n.n}</div>
                <div className="col-span-12 sm:col-span-10">
                  <h3
                    className="text-[22px] sm:text-[26px] leading-[1.25] tracking-[-0.01em]"
                    style={{ fontFamily: "'Nanum Myeongjo', serif" }}
                  >
                    {n.title}
                  </h3>
                  <p
                    className="mt-3 max-w-[640px] text-[14.5px] leading-[1.8] text-zinc-600 dark:text-zinc-400"
                    style={{ fontFamily: "'Nanum Myeongjo', serif" }}
                  >
                    {n.body}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* 검색 유입 */}
        <section className="pt-16">
          <div className="flex items-baseline justify-between mb-5">
            <div className="editorial-label">검색 유입 키워드</div>
            <div className="text-[11px] text-zinc-500">이번 주 점유율</div>
          </div>
          <ul className="divide-y divide-zinc-200 dark:divide-zinc-800 border-y border-zinc-200 dark:border-zinc-800">
            {SEARCH.map((s) => (
              <li key={s.kw} className="grid grid-cols-12 items-center gap-x-4 py-4">
                <div
                  className="col-span-6 sm:col-span-5 text-[15px] tracking-tight"
                  style={{ fontFamily: "'Nanum Myeongjo', serif" }}
                >
                  {s.kw}
                </div>
                <div className="col-span-4 sm:col-span-5 h-px relative">
                  <div className="absolute inset-y-[-3px] left-0 bg-zinc-200 dark:bg-zinc-800 w-full h-[6px]" />
                  <div
                    className="absolute inset-y-[-3px] left-0 bg-zinc-900 dark:bg-zinc-100 h-[6px]"
                    style={{ width: `${s.share}%` }}
                  />
                </div>
                <div className="col-span-1 sm:col-span-1 text-[11px] tabular-nums text-zinc-700 dark:text-zinc-300 text-right">
                  {s.share}%
                </div>
                <div className="col-span-1 sm:col-span-1 text-[10px] tracking-[0.15em] uppercase text-zinc-400 text-right">
                  {s.delta}
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* 단골 vs 신규 */}
        <section className="pt-16">
          <div className="editorial-label mb-5">단골 vs 신규</div>
          <div className="grid grid-cols-12 gap-x-10 border-y border-zinc-200 dark:border-zinc-800 py-8">
            <div className="col-span-12 sm:col-span-5">
              <div className="flex h-3 w-full overflow-hidden border border-zinc-200 dark:border-zinc-800">
                <div
                  className="bg-zinc-900 dark:bg-zinc-100"
                  style={{ width: `${AUDIENCE.newRatio}%` }}
                />
                <div
                  className="bg-zinc-200 dark:bg-zinc-800"
                  style={{ width: `${AUDIENCE.returningRatio}%` }}
                />
              </div>
              <div className="mt-3 flex items-baseline justify-between text-[11px] tabular-nums">
                <div>
                  <span className="editorial-label">신규</span>
                  <span className="ml-2 text-zinc-900 dark:text-zinc-100">{AUDIENCE.newRatio}%</span>
                  <span className="ml-1 text-zinc-400">· {AUDIENCE.newCount.toLocaleString()}</span>
                </div>
                <div>
                  <span className="editorial-label">단골</span>
                  <span className="ml-2 text-zinc-900 dark:text-zinc-100">{AUDIENCE.returningRatio}%</span>
                  <span className="ml-1 text-zinc-400">· {AUDIENCE.returningCount.toLocaleString()}</span>
                </div>
              </div>
            </div>
            <p
              className="col-span-12 sm:col-span-7 mt-6 sm:mt-0 text-[14.5px] leading-[1.8] text-zinc-600 dark:text-zinc-400"
              style={{ fontFamily: "'Nanum Myeongjo', serif" }}
            >
              {AUDIENCE.note}
            </p>
          </div>
        </section>

        {/* 다음 주 액션 — BRIQ 가 자동 적용 */}
        <section className="pt-16">
          <div className="flex items-baseline justify-between mb-5">
            <div className="editorial-label">다음 주, BRIQ 가 이렇게 움직입니다</div>
            <a
              href="/campaigns"
              className="text-[11px] text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 underline underline-offset-4 decoration-[0.5px]"
            >
              캠페인 큐 보기 →
            </a>
          </div>
          <ol className="divide-y divide-zinc-200 dark:divide-zinc-800 border-y border-zinc-200 dark:border-zinc-800">
            {NEXT_WEEK_ACTIONS.map((a, i) => (
              <li key={i} className="grid grid-cols-12 gap-x-6 py-5 items-baseline">
                <div className="col-span-1 editorial-label tabular-nums">
                  {String(i + 1).padStart(2, "0")}
                </div>
                <div className="col-span-11">
                  <div
                    className="text-[17px] sm:text-[19px] leading-snug"
                    style={{ fontFamily: "'Nanum Myeongjo', serif" }}
                  >
                    {a.title}
                  </div>
                  <div className="mt-1.5 text-[12.5px] text-zinc-500 leading-relaxed max-w-[640px]">
                    {a.why}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </>
  );
}
