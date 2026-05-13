// 반복 방지 — 최근 생성된 hook 추적
// 같은 브랜드에서 연속으로 같은 패턴이 나오지 않도록 localStorage 에 메모

const STORAGE_KEY = "briq:viral:recent-hooks:v1";
const MAX_PER_BRAND = 12; // 최근 12개까지 기억
const MAX_TOTAL_BRANDS = 30;

type Store = Record<string, string[]>; // brandId → recent hook strings

function load(): Store {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Store;
  } catch {
    return {};
  }
}

function save(store: Store) {
  if (typeof window === "undefined") return;
  try {
    // 너무 많아지면 오래된 브랜드부터 제거
    const keys = Object.keys(store);
    if (keys.length > MAX_TOTAL_BRANDS) {
      const trimmed: Store = {};
      keys.slice(-MAX_TOTAL_BRANDS).forEach((k) => (trimmed[k] = store[k]));
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
      return;
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // 무시
  }
}

export function getRecentHooks(brandId: string): string[] {
  const store = load();
  return store[brandId] ?? [];
}

export function recordHook(brandId: string, hook: string) {
  if (!hook?.trim()) return;
  const store = load();
  const list = store[brandId] ?? [];
  // 중복 제거 후 맨 앞 추가
  const filtered = list.filter((h) => h !== hook);
  filtered.unshift(hook);
  store[brandId] = filtered.slice(0, MAX_PER_BRAND);
  save(store);
}

// 후크 풀에서 최근 안 쓴 것 우선 픽
export function pickFreshHook(brandId: string, pool: string[]): string {
  if (pool.length === 0) return "";
  const recent = new Set(getRecentHooks(brandId));
  const fresh = pool.filter((h) => !recent.has(h));
  const picked = fresh.length > 0
    ? fresh[Math.floor(Math.random() * fresh.length)]
    : pool[Math.floor(Math.random() * pool.length)];
  recordHook(brandId, picked);
  return picked;
}

// 결정론적 픽 (seed 기반) — Reels 변형 생성처럼 seed 가 있을 때
export function pickFreshHookSeeded(brandId: string, pool: string[], seed: number): string {
  if (pool.length === 0) return "";
  const recent = new Set(getRecentHooks(brandId));
  const fresh = pool.filter((h) => !recent.has(h));
  const list = fresh.length > 0 ? fresh : pool;
  const idx = Math.abs(seed) % list.length;
  const picked = list[idx];
  recordHook(brandId, picked);
  return picked;
}

export function clearRecentHooks(brandId?: string) {
  if (typeof window === "undefined") return;
  if (!brandId) {
    window.localStorage.removeItem(STORAGE_KEY);
    return;
  }
  const store = load();
  delete store[brandId];
  save(store);
}
