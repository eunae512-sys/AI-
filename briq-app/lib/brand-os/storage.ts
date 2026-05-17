// Storage 인터페이스 — localStorage 기반 (v1).
// Postgres 마이그레이션 시 이 파일만 갈아끼우면 끝.
//
// async API 로 통일 — Postgres / Supabase 로 옮길 때 호출 코드 변경 없음.

export async function kvGet<T>(key: string): Promise<T | null> {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function kvSet<T>(key: string, value: T): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // QuotaExceeded — 일부 키 정리 정책 v2 에서 추가
  }
}

export async function kvRemove(key: string): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(key);
  } catch {
    // 무시
  }
}

export async function kvKeysMatching(prefix: string): Promise<string[]> {
  if (typeof window === "undefined") return [];
  try {
    const result: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(prefix)) result.push(k);
    }
    return result;
  } catch {
    return [];
  }
}

// ─────────────────────────────────────────────────────────────
// 도메인 헬퍼 — Persona / Campaign / Asset CRUD
// ─────────────────────────────────────────────────────────────

import type { Persona, Campaign, ContentAsset } from "@/lib/brand-os/types";

const PERSONA_KEY = (id: string) => `brand-os:persona:${id}`;
const PERSONAS_BY_BRAND = (brandId: string) => `brand-os:personas-index:${brandId}`;

export async function savePersona(persona: Persona): Promise<void> {
  await kvSet(PERSONA_KEY(persona.id), persona);
  // 브랜드별 인덱스 갱신
  const index = (await kvGet<string[]>(PERSONAS_BY_BRAND(persona.brandId))) ?? [];
  if (!index.includes(persona.id)) {
    await kvSet(PERSONAS_BY_BRAND(persona.brandId), [...index, persona.id]);
  }
}

export async function loadPersona(id: string): Promise<Persona | null> {
  return kvGet<Persona>(PERSONA_KEY(id));
}

export async function loadPersonasByBrand(brandId: string): Promise<Persona[]> {
  const index = (await kvGet<string[]>(PERSONAS_BY_BRAND(brandId))) ?? [];
  const results: Persona[] = [];
  for (const id of index) {
    const p = await loadPersona(id);
    if (p) results.push(p);
  }
  return results;
}

export async function deletePersona(id: string, brandId: string): Promise<void> {
  await kvRemove(PERSONA_KEY(id));
  const index = (await kvGet<string[]>(PERSONAS_BY_BRAND(brandId))) ?? [];
  await kvSet(
    PERSONAS_BY_BRAND(brandId),
    index.filter((x) => x !== id),
  );
}

// Campaign
const CAMPAIGN_KEY = (id: string) => `brand-os:campaign:${id}`;
const CAMPAIGNS_BY_BRAND = (brandId: string) => `brand-os:campaigns-index:${brandId}`;

export async function saveCampaign(c: Campaign): Promise<void> {
  await kvSet(CAMPAIGN_KEY(c.id), c);
  const idx = (await kvGet<string[]>(CAMPAIGNS_BY_BRAND(c.brandId))) ?? [];
  if (!idx.includes(c.id)) {
    await kvSet(CAMPAIGNS_BY_BRAND(c.brandId), [...idx, c.id]);
  }
}

export async function loadCampaign(id: string): Promise<Campaign | null> {
  return kvGet<Campaign>(CAMPAIGN_KEY(id));
}

export async function loadCampaignsByBrand(brandId: string): Promise<Campaign[]> {
  const idx = (await kvGet<string[]>(CAMPAIGNS_BY_BRAND(brandId))) ?? [];
  const out: Campaign[] = [];
  for (const id of idx) {
    const c = await loadCampaign(id);
    if (c) out.push(c);
  }
  return out;
}

// Content Asset
const ASSET_KEY = (id: string) => `brand-os:asset:${id}`;
const ASSETS_BY_BRAND = (brandId: string) => `brand-os:assets-index:${brandId}`;

export async function saveAsset(a: ContentAsset): Promise<void> {
  await kvSet(ASSET_KEY(a.id), a);
  const idx = (await kvGet<string[]>(ASSETS_BY_BRAND(a.brandId))) ?? [];
  if (!idx.includes(a.id)) {
    await kvSet(ASSETS_BY_BRAND(a.brandId), [...idx, a.id]);
  }
}

export async function loadAsset(id: string): Promise<ContentAsset | null> {
  return kvGet<ContentAsset>(ASSET_KEY(id));
}

export async function loadAssetsByBrand(brandId: string): Promise<ContentAsset[]> {
  const idx = (await kvGet<string[]>(ASSETS_BY_BRAND(brandId))) ?? [];
  const out: ContentAsset[] = [];
  for (const id of idx) {
    const a = await loadAsset(id);
    if (a) out.push(a);
  }
  return out;
}
