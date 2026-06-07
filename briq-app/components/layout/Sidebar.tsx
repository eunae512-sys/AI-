"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { Menu, X } from "lucide-react";
import { navGroups, SETTINGS_ITEM } from "@/lib/nav";
import { ThemeToggle } from "./ThemeToggle";
import { BrandSwitcher } from "./BrandSwitcher";
import { cn } from "@/lib/utils";
import { useBrand } from "@/components/brand/BrandProvider";

const badgeColor = {
  amber: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
  rose: "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300",
  sky: "bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300",
  emerald: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
};

type SidebarBodyProps = {
  pathname: string;
  onNavigate?: () => void;
  variant: "desktop" | "mobile";
};

function SidebarBody({ pathname, onNavigate, variant }: SidebarBodyProps) {
  const SettingsIcon = SETTINGS_ITEM.icon;
  const settingsActive = pathname.startsWith(SETTINGS_ITEM.href);
  const { userBrand } = useBrand();

  // 실 사장님: 온보딩 마친 ownerName, 데모 사용자: 기본 이름
  const displayName = userBrand?.ownerName?.trim() || (userBrand ? "사장님" : "허은애");
  const initial = displayName.charAt(0) || "사";

  return (
    <>
      {/* 매거진 마스트헤드 — gradient 박스 제거, 잉크 한 글자 */}
      <Link
        href="/dashboard"
        onClick={onNavigate}
        className="px-5 py-5 flex items-baseline gap-2 border-b border-zinc-100 dark:border-zinc-900"
      >
        <span
          className="text-[18px] tracking-[-0.02em] font-medium text-zinc-900 dark:text-zinc-100"
          style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 600 }}
        >
          BRIQ
        </span>
        <span className="ml-auto text-[10px] tracking-[0.15em] uppercase text-zinc-400">
          v0.3
        </span>
      </Link>

      <nav className="flex-1 px-3 py-3 overflow-y-auto">
        {navGroups.map((group, gi) => (
          <div key={gi} className="mb-1">
            {group.title && (
              <div className="px-2.5 pt-3 pb-1.5 text-[10px] uppercase tracking-widest text-zinc-400 dark:text-zinc-600 font-semibold">
                {group.title}
              </div>
            )}
            {group.items.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  className={cn(
                    "relative flex items-center gap-2.5 px-2.5 py-2.5 md:py-2 rounded-md text-[13px] md:text-[12.5px] font-medium transition-colors",
                    active
                      ? "bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-50"
                      : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100/70 dark:hover:bg-zinc-900/70 hover:text-zinc-900 dark:hover:text-zinc-100",
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId={`nav-indicator-${variant}`}
                      className="absolute left-0 top-1/2 -translate-y-1/2 h-3.5 w-px bg-zinc-900 dark:bg-zinc-100"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                  <Icon className="h-3.5 w-3.5 opacity-60" />
                  <span className="flex-1">{item.label}</span>
                  {item.badge && (
                    <span
                      className={cn(
                        "ml-auto text-[10px] tabular-nums px-1.5 py-px rounded font-medium",
                        badgeColor[item.badge.tone],
                      )}
                    >
                      {item.badge.count}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* 사용자 + 설정 톱니 + 테마 — Settings 는 메뉴 줄 차지 않고 여기서만 진입 */}
      <div className="border-t border-zinc-100 dark:border-zinc-900 p-3 flex items-center gap-2.5">
        <div className="h-7 w-7 rounded-full bg-zinc-200 dark:bg-zinc-800 shrink-0 grid place-items-center text-[10px] text-zinc-500">
          {initial}
        </div>
        <div className="flex-1 min-w-0 flex flex-col gap-1">
          <div className="text-[12px] font-medium truncate">{displayName}</div>
          <BrandSwitcher onNavigate={onNavigate} />
        </div>
        <Link
          href={SETTINGS_ITEM.href}
          onClick={onNavigate}
          aria-label="설정"
          title="설정"
          className={cn(
            "h-7 w-7 grid place-items-center rounded-md transition-colors",
            settingsActive
              ? "text-zinc-900 dark:text-zinc-100 bg-zinc-100 dark:bg-zinc-900"
              : "text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100/70 dark:hover:bg-zinc-900/70",
          )}
        >
          <SettingsIcon className="h-3.5 w-3.5" />
        </Link>
        <ThemeToggle />
      </div>
    </>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  React.useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  React.useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [mobileOpen]);

  React.useEffect(() => {
    const handler = () => setMobileOpen(true);
    window.addEventListener("briq:open-sidebar", handler);
    return () => window.removeEventListener("briq:open-sidebar", handler);
  }, []);

  return (
    <>
      <aside className="hidden md:flex w-60 shrink-0 flex-col border-r border-zinc-100 dark:border-zinc-900 bg-zinc-50/40 dark:bg-zinc-950/50 sticky top-0 h-screen">
        <SidebarBody pathname={pathname} variant="desktop" />
      </aside>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="md:hidden fixed inset-0 bg-black/55 backdrop-blur-sm z-40"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "tween", duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
              className="md:hidden fixed top-0 left-0 bottom-0 z-50 w-[82vw] max-w-[320px] flex flex-col bg-white dark:bg-zinc-950 rounded-r-2xl shadow-[8px_0_40px_-8px_rgba(0,0,0,0.25)] safe-pt safe-pb"
            >
              <button
                onClick={() => setMobileOpen(false)}
                className="absolute top-4 right-3 h-9 w-9 grid place-items-center rounded-full text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-900 z-10 transition-colors"
                aria-label="메뉴 닫기"
              >
                <X className="h-4 w-4" />
              </button>
              <SidebarBody pathname={pathname} variant="mobile" onNavigate={() => setMobileOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

export function SidebarMobileTrigger() {
  const open = () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("briq:open-sidebar"));
    }
  };
  return (
    <button
      onClick={open}
      className="md:hidden p-2 -ml-2 rounded-md text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900"
      aria-label="메뉴 열기"
    >
      <Menu className="h-4 w-4" />
    </button>
  );
}
