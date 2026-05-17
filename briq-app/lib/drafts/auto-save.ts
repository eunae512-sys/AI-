// 작업 자동 저장 시스템 — sessionStorage 기반
// 사용자가 새로고침 / 탭 전환 / 브라우저 복구 시에도 작업 내용 보존
//
// 사용:
//   const [text, setText] = React.useState("");
//   useAutoSaveDraft({ key: "blog", brandId: brand.id, value: { text } }, (saved) => {
//     setText(saved.text);
//   });
//
// 저장 전략:
//   - 입력 후 800ms debounce → sessionStorage 에 기록
//   - 브랜드 전환 시 자동으로 그 브랜드의 draft 로 복원
//   - 페이지 진입 시 한 번만 복원 (사용자가 명시 reset 누르기 전까지)

import * as React from "react";

const PREFIX = "briq:draft:v1";

function storageKey(scope: string, brandId: string): string {
  return `${PREFIX}:${scope}:${brandId}`;
}

export type DraftMeta = {
  savedAt: number;
  version: number;
};

type DraftWrapper<T> = T & { __meta?: DraftMeta };

export function loadDraft<T = Record<string, unknown>>(
  scope: string,
  brandId: string,
): (DraftWrapper<T>) | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(storageKey(scope, brandId));
    if (!raw) return null;
    return JSON.parse(raw) as DraftWrapper<T>;
  } catch {
    return null;
  }
}

export function saveDraft<T = Record<string, unknown>>(
  scope: string,
  brandId: string,
  value: T,
): void {
  if (typeof window === "undefined") return;
  try {
    const wrapper: DraftWrapper<T> = {
      ...value,
      __meta: { savedAt: Date.now(), version: 1 },
    };
    sessionStorage.setItem(storageKey(scope, brandId), JSON.stringify(wrapper));
  } catch {
    // QuotaExceeded — drop and retry once with shorter value
    try {
      sessionStorage.removeItem(storageKey(scope, brandId));
    } catch {
      // 무시
    }
  }
}

export function clearDraft(scope: string, brandId: string): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(storageKey(scope, brandId));
  } catch {
    // 무시
  }
}

// React hook — debounced 자동 저장 + 진입 시 1회 복원
export function useAutoSaveDraft<T = Record<string, unknown>>(opts: {
  scope: string;                    // "blog" | "threads" | "cardnews" | "shorts"
  brandId: string;
  value: T;
  onRestore?: (draft: DraftWrapper<T>) => void;
  debounceMs?: number;              // default 800ms
  enabled?: boolean;                // false 면 저장도 복원도 안 함 (마운트 중 등)
}): { lastSavedAt: number | null; clear: () => void } {
  const { scope, brandId, value, onRestore, debounceMs = 800, enabled = true } = opts;
  const [lastSavedAt, setLastSavedAt] = React.useState<number | null>(null);
  // 브랜드별로 "이미 이 brand 의 draft 를 복원했는가" 추적.
  // 단순 boolean 으로는 브랜드 전환 시 새 brand 의 draft 가 복원 안 됨 (버그).
  // → 마지막 복원한 (scope|brandId) key 를 보관.
  const lastRestoredKey = React.useRef<string | null>(null);
  // onRestore 를 ref 로 잡아서 effect dep 폭발 방지
  const onRestoreRef = React.useRef(onRestore);
  React.useEffect(() => {
    onRestoreRef.current = onRestore;
  }, [onRestore]);

  // 브랜드 (또는 scope) 가 바뀔 때마다 새 brand 의 draft 복원
  React.useEffect(() => {
    if (!enabled) return;
    const key = `${scope}:${brandId}`;
    if (lastRestoredKey.current === key) return; // 같은 brand 면 중복 복원 안 함
    lastRestoredKey.current = key;
    const draft = loadDraft<T>(scope, brandId);
    if (draft && onRestoreRef.current) {
      onRestoreRef.current(draft);
      setLastSavedAt(draft.__meta?.savedAt ?? Date.now());
    } else {
      // 새 brand 에 draft 없으면 lastSavedAt 초기화
      setLastSavedAt(null);
    }
  }, [scope, brandId, enabled]);

  // value 변경 시 debounce 저장 — 복원 완료된 brand 에 대해서만
  React.useEffect(() => {
    if (!enabled) return;
    const key = `${scope}:${brandId}`;
    // 현재 brand 의 draft 가 아직 복원 시도 안 됐으면 저장 X (덮어쓰기 방지)
    // brand 전환 직후 이전 brand value 가 새 brand 의 draft 를 덮어쓰는 race 방지.
    if (lastRestoredKey.current !== key) return;
    const timer = setTimeout(() => {
      saveDraft(scope, brandId, value);
      setLastSavedAt(Date.now());
    }, debounceMs);
    return () => clearTimeout(timer);
    // value 변화 감지 — JSON.stringify 비교는 비싸니 의도적으로 value 자체 의존
  }, [value, scope, brandId, enabled, debounceMs]);

  const clear = React.useCallback(() => {
    clearDraft(scope, brandId);
    setLastSavedAt(null);
    // 같은 brand 재진입 시 다시 복원 시도하도록 key 비움
    lastRestoredKey.current = null;
  }, [scope, brandId]);

  return { lastSavedAt, clear };
}

// 사용자에게 "저장됨 5분 전" 같은 라벨 보여주기용
export function formatSavedAt(ts: number | null): string {
  if (!ts) return "저장 안 됨";
  const diff = Date.now() - ts;
  if (diff < 5_000) return "방금 저장됨";
  if (diff < 60_000) return `${Math.floor(diff / 1000)}초 전 저장됨`;
  if (diff < 3600_000) return `${Math.floor(diff / 60_000)}분 전 저장됨`;
  const date = new Date(ts);
  return `${date.getHours()}:${String(date.getMinutes()).padStart(2, "0")} 저장됨`;
}
