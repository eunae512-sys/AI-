"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { Home, FileImage, Film, CheckCircle2, Menu, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type Tab = { href: string; icon: LucideIcon; label: string };

const TABS: Tab[] = [
  { href: "/dashboard", icon: Home, label: "홈" },
  { href: "/cardnews", icon: FileImage, label: "카드뉴스" },
  { href: "/reels", icon: Film, label: "릴스" },
  { href: "/review-queue", icon: CheckCircle2, label: "검토" },
];

export function MobileBottomNav() {
  const pathname = usePathname();

  const openSidebar = () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("briq:open-sidebar"));
    }
  };

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  return (
    <nav
      className="md:hidden fixed inset-x-0 bottom-0 z-30"
      aria-label="모바일 하단 네비게이션"
    >
      {/* Edge blur — content fades behind nav */}
      <div
        className="absolute inset-x-0 -top-4 h-4 pointer-events-none bg-gradient-to-b from-transparent to-white/60 dark:to-zinc-950/60"
        aria-hidden
      />
      <div className="bg-white/85 dark:bg-zinc-950/85 backdrop-blur-2xl border-t border-zinc-200/60 dark:border-zinc-800/60 safe-pb">
        <ul className="grid grid-cols-5 px-1 pt-1.5">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = isActive(t.href);
            return (
              <li key={t.href} className="relative">
                <Link
                  href={t.href}
                  className={cn(
                    "relative flex flex-col items-center justify-center gap-1 h-14 rounded-xl transition-colors",
                    active
                      ? "text-zinc-900 dark:text-zinc-50"
                      : "text-zinc-400 dark:text-zinc-500 active:text-zinc-700 dark:active:text-zinc-300",
                  )}
                  aria-current={active ? "page" : undefined}
                >
                  {active && (
                    <motion.span
                      layoutId="mobile-nav-pill"
                      className="absolute inset-1 rounded-xl bg-zinc-100 dark:bg-zinc-900"
                      transition={{ type: "spring", stiffness: 400, damping: 34 }}
                    />
                  )}
                  <span className="relative z-10 flex flex-col items-center gap-1">
                    <Icon
                      className={cn(
                        "h-5 w-5 transition-all",
                        active ? "stroke-[2.25]" : "stroke-[1.75]",
                      )}
                    />
                    <span
                      className={cn(
                        "text-[10px] tracking-tight",
                        active ? "font-semibold" : "font-medium",
                      )}
                    >
                      {t.label}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
          <li>
            <button
              type="button"
              onClick={openSidebar}
              className="w-full flex flex-col items-center justify-center gap-1 h-14 rounded-xl text-zinc-400 dark:text-zinc-500 active:text-zinc-700 dark:active:text-zinc-300 active:bg-zinc-100 dark:active:bg-zinc-900 transition-colors"
              aria-label="전체 메뉴 열기"
            >
              <Menu className="h-5 w-5 stroke-[1.75]" />
              <span className="text-[10px] font-medium tracking-tight">더보기</span>
            </button>
          </li>
        </ul>
      </div>
    </nav>
  );
}
