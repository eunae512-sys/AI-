"use client";

// 분배 로그 — 최근 활동 매거진식 타임라인.

import * as React from "react";
import type { DistributionLogEvent } from "@/lib/distribution/types";

const ACTION_LABEL: Record<DistributionLogEvent["action"], string> = {
  queue: "분배 큐 등록",
  schedule: "예약",
  publish: "발행",
  copy: "복사",
  skip: "건너뜀",
  fail: "실패",
  webhook: "Webhook 전송",
};

const ACTION_DOT: Record<DistributionLogEvent["action"], string> = {
  queue: "bg-amber-500",
  schedule: "bg-sky-500",
  publish: "bg-emerald-500",
  copy: "bg-zinc-400",
  skip: "bg-zinc-300",
  fail: "bg-rose-500",
  webhook: "bg-violet-500",
};

const PLATFORM_LABEL: Record<string, string> = {
  "naver-place": "네이버 플레이스",
  "instagram-cardnews": "Instagram 피드",
  "instagram-caption": "Instagram 캡션",
  "instagram-reels": "Instagram 릴스",
  "naver-blog": "네이버 블로그",
  "naver-clip": "네이버 클립",
  "facebook": "페이스북",
  "threads": "스레드",
  "tiktok": "틱톡",
  "youtube-shorts": "유튜브 쇼츠",
  "kakao-channel": "카카오 채널",
};

export function DistributionLog({ events }: { events: DistributionLogEvent[] }) {
  if (events.length === 0) {
    return (
      <div className="py-12 text-center">
        <div className="editorial-label">No activity yet</div>
        <p className="mt-3 text-[12.5px] text-zinc-500">
          플랫폼 카드의 액션을 누르면 여기 기록됩니다.
        </p>
      </div>
    );
  }

  return (
    <ol className="divide-y divide-zinc-200 dark:divide-zinc-800 border-y border-zinc-200 dark:border-zinc-800">
      {events.map((e) => {
        const at = new Date(e.at);
        const time = at.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
        const date = at.toLocaleDateString("ko-KR", { month: "2-digit", day: "2-digit" });
        return (
          <li key={e.id} className="grid grid-cols-12 gap-x-4 py-3 items-baseline text-[12px]">
            <div className="col-span-2 sm:col-span-1 flex items-center gap-2">
              <span className={`inline-block h-1.5 w-1.5 rounded-full ${ACTION_DOT[e.action]}`} />
              <span className="tabular-nums text-zinc-400">{time}</span>
            </div>
            <div className="col-span-2 sm:col-span-1 tabular-nums text-zinc-400 hidden sm:block">
              {date}
            </div>
            <div className="col-span-4 sm:col-span-3 text-zinc-700 dark:text-zinc-300 truncate">
              {PLATFORM_LABEL[e.platformId] ?? e.platformId}
            </div>
            <div className="col-span-2 text-[10.5px] tracking-[0.08em] uppercase text-zinc-500">
              {ACTION_LABEL[e.action]}
            </div>
            <div className="col-span-4 sm:col-span-5 text-zinc-500 truncate" title={e.detail}>
              {e.detail}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
