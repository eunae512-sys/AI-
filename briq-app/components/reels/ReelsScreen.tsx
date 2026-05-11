"use client";

import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Upload, Play, Heart, MessageCircle, Bookmark, Share2, Sparkles, RefreshCw, Music, Type, Pencil } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useBrand } from "@/components/brand/BrandProvider";
import { useToast } from "@/components/ui/toast";
import { getBrandDetail } from "@/lib/dummy/brand-detail";

const TEMPLATES = [
  { id: "morning", name: "새벽 시간순 다큐", desc: "한정식 · 카페 · 베이커리", saveDelta: "+312%", grad: "from-amber-200 via-rose-300 to-amber-400" },
  { id: "asmr", name: "ASMR 디테일 컷", desc: "디저트 · 미용 · 시술", saveDelta: "+248%", grad: "from-stone-700 to-stone-900" },
  { id: "info", name: "5분 정보형 카드", desc: "의료 · 학원 · 안내형", saveDelta: "+189%", grad: "from-sky-100 via-slate-200 to-blue-300" },
  { id: "stay", name: "공간 무드 V-log", desc: "숙소 · 펜션 · 한옥", saveDelta: "+167%", grad: "from-amber-100 via-stone-200 to-amber-300" },
];

// 업종별 기본 템플릿 매핑
const INDUSTRY_DEFAULT_TPL: Record<string, string> = {
  restaurant: "morning",
  cafe: "morning",
  dessert: "asmr",
  beauty: "asmr",
  stay: "stay",
  local: "info",
};

const BGM = [
  { name: "Lo-Fi Calm Morning", mood: "차분 · 새벽" },
  { name: "Acoustic Sunshine", mood: "밝음 · 오전" },
  { name: "Soft Piano Heart", mood: "감성 · 저녁" },
  { name: "Indie Vlog", mood: "여행 · 일상" },
];

type Status = "idle" | "uploading" | "analyzing" | "generating" | "done";

export function ReelsScreen() {
  const { brand } = useBrand();
  const toast = useToast();
  const detail = getBrandDetail(brand.id);
  const HOOKS = detail?.topHooks ?? ["새벽 4시, 시장이 깨어납니다"];
  const defaultTpl = INDUSTRY_DEFAULT_TPL[brand.industry] ?? "morning";

  const [status, setStatus] = React.useState<Status>("done");
  const [activeTpl, setActiveTpl] = React.useState(defaultTpl);
  const [activeHook, setActiveHook] = React.useState(0);
  const [activeBgm, setActiveBgm] = React.useState(0);

  const DEFAULT_PHOTOS = [
    "from-amber-200 to-rose-300",
    "from-violet-300 to-pink-400",
    "from-amber-300 to-stone-700",
    "from-slate-300 to-stone-500",
    "from-amber-100 to-amber-300",
    "from-rose-200 to-amber-200",
  ];
  type Photo =
    | { kind: "gradient"; grad: string }
    | { kind: "upload"; url: string; name: string; caption: string };
  const [photos, setPhotos] = React.useState<Photo[]>(
    DEFAULT_PHOTOS.map((g) => ({ kind: "gradient", grad: g })),
  );
  React.useEffect(() => {
    setPhotos(DEFAULT_PHOTOS.map((g) => ({ kind: "gradient", grad: g })));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brand.id]);

  const photoInputRef = React.useRef<HTMLInputElement>(null);

  const variation = () => {
    setActiveHook((h) => (h + 1) % HOOKS.length);
    setActiveBgm((b) => (b + 1) % 4);
    toast.info(`${brand.name} 변형 1건 생성됨`);
  };
  const publish = () => toast.success(`${brand.name} · 인스타에 발행 요청됨 · 11:30 자동 발행`);
  const addToQueue = () => toast.success(`${brand.name} 예약 큐에 추가됨`);
  const uploadMore = () => photoInputRef.current?.click();
  const removePhoto = (idx: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== idx));
  };

  // 업로드 시 자막 자동 시드 — 브랜드 후크 순환
  const seedCaption = React.useCallback(
    (idx: number) => HOOKS[idx % HOOKS.length] ?? brand.campaign,
    [HOOKS, brand.campaign],
  );

  const onPhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []).filter((f) => f.type.startsWith("image/"));
    if (e.target) e.target.value = "";
    if (!files.length) return;
    const existingUploadCount = photos.filter((p) => p.kind === "upload").length;
    const readers = await Promise.all(
      files.map(
        (f, k) =>
          new Promise<Photo>((resolve, reject) => {
            const r = new FileReader();
            r.onload = () =>
              resolve({
                kind: "upload",
                url: String(r.result),
                name: f.name,
                caption: seedCaption(existingUploadCount + k),
              });
            r.onerror = () => reject(new Error("읽기 실패"));
            r.readAsDataURL(f);
          }),
      ),
    );
    setPhotos((prev) => [...readers, ...prev].slice(0, 18));
    toast.success(`${readers.length}장 업로드 완료 · 컷별 자막 자동 시드 · 자막 클릭해서 편집`);
    generate();
  };

  const updateCaption = (uploadIdx: number, text: string) => {
    setPhotos((prev) => {
      let i = -1;
      return prev.map((p) => {
        if (p.kind !== "upload") return p;
        i += 1;
        return i === uploadIdx ? { ...p, caption: text } : p;
      });
    });
  };

  // 브랜드 전환 시 자동으로 해당 업종 템플릿으로 점프
  React.useEffect(() => {
    setActiveTpl(INDUSTRY_DEFAULT_TPL[brand.industry] ?? "morning");
    setActiveHook(0);
  }, [brand.id, brand.industry]);

  const generate = () => {
    setStatus("uploading");
    setTimeout(() => setStatus("analyzing"), 800);
    setTimeout(() => setStatus("generating"), 2400);
    setTimeout(() => setStatus("done"), 4500);
  };

  // 업로드 사진만 추출
  const uploadedPhotos = React.useMemo(
    () =>
      photos.filter(
        (p): p is { kind: "upload"; url: string; name: string; caption: string } =>
          p.kind === "upload",
      ),
    [photos],
  );
  const cutCount = uploadedPhotos.length > 0 ? uploadedPhotos.length : 8;

  // 프리뷰 컷 자동 전환 (업로드 사진이 있을 때만)
  const [cutIdx, setCutIdx] = React.useState(0);
  React.useEffect(() => {
    // 업로드 수가 줄어들면 인덱스도 안전 범위로
    setCutIdx((i) => (uploadedPhotos.length > 0 ? i % uploadedPhotos.length : 0));
  }, [uploadedPhotos.length]);

  React.useEffect(() => {
    if (uploadedPhotos.length < 2) return;
    if (status !== "done") return; // 생성 중에는 멈춤
    const id = setInterval(() => {
      setCutIdx((i) => (i + 1) % uploadedPhotos.length);
    }, 2200);
    return () => clearInterval(id);
  }, [uploadedPhotos.length, status]);

  const currentCut = uploadedPhotos[cutIdx];
  const currentCaption = currentCut?.caption ?? HOOKS[activeHook] ?? HOOKS[0];
  const stepCut = (dir: 1 | -1) => {
    if (uploadedPhotos.length === 0) return;
    setCutIdx((i) => (i + dir + uploadedPhotos.length) % uploadedPhotos.length);
  };
  const [editingCaption, setEditingCaption] = React.useState(false);
  // 컷 전환 시 편집 모드 종료
  React.useEffect(() => {
    setEditingCaption(false);
  }, [cutIdx]);

  return (
    <div className="px-4 sm:px-6 py-4 sm:py-6">
      {/* Hero */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-5 sm:mb-6">
        <div className="min-w-0">
          <div className="text-[10px] sm:text-[11px] uppercase tracking-[0.15em] text-violet-600 dark:text-violet-400 font-semibold">
            AI REELS · {brand.name} · 톤 v{brand.toneVersion}
          </div>
          <h1 className="mt-2 text-[22px] sm:text-2xl md:text-3xl font-semibold tracking-tight leading-[1.15]">
            사진 5~10장이면 30초 릴스가 자동 완성
          </h1>
          <p className="mt-1.5 text-[13px] sm:text-sm text-zinc-500 max-w-2xl leading-relaxed">
            {brand.industryLabel} 업종 템플릿 · 컷 분할 · 자막 · BGM · 9:16
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={variation} className="flex-1 sm:flex-initial">
            <RefreshCw className="h-3.5 w-3.5" />변형 생성
          </Button>
          <Button size="sm" onClick={generate} className="flex-1 sm:flex-initial">
            <Sparkles className="h-3.5 w-3.5" />다시 생성
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4">
        {/* Left - Template + controls (mobile: order-2 so preview is shown first) */}
        <div className="lg:col-span-3 space-y-3 order-2 lg:order-1">
          <Card className="p-4">
            <div className="text-[11px] uppercase tracking-widest text-zinc-400 font-semibold mb-3">업종별 템플릿</div>
            <div className="space-y-2">
              {TEMPLATES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setActiveTpl(t.id)}
                  className={`w-full flex items-center gap-3 p-2 rounded-lg border text-left transition ${
                    activeTpl === t.id
                      ? "border-zinc-900 dark:border-zinc-100 bg-zinc-50 dark:bg-zinc-900"
                      : "border-zinc-100 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"
                  }`}
                >
                  <div className={`h-10 w-7 rounded bg-gradient-to-br ${t.grad} shrink-0`} />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold truncate">{t.name}</div>
                    <div className="text-[10px] text-zinc-500 truncate">{t.desc}</div>
                  </div>
                  <span className="text-[10px] text-emerald-600 font-bold shrink-0">{t.saveDelta}</span>
                </button>
              ))}
            </div>
          </Card>

          <Card className="p-4">
            <div className="text-[11px] uppercase tracking-widest text-zinc-400 font-semibold mb-1 flex items-center gap-2">
              <Type className="h-3 w-3" />후크 문구
            </div>
            <p className="text-[10px] text-zinc-500 mb-3">
              {uploadedPhotos.length > 0
                ? `클릭하면 현재 컷(${cutIdx + 1}/${uploadedPhotos.length})의 자막으로 적용됩니다`
                : "사진 업로드 시 기본 자막 시드로 사용됩니다"}
            </p>
            <div className="space-y-1.5">
              {HOOKS.map((h, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setActiveHook(i);
                    if (currentCut) {
                      updateCaption(cutIdx, h);
                      toast.success(`컷 ${cutIdx + 1} 자막을 "${h}" 으로 변경`);
                    }
                  }}
                  className={`w-full text-left text-xs px-3 py-2 rounded-md border transition ${
                    activeHook === i
                      ? "border-zinc-900 dark:border-zinc-100 bg-zinc-50 dark:bg-zinc-900"
                      : "border-zinc-100 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"
                  }`}
                >
                  {h}
                </button>
              ))}
            </div>
          </Card>

          <Card className="p-4">
            <div className="text-[11px] uppercase tracking-widest text-zinc-400 font-semibold mb-3 flex items-center gap-2"><Music className="h-3 w-3" />BGM 추천</div>
            <div className="space-y-1.5">
              {BGM.map((b, i) => (
                <button
                  key={b.name}
                  onClick={() => setActiveBgm(i)}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-md border text-left transition ${
                    activeBgm === i
                      ? "border-zinc-900 dark:border-zinc-100 bg-zinc-50 dark:bg-zinc-900"
                      : "border-zinc-100 dark:border-zinc-800"
                  }`}
                >
                  <Play className="h-3 w-3 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium truncate">{b.name}</div>
                    <div className="text-[10px] text-zinc-500 truncate">{b.mood}</div>
                  </div>
                </button>
              ))}
            </div>
          </Card>
        </div>

        {/* Center - Phone preview */}
        <div className="lg:col-span-5 flex flex-col items-center order-1 lg:order-2">
          <div className="relative w-[min(300px,calc(100vw-32px))] lg:w-[280px]">
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              className="relative rounded-[36px] border-[10px] border-zinc-900 dark:border-zinc-700 bg-zinc-900 overflow-hidden shadow-2xl"
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentCut ? `cut-${cutIdx}-${currentCut.url.slice(-12)}` : activeTpl}
                  initial={{ opacity: 0, scale: 1.04 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.5 }}
                  className={`aspect-[9/16] relative overflow-hidden ${
                    currentCut ? "" : `bg-gradient-to-br ${TEMPLATES.find((t) => t.id === activeTpl)?.grad}`
                  }`}
                >
                  {currentCut && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={currentCut.url}
                      alt={currentCut.name}
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  )}
                  {/* readability gradient */}
                  {currentCut && (
                    <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/55 pointer-events-none" />
                  )}

                  <div className="absolute top-4 left-4 right-4 flex items-center gap-2 text-white z-10">
                    <div className={`h-7 w-7 rounded-full bg-gradient-to-br ${brand.gradient} grid place-items-center text-[10px] font-bold`}>
                      {brand.letter}
                    </div>
                    <div className="text-[11px] font-medium drop-shadow">{brand.name}</div>
                    <button className="ml-auto text-[11px] bg-white/20 backdrop-blur px-2.5 py-1 rounded-full">팔로우</button>
                  </div>

                  {/* Cut counter */}
                  {uploadedPhotos.length > 0 && (
                    <div className="absolute top-14 left-4 right-4 flex items-center gap-1.5 z-10">
                      {uploadedPhotos.map((_, i) => (
                        <div
                          key={i}
                          className={`h-0.5 flex-1 rounded-full ${i === cutIdx ? "bg-white" : "bg-white/30"}`}
                        />
                      ))}
                    </div>
                  )}

                  <motion.div
                    key={`caption-${cutIdx}-${brand.id}-${activeHook}`}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute bottom-32 left-4 right-4 text-white z-10"
                  >
                    {editingCaption && currentCut ? (
                      <textarea
                        autoFocus
                        rows={3}
                        value={currentCut.caption}
                        onChange={(e) => updateCaption(cutIdx, e.target.value)}
                        onBlur={() => setEditingCaption(false)}
                        onKeyDown={(e) => {
                          if (e.key === "Escape") setEditingCaption(false);
                        }}
                        className="w-full text-2xl font-bold leading-tight bg-black/55 backdrop-blur text-white p-1.5 rounded outline-none ring-1 ring-white/60 resize-none"
                      />
                    ) : (
                      <button
                        type="button"
                        onClick={() => currentCut && setEditingCaption(true)}
                        className="block w-full text-left text-2xl font-bold leading-tight drop-shadow-lg hover:bg-black/20 rounded transition-colors px-0.5 py-0.5"
                        title={currentCut ? "자막 편집 (Esc 종료)" : ""}
                      >
                        {currentCaption}
                        {currentCut && (
                          <Pencil className="inline-block ml-1.5 h-3 w-3 opacity-50 align-baseline" />
                        )}
                      </button>
                    )}
                    <div className="mt-2 text-xs opacity-90 drop-shadow">{detail?.hero.tagline ?? brand.campaign}</div>
                  </motion.div>

                  <div className="absolute right-3 bottom-32 flex flex-col gap-3 text-white text-center z-10">
                    <div><Heart className="h-5 w-5 mx-auto" /><div className="text-[10px]">2.4K</div></div>
                    <div><MessageCircle className="h-5 w-5 mx-auto" /><div className="text-[10px]">87</div></div>
                    <div><Share2 className="h-5 w-5 mx-auto" /><div className="text-[10px]">141</div></div>
                    <div><Bookmark className="h-5 w-5 mx-auto" /><div className="text-[10px]">312</div></div>
                  </div>
                  <div className="absolute bottom-4 left-4 right-4 text-white text-[10px] flex items-center gap-1.5 z-10">
                    <span className="h-3 w-3 rounded bg-white/20" />♪ {BGM[activeBgm].name}
                    {uploadedPhotos.length > 0 && (
                      <span className="ml-auto opacity-80">
                        컷 {cutIdx + 1}/{uploadedPhotos.length}
                      </span>
                    )}
                  </div>
                </motion.div>
              </AnimatePresence>
            </motion.div>
            <div className="absolute -inset-8 -z-10 rounded-full bg-gradient-to-br from-rose-300/20 via-violet-400/20 to-indigo-400/20 blur-3xl" />
          </div>

          {/* Cut nav */}
          {uploadedPhotos.length > 0 && (
            <div className="mt-4 flex items-center gap-2 text-xs">
              <button
                onClick={() => stepCut(-1)}
                className="px-3 py-1.5 rounded-md border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900"
              >
                ◀ 이전 컷
              </button>
              <span className="tabular-nums text-zinc-500">
                {cutIdx + 1} / {uploadedPhotos.length}
              </span>
              <button
                onClick={() => stepCut(1)}
                className="px-3 py-1.5 rounded-md border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900"
              >
                다음 컷 ▶
              </button>
            </div>
          )}

          {/* Status bar */}
          <div className="mt-6 w-full max-w-[420px]">
            <AnimatePresence mode="wait">
              {status === "done" ? (
                <motion.div key="done" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/30 dark:bg-emerald-500/5 p-4 text-center">
                  <div className="text-[11px] uppercase tracking-widest text-emerald-700 dark:text-emerald-400 font-semibold">
                    {uploadedPhotos.length > 0 ? `업로드 ${uploadedPhotos.length}장 적용됨` : "생성 완료 · 32초"}
                  </div>
                  <div className="mt-1 text-sm font-semibold">
                    {cutCount}컷 · 자막 · 전환 · 썸네일 자동 적용
                  </div>
                  <div className="mt-2 text-[11px] text-zinc-500">
                    {brand.name} 톤 v{brand.toneVersion} 적용됨 · 예상 저장률 5.8%
                  </div>
                </motion.div>
              ) : (
                <motion.div key={status} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl border border-violet-200 dark:border-violet-900/50 bg-gradient-to-r from-violet-50/30 to-pink-50/30 dark:from-violet-500/5 dark:to-pink-500/5 p-4 text-center">
                  <div className="text-[11px] uppercase tracking-widest text-violet-700 dark:text-violet-400 font-semibold">
                    {status === "uploading" && "업로드 중..."}
                    {status === "analyzing" && "분위기 · 컷 분석 중..."}
                    {status === "generating" && "자막 · BGM · 전환 자동 생성 중..."}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right - Output assets */}
        <div className="lg:col-span-4 space-y-3 order-3">
          <Card className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="text-[11px] uppercase tracking-widest text-zinc-400 font-semibold">자동 생성된 자산</div>
              <Badge tone="emerald">5종</Badge>
            </div>
            <ul className="space-y-2 text-xs">
              {[
                { label: `릴스 30초 · ${cutCount}컷 · 9:16`, size: "12.4 MB" },
                { label: "캡션 + 해시태그 12개", size: "1.2 KB" },
                { label: "썸네일 1:1 + 9:16", size: "2.1 MB" },
                { label: "카드뉴스 6장 (캐러셀)", size: "8.6 MB" },
                { label: "네이버 블로그 본문 1편", size: "12 KB" },
              ].map((it) => (
                <li key={it.label} className="flex items-center gap-2 p-2 rounded-md bg-zinc-50 dark:bg-zinc-900/50">
                  <span className="h-5 w-5 rounded bg-emerald-100 dark:bg-emerald-500/20 grid place-items-center text-emerald-700 dark:text-emerald-400 text-[10px] font-bold shrink-0">✓</span>
                  <span className="flex-1 truncate font-medium">{it.label}</span>
                  <span className="text-[10px] text-zinc-500">{it.size}</span>
                </li>
              ))}
            </ul>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="text-[11px] uppercase tracking-widest text-zinc-400 font-semibold">업로드 사진</div>
              <span className="text-[10px] text-zinc-500">{photos.filter((p) => p.kind === "upload").length} 업로드 · {photos.length} 총</span>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {photos.map((p, i) => {
                if (p.kind === "upload") {
                  const uploadOnlyIdx = uploadedPhotos.findIndex((u) => u.url === p.url);
                  const isActive = uploadOnlyIdx === cutIdx;
                  return (
                    <div
                      key={`u-${i}`}
                      className={`relative aspect-square rounded-md overflow-hidden group cursor-pointer ring-2 transition-all ${
                        isActive ? "ring-violet-500" : "ring-transparent hover:ring-zinc-300 dark:hover:ring-zinc-700"
                      }`}
                      onClick={() => {
                        if (uploadOnlyIdx >= 0) setCutIdx(uploadOnlyIdx);
                      }}
                      title={`${p.name} (클릭해서 프리뷰 컷 ${uploadOnlyIdx + 1} 로 이동)`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={p.url} alt={p.name} className="absolute inset-0 h-full w-full object-cover" />
                      {isActive && (
                        <span className="absolute bottom-1 left-1 text-[8px] font-bold uppercase tracking-widest text-white bg-violet-600/90 backdrop-blur px-1 py-0.5 rounded">
                          NOW
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removePhoto(i);
                        }}
                        className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity text-white bg-black/60 hover:bg-rose-600 rounded-full p-0.5"
                        title="삭제"
                      >
                        <svg className="h-2.5 w-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  );
                }
                return <div key={`g-${i}`} className={`aspect-square rounded-md bg-gradient-to-br ${p.grad}`} />;
              })}
            </div>
            <Button variant="outline" size="sm" className="w-full mt-3" onClick={uploadMore}>
              <Upload className="h-3 w-3" />사진 더 업로드
            </Button>
            <input
              ref={photoInputRef}
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={onPhotoChange}
            />
          </Card>

          {uploadedPhotos.length > 0 && (
            <Card className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="text-[11px] uppercase tracking-widest text-zinc-400 font-semibold flex items-center gap-1.5">
                  <Type className="h-3 w-3" />컷별 자막
                </div>
                <button
                  onClick={() => {
                    setPhotos((prev) => {
                      let i = -1;
                      return prev.map((p) => {
                        if (p.kind !== "upload") return p;
                        i += 1;
                        return { ...p, caption: seedCaption(i) };
                      });
                    });
                    toast.info("자막 후크로 리셋");
                  }}
                  className="text-[10px] text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 inline-flex items-center gap-1"
                >
                  <RefreshCw className="h-2.5 w-2.5" />리셋
                </button>
              </div>
              <ul className="space-y-2">
                {uploadedPhotos.map((u, i) => (
                  <li
                    key={u.url.slice(-32)}
                    className={`flex items-start gap-2 p-2 rounded-md border transition-colors ${
                      i === cutIdx
                        ? "border-violet-300 dark:border-violet-700 bg-violet-50/40 dark:bg-violet-500/10"
                        : "border-zinc-100 dark:border-zinc-800"
                    }`}
                  >
                    <button
                      onClick={() => setCutIdx(i)}
                      className="shrink-0 h-10 w-10 rounded overflow-hidden ring-1 ring-zinc-200 dark:ring-zinc-800"
                      title={`컷 ${i + 1} 프리뷰`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={u.url} alt={u.name} className="h-full w-full object-cover" />
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] text-zinc-500 mb-0.5">컷 {i + 1}</div>
                      <textarea
                        value={u.caption}
                        onChange={(e) => updateCaption(i, e.target.value)}
                        rows={2}
                        placeholder="이 컷에 들어갈 자막"
                        className="w-full text-xs leading-snug px-2 py-1.5 rounded border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 outline-none focus:border-zinc-400 resize-none"
                      />
                    </div>
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-[10px] text-zinc-500">
                컷 클릭 → 프리뷰 동기화 · 자막은 핸드폰 위에서도 클릭해서 인라인 편집 가능
              </p>
            </Card>
          )}

          <Card className="p-4">
            <Button className="w-full" size="lg" onClick={publish}>
              인스타에 발행 →
            </Button>
            <Button variant="outline" className="w-full mt-2" size="sm" onClick={addToQueue}>
              예약 큐에 추가
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}
