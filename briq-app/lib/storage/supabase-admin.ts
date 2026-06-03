// Supabase Storage 전용 service-role 클라이언트.
//
// adminDb(postgres-js)는 DB 전용이라 Storage 를 못 쓴다 → 별도 JS 클라이언트.
// service-role 키 사용 → **절대 클라이언트 번들 금지**. 'server-only' 가 차단.

import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let client: SupabaseClient | null = null;

/** 설정돼 있으면 Storage 클라이언트, 아니면 null (호출 측이 폴백). */
export function getStorageClient(): SupabaseClient | null {
  if (client) return client;
  if (!url || !serviceKey) return null;
  client = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return client;
}
