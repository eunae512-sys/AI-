"use client";

import * as React from "react";
import { motion } from "motion/react";
import {
  Search,
  Sparkles,
  TrendingUp,
  ArrowUpRight,
  Bot,
  Globe,
  Wand2,
  Star,
  MapPin,
  Phone,
  Quote,
  Play,
  Loader2,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useBrand } from "@/components/brand/BrandProvider";
import { useToast } from "@/components/ui/toast";
import {
  getDiscovery,
  type ContentRecommendation,
  type SeoKeyword,
} from "@/lib/dummy/geo-seo";
import { cn } from "@/lib/utils";

const DIFF_COLOR: Record<SeoKeyword["difficulty"], string> = {
  low: "text-emerald-600 dark:text-emerald-400",
  mid: "text-amber-600 dark:text-amber-400",
  high: "text-rose-600 dark:text-rose-400",
};

const DIFF_LABEL: Record<SeoKeyword["difficulty"], string> = {
  low: "낮음",
  mid: "중간",
  high: "높음",
};

const INTENT_LABEL: Record<SeoKeyword["intent"], string> = {
  local: "지역",
  info: "정보",
  trans: "전환",
  review: "리뷰",
};

const CHANNEL_LABEL: Record<SeoKeyword["channel"], string> = {
  naver: "Naver",
  google: "Google",
  both: "둘 다",
};

const ENGINE_META: Record<
  "chatgpt" | "perplexity" | "gemini" | "naverCue",
  { label: string; color: string }
> = {
  chatgpt: { label: "ChatGPT", color: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300" },
  perplexity: { label: "Perplexity", color: "bg-sky-500/15 text-sky-700 dark:text-sky-300" },
  gemini: { label: "Gemini", color: "bg-violet-500/15 text-violet-700 dark:text-violet-300" },
  naverCue: { label: "Naver Cue", color: "bg-lime-500/15 text-lime-700 dark:text-lime-300" },
};

const EFFORT_LABEL: Record<ContentRecommendation["effort"], string> = {
  S: "30분",
  M: "2시간",
  L: "반나절",
};

function ScoreRing({ value, label, accent }: { value: number; label: string; accent: string }) {
  const pct = Math.max(0, Math.min(100, value));
  const stops = `conic-gradient(${accent} 0% ${pct}%, rgb(228 228 231 / 0.5) ${pct}% 100%)`;
  return (
    <div className="flex items-center gap-3">
      <div
        className="relative h-14 w-14 rounded-full grid place-items-center"
        style={{ background: stops }}
      >
        <div className="absolute inset-1.5 rounded-full bg-white dark:bg-zinc-950 grid place-items-center">
          <span className="text-sm font-semibold tabular-nums">{pct}</span>
        </div>
      </div>
      <div>
        <div className="text-[10px] uppercase tracking-[0.18em] text-zinc-400 font-semibold">{label}</div>
        <div className="text-[11px] text-zinc-500 mt-0.5">100점 만점 · 업종 대비</div>
      </div>
    </div>
  );
}

export function DiscoverScreen() {
  const { brand } = useBrand();
  const toast = useToast();
  const data = getDiscovery(brand.industry);
  const [activeIdea, setActiveIdea] = React.useState<string | null>(data.contentIdeas[0]?.id ?? null);
  const [query, setQuery] = React.useState("");

  const active = data.contentIdeas.find((c) => c.id === activeIdea) ?? data.contentIdeas[0];

  const filteredKeywords = React.useMemo(() => {
    if (!query.trim()) return data.seoKeywords;
    const q = query.trim().toLowerCase();
    return data.seoKeywords.filter((k) => k.word.toLowerCase().includes(q));
  }, [data.seoKeywords, query]);

  const generate = (c: ContentRecommendation) => {
    toast.success(`"${c.title}" 초안 생성 → 카드뉴스/블로그 스튜디오로 이동`);
  };

  return (
    <div className="px-4 sm:px-6 py-4 sm:py-6">
      {/* Header */}
      <div className="flex items-end justify-between gap-4 flex-wrap mb-5 sm:mb-6">
        <div className="min-w-0">
          <div className="text-[10px] sm:text-[11px] uppercase tracking-[0.15em] text-emerald-600 dark:text-emerald-400 font-semibold">
            SEO · GEO RADAR · {brand.name}
          </div>
          <h1 className="mt-2 text-[22px] sm:text-2xl md:text-3xl font-semibold tracking-tight leading-[1.15]">
            검색 + AI 답변에 잡히는 콘텐츠
          </h1>
          <p className="mt-1.5 text-[13px] sm:text-sm text-zinc-500 max-w-2xl leading-relaxed">
            {data.region} · {brand.industryLabel} 기준 · Naver/Google SEO + ChatGPT·Perplexity·Cue 인용 최적화 (GEO)
          </p>
        </div>
      </div>

      {/* Score strip */}
      <Card className="p-4 sm:p-5 mb-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
          <ScoreRing value={data.myShare.seo} label="우리 SEO 점유율" accent="rgb(99 102 241)" />
          <ScoreRing value={data.myShare.geo} label="우리 GEO 인용률" accent="rgb(16 185 129)" />
          <div className="flex items-center gap-3">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 grid place-items-center">
              <TrendingUp className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-zinc-400 font-semibold">업종 중앙값</div>
              <div className="mt-0.5 text-sm font-medium">
                SEO <span className="tabular-nums">{data.industryMedian.seo}</span>
                <span className="text-zinc-400 mx-1.5">·</span>
                GEO <span className="tabular-nums">{data.industryMedian.geo}</span>
              </div>
              <div className="text-[11px] text-zinc-500 mt-0.5">
                {data.myShare.seo >= data.industryMedian.seo ? "SEO 우위" : "SEO 추격 중"} ·
                {" "}
                {data.myShare.geo >= data.industryMedian.geo ? " GEO 우위" : " GEO 추격 중"}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 grid place-items-center">
              <Sparkles className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-zinc-400 font-semibold">생성 가능 콘텐츠</div>
              <div className="mt-0.5 text-sm font-medium tabular-nums">{data.contentIdeas.length}편 추천 대기</div>
              <div className="text-[11px] text-zinc-500 mt-0.5">키워드·LLM 질문 매핑 완료</div>
            </div>
          </div>
        </div>
      </Card>

      {/* Two-column: Keywords + GEO prompts */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-4">
        {/* SEO Keywords */}
        <Card className="p-4 sm:p-5 lg:col-span-3">
          <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
            <div>
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <Globe className="h-3.5 w-3.5 text-indigo-500" /> SEO 키워드 — Naver · Google
              </h3>
              <p className="text-[11px] text-zinc-500 mt-0.5">월 검색량 · 난이도 · 의도 · 전월 대비</p>
            </div>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="키워드 검색"
                className="pl-7 pr-2 py-1.5 h-8 text-[12px] rounded-md border border-zinc-200 dark:border-zinc-800 bg-transparent w-44 focus:outline-none focus:ring-1 focus:ring-zinc-400"
              />
            </div>
          </div>
          <div className="overflow-x-auto -mx-1">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-widest text-zinc-400 border-b border-zinc-100 dark:border-zinc-800">
                  <th className="font-semibold py-2 pl-1">키워드</th>
                  <th className="font-semibold py-2 text-right tabular-nums">월 검색</th>
                  <th className="font-semibold py-2 text-right">난이도</th>
                  <th className="font-semibold py-2 text-right">의도</th>
                  <th className="font-semibold py-2 text-right">엔진</th>
                  <th className="font-semibold py-2 pr-1 text-right">전월</th>
                </tr>
              </thead>
              <tbody>
                {filteredKeywords.map((k) => (
                  <tr
                    key={k.word}
                    className="border-b border-zinc-100 dark:border-zinc-900 last:border-0 hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition-colors"
                  >
                    <td className="py-2.5 pl-1 font-medium">{k.word}</td>
                    <td className="py-2.5 text-right tabular-nums text-zinc-600 dark:text-zinc-400">
                      {k.volume.toLocaleString()}
                    </td>
                    <td className={cn("py-2.5 text-right text-[11px] font-semibold", DIFF_COLOR[k.difficulty])}>
                      {DIFF_LABEL[k.difficulty]}
                    </td>
                    <td className="py-2.5 text-right text-zinc-500">{INTENT_LABEL[k.intent]}</td>
                    <td className="py-2.5 text-right text-[10px] text-zinc-500 uppercase tracking-wider">
                      {CHANNEL_LABEL[k.channel]}
                    </td>
                    <td className="py-2.5 pr-1 text-right tabular-nums text-emerald-600 dark:text-emerald-400 font-semibold">
                      {k.delta}
                    </td>
                  </tr>
                ))}
                {filteredKeywords.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-[12px] text-zinc-500">
                      "{query}" 일치하는 키워드 없음
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* GEO Prompts */}
        <Card className="p-4 sm:p-5 lg:col-span-2">
          <div className="mb-3">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Bot className="h-3.5 w-3.5 text-emerald-500" /> AI 인용 가능한 질문 패턴
            </h3>
            <p className="text-[11px] text-zinc-500 mt-0.5">
              ChatGPT · Perplexity · Gemini · Naver Cue 에서 사용자가 묻는 실제 질문
            </p>
          </div>
          <ul className="space-y-2.5">
            {data.geoPrompts.map((p, i) => (
              <li
                key={i}
                className="rounded-lg border border-zinc-100 dark:border-zinc-800 p-3 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors"
              >
                <p className="text-[12.5px] leading-snug font-medium">"{p.question}"</p>
                <div className="mt-2 flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex flex-wrap gap-1">
                    {p.engines.map((e) => (
                      <span
                        key={e}
                        className={cn("text-[10px] px-1.5 py-0.5 rounded font-semibold", ENGINE_META[e].color)}
                      >
                        {ENGINE_META[e].label}
                      </span>
                    ))}
                  </div>
                  <div className="text-[10px] text-zinc-500 tabular-nums">
                    {p.monthlyAskVolume} ·{" "}
                    <span
                      className={cn(
                        "font-semibold",
                        p.citationChance >= 50
                          ? "text-emerald-600 dark:text-emerald-400"
                          : p.citationChance >= 25
                            ? "text-amber-600 dark:text-amber-400"
                            : "text-rose-600 dark:text-rose-400",
                      )}
                    >
                      인용률 {p.citationChance}%
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* Content recommendations */}
      <Card className="p-4 sm:p-5 mb-4">
        <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
          <div>
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Wand2 className="h-3.5 w-3.5 text-violet-500" /> 추천 콘텐츠 — SEO + GEO 동시 최적화
            </h3>
            <p className="text-[11px] text-zinc-500 mt-0.5">
              우선순위 = SEO 점수 + GEO 점수 + 시즌 가중치 · 효율 우선 정렬
            </p>
          </div>
          <Badge tone="emerald">{data.contentIdeas.length}편 대기</Badge>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {data.contentIdeas.map((c, i) => {
            const isActive = c.id === activeIdea;
            return (
              <motion.button
                key={c.id}
                onClick={() => setActiveIdea(c.id)}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className={cn(
                  "group text-left rounded-xl border bg-white dark:bg-zinc-950 overflow-hidden transition-all",
                  isActive
                    ? "border-zinc-900 dark:border-zinc-100 shadow-[0_8px_24px_-12px_rgba(0,0,0,0.18)] -translate-y-0.5"
                    : "border-zinc-100 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700",
                )}
              >
                <DiscoverCardVisual rec={c} industry={brand.industry} />
                <div className="p-3.5">
                  <div className="font-semibold text-[13.5px] leading-snug tracking-tight line-clamp-2">{c.title}</div>
                  <div className="mt-1 text-[11.5px] text-zinc-500 leading-relaxed line-clamp-2">{c.hook}</div>
                  <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                    {c.targetKeywords.slice(0, 2).map((k) => (
                      <span
                        key={k}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400"
                      >
                        {k}
                      </span>
                    ))}
                  </div>
                  <div className="mt-2.5 flex items-center justify-between">
                    <span className="text-[10.5px] text-zinc-500 tabular-nums">{c.estimatedReach}</span>
                    <span className="text-[11px] inline-flex items-center gap-0.5 text-zinc-900 dark:text-zinc-100 font-medium group-hover:gap-1 transition-all">
                      선택 <ArrowUpRight className="h-3 w-3" />
                    </span>
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>
      </Card>

      {/* Active idea detail */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <Card className="p-5 lg:col-span-3">
          <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
            <div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-zinc-400 font-semibold">
                선택한 콘텐츠
              </div>
              <h3 className="text-base font-semibold mt-1.5 leading-tight">{active.title}</h3>
            </div>
            <Button onClick={() => generate(active)} size="sm">
              <Wand2 className="h-3.5 w-3.5" /> 이 콘텐츠 생성
            </Button>
          </div>
          <p className="text-[13px] text-zinc-600 dark:text-zinc-400 leading-relaxed">{active.hook}</p>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-zinc-50 dark:bg-zinc-900/50 p-3.5">
              <div className="text-[10px] uppercase tracking-widest text-zinc-400 font-semibold">SEO 점수</div>
              <div className="mt-1 text-2xl font-semibold tabular-nums">{active.seoScore}</div>
              <div className="text-[10.5px] text-zinc-500 mt-0.5">검색엔진 노출 가능성</div>
            </div>
            <div className="rounded-lg bg-emerald-50 dark:bg-emerald-500/10 p-3.5">
              <div className="text-[10px] uppercase tracking-widest text-emerald-600/80 dark:text-emerald-400/80 font-semibold">GEO 점수</div>
              <div className="mt-1 text-2xl font-semibold tabular-nums text-emerald-700 dark:text-emerald-300">{active.geoScore}</div>
              <div className="text-[10.5px] text-emerald-700/70 dark:text-emerald-300/70 mt-0.5">LLM 답변 인용 가능성</div>
            </div>
          </div>

          <div className="mt-4">
            <div className="text-[10px] uppercase tracking-widest text-zinc-400 font-semibold mb-2">타겟 키워드</div>
            <div className="flex flex-wrap gap-1.5">
              {active.targetKeywords.map((k) => (
                <Badge key={k} tone="default">{k}</Badge>
              ))}
            </div>
          </div>

          {active.targetPrompts.length > 0 && (
            <div className="mt-3.5">
              <div className="text-[10px] uppercase tracking-widest text-zinc-400 font-semibold mb-2">타겟 AI 질문</div>
              <ul className="space-y-1.5">
                {active.targetPrompts.map((p, i) => (
                  <li
                    key={i}
                    className="text-[12px] italic text-zinc-600 dark:text-zinc-400 leading-snug pl-3 border-l-2 border-emerald-300/60"
                  >
                    "{p}"
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Card>

        <Card className="p-5 lg:col-span-2">
          <div className="mb-3">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 text-violet-500" /> 노출 미리보기
            </h3>
            <p className="text-[11.5px] text-zinc-500 mt-1 leading-relaxed">
              이 콘텐츠를 생성하면 검색 결과·AI 답변에 이렇게 노출됩니다
            </p>
          </div>

          <SearchSnippetPreview active={active} brand={brand} />

          <div className="mt-3">
            <AiCitationPreview active={active} brand={brand} />
          </div>

          <p className="mt-3 text-[10.5px] text-zinc-400 leading-relaxed">
            * 실제 노출은 검색엔진·AI 모델의 인덱싱·랭킹에 따라 달라집니다.
            기술 설정 (Schema.org, 메타 태그)은 콘텐츠 생성 시 자동 적용됩니다.
          </p>
        </Card>
      </div>
    </div>
  );
}

// ───────── 검색 결과 리치 스니펫 미리보기 (스키마 타입별) ─────────
function SearchSnippetPreview({
  active,
  brand,
}: {
  active: ContentRecommendation;
  brand: { name: string; city: string; industryLabel: string; saveRate: number };
}) {
  const url = `${brand.name.toLowerCase().replace(/\s/g, "")}.kr`;

  return (
    <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-hidden">
      <div className="px-3.5 pt-3 pb-2 border-b border-zinc-100 dark:border-zinc-900 flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-[0.16em] text-zinc-400 font-semibold">
          Naver · Google 검색 결과
        </span>
        <span className="text-[10px] text-zinc-400">{active.schema}</span>
      </div>
      <div className="p-3.5">
        <div className="text-[11px] text-zinc-500 flex items-center gap-1">
          <span className="h-3.5 w-3.5 rounded-full bg-gradient-to-br from-indigo-500 to-pink-500 inline-block" />
          {url} <span className="text-zinc-400">›</span>{" "}
          <span className="text-zinc-400">{active.formatLabel}</span>
        </div>
        <h4 className="mt-1 text-[14px] font-medium text-indigo-700 dark:text-indigo-400 hover:underline cursor-pointer leading-snug">
          {active.title}
        </h4>

        {/* LocalBusiness — Google 비즈니스 카드 스타일 */}
        {active.schema === "LocalBusiness" && (
          <div className="mt-1.5">
            <div className="flex items-center gap-1 text-[11.5px] text-zinc-700 dark:text-zinc-300">
              <span className="text-amber-500 flex items-center gap-0.5">
                <Star className="h-3 w-3 fill-current" />
                <span className="font-semibold tabular-nums">4.7</span>
              </span>
              <span className="text-zinc-400">(182)</span>
              <span className="text-zinc-300 mx-1">·</span>
              <span>{brand.industryLabel}</span>
              <span className="text-zinc-300 mx-1">·</span>
              <span>₩₩</span>
            </div>
            <div className="mt-1 text-[11.5px] text-zinc-600 dark:text-zinc-400 flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-0.5">
                <MapPin className="h-2.5 w-2.5" /> {brand.city}
              </span>
              <span className="inline-flex items-center gap-0.5">
                <Phone className="h-2.5 w-2.5" /> 02-XXX-XXXX
              </span>
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">· 오늘 영업 중</span>
            </div>
          </div>
        )}

        {/* FAQPage — 인라인 FAQ 펼침 */}
        {active.schema === "FAQPage" && (
          <ul className="mt-2 space-y-1.5">
            {[
              "예약은 어떻게 하나요?",
              "주차가 가능한가요?",
              "단체 룸이 있나요?",
            ].map((q) => (
              <li
                key={q}
                className="text-[12px] text-zinc-700 dark:text-zinc-300 border-l-2 border-zinc-200 dark:border-zinc-700 pl-2.5 leading-snug"
              >
                {q}
              </li>
            ))}
          </ul>
        )}

        {/* HowTo — 단계 미리보기 */}
        {active.schema === "HowTo" && (
          <ol className="mt-2 space-y-1 text-[12px] text-zinc-700 dark:text-zinc-300">
            <li className="flex gap-1.5"><span className="text-zinc-400 tabular-nums">1.</span> 준비 단계</li>
            <li className="flex gap-1.5"><span className="text-zinc-400 tabular-nums">2.</span> 핵심 과정</li>
            <li className="flex gap-1.5"><span className="text-zinc-400 tabular-nums">3.</span> 마무리</li>
          </ol>
        )}

        {/* Review — 별점 + 인용 */}
        {active.schema === "Review" && (
          <div className="mt-2">
            <div className="text-amber-500 text-[11px] flex items-center gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="h-3 w-3 fill-current" />
              ))}
              <span className="ml-1 text-zinc-500 tabular-nums">4.7 / 5</span>
            </div>
            <p className="mt-1 text-[12px] italic text-zinc-600 dark:text-zinc-400 leading-snug">
              "정성이 그릇마다 보여요. 단골 됐어요."
            </p>
          </div>
        )}

        {/* Article — 메타 + 본문 발췌 */}
        {active.schema === "Article" && (
          <div className="mt-1.5">
            <p className="text-[11.5px] text-zinc-500">
              {brand.name} · {new Date().toLocaleDateString("ko-KR", { month: "long", day: "numeric" })}
            </p>
            <p className="mt-1 text-[12px] text-zinc-600 dark:text-zinc-400 leading-snug line-clamp-2">
              {active.hook} — {active.targetKeywords[0]} 관련 핵심 포인트와 우리 매장의 차별점을 정리했습니다.
            </p>
          </div>
        )}

        {/* Recipe (fallback) */}
        {active.schema === "Recipe" && (
          <p className="mt-1 text-[12px] text-zinc-600 dark:text-zinc-400 leading-snug">
            ⏱ 30분 · 🍽 2인분 · 시즌 한정 레시피
          </p>
        )}
      </div>
    </div>
  );
}

// ───────── AI 답변 인용 미리보기 (Perplexity 스타일) ─────────
function AiCitationPreview({
  active,
  brand,
}: {
  active: ContentRecommendation;
  brand: { name: string; city: string; industryLabel: string };
}) {
  const prompt =
    active.targetPrompts[0] ??
    `${brand.city}에서 ${brand.industryLabel} 추천해 줘`;

  return (
    <div className="rounded-lg border border-emerald-200/60 dark:border-emerald-800/40 bg-emerald-50/40 dark:bg-emerald-500/[0.04] overflow-hidden">
      <div className="px-3.5 pt-3 pb-2 border-b border-emerald-100 dark:border-emerald-900/50 flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-[0.16em] text-emerald-700 dark:text-emerald-400 font-semibold inline-flex items-center gap-1">
          <Bot className="h-3 w-3" /> ChatGPT · Perplexity 답변
        </span>
        <span className="text-[10px] text-emerald-700/70 dark:text-emerald-400/70">
          인용 확률 {active.geoScore}%
        </span>
      </div>
      <div className="p-3.5">
        <p className="text-[11.5px] text-zinc-500 italic mb-2">"{prompt}"</p>
        <div className="text-[12.5px] text-zinc-700 dark:text-zinc-300 leading-relaxed">
          <Quote className="h-3 w-3 inline -translate-y-0.5 text-emerald-500/60 mr-1" />
          {brand.city} 지역에서는{" "}
          <span className="bg-emerald-200/50 dark:bg-emerald-500/20 px-1 rounded font-semibold text-emerald-800 dark:text-emerald-300">
            {brand.name}
          </span>
          <sup className="text-emerald-600 dark:text-emerald-400 ml-0.5">¹</sup>이 추천됩니다. {active.hook.split("—")[0].trim() || active.targetKeywords[0]}로 잘 알려져 있으며…
        </div>
        <div className="mt-2.5 pt-2 border-t border-emerald-100/70 dark:border-emerald-900/40 text-[10.5px] text-zinc-500 leading-relaxed">
          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">¹</span>{" "}
          {brand.name.toLowerCase().replace(/\s/g, "")}.kr ·{" "}
          <span className="text-zinc-400">{active.title}</span>
        </div>
      </div>
    </div>
  );
}

// 추천 콘텐츠 카드 비주얼 — Pexels 영상 자동 매칭
// 업종 + 첫 키워드로 쿼리 구성 → 시네마틱 톤 영상 fetch
const INDUSTRY_VISUAL_HINTS: Record<string, string> = {
  restaurant: "cinematic korean cuisine plating editorial moody",
  cafe: "specialty coffee pour minimal cinematic editorial",
  dessert: "patisserie dessert closeup editorial soft light",
  stay: "warm interior soft morning light still editorial",
  beauty: "hair salon cinematic editorial muted slow",
  local: "fashion editorial minimal neutral palette still",
};

function DiscoverCardVisual({ rec, industry }: { rec: ContentRecommendation; industry: string }) {
  const [video, setVideo] = React.useState<{ url: string; poster: string } | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [hovered, setHovered] = React.useState(false);
  const videoRef = React.useRef<HTMLVideoElement | null>(null);

  // 쿼리: 업종 시각 힌트
  const query = React.useMemo(() => {
    const hint = INDUSTRY_VISUAL_HINTS[industry] ?? INDUSTRY_VISUAL_HINTS.restaurant;
    return hint;
  }, [industry]);

  // 30분 시간 버킷 — 같은 시간대에서는 동일 영상 (캐싱), 30분 지나면 자동 회전
  const [timeBucket, setTimeBucket] = React.useState(0);
  React.useEffect(() => {
    setTimeBucket(Math.floor(Date.now() / (30 * 60 * 1000)));
  }, []);

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setVideo(null);
    // rec.id 해시 (카드별 분산) + 시간 버킷 (시간별 회전)
    const hash = rec.id.split("").reduce((s, c) => s + c.charCodeAt(0), 0);
    const pickIndex = (hash + timeBucket) % 25;
    (async () => {
      try {
        const res = await fetch("/api/search-pexels-video", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query,
            orientation: "landscape",
            perPage: 30,
            pickIndex,
          }),
        });
        const data = await res.json();
        if (!cancelled && data?.ok && data.video?.url) {
          setVideo({ url: data.video.url, poster: data.video.poster });
        }
      } catch {
        // 무시 — 그라디언트 fallback
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [rec.id, query, timeBucket]);

  React.useEffect(() => {
    const el = videoRef.current;
    if (!el || !video) return;
    if (hovered) {
      el.play().catch(() => {});
    } else {
      el.pause();
      try {
        el.currentTime = 0;
      } catch {
        // 무시
      }
    }
  }, [hovered, video]);

  return (
    <div
      className={cn("relative aspect-[16/9] bg-gradient-to-br overflow-hidden", rec.gradient)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* 실제 Pexels 영상 — 로드되면 노출 */}
      {video && (
        <video
          ref={videoRef}
          src={video.url}
          poster={video.poster}
          muted
          loop
          playsInline
          preload="metadata"
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}

      {/* 로딩 */}
      {loading && (
        <div className="absolute inset-0 grid place-items-center bg-black/15">
          <Loader2 className="h-4 w-4 text-white animate-spin" />
        </div>
      )}

      {/* 가독성 */}
      <div className="absolute inset-0 pointer-events-none" style={{ boxShadow: "inset 0 0 60px rgba(0,0,0,0.18)" }} />
      <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/55 to-transparent pointer-events-none" />
      <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/65 to-transparent pointer-events-none" />

      {/* Play 아이콘 — hover 전에만 */}
      {video && !hovered && (
        <div className="absolute inset-0 grid place-items-center pointer-events-none">
          <div className="h-9 w-9 rounded-full bg-white/85 backdrop-blur grid place-items-center shadow-lg">
            <Play className="h-4 w-4 text-zinc-900 fill-current ml-0.5" strokeWidth={0} />
          </div>
        </div>
      )}

      {/* 오버레이 — formatLabel 좌상 / schema 우상 / 점수 좌하 / effort 우하 */}
      <span className="absolute top-2.5 left-2.5 text-[10px] uppercase tracking-[0.16em] text-white/95 font-semibold bg-black/45 backdrop-blur-sm px-2 py-0.5 rounded">
        {rec.formatLabel}
      </span>
      <span className="absolute top-2.5 right-2.5 text-[10px] uppercase tracking-[0.14em] text-white/95 font-semibold bg-black/45 backdrop-blur-sm px-2 py-0.5 rounded">
        {rec.schema}
      </span>
      <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-end justify-between gap-2">
        <div className="flex gap-1.5">
          <span className="text-[10px] bg-white/95 text-zinc-900 px-1.5 py-0.5 rounded font-semibold tabular-nums">
            SEO {rec.seoScore}
          </span>
          <span className="text-[10px] bg-emerald-500/95 text-white px-1.5 py-0.5 rounded font-semibold tabular-nums">
            GEO {rec.geoScore}
          </span>
        </div>
        <span className="text-[10px] bg-black/45 backdrop-blur-sm text-white/95 px-1.5 py-0.5 rounded font-semibold">
          {EFFORT_LABEL[rec.effort]}
        </span>
      </div>
    </div>
  );
}
