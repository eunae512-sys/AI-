"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, FileImage, Film, CheckCircle2, Menu } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS: { href: string; icon: typeof Home; label: string }[] = [
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

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-white/95 dark:bg-zinc-950/95 border-t border-zinc-200 dark:border-zinc-800 backdrop-blur-md safe-pb"
      aria-label="모바일 하단 네비게이션"
    >
      <ul className="grid grid-cols-5">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = pathname === t.href || pathname.startsWith(t.href + "/");
          return (
            <li key={t.href}>
              <Link
                href={t.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 h-14 text-[10px] font-medium transition-colors",
                  active
                    ? "text-zinc-900 dark:text-zinc-50"
                    : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100",
                )}
              >
                <Icon className={cn("h-5 w-5", active && "stroke-[2.5]")} />
                <span>{t.label}</span>
                {active && (
                  <span className="absolute top-0 h-0.5 w-8 rounded-b-full bg-gradient-to-r from-indigo-500 to-pink-500" />
                )}
              </Link>
            </li>
          );
        })}
        <li>
          <button
            type="button"
            onClick={openSidebar}
            className="w-full flex flex-col items-center justify-center gap-0.5 h-14 text-[10px] font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
            aria-label="전체 메뉴 열기"
          >
            <Menu className="h-5 w-5" />
            <span>더보기</span>
          </button>
        </li>
      </ul>
    </nav>
  );
}
