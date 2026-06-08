"use client";

// 로그인 — 매거진 결. 좌측 폼, 우측 후기 인쇄면.
// 컬러 시스템: lib/landing/tokens 공유.
//
// 데모 동작:
//   · 저장된 사용자 브랜드(localStorage) 가 있으면 /dashboard
//   · 없으면 /onboarding 으로 자동 진행 (SSO·이메일 동일)
//   · 클릭 시 즉시 시각 피드백(busy → 이동) 으로 "아무 일도 안 일어남" 방지

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { loadUserBrand } from "@/lib/brand/user-brand";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import { INK, INK_SOFT, INK_MUTE, RULE, RULE_SOFT, PAPER, SERIF_LATIN, SERIF_HANGUL } from "@/lib/landing/tokens";

const fade = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
};

type Provider = "google" | "kakao" | "email";

export default function LoginPage() {
  const router = useRouter();
  const [busy, setBusy] = React.useState<Provider | null>(null);
  const [authError, setAuthError] = React.useState<string | null>(null);
  const [nextPath, setNextPath] = React.useState<string | null>(null);

  // URL 의 ?error= 표시 + ?next= 보존
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const err = params.get("error");
    if (err) setAuthError(err);
    const nx = params.get("next");
    if (nx && nx.startsWith("/")) setNextPath(nx);
  }, []);

  // 1) Supabase 환경변수 있으면 진짜 OAuth (Google · Kakao)
  // 2) 없으면 데모 흐름 (저장된 브랜드 → /dashboard, 신규 → /onboarding)
  const route = React.useCallback(
    async (provider: Provider) => {
      if (busy) return;
      setBusy(provider);
      setAuthError(null);

      // ── 진짜 OAuth ──
      if (provider === "google" || provider === "kakao") {
        const supabase = getSupabaseBrowser();
        if (supabase) {
          const existing = loadUserBrand();
          // ?next= 가 있으면 그 곳으로 (예: /billing/start?plan=pro).
          // 없으면 기존 브랜드 유무에 따라 dashboard / onboarding.
          const next = nextPath ?? (existing ? "/dashboard" : "/onboarding");
          const redirectTo = `${window.location.origin}/api/auth/callback?next=${encodeURIComponent(next)}`;
          const { error } = await supabase.auth.signInWithOAuth({
            provider,
            options: {
              redirectTo,
              // 카카오는 'account_email profile_nickname profile_image' 권한
              scopes: provider === "kakao" ? "account_email profile_nickname profile_image" : undefined,
            },
          });
          if (error) {
            setAuthError(`로그인 실패 — ${error.message}`);
            setBusy(null);
          }
          // 정상 케이스: supabase 가 외부 OAuth 화면으로 리다이렉트 → callback 으로 복귀
          return;
        }
        // env 미설정 시 데모 fallback
      }

      // ── 데모 fallback (email 또는 env 미설정 SSO) ──
      await new Promise((r) => setTimeout(r, 220));
      const existing = loadUserBrand();
      router.push(nextPath ?? (existing ? "/dashboard" : "/onboarding"));
    },
    [busy, router, nextPath],
  );

  const onSubmitEmail = (e: React.FormEvent) => {
    e.preventDefault();
    route("email");
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2" style={{ background: PAPER }}>
      {/* ── Left · 폼 ─────────────────────────────────────────────── */}
      <div className="flex flex-col px-6 sm:px-14 lg:px-20 py-10 lg:py-16">
        <Link href="/" className="flex items-baseline gap-2.5">
          <span
            className="text-[22px] leading-none tracking-[-0.02em]"
            style={{ fontFamily: SERIF_LATIN, fontWeight: 500, color: INK }}
          >
            BRIQ
          </span>
          <span
            className="text-[9.5px] tracking-[0.22em] uppercase tabular-nums"
            style={{ color: INK_MUTE }}
          >
            Vol. I · MMXXVI
          </span>
        </Link>

        <motion.div
          {...fade}
          transition={{ duration: 0.6 }}
          className="flex-1 grid place-items-center mt-10 lg:mt-0"
        >
          <div className="w-full max-w-[420px]">
            {/* Eyebrow */}
            <div
              className="text-[10.5px] tracking-[0.22em] uppercase italic"
              style={{ color: INK_MUTE, fontFamily: SERIF_LATIN }}
            >
              Sign in · 다시 오신 것을 환영합니다
            </div>

            {/* next 가 결제 시작이면 사용자 컨텍스트 안내 */}
            {nextPath && nextPath.startsWith("/billing/start") && (
              <div
                className="mt-3 inline-flex items-center gap-2 text-[11.5px] px-3 py-1.5"
                style={{
                  border: `0.5px solid ${INK}`,
                  background: "rgba(20,19,15,0.04)",
                  color: INK_SOFT,
                  fontFamily: SERIF_HANGUL,
                }}
              >
                <span style={{ color: INK_MUTE }}>1단계 / 2</span>
                <span>가입(또는 로그인) 후 결제수단을 등록합니다.</span>
              </div>
            )}

            {/* Display */}
            <h1
              className="mt-4 text-[40px] sm:text-[52px] leading-[1.02] tracking-[-0.025em]"
              style={{ fontFamily: SERIF_LATIN, fontWeight: 400, color: INK }}
            >
              사장님,{" "}
              <em style={{ fontStyle: "italic" }}>어서 오세요.</em>
            </h1>
            <p
              className="mt-4 text-[14.5px] leading-[1.7] max-w-[360px]"
              style={{ fontFamily: SERIF_HANGUL, color: INK_SOFT }}
            >
              로그인하면 오늘 BRIQ 가 만든 콘텐츠를 확인하실 수 있어요.
            </p>

            {/* OAuth callback 실패 알림 */}
            {authError && (
              <div
                className="mt-7 px-4 py-3 text-[12px] leading-relaxed"
                style={{
                  border: `0.5px solid ${INK}`,
                  background: "rgba(20,19,15,0.04)",
                  color: INK,
                  fontFamily: SERIF_HANGUL,
                }}
              >
                <div
                  className="text-[10px] tracking-[0.22em] uppercase italic mb-1"
                  style={{ color: INK_MUTE, fontFamily: SERIF_LATIN }}
                >
                  Sign in error
                </div>
                {authError}
              </div>
            )}

            {/* SSO — 헤어라인 outlined */}
            <div className="mt-9 space-y-2.5">
              <button
                type="button"
                onClick={() => route("google")}
                disabled={busy !== null}
                className="w-full inline-flex items-center justify-center gap-3 h-12 px-5 text-[13px] transition-colors hover:bg-[rgba(20,19,15,0.035)] disabled:opacity-60"
                style={{ border: `0.5px solid ${INK}`, color: INK, fontFamily: SERIF_HANGUL }}
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.5 12.3c0-.7-.1-1.4-.2-2H12v3.8h5.9c-.3 1.5-1.1 2.7-2.3 3.5v2.9h3.7c2.2-2 3.5-5 3.5-8.2z"/><path fill="#34A853" d="M12 23c3.1 0 5.7-1 7.6-2.8l-3.7-2.9c-1 .7-2.4 1.1-3.9 1.1-3 0-5.5-2-6.4-4.7H1.7v3c1.9 3.8 5.8 6.3 10.3 6.3z"/><path fill="#FBBC04" d="M5.6 13.7c-.2-.7-.4-1.4-.4-2.2s.1-1.5.4-2.2v-3H1.7C.6 8.4 0 10.1 0 12s.6 3.6 1.7 5.7l3.9-3z"/><path fill="#EA4335" d="M12 4.7c1.7 0 3.2.6 4.4 1.8l3.3-3.3C17.7 1.1 15.1 0 12 0 7.5 0 3.6 2.5 1.7 6.3l3.9 3C6.5 6.7 9 4.7 12 4.7z"/></svg>
                {busy === "google" ? "이동 중…" : "Google 로 계속하기"}
              </button>
              <button
                type="button"
                onClick={() => route("kakao")}
                disabled={busy !== null}
                className="w-full inline-flex items-center justify-center gap-3 h-12 px-5 text-[13px] transition-colors hover:bg-[rgba(20,19,15,0.035)] disabled:opacity-60"
                style={{ border: `0.5px solid ${INK}`, color: INK, fontFamily: SERIF_HANGUL }}
              >
                <span
                  className="h-4 w-4 rounded-sm grid place-items-center text-[9.5px] font-bold"
                  style={{ background: "#FAE100", color: "#3C1E1E" }}
                  aria-hidden
                >
                  K
                </span>
                {busy === "kakao" ? "이동 중…" : "카카오로 계속하기"}
              </button>
            </div>

            {/* Divider */}
            <div className="my-7 flex items-center gap-3">
              <span className="flex-1 h-px" style={{ background: RULE }} />
              <span
                className="text-[10.5px] tracking-[0.22em] uppercase italic"
                style={{ color: INK_MUTE, fontFamily: SERIF_LATIN }}
              >
                or
              </span>
              <span className="flex-1 h-px" style={{ background: RULE }} />
            </div>

            {/* Email form — 헤어라인 underline 입력 */}
            <form className="space-y-5" onSubmit={onSubmitEmail}>
              <Field label="이메일" type="email" placeholder="you@example.com" />
              <Field label="비밀번호" type="password" placeholder="••••••••" />
              <button
                type="submit"
                disabled={busy !== null}
                className="w-full inline-flex items-center justify-center gap-3 h-12 text-[12.5px] tracking-[0.18em] uppercase font-medium transition-colors disabled:opacity-60"
                style={{ background: INK, color: PAPER }}
              >
                {busy === "email" ? "이동 중…" : "로그인"}
                <span aria-hidden className="text-[14px] tracking-normal">→</span>
              </button>
            </form>

            <div
              className="mt-7 text-[12.5px] text-center"
              style={{ color: INK_SOFT, fontFamily: SERIF_HANGUL }}
            >
              아직 계정이 없으신가요?{" "}
              <Link
                href="/onboarding"
                className="underline underline-offset-[6px] decoration-[0.5px]"
                style={{ color: INK, textDecorationColor: RULE }}
              >
                3분 만에 시작
              </Link>
            </div>
          </div>
        </motion.div>

        <div
          className="text-[10.5px] tracking-[0.18em] uppercase italic flex flex-col sm:flex-row sm:justify-between gap-2 pt-6"
          style={{ color: INK_MUTE, fontFamily: SERIF_LATIN, borderTop: `0.5px solid ${RULE}` }}
        >
          <span>© BRIQ MMXXVI</span>
          {/* 실제 법적 페이지로 연결 — 한글은 italic/uppercase 금지(철칙) → not-italic·normal-case */}
          <div className="flex gap-5 not-italic normal-case" style={{ letterSpacing: "0.02em" }}>
            <Link href="/privacy" className="hover:opacity-100">개인정보처리방침</Link>
            <Link href="/terms" className="hover:opacity-100">이용약관</Link>
          </div>
        </div>
      </div>

      {/* ── Right · 매거진 후기 인쇄면 ────────────────────────────── */}
      <aside
        className="hidden lg:flex relative flex-col justify-between p-16 xl:p-20"
        style={{ background: "rgba(20,19,15,0.025)", borderLeft: `0.5px solid ${RULE}` }}
      >
        {/* Top folio */}
        <div className="flex items-baseline justify-between">
          <div className="text-[10.5px] tracking-[0.22em] uppercase italic" style={{ color: INK_MUTE, fontFamily: SERIF_LATIN }}>
            — Field Note · An Owner&apos;s Voice
          </div>
          <div className="text-[10.5px] tracking-[0.22em] uppercase tabular-nums" style={{ color: INK_MUTE, fontFamily: SERIF_LATIN }}>
            № 003
          </div>
        </div>

        {/* Pull-quote */}
        <motion.div
          {...fade}
          transition={{ duration: 0.8, delay: 0.15 }}
          className="max-w-[520px]"
        >
          <span
            aria-hidden
            className="block text-[80px] leading-none -mb-6 -ml-2"
            style={{ fontFamily: SERIF_LATIN, fontStyle: "italic", color: RULE_SOFT, fontWeight: 400 }}
          >
            “
          </span>
          <blockquote
            className="text-[32px] xl:text-[40px] leading-[1.18] tracking-[-0.015em]"
            style={{ fontFamily: SERIF_HANGUL, color: INK, fontWeight: 400 }}
          >
            BRIQ 도입 <em className="not-italic tabular-nums" style={{ fontFamily: SERIF_LATIN, color: INK }}>3개월</em> 만에
            인스타 도달이 <em className="not-italic" style={{ fontFamily: SERIF_LATIN, color: INK, fontStyle: "italic" }}>다섯 배</em>.{" "}
            단골이 늘었어요.
          </blockquote>

          {/* Byline */}
          <div className="mt-10 flex items-baseline gap-4">
            <div
              className="h-12 w-12 rounded-full grid place-items-center text-[15px]"
              style={{ background: PAPER, border: `0.5px solid ${INK}`, color: INK, fontFamily: SERIF_LATIN, fontStyle: "italic" }}
              aria-hidden
            >
              미
            </div>
            <div>
              <div
                className="text-[15px]"
                style={{ fontFamily: SERIF_HANGUL, color: INK, fontWeight: 500 }}
              >
                허은애 대표
              </div>
              <div
                className="mt-0.5 text-[11px] tracking-[0.04em]"
                style={{ color: INK_SOFT, fontFamily: SERIF_LATIN, fontStyle: "italic" }}
              >
                미옥당 본점 · 한정식 · Seoul
              </div>
            </div>
          </div>
        </motion.div>

        {/* Bottom meta */}
        <div className="flex items-baseline justify-between text-[10.5px] tracking-[0.22em] uppercase italic" style={{ color: INK_MUTE, fontFamily: SERIF_LATIN }}>
          <span>Reviewed by 1,200+ owners</span>
          <span>Issued from Seoul · MMXXVI</span>
        </div>
      </aside>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 헤어라인 underline 입력
// ─────────────────────────────────────────────────────────────
function Field({ label, type, placeholder }: { label: string; type: string; placeholder: string }) {
  return (
    <div>
      <label
        className="block text-[10.5px] tracking-[0.22em] uppercase italic"
        style={{ color: INK_MUTE, fontFamily: SERIF_LATIN }}
      >
        {label}
      </label>
      <input
        type={type}
        placeholder={placeholder}
        className="mt-1.5 w-full h-10 px-0 bg-transparent text-[14.5px] outline-none transition-colors"
        style={{
          borderBottom: `0.5px solid ${INK}`,
          color: INK,
          fontFamily: SERIF_HANGUL,
        }}
      />
    </div>
  );
}
