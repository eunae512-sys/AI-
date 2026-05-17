"use client";

// /contact — Agency 플랜 도입 문의 페이지
// 가격 페이지 "도입 문의" CTA 가 가던 404 를 메우는 단순 1페이지.

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { LandingNav } from "@/components/landing/Nav";

export default function ContactPage() {
  const params = useSearchParams();
  const plan = params.get("plan") ?? "";
  const [orgName, setOrgName] = React.useState("");
  const [orgSize, setOrgSize] = React.useState("");
  const [memo, setMemo] = React.useState("");
  const [submitted, setSubmitted] = React.useState(false);

  const subject = plan === "agency" ? "Agency 플랜 도입 문의" : "BRIQ 도입 문의";
  const mailtoHref = React.useMemo(() => {
    const lines = [
      `기관/대행사명: ${orgName || "(미입력)"}`,
      `규모: ${orgSize || "(미입력)"}`,
      `메모:`,
      memo || "(없음)",
    ].join("\n");
    return `mailto:hello@briq.kr?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines)}`;
  }, [orgName, orgSize, memo, subject]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    window.location.href = mailtoHref;
    setSubmitted(true);
  };

  return (
    <>
      <LandingNav />
      <main className="pt-20 bg-[color:var(--bg)] min-h-screen">
        <section className="max-w-[720px] mx-auto px-5 sm:px-10 md:px-14 pt-12 sm:pt-16 pb-16">
          <div className="editorial-label">Contact · 도입 문의</div>
          <h1
            className="mt-4 text-[36px] sm:text-[52px] md:text-[60px] leading-[0.98] tracking-[-0.02em]"
            style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 500 }}
          >
            대행사·다점포 도입,<br />
            <em style={{ fontStyle: "italic" }}>상담부터 시작합니다.</em>
          </h1>
          <p className="mt-5 text-[14.5px] leading-[1.7] text-zinc-600 dark:text-zinc-400">
            10인 이상 대행사·다점포 사장님·프랜차이즈 본부 도입 문의는 직접 응대해드립니다.
            {plan === "agency" && (
              <span className="block mt-2 text-zinc-500">
                선택하신 플랜: <span className="text-zinc-900 dark:text-zinc-100 font-medium">Agency</span>
              </span>
            )}
          </p>

          <form onSubmit={onSubmit} className="mt-10 space-y-5">
            <div>
              <label className="text-[12px] font-semibold text-zinc-700 dark:text-zinc-300">
                기관/대행사 이름
              </label>
              <input
                type="text"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                placeholder="예: OO마케팅 / OO프랜차이즈"
                className="mt-1.5 w-full h-11 px-3 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-100"
              />
            </div>
            <div>
              <label className="text-[12px] font-semibold text-zinc-700 dark:text-zinc-300">
                팀 규모 / 관리 가게 수
              </label>
              <input
                type="text"
                value={orgSize}
                onChange={(e) => setOrgSize(e.target.value)}
                placeholder="예: 직원 12명 · 클라이언트 25개 가게"
                className="mt-1.5 w-full h-11 px-3 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-100"
              />
            </div>
            <div>
              <label className="text-[12px] font-semibold text-zinc-700 dark:text-zinc-300">
                전달하실 내용 (선택)
              </label>
              <textarea
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                placeholder="구체적인 도입 시점·예산·우려 사항이 있으면 적어주세요"
                rows={5}
                className="mt-1.5 w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-100 resize-none"
              />
            </div>
            <button
              type="submit"
              className="w-full h-12 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-[13px] tracking-[0.1em] uppercase font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
            >
              이메일로 문의 보내기 →
            </button>
            {submitted && (
              <p className="text-[12px] text-emerald-700 dark:text-emerald-400 text-center">
                메일 앱이 열렸어요. 보내주시면 영업일 1일 안에 회신드립니다.
              </p>
            )}
          </form>

          <div className="mt-12 pt-8 border-t border-zinc-200 dark:border-zinc-800 text-[12.5px] text-zinc-500 leading-[1.8]">
            <div className="editorial-label mb-3">또 다른 연락 방법</div>
            <p>
              메일: <span className="text-zinc-900 dark:text-zinc-100">hello@briq.kr</span> ·{" "}
              영업일 기준 1일 내 회신
            </p>
            <p className="mt-1.5">
              일반 가입은{" "}
              <Link href="/onboarding" className="underline underline-offset-4 decoration-[0.5px] text-zinc-900 dark:text-zinc-100 hover:no-underline">
                3분 온보딩
              </Link>
              으로 바로 시작하실 수 있어요.
            </p>
          </div>
        </section>
      </main>
    </>
  );
}
