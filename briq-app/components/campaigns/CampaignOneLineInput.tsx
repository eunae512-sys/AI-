"use client";

// 한 줄 입력 — "신메뉴 홍보" / "어버이날 이벤트" / "단골 재방문"
//
// 시스템이 자동 제안 못한 캠페인을 떠올렸을 때만 쓴다.
// 옵션·플랫폼·톤·시간 — 어느 것도 묻지 않는다. 한 줄이면 그 자리에서 초안이 만들어진다.

import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import type { CampaignDraft } from "./types";
import type { Brand } from "@/types";
import { generateCardnewsCampaign, inferKindFromTopic, type CardnewsCampaignKind } from "@/lib/cardnews/hook-generator";
import { buildSuggestedTopics, pushRecentTopic, type SuggestedTopic } from "@/lib/campaigns/campaign-recipes";

export function CampaignOneLineInput({
  onSubmit,
  brand,
}: {
  onSubmit: (draft: CampaignDraft) => void;
  brand?: Brand;
}) {
  const [value, setValue] = React.useState("");
  const [thinking, setThinking] = React.useState(false);

  // 브랜드별 추천 풀 — 사장님 최근 입력 + 이번 달 시즌 + 산업 베이스 결합.
  // 마운트 후에만 (localStorage 접근) 새로 계산. brand 바뀔 때마다 갱신.
  const [suggestions, setSuggestions] = React.useState<SuggestedTopic[]>([]);
  React.useEffect(() => {
    if (!brand) {
      setSuggestions([]);
      return;
    }
    setSuggestions(buildSuggestedTopics({ brand, limit: 6 }));
  }, [brand?.id]);

  const submit = async (raw: string) => {
    const topic = raw.trim();
    if (!topic) return;
    setThinking(true);
    // 사장님 본인 입력 누적 → 다음에 본인 가게 추천 풀에 반영
    if (brand) pushRecentTopic(brand.id, topic);
    // 데모: 실제 환경에선 Trigger.dev workflow 가 카드/릴스/캡션/해시태그를 병렬 생성.
    await new Promise((r) => setTimeout(r, 600));
    onSubmit(buildDraftFromTopic(topic, undefined, brand));
    setThinking(false);
    setValue("");
    // 추천 풀 새로고침 (방금 누른 토픽이 'recent' 로 떠오르도록)
    if (brand) setSuggestions(buildSuggestedTopics({ brand, limit: 6 }));
  };

  return (
    <div className="mt-14 border-y border-zinc-200 dark:border-zinc-800 py-10">
      <div className="grid grid-cols-12 gap-x-8 items-start">
        <div className="col-span-12 sm:col-span-3 editorial-label">Anything else?</div>
        <div className="col-span-12 sm:col-span-9 mt-3 sm:mt-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              submit(value);
            }}
            className="flex items-baseline gap-3 border-b border-zinc-300 dark:border-zinc-700 pb-3"
          >
            <span
              className="text-[28px] sm:text-[36px] leading-none text-zinc-300 dark:text-zinc-700 select-none"
              style={{ fontFamily: "'Cormorant Garamond', serif" }}
            >
              ¶
            </span>
            <input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="떠오른 캠페인을 한 줄로 — 예: 신메뉴 봄나물 코스"
              className="flex-1 bg-transparent outline-none text-[20px] sm:text-[24px] tracking-tight placeholder:text-zinc-300 dark:placeholder:text-zinc-700"
              style={{ fontFamily: "'Nanum Myeongjo', serif" }}
              disabled={thinking}
            />
            <button
              type="submit"
              disabled={!value.trim() || thinking}
              className="text-[11px] tracking-[0.18em] uppercase text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 disabled:opacity-30 transition-colors"
            >
              {thinking ? "생각 중…" : "초안 만들기 →"}
            </button>
          </form>

          {/* 자주 적는 캠페인 — 브랜드 산업 × 이번 달 시즌 × 사장님 본인 입력 학습 */}
          <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-2">
            <span className="text-[10px] tracking-[0.15em] uppercase text-zinc-400">
              자주 적는 캠페인
            </span>
            {suggestions.map((s) => (
              <button
                key={`${s.source}-${s.text}`}
                type="button"
                onClick={() => submit(s.text)}
                disabled={thinking}
                title={
                  s.source === "recent"
                    ? "사장님이 최근 사용한 캠페인"
                    : s.source === "seasonal"
                    ? "이번 달에 자주 쓰는 시즌 캠페인"
                    : "이 업종에서 자주 쓰는 캠페인"
                }
                className={
                  "inline-flex items-center gap-1.5 text-[12.5px] disabled:opacity-40 transition-colors " +
                  (s.source === "recent"
                    ? "text-zinc-900 dark:text-zinc-100 underline underline-offset-4 decoration-zinc-900 dark:decoration-zinc-100 decoration-[0.75px] hover:decoration-2"
                    : s.source === "seasonal"
                    ? "text-amber-700 dark:text-amber-300 underline underline-offset-4 decoration-amber-300 dark:decoration-amber-500/40 decoration-[0.5px] hover:decoration-amber-700 dark:hover:decoration-amber-300"
                    : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 underline underline-offset-4 decoration-[0.5px] decoration-zinc-300")
                }
              >
                {s.source === "recent" && <span aria-hidden className="text-[9px] tracking-[0.15em] text-zinc-400">↻</span>}
                {s.source === "seasonal" && <span aria-hidden className="h-1 w-1 rounded-full bg-amber-500" />}
                {s.text}
              </button>
            ))}
          </div>

          <AnimatePresence>
            {thinking && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-6 text-[12px] text-zinc-500 leading-relaxed"
              >
                <ThinkingTrace />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function ThinkingTrace() {
  const lines = [
    "가게 컨텍스트 · 최근 4주 반응 · 시즌을 보고 있습니다.",
    "Brand Persona 톤에 맞춰 카드뉴스 · 릴스 · 캡션을 동시에 짭니다.",
    "발행 시간 · 채널 · 해시태그는 자동으로 결정됩니다.",
  ];
  const [i, setI] = React.useState(0);
  React.useEffect(() => {
    const id = setInterval(() => setI((x) => (x + 1) % lines.length), 700);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="flex items-center gap-3">
      <span className="inline-block h-1.5 w-1.5 rounded-full bg-zinc-400 animate-pulse" />
      <span>{lines[i]}</span>
    </div>
  );
}

export function buildDraftFromTopic(topic: string, kindOverride?: string, brand?: Brand): CampaignDraft {
  const kind: CardnewsCampaignKind = (kindOverride as CardnewsCampaignKind) ?? inferKindFromTopic(topic);

  // 브랜드가 있으면 후킹 엔진 통해 7컷 + 캡션 + 해시태그 + CTA + 지표 통째로.
  // 브랜드 없으면 1번 더미 (Onboarding 전 등 — 거의 발생 안 함).
  const gen = brand ? generateCardnewsCampaign(topic, brand, kind) : null;

  return {
    id: `draft-${Date.now()}`,
    headline: gen?.headline ?? topic,
    kind,
    rationale: `사장님이 적어주신 '${topic}' 으로 후킹 공식(HOOK·PROBLEM·VALUE·PROOF·CTA) 적용한 카드뉴스 7컷과 캡션·해시태그·CTA·예상 지표를 한 번에 만들었습니다.`,
    channels: ["Instagram", "Naver Blog", "Story"],
    schedule: { startsAt: nextWeekday(), postsTotal: 4 },
    autoDecisions: [
      { label: "발행 시간", value: "화·수 오전 11:48", note: "지난 4주 reach 1.6배" },
      { label: "후킹 패턴", value: hookPatternLabel(kind), note: "검증된 SMB 인스타 결" },
      { label: "해시태그", value: gen ? `${gen.marketing.hashtags.length}개 자동` : "12개 자동" },
      { label: "톤", value: "Editorial · 따뜻한 가게 톤" },
    ],
    pieces: [
      ...(gen
        ? [{
            kind: "cardnews" as const,
            format: "Instagram Feed" as const,
            title: `${topic} · 7컷 카드뉴스`,
            copyPreview: gen.marketing.caption.split("\n").slice(0, 2).join(" "),
            cardnews: gen.slides,
            marketing: gen.marketing,
          }]
        : []),
      {
        kind: "reels",
        format: "Instagram Reels",
        title: `릴스 · ${topic} 30초`,
        copyPreview: "한 호흡에 보여드리는 30초 — 카드뉴스 후킹 컷 그대로.",
        reels: {
          durationSec: 30,
          cuts: 5,
          bgmMood: "조용한 어쿠스틱 · 92BPM",
          // 주제별로 달라지는 자막 — 카드뉴스 후킹 슬라이드(hook·value·proof·cta)에서
          // 추출. 더는 모든 캠페인에 같은 문구가 반복되지 않는다.
          subtitles: reelSubtitlesFromGen(gen, topic),
        },
      },
      {
        kind: "blog",
        format: "Naver Blog",
        title: `${topic} — 사장님 입장 후기`,
        copyPreview:
          "솔직히 이번엔 좀 다릅니다. 재료 들어오는 거 보고 결정했어요. 글 안에 그 과정 그대로 적어둡니다.",
      },
    ],
  };
}

// 릴스 자막을 카드뉴스 후킹 슬라이드에서 뽑아 주제별로 다르게 만든다.
// gen 이 있으면 hook → value → value/proof → cta 캡션을, 없으면 토픽 기반 폴백.
function reelSubtitlesFromGen(
  gen: ReturnType<typeof generateCardnewsCampaign> | null,
  topic: string,
): { t: string; at: number }[] {
  const times = [0, 7, 15, 24];
  // 슬라이드 캡션은 보통 2줄(\n) — 첫 줄만 떼면 "매번 예약을" 같은 조각이 된다.
  // 두 줄을 한 문장으로 이어 자막이 문맥 그대로 들어가게.
  const clip = (s?: string) => {
    const line = (s ?? "").replace(/\s*\n\s*/g, " ").replace(/\s+/g, " ").trim();
    return line.length > 38 ? line.slice(0, 37).trimEnd() + "…" : line;
  };

  if (!gen) {
    return [
      { t: clip(`${topic}, 이렇게 시작합니다.`), at: 0 },
      { t: "재료부터 다릅니다.", at: 7 },
      { t: "한 컷, 그대로.", at: 15 },
      { t: "저장 → 다음에 오실 때.", at: 24 },
    ];
  }

  const capByRole = (role: string) => {
    const sl = gen.slides.find((s) => s.role === role);
    return sl ? clip(sl.caption) : "";
  };
  const values = gen.slides
    .filter((s) => s.role === "value")
    .map((s) => clip(s.caption))
    .filter(Boolean);

  const raw = [
    capByRole("hook") || clip(gen.headline) || `${topic}, 이렇게 시작합니다.`,
    values[0] || capByRole("problem") || "재료부터 다릅니다.",
    values[1] || capByRole("proof") || "한 컷, 그대로.",
    capByRole("cta") || "저장 → 다음에 오실 때.",
  ];

  // 같은 줄이 두 번 나오면 다른 후보로 교체 (변형 보장)
  const pool = gen.slides.map((s) => clip(s.caption)).filter(Boolean);
  const seen = new Set<string>();
  const lines = raw.map((line) => {
    let v = line;
    if (!v || seen.has(v)) {
      const alt = [...values, ...pool].find((x) => x && !seen.has(x));
      if (alt) v = alt;
    }
    seen.add(v);
    return v;
  });

  return lines.map((t, i) => ({ t, at: times[i] }));
}

function hookPatternLabel(kind: CardnewsCampaignKind): string {
  switch (kind) {
    case "신메뉴":
    case "신상품":
      return "숫자형 · '100곳 중 1곳'";
    case "시즌":
    case "예약":
    case "이벤트":
      return "약속형 · 'D-N, 한정'";
    case "단골":
      return "비밀형 · '단골만 아는'";
    case "리뷰":
      return "반전형 · '비싸다고 망설였는데'";
    case "트렌드":
      return "질문형 · '가능할까요?'";
  }
}

function nextWeekday(): string {
  const d = new Date();
  d.setDate(d.getDate() + 3);
  return d.toISOString().slice(0, 10);
}

// 레거시 — 후킹 엔진이 인계 받아 호출 안 됨. 안전상 유지.
function _legacyQueryFor(topic: string, role: "hero" | "ingredient" | "process" | "space" | "closing"): string {
  const isSeason = /시즌|봄|여름|가을|겨울|어버이|크리스마스|발렌타인|추석|설/i.test(topic);
  const isReturn = /단골|재방문/i.test(topic);
  const isReview = /리뷰|후기/i.test(topic);
  const isTrend = /트렌드|동네/i.test(topic);
  const isReservation = /예약|자리/i.test(topic);

  const subjectBase = isSeason
    ? "elegant family dinner table"
    : isReturn
      ? "warm restaurant interior welcoming"
      : isReview
        ? "candid happy moment cafe"
        : isTrend
          ? "neighborhood street cafe"
          : isReservation
            ? "empty cozy restaurant table"
            : "korean fine dining table"; // 기본 = 신메뉴

  const roleMap: Record<typeof role, string> = {
    hero: `${subjectBase} overhead, magazine editorial, soft warm window light`,
    ingredient: "fresh seasonal ingredient close up, wooden board, natural light, food still life editorial",
    process: "chef hands cooking candid, warm kitchen window light, editorial film aesthetic",
    space: "minimal restaurant interior empty table, soft afternoon light, warm wood tones, editorial",
    closing: "elegant tea ceramic still life, warm window light, intimate editorial, korean",
  };

  return roleMap[role] + ", shallow depth of field, candid, no text";
}
