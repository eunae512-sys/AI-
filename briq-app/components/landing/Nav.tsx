"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export function LandingNav() {
  return (
    <nav className="fixed top-0 inset-x-0 z-50 nav-blur bg-white/70 dark:bg-[#0a0a0b]/70 border-b border-zinc-100/70 dark:border-zinc-900/70">
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-md bg-gradient-to-br from-indigo-500 via-violet-600 to-pink-500 grid place-items-center text-white text-xs font-bold">
            B
          </div>
          <span className="text-sm font-semibold tracking-tight">BRIQ</span>
        </Link>
        <div className="hidden md:flex items-center gap-7 text-xs font-medium text-zinc-600 dark:text-zinc-400">
          <a href="#features" className="hover:text-zinc-900 dark:hover:text-zinc-100">
            기능
          </a>
          <a href="#cases" className="hover:text-zinc-900 dark:hover:text-zinc-100">
            고객사례
          </a>
          <Link href="/pricing" className="hover:text-zinc-900 dark:hover:text-zinc-100">
            요금제
          </Link>
          <a href="#faq" className="hover:text-zinc-900 dark:hover:text-zinc-100">
            FAQ
          </a>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 px-3 py-1.5"
          >
            로그인
          </Link>
          <Button asChild size="sm" className="text-xs">
            <Link href="/onboarding">3분 만에 시작</Link>
          </Button>
        </div>
      </div>
    </nav>
  );
}
