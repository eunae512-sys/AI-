// Brand Memory — 사양 §5
//
// 브랜드별 장기 운영 메모리. 단발성 AI 생성기 → "실제 운영되는 계정" 으로 만드는 핵심.
//
// 저장:
//   - 최근 사용 훅 (중복 방지)
//   - 최근 사용 해시태그 (다양성)
//   - 최근 구도 hash (composition 다양성)
//   - 잘 반응 나온 패턴 (학습)
//   - 시그니처 문구·BGM·지역 키워드
//
// 인터페이스:
//   localStorage 기반 (v1) — `storage.ts` 갈아끼우면 Postgres 로 이전 가능.

import type { BrandMemory, ContentAsset } from "@/lib/brand-os/types";
import { kvGet, kvSet } from "@/lib/brand-os/storage";

const MEMORY_PREFIX = "brand-os:memory:";
const MAX_RECENT_HOOKS = 30;
const MAX_RECENT_HASHTAGS = 60;
const MAX_RECENT_COMPOSITIONS = 30;
const MAX_WINNERS = 20;

// ─────────────────────────────────────────────────────────────
// 기본 메모리 객체
// ─────────────────────────────────────────────────────────────

function emptyMemory(brandId: string): BrandMemory {
  return {
    brandId,
    recentHooks: [],
    recentHashtags: [],
    recentCompositions: [],
    winnerPatterns: [],
    signaturePhrases: [],
    preferredBgm: [],
    localKeywords: [],
    updatedAt: new Date().toISOString(),
  };
}

export async function loadBrandMemory(brandId: string): Promise<BrandMemory> {
  const stored = await kvGet<BrandMemory>(MEMORY_PREFIX + brandId);
  return stored ?? emptyMemory(brandId);
}

export async function saveBrandMemory(memory: BrandMemory): Promise<void> {
  await kvSet(MEMORY_PREFIX + memory.brandId, {
    ...memory,
    updatedAt: new Date().toISOString(),
  });
}

// ─────────────────────────────────────────────────────────────
// 기록 — 콘텐츠 생성 직후 호출
// ─────────────────────────────────────────────────────────────

export async function recordContentGeneration(opts: {
  brandId: string;
  hook?: string;
  hashtags?: string[];
  compositionHash?: string;
  assetId: string;
}): Promise<void> {
  const m = await loadBrandMemory(opts.brandId);
  const now = new Date().toISOString();

  if (opts.hook) {
    m.recentHooks = [
      { text: opts.hook, usedAt: now, assetId: opts.assetId },
      ...m.recentHooks,
    ].slice(0, MAX_RECENT_HOOKS);
  }

  if (opts.hashtags?.length) {
    const map = new Map<string, { tag: string; usedAt: string; count: number }>();
    // 기존 카운트 누적
    m.recentHashtags.forEach((h) => map.set(h.tag, { ...h }));
    opts.hashtags.forEach((tag) => {
      const existing = map.get(tag);
      if (existing) {
        map.set(tag, { tag, usedAt: now, count: existing.count + 1 });
      } else {
        map.set(tag, { tag, usedAt: now, count: 1 });
      }
    });
    m.recentHashtags = Array.from(map.values())
      .sort((a, b) => (b.usedAt > a.usedAt ? 1 : -1))
      .slice(0, MAX_RECENT_HASHTAGS);
  }

  if (opts.compositionHash) {
    m.recentCompositions = [
      { hash: opts.compositionHash, usedAt: now, assetId: opts.assetId },
      ...m.recentCompositions.filter((c) => c.hash !== opts.compositionHash),
    ].slice(0, MAX_RECENT_COMPOSITIONS);
  }

  await saveBrandMemory(m);
}

// ─────────────────────────────────────────────────────────────
// 발행 후 반응 — winner 패턴 학습
// ─────────────────────────────────────────────────────────────

export async function recordMetrics(opts: {
  brandId: string;
  asset: ContentAsset;
}): Promise<void> {
  const m = opts.asset.metrics;
  if (!m) return;
  const reach = m.reach ?? 0;
  const saves = m.saves ?? 0;
  // 단순 임계 — reach 500 이상 또는 saves 30 이상 = winner
  if (reach < 500 && saves < 30) return;

  const mem = await loadBrandMemory(opts.brandId);
  mem.winnerPatterns = [
    {
      hookPattern: opts.asset.hook,
      hashtagSet: opts.asset.hashtags,
      composition: opts.asset.kind,
      timeOfDay: opts.asset.publishedAt
        ? new Date(opts.asset.publishedAt).toTimeString().slice(0, 5)
        : undefined,
      metric: { reach, saves },
      assetId: opts.asset.id,
    },
    ...mem.winnerPatterns,
  ].slice(0, MAX_WINNERS);
  await saveBrandMemory(mem);
}

// ─────────────────────────────────────────────────────────────
// 다음 콘텐츠 생성 시 — 메모리에서 컨텍스트 추출
// ─────────────────────────────────────────────────────────────

export async function buildMemoryContext(brandId: string): Promise<{
  /** 최근 훅 — 중복 회피용. 새 생성 시 prompt 에 "avoid these" 로 주입 */
  avoidHooks: string[];
  /** 최근 해시태그 — 너무 자주 사용된 거 회피 */
  avoidOverusedHashtags: string[];
  /** 시그니처 문구 — 매번 어조 일관성 유지 */
  signaturePhrases: string[];
  /** 잘 됐던 패턴 한 줄 — prompt 에 "do more of this" 로 주입 */
  winnerHint?: string;
  /** 자주 쓰는 BGM 스타일 */
  preferredBgm: string[];
  /** 지역 키워드 */
  localKeywords: string[];
}> {
  const m = await loadBrandMemory(brandId);
  const avoidHooks = m.recentHooks.slice(0, 10).map((h) => h.text);
  // 5회 이상 사용된 해시태그는 자제
  const avoidOverusedHashtags = m.recentHashtags
    .filter((h) => h.count >= 5)
    .map((h) => h.tag);

  const winnerHint =
    m.winnerPatterns[0]
      ? `최근 잘 반응 나온 패턴 — ${m.winnerPatterns[0].composition} (${m.winnerPatterns[0].metric.reach} reach, ${m.winnerPatterns[0].metric.saves} saves)${m.winnerPatterns[0].hookPattern ? `, 훅 결: "${m.winnerPatterns[0].hookPattern}"` : ""}`
      : undefined;

  return {
    avoidHooks,
    avoidOverusedHashtags,
    signaturePhrases: m.signaturePhrases,
    winnerHint,
    preferredBgm: m.preferredBgm,
    localKeywords: m.localKeywords,
  };
}

// ─────────────────────────────────────────────────────────────
// 시그니처 문구·지역 키워드 직접 설정
// ─────────────────────────────────────────────────────────────

export async function setSignaturePhrases(brandId: string, phrases: string[]): Promise<void> {
  const m = await loadBrandMemory(brandId);
  m.signaturePhrases = phrases.slice(0, 10);
  await saveBrandMemory(m);
}

export async function setLocalKeywords(brandId: string, keywords: string[]): Promise<void> {
  const m = await loadBrandMemory(brandId);
  m.localKeywords = keywords.slice(0, 15);
  await saveBrandMemory(m);
}

export async function setPreferredBgm(brandId: string, bgm: string[]): Promise<void> {
  const m = await loadBrandMemory(brandId);
  m.preferredBgm = bgm.slice(0, 10);
  await saveBrandMemory(m);
}
