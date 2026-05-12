"use client";

import * as React from "react";
import { motion } from "motion/react";
import { Sparkles, Loader2, Copy, Check, FileText, MapPin, Image as ImageIcon, Wand2, Search, TrendingUp, X, FlaskConical, Info, ExternalLink } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useBrand } from "@/components/brand/BrandProvider";
import { useToast } from "@/components/ui/toast";
import { getBrandDetail } from "@/lib/dummy/brand-detail";
import { cn } from "@/lib/utils";
import { useAutoSaveDraft, formatSavedAt } from "@/lib/drafts/auto-save";
import { SAMPLE_REAL_BRANDS, type SampleRealBrand } from "@/lib/dummy/sample-real-brands";

// 업종별 네이버 블로그 SEO 후보 (사장님이 빠르게 선택)
const TOPIC_PRESETS: Record<string, { title: string; keywords: string[]; intent: string }[]> = {
  restaurant: [
    { title: "어버이날 한정식 예약 가이드 — 강남 상견례 룸 추천", keywords: ["강남 한정식", "어버이날 한정식 강남", "상견례 한정식"], intent: "5월 전환" },
    { title: "5월 봄나물 코스 — 양평 시장 재료 한 상", keywords: ["5월 봄정식 코스", "양평 시장 한식"], intent: "시즌 정보" },
    { title: "한정식 1인 가격대별 추천 (3만~7만원)", keywords: ["한정식 1인 가격", "강남 한정식 추천"], intent: "비교/리뷰" },
  ],
  cafe: [
    { title: "콜드브루 6시간 추출 비율 — 집에서 따라하는 법", keywords: ["콜드브루 추출법", "콜드브루"], intent: "HowTo 정보" },
    { title: "에티오피아 예가체프 G1 — 우리가 고른 농장", keywords: ["예가체프 원두 추천", "스페셜티 원두"], intent: "산지 스토리" },
    { title: "서촌 노트북 작업 카페 5곳 (콘센트·와이파이)", keywords: ["서촌 작업 카페", "서촌 카페"], intent: "지역 비교" },
  ],
  dessert: [
    { title: "수박 케이크 — 7월 한정 농장 직거래 한 통", keywords: ["수박 케이크", "성수 디저트"], intent: "시즌 한정" },
    { title: "비건 케이크 5곳 — 가격·맛·알러지 비교", keywords: ["비건 케이크 서울", "여름 디저트 추천"], intent: "비교" },
    { title: "여름 디저트 BEST 7 — 시원함·당도·칼로리", keywords: ["여름 디저트 추천"], intent: "시즌 가이드" },
  ],
  stay: [
    { title: "어버이날 한옥 1박 2일 — 60대 부모님 코스", keywords: ["어버이날 숙소", "효도 패키지 숙박"], intent: "효도 패키지" },
    { title: "북촌 5월 산책 코스 — 도보 10분 동선", keywords: ["북촌 산책 코스", "북촌 한옥스테이"], intent: "동네 가이드" },
    { title: "객실 4채 비교 — 마루·창호·온돌 디테일", keywords: ["서울 전통 숙소"], intent: "객실 비교" },
  ],
  beauty: [
    { title: "장마철 헤어 5단계 케어 루틴", keywords: ["장마철 헤어 관리", "결 살리는 케어"], intent: "시즌 HowTo" },
    { title: "2026 S/S 헤어 컬러 8가지 — 톤 매칭 차트", keywords: ["5월 봄 컬러 헤어"], intent: "트렌드" },
    { title: "수국축제 데이트 컬러 — 우리가 픽한 5가지", keywords: ["수국축제 헤어 컬러"], intent: "이벤트 매칭" },
  ],
  local: [
    { title: "S/S 26 트렌드 7 — 컬러·실루엣·소재", keywords: ["S/S 26 룩북", "컨템포러리 패션"], intent: "트렌드 리포트" },
    { title: "Wool × Linen — 우리가 선택한 한 mill", keywords: ["wool linen 블렌드"], intent: "원단 스토리" },
    { title: "한국 컨템포러리 5 — 가격대·소재·핏", keywords: ["한국 디자이너 브랜드"], intent: "브랜드 비교" },
  ],
};

// 업종별 본문 톤
const BODY_TONE: Record<string, string> = {
  restaurant: "단정한 존댓말 · 재료의 시간 · 산지 디테일",
  cafe: "한 잔의 리듬 · 산미 · 무드 묘사",
  dessert: "친근한 반말 · 한 입의 감각 · 색감",
  stay: "편지 형식 · 공간의 빛 · 손님 호칭 '머무시는 분'",
  beauty: "자신감 있는 존댓말 · 단계별 · 결과 강조",
  local: "절제된 영문 + 한국어 혼용 · 원단·실루엣",
};

export function BlogScreen() {
  const { brand, userBrand } = useBrand();
  const isUserBrand = !!userBrand && brand.id === userBrand.id;
  const toast = useToast();
  const detail = getBrandDetail(brand.id);
  const presets = TOPIC_PRESETS[brand.industry] ?? TOPIC_PRESETS.restaurant;
  const tone = BODY_TONE[brand.industry] ?? BODY_TONE.restaurant;

  const [activePreset, setActivePreset] = React.useState(0);
  const [topic, setTopic] = React.useState(presets[0]?.title ?? "");
  const [body, setBody] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  // SERP 분석 결과 + 진행 상태
  type SerpPost = { rank: number; title: string; bloggerName: string; postDate: string; snippet: string; blogUrl: string };
  type SerpResult = {
    keyword: string;
    posts: SerpPost[];
    avgTitleLen: number;
    avgSnippetLen: number;
    estimatedBodyChars: { min: number; recommended: number; max: number };
    commonTerms: { term: string; count: number }[];
    titlePatterns: string[];
    demoMode: boolean;
  };
  const [serp, setSerp] = React.useState<SerpResult | null>(null);
  const [analyzing, setAnalyzing] = React.useState(false);
  const [phase, setPhase] = React.useState<"idle" | "analyzing" | "generating">("idle");

  // 샘플 검증 모드 — 실제 운영 가게 공개 자료로 본문 검증
  const [sampleBrand, setSampleBrand] = React.useState<SampleRealBrand | null>(null);
  const applySample = (b: SampleRealBrand) => {
    setSampleBrand(b);
    setTopic(b.suggestedTopic);
    setBody("");
    setSerp(null);
    toast.info(`샘플 검증: ${b.name} · 공개 자료 기반 — 생성 결과는 발행물 아님`);
  };
  const clearSample = () => {
    setSampleBrand(null);
    toast.info("샘플 검증 모드 해제 — 활성 브랜드로 복귀");
  };

  // 자동 저장 — 새로고침/탭 닫기에도 작업 복원
  const { lastSavedAt } = useAutoSaveDraft({
    scope: "blog",
    brandId: brand.id,
    value: { topic, body, activePreset },
    onRestore: (draft) => {
      if (typeof draft.topic === "string") setTopic(draft.topic);
      if (typeof draft.body === "string") setBody(draft.body);
      if (typeof draft.activePreset === "number") setActivePreset(draft.activePreset);
    },
  });

  React.useEffect(() => {
    setActivePreset(0);
    setTopic(presets[0]?.title ?? "");
    setBody("");
  }, [brand.id, presets]);

  // 1) 키워드 분석 — 상위 노출 글 패턴 추출
  const analyzeKeyword = async (rawKeyword?: string): Promise<SerpResult | null> => {
    const preset = presets[activePreset];
    const sampleKeyword = sampleBrand?.suggestedKeywords?.[0];
    const keyword = (rawKeyword ?? sampleKeyword ?? preset?.keywords?.[0] ?? topic).trim();
    if (!keyword) {
      toast.warn("분석할 키워드가 없습니다");
      return null;
    }
    setAnalyzing(true);
    setPhase("analyzing");
    try {
      const res = await fetch("/api/analyze-naver-blogs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword }),
      });
      const data = await res.json();
      if (!data?.ok) {
        toast.warn(`상위 글 분석 실패: ${data?.error ?? "알 수 없음"}`);
        return null;
      }
      const result: SerpResult = {
        keyword: data.analysis?.keyword ?? keyword,
        posts: data.posts ?? [],
        avgTitleLen: data.analysis?.avgTitleLen ?? 0,
        avgSnippetLen: data.analysis?.avgSnippetLen ?? 0,
        estimatedBodyChars: data.analysis?.estimatedBodyChars ?? { min: 1500, recommended: 1800, max: 2400 },
        commonTerms: data.analysis?.commonTerms ?? [],
        titlePatterns: data.analysis?.titlePatterns ?? [],
        demoMode: !!data.demoMode,
      };
      setSerp(result);
      const demoNote = result.demoMode ? " (데모 — NAVER API 키 미설정)" : "";
      toast.success(`"${keyword}" 상위 ${result.posts.length}개 글 분석 완료${demoNote}`);
      return result;
    } catch (e) {
      toast.warn(`상위 글 분석 오류: ${(e as Error).message}`);
      return null;
    } finally {
      setAnalyzing(false);
    }
  };

  // 2) 본문 생성 — 분석 결과를 전달 (없으면 그냥 생성)
  const generateBody = async (analysisOverride?: SerpResult | null) => {
    if (!topic.trim()) {
      toast.warn("주제를 입력하거나 추천 카드를 선택해 주세요");
      return;
    }
    if (loading) return;
    setLoading(true);
    setPhase("generating");
    try {
      const preset = presets[activePreset];
      const keywords = sampleBrand?.suggestedKeywords ?? preset?.keywords ?? [];
      const userMenu = isUserBrand && userBrand?.signatureMenu
        ? userBrand.signatureMenu.filter(Boolean)
        : [];
      const userTagline = isUserBrand && userBrand?.tagline ? userBrand.tagline : "";
      const analysisToSend = analysisOverride ?? serp;

      // 샘플 검증 모드 활성화 시 → 샘플 가게 정보를 우선 사용
      const ctxBrandName = sampleBrand?.name ?? brand.name;
      const ctxIndustry = sampleBrand?.industryLabel ?? brand.industryLabel;
      const ctxLocation = sampleBrand
        ? `${sampleBrand.city} ${sampleBrand.district}`
        : brand.city;
      const ctxTagline = sampleBrand?.tagline ?? userTagline;
      const ctxSignature = sampleBrand?.signatureMenu.join(", ") ?? userMenu.join(", ");

      const res = await fetch("/api/generate-blog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brand: ctxBrandName,
          industry: ctxIndustry,
          location: ctxLocation,
          topic,
          tagline: ctxTagline,
          signatureMenu: ctxSignature,
          keywords: keywords.join(", "),
          tone: `${tone}${detail?.toneSummary ? ` · ${detail.toneSummary}` : ""}`,
          forbidden: "100% 보장, 무조건, 만병통치, 완치, 부작용 없음, 최고, 대박, JMT",
          // 샘플 검증 시: 가게에 대해 확정된 공개 사실 — 이 외엔 추정 금지
          knownFacts: sampleBrand?.knownFacts ?? undefined,
          // targetChars 는 생략 — analysis 가 있으면 서버가 추정 분량 자동 채택
          serpAnalysis: analysisToSend
            ? {
                keyword: analysisToSend.keyword,
                avgTitleLen: analysisToSend.avgTitleLen,
                avgSnippetLen: analysisToSend.avgSnippetLen,
                estimatedBodyChars: analysisToSend.estimatedBodyChars,
                commonTerms: analysisToSend.commonTerms,
                titlePatterns: analysisToSend.titlePatterns,
                posts: analysisToSend.posts.slice(0, 5).map((p) => ({
                  rank: p.rank,
                  title: p.title,
                  snippet: p.snippet,
                })),
              }
            : undefined,
        }),
      });
      const data = await res.json();
      if (!data.ok) {
        toast.warn(`본문 생성 실패: ${data.error ?? "알 수 없음"} — 폴백 템플릿 사용`);
        const draft = buildDraft({
          topic,
          brandName: brand.name,
          city: brand.city,
          industryLabel: brand.industryLabel,
          keywords,
          tone,
          toneSummary: detail?.toneSummary ?? "",
        });
        setBody(draft);
        return;
      }
      const fullBody = (data.body as string | undefined)?.trim() ?? "";
      if (!fullBody) {
        toast.warn("본문 결과가 비었어요 — 다시 시도");
        return;
      }
      setBody(fullBody);
      const cost = data.meta?.costKrw ?? 0;
      const chars = data.meta?.charCount ?? fullBody.replace(/\s+/g, "").length;
      const demo = data.meta?.demoMode ? " (데모)" : "";
      const expanded = data.meta?.expandedOnce ? " · 자동 확장 1회" : "";
      const serpUsed = analysisToSend ? " · 상위 글 분석 반영" : "";
      toast.success(`본문 ${chars}자 생성${expanded}${serpUsed}${cost ? ` · ₩${cost}` : ""}${demo}`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      toast.warn(`본문 생성 오류: ${msg}`);
    } finally {
      setLoading(false);
      setPhase("idle");
    }
  };

  // 통합 핸들러 — "분석 후 본문 생성" 1클릭
  const analyzeAndGenerate = async () => {
    const sampleKw = sampleBrand?.suggestedKeywords?.[0];
    const preset = presets[activePreset];
    const result = await analyzeKeyword(sampleKw ?? preset?.keywords?.[0]);
    await generateBody(result);
  };

  // 분석 없이 바로 본문만 — 기존 흐름 유지
  const generate = () => generateBody();

  const copyAll = async () => {
    if (!body) return;
    try {
      await navigator.clipboard.writeText(`${topic}\n\n${body}`);
      setCopied(true);
      toast.success("제목 + 본문 복사됨");
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.warn("복사 실패");
    }
  };

  const wordCount = body.replace(/\s+/g, "").length;
  const seoTarget = 1500;
  const seoPct = Math.min(100, Math.round((wordCount / seoTarget) * 100));

  return (
    <div className="px-4 sm:px-6 py-4 sm:py-6">
      {/* Header */}
      <div className="flex items-end justify-between gap-4 flex-wrap mb-5">
        <div className="min-w-0">
          <div className="text-[10px] sm:text-[11px] uppercase tracking-[0.15em] text-emerald-600 dark:text-emerald-400 font-semibold">
            NAVER BLOG STUDIO · {sampleBrand ? sampleBrand.name : brand.name}
          </div>
          <h1 className="mt-2 text-[22px] sm:text-2xl md:text-3xl font-semibold tracking-tight leading-[1.15]">
            네이버 블로그 본문 자동 작성
          </h1>
          <p className="mt-1.5 text-[13px] sm:text-sm text-zinc-500 max-w-2xl leading-relaxed">
            한국 SEO 핵심 채널 · 본문 1500자+, 자연스러운 키워드 분포, 우리 톤 유지
          </p>
        </div>
      </div>

      {/* 샘플 검증 모드 — 실제 운영 가게 공개 자료로 본문 검증 */}
      <Card className={cn(
        "p-4 mb-4 transition-colors",
        sampleBrand
          ? "border-amber-300 dark:border-amber-700 bg-amber-50/60 dark:bg-amber-500/5"
          : "border-zinc-200 dark:border-zinc-800",
      )}>
        <div className="flex items-start justify-between gap-3 flex-wrap mb-3">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <FlaskConical className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
              <span className="text-[11px] uppercase tracking-wider font-semibold text-amber-700 dark:text-amber-300">
                샘플 검증 모드 (실제 운영 가게)
              </span>
              {sampleBrand && (
                <Badge tone="amber">{sampleBrand.name}</Badge>
              )}
            </div>
            <p className="text-[12px] text-zinc-600 dark:text-zinc-400 mt-1">
              공개 자료로 알려진 실제 가게 정보를 입력해 본문이 가게 사실과 일치하는지 직접 검증해 보세요.
              <b className="ml-1 text-amber-700 dark:text-amber-300">생성 결과는 발행물·가게 공식 자료 아닙니다.</b>
            </p>
          </div>
          {sampleBrand && (
            <button
              onClick={clearSample}
              className="text-[11px] inline-flex items-center gap-1 px-2 py-1 rounded-md border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-rose-600"
            >
              <X className="h-3 w-3" /> 해제
            </button>
          )}
        </div>

        {/* 샘플 픽커 — 5개 카드 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
          {SAMPLE_REAL_BRANDS.map((b) => {
            const active = sampleBrand?.id === b.id;
            return (
              <button
                key={b.id}
                onClick={() => applySample(b)}
                className={cn(
                  "rounded-lg border p-2.5 text-left transition-all",
                  active
                    ? "border-amber-500 bg-white dark:bg-zinc-950 shadow-sm"
                    : "border-zinc-200 dark:border-zinc-800 bg-white/40 dark:bg-zinc-950/40 hover:border-amber-400",
                )}
              >
                <div className="text-[10px] text-zinc-500 font-medium">
                  {b.industryLabel}
                </div>
                <div className="mt-0.5 text-[12px] font-semibold tracking-tight leading-tight line-clamp-2">
                  {b.name}
                </div>
                <div className="mt-1 text-[10px] text-zinc-500">
                  {b.city} · {b.district}
                </div>
              </button>
            );
          })}
        </div>

        {/* 활성 샘플의 검증용 사실 카드 — 본문이 이걸 지키는지 직접 비교 */}
        {sampleBrand && (
          <div className="mt-3 rounded-lg border border-amber-200 dark:border-amber-900/40 bg-white dark:bg-zinc-950 p-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <div className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">
                  검증 기준 — 가게 공개 사실
                </div>
                <ul className="mt-1.5 space-y-1">
                  {sampleBrand.knownFacts.map((f, i) => (
                    <li key={i} className="text-[11.5px] text-zinc-700 dark:text-zinc-300 leading-snug">
                      · {f}
                    </li>
                  ))}
                </ul>
                <div className="mt-2 text-[10px] text-zinc-500 inline-flex items-center gap-1">
                  <Info className="h-3 w-3" />
                  생성된 본문이 위 사실과 어긋나거나 가격·시간을 만들어내면 가드 실패.
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">
                  주입된 컨텍스트
                </div>
                <div className="mt-1.5 space-y-0.5 text-[11.5px] text-zinc-700 dark:text-zinc-300 leading-snug">
                  <div>상호: <b>{sampleBrand.name}</b></div>
                  <div>한 줄 소개: "{sampleBrand.tagline}"</div>
                  <div>대표 메뉴: {sampleBrand.signatureMenu.join(", ")}</div>
                  <div>분석 키워드: {sampleBrand.suggestedKeywords.join(", ")}</div>
                </div>
                <a
                  href="#"
                  onClick={(e) => e.preventDefault()}
                  className="mt-2 inline-flex items-center gap-1 text-[10px] text-zinc-500"
                  title={sampleBrand.publicSource}
                >
                  <ExternalLink className="h-3 w-3" />
                  출처: {sampleBrand.publicSource}
                </a>
              </div>
            </div>
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Left: Topic presets + input */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-violet-500" /> 추천 주제
              </h3>
              <Badge tone="default">{brand.industryLabel}</Badge>
            </div>
            <div className="space-y-2">
              {presets.map((p, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setActivePreset(i);
                    setTopic(p.title);
                  }}
                  className={cn(
                    "w-full text-left rounded-lg border p-3 transition-all",
                    activePreset === i
                      ? "border-zinc-900 dark:border-zinc-100 bg-zinc-50 dark:bg-zinc-900"
                      : "border-zinc-100 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700",
                  )}
                >
                  <div className="text-[12.5px] font-medium tracking-tight leading-snug">{p.title}</div>
                  <div className="mt-1.5 flex items-center gap-1 flex-wrap">
                    {p.keywords.slice(0, 2).map((k) => (
                      <span key={k} className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                        {k}
                      </span>
                    ))}
                    <span className="ml-auto text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                      {p.intent}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-zinc-500" /> 제목 (직접 수정)
            </h3>
            <textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              rows={2}
              placeholder="제목을 입력하거나 위 추천에서 선택"
              className="w-full text-[13px] px-3 py-2.5 rounded-md border border-zinc-200 dark:border-zinc-800 bg-transparent resize-none focus:outline-none focus:ring-1 focus:ring-zinc-400"
            />
            <div className="mt-3 text-[11px] text-zinc-500 space-y-1">
              <div>톤 가이드: <span className="text-zinc-700 dark:text-zinc-300">{tone}</span></div>
              <div>지역: <span className="text-zinc-700 dark:text-zinc-300">{brand.city}</span></div>
              <div>분석 키워드: <span className="text-violet-700 dark:text-violet-300 font-medium">{presets[activePreset]?.keywords?.[0] ?? topic}</span></div>
            </div>

            {/* 1순위 — 상위 글 분석 + 본문 생성 (권장) */}
            <Button
              onClick={analyzeAndGenerate}
              disabled={loading || analyzing}
              className="w-full mt-4"
            >
              {phase === "analyzing" ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  상위 글 분석 중...
                </>
              ) : phase === "generating" ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  본문 작성 중...
                </>
              ) : (
                <>
                  <TrendingUp className="h-3.5 w-3.5" />
                  상위 글 분석 + 본문 자동 생성
                </>
              )}
            </Button>

            {/* 2순위 — 분석 없이 바로 (기존 흐름) */}
            <button
              onClick={generate}
              disabled={loading || analyzing}
              className="w-full mt-2 text-[11px] text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 disabled:opacity-50"
            >
              분석 없이 바로 생성 →
            </button>
          </Card>

          {/* 상위 글 분석 결과 패널 */}
          {serp && (
            <Card className="p-4 border-violet-200 dark:border-violet-900/40">
              <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
                <div className="flex items-center gap-1.5 min-w-0">
                  <Search className="h-3.5 w-3.5 text-violet-500" />
                  <span className="text-xs font-semibold truncate">
                    "{serp.keyword}" 상위 글 분석
                  </span>
                  {serp.demoMode && <Badge tone="amber">데모</Badge>}
                </div>
                <button
                  onClick={() => setSerp(null)}
                  className="text-zinc-400 hover:text-rose-600"
                  aria-label="분석 결과 제거"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2 mb-3">
                <div className="rounded-md bg-zinc-50 dark:bg-zinc-900 px-2 py-1.5 text-center">
                  <div className="text-[9px] text-zinc-500">상위 글 수</div>
                  <div className="text-sm font-semibold">{serp.posts.length}</div>
                </div>
                <div className="rounded-md bg-zinc-50 dark:bg-zinc-900 px-2 py-1.5 text-center">
                  <div className="text-[9px] text-zinc-500">제목 평균</div>
                  <div className="text-sm font-semibold">{serp.avgTitleLen}자</div>
                </div>
                <div className="rounded-md bg-violet-50 dark:bg-violet-500/10 px-2 py-1.5 text-center">
                  <div className="text-[9px] text-violet-600 dark:text-violet-400">목표 분량</div>
                  <div className="text-sm font-semibold text-violet-700 dark:text-violet-300">
                    ~{serp.estimatedBodyChars.recommended}자
                  </div>
                </div>
              </div>

              {serp.commonTerms.length > 0 && (
                <div className="mb-3">
                  <div className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold mb-1">
                    공통 키워드 (LSI)
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {serp.commonTerms.slice(0, 8).map((t) => (
                      <span
                        key={t.term}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-300"
                      >
                        {t.term} <span className="text-violet-500/70">×{t.count}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {serp.titlePatterns.length > 0 && (
                <div className="mb-3">
                  <div className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold mb-1">
                    제목 패턴
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {serp.titlePatterns.map((p) => (
                      <span key={p} className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold mb-1">
                상위 5개 제목
              </div>
              <ol className="space-y-1">
                {serp.posts.slice(0, 5).map((p) => (
                  <li key={p.rank} className="text-[11px] leading-snug">
                    <a
                      href={p.blogUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-violet-700 dark:hover:text-violet-300 line-clamp-2"
                    >
                      <span className="text-zinc-400 tabular-nums mr-1">{p.rank}.</span>
                      {p.title}
                    </a>
                  </li>
                ))}
              </ol>

              <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800 text-[10px] text-zinc-500">
                이 분석을 시스템 프롬프트에 주입해 본문이 작성됩니다. 분량·LSI 키워드 자동 반영.
              </div>
            </Card>
          )}
        </div>

        {/* Right: Generated body */}
        <Card className="lg:col-span-3 p-5 flex flex-col min-h-[520px]">
          <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
            <h3 className="text-sm font-semibold flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-emerald-500" /> 본문 · Naver Blog
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-zinc-500 tabular-nums">
                {wordCount.toLocaleString()}자
                <span className="text-zinc-400 mx-1">·</span>
                SEO {seoPct}%
              </span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                ✓ {formatSavedAt(lastSavedAt)}
              </span>
              <button
                onClick={copyAll}
                disabled={!body}
                className="text-[11px] inline-flex items-center gap-1 px-2 py-1 rounded-md border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 disabled:opacity-40"
              >
                {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                {copied ? "복사됨" : "복사"}
              </button>
            </div>
          </div>

          {/* SEO 진행도 바 */}
          <div className="h-1 w-full bg-zinc-100 dark:bg-zinc-900 rounded-full overflow-hidden mb-3">
            <motion.div
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-500"
              animate={{ width: `${seoPct}%` }}
              transition={{ type: "spring", stiffness: 200, damping: 24 }}
            />
          </div>

          {body ? (
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="flex-1 w-full text-[13px] leading-[1.7] px-4 py-3 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 resize-none focus:outline-none focus:ring-1 focus:ring-zinc-400"
              style={{ fontFamily: '"Nanum Myeongjo", "Pretendard Variable", serif' }}
            />
          ) : (
            <div className="flex-1 grid place-items-center text-center text-zinc-400 text-[12.5px] border border-dashed border-zinc-200 dark:border-zinc-800 rounded-md p-8">
              <div>
                <ImageIcon className="h-6 w-6 mx-auto mb-2 opacity-50" />
                주제 선택 후 "본문 자동 생성"을 눌러주세요
                <div className="mt-1 text-[11px]">1500자+ Naver SEO 최적 본문이 생성됩니다</div>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

// 톤·키워드 기반 본문 시뮬레이션 (실서비스는 LLM 호출)
function buildDraft(args: {
  topic: string;
  brandName: string;
  city: string;
  industryLabel: string;
  keywords: string[];
  tone: string;
  toneSummary: string;
}): string {
  const { topic, brandName, city, industryLabel, keywords } = args;
  const k1 = keywords[0] ?? industryLabel;
  const k2 = keywords[1] ?? city;
  return `안녕하세요, ${brandName}입니다.

요즘 ${k1}을(를) 찾는 분들이 부쩍 늘었습니다. 단골 분들께서도 비슷한 질문을 많이 주시는데요, 오늘은 "${topic}"에 대해 ${brandName}이(가) 어떻게 준비하는지, 그리고 ${city} 지역에서 ${industryLabel}을(를) 고를 때 무엇을 보면 좋은지 차근차근 풀어보려 합니다.

1. ${k1} — 우리가 고집하는 이유

${brandName}이(가) ${k1}에 집중하는 데는 분명한 이유가 있습니다. 매주 같은 자리에서 같은 손길로 준비하지만, 계절마다 재료가 바뀌고, 그 변화가 한 그릇·한 잔에 자연스럽게 담깁니다. ${industryLabel}을(를) 오래 운영해 온 입장에서, 무엇보다 중요하게 여기는 부분은 결과가 아니라 과정입니다.

2. ${k2}와 함께 보면 좋은 것

${k2}을(를) 함께 찾으시는 분들에게는 한 가지를 더 권해 드립니다. 처음 오시는 분이라면 시즌 한정 메뉴를, 단골 분이라면 우리가 새로 도입한 ${industryLabel} 변형을 추천합니다. 두 가지 모두 ${brandName}의 일관된 톤 안에서 준비되었습니다.

3. ${city}에서 ${industryLabel}을(를) 고를 때 체크 포인트

• 재료의 출처가 명시되어 있는가
• 시즌별로 메뉴가 바뀌는가
• 운영자가 직접 ${k1}에 대해 설명할 수 있는가

이 세 가지만 보셔도 ${city}의 좋은 ${industryLabel}을(를) 가려내실 수 있습니다.

4. 마무리

${brandName}은(는) 거창한 광고 카피를 만들기보다, 매일 같은 시간에 같은 손길로 준비하는 일을 더 중요하게 생각합니다. ${topic}에 관심 있으신 분이라면, 가까운 날 한 번 들러주세요. 인스타그램(@${brandName.replace(/\s/g, "").toLowerCase()})에서 매주 새 소식을 전하고 있습니다.

#${k1.replace(/\s/g, "")} #${k2.replace(/\s/g, "")} #${brandName.replace(/\s/g, "")} #${city}맛집 #${industryLabel.replace(/\s/g, "")}`;
}
