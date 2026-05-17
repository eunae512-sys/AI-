"use client";

// Webhook 설정 모달 — Make / Zapier URL 입력 + ping 테스트.
//
// API 가 없는 플랫폼 (TikTok / Threads / YouTube Shorts) 은 외부 자동화로 위임한다.
// 사용자가 Make 시나리오를 만들고 그 webhook URL 을 여기에 등록하면, 분배 액션이 이 URL 로 페이로드를 던진다.

import * as React from "react";
import { X, CheckCircle2, AlertCircle, Zap } from "lucide-react";
import type { WebhookConfig } from "@/lib/distribution/types";

type Props = {
  open: boolean;
  config: WebhookConfig;
  onClose: () => void;
  onSave: (cfg: WebhookConfig) => void;
};

export function WebhookConfigModal({ open, config, onClose, onSave }: Props) {
  const [url, setUrl] = React.useState(config.url ?? "");
  const [secret, setSecret] = React.useState(config.secret ?? "");
  const [pingState, setPingState] = React.useState<"idle" | "loading" | "ok" | "fail">("idle");
  const [pingDetail, setPingDetail] = React.useState<string>("");

  React.useEffect(() => {
    if (open) {
      setUrl(config.url ?? "");
      setSecret(config.secret ?? "");
      setPingState("idle");
      setPingDetail("");
    }
  }, [open, config.url, config.secret]);

  if (!open) return null;

  const isValidUrl = (() => {
    try {
      const u = new URL(url);
      return u.protocol === "https:" || u.protocol === "http:";
    } catch {
      return false;
    }
  })();

  const handlePing = async () => {
    if (!isValidUrl) return;
    setPingState("loading");
    setPingDetail("");
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(secret ? { "X-Webhook-Secret": secret } : {}),
        },
        body: JSON.stringify({
          type: "ping",
          source: "briq",
          at: new Date().toISOString(),
        }),
      });
      if (res.ok) {
        setPingState("ok");
        setPingDetail(`응답 ${res.status}`);
      } else {
        setPingState("fail");
        setPingDetail(`응답 ${res.status}`);
      }
    } catch (e) {
      setPingState("fail");
      setPingDetail(e instanceof Error ? e.message : "네트워크 오류");
    }
  };

  const handleSave = () => {
    onSave({
      url: url || undefined,
      secret: secret || undefined,
      lastPingOk: pingState === "ok" ? true : config.lastPingOk,
      lastPingAt: pingState !== "idle" && pingState !== "loading" ? new Date().toISOString() : config.lastPingAt,
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[520px] bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <header className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">
          <div>
            <div className="editorial-label">Webhook 연결</div>
            <h2
              className="mt-1 text-[20px] tracking-tight"
              style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 500, fontStyle: "italic" }}
            >
              Make · Zapier · n8n
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="h-8 w-8 grid place-items-center text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="px-6 py-5 space-y-5">
          <p className="text-[12.5px] leading-[1.65] text-zinc-600 dark:text-zinc-400">
            공식 API 없는 플랫폼 (스레드 / 틱톡 / 유튜브 쇼츠) 은 Make 또는 Zapier 시나리오로 위임합니다.
            여기에 webhook URL 을 등록하면 분배 액션이 그 URL 에 페이로드를 던지고, 외부 자동화가 실제 발행을 처리합니다.
          </p>

          {/* URL */}
          <div>
            <label className="editorial-label block mb-2">Webhook URL</label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://hook.make.com/abc..."
              className="w-full bg-transparent border border-zinc-200 dark:border-zinc-800 px-3 py-2 text-[12.5px] tabular-nums outline-none focus:border-zinc-900 dark:focus:border-zinc-100"
            />
            {url && !isValidUrl && (
              <p className="mt-1.5 text-[10.5px] text-rose-600 dark:text-rose-400">URL 형식이 올바르지 않습니다.</p>
            )}
          </div>

          {/* Secret */}
          <div>
            <label className="editorial-label block mb-2">
              Secret <span className="text-zinc-400 normal-case tracking-normal">(선택 — X-Webhook-Secret 헤더로 전송)</span>
            </label>
            <input
              type="text"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              placeholder="—"
              className="w-full bg-transparent border border-zinc-200 dark:border-zinc-800 px-3 py-2 text-[12.5px] outline-none focus:border-zinc-900 dark:focus:border-zinc-100"
            />
          </div>

          {/* Ping 테스트 */}
          <div className="flex items-center gap-3 pt-1">
            <button
              type="button"
              onClick={handlePing}
              disabled={!isValidUrl || pingState === "loading"}
              className="inline-flex items-center gap-1.5 h-8 px-3 text-[11px] tracking-[0.1em] uppercase border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-900 disabled:opacity-30 transition-colors"
            >
              <Zap className="h-3 w-3" />
              {pingState === "loading" ? "전송 중..." : "Ping 테스트"}
            </button>
            {pingState === "ok" && (
              <span className="inline-flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-3.5 w-3.5" />
                연결 확인됨 · {pingDetail}
              </span>
            )}
            {pingState === "fail" && (
              <span className="inline-flex items-center gap-1.5 text-[11px] text-rose-600 dark:text-rose-400">
                <AlertCircle className="h-3.5 w-3.5" />
                실패 · {pingDetail}
              </span>
            )}
            {pingState === "idle" && config.lastPingAt && (
              <span className="text-[10.5px] text-zinc-400">
                마지막 ping {new Date(config.lastPingAt).toLocaleString("ko-KR")} {config.lastPingOk ? "●" : "○"}
              </span>
            )}
          </div>

          {/* 페이로드 미리보기 */}
          <details className="border border-zinc-100 dark:border-zinc-900">
            <summary className="px-3 py-2 text-[10.5px] tracking-[0.12em] uppercase text-zinc-500 cursor-pointer hover:text-zinc-900 dark:hover:text-zinc-100">
              페이로드 예시 ▾
            </summary>
            <pre className="px-3 py-2.5 text-[10.5px] leading-[1.5] text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-900/60 overflow-x-auto font-mono whitespace-pre">
{`{
  "type": "distribute",
  "platform": "threads",
  "brandId": "miokdang",
  "campaign": "봄나물 코스",
  "content": {
    "primary": "...",
    "hashtags": [...]
  },
  "scheduledAt": "2026-05-18T11:30:00+09:00"
}`}
            </pre>
          </details>
        </div>

        {/* 푸터 */}
        <footer className="flex items-center justify-end gap-2 px-6 py-4 border-t border-zinc-200 dark:border-zinc-800">
          <button
            type="button"
            onClick={onClose}
            className="h-8 px-4 text-[11px] tracking-[0.1em] uppercase text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="h-8 px-4 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-[11px] tracking-[0.1em] uppercase font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200"
          >
            저장
          </button>
        </footer>
      </div>
    </div>
  );
}
