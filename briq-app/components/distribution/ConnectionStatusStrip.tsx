"use client";

// 상단 연결 상태 스트립 — 8 플랫폼 연결 여부 한 줄.

import * as React from "react";
import { Plug } from "lucide-react";
import type { PlatformConnection } from "@/lib/distribution/types";

export function ConnectionStatusStrip({
  connections,
  onToggle,
}: {
  connections: PlatformConnection[];
  onToggle: (id: PlatformConnection["id"]) => void;
}) {
  const connected = connections.filter((c) => c.connected).length;
  const total = connections.length;

  return (
    <section className="border-y border-zinc-200 dark:border-zinc-800 py-4">
      <div className="flex items-baseline justify-between mb-3">
        <div className="editorial-label">연결 상태</div>
        <div className="text-[11px] tabular-nums text-zinc-500">
          <span className="text-zinc-900 dark:text-zinc-100">{connected}</span> / {total} 활성
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-2">
        {connections.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => onToggle(c.id)}
            title={c.note ?? (c.connected ? "연결 해제" : "연결")}
            className={`group inline-flex items-center gap-1.5 px-2.5 h-7 border text-[11px] tracking-[0.02em] transition-colors ${
              c.connected
                ? "border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-900"
                : "border-zinc-200/60 dark:border-zinc-800/60 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                c.connected ? "bg-emerald-500" : "bg-zinc-300 dark:bg-zinc-700"
              }`}
            />
            <span>{c.label}</span>
            {!c.connected && c.mode === "api" && (
              <Plug className="h-2.5 w-2.5 opacity-50 group-hover:opacity-100" />
            )}
          </button>
        ))}
      </div>
    </section>
  );
}
