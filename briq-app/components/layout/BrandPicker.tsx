"use client";

import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronDown, Check } from "lucide-react";
import { useBrand } from "@/components/brand/BrandProvider";
import { cn } from "@/lib/utils";

export function BrandPicker() {
  const { brand, brandId, setBrandId, allBrands } = useBrand();
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-md border border-zinc-200 dark:border-zinc-800 hover:border-zinc-900 dark:hover:border-zinc-100 transition-colors group bg-white dark:bg-zinc-950"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span
          className={cn(
            "h-5 w-5 rounded bg-gradient-to-br grid place-items-center text-white text-[10px] font-bold shrink-0",
            brand.gradient
          )}
        >
          {brand.letter}
        </span>
        <span className="text-xs font-medium truncate max-w-[80px] sm:max-w-[140px]">{brand.name}</span>
        <span className="text-[10px] text-zinc-400 hidden sm:inline">v{brand.toneVersion}</span>
        <ChevronDown className={cn("h-3 w-3 text-zinc-400 transition-transform shrink-0", open && "rotate-180")} />
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
            <div className="px-3 py-2 border-b border-zinc-100 dark:border-zinc-900">
              <div className="text-[10px] uppercase tracking-widest text-zinc-400 font-semibold">
                관리 중인 브랜드 · {allBrands.length}
              </div>
            </div>
            <div className="max-h-80 overflow-y-auto py-1">
              {allBrands.map((b) => {
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
                      <span className="block text-xs font-medium truncate">{b.name}</span>
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
              모든 페이지의 콘텐츠가 선택된 브랜드 기준으로 업데이트됩니다
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
