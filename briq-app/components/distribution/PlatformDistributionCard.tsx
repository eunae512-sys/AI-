"use client";

// 플랫폼 분배 카드 — 한 플랫폼의 모든 상태·콘텐츠·액션을 한 카드 안에.
//
// 디자인: 인쇄 작업 의뢰서 결.
//   ┌──────────────────────────────────┐
//   │ ● 연결됨        [예약됨 chip]    │ ← 상태 헤더
//   │ Instagram 피드   캡션 7장 카드뉴스 │
//   │                                  │
//   │ 본문 미리보기 (3줄 max) …         │ ← primary copy
//   │                                  │
//   │ ───────────────────────────────  │
//   │ ⏱ 화 11:48  [datetime input]    │ ← 예약 슬롯
//   │ ───────────────────────────────  │
//   │ [복사]  [예약 등록]  [지금 분배] │ ← 액션 트리오
//   └──────────────────────────────────┘

import * as React from "react";
import { Copy, Check, Calendar, Send, X, RefreshCw, ExternalLink, Plug } from "lucide-react";
import type { PlatformId } from "@/lib/content/multi-channel-types";
import type { DistributionMode, DistributionStatus, PlatformDistributionState } from "@/lib/distribution/types";
import { STATUS_LABEL, STATUS_TONE } from "@/lib/distribution/storage";

type Props = {
  platformId: PlatformId;
  label: string;
  /** 플랫폼별 보조 라벨 — "카드뉴스 7장" "1500자 본문" 등 */
  format: string;
  mode: DistributionMode;
  connected: boolean;
  connectionNote?: string;
  state: PlatformDistributionState;
  /** 분배할 콘텐츠 — primary + 보조 블록 (캡션 / 해시태그 / 등) */
  primary: string;
  blocks?: { label: string; value: string; inline?: boolean }[];
  /** 외부 링크 — 발행 페이지 / 가이드 */
  externalLink?: { href: string; label: string };
  onSchedule: (iso: string | undefined) => void;
  onSend: () => void;
  onSkip: () => void;
  onCopy: () => void;
};

export function PlatformDistributionCard({
  platformId,
  label,
  format,
  mode,
  connected,
  connectionNote,
  state,
  primary,
  blocks,
  externalLink,
  onSchedule,
  onSend,
  onSkip,
  onCopy,
}: Props) {
  const tone = STATUS_TONE[state.status];
  const [expanded, setExpanded] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    const text = [primary, ...(blocks ?? []).map((b) => `[${b.label}]\n${b.value}`)].join("\n\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
      onCopy();
    } catch {
      /* ignore */
    }
  };

  const scheduledLocal = state.scheduledAt
    ? new Date(state.scheduledAt).toLocaleString("ko-KR", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })
    : "";

  const modeLabel: Record<DistributionMode, string> = {
    api: "API 자동",
    webhook: "Webhook",
    manual: "수동 보조",
  };

  // datetime-local 인풋 값 — local timezone ISO without seconds
  const inputValue = state.scheduledAt
    ? toDatetimeLocal(state.scheduledAt)
    : "";

  const onSendClick = () => {
    if (state.status === "published") return;
    onSend();
  };

  return (
    <article
      className={`border bg-[color:var(--bg-card)] dark:bg-zinc-950 flex flex-col ${
        state.status === "skipped"
          ? "border-zinc-200 dark:border-zinc-800 opacity-60"
          : "border-zinc-200 dark:border-zinc-800"
      }`}
    >
      {/* 헤더 — 연결 dot + 상태 chip + 모드 라벨 */}
      <header className="flex items-center gap-2.5 px-5 py-3 border-b border-zinc-100 dark:border-zinc-900">
        <span
          className={`inline-block h-2 w-2 rounded-full ${connected ? "bg-emerald-500" : "bg-zinc-300 dark:bg-zinc-700"}`}
          title={connected ? "연결됨" : "미연결"}
        />
        <span
          className="text-[10px] tracking-[0.15em] uppercase text-zinc-500"
          title={connectionNote}
        >
          {modeLabel[mode]}
        </span>
        <span className="ml-auto inline-flex items-center gap-1.5">
          <span className={`inline-block h-1.5 w-1.5 rounded-full ${tone.dot}`} />
          <span className={`text-[10.5px] tracking-[0.06em] ${tone.text} ${tone.bg} px-2 py-0.5`}>
            {STATUS_LABEL[state.status]}
          </span>
        </span>
      </header>

      {/* 플랫폼 이름 + 포맷 */}
      <div className="px-5 pt-4 pb-2">
        <h3
          className="text-[16px] tracking-tight"
          style={{ fontFamily: '"Pretendard Variable", Pretendard, sans-serif', fontWeight: 700 }}
        >
          {label}
        </h3>
        <p className="mt-1 text-[11px] tracking-[0.06em] text-zinc-500">{format}</p>
      </div>

      {/* primary 미리보기 */}
      <div className="px-5 pb-4 flex-1">
        <p
          className={`text-[13.5px] leading-[1.6] text-zinc-700 dark:text-zinc-300 whitespace-pre-line ${
            expanded ? "" : "line-clamp-4"
          }`}
          style={{ fontFamily: '"Pretendard Variable", Pretendard, sans-serif', fontWeight: 500 }}
        >
          {primary}
        </p>
        {(primary.length > 140 || (blocks && blocks.length > 0)) && (
          <button
            type="button"
            onClick={() => setExpanded((e) => !e)}
            className="mt-2 text-[10.5px] tracking-[0.12em] uppercase text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
          >
            {expanded ? "접기 −" : "전체 보기 +"}
          </button>
        )}

        {/* 펼친 상태에서 보조 블록 */}
        {expanded && blocks && blocks.length > 0 && (
          <dl className="mt-4 space-y-3 border-t border-zinc-100 dark:border-zinc-900 pt-3">
            {blocks.map((b, i) => (
              <div key={i}>
                <dt className="editorial-label mb-1">{b.label}</dt>
                <dd
                  className={`text-[12.5px] leading-[1.6] text-zinc-600 dark:text-zinc-400 whitespace-pre-line ${
                    b.inline ? "" : "max-h-[200px] overflow-auto"
                  }`}
                  style={{ fontFamily: '"Pretendard Variable", Pretendard, sans-serif' }}
                >
                  {b.value}
                </dd>
              </div>
            ))}
          </dl>
        )}
      </div>

      {/* 예약 슬롯 */}
      <div className="px-5 py-3 border-t border-zinc-100 dark:border-zinc-900 flex items-center gap-2.5">
        <Calendar className="h-3 w-3 text-zinc-400" />
        <input
          type="datetime-local"
          value={inputValue}
          onChange={(e) => onSchedule(e.target.value ? fromDatetimeLocal(e.target.value) : undefined)}
          className="flex-1 bg-transparent border-0 outline-none text-[11.5px] text-zinc-700 dark:text-zinc-300 tabular-nums font-mono"
        />
        {state.scheduledAt && (
          <>
            <span className="text-[10.5px] text-sky-600 dark:text-sky-400 tabular-nums">{scheduledLocal}</span>
            <button
              type="button"
              onClick={() => onSchedule(undefined)}
              aria-label="예약 해제"
              className="h-5 w-5 grid place-items-center text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
            >
              <X className="h-3 w-3" />
            </button>
          </>
        )}
      </div>

      {/* 액션 트리오 — 모바일은 아이콘 우선, sm+ 부터 텍스트 동반 */}
      <footer className="grid grid-cols-3 border-t border-zinc-200 dark:border-zinc-800">
        <button
          type="button"
          onClick={handleCopy}
          aria-label={copied ? "복사됨" : "복사"}
          className="px-2 sm:px-3 py-3 text-[11px] tracking-[0.08em] uppercase text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 inline-flex items-center justify-center gap-1.5 transition-colors"
        >
          {copied ? <Check className="h-3.5 w-3.5 sm:h-3 sm:w-3" /> : <Copy className="h-3.5 w-3.5 sm:h-3 sm:w-3" />}
          <span className="hidden sm:inline">{copied ? "복사됨" : "복사"}</span>
        </button>
        <button
          type="button"
          onClick={onSkip}
          aria-label={state.status === "skipped" ? "복원" : "건너뜀"}
          className="px-2 sm:px-3 py-3 text-[11px] tracking-[0.08em] uppercase text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 inline-flex items-center justify-center gap-1.5 transition-colors"
        >
          <RefreshCw className="h-3.5 w-3.5 sm:h-3 sm:w-3" />
          <span className="hidden sm:inline">{state.status === "skipped" ? "복원" : "건너뜀"}</span>
        </button>
        <button
          type="button"
          onClick={onSendClick}
          disabled={!connected && mode === "api"}
          aria-label={mode === "manual" ? "보조" : !connected ? "연결" : state.scheduledAt ? "예약 등록" : "분배"}
          className="px-2 sm:px-3 py-3 text-[11px] tracking-[0.08em] uppercase bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:opacity-30 disabled:cursor-not-allowed inline-flex items-center justify-center gap-1.5 transition-colors"
          title={!connected && mode === "api" ? "계정 연결 필요" : "분배 큐에 등록"}
        >
          {mode === "manual" ? (
            <>
              <ExternalLink className="h-3.5 w-3.5 sm:h-3 sm:w-3" />
              <span className="hidden sm:inline">보조</span>
            </>
          ) : !connected ? (
            <>
              <Plug className="h-3.5 w-3.5 sm:h-3 sm:w-3" />
              <span className="hidden sm:inline">연결</span>
            </>
          ) : (
            <>
              <Send className="h-3.5 w-3.5 sm:h-3 sm:w-3" />
              <span className="hidden sm:inline">{state.scheduledAt ? "예약 등록" : "분배"}</span>
            </>
          )}
        </button>
      </footer>

      {/* 외부 링크 — 보조용 */}
      {externalLink && (
        <a
          href={externalLink.href}
          target="_blank"
          rel="noopener noreferrer"
          className="px-5 py-2 text-[10.5px] tracking-[0.1em] uppercase text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 border-t border-zinc-100 dark:border-zinc-900 inline-flex items-center gap-1.5"
        >
          <ExternalLink className="h-3 w-3" />
          {externalLink.label}
        </a>
      )}

      {/* 실패 사유 */}
      {state.status === "failed" && state.errorReason && (
        <div className="px-5 py-2 text-[10.5px] text-rose-600 dark:text-rose-400 border-t border-rose-100 dark:border-rose-900 bg-rose-50/50 dark:bg-rose-500/5">
          {state.errorReason}
        </div>
      )}
    </article>
  );
}

function toDatetimeLocal(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromDatetimeLocal(v: string): string {
  // datetime-local 입력은 로컬 타임존. ISO 로 변환.
  const d = new Date(v);
  return d.toISOString();
}
