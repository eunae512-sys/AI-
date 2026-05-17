"use client";

// 브랜드 마크 컨트롤 — 카드뉴스 캐러셀 상단의 작은 바.
//
// 사장님이 "로고 / 업체명" 위치만 한 번 설정하면 7장 모든 슬라이드에 일관 적용.
// 옵션은 셋: 로고 업로드 / 위치(TL·TC·TR) / 인너 슬라이드 노출.

import * as React from "react";
import { Upload, X } from "lucide-react";
import type { BrandMarkConfig } from "./types";

type Props = {
  config: BrandMarkConfig;
  brandWordmark: string;
  onChange: (next: BrandMarkConfig) => void;
};

const POSITIONS: { value: BrandMarkConfig["position"]; label: string }[] = [
  { value: "top-left", label: "좌상" },
  { value: "top-center", label: "중앙" },
  { value: "top-right", label: "우상" },
];

export function BrandMarkPicker({ config, brandWordmark, onChange }: Props) {
  const fileRef = React.useRef<HTMLInputElement>(null);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith("image/")) return;
    if (f.size > 2 * 1024 * 1024) {
      alert("로고는 2MB 이하 파일로 올려주세요.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      onChange({ ...config, logoDataUrl: reader.result as string });
    };
    reader.readAsDataURL(f);
  };

  const removeLogo = () => onChange({ ...config, logoDataUrl: undefined });

  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 py-2.5">
      {/* 로고 미리보기 / 업로드 */}
      <div className="flex items-center gap-2.5">
        <span className="editorial-label">브랜드 마크</span>
        {config.logoDataUrl ? (
          <div className="flex items-center gap-2">
            <img
              src={config.logoDataUrl}
              alt="brand logo"
              className="h-6 w-auto max-w-[60px] object-contain"
            />
            <button
              type="button"
              onClick={removeLogo}
              aria-label="로고 삭제"
              className="h-5 w-5 grid place-items-center rounded text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ) : (
          <span
            className="text-[12px] tracking-[0.04em] text-zinc-700 dark:text-zinc-300"
            style={{ fontFamily: '"Pretendard Variable", Pretendard, sans-serif', fontWeight: 600 }}
          >
            {brandWordmark}
          </span>
        )}
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="inline-flex items-center gap-1 text-[10.5px] tracking-[0.12em] uppercase text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
        >
          <Upload className="h-3 w-3" />
          {config.logoDataUrl ? "교체" : "로고 업로드"}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/svg+xml"
          onChange={handleUpload}
          className="hidden"
        />
      </div>

      {/* 위치 — 좌상 / 중앙 / 우상 */}
      <div className="flex items-center gap-2">
        <span className="editorial-label">위치</span>
        <div className="inline-flex border border-zinc-200 dark:border-zinc-800">
          {POSITIONS.map((p) => {
            const active = config.position === p.value;
            return (
              <button
                key={p.value}
                type="button"
                onClick={() => onChange({ ...config, position: p.value })}
                className={`px-2.5 h-7 text-[10.5px] tracking-[0.05em] transition-colors ${
                  active
                    ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900"
                    : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
                }`}
              >
                {p.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 표시 범위 — 표지만 vs 전체 슬라이드 */}
      <div className="flex items-center gap-2 ml-auto">
        <span className="editorial-label">표시 범위</span>
        <div className="inline-flex border border-zinc-200 dark:border-zinc-800">
          <button
            type="button"
            onClick={() => onChange({ ...config, showOnInner: false })}
            title="표지(1번 슬라이드)에만 크게 노출 — 사진을 가장 강조"
            className={`px-2.5 h-7 text-[10.5px] tracking-[0.05em] transition-colors ${
              !config.showOnInner
                ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
            }`}
          >
            표지만
          </button>
          <button
            type="button"
            onClick={() => onChange({ ...config, showOnInner: true })}
            title="7장 모두에 작은 워터마크 — 브랜드 인지 강화"
            className={`px-2.5 h-7 text-[10.5px] tracking-[0.05em] transition-colors ${
              config.showOnInner
                ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
            }`}
          >
            전체 카드
          </button>
        </div>
        <span className="text-[10.5px] text-zinc-500 leading-snug hidden sm:inline max-w-[200px]">
          {config.showOnInner
            ? "7장 모두에 작은 워터마크"
            : "표지(1번)에만 크게, 나머지는 사진 강조"}
        </span>
      </div>
    </div>
  );
}
