"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Check, Plus } from "lucide-react";
import { useBrand } from "@/components/brand/BrandProvider";
import {
  INK,
  INK_MUTE,
  RULE,
  PAPER,
  PAPER_HOVER,
  SAGE,
} from "@/lib/landing/tokens";

type Props = {
  onNavigate?: () => void;
};

export function BrandSwitcher({ onNavigate }: Props) {
  const { allBrands, brand, setBrandId } = useBrand();
  const [open, setOpen] = React.useState(false);
  const router = useRouter();
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const menuRef = React.useRef<HTMLDivElement>(null);

  // 바깥 클릭 닫기
  React.useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (
        !triggerRef.current?.contains(e.target as Node) &&
        !menuRef.current?.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // ESC 닫기
  React.useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  if (allBrands.length <= 1) {
    // 솔로 — 드롭다운 없이 브랜드명 텍스트만
    return (
      <div
        className="text-[11px] truncate"
        style={{ color: INK_MUTE, wordBreak: "keep-all" }}
        title={brand.name}
      >
        {brand.name}
      </div>
    );
  }

  return (
    <div className="relative w-full">
      {/* 트리거 버튼 */}
      <button
        ref={triggerRef}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-1 w-full text-left overflow-hidden"
        style={{ color: INK_MUTE }}
        title={brand.name}
      >
        <span className="text-[11px] truncate flex-1" style={{ wordBreak: "keep-all" }}>
          {brand.name}
        </span>
        <ChevronDown
          className="shrink-0"
          style={{
            width: 12,
            height: 12,
            color: INK_MUTE,
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.15s ease",
          }}
        />
      </button>

      {/* 드롭다운 메뉴 */}
      {open && (
        <div
          ref={menuRef}
          role="menu"
          className="absolute left-0 bottom-full mb-1 w-full min-w-[160px] z-50"
          style={{
            background: PAPER,
            border: `0.5px solid ${RULE}`,
            boxShadow: "0 2px 8px rgba(20,19,15,0.08)",
          }}
        >
          {/* 브랜드 목록 */}
          {allBrands.map((b) => {
            const isActive = b.id === brand.id;
            return (
              <button
                key={b.id}
                role="menuitem"
                onClick={() => {
                  setBrandId(b.id);
                  setOpen(false);
                }}
                className="flex items-center gap-2 w-full px-3 py-2 text-left transition-colors"
                style={{
                  color: INK,
                  background: "transparent",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = PAPER_HOVER;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                }}
              >
                <span
                  className="flex-1 text-[12px] truncate"
                  style={{ wordBreak: "keep-all" }}
                >
                  {b.name}
                </span>
                {isActive && (
                  <Check
                    style={{ width: 12, height: 12, color: SAGE, flexShrink: 0 }}
                  />
                )}
              </button>
            );
          })}

          {/* 구분선 */}
          <div style={{ height: "0.5px", background: RULE, margin: "0 8px" }} />

          {/* TODO(billing): 플랜별 브랜드 수 상한 게이팅 지점 — 이번 범위 밖 */}
          <button
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onNavigate?.();
              router.push("/onboarding?add=1");
            }}
            className="flex items-center gap-2 w-full px-3 py-2 text-left transition-colors"
            style={{ color: INK_MUTE, background: "transparent" }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = PAPER_HOVER;
              (e.currentTarget as HTMLButtonElement).style.color = INK;
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "transparent";
              (e.currentTarget as HTMLButtonElement).style.color = INK_MUTE;
            }}
          >
            <Plus style={{ width: 12, height: 12, flexShrink: 0 }} />
            <span className="text-[12px]">브랜드 추가</span>
          </button>
        </div>
      )}
    </div>
  );
}
