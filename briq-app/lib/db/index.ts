// Drizzle 클라이언트 — 서버 전용.
//
// Supabase 의 Session Pooler (6543 포트) 를 사용. 이유:
//  · Vercel 서버리스에서 매 호출 cold start 가 일어나면 prepared-statement 가 풀린다 →
//    transaction-mode pooler 와 안 맞음.
//  · Session pooler + `prepare: false` 가 권장 조합.
//
// 환경변수
//   DATABASE_URL=postgres://postgres.<ref>:<password>@aws-0-<region>.pooler.supabase.com:6543/postgres
//
// 사용처
//   import { db } from "@/lib/db";
//   await db.select().from(profiles).where(eq(profiles.id, userId));

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema";

const url = process.env.DATABASE_URL;

if (!url) {
  // 빌드 타임에 env 가 비어 있어도 동작은 해야 함 (예: pricing 페이지 SSG).
  // 실제로 DB 를 만지는 코드 경로에서 호출되었을 때 명확히 실패하도록 lazy proxy 로 처리.
  console.warn("[lib/db] DATABASE_URL 이 비어 있어 DB 클라이언트가 비활성화됨.");
}

const queryClient = url
  ? postgres(url, {
      prepare: false, // Supabase pooler 호환
      max: 10,
      idle_timeout: 20,
      connect_timeout: 10,
    })
  : null;

export const db = queryClient
  ? drizzle(queryClient, { schema, logger: process.env.NODE_ENV === "development" })
  : (new Proxy(
      {},
      {
        get() {
          throw new Error(
            "DATABASE_URL 이 설정되지 않아 db 를 사용할 수 없습니다. .env.local 을 확인해 주세요.",
          );
        },
      },
    ) as unknown as ReturnType<typeof drizzle>);

export { schema };
export type DB = typeof db;
