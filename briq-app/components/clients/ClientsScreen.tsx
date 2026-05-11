"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { useBrand } from "@/components/brand/BrandProvider";
import { brands } from "@/lib/dummy/brands";
import { formatNumber } from "@/lib/utils";

export function ClientsScreen() {
  const toast = useToast();
  const { setBrandId } = useBrand();
  const router = useRouter();

  const onAddBrand = () => {
    toast.info("새 브랜드 온보딩으로 이동합니다");
    router.push("/onboarding");
  };

  const onCardClick = (id: string) => {
    setBrandId(id);
    toast.success(`${brands.find((b) => b.id === id)?.name} 브랜드로 전환됨`);
  };

  return (
    <div className="px-4 sm:px-6 py-4 sm:py-6">
      <div className="flex items-end justify-between gap-4 flex-wrap mb-6">
        <div>
          <div className="text-[11px] uppercase tracking-widest text-zinc-400 font-semibold">CLIENTS</div>
          <h1 className="mt-2 text-2xl sm:text-3xl font-semibold tracking-tight">관리 중인 브랜드</h1>
          <p className="mt-1 text-sm text-zinc-500">
            각 브랜드의 톤 메모리·콘텐츠·예약 큐를 한 곳에서 운영합니다. 카드를 클릭하면 해당 브랜드로 전환됩니다.
          </p>
        </div>
        <Button size="sm" onClick={onAddBrand}>
          <Plus className="h-3.5 w-3.5" />새 브랜드 추가
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {brands.map((b) => (
          <div key={b.id} className="relative">
            <Link
              href={`/clients/${b.id}`}
              onClick={() => onCardClick(b.id)}
              className="block"
            >
              <Card className="p-5 hover:border-zinc-900 dark:hover:border-zinc-100 hover:-translate-y-0.5 transition-all cursor-pointer">
                <div className="flex items-start justify-between">
                  <div className={`h-10 w-10 rounded-lg bg-gradient-to-br ${b.gradient} grid place-items-center text-white text-sm font-bold`}>
                    {b.letter}
                  </div>
                  <Badge tone="default">v{b.toneVersion}</Badge>
                </div>
                <div className="mt-4 text-sm font-semibold">{b.name}</div>
                <div className="text-[11px] text-zinc-500">
                  {b.industryLabel} · {b.city}
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                  <div>
                    <div className="text-xs font-semibold tabular-nums">{formatNumber(b.followers)}</div>
                    <div className="text-[10px] text-zinc-500">팔로워</div>
                  </div>
                  <div>
                    <div className="text-xs font-semibold tabular-nums text-emerald-600">{b.saveRate}%</div>
                    <div className="text-[10px] text-zinc-500">저장률</div>
                  </div>
                  <div>
                    <div className="text-xs font-semibold tabular-nums">{formatNumber(b.reachThisMonth)}</div>
                    <div className="text-[10px] text-zinc-500">월 도달</div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800 text-[11px] text-zinc-500 truncate">
                  현재 캠페인 · <span className="text-zinc-700 dark:text-zinc-300 font-medium">{b.campaign}</span>
                </div>
              </Card>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
