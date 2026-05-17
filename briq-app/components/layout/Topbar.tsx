"use client";

import { Search } from "lucide-react";
import { useAssistant } from "@/components/ai-assistant/AssistantProvider";
import { BrandPicker } from "@/components/layout/BrandPicker";
import { SidebarMobileTrigger } from "@/components/layout/Sidebar";

type Props = {
  title: string;
  breadcrumb?: string;
  showBrandPicker?: boolean;
};

export function Topbar({ title, breadcrumb, showBrandPicker = true }: Props) {
  const { open } = useAssistant();
  return (
    <header className="sticky top-0 z-20 border-b border-zinc-200/60 dark:border-zinc-800/60 bg-[color:var(--bg)]/85 backdrop-blur-xl safe-pt">
      <div className="px-3 sm:px-6 h-14 flex items-center gap-3 sm:gap-4">
        <SidebarMobileTrigger />

        <div className="min-w-0 flex-1 sm:flex-initial flex items-baseline gap-2">
          <h1 className="text-[14px] font-medium tracking-tight truncate">
            {title}
          </h1>
          {breadcrumb && (
            <>
              <span className="text-xs text-zinc-300 dark:text-zinc-700 hidden md:inline">/</span>
              <span className="text-xs text-zinc-500 dark:text-zinc-400 truncate hidden md:inline">
                {breadcrumb}
              </span>
            </>
          )}
        </div>

        <div className="ml-auto flex items-center gap-2">
          {showBrandPicker && <BrandPicker />}

          {/* 검색 — Sparkles 제거, 일반 search 아이콘. 톤 절제 */}
          <button
            type="button"
            onClick={open}
            className="hidden lg:inline-flex items-center gap-2 h-8 px-3 text-[12px] rounded-md border border-zinc-200 dark:border-zinc-800 bg-transparent hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors w-48 text-zinc-500"
            aria-label="검색"
          >
            <Search className="h-3.5 w-3.5" />
            <span>검색</span>
            <kbd className="ml-auto text-[10px] tabular-nums text-zinc-400">⌘K</kbd>
          </button>
          <button
            type="button"
            onClick={open}
            className="lg:hidden h-8 w-8 rounded-md border border-zinc-200 dark:border-zinc-800 grid place-items-center text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
            aria-label="검색"
          >
            <Search className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
}
