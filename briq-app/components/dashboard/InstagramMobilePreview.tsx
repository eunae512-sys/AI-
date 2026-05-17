"use client";

// Instagram 모바일 미리보기 — Feed / Reels / Story 3종을 동시에
// SmartTextOverlay 엔진으로 텍스트가 자동 배치됨 (피사체 회피 + 안전영역 + 자동 backdrop)
//
// 컨테이너 비율:
//   Feed: 4:5 (인스타 포트레이트 게시물)
//   Reels: 9:16 (UI 영역 시뮬레이션 — 하단 캡션 / 우측 액션 컬럼)
//   Story: 9:16 (UI 영역 — 상단 progress + 프로필 / 하단 답장 입력)

import * as React from "react";
import { SmartTextOverlay, type SmartTextItem } from "@/components/layout/SmartTextOverlay";
import type { ShopHand } from "@/lib/dummy/today-shift";
import type { Brand } from "@/types";

type Props = {
  imageUrl: string | null;
  shop: ShopHand;
  brand: Brand;
};

export function InstagramMobilePreview({ imageUrl, shop, brand }: Props) {
  const t = shop.today;

  // 각 플랫폼별 텍스트 항목 — 같은 콘텐츠를 다르게 노출
  const feedItems: SmartTextItem[] = [
    { role: "label" as const, text: t.slideLabel, style: serifSans() },
    { role: "title" as const, text: t.slideTitle, style: serifNanum() },
    ...(t.slideHint
      ? [{ role: "subtitle" as const, text: t.slideHint, style: serifNanum() }]
      : []),
  ];

  const reelsThumbItems: SmartTextItem[] = [
    { role: "title" as const, text: t.slideTitle, style: serifNanum() },
    ...(t.slideHint
      ? [{ role: "subtitle" as const, text: t.slideHint, style: serifNanum() }]
      : []),
  ];

  const storyItems: SmartTextItem[] = [
    { role: "label" as const, text: brand.name, style: serifSans() },
    { role: "title" as const, text: t.slideTitle, style: serifNanum() },
    { role: "cta" as const, text: "DM 으로 예약", style: serifSans() },
  ];

  return (
    <section className="py-12 sm:py-16">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-x-10 md:gap-x-14 gap-y-6">
        <div className="md:col-span-3">
          <div className="editorial-label">Mobile preview</div>
          <h3
            className="mt-3 text-[20px] sm:text-[22px] leading-[1.2] tracking-tight"
            style={{ fontFamily: "'Nanum Myeongjo', serif" }}
          >
            인스타그램에서 이렇게 보입니다
          </h3>
          <p className="mt-3 text-[12.5px] text-zinc-500 dark:text-zinc-500 leading-relaxed">
            텍스트는 사진 피사체와 인스타 UI 가림 영역을 자동으로 피해서 배치됩니다.
          </p>
        </div>

        <div className="md:col-span-9 grid grid-cols-3 gap-3 sm:gap-5">
          <FeedFrame imageUrl={imageUrl} items={feedItems} />
          <ReelsFrame imageUrl={imageUrl} items={reelsThumbItems} brand={brand} />
          <StoryFrame imageUrl={imageUrl} items={storyItems} brand={brand} />
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
// Feed (4:5)
// ─────────────────────────────────────────────────────────────

function FeedFrame({ imageUrl, items }: { imageUrl: string | null; items: SmartTextItem[] }) {
  return (
    <div>
      <div className="editorial-label mb-1.5">Feed</div>
      <div className="rounded-sm overflow-hidden border border-zinc-200 dark:border-zinc-800">
        {/* 인스타 프로필 헤더 시뮬레이션 */}
        <div className="flex items-center gap-1.5 px-2 py-1.5 bg-white dark:bg-zinc-950">
          <div className="h-4 w-4 rounded-full bg-zinc-200 dark:bg-zinc-800" />
          <div className="text-[8px] text-zinc-900 dark:text-zinc-100">brand</div>
        </div>
        <div className="aspect-[4/5] relative bg-zinc-100 dark:bg-zinc-900">
          <SmartTextOverlay
            imageUrl={imageUrl}
            items={items}
            target="instagram-feed-portrait"
            aspectRatio={4 / 5}
            className="absolute inset-0"
          />
        </div>
        {/* 인스타 액션 바 시뮬레이션 */}
        <div className="px-2 py-1.5 bg-white dark:bg-zinc-950 flex items-center gap-2">
          <div className="h-3 w-3 rounded-full border border-zinc-300 dark:border-zinc-700" />
          <div className="h-3 w-3 rounded-full border border-zinc-300 dark:border-zinc-700" />
          <div className="h-3 w-3 rounded-full border border-zinc-300 dark:border-zinc-700" />
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Reels (9:16) — 우측 액션 컬럼·하단 캡션 시뮬레이션
// ─────────────────────────────────────────────────────────────

function ReelsFrame({
  imageUrl,
  items,
  brand,
}: {
  imageUrl: string | null;
  items: SmartTextItem[];
  brand: Brand;
}) {
  return (
    <div>
      <div className="editorial-label mb-1.5">Reels</div>
      <div className="aspect-[9/16] relative rounded-sm overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-900">
        <SmartTextOverlay
          imageUrl={imageUrl}
          items={items}
          target="instagram-reels-thumb"
          aspectRatio={9 / 16}
          className="absolute inset-0"
        />
        {/* 우측 액션 컬럼 시뮬레이션 — 텍스트 배치 영역에서 자동 제외됨 */}
        <div className="absolute right-1 bottom-12 flex flex-col items-center gap-2 pointer-events-none">
          <ActionDot />
          <ActionDot />
          <ActionDot />
          <ActionDot />
        </div>
        {/* 하단 프로필·캡션 영역 */}
        <div className="absolute bottom-1 left-1.5 right-10 text-white pointer-events-none">
          <div className="flex items-center gap-1">
            <div className="h-3 w-3 rounded-full bg-white/40" />
            <div className="text-[8px] font-medium">{brand.name}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ActionDot() {
  return <div className="h-3 w-3 rounded-full border border-white/70" />;
}

// ─────────────────────────────────────────────────────────────
// Story (9:16) — 상단 progress + 하단 답장 입력 시뮬레이션
// ─────────────────────────────────────────────────────────────

function StoryFrame({
  imageUrl,
  items,
  brand,
}: {
  imageUrl: string | null;
  items: SmartTextItem[];
  brand: Brand;
}) {
  return (
    <div>
      <div className="editorial-label mb-1.5">Story</div>
      <div className="aspect-[9/16] relative rounded-sm overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-900">
        <SmartTextOverlay
          imageUrl={imageUrl}
          items={items}
          target="instagram-story"
          aspectRatio={9 / 16}
          className="absolute inset-0"
        />
        {/* 상단 progress bar 시뮬레이션 */}
        <div className="absolute top-1 left-1 right-1 flex gap-0.5 pointer-events-none">
          <div className="flex-1 h-0.5 bg-white/40 rounded-full">
            <div className="h-full w-2/3 bg-white rounded-full" />
          </div>
          <div className="flex-1 h-0.5 bg-white/40 rounded-full" />
        </div>
        {/* 상단 프로필 */}
        <div className="absolute top-3 left-2 right-2 flex items-center gap-1.5 pointer-events-none">
          <div className="h-3.5 w-3.5 rounded-full bg-white/40" />
          <div className="text-[8px] text-white/95 font-medium">{brand.name}</div>
        </div>
        {/* 하단 답장 입력창 시뮬레이션 */}
        <div className="absolute bottom-1.5 left-1.5 right-1.5 flex items-center gap-1 pointer-events-none">
          <div className="flex-1 h-4 rounded-full border border-white/60" />
          <div className="h-3 w-3 rounded-full border border-white/60" />
          <div className="h-3 w-3 rounded-full border border-white/60" />
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 폰트 헬퍼
// ─────────────────────────────────────────────────────────────

function serifNanum(): React.CSSProperties {
  return { fontFamily: "'Nanum Myeongjo', serif" };
}
function serifSans(): React.CSSProperties {
  return { fontFamily: "var(--font-sans)" };
}
