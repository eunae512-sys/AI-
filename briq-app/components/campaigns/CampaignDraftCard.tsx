"use client";

// 캠페인 초안 한 건 — 매거진 한 꼭지처럼.
//
// 비주얼 히어로 두 개:
//   ① 카드뉴스 캐러셀 — 슬라이드를 옆으로 넘기며 본다
//   ② 릴스 미리보기 — 9:16 세로 클립이 자막과 함께 흐른다
// 그 외 블로그·스토리·카카오 같은 부속물은 그 아래 한 줄씩.
//
// 결정 액션은 셋. 그 이상의 버튼은 두지 않는다.

import * as React from "react";
import { AnimatePresence, motion } from "motion/react";
import type { CampaignDraft, CampaignPiece } from "./types";
import type { Brand } from "@/types";
import { CardnewsCarousel } from "./CardnewsCarousel";
import { ReelsPreview } from "./ReelsPreview";
import { CampaignMarketingPanel } from "./CampaignMarketingPanel";
import { brandHandle, brandWordmark } from "@/lib/brand/brand-context";
import { useBrand } from "@/components/brand/BrandProvider";

type Props = {
  index: number;
  draft: CampaignDraft;
  brand: Brand;
  onApprove: () => void;
  onSkip: () => void;
};

export function CampaignDraftCard({ index, draft, brand, onApprove, onSkip }: Props) {
  const { userBrand } = useBrand();
  const [polishOpen, setPolishOpen] = React.useState(false);
  const [polishText, setPolishText] = React.useState("");

  // 사장님 가게 시그니처 메뉴 — 영상 매칭 시드. 사용자 브랜드면 본인 메뉴, 데모면 빈 배열.
  const signatureMenu = userBrand?.id === brand.id ? userBrand.signatureMenu ?? [] : [];

  const cardnews = draft.pieces.find((p): p is Extract<CampaignPiece, { kind: "cardnews" }> => p.kind === "cardnews");
  const reels = draft.pieces.find((p): p is Extract<CampaignPiece, { kind: "reels" }> => p.kind === "reels");
  const others = draft.pieces.filter((p) => p.kind !== "cardnews" && p.kind !== "reels");

  return (
    <article className="grid grid-cols-12 gap-x-8 sm:gap-x-10">
      {/* 좌측: 번호 + 카테고리 라벨 + 메타 */}
      <aside className="col-span-12 sm:col-span-3 mb-6 sm:mb-0">
        <div className="editorial-label tabular-nums">{String(index).padStart(2, "0")}</div>
        <div className="mt-3 text-[10px] tracking-[0.18em] uppercase text-zinc-400">
          {draft.kind} Campaign
        </div>
        <div className="mt-6 text-[11px] text-zinc-500 leading-relaxed">
          <div className="flex items-baseline justify-between">
            <span>시작</span>
            <span className="tabular-nums text-zinc-700 dark:text-zinc-300">
              {formatKoreanDate(draft.schedule.startsAt)}
            </span>
          </div>
          <div className="flex items-baseline justify-between mt-1.5">
            <span>발행</span>
            <span className="tabular-nums text-zinc-700 dark:text-zinc-300">
              {draft.schedule.postsTotal}건
            </span>
          </div>
          <div className="flex items-baseline justify-between mt-1.5">
            <span>채널</span>
            <span className="text-zinc-700 dark:text-zinc-300 text-right">
              {draft.channels.join(" · ")}
            </span>
          </div>
        </div>
      </aside>

      {/* 우측: 본문 */}
      <div className="col-span-12 sm:col-span-9">
        <h2
          className="text-[28px] sm:text-[40px] leading-[1.05] tracking-[-0.02em] font-medium"
          style={{ fontFamily: "'Cormorant Garamond', 'Nanum Myeongjo', serif", fontWeight: 500 }}
        >
          {draft.headline}
        </h2>
        <p
          className="mt-5 max-w-[640px] text-[15px] sm:text-[16px] leading-[1.75] text-zinc-700 dark:text-zinc-300"
          style={{ fontFamily: "'Nanum Myeongjo', serif" }}
        >
          {draft.rationale}
        </p>

        {/* 자동 결정 표 */}
        <dl className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-x-0 gap-y-5 border-y border-zinc-200 dark:border-zinc-800 py-5">
          {draft.autoDecisions.map((d) => (
            <div
              key={d.label}
              className="px-4 first:pl-0 sm:border-l sm:border-zinc-200 dark:sm:border-zinc-800 sm:first:border-l-0"
            >
              <dt className="editorial-label">{d.label}</dt>
              <dd className="mt-1.5 text-[13.5px] text-zinc-900 dark:text-zinc-100 leading-snug">
                {d.value}
              </dd>
              {d.note && (
                <dd className="mt-1 text-[10.5px] text-zinc-500 leading-snug">{d.note}</dd>
              )}
            </div>
          ))}
        </dl>

        {/* 비주얼 히어로 — 카드뉴스 + 릴스 */}
        {(cardnews || reels) && (
          <div className="mt-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
            {cardnews && (
              <div className="lg:col-span-7">
                <CardnewsCarousel
                  slides={cardnews.cardnews}
                  industry={brand.industry}
                  brandId={brand.id}
                  brandWordmark={brandWordmark(brand)}
                  caption={cardnews.marketing?.caption}
                  handle={brandHandle(brand)}
                />
              </div>
            )}
            {reels && (
              <div className="lg:col-span-5">
                <ReelsPreview
                  clip={reels.reels}
                  title={reels.title}
                  handle={brandHandle(brand)}
                  industry={brand.industry}
                  campaignHeadline={draft.headline}
                  signatureMenu={signatureMenu}
                  mood={brand.mood}
                />
                <p className="mt-3 text-[11.5px] text-zinc-500 leading-relaxed">
                  <span className="text-[10px] tracking-[0.15em] uppercase text-zinc-400 mr-2">릴스 캡션</span>
                  {reels.copyPreview}
                </p>
              </div>
            )}
          </div>
        )}

        {/* 인스타 마케팅 자산 — 캡션 / 해시태그 / CTA / 예상 지표 */}
        {cardnews?.marketing && <CampaignMarketingPanel marketing={cardnews.marketing} />}

        {/* 부속 결과물 — 블로그 / 스토리 / 카카오 한 줄씩 */}
        {others.length > 0 && (
          <ol className="mt-10 divide-y divide-zinc-200 dark:divide-zinc-800 border-y border-zinc-200 dark:border-zinc-800">
            {others.map((p, i) => (
              <li key={i} className="grid grid-cols-12 gap-x-4 sm:gap-x-6 py-4 items-baseline">
                <div className="col-span-3 sm:col-span-2 text-[10px] tracking-[0.15em] uppercase text-zinc-400">
                  {p.format}
                </div>
                <div className="col-span-9 sm:col-span-10">
                  <div
                    className="text-[15px] leading-snug"
                    style={{ fontFamily: "'Nanum Myeongjo', serif" }}
                  >
                    {p.title}
                  </div>
                  <div className="mt-1.5 text-[12.5px] text-zinc-500 leading-[1.7] max-w-[640px]">
                    {p.copyPreview}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        )}

        {/* 결정 액션 */}
        <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3">
          <button
            type="button"
            onClick={onApprove}
            className="group inline-flex items-center gap-3 h-11 px-6 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-[13px] tracking-[0.04em] uppercase font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
          >
            승인 — 발행 큐에 추가
            <span className="group-hover:translate-x-0.5 transition-transform">→</span>
          </button>
          <a
            href={`/content-distribution?topic=${encodeURIComponent(draft.headline)}`}
            className="text-[13px] text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 underline underline-offset-4 decoration-[0.5px] decoration-zinc-300"
          >
            8 채널로 확장 →
          </a>
          <button
            type="button"
            onClick={() => setPolishOpen((s) => !s)}
            aria-expanded={polishOpen}
            className="text-[13px] text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 underline underline-offset-4 decoration-[0.5px] decoration-zinc-300"
          >
            살짝 다듬기
          </button>
          <button
            type="button"
            onClick={onSkip}
            className="text-[12.5px] text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 ml-auto"
          >
            이번 주는 건너뛰기
          </button>
        </div>

        <AnimatePresence>
          {polishOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
              className="mt-6 overflow-hidden"
            >
              <div className="border border-zinc-200 dark:border-zinc-800 p-5 bg-[color:var(--bg-soft)]/40">
                <div className="editorial-label">한 줄 다듬기</div>
                <p className="mt-2 text-[12px] text-zinc-500 leading-relaxed">
                  바꾸고 싶은 결만 한 줄로 적어주세요. 예: "더 짧게" · "사장님 1인칭으로" · "가격 안 보이게" · "두릅 컷 빼고 산마늘 컷으로".
                  나머지는 BRIQ 가 같은 톤 안에서 자동으로 다시 짭니다.
                </p>
                <div className="mt-3 flex items-baseline gap-3 border-b border-zinc-300 dark:border-zinc-700 pb-2">
                  <input
                    value={polishText}
                    onChange={(e) => setPolishText(e.target.value)}
                    placeholder="결만 한 줄로"
                    className="flex-1 bg-transparent outline-none text-[14px] tracking-tight placeholder:text-zinc-400"
                    style={{ fontFamily: "'Nanum Myeongjo', serif" }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setPolishText("");
                      setPolishOpen(false);
                    }}
                    disabled={!polishText.trim()}
                    className="text-[11px] tracking-[0.18em] uppercase text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 disabled:opacity-30"
                  >
                    다시 짜기 →
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </article>
  );
}

function formatKoreanDate(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  if (Number.isNaN(d.getTime())) return iso;
  return `${d.getMonth() + 1}월 ${d.getDate()}일`;
}
