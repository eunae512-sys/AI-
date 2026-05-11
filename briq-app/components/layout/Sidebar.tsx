"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { Menu, X } from "lucide-react";
import { navGroups } from "@/lib/nav";
import { ThemeToggle } from "./ThemeToggle";
import { cn } from "@/lib/utils";

const badgeColor = {
  amber: "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
  rose: "bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300",
  sky: "bg-sky-100 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300",
  emerald: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
};

type SidebarBodyProps = {
  pathname: string;
  onNavigate?: () => void;
  variant: "desktop" | "mobile";
};

function SidebarBody({ pathname, onNavigate, variant }: SidebarBodyProps) {
  return (
    <>
      <Link
        href="/dashboard"
        onClick={onNavigate}
        className="px-5 py-5 flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-900"
      >
        <div className="h-7 w-7 rounded-md bg-gradient-to-br from-indigo-500 via-violet-600 to-pink-500 grid place-items-center text-white text-xs font-bold">
          B
        </div>
        <span className="text-sm font-semibold tracking-tight">BRIQ</span>
        <span className="ml-auto text-[10px] px-1.5 py-px rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400">
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
                    "relative flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors",
                    active
                      ? "bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-50 shadow-sm"
                      : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-zinc-100",
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId={`nav-indicator-${variant}`}
                      className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-0.5 rounded-full bg-gradient-to-b from-indigo-500 to-pink-500"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                  <Icon className="h-3.5 w-3.5 opacity-70" />
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

      <div className="border-t border-zinc-100 dark:border-zinc-900 p-3 flex items-center gap-2.5">
        <div className="h-7 w-7 rounded-full bg-gradient-to-br from-amber-400 to-rose-500 shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="text-xs font-medium truncate">허은애</div>
          <div className="text-[10px] text-zinc-500 dark:text-zinc-500 truncate">미옥당 외 5</div>
        </div>
        <ThemeToggle />
      </div>
    </>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  // Close drawer on route change
  React.useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Lock body scroll while drawer open
  React.useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [mobileOpen]);

  // Expose open trigger via custom event (Topbar will dispatch)
  React.useEffect(() => {
    const handler = () => setMobileOpen(true);
    window.addEventListener("briq:open-sidebar", handler);
    return () => window.removeEventListener("briq:open-sidebar", handler);
  }, []);

  return (
    <>
      {/* Desktop */}
      <aside className="hidden md:flex w-60 shrink-0 flex-col border-r border-zinc-100 dark:border-zinc-900 bg-zinc-50/40 dark:bg-zinc-950/50 sticky top-0 h-screen">
        <SidebarBody pathname={pathname} variant="desktop" />
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="md:hidden fixed inset-0 bg-black/50 z-40"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "tween", duration: 0.25 }}
              className="md:hidden fixed top-0 left-0 bottom-0 z-50 w-72 flex flex-col bg-white dark:bg-zinc-950 border-r border-zinc-100 dark:border-zinc-900 shadow-2xl"
            >
              <button
                onClick={() => setMobileOpen(false)}
                className="absolute top-4 right-3 p-2 rounded-md text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-900 z-10"
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
