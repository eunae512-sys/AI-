"use client";

import * as React from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { Coffee, Cake, Home, UtensilsCrossed, Scissors, Sparkles, ChevronLeft, Check } from "lucide-react";
import { cn } from "@/lib/utils";

type Industry = { id: string; label: string; sub: string; Icon: React.ElementType };
type Mood = { id: string; label: string; sub: string; gradient: string };

const INDUSTRIES: Industry[] = [
  { id: "cafe", label: "카페", sub: "스페셜티 / 베이커리", Icon: Coffee },
  { id: "dessert", label: "디저트샵", sub: "케이크 / 마카롱 / 빙수", Icon: Cake },
  { id: "stay", label: "숙소", sub: "한옥스테이 / 펜션", Icon: Home },
  { id: "restaurant", label: "음식점", sub: "한식 / 양식 / 일식", Icon: UtensilsCrossed },
  { id: "beauty", label: "미용·뷰티", sub: "헤어 / 네일 / 피부", Icon: Scissors },
  { id: "local", label: "로컬 브랜드", sub: "소품 / 패션 / 라이프스타일", Icon: Sparkles },
];

const MOODS: Mood[] = [
  { id: "warm", label: "따뜻한 · 정성", sub: "한식 · 베이커리 · 한옥", gradient: "from-amber-200 via-orange-200 to-rose-200" },
  { id: "modern", label: "미니멀 · 모던", sub: "스페셜티 카페 · 편집샵", gradient: "from-zinc-100 via-slate-200 to-zinc-300" },
  { id: "moody", label: "감성 · 시네마틱", sub: "와인바 · 스튜디오", gradient: "from-stone-700 via-stone-800 to-stone-900" },
  { id: "playful", label: "발랄한 · 친근", sub: "디저트 · 분식 · 카페", gradient: "from-pink-200 via-rose-300 to-orange-200" },
  { id: "natural", label: "내추럴 · 친환경", sub: "비건 · 유기농 · 로컬", gradient: "from-emerald-200 via-lime-200 to-amber-100" },
  { id: "luxury", label: "럭셔리 · 프리미엄", sub: "파인다이닝 · 부티크", gradient: "from-zinc-900 via-zinc-800 to-amber-900" },
];

const STAGES = [
  { id: 0, title: "사진에서 컬러 추출", sub: "5장 · 평균 컬러 6개" },
  { id: 1, title: "분위기 · 구도 · 채도 분석", sub: "'따뜻한 자연광 + 단정한 미니멀'" },
  { id: 2, title: "인스타 캡션 23개에서 톤 학습", sub: "Claude Sonnet 4.6 · 5축 톤 슬라이더" },
  { id: 3, title: "금지어 / 자주 쓰는 표현 추출", sub: "" },
  { id: 4, title: "업종 가이드라인 · 지역 트렌드 매칭", sub: "" },
  { id: 5, title: "브랜드 키트 · 첫 콘텐츠 생성", sub: "" },
];

export function Onboarding() {
  const [step, setStep] = React.useState(1);
  const totalSteps = 7;
  const [industry, setIndustry] = React.useState<string>();
  const [mood, setMood] = React.useState<string>();
  const [analysisStep, setAnalysisStep] = React.useState(0);

  const next = () => setStep((s) => Math.min(s + 1, totalSteps));
  const back = () => setStep((s) => Math.max(s - 1, 1));

  // Step 5 analysis simulation
  React.useEffect(() => {
    if (step !== 5) return;
    setAnalysisStep(0);
    const timers: NodeJS.Timeout[] = [];
    STAGES.forEach((_, i) => {
      timers.push(setTimeout(() => setAnalysisStep(i + 1), (i + 1) * 1100));
    });
    timers.push(setTimeout(() => setStep(6), STAGES.length * 1100 + 600));
    return () => timers.forEach(clearTimeout);
  }, [step]);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-zinc-100 dark:border-zinc-900 backdrop-blur sticky top-0 z-10 bg-white/70 dark:bg-zinc-950/70">
        <div className="max-w-3xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-md bg-gradient-to-br from-indigo-500 via-violet-600 to-pink-500 grid place-items-center text-white text-xs font-bold">B</div>
            <span className="text-sm font-semibold">BRIQ</span>
          </Link>
          <div className="flex items-center gap-1.5">
            {Array.from({ length: totalSteps }).map((_, i) => {
              const idx = i + 1;
              const done = idx < step;
              const current = idx === step;
              return (
                <motion.span
                  key={i}
                  className={cn(
                    "h-1.5 rounded-full",
                    done
                      ? "bg-zinc-900 dark:bg-zinc-100 w-9"
                      : current
                      ? "w-12 bg-gradient-to-r from-indigo-500 to-pink-500"
                      : "w-9 bg-zinc-200 dark:bg-zinc-800"
                  )}
                  initial={false}
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              );
            })}
          </div>
          <div className="text-[11px] text-zinc-500 tabular-nums w-12 text-right">{step} / {totalSteps}</div>
        </div>
      </header>

      <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-12 md:py-20">
        <AnimatePresence mode="wait">
          {/* Step 1 - Industry */}
          {step === 1 && (
            <motion.section
              key="s1"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35 }}
            >
              <div className="text-[11px] uppercase tracking-widest text-zinc-400 font-semibold">STEP 01</div>
              <h1 className="mt-2 text-3xl sm:text-4xl font-semibold tracking-tight">어떤 가게를 운영하세요?</h1>
              <p className="mt-3 text-base text-zinc-600 dark:text-zinc-400">업종을 선택하면 BRIQ가 맞춤 톤·템플릿을 자동 적용합니다.</p>
              <div className="mt-10 grid grid-cols-2 md:grid-cols-3 gap-3">
                {INDUSTRIES.map((it) => {
                  const Icon = it.Icon;
                  const selected = industry === it.id;
                  return (
                    <button
                      key={it.id}
                      onClick={() => { setIndustry(it.id); setTimeout(next, 350); }}
                      className={cn(
                        "rounded-xl border p-5 text-left transition-all",
                        selected
                          ? "border-zinc-900 dark:border-zinc-100 bg-zinc-50 dark:bg-zinc-900 shadow-[0_0_0_3px_rgba(17,24,39,0.06)]"
                          : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-900 dark:hover:border-zinc-100 hover:-translate-y-0.5"
                      )}
                    >
                      <Icon className="h-7 w-7 text-zinc-700 dark:text-zinc-300" strokeWidth={1.5} />
                      <div className="mt-3 text-base font-semibold">{it.label}</div>
                      <div className="text-[12px] text-zinc-500 mt-0.5">{it.sub}</div>
                    </button>
                  );
                })}
              </div>
            </motion.section>
          )}

          {/* Step 2 - Mood */}
          {step === 2 && (
            <motion.section
              key="s2"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35 }}
            >
              <div className="text-[11px] uppercase tracking-widest text-zinc-400 font-semibold">STEP 02</div>
              <h1 className="mt-2 text-3xl sm:text-4xl font-semibold tracking-tight">브랜드 분위기는<br />어떤 결인가요?</h1>
              <p className="mt-3 text-base text-zinc-600 dark:text-zinc-400">선택한 분위기로 컬러·폰트·문체 톤이 자동 매칭됩니다.</p>
              <div className="mt-10 grid grid-cols-2 md:grid-cols-3 gap-3">
                {MOODS.map((m) => {
                  const selected = mood === m.id;
                  return (
                    <button
                      key={m.id}
                      onClick={() => { setMood(m.id); setTimeout(next, 350); }}
                      className={cn(
                        "rounded-xl overflow-hidden border text-left transition-all",
                        selected
                          ? "border-zinc-900 dark:border-zinc-100 shadow-[0_0_0_3px_rgba(17,24,39,0.06)]"
                          : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-900 dark:hover:border-zinc-100 hover:-translate-y-0.5"
                      )}
                    >
                      <div className={cn("aspect-[5/3] bg-gradient-to-br", m.gradient)} />
                      <div className="p-4">
                        <div className="font-semibold text-sm">{m.label}</div>
                        <div className="text-[12px] text-zinc-500 mt-0.5">{m.sub}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </motion.section>
          )}

          {/* Step 3 - Instagram connect */}
          {step === 3 && (
            <motion.section key="s3" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.35 }}>
              <div className="text-[11px] uppercase tracking-widest text-zinc-400 font-semibold">STEP 03</div>
              <h1 className="mt-2 text-3xl sm:text-4xl font-semibold tracking-tight">인스타 계정을 연결할게요</h1>
              <p className="mt-3 text-base text-zinc-600 dark:text-zinc-400">기존 게시물에서 브랜드 톤을 자동 학습합니다.</p>
              <div className="mt-10 space-y-3">
                <button
                  onClick={() => setTimeout(next, 350)}
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-zinc-900 dark:hover:border-zinc-100 p-5 flex items-center gap-4 text-left transition-all"
                >
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-fuchsia-500 via-pink-500 to-orange-400 grid place-items-center text-white font-bold text-lg">IG</div>
                  <div className="flex-1">
                    <div className="font-semibold text-sm">Instagram 계정 연결</div>
                    <div className="text-[12px] text-zinc-500 mt-0.5">Meta OAuth · 공식 비즈니스 API · 안전</div>
                  </div>
                  <span className="text-zinc-400">→</span>
                </button>
                <button onClick={() => setTimeout(next, 350)} className="text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 mt-2">나중에 할게요 (사진 직접 업로드) →</button>
              </div>
            </motion.section>
          )}

          {/* Step 4 - Photo upload */}
          {step === 4 && (
            <motion.section key="s4" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.35 }}>
              <div className="text-[11px] uppercase tracking-widest text-zinc-400 font-semibold">STEP 04</div>
              <h1 className="mt-2 text-3xl sm:text-4xl font-semibold tracking-tight">사진 5~10장만<br />업로드해 주세요</h1>
              <p className="mt-3 text-base text-zinc-600 dark:text-zinc-400">매장·메뉴·공간 사진. BRIQ가 컬러·구도·분위기를 분석합니다.</p>
              <div className="mt-8 rounded-2xl border-2 border-dashed border-zinc-200 dark:border-zinc-800 p-10 text-center hover:border-zinc-900 dark:hover:border-zinc-100 transition cursor-pointer">
                <div className="text-5xl">📷</div>
                <div className="mt-4 text-base font-medium">이곳에 사진을 드롭하거나 클릭</div>
                <div className="mt-1 text-[12px] text-zinc-500">JPG · PNG · HEIC · 최대 20장</div>
              </div>
              <div className="mt-5 grid grid-cols-3 sm:grid-cols-6 gap-2">
                {[
                  "from-amber-200 to-rose-300",
                  "from-violet-300 to-pink-400",
                  "from-amber-300 to-stone-700",
                  "from-slate-300 to-stone-500",
                  "from-amber-100 to-amber-300",
                ].map((g, i) => (
                  <motion.div
                    key={i}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: i * 0.06 }}
                    className={cn("aspect-square rounded-lg bg-gradient-to-br", g)}
                  />
                ))}
                <div className="aspect-square rounded-lg border-2 border-dashed border-zinc-200 dark:border-zinc-700 grid place-items-center text-zinc-400">+</div>
              </div>
              <div className="mt-3 text-[11px] text-zinc-500">업로드된 사진: <b>5장</b> · 최소 충족 ✓</div>
              <div className="mt-10 flex items-center justify-between">
                <button onClick={back} className="text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 inline-flex items-center gap-1"><ChevronLeft className="h-3 w-3" />이전</button>
                <button onClick={next} className="text-sm font-medium px-5 py-2.5 rounded-md bg-zinc-900 text-zinc-50 dark:bg-zinc-100 dark:text-zinc-900">분석 시작 →</button>
              </div>
            </motion.section>
          )}

          {/* Step 5 - AI analysis */}
          {step === 5 && (
            <motion.section key="s5" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.35 }}>
              <div className="text-[11px] uppercase tracking-widest text-zinc-400 font-semibold">STEP 05</div>
              <h1 className="mt-2 text-3xl sm:text-4xl font-semibold tracking-tight">BRIQ가 브랜드를 분석 중...</h1>
              <p className="mt-3 text-base text-zinc-600 dark:text-zinc-400">평균 47초 소요됩니다. 잠시만 기다려 주세요.</p>
              <div className="mt-12 space-y-3">
                {STAGES.map((s, i) => {
                  const done = analysisStep > i;
                  const active = analysisStep === i;
                  return (
                    <motion.div
                      key={s.id}
                      className={cn(
                        "rounded-xl border p-4 flex items-center gap-3 transition-all",
                        done
                          ? "border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/30 dark:bg-emerald-500/5"
                          : active
                          ? "border-violet-200 dark:border-violet-900/40 bg-gradient-to-r from-violet-50/30 to-transparent dark:from-violet-500/5"
                          : "border-zinc-100 dark:border-zinc-800 opacity-50"
                      )}
                    >
                      <div
                        className={cn(
                          "h-8 w-8 rounded-lg grid place-items-center font-bold text-sm",
                          done
                            ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400"
                            : active
                            ? "bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-400"
                            : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400"
                        )}
                      >
                        {done ? <Check className="h-4 w-4" /> : active ? <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>◐</motion.span> : "○"}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium">{s.title}</div>
                        {s.sub && <div className="text-[11px] text-zinc-500 mt-0.5">{s.sub}</div>}
                      </div>
                      {done && <span className="text-[10px] text-emerald-600 font-medium">완료</span>}
                    </motion.div>
                  );
                })}
              </div>
            </motion.section>
          )}

          {/* Step 6 - Results */}
          {step === 6 && (
            <motion.section key="s6" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.4 }}>
              <div className="text-[11px] uppercase tracking-widest text-emerald-600 dark:text-emerald-400 font-semibold">STEP 06 · 분석 완료</div>
              <h1 className="mt-2 text-3xl sm:text-4xl font-semibold tracking-tight">사장님 브랜드,<br /><span className="gradient-text">이렇게 정리됐어요.</span></h1>
              <div className="mt-10 space-y-4">
                <div className="rounded-2xl border border-zinc-100 dark:border-zinc-800 p-6">
                  <div className="text-[11px] uppercase tracking-widest text-zinc-400 font-semibold">브랜드 컬러 (자동 추출)</div>
                  <div className="mt-3 grid grid-cols-6 gap-2">
                    {["#7B2D26", "#E9DCC0", "#2D1810", "#C2A876", "#F4E4C1", "#3E2C20"].map((c, i) => (
                      <motion.div
                        key={c}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: i * 0.05 }}
                        className="aspect-square rounded-lg"
                        style={{ background: c }}
                      />
                    ))}
                  </div>
                </div>
                <div className="rounded-2xl border border-zinc-100 dark:border-zinc-800 p-6">
                  <div className="text-[11px] uppercase tracking-widest text-zinc-400 font-semibold">브랜드 톤 (자동 학습)</div>
                  <div className="mt-3 text-base font-medium leading-relaxed" style={{ fontFamily: "'Nanum Myeongjo', serif" }}>
                    "단정한 존댓말로 한식의 정성과 새벽 시장의 발걸음을 담는 에디토리얼 톤. 직설적 칭찬보다 풍경·계절·재료의 시간을 짧게 끊어 보여준다."
                  </div>
                </div>
              </div>
              <div className="mt-10 flex items-center justify-between">
                <button onClick={back} className="text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100">조정하기</button>
                <button onClick={next} className="text-sm font-medium px-5 py-2.5 rounded-md bg-zinc-900 text-zinc-50 dark:bg-zinc-100 dark:text-zinc-900">완벽해요 → 첫 릴스 만들기</button>
              </div>
            </motion.section>
          )}

          {/* Step 7 - Done */}
          {step === 7 && (
            <motion.section key="s7" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.4 }}>
              <div className="text-[11px] uppercase tracking-widest text-emerald-600 dark:text-emerald-400 font-semibold">STEP 07 · 완료</div>
              <h1 className="mt-2 text-3xl sm:text-4xl font-semibold tracking-tight">첫 릴스가<br />방금 만들어졌어요 ✦</h1>
              <p className="mt-3 text-base text-zinc-600 dark:text-zinc-400">BRIQ가 분석한 톤으로 30초 릴스를 자동 편집했습니다.</p>
              <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                <div className="relative mx-auto w-full" style={{ maxWidth: 280 }}>
                  <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="rounded-[28px] border-[8px] border-zinc-900 dark:border-zinc-700 bg-zinc-900 overflow-hidden shadow-2xl"
                  >
                    <div className="aspect-[9/16] bg-gradient-to-br from-amber-200 via-rose-300 to-amber-400 relative">
                      <div className="absolute top-3 left-3 right-3 flex items-center gap-2 text-white">
                        <div className="h-6 w-6 rounded-full bg-white/20" />
                        <div className="text-[10px] font-medium">our_brand</div>
                      </div>
                      <div className="absolute bottom-24 left-3 right-3 text-white">
                        <div className="text-xl font-bold leading-tight drop-shadow-lg">새벽 4시,<br />시장이 깨어납니다</div>
                      </div>
                    </div>
                  </motion.div>
                </div>
                <div className="space-y-3">
                  <div className="rounded-xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/30 dark:bg-emerald-500/5 p-4">
                    <div className="text-[10px] uppercase tracking-widest text-emerald-700 dark:text-emerald-400 font-semibold">생성된 콘텐츠</div>
                    <ul className="mt-2 space-y-1.5 text-xs">
                      <li className="flex items-center gap-2"><Check className="h-3 w-3 text-emerald-600" />인스타 릴스 30초 (8컷)</li>
                      <li className="flex items-center gap-2"><Check className="h-3 w-3 text-emerald-600" />릴스 캡션 + 해시태그 12개</li>
                      <li className="flex items-center gap-2"><Check className="h-3 w-3 text-emerald-600" />썸네일 1:1 / 9:16</li>
                      <li className="flex items-center gap-2"><Check className="h-3 w-3 text-emerald-600" />카드뉴스 6장 (캐러셀)</li>
                      <li className="flex items-center gap-2"><Check className="h-3 w-3 text-emerald-600" />네이버 블로그 본문 1편</li>
                    </ul>
                  </div>
                </div>
              </div>
              <div className="mt-10 flex items-center justify-end">
                <Link href="/dashboard" className="text-sm font-medium px-6 py-3 rounded-md bg-zinc-900 text-zinc-50 dark:bg-zinc-100 dark:text-zinc-900">
                  대시보드로 들어가기 →
                </Link>
              </div>
            </motion.section>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
