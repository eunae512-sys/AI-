// /billing/start?plan=pro&cycle=monthly
//
// "2단계 / 2" 페이지 — 로그인 끝낸 사용자가 결제수단만 등록하는 진입점.
// 인증 체크는 서버 사이드. 비로그인이면 즉시 /login?next=... 로 redirect.
//
// 이 페이지를 만든 이유:
//   · /pricing → 결제 흐름이 한 번에 "회원가입 + 카드 등록" 으로 묶이면 사용자가 부담.
//   · 로그인은 별도 페이지(/login), 카드 등록은 별도 페이지(/billing/start) 로 분리해
//     각 단계가 한 행동 = 한 화면이 되도록.

import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getSupabaseServer } from "@/lib/supabase/server";
import { BillingStartClient } from "./client";

export const metadata: Metadata = {
  title: "결제수단 등록 · 14일 무료체험 시작",
  robots: { index: false, follow: false },
};

const ALLOWED_PLANS = new Set(["pro", "studio", "agency"]);
const ALLOWED_CYCLES = new Set(["monthly", "annual"]);

export default async function BillingStartPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string; cycle?: string }>;
}) {
  const sp = await searchParams;
  const plan = sp.plan && ALLOWED_PLANS.has(sp.plan) ? sp.plan : "pro";
  const cycle = sp.cycle && ALLOWED_CYCLES.has(sp.cycle) ? sp.cycle : "monthly";
  const nextUrl = `/billing/start?plan=${plan}&cycle=${cycle}`;

  // 인증 체크 — 비로그인이면 로그인으로 (next 보존)
  const supabase = await getSupabaseServer();
  if (!supabase) {
    // Supabase env 미설정 — 데모 모드, 그냥 통과
    return (
      <BillingStartClient
        planId={plan as "pro" | "studio" | "agency"}
        cycle={cycle as "monthly" | "annual"}
        userEmail={null}
        userName={null}
      />
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(nextUrl)}`);
  }

  return (
    <BillingStartClient
      planId={plan as "pro" | "studio" | "agency"}
      cycle={cycle as "monthly" | "annual"}
      userEmail={user.email ?? null}
      userName={
        (user.user_metadata?.full_name as string | undefined) ??
        (user.user_metadata?.name as string | undefined) ??
        null
      }
    />
  );
}
