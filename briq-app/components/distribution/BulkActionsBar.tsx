"use client";

// 일괄 액션 바 — 모바일 우선 재설계.
//   모바일: 카운터 한 줄 → 액션 한 줄 → 일괄 예약은 접이식
//   데스크탑(sm+): 한 줄에 펴짐.

import * as React from "react";
import { Calendar, Send, RotateCcw, Settings2, Lock, ChevronDown } from "lucide-react";

type Props = {
  /** 전체 플랫폼 수 */
  total: number;
  scheduledCount: number;
  publishedCount: number;
  webhookConfigured: boolean;
  /** Free 플랜에서는 webhook 잠김 — 자물쇠 아이콘 노출 */
  webhookLocked?: boolean;
  onScheduleAll: (iso: string, stagger: number) => void;
  onDistributeAll: () => void;
  onResetAll: () => void;
  onOpenWebhook: () => void;
};

export function BulkActionsBar({
  total,
  scheduledCount,
  publishedCount,
  webhookConfigured,
  webhookLocked,
  onScheduleAll,
  onDistributeAll,
  onResetAll,
  onOpenWebhook,
}: Props) {
  const [bulkTime, setBulkTime] = React.useState("");
  const [stagger, setStagger] = React.useState(5);
  const [scheduleOpen, setScheduleOpen] = React.useState(false);

  const applyBulk = () => {
    if (!bulkTime) return;
    const iso = new Date(bulkTime).toISOString();
    onScheduleAll(iso, stagger);
  };

  return (
    <section className="py-4 sm:py-5 border-y border-zinc-200 dark:border-zinc-800">
      {/* 데스크탑 — 한 줄 (sm+) */}
      <div className="hidden sm:flex flex-wrap items-center gap-x-6 gap-y-3">
        <div className="flex items-center gap-2.5">
          <Calendar className="h-3.5 w-3.5 text-zinc-400" />
          <span className="editorial-label">일괄 예약</span>
          <input
            type="datetime-local"
            value={bulkTime}
            onChange={(e) => setBulkTime(e.target.value)}
            className="bg-transparent border border-zinc-200 dark:border-zinc-800 px-2 py-1 text-[11.5px] tabular-nums outline-none focus:border-zinc-900 dark:focus:border-zinc-100"
          />
          <span className="inline-flex items-center gap-1.5 text-[10.5px] text-zinc-500">
            <span>+</span>
            <input
              type="number"
              min={0}
              max={60}
              step={1}
              value={stagger}
              onChange={(e) => setStagger(Number(e.target.value))}
              className="w-10 bg-transparent border border-zinc-200 dark:border-zinc-800 px-1 py-0.5 text-[11px] text-center tabular-nums outline-none"
            />
            <span>분 간격</span>
          </span>
          <button
            type="button"
            onClick={applyBulk}
            disabled={!bulkTime}
            className="h-7 px-3 text-[10.5px] tracking-[0.12em] uppercase border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900 disabled:opacity-30 transition-colors"
          >
            적용
          </button>
        </div>

        <div className="h-5 w-px bg-zinc-200 dark:bg-zinc-800 hidden md:block" />

        <button
          type="button"
          onClick={onDistributeAll}
          className="inline-flex items-center gap-1.5 h-9 px-4 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-[11.5px] tracking-[0.1em] uppercase font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
        >
          <Send className="h-3 w-3" />
          모두 분배 큐로
        </button>
        <button
          type="button"
          onClick={onResetAll}
          className="inline-flex items-center gap-1.5 text-[11px] tracking-[0.08em] uppercase text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
        >
          <RotateCcw className="h-3 w-3" />
          리셋
        </button>

        <div className="ml-auto flex items-center gap-4 text-[10.5px] tabular-nums text-zinc-500">
          <span>
            예약 <span className="text-zinc-900 dark:text-zinc-100">{scheduledCount}</span>/{total}
          </span>
          <span>
            발행 <span className="text-zinc-900 dark:text-zinc-100">{publishedCount}</span>/{total}
          </span>
          <button
            type="button"
            onClick={onOpenWebhook}
            title={webhookLocked ? "Webhook 분배는 Pro 부터" : undefined}
            className="inline-flex items-center gap-1.5 text-[10.5px] tracking-[0.08em] uppercase text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
          >
            {webhookLocked ? <Lock className="h-3 w-3" /> : <Settings2 className="h-3 w-3" />}
            Webhook {webhookLocked ? "Pro" : webhookConfigured ? "●" : "○"}
          </button>
        </div>
      </div>

      {/* 모바일 — 세 줄 (~sm) */}
      <div className="sm:hidden space-y-3">
        {/* 1행: 카운터 + Webhook */}
        <div className="flex items-center justify-between text-[10.5px] tabular-nums text-zinc-500">
          <div className="flex items-center gap-3">
            <span>
              예약 <span className="text-zinc-900 dark:text-zinc-100">{scheduledCount}</span>/{total}
            </span>
            <span>
              발행 <span className="text-zinc-900 dark:text-zinc-100">{publishedCount}</span>/{total}
            </span>
          </div>
          <button
            type="button"
            onClick={onOpenWebhook}
            title={webhookLocked ? "Webhook 분배는 Pro 부터" : undefined}
            className="inline-flex items-center gap-1.5 text-[10.5px] tracking-[0.08em] uppercase text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
          >
            {webhookLocked ? <Lock className="h-3 w-3" /> : <Settings2 className="h-3 w-3" />}
            Webhook {webhookLocked ? "Pro" : webhookConfigured ? "●" : "○"}
          </button>
        </div>

        {/* 2행: 분배 버튼 + 리셋 */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onDistributeAll}
            className="flex-1 inline-flex items-center justify-center gap-1.5 h-10 px-4 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-[11.5px] tracking-[0.1em] uppercase font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
          >
            <Send className="h-3 w-3" />
            모두 분배 큐로
          </button>
          <button
            type="button"
            onClick={onResetAll}
            className="inline-flex items-center gap-1.5 h-10 px-3 text-[11px] tracking-[0.08em] uppercase text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 border border-zinc-200 dark:border-zinc-800"
          >
            <RotateCcw className="h-3 w-3" />
            리셋
          </button>
        </div>

        {/* 3행: 일괄 예약 접이식 */}
        <div className="border border-zinc-200 dark:border-zinc-800">
          <button
            type="button"
            onClick={() => setScheduleOpen((v) => !v)}
            aria-expanded={scheduleOpen}
            className="w-full flex items-center justify-between px-3 py-2.5"
          >
            <span className="inline-flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5 text-zinc-400" />
              <span className="editorial-label">일괄 예약</span>
            </span>
            <ChevronDown
              className={`h-3.5 w-3.5 text-zinc-400 transition-transform ${scheduleOpen ? "rotate-180" : ""}`}
            />
          </button>
          {scheduleOpen && (
            <div className="px-3 pb-3 pt-1 space-y-2 border-t border-zinc-200 dark:border-zinc-800">
              <input
                type="datetime-local"
                value={bulkTime}
                onChange={(e) => setBulkTime(e.target.value)}
                className="w-full bg-transparent border border-zinc-200 dark:border-zinc-800 px-2 py-2 text-[12px] tabular-nums outline-none focus:border-zinc-900 dark:focus:border-zinc-100"
              />
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 text-[10.5px] text-zinc-500">
                  <span>+</span>
                  <input
                    type="number"
                    min={0}
                    max={60}
                    step={1}
                    value={stagger}
                    onChange={(e) => setStagger(Number(e.target.value))}
                    className="w-12 bg-transparent border border-zinc-200 dark:border-zinc-800 px-1 py-0.5 text-[11px] text-center tabular-nums outline-none"
                  />
                  <span>분 간격</span>
                </span>
                <button
                  type="button"
                  onClick={applyBulk}
                  disabled={!bulkTime}
                  className="h-8 px-4 text-[10.5px] tracking-[0.12em] uppercase border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900 disabled:opacity-30 transition-colors"
                >
                  적용
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
