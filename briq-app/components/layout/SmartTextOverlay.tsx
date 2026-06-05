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
  const [imgEl, setImgEl] = React.useState<HTMLImageElement | null>(null);
  const [imgReady, setImgReady] = React.useState(false);

  // 컨테이너 실제 픽셀 높이 측정 — 폰트 크기를 cqh(컨테이너 쿼리, 절대배치에서 불안정)
  // 대신 측정값으로 직접 계산. (이전엔 cqh 가 컨테이너 없이 깨져 글자가 안 보였음)
  const rootRef = React.useRef<HTMLDivElement>(null);
  const [boxH, setBoxH] = React.useState(0);
  React.useEffect(() => {
    const el = rootRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const update = () => setBoxH(el.clientHeight);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // 세일리언시(피사체 회피)용 이미지는 crossOrigin 으로 별도 로드한다.
  // 표시용 <img> 는 crossOrigin 없이 그려야 CDN(Pexels 등)이 CORS 헤더를 안 줘도
  // 무조건 보인다 — 예전엔 표시 img 에 crossOrigin 을 걸어 CORS 실패 시 프레임이
  // 통째로 비어 보였다. 세일리언시 프로브가 실패하면 안전영역 배치로 자연 폴백.
  React.useEffect(() => {
    setImgReady(false);
    setImgEl(null);
    if (!imageUrl || typeof window === "undefined") return;
    let cancelled = false;
    const probe = new window.Image();
    probe.crossOrigin = "anonymous";
    probe.referrerPolicy = "no-referrer";
    probe.onload = () => {
      if (!cancelled) {
        setImgEl(probe);
        setImgReady(true);
      }
    };
    probe.onerror = () => {
      /* CORS/네트워크 실패 → 세일리언시 없이 안전영역 폴백 (표시 img 는 영향 없음) */
    };
    probe.src = imageUrl;
    return () => {
      cancelled = true;
    };
  }, [imageUrl]);

  // placements 계산 — 세일리언시 프로브 로드 후, items 또는 target 변경 시
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

  // 캡션 블록 앵커 — 제목(없으면 첫 항목)의 세일리언시 결과로 블록 전체의 가로·세로
  // 위치·색·백드롭을 정한다. 모든 항목을 이 한 블록에 쌓아 겹침을 없앤다.
  const anchorIdx = Math.max(0, items.findIndex((it) => it.role === "title"));
  const anchor = placements[anchorIdx] ?? placements[0];
  const anchorBand = anchor?.meta?.preferred;
  const anchorBottom = anchorBand === "bottom" || anchorBand === "lower-center";
  const groupColor = anchor?.textColor === "light" ? "text-white" : "text-zinc-900";
  const groupJustify =
    anchor?.alignment === "center" ? "items-center text-center"
      : anchor?.alignment === "right" ? "items-end text-right"
        : "items-start text-left";

  return (
    // 위치 클래스 충돌 주의: 호출부가 className 으로 `absolute inset-0` 을 준다.
    // 여기에 `relative` 를 또 박으면 캐스케이드상 relative 가 이겨 inset-0 이 무시되고
    // (자식이 전부 절대배치라) 높이 0 으로 붕괴 → 아무것도 안 보였다. position 은
    // className 에 맡기고, className 이 없을 때만 relative 로 폴백.
    <div ref={rootRef} className={`overflow-hidden ${className ?? "relative"}`}>
      {imageUrl ? (
        // 표시용 — crossOrigin 없이(항상 보이게). 세일리언시는 위 프로브가 담당.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageUrl}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        // 이미지 없을 때 — 평평한 회색 대신 따뜻한 다크 바탕(빈 느낌 방지 + 밝은 글씨 가독)
        <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, #3a342c 0%, #211d17 100%)" }} />
      )}

      {/* 텍스트 — 라벨/제목/부제를 한 캡션 블록으로 '쌓아서' 배치(독립 배치 시 겹침).
          위치·색·백드롭은 앵커(제목) 결과를 따르고, 항목별 폰트/스타일은 유지. */}
      {anchor && (
        <>
          <Backdrop kind={anchor.backdrop} opacity={anchor.backdropOpacity} region={anchor.region} />
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.2, 0.7, 0.2, 1] }}
            className={`absolute flex flex-col gap-1.5 ${groupJustify} ${groupColor}`}
            style={{
              left: `${anchor.region.x * 100}%`,
              width: `${anchor.region.width * 100}%`,
              ...(anchorBottom
                ? { bottom: `${Math.max(0, 1 - anchor.region.y - anchor.region.height) * 100}%` }
                : { top: `${anchor.region.y * 100}%` }),
              lineHeight: 1.18,
              letterSpacing: "-0.005em",
              textShadow: anchor.textColor === "light" ? "0 1px 10px rgba(0,0,0,0.45)" : undefined,
            }}
          >
            {items.map((it, i) => {
              const p = placements[i];
              const px = rolePx(it.role, p.fontSizePct, boxH);
              return (
                <span
                  key={`${it.role}-${i}`}
                  className={it.className}
                  onClick={it.onClick}
                  style={{
                    fontSize: `${px}px`,
                    ...(it.role === "label"
                      ? { letterSpacing: "0.18em", textTransform: "uppercase" as const, fontWeight: 600 }
                      : { fontWeight: it.role === "title" ? 600 : 400 }),
                    ...it.style,
                  }}
                >
                  {it.role === "label"
                    ? p.lines.join(" ")
                    : p.lines.map((line, li) => (
                        <React.Fragment key={li}>
                          {line}
                          {li < p.lines.length - 1 && <br />}
                        </React.Fragment>
                      ))}
                </span>
              );
            })}
          </motion.div>
        </>
      )}

      {/* 디버그 — 안전영역 / region 가이드 */}
      {showSafeZoneGuide && <SafeZoneGuide target={target} placements={placements} />}
    </div>
  );
}

// 역할별 픽셀 폰트 크기 — fontSizePct 는 컨테이너 높이 대비 비율. boxH(측정값) 으로 환산.
// 작은 미리보기에서도 최소 크기 보장, 큰 화면에선 최대 크기로 클램프.
function rolePx(role: SmartTextItem["role"], fontSizePct: number, boxH: number): number {
  const minPx =
    role === "title" ? 16
      : role === "body-quote" ? 14
        : role === "cta" ? 13
          : role === "subtitle" ? 12
            : 10; // label / footer
  const maxPx =
    role === "title" ? 96
      : role === "body-quote" ? 56
        : role === "cta" ? 28
          : role === "subtitle" ? 22
            : 14;
  return boxH > 0 ? Math.max(minPx, Math.min(maxPx, fontSizePct * boxH)) : minPx;
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

