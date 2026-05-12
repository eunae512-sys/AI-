"use client";

import { Sparkles } from "lucide-react";
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

          {/* 검색 + AI 어시스턴트 단일 컨트롤 — 반응형
              lg+ : 검색바 모양 (Sparkles 아이콘 + 한 줄 안내 + ⌘K)
              < lg : Sparkles 아이콘 버튼만
              두 형태 모두 같은 open() 호출 — 같은 패널 */}
          <button
            type="button"
            onClick={open}
            className="hidden lg:inline-flex items-center gap-2 px-3 py-1.5 text-xs rounded-md bg-zinc-100 dark:bg-zinc-900 border border-transparent hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors w-56"
            aria-label="검색 또는 AI 어시스턴트 열기"
          >
            <Sparkles className="h-3.5 w-3.5 text-violet-500" />
            <span className="text-zinc-500">검색 또는 AI 요청</span>
            <kbd className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-500">
              ⌘K
            </kbd>
          </button>
          <Button
            size="sm"
            onClick={open}
            className="lg:hidden text-xs px-2.5 sm:px-3"
            aria-label="검색 또는 AI 어시스턴트 열기"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">AI</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
