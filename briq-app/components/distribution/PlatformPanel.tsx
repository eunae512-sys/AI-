"use client";

// 플랫폼별 출력 패널 — 카피 + 복사 버튼.
// 패널 1개 = 플랫폼 1개의 모든 아웃풋 (제목/본문/해시태그/CTA 등을 블록으로).

import * as React from "react";
import { Copy, Check } from "lucide-react";

type Block = {
  label: string;
  value: string;
  /** 인라인 (한 줄) 표시 — 해시태그·짧은 값 */
  inline?: boolean;
};

type Props = {
  label: string;
  /** 플랫폼 라벨 옆 작은 뱃지 (글자 수, 컷 수 등) */
  badge?: string;
  /** 첫 줄 강조 — 헤드라인 / 후킹 / 후킹 라인 */
  primary: string;
  blocks: Block[];
  /** 패널 하단 추가 영역 — 체크리스트 등 */
  footer?: React.ReactNode;
  /** 헤더 옆 작은 보조 메모 */
  note?: string;
};

export function PlatformPanel({ label, badge, primary, blocks, footer, note }: Props) {
  // 전체 콘텐츠를 복사용 텍스트 한 덩어리로
  const allText = React.useMemo(() => {
    const lines = [primary, ""];
    for (const b of blocks) {
      lines.push(`[${b.label}]`);
      lines.push(b.value);
      lines.push("");
    }
    return lines.join("\n").trim();
  }, [primary, blocks]);

  return (
    <article className="border border-zinc-200 dark:border-zinc-800 bg-[color:var(--bg-card)] dark:bg-zinc-950">
      {/* 헤더 */}
      <header className="flex items-center gap-3 px-5 py-3 border-b border-zinc-100 dark:border-zinc-900">
        <div className="editorial-label">{label}</div>
        {badge && (
          <span className="text-[10px] tracking-[0.12em] uppercase text-zinc-500 bg-zinc-100 dark:bg-zinc-900 px-2 py-0.5">
            {badge}
          </span>
        )}
        {note && <span className="text-[10.5px] text-zinc-400 truncate">{note}</span>}
        <CopyButton text={allText} className="ml-auto" tone="all" />
      </header>

      <div className="px-5 py-5 space-y-4">
        {/* primary */}
        <div className="flex items-start gap-2">
          <p
            className="flex-1 text-[15px] leading-[1.5] tracking-[-0.005em] text-zinc-900 dark:text-zinc-100 whitespace-pre-line"
            style={{ fontFamily: '"Pretendard Variable", Pretendard, sans-serif', fontWeight: 600 }}
          >
            {primary}
          </p>
          <CopyButton text={primary} />
        </div>

        {/* blocks */}
        {blocks.length > 0 && (
          <dl className="space-y-3 pt-2 border-t border-zinc-100 dark:border-zinc-900">
            {blocks.map((b, i) => (
              <div key={i}>
                <div className="flex items-baseline justify-between mb-1">
                  <dt className="editorial-label">{b.label}</dt>
                  <CopyButton text={b.value} />
                </div>
                <dd
                  className={`text-[13px] leading-[1.6] text-zinc-700 dark:text-zinc-300 whitespace-pre-line ${
                    b.inline ? "" : "max-h-[280px] overflow-auto"
                  }`}
                  style={{ fontFamily: '"Pretendard Variable", Pretendard, sans-serif', fontWeight: 400 }}
                >
                  {b.value}
                </dd>
              </div>
            ))}
          </dl>
        )}

        {/* footer */}
        {footer && (
          <div className="pt-3 border-t border-zinc-100 dark:border-zinc-900">
            <div className="editorial-label mb-2">발행 체크리스트</div>
            {footer}
          </div>
        )}
      </div>
    </article>
  );
}

function CopyButton({ text, className, tone }: { text: string; className?: string; tone?: "all" }) {
  const [copied, setCopied] = React.useState(false);
  const onClick = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      // 무시
    }
  };
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1 text-[10px] tracking-[0.14em] uppercase text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors ${
        className ?? ""
      }`}
      aria-label="복사"
      title={tone === "all" ? "전체 복사" : "복사"}
    >
      {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
      {tone === "all" ? (copied ? "전체 복사됨" : "전체 복사") : copied ? "복사됨" : "복사"}
    </button>
  );
}
