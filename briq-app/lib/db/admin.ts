// Service-role 기반 DB 쓰기 클라이언트.
//
// RLS 우회가 필요한 서버 사이드 경로 전용:
//  · /api/billing/* (구독 생성/변경)
//  · /api/cron/recurring-billing
//  · /api/webhooks/toss
//  · /api/usage 카운터 증분
//
// **절대 클라이언트 번들에 들어가서는 안 됨.**
// 'server-only' import 가 빌드 타임에 클라이언트 import 를 차단한다.
//
// 구현 노트
//   DATABASE_URL 의 사용자 `postgres.<ref>` 는 Supabase 의 pooler 슈퍼유저로
//   BYPASSRLS 속성을 갖는다 → RLS 정책을 자동 우회한다. 별도 SET ROLE 불필요.
//   (사용자 컨텍스트에서 동작해야 하는 API 는 Supabase auth helper 의
//   getSupabaseServer() 를 통해 anon-key + JWT 로 호출 — 그건 RLS 적용.)

import "server-only";

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema";

const url = process.env.DATABASE_URL;

if (!url) {
  console.warn("[lib/db/admin] DATABASE_URL 없음 — admin DB 클라이언트 비활성.");
}

const queryClient = url
  ? postgres(url, {
      prepare: false,
      max: 5,
      idle_timeout: 20,
      connect_timeout: 10,
    })
  : null;

export const adminDb = queryClient
  ? drizzle(queryClient, { schema })
  : (new Proxy(
      {},
      {
        get() {
          throw new Error(
            "DATABASE_URL 미설정 — admin DB 사용 불가. .env.local 을 확인하세요.",
          );
        },
      },
    ) as unknown as ReturnType<typeof drizzle>);
