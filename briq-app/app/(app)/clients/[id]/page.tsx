import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Film, FileImage, FileText, Star } from "lucide-react";
import { Topbar } from "@/components/layout/Topbar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { brands, getBrand } from "@/lib/dummy/brands";
import { getBrandDetail } from "@/lib/dummy/brand-detail";
import { formatNumber } from "@/lib/utils";

type Params = { id: string };

export function generateStaticParams(): Params[] {
  return brands.map((b) => ({ id: b.id }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }) {
  const { id } = await params;
  const b = getBrand(id);
  return { title: b ? `BRIQ · ${b.name}` : "BRIQ · 브랜드" };
}

const TYPE_ICON = {
  reels: Film,
  cardnews: FileImage,
  blog: FileText,
} as const;

const TYPE_LABEL = {
  reels: "릴스",
  cardnews: "카드뉴스",
  blog: "블로그",
} as const;

export default async function BrandDetailPage({ params }: { params: Promise<Params> }) {
  const { id } = await params;
  const brand = getBrand(id);
  const detail = getBrandDetail(id);
  if (!brand || !detail) notFound();

  return (
    <>
      <Topbar title="브랜드 상세" breadcrumb={`${brand.name} · v${brand.toneVersion}`} />
      <div className="px-6 py-6">
        {/* Back */}
        <Link
          href="/clients"
          className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 mb-4"
        >
          <ChevronLeft className="h-3.5 w-3.5" />클라이언트 목록
        </Link>

        {/* Hero */}
        <div className="flex items-start gap-5 mb-8">
          <div
            className={`h-20 w-20 rounded-2xl bg-gradient-to-br ${brand.gradient} grid place-items-center text-white text-2xl font-bold shrink-0`}
          >
            {brand.letter}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">{brand.name}</h1>
              <Badge tone="default">톤 v{brand.toneVersion}</Badge>
            </div>
            <p className="mt-1.5 text-sm text-zinc-500">
              {brand.industryLabel} · {brand.city} · 현재 캠페인: <span className="text-zinc-700 dark:text-zinc-300 font-medium">{brand.campaign}</span>
            </p>
            <div
              className="mt-3 text-base leading-relaxed text-zinc-700 dark:text-zinc-300 max-w-2xl"
              style={{ fontFamily: "'Nanum Myeongjo', serif" }}
            >
              "{detail.hero.tagline}"
            </div>
            <p className="mt-1 text-xs text-zinc-500 max-w-2xl">{detail.hero.description}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button asChild variant="outline" size="sm">
              <Link href="/brand-tone">톤 편집</Link>
            </Button>
            <Button asChild size="sm">
              <Link href={`/reels?id=${brand.id}`}>새 콘텐츠 생성</Link>
            </Button>
          </div>
        </div>

        {/* KPI strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <Card className="p-4">
            <div className="text-[10px] uppercase tracking-widest text-zinc-400 font-semibold">팔로워</div>
            <div className="mt-2 text-2xl font-semibold tabular-nums">{formatNumber(brand.followers)}</div>
            <div className="text-[11px] text-zinc-500 mt-1">인스타 비즈니스 계정</div>
          </Card>
          <Card className="p-4">
            <div className="text-[10px] uppercase tracking-widest text-zinc-400 font-semibold">평균 저장률</div>
            <div className="mt-2 text-2xl font-semibold tabular-nums text-emerald-600">{brand.saveRate}%</div>
            <div className="text-[11px] text-zinc-500 mt-1">업종 평균 2.3% 대비 ★</div>
          </Card>
          <Card className="p-4">
            <div className="text-[10px] uppercase tracking-widest text-zinc-400 font-semibold">월 도달</div>
            <div className="mt-2 text-2xl font-semibold tabular-nums">{formatNumber(brand.reachThisMonth)}</div>
            <div className="text-[11px] text-zinc-500 mt-1">최근 30일</div>
          </Card>
          <Card className="p-4">
            <div className="text-[10px] uppercase tracking-widest text-zinc-400 font-semibold">발행 예정</div>
            <div className="mt-2 text-2xl font-semibold tabular-nums">{detail.upcoming.length}</div>
            <div className="text-[11px] text-zinc-500 mt-1">다음 14일</div>
          </Card>
        </div>

        {/* Grid: Tone + Colors */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-6">
          {/* Tone summary */}
          <Card className="lg:col-span-2 p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold">브랜드 톤 메모리</h3>
              <Link href="/brand-tone" className="text-[11px] text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100">
                상세 →
              </Link>
            </div>
            <p
              className="text-sm leading-relaxed italic text-zinc-700 dark:text-zinc-300"
              style={{ fontFamily: "'Nanum Myeongjo', serif" }}
            >
              "{detail.toneSummary}"
            </p>
            <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-[10px] uppercase tracking-widest text-zinc-400 font-semibold mb-2">
                  자주 쓰는 좋은 표현
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {detail.preferredWords.map((w) => (
                    <Badge key={w} tone="emerald">
                      {w}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-widest text-zinc-400 font-semibold mb-2">
                  🚫 차단 단어
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {detail.forbiddenWords.map((w) => (
                    <Badge key={w} tone="rose">
                      {w}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {/* Color palette */}
          <Card className="p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold">브랜드 컬러</h3>
              <Link href="/brand-kit" className="text-[11px] text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100">
                키트 →
              </Link>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {detail.colorPalette.map((c) => (
                <div key={c.hex} className="space-y-1">
                  <div
                    className="aspect-square rounded-lg border border-zinc-100 dark:border-zinc-800"
                    style={{ background: c.hex }}
                  />
                  <div className="text-[10px] font-medium truncate">{c.name}</div>
                  <div className="text-[9px] text-zinc-500 tabular-nums">{c.hex}</div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Recent contents */}
        <Card className="p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold">최근 콘텐츠</h3>
              <p className="text-[11px] text-zinc-500 mt-0.5">{brand.name} · 발행/예약 합산 6건</p>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link href={`/reels?id=${brand.id}`}>+ 새 콘텐츠</Link>
            </Button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {detail.recentContents.map((c) => {
              const Icon = TYPE_ICON[c.type];
              return (
                <Link
                  key={c.id}
                  href={c.type === "reels" ? `/reels?id=${brand.id}` : "/cardnews"}
                  className="group block"
                >
                  <div
                    className={`aspect-[4/5] rounded-lg overflow-hidden bg-gradient-to-br ${c.gradient} relative border border-zinc-100 dark:border-zinc-800 group-hover:border-zinc-900 dark:group-hover:border-zinc-100 transition-colors`}
                  >
                    <div className="absolute top-2 left-2 inline-flex items-center gap-1 bg-black/30 backdrop-blur px-1.5 py-0.5 rounded text-[9px] text-white font-medium">
                      <Icon className="h-2.5 w-2.5" />
                      {TYPE_LABEL[c.type]}
                    </div>
                    <div className="absolute bottom-2 right-2 bg-black/40 text-white text-[9px] px-1.5 py-0.5 rounded">
                      {c.metric}
                    </div>
                  </div>
                  <div className="mt-1.5 text-xs font-medium truncate">{c.title}</div>
                </Link>
              );
            })}
          </div>
        </Card>

        {/* Upcoming + Reviews */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          {/* Upcoming schedule */}
          <Card className="lg:col-span-2 p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold">예약 발행 (다음 14일)</h3>
              <Link href="/schedule" className="text-[11px] text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100">
                전체 큐 →
              </Link>
            </div>
            <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {detail.upcoming.map((u, i) => (
                <li key={i} className="py-3 flex items-center gap-4">
                  <div className="text-center w-12 shrink-0">
                    <div className="text-xs font-semibold tabular-nums">{u.date}</div>
                    <div className="text-[10px] text-zinc-500">{u.time}</div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium">{u.title}</div>
                    <div className="text-[10px] text-zinc-500">{u.channel}</div>
                  </div>
                  <Badge tone="sky">예약</Badge>
                </li>
              ))}
            </ul>
          </Card>

          {/* Reviews */}
          <Card className="p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold">최근 리뷰</h3>
              <Link href="/reviews" className="text-[11px] text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100">
                답변 →
              </Link>
            </div>
            <ul className="space-y-3">
              {detail.reviews.map((r, i) => {
                const toneByType = { regular: "emerald", new: "sky", difficult: "rose" } as const;
                const labelByType = { regular: "단골", new: "신규", difficult: "주의" } as const;
                return (
                  <li key={i} className="border-b border-zinc-100 dark:border-zinc-800 pb-3 last:border-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium">{r.author}</span>
                        <span className="text-amber-500 text-[10px]">
                          {"★".repeat(r.rating)}
                          {"☆".repeat(5 - r.rating)}
                        </span>
                      </div>
                      <Badge tone={toneByType[r.type]}>{labelByType[r.type]}</Badge>
                    </div>
                    <p className="mt-1.5 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed line-clamp-2">
                      {r.body}
                    </p>
                  </li>
                );
              })}
            </ul>
          </Card>
        </div>
      </div>
    </>
  );
}
