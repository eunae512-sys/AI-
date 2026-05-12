"use client";

import * as React from "react";
import { motion } from "motion/react";
import { Sparkles, Loader2, Copy, Check, Wand2, MessageSquare, RotateCw } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useBrand } from "@/components/brand/BrandProvider";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { useAutoSaveDraft, formatSavedAt } from "@/lib/drafts/auto-save";

// 업종별 쓰레드 시드 — 짧은 호흡 / 일상 톤
const SEEDS: Record<string, { title: string; sub: string }[]> = {
  restaurant: [
    { title: "오늘 시장에서 본 두릅, 단골이 먼저 알아챘다.", sub: "재료 한 마디" },
    { title: "어버이날, 우리 가게는 평소처럼 새벽 4시에 문을 엽니다.", sub: "안내" },
    { title: "한 그릇 한 상에 들어가는 손이 7번이라는 걸, 처음 알게 된 날.", sub: "비하인드" },
  ],
  cafe: [
    { title: "에티오피아 예가체프 G1, 오늘 도착. 산미가 살아 있어요.", sub: "원두 알림" },
    { title: "콜드브루 마지막 한 잔, 6시간을 기다린 보람.", sub: "한 줄" },
    { title: "단골이 \"오늘은 라떼\" 라고 하면 우리는 이미 준비를 시작합니다.", sub: "단골" },
  ],
  dessert: [
    { title: "수박 케이크 첫 단면, 사진을 못 찍었다. 너무 빨리 잘려서.", sub: "한정" },
    { title: "마카롱 컬러 5월 신상, 색만 봐도 계절이 보여요.", sub: "신상" },
    { title: "오븐에서 갓 나온 5분 — 가장 솔직한 향이 나오는 시간.", sub: "비하인드" },
  ],
  stay: [
    { title: "오늘 마당의 꽃이 처음 피었습니다. 내일 오시는 분들께 행운.", sub: "마당 일기" },
    { title: "한옥의 5월 새벽은 빛이 다른 결로 듭니다.", sub: "공간 무드" },
    { title: "조반 한 상에 들어가는 그릇이 9개. 손님의 한 시간을 위해.", sub: "준비" },
  ],
  beauty: [
    { title: "오늘 단골 분 결이 처음으로 \"살아 있다\" 셨어요. 케어 3개월 차.", sub: "단골 변신" },
    { title: "장마 시작 — 결이 가라앉지 않게 미리 케어 권장합니다.", sub: "시즌 알림" },
    { title: "5월 봄 컬러는 \"가벼움\". 진하기보다 빛을 더하는 쪽으로.", sub: "트렌드 한 줄" },
  ],
  local: [
    { title: "S/S 26 — 한 벌의 무게가 가벼워졌습니다.", sub: "시즌" },
    { title: "Linen × Wool, 우리가 6개월을 기다린 원단.", sub: "원단" },
    { title: "쇼룸 토요일 4시, 디자이너가 직접 설명합니다.", sub: "쇼룸 안내" },
  ],
};

export function ThreadsScreen() {
  const { brand, userBrand } = useBrand();
  const isUserBrand = !!userBrand && brand.id === userBrand.id;
  const toast = useToast();
  const seeds = SEEDS[brand.industry] ?? SEEDS.restaurant;

  const [activeSeed, setActiveSeed] = React.useState(0);
  const [text, setText] = React.useState(seeds[0]?.title ?? "");
  const [variations, setVariations] = React.useState<string[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [copied, setCopied] = React.useState<number | null>(null);

  // 자동 저장
  const { lastSavedAt } = useAutoSaveDraft({
    scope: "threads",
    brandId: brand.id,
    value: { text, variations, activeSeed },
    onRestore: (draft) => {
      if (typeof draft.text === "string") setText(draft.text);
      if (Array.isArray(draft.variations)) setVariations(draft.variations);
      if (typeof draft.activeSeed === "number") setActiveSeed(draft.activeSeed);
    },
  });

  React.useEffect(() => {
    setActiveSeed(0);
    setText(seeds[0]?.title ?? "");
    setVariations([]);
  }, [brand.id, seeds]);

  const charCount = text.length;
  const limit = 500;
  const remaining = limit - charCount;
  const over = remaining < 0;

  const generateVariations = async () => {
    if (loading) return; // 중복 클릭 방어
    if (!text.trim()) {
      toast.warn("쓰레드 텍스트를 입력해 주세요");
      return;
    }
    setLoading(true);
    try {
      const base = text.trim();
      // 사용자 브랜드 시그니처/tagline 주입
      const userMenu = isUserBrand && userBrand?.signatureMenu
        ? userBrand.signatureMenu.filter(Boolean)
        : [];
      const userTagline = isUserBrand && userBrand?.tagline ? userBrand.tagline : "";
      const contextHint = [
        userTagline ? `가게 정체성: "${userTagline}"` : "",
        userMenu.length > 0 ? `시그니처: ${userMenu.join(" / ")}` : "",
      ].filter(Boolean).join(" · ");
      const campaignText = `쓰레드 변형 — 원문: "${base}". ${
        contextHint ? `${contextHint}. ` : ""
      }${limit}자 이내, 한국어 짧은 호흡, 톤은 단정/감성/캐주얼 3종으로 각각 1개씩, sub 필드에 본문 작성. 원문 의미는 유지하되 첫 단어·구조·결을 완전히 다르게.`;
      const res = await fetch("/api/generate-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brand: brand.name,
          industry: brand.industryLabel,
          location: brand.city,
          campaign: campaignText,
          slide_count: 3,
          tone: "단정 · 감성 · 캐주얼 톤 3종 변형",
          forbidden: "",
          must_say: userMenu.join(", "),
        }),
      });
      const data = await res.json();
      if (!data.ok) {
        toast.warn(`변형 생성 실패: ${data.error ?? "알 수 없음"}`);
        // 폴백 — API 실패 시 기본 변형 3종
        const fallback = [
          `${base}\n\n— ${brand.name}`,
          `${base.replace(/\.$/, "")}.\n오늘도 같은 자리, 같은 시간에.`,
          `${base}\n\n#${brand.name.replace(/\s/g, "")} #${brand.industryLabel.replace(/\s/g, "")}`,
        ];
        setVariations(fallback);
        return;
      }
      const raw = (data.slides as Array<{ sub?: string; title?: string }>) || [];
      const vs = raw.slice(0, 3).map((s) => (s.sub ?? s.title ?? "").trim()).filter(Boolean);
      if (vs.length === 0) {
        toast.warn("변형 결과가 비었어요 — 다시 시도");
        return;
      }
      // limit 자 초과 시 잘라서 표시
      const trimmed = vs.map((v) => (v.length > limit ? v.slice(0, limit - 1) + "…" : v));
      setVariations(trimmed);
      const cost = data.meta?.costKrw ?? 0;
      toast.success(`3가지 변형 생성 완료${cost ? ` · ₩${cost}` : ""}`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      toast.warn(`변형 생성 오류: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  const copyOne = async (s: string, idx: number) => {
    try {
      await navigator.clipboard.writeText(s);
      setCopied(idx);
      toast.success("쓰레드 복사됨");
      setTimeout(() => setCopied(null), 1500);
    } catch {
      toast.warn("복사 실패");
    }
  };

  return (
    <div className="px-4 sm:px-6 py-4 sm:py-6">
      <div className="flex items-end justify-between gap-4 flex-wrap mb-5">
        <div className="min-w-0">
          <div className="text-[10px] sm:text-[11px] uppercase tracking-[0.15em] text-zinc-700 dark:text-zinc-300 font-semibold">
            THREADS STUDIO · {brand.name}
          </div>
          <h1 className="mt-2 text-[22px] sm:text-2xl md:text-3xl font-semibold tracking-tight leading-[1.15]">
            쓰레드 한 줄, 우리 톤으로
          </h1>
          <p className="mt-1.5 text-[13px] sm:text-sm text-zinc-500 max-w-2xl leading-relaxed">
            텍스트 중심 짧은 호흡 · {limit}자 · 일상의 한 컷을 한 문장으로
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Left: seed picker + editor */}
        <div className="lg:col-span-3 space-y-4">
          <Card className="p-5">
            <div className="flex items-center justify-between mb-3 gap-2">
              <h3 className="text-sm font-semibold flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-violet-500" /> 시드 한 줄
              </h3>
              <Badge tone="default">{brand.industryLabel} · 우리 톤</Badge>
            </div>
            <div className="grid grid-cols-1 gap-2 mb-4">
              {seeds.map((s, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setActiveSeed(i);
                    setText(s.title);
                  }}
                  className={cn(
                    "text-left rounded-lg border p-3 transition-all",
                    activeSeed === i
                      ? "border-zinc-900 dark:border-zinc-100 bg-zinc-50 dark:bg-zinc-900"
                      : "border-zinc-100 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700",
                  )}
                >
                  <div className="text-[12.5px] tracking-tight leading-snug">{s.title}</div>
                  <div className="mt-1 text-[10px] text-zinc-500">{s.sub}</div>
                </button>
              ))}
            </div>

            <h4 className="text-[11px] uppercase tracking-widest text-zinc-400 font-semibold mb-1.5">
              에디터
            </h4>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={5}
              maxLength={limit + 50}
              placeholder="쓰레드를 입력하거나 위 시드를 선택"
              className="w-full text-[13.5px] leading-[1.6] px-3 py-2.5 rounded-md border border-zinc-200 dark:border-zinc-800 bg-transparent resize-none focus:outline-none focus:ring-1 focus:ring-zinc-400"
            />
            <div className="mt-2 flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "text-[11px] tabular-nums",
                    over ? "text-rose-600 dark:text-rose-400 font-semibold" : "text-zinc-500",
                  )}
                >
                  {charCount.toLocaleString()} / {limit.toLocaleString()}자
                  {over && ` · ${Math.abs(remaining)}자 초과`}
                </span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                  ✓ {formatSavedAt(lastSavedAt)}
                </span>
              </div>
              <Button onClick={generateVariations} disabled={loading || over} size="sm">
                {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Wand2 className="h-3.5 w-3.5" />}
                3가지 변형 생성
              </Button>
            </div>
          </Card>
        </div>

        {/* Right: phone preview + variations */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="p-5">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-1.5">
              <MessageSquare className="h-3.5 w-3.5 text-zinc-500" /> 쓰레드 미리보기
            </h3>
            <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4 bg-white dark:bg-zinc-950">
              <div className="flex items-start gap-2.5">
                <div
                  className="h-9 w-9 rounded-full shrink-0"
                  style={{ background: `linear-gradient(135deg, ${brand.brandColors.secondary}, ${brand.brandColors.primary})` }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-[12.5px] font-semibold">{brand.name}</span>
                    <span className="text-[10.5px] text-zinc-500">@{brand.name.replace(/\s/g, "").toLowerCase()}</span>
                    <span className="text-[10.5px] text-zinc-400">· 방금</span>
                  </div>
                  <p
                    className={cn(
                      "mt-1 text-[13px] leading-[1.55] whitespace-pre-wrap break-words",
                      over && "text-zinc-400",
                    )}
                  >
                    {text || "(쓰레드 미리보기가 여기에 나옵니다)"}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {variations.length > 0 && (
            <Card className="p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold flex items-center gap-1.5">
                  <RotateCw className="h-3.5 w-3.5 text-emerald-500" /> 변형
                </h3>
                <Button onClick={generateVariations} disabled={loading} variant="ghost" size="sm">
                  다시 생성
                </Button>
              </div>
              <div className="space-y-2">
                {variations.map((v, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="rounded-lg border border-zinc-100 dark:border-zinc-800 p-3"
                  >
                    <p className="text-[12.5px] leading-snug whitespace-pre-wrap">{v}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-[10px] text-zinc-400 tabular-nums">{v.length}자</span>
                      <button
                        onClick={() => copyOne(v, i)}
                        className="text-[10.5px] inline-flex items-center gap-1 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                      >
                        {copied === i ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                        {copied === i ? "복사됨" : "복사"}
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
