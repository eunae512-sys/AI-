// OAuth callback — Supabase 가 가입·로그인 완료 후 이 URL 로 ?code= 와 함께 리다이렉트.
// 우리는 code 를 세션으로 교환하고 /onboarding(신규) 또는 /dashboard(기존) 로 보낸다.

import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/onboarding";

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`);
  }

  const supabase = await getSupabaseServer();
  if (!supabase) {
    // 환경변수 미설정 — 데모 흐름으로 보냄
    return NextResponse.redirect(`${origin}${next}`);
  }

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error.message)}`);
  }

  return NextResponse.redirect(`${origin}${next}`);
}
