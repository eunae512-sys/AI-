"use client";

import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Download, RefreshCw, Plus, FileImage, X, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useBrand } from "@/components/brand/BrandProvider";
import { useToast } from "@/components/ui/toast";
import { getBrandDetail } from "@/lib/dummy/brand-detail";

const FONT_PAIRS: Record<string, { headline: { name: string; family: string; note: string }; body: { name: string; family: string; note: string } }> = {
  miokdang: {
    headline: { name: "Nanum Myeongjo", family: "'Nanum Myeongjo', serif", note: "명조체 · 정통 + 단정" },
    body: { name: "Pretendard Variable", family: "'Pretendard Variable', sans-serif", note: "가독성 + 모던 균형" },
  },
  "roastery-1985": {
    headline: { name: "Pretendard Variable Bold", family: "'Pretendard Variable', sans-serif", note: "굵은 산세리프 · 모던 카페" },
    body: { name: "Pretendard Variable", family: "'Pretendard Variable', sans-serif", note: "가독성" },
  },
  "seochon-stay": {
    headline: { name: "Nanum Myeongjo", family: "'Nanum Myeongjo', serif", note: "명조 · 전통 한옥" },
    body: { name: "Pretendard Variable", family: "'Pretendard Variable', sans-serif", note: "가독성" },
  },
  "dolce-dessert": {
    headline: { name: "Pretendard Variable", family: "'Pretendard Variable', sans-serif", note: "라운드 · 발랄" },
    body: { name: "Pretendard Variable", family: "'Pretendard Variable', sans-serif", note: "가독성" },
  },
  "luna-hair": {
    headline: { name: "Pretendard Variable Bold", family: "'Pretendard Variable', sans-serif", note: "모던 산세리프" },
    body: { name: "Pretendard Variable", family: "'Pretendard Variable', sans-serif", note: "가독성" },
  },
  "forum-fashion": {
    headline: { name: "Pretendard Variable Light", family: "'Pretendard Variable', sans-serif", note: "라이트 · 에디토리얼" },
    body: { name: "Pretendard Variable", family: "'Pretendard Variable', sans-serif", note: "가독성" },
  },
};

const SAMPLE_BY_BRAND: Record<string, { headline: string; body: string }> = {
  miokdang: { headline: "한 입에 봄이 옵니다", body: "새벽 4시 양평 시장의 두릅과 머위" },
  "roastery-1985": { headline: "오늘 새 원두 도착", body: "에티오피아 예가체프 · 한 잔에 6시간" },
  "seochon-stay": { headline: "창호로 드는 새벽 빛", body: "마당의 시간이 천천히 흐릅니다" },
  "dolce-dessert": { headline: "오늘 새로 구운 수박 케이크", body: "녹는 단 한 입 · 5월 한정" },
  "luna-hair": { headline: "결이 살아요", body: "5월 봄 컬러 · 5초만에 광택" },
  "forum-fashion": { headline: "S/S 26 LOOKBOOK", body: "ONE FABRIC, TWO WAYS · 한 벌의 무게" },
};

type ColorEntry = { name: string; hex: string };

export function BrandKitScreen() {
  const { brand } = useBrand();
  const toast = useToast();
  const detail = getBrandDetail(brand.id);
  const fonts = FONT_PAIRS[brand.id] ?? FONT_PAIRS.miokdang;
  const sample = SAMPLE_BY_BRAND[brand.id] ?? SAMPLE_BY_BRAND.miokdang;

  // 브랜드 컬러 — 상태로 관리해 추가/삭제 가능
  const [colors, setColors] = React.useState<ColorEntry[]>(detail?.colorPalette ?? []);
  React.useEffect(() => {
    setColors(getBrandDetail(brand.id)?.colorPalette ?? []);
  }, [brand.id]);

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [draft, setDraft] = React.useState<ColorEntry>({ name: "", hex: "#7B2D26" });

  const primaryColor = colors[0]?.hex ?? "#7B2D26";
  const secondaryColor = colors[1]?.hex ?? "#E9DCC0";

  const isValidHex = (s: string) => /^#?[0-9A-Fa-f]{6}$/.test(s.trim());
  const normalizeHex = (s: string) => (s.startsWith("#") ? s : `#${s}`).toUpperCase();

  const openAddColor = () => {
    setDraft({ name: "", hex: "#7B2D26" });
    setDialogOpen(true);
  };

  const submitColor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidHex(draft.hex)) {
      toast.warn("HEX 값을 6자리로 입력해 주세요 (예: #7B2D26)");
      return;
    }
    const trimmedName = draft.name.trim() || `컬러 ${colors.length + 1}`;
    const hex = normalizeHex(draft.hex);
    if (colors.some((c) => c.hex.toUpperCase() === hex)) {
      toast.warn("이미 팔레트에 있는 컬러입니다");
      return;
    }
    setColors((prev) => [...prev, { name: trimmedName, hex }]);
    toast.success(`"${trimmedName}" 컬러가 ${brand.name} 팔레트에 추가됨`);
    setDialogOpen(false);
  };

  const removeColor = (hex: string) => {
    const target = colors.find((c) => c.hex === hex);
    setColors((prev) => prev.filter((c) => c.hex !== hex));
    if (target) toast.info(`"${target.name}" 컬러 제거됨`);
  };

  return (
    <div className="px-4 sm:px-6 py-4 sm:py-6">
      <div className="flex items-end justify-between gap-4 flex-wrap mb-6">
        <div>
          <div className="text-[11px] uppercase tracking-widest text-rose-600 dark:text-rose-400 font-semibold">
            AUTO BRAND KIT · {brand.name}
          </div>
          <h1 className="mt-2 text-2xl sm:text-3xl font-semibold tracking-tight">
            로고 + 사진 한 장으로 키트 완성
          </h1>
          <p className="mt-1 text-sm text-zinc-500 max-w-2xl">
            {brand.name} · {brand.industryLabel} · 컬러 6 자동 추출 · 폰트 추천 · 카드뉴스/릴스 템플릿 자동 생성
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => toast.info(`${brand.name} 브랜드 키트 재학습 중...`)}>
            <RefreshCw className="h-3.5 w-3.5" />재학습
          </Button>
          <Button size="sm" onClick={() => toast.success(`${brand.name}-brand-kit.pdf 다운로드 완료`)}>
            <Download className="h-3.5 w-3.5" />PDF 다운로드
          </Button>
        </div>
      </div>

      {/* Brand identity card */}
      <Card className="p-5 mb-4 border-dashed">
        <div className="flex items-center gap-5 flex-wrap">
          <motion.div
            key={brand.id}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`h-20 w-20 rounded-2xl bg-gradient-to-br ${brand.gradient} grid place-items-center text-white text-2xl font-bold shrink-0`}
          >
            {brand.letter}
          </motion.div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold">{brand.name} · 자동 추출 완료</div>
            <div className="text-[11px] text-zinc-500 mt-1">
              로고 1개 + 사진 12장 분석 · 47초 소요 · 신뢰도 94%
            </div>
            <div className="mt-2 flex items-center gap-1.5 flex-wrap">
              <Badge tone="rose">{brand.industryLabel}</Badge>
              <Badge tone="amber">{detail?.toneSummary ? "에디토리얼" : "기본"}</Badge>
              <Badge tone="emerald">감성 우세</Badge>
              <Badge tone="sky">톤 v{brand.toneVersion}</Badge>
            </div>
          </div>
        </div>
      </Card>

      {/* Color palette */}
      <Card className="p-5 mb-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold">컬러 팔레트</h3>
            <p className="text-[11px] text-zinc-500 mt-0.5">로고 + 사진에서 자동 추출 · 6 컬러</p>
          </div>
          <Button variant="ghost" size="sm" onClick={openAddColor}>
            <Plus className="h-3.5 w-3.5" />컬러 추가
          </Button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {colors.map((c, i) => (
            <motion.div
              key={c.hex}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="relative aspect-[1.3/1] rounded-xl overflow-hidden group cursor-pointer"
              style={{ background: c.hex }}
              onClick={() => {
                navigator.clipboard?.writeText(c.hex).catch(() => {});
                toast.info(`${c.hex} 클립보드에 복사됨`);
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="absolute bottom-2 left-2 right-2">
                <div className="text-[10px] font-semibold text-white mix-blend-difference">{c.name}</div>
                <div className="text-[9px] tabular-nums text-white/80 mix-blend-difference">{c.hex}</div>
              </div>
              {i === 0 && (
                <span className="absolute top-2 right-2 text-[8px] font-bold uppercase tracking-widest text-white/90 bg-black/30 backdrop-blur px-1.5 py-0.5 rounded">
                  Primary
                </span>
              )}
              {i > 0 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeColor(c.hex);
                  }}
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 hover:bg-rose-600 text-white rounded p-1"
                  title="컬러 제거"
                >
                  <Trash2 className="h-2.5 w-2.5" />
                </button>
              )}
            </motion.div>
          ))}
          <button
            type="button"
            onClick={openAddColor}
            className="aspect-[1.3/1] rounded-xl border-2 border-dashed border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 grid place-items-center text-xs gap-1"
          >
            <Plus className="h-4 w-4" />
            <span>컬러 추가</span>
          </button>
        </div>
      </Card>

      {/* Typography */}
      <Card className="p-5 mb-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold">폰트 추천</h3>
          <span className="text-[11px] text-zinc-500">{brand.industryLabel} + 톤 매칭</span>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <motion.div
            key={`${brand.id}-headline`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-zinc-100 dark:border-zinc-800 p-5"
          >
            <div className="flex items-center justify-between">
              <div className="text-[10px] uppercase tracking-widest text-zinc-400 font-semibold">제목 · Headline</div>
              <Badge tone="emerald">추천</Badge>
            </div>
            <div className="mt-3" style={{ fontFamily: fonts.headline.family }}>
              <div className="text-3xl font-semibold tracking-tight" style={{ color: primaryColor }}>
                {sample.headline}
              </div>
              <div className="text-base text-zinc-600 dark:text-zinc-400 mt-1">{sample.body}</div>
            </div>
            <div className="mt-3 text-[11px] text-zinc-500">{fonts.headline.name} · {fonts.headline.note}</div>
          </motion.div>
          <motion.div
            key={`${brand.id}-body`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="rounded-xl border border-zinc-100 dark:border-zinc-800 p-5"
          >
            <div className="flex items-center justify-between">
              <div className="text-[10px] uppercase tracking-widest text-zinc-400 font-semibold">본문 · Body</div>
              <Badge tone="emerald">추천</Badge>
            </div>
            <div className="mt-3" style={{ fontFamily: fonts.body.family }}>
              <div className="text-2xl font-semibold tracking-tight">{brand.name}</div>
              <div className="text-sm text-zinc-600 dark:text-zinc-400 mt-1.5 leading-relaxed">
                {detail?.hero.description ?? brand.campaign}
              </div>
            </div>
            <div className="mt-3 text-[11px] text-zinc-500">{fonts.body.name} · {fonts.body.note}</div>
          </motion.div>
        </div>
      </Card>

      {/* Generated templates */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold">자동 생성된 템플릿</h3>
            <p className="text-[11px] text-zinc-500 mt-0.5">카드뉴스 6장 · 릴스 4종 · 썸네일 8개</p>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {colors.slice(0, 6).map((c, i) => (
            <motion.a
              key={c.hex}
              href={i < 3 ? "/cardnews" : "/reels"}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="group rounded-lg overflow-hidden border border-zinc-100 dark:border-zinc-800 hover:border-zinc-900 dark:hover:border-zinc-100 transition-colors"
            >
              <div
                className={`relative ${i < 3 ? "aspect-[4/5]" : "aspect-[9/16]"}`}
                style={{ background: `linear-gradient(135deg, ${c.hex}, ${colors[(i + 1) % colors.length]?.hex ?? c.hex})` }}
              >
                <div className="absolute inset-0 flex items-end p-3">
                  <div
                    className="text-white text-[10px] font-semibold drop-shadow"
                    style={{ fontFamily: fonts.headline.family }}
                  >
                    {i < 3 ? `카드 ${i + 1}/6` : "릴스"}
                  </div>
                </div>
                <div className="absolute top-2 right-2 text-[8px] bg-black/40 text-white px-1.5 py-0.5 rounded">
                  {i < 3 ? "4:5" : "9:16"}
                </div>
              </div>
              <div className="p-2 flex items-center gap-1">
                <FileImage className="h-3 w-3 text-zinc-400" />
                <div className="text-[10px] text-zinc-500 truncate">{i < 3 ? "카드뉴스" : "릴스"} 템플릿</div>
              </div>
            </motion.a>
          ))}
        </div>
      </Card>

      <AnimatePresence>
        {dialogOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-40"
              onClick={() => setDialogOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[min(420px,calc(100vw-24px))] max-h-[90vh] overflow-y-auto rounded-2xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-2xl p-5"
            >
              <div className="flex items-start justify-between gap-3 mb-4">
                <div>
                  <h3 className="text-sm font-semibold">컬러 추가</h3>
                  <p className="text-[11px] text-zinc-500 mt-0.5">{brand.name} 팔레트에 새 컬러를 추가합니다</p>
                </div>
                <button
                  onClick={() => setDialogOpen(false)}
                  className="text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <form onSubmit={submitColor} className="space-y-3">
                <div>
                  <label className="text-[11px] uppercase tracking-widest text-zinc-400 font-semibold">컬러 이름</label>
                  <input
                    type="text"
                    value={draft.name}
                    onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                    placeholder="예: 봄나물 그린"
                    className="mt-1 w-full text-sm px-3 py-2 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 outline-none focus:border-zinc-400"
                  />
                </div>
                <div>
                  <label className="text-[11px] uppercase tracking-widest text-zinc-400 font-semibold">HEX</label>
                  <div className="mt-1 flex items-center gap-2">
                    <input
                      type="color"
                      value={isValidHex(draft.hex) ? normalizeHex(draft.hex) : "#7B2D26"}
                      onChange={(e) => setDraft((d) => ({ ...d, hex: e.target.value }))}
                      className="h-10 w-12 rounded-md border border-zinc-200 dark:border-zinc-800 cursor-pointer bg-transparent"
                    />
                    <input
                      type="text"
                      value={draft.hex}
                      onChange={(e) => setDraft((d) => ({ ...d, hex: e.target.value }))}
                      placeholder="#7B2D26"
                      className="flex-1 text-sm tabular-nums px-3 py-2 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 outline-none focus:border-zinc-400"
                    />
                  </div>
                  <p className="mt-1 text-[10px] text-zinc-500">정확한 컬러는 HEX 6자리로 · 색상 박스 클릭하면 피커</p>
                </div>
                <div
                  className="h-14 rounded-lg border border-zinc-200 dark:border-zinc-800"
                  style={{ background: isValidHex(draft.hex) ? normalizeHex(draft.hex) : "transparent" }}
                />
                <div className="flex items-center justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => setDialogOpen(false)}>
                    취소
                  </Button>
                  <Button type="submit" size="sm">
                    팔레트에 추가
                  </Button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
