// 채널 OAuth 토큰 암호화 (Phase 1)
//
// channel_connections.access_token/refresh_token 은 평문 저장 금지(PIPA).
// AES-256-GCM 으로 암호화해 저장하고, 발행 시점에만 서버에서 복호화.
// 키: env CHANNEL_TOKEN_KEY (32바이트 hex=64자 권장, 아니면 scrypt 파생).

import "server-only";
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "node:crypto";

const FORMAT = "v1"; // ivB64.tagB64.dataB64

function getKey(): Buffer {
  const raw = process.env.CHANNEL_TOKEN_KEY ?? "";
  if (!raw) throw new Error("CHANNEL_TOKEN_KEY 미설정 — 토큰 암호화 불가");
  // 64자 hex 면 그대로 32바이트 키, 아니면 scrypt 로 32바이트 파생.
  if (/^[0-9a-f]{64}$/i.test(raw)) return Buffer.from(raw, "hex");
  return scryptSync(raw, "briq-channel-token", 32);
}

export function isTokenCryptoConfigured(): boolean {
  return (process.env.CHANNEL_TOKEN_KEY ?? "").length > 0;
}

export function encryptToken(plain: string): string {
  const key = getKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const data = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${FORMAT}.${iv.toString("base64")}.${tag.toString("base64")}.${data.toString("base64")}`;
}

export function decryptToken(encoded: string): string {
  const parts = encoded.split(".");
  if (parts.length !== 4 || parts[0] !== FORMAT) {
    throw new Error("토큰 복호화 실패 — 형식 불일치");
  }
  const [, ivB64, tagB64, dataB64] = parts;
  const key = getKey();
  const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(ivB64, "base64"));
  decipher.setAuthTag(Buffer.from(tagB64, "base64"));
  const out = Buffer.concat([decipher.update(Buffer.from(dataB64, "base64")), decipher.final()]);
  return out.toString("utf8");
}
