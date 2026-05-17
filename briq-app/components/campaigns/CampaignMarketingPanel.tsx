"use client";

// 인스타 마케팅 자산 패널 — 캠페인 카드 안에서 카드뉴스 옆/아래로 노출.
//
// 사장님이 "왜 이게 좋은지" 발행 전에 보도록:
//   ① 캡션 — 후킹 + 본문 + CTA 한 덩어리 (인스타 게시물 본문 그대로 복사 가능)
//   ② 해시태그 — 핵심·롱테일·캠페인 종류 섞은 12~15개
//   ③ CTA — 마지막 슬라이드 + 캡션 끝의 단일 행동
//   ④ 예상 지표 — 저장률 · 공유율 · 댓글 · 팔로우 전환 (왜 이게 좋은지)

import * as React from "react";
import { Copy, Check } from "lucide-react";
import type { CardnewsMarketing } from "./types";

export function CampaignMarketingPanel({ marketing }: { marketing: CardnewsMarketing }) {
  return (
    <div className="mt-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 border-t border-zinc-200 dark:border-zinc-800 pt-8">
      {/* 좌측: 캡션 + 해시태그 + CTA */}
      <div className="lg:col-span-7 space-y-7">
        <CopyableBlock label="인스타 캡션" content={marketing.caption} multiline />
        <CopyableBlock label="해시태그" content={marketing.hashtags.join(" ")} />
        <div>
          <div className="flex items-baseline justify-between mb-2">
            <div className="editorial-label">CTA · 단 하나의 행동</div>
          </div>
          <div className="p-4 bg-[color:var(--bg-soft)]/40 border border-zinc-200 dark:border-zinc-800">
            <p
              className="text-[14.5px] leading-[1.7] text-zinc-800 dark:text-zinc-200"
              style={{ fontFamily: "'Nanum Myeongjo', serif" }}
            >
              {marketing.cta}
            </p>
          </div>
        </div>
      </div>

      {/* 우측: 예상 지표 */}
      <div className="lg:col-span-5">
        <div className="editorial-label mb-3">예상 지표</div>
        <dl className="grid grid-cols-2 gap-x-0 gap-y-5 border-y border-zinc-200 dark:border-zinc-800 py-5">
          <Metric label="저장률" value={marketing.expectedMetrics.saveRate} hint="우리 가게 평균 대비" />
          <Metric label="공유율" value={marketing.expectedMetrics.shareRate} hint="인스타 평균 1.2%" border />
          <Metric label="댓글" value={marketing.expectedMetrics.comments} hint="발행 24시간 안" />
          <Metric label="팔로우 전환" value={marketing.expectedMetrics.followConv} hint="저장→팔로우" border />
        </dl>
        <p className="mt-3 text-[10.5px] text-zinc-400 leading-relaxed">
          최근 4주 발행 데이터 + 후킹 공식 보정. 발행 12시간 안 한 번 보정됩니다.
        </p>
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  hint,
  border,
}: {
  label: string;
  value: string;
  hint: string;
  border?: boolean;
}) {
  return (
    <div className={`px-4 first:pl-0 ${border ? "sm:border-l sm:border-zinc-200 dark:sm:border-zinc-800" : ""}`}>
      <div className="editorial-label">{label}</div>
      <div
        className="mt-1.5 text-[22px] sm:text-[26px] tabular-nums leading-none tracking-tight"
        style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 500 }}
      >
        {value}
      </div>
      <div className="mt-1.5 text-[10.5px] text-zinc-500">{hint}</div>
    </div>
  );
}

function CopyableBlock({
  label,
  content,
  multiline,
}: {
  label: string;
  content: string;
  multiline?: boolean;
}) {
  const [copied, setCopied] = React.useState(false);
  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // 무시
    }
  };
  return (
    <div>
      <div className="flex items-baseline justify-between mb-2">
        <div className="editorial-label">{label}</div>
        <button
          type="button"
          onClick={onCopy}
          className="inline-flex items-center gap-1.5 text-[10.5px] tracking-[0.15em] uppercase text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
        >
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          {copied ? "복사됨" : "복사"}
        </button>
      </div>
      <pre
        className={`p-4 bg-[color:var(--bg-soft)]/40 border border-zinc-200 dark:border-zinc-800 text-[13.5px] leading-[1.7] text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap font-sans ${
          multiline ? "min-h-[160px]" : ""
        }`}
      >
        {content}
      </pre>
    </div>
  );
}
