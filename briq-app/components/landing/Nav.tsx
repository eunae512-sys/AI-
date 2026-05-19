"use client";

// 매거진 매스트헤드 — Hero 와 톤 일치 (warm ink + paper).
// 그라데이션 B 로고 제거. 로고타입(Cormorant) + 발행호 표기.

import Link from "next/link";
import * as React from "react";
import { INK, INK_SOFT, INK_MUTE, RULE, PAPER } from "@/lib/landing/tokens";

export function LandingNav() {
  return (
    <nav
      className="fixed top-0 inset-x-0 z-50 backdrop-blur-md"
      style={{
        background: "rgba(250, 247, 238, 0.78)", // paper wash 위에 떠 있는 결
        borderBottom: `0.5px solid ${RULE}`,
      }}
    >
      <div className="max-w-[1240px] mx-auto px-6 sm:px-14 h-14 flex items-center justify-between">
        {/* 마스트헤드 — 로고타입 + 작은 호 표기 */}
        <Link href="/" className="flex items-baseline gap-2.5">
          <span
            className="text-[20px] leading-none tracking-[-0.02em]"
            style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 500, color: INK }}
          >
            BRIQ
          </span>
          <span
            className="hidden sm:inline-block text-[9.5px] tracking-[0.22em] uppercase tabular-nums"
            style={{ color: INK_MUTE }}
          >
            Vol. I · MMXXVI
          </span>
        </Link>

        {/* 섹션 anchor — small caps, 헤어라인 결 */}
        <div className="hidden md:flex items-center gap-7 text-[10.5px] tracking-[0.18em] uppercase">
          <a href="#features" style={{ color: INK_SOFT }} className="hover:text-zinc-900 transition-colors">
            Features
          </a>
          <a href="#cases" style={{ color: INK_SOFT }} className="hover:text-zinc-900 transition-colors">
            Cases
          </a>
          <Link href="/pricing" style={{ color: INK_SOFT }} className="hover:text-zinc-900 transition-colors">
            Pricing
          </Link>
          <a href="#faq" style={{ color: INK_SOFT }} className="hover:text-zinc-900 transition-colors">
            FAQ
          </a>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="hidden sm:inline-block text-[11.5px] tracking-[0.12em] uppercase underline underline-offset-[6px] decoration-[0.5px]"
            style={{ color: INK_SOFT, textDecorationColor: RULE }}
          >
            Sign in
          </Link>
          <Link
            href="/onboarding"
            className="inline-flex items-center gap-2 h-9 px-4 text-[10.5px] tracking-[0.18em] uppercase font-medium transition-colors"
            style={{ background: INK, color: PAPER }}
          >
            Begin
            <span aria-hidden className="text-[12px] tracking-normal">→</span>
          </Link>
        </div>
      </div>
    </nav>
  );
}
