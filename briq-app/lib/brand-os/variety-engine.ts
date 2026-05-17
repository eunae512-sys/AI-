// Variety Engine — 사양 §6
//
// 같은 브랜드라도 매번 다른 촬영처럼 보이게.
//
// 차단 대상:
//   - 같은 훅 반복
//   - 같은 해시태그 세트 반복
//   - 같은 구도(composition) 반복
//   - 의미적으로 너무 유사한 텍스트 반복
//   - 같은 썸네일 saliency 패턴 반복
//
// 알고리즘:
//   - 텍스트: 정규화 + n-gram Jaccard 유사도
//   - 해시태그: set intersection / union 유사도
//   - 구도: saliency 격자를 quantize → hash string

import type { BrandMemory } from "@/lib/brand-os/types";
import { loadBrandMemory } from "@/lib/brand-os/brand-memory";

// ─────────────────────────────────────────────────────────────
// 1. 텍스트 정규화 — 비교 가능한 형태로
// ─────────────────────────────────────────────────────────────

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[.,!?…—\-:;()"'`]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

// 한국어/영문 통합 n-gram
function trigrams(text: string): Set<string> {
  const s = normalize(text);
  const set = new Set<string>();
  for (let i = 0; i < s.length - 2; i++) {
    set.add(s.slice(i, i + 3));
  }
  return set;
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 1;
  let intersect = 0;
  for (const x of a) if (b.has(x)) intersect++;
  return intersect / (a.size + b.size - intersect);
}

// ─────────────────────────────────────────────────────────────
// 2. 텍스트 유사도 — 0~1
// ─────────────────────────────────────────────────────────────

export function textSimilarity(a: string, b: string): number {
  return jaccard(trigrams(a), trigrams(b));
}

/**
 * 새 텍스트가 최근 N 개의 어떤 것과도 임계 이상 유사하면 true.
 */
export function isTooSimilar(opts: {
  candidate: string;
  recent: string[];
  threshold?: number; // 기본 0.55
}): { tooSimilar: boolean; similarTo?: string; score?: number } {
  const threshold = opts.threshold ?? 0.55;
  const target = trigrams(opts.candidate);
  let maxScore = 0;
  let maxText = "";
  for (const t of opts.recent) {
    const sc = jaccard(target, trigrams(t));
    if (sc > maxScore) {
      maxScore = sc;
      maxText = t;
    }
  }
  if (maxScore >= threshold) return { tooSimilar: true, similarTo: maxText, score: maxScore };
  return { tooSimilar: false };
}

// ─────────────────────────────────────────────────────────────
// 3. 해시태그 세트 유사도
// ─────────────────────────────────────────────────────────────

export function hashtagSetSimilarity(a: string[], b: string[]): number {
  const A = new Set(a.map((t) => t.toLowerCase().replace(/^#/, "")));
  const B = new Set(b.map((t) => t.toLowerCase().replace(/^#/, "")));
  let intersect = 0;
  for (const x of A) if (B.has(x)) intersect++;
  return intersect / (A.size + B.size - intersect || 1);
}

// ─────────────────────────────────────────────────────────────
// 4. 구도 hash — saliency 격자 → quantized 문자열
// ─────────────────────────────────────────────────────────────

import type { SaliencyGrid } from "@/lib/layout/text-placement";

/**
 * saliency 격자 → 짧은 hash. 4단계 양자화 (저/중저/중상/고) 후 인접 셀 묶어서 평균.
 * 같은 구도면 동일 hash, 비슷한 구도면 한두 문자만 다른 hash.
 */
export function compositionHashFromGrid(grid: SaliencyGrid): string {
  const buckets: string[] = [];
  // 3 × 4 macro 셀로 묶음
  const macroCols = 3;
  const macroRows = 4;
  for (let mr = 0; mr < macroRows; mr++) {
    for (let mc = 0; mc < macroCols; mc++) {
      const r0 = Math.floor((mr * grid.rows) / macroRows);
      const r1 = Math.floor(((mr + 1) * grid.rows) / macroRows);
      const c0 = Math.floor((mc * grid.cols) / macroCols);
      const c1 = Math.floor(((mc + 1) * grid.cols) / macroCols);
      let sum = 0;
      let n = 0;
      for (let r = r0; r < r1; r++) {
        for (let c = c0; c < c1; c++) {
          sum += grid.cells[r][c].saliency;
          n++;
        }
      }
      const avg = n > 0 ? sum / n : 0;
      // 0~3 단계로 양자화
      const q = Math.min(3, Math.floor(avg * 4));
      buckets.push(String(q));
    }
  }
  return buckets.join("");
}

/** 두 구도 hash 의 거리 — 다른 자리 수 */
export function compositionDistance(a: string, b: string): number {
  if (a.length !== b.length) return Math.max(a.length, b.length);
  let d = 0;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) d++;
  return d;
}

// ─────────────────────────────────────────────────────────────
// 5. 통합 헬퍼 — 한 번에 다양성 검증
// ─────────────────────────────────────────────────────────────

export type VarietyCheck = {
  pass: boolean;
  issues: { kind: "hook" | "hashtag" | "composition" | "caption"; note: string }[];
};

export async function checkVariety(opts: {
  brandId: string;
  hook?: string;
  caption?: string;
  hashtags?: string[];
  compositionHash?: string;
}): Promise<VarietyCheck> {
  const issues: VarietyCheck["issues"] = [];
  const memory: BrandMemory = await loadBrandMemory(opts.brandId);

  if (opts.hook) {
    const r = isTooSimilar({
      candidate: opts.hook,
      recent: memory.recentHooks.map((h) => h.text),
      threshold: 0.6,
    });
    if (r.tooSimilar) {
      issues.push({ kind: "hook", note: `최근 훅 과 유사 (${r.score?.toFixed(2)}): "${r.similarTo}"` });
    }
  }

  if (opts.caption) {
    const r = isTooSimilar({
      candidate: opts.caption,
      recent: memory.recentHooks.map((h) => h.text), // hook 외에 caption 도 hook 비교에 합쳐 사용
      threshold: 0.5,
    });
    if (r.tooSimilar) {
      issues.push({ kind: "caption", note: `과거 캡션과 유사 (${r.score?.toFixed(2)})` });
    }
  }

  if (opts.hashtags?.length) {
    // 같은 해시태그 세트가 자주 사용됐는지 — 최근 5개 중 70% 이상 겹치면 플래그
    const overused = memory.recentHashtags.filter((h) => h.count >= 5).map((h) => h.tag);
    const overlap = opts.hashtags.filter((t) => overused.includes(t.replace(/^#/, ""))).length;
    if (overlap >= Math.ceil(opts.hashtags.length * 0.7)) {
      issues.push({
        kind: "hashtag",
        note: `자주 쓰던 해시태그가 70%+ — 새로운 태그 섞을 것`,
      });
    }
  }

  if (opts.compositionHash) {
    const recent = memory.recentCompositions;
    for (const rc of recent.slice(0, 5)) {
      const d = compositionDistance(rc.hash, opts.compositionHash);
      if (d <= 1) {
        issues.push({
          kind: "composition",
          note: `최근 컷과 거의 같은 구도 (asset ${rc.assetId})`,
        });
        break;
      }
    }
  }

  return { pass: issues.length === 0, issues };
}
