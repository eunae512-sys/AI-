"use client";

// 워터마크 — Free 사용자에게만 자동 삽입.
// 카드뉴스 / 릴스 / 분배 미리보기 어디든 한 줄로 끼울 수 있게 단일 컴포넌트.
//
// 디자인 원칙:
//   · 무료 플랜에서 진짜 거슬리도록 위치하되 시안을 망치진 않음 — 좌하단 / 우하단 작게
//   · 매거진 톤 유지 (Cormorant Italic + tracking)
//   · Pro 이상은 자동으로 안 보임 — useUsage().plan.showWatermark 기반

import * as React from "react";
import { useUsage } from "@/lib/billing/use-usage";

type Position = "bottom-left" | "bottom-right" | "top-right";
type Variant = "light" | "dark" | "auto";

type Props = {
  position?: Position;
  variant?: Variant;
  /** 강제로 보이거나 숨김 — 미리보기 / 데모용 */
  force?: boolean;
  className?: string;
};

export function Watermark({ position = "bottom-left", variant = "auto", force, className }: Props) {
  const { plan, isMounted } = useUsage();
  // SSR / hydration 정책:
  //   · force === true : 항상 노출 (미리보기·데모용)
  //   · 마운트 전 : Free 가 디폴트이므로 노출하는 게 자연스럽다 (Pro 사용자가 1프레임 깜빡이게 두는 비용보다,
  //     Free 사용자가 SSR 부터 워터마크를 보는 게 낫다 — Pro 는 마운트 후 자동 제거)
  if (!force) {
    if (isMounted && !plan.showWatermark) return null;
  }

  const posClass =
    position === "bottom-left"
      ? "left-3 bottom-3"
      : position === "bottom-right"
        ? "right-3 bottom-3"
        : "right-3 top-3";

  const variantClass =
    variant === "light"
      ? "text-white/80 mix-blend-screen"
      : variant === "dark"
        ? "text-zinc-900/65 mix-blend-multiply"
        : "text-white/75 mix-blend-overlay";

  return (
    <div
      aria-hidden="true"
      className={`absolute ${posClass} pointer-events-none select-none ${variantClass} ${className ?? ""}`}
    >
      <span
        className="text-[9px] tracking-[0.2em] uppercase"
        style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontStyle: "italic",
          letterSpacing: "0.18em",
        }}
      >
        Powered by BRIQ
      </span>
    </div>
  );
}
