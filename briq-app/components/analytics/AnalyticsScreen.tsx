"use client";

import { motion } from "motion/react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useBrand } from "@/components/brand/BrandProvider";
import { getBrandDetail } from "@/lib/dummy/brand-detail";
import { formatNumber } from "@/lib/utils";

// 브랜드별 KPI + 스파크라인
const BRAND_KPIS: Record<
  string,
  {
    reach: number;
    reachDelta: string;
    saves: string;
    savesDelta: string;
    ctr: string;
    ctrDelta: string;
    rsv: string;
    rsvDelta: string;
    spark: { reach: number[]; saves: number[]; ctr: number[]; rsv: number[] };
    beforeAfter: { reach: { before: string; after: string; delta: string }; saves: { before: string; after: string; delta: string }; revenue: { before: string; after: string; delta: string }; roi: string };
  }
> = {
  miokdang: {
    reach: 68000, reachDelta: "+184%", saves: "5.4%", savesDelta: "+1.1%p",
    ctr: "2.8%", ctrDelta: "+0.7%p", rsv: "11.4%", rsvDelta: "+3.2%p",
    spark: { reach: [12, 18, 14, 22, 28, 32, 24, 40, 46, 52], saves: [18, 22, 26, 24, 30, 34, 38, 36, 42, 46], ctr: [14, 18, 16, 22, 24, 28, 30, 32, 34, 38], rsv: [16, 20, 24, 28, 30, 34, 38, 42, 46, 52] },
    beforeAfter: { reach: { before: "12K", after: "68K", delta: "↑ 467%" }, saves: { before: "1.2%", after: "5.4%", delta: "↑ 4.5x" }, revenue: { before: "₩4.2M", after: "₩13.1M", delta: "↑ ₩8.9M" }, roi: "ROI 312%" },
  },
  "roastery-1985": {
    reach: 41200, reachDelta: "+142%", saves: "4.7%", savesDelta: "+1.4%p",
    ctr: "3.1%", ctrDelta: "+0.9%p", rsv: "8.2%", rsvDelta: "+2.4%p",
    spark: { reach: [10, 14, 18, 22, 24, 28, 30, 34, 38, 42], saves: [16, 18, 22, 24, 28, 32, 34, 38, 40, 44], ctr: [12, 16, 18, 22, 26, 28, 30, 32, 36, 40], rsv: [14, 18, 22, 26, 30, 34, 36, 38, 40, 44] },
    beforeAfter: { reach: { before: "8K", after: "41K", delta: "↑ 412%" }, saves: { before: "1.5%", after: "4.7%", delta: "↑ 3.1x" }, revenue: { before: "₩2.8M", after: "₩7.4M", delta: "↑ ₩4.6M" }, roi: "ROI 264%" },
  },
  "seochon-stay": {
    reach: 28400, reachDelta: "+216%", saves: "6.1%", savesDelta: "+2.3%p",
    ctr: "4.2%", ctrDelta: "+1.4%p", rsv: "18.4%", rsvDelta: "+6.8%p",
    spark: { reach: [6, 10, 14, 18, 22, 26, 30, 34, 38, 44], saves: [14, 18, 22, 26, 30, 34, 38, 42, 46, 50], ctr: [10, 14, 18, 22, 26, 30, 32, 36, 40, 44], rsv: [10, 14, 18, 24, 28, 32, 36, 42, 48, 54] },
    beforeAfter: { reach: { before: "4K", after: "28K", delta: "↑ 600%" }, saves: { before: "1.8%", after: "6.1%", delta: "↑ 3.4x" }, revenue: { before: "₩3.1M", after: "₩9.8M", delta: "↑ ₩6.7M" }, roi: "ROI 416%" },
  },
  "dolce-dessert": {
    reach: 92000, reachDelta: "+248%", saves: "7.2%", savesDelta: "+2.1%p",
    ctr: "3.4%", ctrDelta: "+1.2%p", rsv: "9.8%", rsvDelta: "+3.4%p",
    spark: { reach: [14, 20, 24, 30, 34, 40, 46, 50, 54, 60], saves: [20, 24, 28, 32, 36, 40, 44, 48, 52, 56], ctr: [14, 18, 22, 24, 28, 30, 32, 34, 38, 42], rsv: [16, 20, 24, 28, 32, 36, 38, 42, 46, 50] },
    beforeAfter: { reach: { before: "22K", after: "92K", delta: "↑ 418%" }, saves: { before: "2.8%", after: "7.2%", delta: "↑ 2.6x" }, revenue: { before: "₩5.4M", after: "₩18.2M", delta: "↑ ₩12.8M" }, roi: "ROI 524%" },
  },
  "luna-hair": {
    reach: 52800, reachDelta: "+94%", saves: "4.2%", savesDelta: "+1.2%p",
    ctr: "3.8%", ctrDelta: "+1.0%p", rsv: "12.4%", rsvDelta: "+4.2%p",
    spark: { reach: [16, 20, 22, 26, 28, 30, 34, 38, 40, 44], saves: [16, 18, 22, 24, 28, 32, 34, 36, 40, 42], ctr: [14, 18, 22, 24, 28, 30, 32, 34, 36, 38], rsv: [18, 22, 24, 28, 32, 36, 38, 42, 44, 48] },
    beforeAfter: { reach: { before: "20K", after: "52K", delta: "↑ 164%" }, saves: { before: "1.4%", after: "4.2%", delta: "↑ 3.0x" }, revenue: { before: "₩6.2M", after: "₩14.8M", delta: "↑ ₩8.6M" }, roi: "ROI 218%" },
  },
  "forum-fashion": {
    reach: 78600, reachDelta: "+128%", saves: "3.8%", savesDelta: "+0.8%p",
    ctr: "2.4%", ctrDelta: "+0.5%p", rsv: "6.2%", rsvDelta: "+1.8%p",
    spark: { reach: [16, 20, 24, 28, 30, 32, 36, 40, 42, 46], saves: [18, 20, 24, 26, 28, 32, 34, 36, 38, 40], ctr: [12, 14, 16, 18, 22, 24, 26, 28, 30, 32], rsv: [10, 14, 16, 20, 24, 26, 28, 30, 34, 38] },
    beforeAfter: { reach: { before: "34K", after: "78K", delta: "↑ 129%" }, saves: { before: "2.4%", after: "3.8%", delta: "↑ 1.6x" }, revenue: { before: "₩8.2M", after: "₩18.4M", delta: "↑ ₩10.2M" }, roi: "ROI 192%" },
  },
};

export function AnalyticsScreen() {
  const { brand } = useBrand();
  const detail = getBrandDetail(brand.id);
  const k = BRAND_KPIS[brand.id] ?? BRAND_KPIS.miokdang;

  const sparkRows: { label: string; value: string; delta: string; spark: number[] }[] = [
    { label: "총 도달", value: formatNumber(k.reach), delta: k.reachDelta, spark: k.spark.reach },
    { label: "평균 저장률", value: k.saves, delta: k.savesDelta, spark: k.spark.saves },
    { label: "CTR · 클릭률", value: k.ctr, delta: k.ctrDelta, spark: k.spark.ctr },
    { label: "예약 전환율", value: k.rsv, delta: k.rsvDelta, spark: k.spark.rsv },
  ];

  return (
    <div className="px-4 sm:px-6 py-4 sm:py-6">
      <div className="mb-6">
        <div className="text-[11px] uppercase tracking-[0.15em] text-zinc-400 font-semibold">
          PERFORMANCE · {brand.name} · 최근 30일
        </div>
        <h1 className="mt-2 text-[22px] sm:text-2xl md:text-3xl font-semibold tracking-tight leading-[1.15]">{brand.name} 성과 분석</h1>
        <p className="mt-1 text-sm text-zinc-500">
          {brand.industryLabel} · {brand.city} · 조회 · 저장 · CTR · 예약 전환 · Before/After ROI 시각화
        </p>
      </div>

      <motion.div
        key={brand.id}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6"
      >
        {sparkRows.map((row) => (
          <Card key={row.label} className="p-5">
            <div className="text-[10px] uppercase tracking-[0.15em] text-zinc-400 font-semibold">{row.label}</div>
            <div className="mt-2 flex items-baseline gap-2">
              <div className="text-2xl font-semibold tabular-nums">{row.value}</div>
              <div className="text-[11px] text-emerald-600 font-medium">{row.delta}</div>
            </div>
            <div className="mt-2 flex items-end gap-0.5 h-7">
              {row.spark.map((v, i) => (
                <motion.span
                  key={i}
                  initial={{ height: 0 }}
                  animate={{ height: `${v}%` }}
                  transition={{ delay: i * 0.03 }}
                  className="flex-1 rounded-sm bg-zinc-900 dark:bg-zinc-100"
                />
              ))}
            </div>
          </Card>
        ))}
      </motion.div>

      <Card className="p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold">{brand.name} · BRIQ Before / After</h3>
            <p className="text-[11px] text-zinc-500">도입 전 60일 vs 도입 후 60일</p>
          </div>
          <Badge tone="emerald">{k.beforeAfter.roi}</Badge>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            { label: "월 평균 도달", b: k.beforeAfter.reach.before, a: k.beforeAfter.reach.after, d: k.beforeAfter.reach.delta },
            { label: "평균 저장률", b: k.beforeAfter.saves.before, a: k.beforeAfter.saves.after, d: k.beforeAfter.saves.delta },
            { label: "월 매출", b: k.beforeAfter.revenue.before, a: k.beforeAfter.revenue.after, d: k.beforeAfter.revenue.delta },
          ].map((m) => (
            <div key={m.label} className="rounded-xl border border-zinc-100 dark:border-zinc-800 p-4">
              <div className="text-[10px] uppercase tracking-[0.15em] text-zinc-400 font-semibold">{m.label}</div>
              <div className="mt-3 grid grid-cols-2 gap-2 items-end">
                <div>
                  <div className="text-[10px] text-zinc-500">BEFORE</div>
                  <div className="mt-1 h-10 bg-zinc-100 dark:bg-zinc-800 rounded relative">
                    <div className="absolute bottom-1 left-1.5 text-xs font-semibold tabular-nums">{m.b}</div>
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-emerald-600">AFTER</div>
                  <motion.div
                    key={brand.id + m.label}
                    initial={{ height: 0 }}
                    animate={{ height: "5rem" }}
                    transition={{ type: "spring", stiffness: 120, damping: 22 }}
                    className="mt-1 bg-gradient-to-t from-emerald-500 to-emerald-400 rounded relative"
                  >
                    <div className="absolute bottom-1 left-1.5 text-xs font-semibold text-white tabular-nums">{m.a}</div>
                  </motion.div>
                </div>
              </div>
              <div className="mt-2 text-[11px] text-emerald-600 font-medium">{m.d}</div>
            </div>
          ))}
        </div>
      </Card>

      {detail && (
        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold">{brand.name} 베스트 콘텐츠</h3>
            <span className="text-[11px] text-zinc-500">최근 30일 · 저장률 기준</span>
          </div>
          <div className="overflow-x-auto -mx-5 px-5">
            <table className="w-full text-xs">
              <thead className="text-left text-[10px] uppercase tracking-[0.15em] text-zinc-400 font-semibold border-b border-zinc-100 dark:border-zinc-800">
                <tr>
                  <th className="py-2 pr-3">#</th>
                  <th className="py-2 pr-3">콘텐츠</th>
                  <th className="py-2 pr-3">타입</th>
                  <th className="py-2 pr-3 text-right">성과</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {detail.recentContents.map((c, i) => (
                  <tr key={c.id}>
                    <td className="py-3 pr-3 font-bold">{i + 1}</td>
                    <td className="py-3 pr-3 font-medium">{c.title}</td>
                    <td className="py-3 pr-3">
                      <Badge tone="default">{c.type === "reels" ? "릴스" : c.type === "cardnews" ? "카드뉴스" : "블로그"}</Badge>
                    </td>
                    <td className="py-3 pr-3 text-right tabular-nums text-emerald-600 font-medium">{c.metric}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
