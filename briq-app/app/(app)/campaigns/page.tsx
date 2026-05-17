"use client";

// Campaigns — 통합 단일 흐름.
//
// 사용자는 "기능" 을 실행하지 않는다. 캠페인 한 줄만 적으면
// 카드뉴스 / 릴스 썸네일 / 캡션 / 해시태그 / 발행 시간 / 채널 / 일정이
// 시스템 안에서 자동으로 결정된다.
//
// 사용자가 만지는 결정은 단 셋:
//   ① 승인 — 이대로 발행 큐에 올린다
//   ② 다듬기 — 카피만 살짝 손본다 (살아있는 텍스트필드 한 칸)
//   ③ 건너뛰기 — 이번 주에서 뺀다
//
// AI 모델 선택 / 옵션 / 프롬프트 / 플랫폼별 설정 같은 건 사용자에게 보이지 않는다.
// 시스템이 가게 컨텍스트 + Brand Persona + BrandMemory + 시즌 + 최근 반응을 보고 결정한다.

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "motion/react";
import { Topbar } from "@/components/layout/Topbar";
import { CampaignDraftCard } from "@/components/campaigns/CampaignDraftCard";
import { CampaignOneLineInput, buildDraftFromTopic } from "@/components/campaigns/CampaignOneLineInput";
import type { CampaignDraft } from "@/components/campaigns/types";
import { useBrand } from "@/components/brand/BrandProvider";
import { brandSeasonalCampaign } from "@/lib/brand/brand-context";
import { generateCardnewsCampaign, type CardnewsCampaignKind } from "@/lib/cardnews/hook-generator";
import type { Brand } from "@/types";

/** 캠페인 종류 + 헤드라인 → 카드뉴스(7컷) + 캡션/해시태그/CTA/지표 묶음으로 자동 출고. */
function buildDraft(
  brand: Brand,
  id: string,
  kindLabel: CardnewsCampaignKind,
  topic: string,
  rationale: string,
  schedule: { startsAt: string; postsTotal: number },
  autoDecisions: CampaignDraft["autoDecisions"],
  extras: CampaignDraft["pieces"],
  channels: CampaignDraft["channels"],
): CampaignDraft {
  const gen = generateCardnewsCampaign(topic, brand, kindLabel);
  return {
    id,
    headline: gen.headline,
    kind: kindLabel,
    rationale,
    channels,
    schedule,
    autoDecisions,
    pieces: [
      {
        kind: "cardnews",
        format: "Instagram Feed",
        title: `${topic} · 7컷 카드뉴스`,
        copyPreview: gen.marketing.caption.split("\n").slice(0, 2).join(" "),
        cardnews: gen.slides,
        marketing: gen.marketing,
      },
      ...extras,
    ],
  };
}

function seedDraftsForBrand(brand: Brand): CampaignDraft[] {
  const seasonal = brandSeasonalCampaign(brand);
  return [
    buildDraft(
      brand,
      "draft-new-menu",
      "신메뉴",
      seasonal.newKindHeadline,
      seasonal.newKindRationale,
      { startsAt: "2026-05-20", postsTotal: 5 },
      [
        { label: "발행 시간", value: "화·수 오전 11:48", note: "지난 4주 reach 1.6배" },
        { label: "후킹 패턴", value: "숫자형 — '100곳 중 1곳'", note: "신메뉴 캠페인 검증된 결" },
        { label: "텍스트 위치", value: "안전영역 자동 배치" },
        { label: "톤", value: "Editorial · 따뜻한 가게 톤" },
      ],
      [
        {
          kind: "reels",
          format: "Instagram Reels",
          title: "30초 후킹 컷",
          copyPreview: "한 호흡에 보여드리는 30초 — 카드뉴스 후킹 캡션 그대로.",
          reels: {
            durationSec: 30,
            cuts: 6,
            bgmMood: "조용한 어쿠스틱 · 92BPM",
            subtitles: [
              { t: "이번 시즌, 새로 시작합니다.", at: 0 },
              { t: "재료부터 다릅니다.", at: 7 },
              { t: "한 호흡, 그대로.", at: 15 },
              { t: "저장 → 다음에 오실 때.", at: 24 },
            ],
          },
        },
        {
          kind: "blog",
          format: "Naver Blog",
          title: `${seasonal.newKindHeadline} — 산지 후기와 메뉴 구성`,
          copyPreview:
            "솔직히 이번엔 좀 다릅니다. 재료 들어오는 거 보고 결정했어요. 글 안에 그 과정 그대로 적어둡니다.",
        },
      ],
      ["Instagram", "Naver Blog", "Story"],
    ),
    buildDraft(
      brand,
      "draft-mothersday",
      "시즌",
      seasonal.seasonHeadline,
      `지난해 어버이날 직전 주 ${["stay", "beauty", "restaurant"].includes(brand.industry) ? "예약" : "주문"}이 평소 대비 2.4배. 5/4~5/7 사이 발행 + Story 카운트다운이 가장 빠르게 ${["stay", "beauty", "restaurant"].includes(brand.industry) ? "예약" : "주문"}을 가져왔습니다.`,
      { startsAt: "2026-05-04", postsTotal: 3 },
      [
        { label: "발행 시간", value: "수·목 오후 7:12" },
        { label: "후킹 패턴", value: "약속형 — 'D-3'", note: "시즌 캠페인 검증된 결" },
        { label: "CTA", value: "DM 'OPEN' 자동 라우팅" },
        { label: "톤", value: "Warm-shop · 부드러운 안내체" },
      ],
      [
        {
          kind: "reels",
          format: "Instagram Reels",
          title: "어버이날 D-3 카운트다운",
          copyPreview: "어버이날 자리, 점심 2 · 저녁 1 남았습니다.",
          reels: {
            durationSec: 15,
            cuts: 4,
            bgmMood: "잔잔한 피아노 · 78BPM",
            subtitles: [
              { t: "어버이날, 사흘 남았어요.", at: 0 },
              { t: "점심 2 · 저녁 1.", at: 5 },
              { t: "DM 'OPEN' 보내주세요.", at: 10 },
            ],
          },
        },
        {
          kind: "story",
          format: "Story",
          title: "어버이날 카운트다운 · D-3",
          copyPreview: "남은 자리 점심 2 · 저녁 1.",
        },
        {
          kind: "kakao",
          format: "Kakao 채널",
          title: "단골 손님께 — 어버이날 자리 안내",
          copyPreview: "지난해 다녀가신 분께 먼저 안내드립니다. 카카오톡으로 답장만 주시면 자리 비워둡니다.",
        },
      ],
      ["Instagram", "Story", "Kakao 채널"],
    ),
  ];
}

export default function CampaignsPage() {
  const { brand } = useBrand();
  const [drafts, setDrafts] = React.useState<CampaignDraft[]>(() => seedDraftsForBrand(brand));
  const [approved, setApproved] = React.useState<string[]>([]);
  const [skipped, setSkipped] = React.useState<string[]>([]);
  const router = useRouter();
  const searchParams = useSearchParams();

  // 브랜드 바뀌면 초안 재시드 (승인/건너뜀 상태도 리셋)
  React.useEffect(() => {
    setDrafts(seedDraftsForBrand(brand));
    setApproved([]);
    setSkipped([]);
  }, [brand.id]);

  // Dashboard 의 "오늘 뭐 홍보할까요" 카드에서 들어왔을 때 — topic 으로 초안 자동 생성.
  React.useEffect(() => {
    const topic = searchParams.get("topic");
    const kind = searchParams.get("kind") ?? undefined;
    if (!topic) return;
    const draft = buildDraftFromTopic(topic, kind, brand);
    setDrafts((cur) => [draft, ...cur]);
    // URL 정리 — 새로고침 시 중복 생성 방지
    router.replace("/campaigns", { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onApprove = (id: string) => {
    setApproved((a) => [...a, id]);
    setDrafts((d) => d.filter((x) => x.id !== id));
  };
  const onSkip = (id: string) => {
    setSkipped((s) => [...s, id]);
    setDrafts((d) => d.filter((x) => x.id !== id));
  };
  const onAddDraft = (draft: CampaignDraft) => setDrafts((d) => [draft, ...d]);

  return (
    <>
      <Topbar title="Campaigns" breadcrumb="이번 주 자동 제안" />
      <div className="max-w-[1180px] mx-auto px-5 sm:px-10 md:px-14 pt-10 sm:pt-16 pb-24">
        {/* Masthead — 매거진 결 */}
        <header className="pb-10 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-baseline justify-between">
            <div className="editorial-label">This week</div>
            <div className="text-[11px] tabular-nums text-zinc-500">
              제안 <span className="text-zinc-900 dark:text-zinc-100">{drafts.length}</span>
              <span className="mx-1.5 text-zinc-300">·</span>
              승인 <span className="text-zinc-900 dark:text-zinc-100">{approved.length}</span>
              <span className="mx-1.5 text-zinc-300">·</span>
              건너뜀 <span className="text-zinc-900 dark:text-zinc-100">{skipped.length}</span>
            </div>
          </div>
          <h1
            className="mt-3 text-[32px] sm:text-[44px] leading-[0.98] tracking-[-0.02em] font-medium"
            style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 500 }}
          >
            이번 주, 사장님이 결정하실 건 {drafts.length || "—"} 개뿐입니다.
          </h1>
          <p className="mt-4 max-w-[640px] text-[14px] text-zinc-600 dark:text-zinc-400 leading-relaxed">
            카드뉴스 · 릴스 · 캡션 · 해시태그 · 발행 시간 · 채널은 BRIQ 가 가게 컨텍스트를 보고 결정해 둡니다.
            사장님은 <span className="text-zinc-900 dark:text-zinc-100">승인 · 살짝 다듬기 · 건너뛰기</span> 셋 중 하나만 누르시면 됩니다.
          </p>
        </header>

        {/* 진행 중인 캠페인 — "지금 가게에서 도는" 것들 */}
        <RunningCampaigns brand={brand} />

        {/* 한 줄 입력 — 시스템이 자동 제안 안 한 캠페인이 떠올랐을 때만 사용 */}
        <CampaignOneLineInput onSubmit={onAddDraft} brand={brand} />

        {/* 캠페인 카드 — 매거진 기사 한 꼭지처럼 한 면씩 */}
        <section className="mt-14 space-y-16">
          {drafts.map((draft, i) => (
            <motion.div
              // 브랜드 + draft 조합으로 키 — 브랜드 바뀌면 카드 통째로 fresh mount
              // → 카드뉴스 캐러셀 / 릴스 비디오 / 이미지 픽커 등 내부 state 가 새 토픽으로 재초기화
              key={`${brand.id}::${draft.id}`}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.05 }}
            >
              <CampaignDraftCard
                index={i + 1}
                brand={brand}
                draft={draft}
                onApprove={() => onApprove(draft.id)}
                onSkip={() => onSkip(draft.id)}
              />
            </motion.div>
          ))}

          {drafts.length === 0 && (
            <div className="py-24 text-center">
              <div className="editorial-label">All clear</div>
              <p
                className="mt-4 text-[22px] sm:text-[28px] leading-snug text-zinc-700 dark:text-zinc-300"
                style={{ fontFamily: "'Nanum Myeongjo', serif" }}
              >
                이번 주 결정할 캠페인은 모두 정리되었습니다.
              </p>
              <p className="mt-3 text-[13px] text-zinc-500">
                다음 제안은 BRIQ 가 자동으로 올립니다. 사장님은 가게에 집중하세요.
              </p>
            </div>
          )}
        </section>

        {/* 발행 큐 — 곧 올라갈 콘텐츠 */}
        <PublishingQueue />

        {/* 지난 주 결과 — 무엇이 잘 받았나 */}
        <LastWeekResults />

        {/* 승인된 캠페인 — 푸터처럼 작게 */}
        {(approved.length > 0 || skipped.length > 0) && (
          <footer className="mt-24 pt-10 border-t border-zinc-200 dark:border-zinc-800">
            <div className="editorial-label mb-4">Recent decisions</div>
            <ul className="text-[12.5px] text-zinc-500 leading-relaxed space-y-1.5">
              {approved.map((id) => (
                <li key={id} className="flex items-center gap-3">
                  <span className="text-[10px] tracking-[0.15em] uppercase text-zinc-900 dark:text-zinc-100">
                    Approved
                  </span>
                  <span className="text-zinc-600 dark:text-zinc-400">{labelFor(id, drafts)}</span>
                  <span className="ml-auto tabular-nums">발행 큐에 추가됨</span>
                </li>
              ))}
              {skipped.map((id) => (
                <li key={id} className="flex items-center gap-3">
                  <span className="text-[10px] tracking-[0.15em] uppercase text-zinc-400">
                    Skipped
                  </span>
                  <span className="text-zinc-500">{labelFor(id, drafts)}</span>
                  <span className="ml-auto tabular-nums text-zinc-400">이번 주 제외</span>
                </li>
              ))}
            </ul>
          </footer>
        )}
      </div>
    </>
  );
}

function labelFor(id: string, drafts: CampaignDraft[]) {
  return drafts.find((d) => d.id === id)?.headline ?? id;
}

// ─────────────────────────────────────────────────────────────────────────────
// 진행 중인 캠페인 — 이미 승인되어 굴러가는 것들
// ─────────────────────────────────────────────────────────────────────────────

function runningCampaignsForBrand(brand: Brand) {
  const seasonal = brandSeasonalCampaign(brand);
  const city = brand.city.replace(/구$/, "");
  return [
    {
      id: "run-spring-course",
      title: seasonal.newKindHeadline,
      kind: seasonal.newKindLabel,
      started: "5/6",
      progress: 4,
      total: 7,
      nextAt: "내일 11:48",
      nextWhat: "Instagram Feed · 시즌 후기",
      reach: `${Math.round(brand.reachThisMonth / 1000 / 5 * 10) / 10}k`,
      delta: "+18%",
    },
    {
      id: "run-weekly-blog",
      title: `주간 블로그 · ${city} ${brand.industryLabel} 가이드`,
      kind: "상시",
      started: "지난주",
      progress: 1,
      total: 1,
      nextAt: "화요일 09:30",
      nextWhat: "Naver Blog · 어버이날 가이드",
      reach: "4.2k",
      delta: "+9%",
    },
  ];
}

function RunningCampaigns({ brand }: { brand: Brand }) {
  const RUNNING = runningCampaignsForBrand(brand);
  return (
    <section className="mt-12">
      <div className="flex items-baseline justify-between mb-5">
        <div className="editorial-label">지금 진행 중</div>
        <div className="text-[11px] text-zinc-500">자동으로 굴러가는 캠페인</div>
      </div>
      <ul className="divide-y divide-zinc-200 dark:divide-zinc-800 border-y border-zinc-200 dark:border-zinc-800">
        {RUNNING.map((r) => (
          <li key={r.id} className="grid grid-cols-12 gap-x-4 py-5 items-baseline">
            <div className="col-span-12 sm:col-span-4">
              <div className="text-[10px] tracking-[0.15em] uppercase text-zinc-400">
                {r.kind} · 시작 {r.started}
              </div>
              <div
                className="mt-1.5 text-[18px] sm:text-[20px] tracking-tight"
                style={{ fontFamily: "'Nanum Myeongjo', serif" }}
              >
                {r.title}
              </div>
            </div>
            <div className="col-span-12 sm:col-span-3 mt-3 sm:mt-0">
              <div className="editorial-label">진행</div>
              <div className="mt-2 flex items-center gap-3">
                <div className="flex-1 h-[6px] bg-zinc-200 dark:bg-zinc-800 relative overflow-hidden">
                  <div
                    className="absolute inset-y-0 left-0 bg-zinc-900 dark:bg-zinc-100"
                    style={{ width: `${(r.progress / r.total) * 100}%` }}
                  />
                </div>
                <span className="text-[11px] tabular-nums text-zinc-500">
                  {r.progress}/{r.total}
                </span>
              </div>
            </div>
            <div className="col-span-7 sm:col-span-3 mt-3 sm:mt-0">
              <div className="editorial-label">다음 발행</div>
              <div className="mt-1.5 text-[13px] text-zinc-700 dark:text-zinc-300 tabular-nums">
                {r.nextAt}
              </div>
              <div className="text-[11px] text-zinc-500 truncate">{r.nextWhat}</div>
            </div>
            <div className="col-span-5 sm:col-span-2 mt-3 sm:mt-0 text-right">
              <div className="editorial-label">Reach</div>
              <div
                className="mt-1.5 text-[20px] sm:text-[22px] tabular-nums leading-none"
                style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 500 }}
              >
                {r.reach}
              </div>
              <div className="text-[10px] tracking-[0.1em] uppercase text-emerald-700 dark:text-emerald-300 mt-1">
                {r.delta}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 발행 큐 — 곧 올라갈 콘텐츠 (Scheduler 의 축소판)
// ─────────────────────────────────────────────────────────────────────────────

const UPCOMING = [
  { when: "오늘 19:12", channel: "Instagram", title: "수요일 점심 자리 있어요", status: "Issued" },
  { when: "내일 11:48", channel: "Instagram", title: "에티오피아 한 배치 · 신메뉴 컷", status: "Scheduled" },
  { when: "화 09:30", channel: "Naver Blog", title: "5월 봄나물 코스 — 산지 후기", status: "Scheduled" },
  { when: "수 11:48", channel: "Instagram", title: "오늘 한 컷 · 시그니처 메뉴", status: "Drafting" },
  { when: "목 19:12", channel: "Instagram", title: "주말 예약 안내 카드뉴스", status: "Drafting" },
];

function PublishingQueue() {
  return (
    <section className="mt-24">
      <div className="flex items-baseline justify-between mb-5">
        <div className="editorial-label">곧 올라갈 콘텐츠</div>
        <a
          href="/scheduler"
          className="text-[11px] text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 underline underline-offset-4 decoration-[0.5px]"
        >
          전체 일정 →
        </a>
      </div>
      <ol className="divide-y divide-zinc-200 dark:divide-zinc-800 border-y border-zinc-200 dark:border-zinc-800">
        {UPCOMING.map((u, i) => (
          <li key={i} className="grid grid-cols-12 gap-x-3 py-3.5 items-baseline">
            <div className="col-span-3 sm:col-span-2 editorial-label tabular-nums">{u.when}</div>
            <div className="col-span-3 sm:col-span-2 text-[10px] tracking-[0.15em] uppercase text-zinc-500">
              {u.channel}
            </div>
            <div
              className="col-span-5 sm:col-span-7 text-[14px]"
              style={{ fontFamily: "'Nanum Myeongjo', serif" }}
            >
              {u.title}
            </div>
            <div className="col-span-1 sm:col-span-1 text-right text-[10px] tracking-[0.15em] uppercase text-zinc-400">
              {u.status}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 지난 주 결과 — 무엇이 잘 받았나
// ─────────────────────────────────────────────────────────────────────────────

const LAST_WEEK = [
  {
    title: "두릅 30초 릴스",
    channel: "Instagram Reels",
    reach: 18_400,
    saves: 92,
    note: "이번 달 최고 reach. 짧은 클로즈업 컷이 잘 받음.",
  },
  {
    title: "오늘 점심 자리 있어요",
    channel: "Instagram Feed",
    reach: 9_200,
    saves: 47,
    note: "수요일 점심 발행 — 평일 점심 자리 문의 7건.",
  },
  {
    title: "강남 한정식 점심 가이드",
    channel: "Naver Blog",
    reach: 4_240,
    saves: 18,
    note: "'강남 한정식 점심' 검색에서 2페이지 → 1페이지.",
  },
];

function LastWeekResults() {
  return (
    <section className="mt-20">
      <div className="flex items-baseline justify-between mb-5">
        <div className="editorial-label">지난주, 가장 잘 받은 것</div>
        <a
          href="/insights"
          className="text-[11px] text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 underline underline-offset-4 decoration-[0.5px]"
        >
          전체 발견 →
        </a>
      </div>
      <ol className="divide-y divide-zinc-200 dark:divide-zinc-800 border-y border-zinc-200 dark:border-zinc-800">
        {LAST_WEEK.map((l, i) => (
          <li key={i} className="grid grid-cols-12 gap-x-4 py-5 items-baseline">
            <div className="col-span-1 editorial-label tabular-nums">
              {String(i + 1).padStart(2, "0")}
            </div>
            <div className="col-span-11 sm:col-span-6">
              <div className="text-[10px] tracking-[0.15em] uppercase text-zinc-400">
                {l.channel}
              </div>
              <div
                className="mt-1 text-[17px] sm:text-[19px] leading-snug"
                style={{ fontFamily: "'Nanum Myeongjo', serif" }}
              >
                {l.title}
              </div>
              <div className="mt-1.5 text-[12px] text-zinc-500 leading-relaxed max-w-[520px]">
                {l.note}
              </div>
            </div>
            <div className="col-span-6 sm:col-span-2 mt-3 sm:mt-0 sm:text-right">
              <div className="editorial-label">Reach</div>
              <div
                className="mt-1 text-[22px] tabular-nums leading-none"
                style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 500 }}
              >
                {l.reach.toLocaleString()}
              </div>
            </div>
            <div className="col-span-6 sm:col-span-3 mt-3 sm:mt-0 sm:text-right">
              <div className="editorial-label">저장</div>
              <div
                className="mt-1 text-[22px] tabular-nums leading-none"
                style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 500 }}
              >
                {l.saves}
              </div>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
