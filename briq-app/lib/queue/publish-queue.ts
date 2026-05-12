// 발행 큐 — localStorage 기반 영속화
// 모든 "예약 큐에 추가" / "발행" 버튼이 이 모듈에 기록 → /schedule 에서 동일 데이터 표시
// 브랜드별로 분리해서 저장 (multi-tenant 친화)

export type QueueItemType = "reels" | "cardnews" | "blog" | "threads" | "shorts";

export type PublishQueueItem = {
  id: string;
  brandId: string;
  brandName: string;
  type: QueueItemType;
  typeLabel: string;        // "릴스 30초" / "카드뉴스 6장" 등 사용자용 라벨
  title: string;             // "오늘의 한 상" 등 콘텐츠 타이틀
  caption?: string;          // 본문 일부 (preview)
  thumbnail?: string;        // dataURL or 외부 URL
  scheduledFor?: string;     // ISO datetime (예약 시) — undefined = 즉시 발행 대기
  channels?: string[];       // ["instagram", "naver-blog"] 등 대상 채널
  status: "draft" | "scheduled" | "published" | "failed";
  createdAt: number;
  updatedAt: number;
};

const STORAGE_KEY = "briq:publish-queue:v1";
const EVENT = "briq:queue-updated";

function read(): PublishQueueItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as PublishQueueItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function write(items: PublishQueueItem[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(new Event(EVENT));
  } catch {
    // QuotaExceeded — 썸네일 dataURL 빼고 재시도
    try {
      const slim = items.map(({ thumbnail, ...rest }) => rest);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(slim));
      window.dispatchEvent(new Event(EVENT));
    } catch {
      // 무시
    }
  }
}

export function addToQueue(
  input: Omit<PublishQueueItem, "id" | "createdAt" | "updatedAt" | "status"> & {
    status?: PublishQueueItem["status"];
  },
): PublishQueueItem {
  const now = Date.now();
  const item: PublishQueueItem = {
    ...input,
    id: `q-${now.toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    status: input.status ?? "scheduled",
    createdAt: now,
    updatedAt: now,
  };
  const items = read();
  items.unshift(item);
  write(items);
  return item;
}

export function getQueue(brandId?: string): PublishQueueItem[] {
  const items = read();
  if (!brandId) return items;
  return items.filter((i) => i.brandId === brandId);
}

export function removeFromQueue(id: string): void {
  write(read().filter((i) => i.id !== id));
}

export function updateQueueItem(id: string, patch: Partial<PublishQueueItem>): void {
  write(
    read().map((i) =>
      i.id === id ? { ...i, ...patch, id: i.id, updatedAt: Date.now() } : i,
    ),
  );
}

export function clearQueue(brandId?: string): void {
  if (!brandId) {
    write([]);
    return;
  }
  write(read().filter((i) => i.brandId !== brandId));
}

// React hook — 큐 변경 시 자동 리렌더
import * as React from "react";

export function usePublishQueue(brandId?: string): PublishQueueItem[] {
  const [items, setItems] = React.useState<PublishQueueItem[]>([]);

  React.useEffect(() => {
    const refresh = () => setItems(getQueue(brandId));
    refresh();
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) refresh();
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener(EVENT, refresh);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(EVENT, refresh);
    };
  }, [brandId]);

  return items;
}
