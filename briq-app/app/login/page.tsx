"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left - form */}
      <div className="flex flex-col px-6 py-10 lg:px-16">
        <Link href="/" className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-md bg-gradient-to-br from-indigo-500 via-violet-600 to-pink-500 grid place-items-center text-white text-xs font-bold">B</div>
          <span className="text-sm font-semibold tracking-tight">BRIQ</span>
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex-1 grid place-items-center"
        >
          <div className="w-full max-w-sm">
            <h1 className="text-2xl font-semibold tracking-tight">사장님, 어서 오세요</h1>
            <p className="mt-1.5 text-sm text-zinc-500">로그인하면 오늘 BRIQ가 만든 콘텐츠를 확인하실 수 있어요.</p>

            <div className="mt-8 space-y-2.5">
              <Button variant="outline" className="w-full justify-center" size="lg">
                <svg className="h-4 w-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.5 12.3c0-.7-.1-1.4-.2-2H12v3.8h5.9c-.3 1.5-1.1 2.7-2.3 3.5v2.9h3.7c2.2-2 3.5-5 3.5-8.2z"/><path fill="#34A853" d="M12 23c3.1 0 5.7-1 7.6-2.8l-3.7-2.9c-1 .7-2.4 1.1-3.9 1.1-3 0-5.5-2-6.4-4.7H1.7v3c1.9 3.8 5.8 6.3 10.3 6.3z"/><path fill="#FBBC04" d="M5.6 13.7c-.2-.7-.4-1.4-.4-2.2s.1-1.5.4-2.2v-3H1.7C.6 8.4 0 10.1 0 12s.6 3.6 1.7 5.7l3.9-3z"/><path fill="#EA4335" d="M12 4.7c1.7 0 3.2.6 4.4 1.8l3.3-3.3C17.7 1.1 15.1 0 12 0 7.5 0 3.6 2.5 1.7 6.3l3.9 3C6.5 6.7 9 4.7 12 4.7z"/></svg>
                Google로 계속하기
              </Button>
              <Button variant="outline" className="w-full justify-center" size="lg">
                <span className="h-4 w-4 rounded grid place-items-center bg-yellow-400 text-stone-900 text-[10px] font-bold">K</span>
                카카오로 계속하기
              </Button>
            </div>

            <div className="my-6 flex items-center gap-3 text-[11px] text-zinc-400">
              <span className="flex-1 h-px bg-zinc-200 dark:bg-zinc-800" />또는<span className="flex-1 h-px bg-zinc-200 dark:bg-zinc-800" />
            </div>

            <form className="space-y-3">
              <div>
                <label className="text-xs font-medium">이메일</label>
                <Input type="email" placeholder="you@example.com" className="mt-1.5" />
              </div>
              <div>
                <label className="text-xs font-medium">비밀번호</label>
                <Input type="password" placeholder="••••••••" className="mt-1.5" />
              </div>
              <Button type="submit" className="w-full" size="lg">
                로그인
              </Button>
            </form>

            <div className="mt-6 text-xs text-zinc-500 text-center">
              아직 계정이 없으신가요?{" "}
              <Link href="/onboarding" className="text-zinc-900 dark:text-zinc-100 font-medium hover:underline">
                3분 만에 시작
              </Link>
            </div>
          </div>
        </motion.div>

        <div className="text-[11px] text-zinc-400 flex justify-between">
          <span>© 2026 BRIQ Inc.</span>
          <div className="flex gap-3"><a className="hover:text-zinc-900 dark:hover:text-zinc-100">개인정보</a><a className="hover:text-zinc-900 dark:hover:text-zinc-100">이용약관</a></div>
        </div>
      </div>

      {/* Right - editorial visual */}
      <div className="hidden lg:flex relative items-center justify-center bg-zinc-50 dark:bg-zinc-950 overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-50 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-violet-500/10 to-pink-500/10" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="relative max-w-md text-center px-10"
        >
          <div className="text-[11px] uppercase tracking-widest gradient-text font-semibold">REVIEWED BY 1,200+ OWNERS</div>
          <blockquote
            className="mt-6 text-2xl font-medium leading-snug"
            style={{ fontFamily: "'Nanum Myeongjo', serif" }}
          >
            "BRIQ 도입 3개월 만에<br />인스타 도달이 5배.<br />단골이 늘었어요."
          </blockquote>
          <div className="mt-6 inline-flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-rose-400 to-orange-400 grid place-items-center text-white font-serif">미</div>
            <div className="text-left">
              <div className="text-sm font-semibold">허은애 대표</div>
              <div className="text-[11px] text-zinc-500">미옥당 본점 · 한정식</div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
