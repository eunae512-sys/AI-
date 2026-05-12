"use client";

import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronDown, Check } from "lucide-react";
import { useBrand } from "@/components/brand/BrandProvider";
import { cn } from "@/lib/utils";

const HIDE_DEMO_KEY = "briq:hide-demo-brands";

export function BrandPicker() {
  const { brand, brandId, setBrandId, allBrands } = useBrand();
  const [open, setOpen] = React.useState(false);
  const [hideDemo, setHideDemo] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // 데모 숨김 설정 동기화
  React.useEffect(() => {
    try {
      setHideDemo(localStorage.getItem(HIDE_DEMO_KEY) === "1");
    } catch {
      // 무시
    }
    const onStorage = (e: StorageEvent) => {
      if (e.key === HIDE_DEMO_KEY) setHideDemo(e.newValue === "1");
    };
    const onCustom = () => {
      try {
        setHideDemo(localStorage.getItem(HIDE_DEMO_KEY) === "1");
      } catch {
        // 무시
      }
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener("briq:hide-demo-updated", onCustom);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("briq:hide-demo-updated", onCustom);
    };
  }, []);

  // 현재 활성 브랜드는 항상 보여줘야 함 (선택은 유지)
  const visibleBrands = React.useMemo(
    () => allBrands.filter((b) => !hideDemo || !b.isDemo || b.id === brandId),
    [allBrands, hideDemo, brandId],
  );

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 sm:gap-2 pl-1.5 pr-2 sm:pl-2.5 sm:pr-2.5 h-9 sm:h-8 rounded-full sm:rounded-md border border-zinc-200/80 dark:border-zinc-800/80 hover:border-zinc-400 dark:hover:border-zinc-600 active:bg-zinc-50 dark:active:bg-zinc-900 transition-colors bg-white dark:bg-zinc-950"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`현재 브랜드: ${brand.name}, 변경하려면 탭하세요`}
      >
        <span
          className={cn(
            "h-6 w-6 sm:h-5 sm:w-5 rounded-full sm:rounded bg-gradient-to-br grid place-items-center text-white text-[11px] sm:text-[10px] font-bold shrink-0",
            brand.gradient,
          )}
        >
          {brand.letter}
        </span>
        <span className="text-xs font-medium truncate max-w-[88px] sm:max-w-[140px] hidden xs:inline sm:inline">
          {brand.name}
        </span>
        <span className="text-[10px] text-zinc-400 hidden md:inline">v{brand.toneVersion}</span>
        <ChevronDown
          className={cn("h-3 w-3 text-zinc-400 transition-transform shrink-0", open && "rotate-180")}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-1.5 w-[min(288px,calc(100vw-24px))] rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-xl z-50 overflow-hidden"
            role="listbox"
          >
            <div className="px-3 py-2 border-b border-zinc-100 dark:border-zinc-900 flex items-center justify-between gap-2">
              <div className="text-[10px] uppercase tracking-widest text-zinc-400 font-semibold">
                관리 중인 브랜드 · {visibleBrands.length}{hideDemo ? ` / ${allBrands.length}` : ""}
              </div>
              <button
                onClick={() => {
                  const next = !hideDemo;
                  setHideDemo(next);
                  try {
                    if (next) localStorage.setItem(HIDE_DEMO_KEY, "1");
                    else localStorage.removeItem(HIDE_DEMO_KEY);
                    window.dispatchEvent(new Event("briq:hide-demo-updated"));
                  } catch {
                    // 무시
                  }
                }}
                className="text-[10px] text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                title="데모 브랜드 숨김 토글"
              >
                {hideDemo ? "데모 보이기" : "데모 숨김"}
              </button>
            </div>
            <div className="max-h-80 overflow-y-auto py-1">
              {visibleBrands.map((b) => {
                const active = b.id === brandId;
                return (
                  <button
                    key={b.id}
                    onClick={() => {
                      setBrandId(b.id);
                      setOpen(false);
                    }}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors",
                      active && "bg-zinc-50 dark:bg-zinc-900"
                    )}
                    role="option"
                    aria-selected={active}
                  >
                    <span
                      className={cn(
                        "h-7 w-7 rounded-md bg-gradient-to-br grid place-items-center text-white text-[11px] font-bold shrink-0",
                        b.gradient
                      )}
                    >
                      {b.letter}
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="flex items-center gap-1.5 truncate">
                        <span className="text-xs font-medium truncate">{b.name}</span>
                        {b.isDemo && (
                          <span className="text-[9px] uppercase tracking-wider px-1 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-500 font-semibold shrink-0">
                            데모
                          </span>
                        )}
                      </span>
                      <span className="block text-[10px] text-zinc-500 truncate">
                        {b.industryLabel} · 톤 v{b.toneVersion} · {b.campaign}
                      </span>
                    </span>
                    {active && <Check className="h-3.5 w-3.5 text-zinc-900 dark:text-zinc-100 shrink-0" />}
                  </button>
                );
              })}
            </div>
            <div className="px-3 py-2 border-t border-zinc-100 dark:border-zinc-900 text-[10px] text-zinc-500">
              데모는 BRIQ가 미리 만든 예시 브랜드입니다. 사장님 브랜드는 온보딩으로 추가하세요.
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
