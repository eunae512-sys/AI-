"use client";

// SmartTextOverlay — 이미지 + 텍스트 자동 배치 컴포넌트
//
// 사용 예:
//   <SmartTextOverlay
//     imageUrl={photo.url}
//     items={[
//       { role: "label", text: "TODAY" },
//       { role: "title", text: "오늘은 60개" },
//       { role: "subtitle", text: "오후 5시 종료" },
//       { role: "footer", text: brand.name },
//     ]}
//     target="instagram-feed-portrait"
//     aspectRatio={4/5}
//   />
//
// 동작:
//   - 이미지 로드 후 saliency 격자 계산
//   - 각 role 별로 best region 픽 → 텍스트 색·backdrop 자동
//   - 컨테이너 절대 위치에 텍스트 배치
//   - SSR 안전 (서버에선 안전영역만으로 fallback 렌더)

import * as React from "react";
import { motion } from "motion/react";
import {
  computePlacement,
  PLATFORM_SAFE_ZONES,
  type PlacementResult,
  type PlatformTarget,
  type Role,
  type BackdropKind,
} from "@/lib/layout/text-placement";

export type SmartTextItem = {
  role: Role;
  text: string;
  /** 추가 className — Tailwind 폰트/색 override 가능 */
  className?: string;
  /** 인라인 style override — fontFamily 등 */
  style?: React.CSSProperties;
  /** 클릭 핸들러 (편집 등) */
  onClick?: () => void;
};

export function SmartTextOverlay({
  imageUrl,
  items,
  target,
  aspectRatio,
  className,
  showSafeZoneGuide = false,
}: {
  imageUrl?: string | null;
  items: SmartTextItem[];
  target: PlatformTarget;
  aspectRatio?: number;
  className?: string;
  /** 개발 중 안전영역 가이드 라인 노출 (디버깅) */
  showSafeZoneGuide?: boolean;
}) {
  const imgRef = React.useRef<HTMLImageElement | null>(null);
  const [imgEl, setImgEl] = React.useState<HTMLImageElement | null>(null);
  const [imgReady, setImgReady] = React.useState(false);

  // 이미지 로드 → element ref 갱신
  React.useEffect(() => {
    setImgReady(false);
    setImgEl(null);
  }, [imageUrl]);

  // placements 계산 — 이미지 로드 후, items 또는 target 변경 시
  const placements = React.useMemo(() => {
    return items.map((it) =>
      computePlacement({
        text: it.text,
        role: it.role,
        target,
        imageEl: imgReady ? imgEl : null,
        aspectRatio,
      }),
    );
  }, [items, target, aspectRatio, imgEl, imgReady]);

  return (
    <div className={`relative overflow-hidden ${className ?? ""}`}>
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          ref={(el) => {
            imgRef.current = el;
          }}
          src={imageUrl}
          alt=""
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
          onLoad={(e) => {
            const el = e.currentTarget as HTMLImageElement;
            setImgEl(el);
            setImgReady(true);
          }}
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 bg-zinc-200 dark:bg-zinc-800" />
      )}

      {/* 각 텍스트 항목 — placement 결과로 절대 위치 */}
      {placements.map((p, i) => (
        <TextLayer key={`${items[i].role}-${i}`} item={items[i]} p={p} />
      ))}

      {/* 디버그 — 안전영역 / region 가이드 */}
      {showSafeZoneGuide && <SafeZoneGuide target={target} placements={placements} />}
    </div>
  );
}

function TextLayer({ item, p }: { item: SmartTextItem; p: PlacementResult }) {
  const colorClass = p.textColor === "light" ? "text-white" : "text-zinc-900";
  // 모바일 가독성 — role 별 min/max 다르게.
  // 작은 미리보기 컨테이너에서도 14px 이상은 보장.
  const minPx =
    item.role === "title" ? 16
      : item.role === "body-quote" ? 14
        : item.role === "cta" ? 13
          : item.role === "subtitle" ? 12
            : 10; // label / footer
  const maxPx =
    item.role === "title" ? 96
      : item.role === "body-quote" ? 56
        : item.role === "cta" ? 28
          : item.role === "subtitle" ? 22
            : 14;
  const fontSize = `clamp(${minPx}px, ${p.fontSizePct * 100}cqh, ${maxPx}px)`;
  const justify =
    p.alignment === "center" ? "items-center text-center"
      : p.alignment === "right" ? "items-end text-right"
        : "items-start text-left";

  return (
    <>
      <Backdrop kind={p.backdrop} opacity={p.backdropOpacity} region={p.region} />
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.2, 0.7, 0.2, 1] }}
        className={`absolute flex flex-col ${justify} ${colorClass} ${item.className ?? ""}`}
        style={{
          left: `${p.region.x * 100}%`,
          top: `${p.region.y * 100}%`,
          width: `${p.region.width * 100}%`,
          height: `${p.region.height * 100}%`,
          fontSize,
          lineHeight: 1.18,
          letterSpacing: "-0.005em",
          textShadow:
            p.backdrop === "none" && p.textColor === "light"
              ? "0 1px 12px rgba(0,0,0,0.35)"
              : undefined,
          ...item.style,
        }}
        onClick={item.onClick}
      >
        {/* 라벨은 작게 한 줄 + uppercase tracking */}
        {item.role === "label" ? (
          <span style={{ letterSpacing: "0.18em", textTransform: "uppercase", fontWeight: 600 }}>
            {p.lines.join(" ")}
          </span>
        ) : (
          <span style={{ fontWeight: item.role === "title" ? 600 : 400 }}>
            {p.lines.map((line, li) => (
              <React.Fragment key={li}>
                {line}
                {li < p.lines.length - 1 && <br />}
              </React.Fragment>
            ))}
          </span>
        )}
      </motion.div>
    </>
  );
}

function Backdrop({
  kind,
  opacity,
  region,
}: {
  kind: BackdropKind;
  opacity: number;
  region: { x: number; y: number; width: number; height: number };
}) {
  if (kind === "none") return null;
  if (kind === "scrim-top") {
    return (
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 pointer-events-none"
        style={{
          height: "42%",
          background: `linear-gradient(to bottom, rgba(0,0,0,${opacity}) 0%, rgba(0,0,0,${opacity * 0.4}) 50%, transparent 100%)`,
        }}
      />
    );
  }
  if (kind === "scrim-bottom") {
    return (
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 pointer-events-none"
        style={{
          height: "50%",
          background: `linear-gradient(to top, rgba(0,0,0,${opacity}) 0%, rgba(0,0,0,${opacity * 0.45}) 55%, transparent 100%)`,
        }}
      />
    );
  }
  if (kind === "scrim-center") {
    return (
      <div
        aria-hidden
        className="absolute inset-x-0 pointer-events-none"
        style={{
          top: `${(region.y - 0.04) * 100}%`,
          height: `${(region.height + 0.08) * 100}%`,
          background: `linear-gradient(to bottom, transparent 0%, rgba(0,0,0,${opacity * 0.8}) 30%, rgba(0,0,0,${opacity * 0.8}) 70%, transparent 100%)`,
        }}
      />
    );
  }
  if (kind === "blur-box") {
    return (
      <div
        aria-hidden
        className="absolute pointer-events-none backdrop-blur-sm"
        style={{
          left: `${(region.x - 0.02) * 100}%`,
          top: `${(region.y - 0.02) * 100}%`,
          width: `${(region.width + 0.04) * 100}%`,
          height: `${(region.height + 0.04) * 100}%`,
          background: `rgba(0,0,0,${opacity * 0.6})`,
        }}
      />
    );
  }
  if (kind === "solid-box") {
    return (
      <div
        aria-hidden
        className="absolute pointer-events-none"
        style={{
          left: `${region.x * 100}%`,
          top: `${region.y * 100}%`,
          width: `${region.width * 100}%`,
          height: `${region.height * 100}%`,
          background: `rgba(0,0,0,${opacity})`,
        }}
      />
    );
  }
  return null;
}

// 디버그 — 안전영역 / placement region 노출
function SafeZoneGuide({
  target,
  placements,
}: {
  target: PlatformTarget;
  placements: PlacementResult[];
}) {
  const safe = PLATFORM_SAFE_ZONES[target];
  return (
    <>
      {/* 안전영역 마스킹 — 상단/하단/좌/우 dashed 가이드 */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 pointer-events-none border-b border-dashed border-rose-400/60"
        style={{ height: `${safe.top * 100}%` }}
      />
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 pointer-events-none border-t border-dashed border-rose-400/60"
        style={{ height: `${safe.bottom * 100}%` }}
      />
      <div
        aria-hidden
        className="absolute inset-y-0 left-0 pointer-events-none border-r border-dashed border-rose-400/60"
        style={{ width: `${safe.left * 100}%` }}
      />
      <div
        aria-hidden
        className="absolute inset-y-0 right-0 pointer-events-none border-l border-dashed border-rose-400/60"
        style={{ width: `${safe.right * 100}%` }}
      />
      {/* 각 placement region 표시 — 노랑 점선 */}
      {placements.map((p, i) => (
        <div
          key={i}
          aria-hidden
          className="absolute pointer-events-none border border-dashed border-amber-300/80"
          style={{
            left: `${p.region.x * 100}%`,
            top: `${p.region.y * 100}%`,
            width: `${p.region.width * 100}%`,
            height: `${p.region.height * 100}%`,
          }}
        />
      ))}
    </>
  );
}

