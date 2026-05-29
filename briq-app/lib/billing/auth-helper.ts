// 결제 API 라우트에서 공통으로 쓰는 인증 헬퍼.
//
// 모든 결제 API 는 로그인 사용자만 호출 가능. Supabase auth JWT 를 통해
// 현재 user.id / email 을 가져와 admin DB 쓰기와 결합한다.

import "server-only";

import { NextResponse } from "next/server";

import { getSupabaseServer } from "@/lib/supabase/server";

export type AuthedUser = {
  id: string;
  email: string;
};

/**
 * 로그인 사용자 정보를 반환한다.
 * 인증 실패 시 NextResponse 401 을 던지지 않고 객체로 반환 — 라우트가 일찍 return 하도록.
 */
export async function getAuthedUser(): Promise<
  { ok: true; user: AuthedUser } | { ok: false; response: NextResponse }
> {
  const supabase = await getSupabaseServer();
  if (!supabase) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "supabase_not_configured" },
        { status: 503 },
      ),
    };
  }
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user || !user.email) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "unauthorized" },
        { status: 401 },
      ),
    };
  }
  return { ok: true, user: { id: user.id, email: user.email } };
}
