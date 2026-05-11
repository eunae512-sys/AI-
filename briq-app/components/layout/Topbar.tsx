"use client";

import { Search, Sparkles } from "lucide-react";
import { useAssistant } from "@/components/ai-assistant/AssistantProvider";
import { BrandPicker } from "@/components/layout/BrandPicker";
import { SidebarMobileTrigger } from "@/components/layout/Sidebar";
import { Button } from "@/components/ui/button";

type Props = {
  title: string;
  breadcrumb?: string;
  showBrandPicker?: boolean;
};

export function Topbar({ title, breadcrumb, showBrandPicker = true }: Props) {
  const { open } = useAssistant();
  return (
    <header className="sticky top-0 z-20 border-b border-zinc-200/60 dark:border-zinc-800/60 bg-white/75 dark:bg-zinc-950/75 backdrop-blur-xl safe-pt">
      <div className="px-3 sm:px-6 h-14 sm:h-14 flex items-center gap-2 sm:gap-4">
        <SidebarMobileTrigger />

        <div className="min-w-0 flex-1 sm:flex-initial flex items-baseline gap-2">
          <h1 className="text-[15px] sm:text-sm font-semibold tracking-tight truncate">
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

        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          {showBrandPicker && <BrandPicker />}
          <button
            type="button"
            className="hidden lg:inline-flex items-center gap-2 px-3 py-1.5 text-xs rounded-md bg-zinc-100 dark:bg-zinc-900 border border-transparent hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors w-44"
            onClick={open}
          >
            <Search className="h-3.5 w-3.5 text-zinc-400" />
            <span className="text-zinc-500">검색</span>
            <kbd className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-500">
              ⌘K
            </kbd>
          </button>
          <Button
            size="sm"
            onClick={open}
            className="text-xs px-2.5 sm:px-3"
            aria-label="AI Assistant"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Assistant</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
