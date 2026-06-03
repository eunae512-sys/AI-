// 생성 에셋 영속화 — base64 data URL / 버퍼를 Supabase Storage 에 올리고 public URL 반환.
//
// 버킷: "briq-assets" (공개 read). 대시보드에서 1회 생성 필요.
// 경로: generated/{userId}/{yyyy-mm}/{uuid}.{ext}
//
// 업로드 실패/미설정 시 throw → 호출 측이 원본(data URL) 폴백으로 UX 안 끊음.

import "server-only";

import { getStorageClient } from "./supabase-admin";

const BUCKET = "briq-assets";

function yearMonthKST(): string {
  const seoul = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
  return `${seoul.getFullYear()}-${String(seoul.getMonth() + 1).padStart(2, "0")}`;
}

function uuid(): string {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
}

/** "data:image/png;base64,XXXX" → { buffer, contentType, ext } */
function parseDataUrl(dataUrl: string): { buffer: Buffer; contentType: string; ext: string } | null {
  const m = dataUrl.match(/^data:([^;]+);base64,(.+)$/s);
  if (!m) return null;
  const contentType = m[1];
  const ext = contentType.split("/")[1]?.split("+")[0] || "png";
  return { buffer: Buffer.from(m[2], "base64"), contentType, ext };
}

async function upload(
  userId: string,
  buffer: Buffer,
  contentType: string,
  ext: string,
): Promise<string> {
  const storage = getStorageClient();
  if (!storage) throw new Error("Storage 미설정 (SUPABASE_SERVICE_ROLE_KEY)");

  const path = `generated/${userId || "anon"}/${yearMonthKST()}/${uuid()}.${ext}`;
  const { error } = await storage.storage
    .from(BUCKET)
    .upload(path, buffer, { contentType, upsert: false });
  if (error) throw error;

  return storage.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

/**
 * 이미지 영속화. data URL 이면 업로드 후 public URL 반환.
 * 외부 https URL(Pexels/데모)이면 그대로 통과(이미 호스팅됨).
 */
export async function persistImage(imageDataUrl: string, userId: string): Promise<string> {
  if (!imageDataUrl.startsWith("data:")) return imageDataUrl;
  const parsed = parseDataUrl(imageDataUrl);
  if (!parsed) return imageDataUrl;
  return upload(userId, parsed.buffer, parsed.contentType, parsed.ext);
}

/** 영상 버퍼 영속화 → public URL. fal URL 은 만료되므로 항상 재호스팅. */
export async function persistVideo(
  buffer: Buffer,
  userId: string,
  contentType = "video/mp4",
): Promise<string> {
  const ext = contentType.split("/")[1] || "mp4";
  return upload(userId, buffer, contentType, ext);
}
