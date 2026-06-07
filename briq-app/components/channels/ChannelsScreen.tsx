"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { Check, Plug, Unplug, AlertCircle, RefreshCw, Clock, FileText, ArrowUpRight, Info } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useBrand } from "@/components/brand/BrandProvider";
import { useToast } from "@/components/ui/toast";
import {
  CHANNELS,
  DEFAULT_CONNECTIONS,
  STORAGE_KEY,
  type ChannelId,
  type ConnectionState,
} from "@/lib/dummy/channels";
import { cn } from "@/lib/utils";
import { NextStepCard } from "@/components/layout/RoadmapStrip";

const HEALTH_COLOR: Record<ConnectionState["health"], string> = {
  healthy: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  warning: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  error: "bg-rose-500/15 text-rose-700 dark:text-rose-300",
  "not-connected": "bg-zinc-500/10 text-zinc-500",
};

const HEALTH_LABEL: Record<ConnectionState["health"], string> = {
  healthy: "정상",
  warning: "주의",
  error: "오류",
  "not-connected": "미연결",
};

const CHANNEL_TO_STUDIO: Partial<Record<ChannelId, { label: string; href: string }>> = {
  instagram: { label: "릴스/카드뉴스 만들기", href: "/reels" },
  threads: { label: "쓰레드 작성", href: "/threads" },
  "naver-blog": { label: "블로그 본문 생성", href: "/blog" },
  "naver-place": { label: "플레이스 소식 작성", href: "/shorts" },
  "kakao-channel": { label: "카카오 메시지 작성", href: "/shorts" },
  "x-twitter": { label: "트윗 변형 작성", href: "/threads" },
  "youtube-shorts": { label: "쇼츠 카피 생성", href: "/shorts" },
  tiktok: { label: "틱톡 카피 생성", href: "/shorts" },
};

export function ChannelsScreen() {
  const { brand } = useBrand();
  const toast = useToast();
  const [conns, setConns] = React.useState<ConnectionState[]>(DEFAULT_CONNECTIONS);

  // localStorage 영속화 — 브랜드별로 분리
  const storageKey = `${STORAGE_KEY}:${brand.id}`;

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw) as ConnectionState[];
        if (Array.isArray(parsed)) {
          setConns(parsed);
          return;
        }
      }
    } catch {
      // 무시
    }
    setConns(DEFAULT_CONNECTIONS);
  }, [storageKey]);

  const persist = (next: ConnectionState[]) => {
    setConns(next);
    try {
      localStorage.setItem(storageKey, JSON.stringify(next));
    } catch {
      // 무시
    }
  };

  const connect = (id: ChannelId) => {
    const channel = CHANNELS.find((c) => c.id === id);
    if (!channel) return;
    const next = conns.map((c) =>
      c.channelId === id
        ? {
            ...c,
            connected: true,
            connectedAt: new Date().toISOString().slice(0, 10),
            accountHandle: c.accountHandle ?? "@new_account",
            health: "healthy" as const,
            lastSyncedAt: "방금",
          }
        : c,
    );
    persist(next);
    toast.success(`(데모) ${channel.name} 연결 시뮬레이션 — 실제 OAuth는 정식 출시에 활성화됩니다`);
  };

  const disconnect = (id: ChannelId) => {
    const channel = CHANNELS.find((c) => c.id === id);
    if (!channel) return;
    const next = conns.map((c) =>
      c.channelId === id
        ? { ...c, connected: false, health: "not-connected" as const, lastSyncedAt: undefined }
        : c,
    );
    persist(next);
    toast.info(`(데모) ${channel.name} 연결 해제 — 실제 토큰 폐기는 미동작`);
  };

  const resync = (id: ChannelId) => {
    const channel = CHANNELS.find((c) => c.id === id);
    if (!channel) return;
    const next = conns.map((c) =>
      c.channelId === id ? { ...c, health: "healthy" as const, lastSyncedAt: "방금" } : c,
    );
    persist(next);
    toast.success(`(데모) ${channel.name} 동기화 완료`);
  };

  const connectedCount = conns.filter((c) => c.connected).length;
  const totalScheduled = conns.reduce(
    (s, c) => s + (c.connected ? CHANNELS.find((ch) => ch.id === c.channelId)?.scheduledThisWeek ?? 0 : 0),
    0,
  );
  const totalPublished = conns.reduce(
    (s, c) => s + (c.connected ? CHANNELS.find((ch) => ch.id === c.channelId)?.publishedThisMonth ?? 0 : 0),
    0,
  );

  return (
    <div className="px-4 sm:px-6 py-4 sm:py-6">
      {/* Header */}
      <div className="flex items-end justify-between gap-4 flex-wrap mb-6">
        <div className="min-w-0">
          <div className="text-xs text-violet-600 dark:text-violet-400 font-semibold">
            SNS HUB · {brand.name}
          </div>
          <h1 className="mt-2 text-2xl sm:text-3xl md:text-[32px] font-semibold tracking-tight leading-[1.15]">
            관리 중인 SNS 채널
          </h1>
          <p className="mt-2 text-sm sm:text-base text-zinc-500 max-w-2xl leading-relaxed">
            연결한 채널은 BRIQ가 한 번의 톤·컬러로 일괄 발행합니다. 채널마다 포맷·길이·해시태그 가이드 자동 적용.
          </p>
        </div>
      </div>

      {/* 데모 시뮬레이션 안내 — 사용자 신뢰 보호 */}
      <div className="mb-5 rounded-xl border border-amber-200 dark:border-amber-900/40 bg-amber-50/50 dark:bg-amber-500/5 px-4 py-3 flex items-start gap-3">
        <Info className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div className="min-w-0">
          <div className="text-sm font-semibold text-amber-900 dark:text-amber-100">
            데모 시뮬레이션 — 실제 SNS 계정과 연결되지 않습니다
          </div>
          <p className="mt-0.5 text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
            "연결하기"를 누르면 화면 상태만 바뀝니다. 실제 Instagram·네이버·카카오 OAuth는 정식 출시 시 활성화됩니다.
            예약 발행도 데모 큐로만 이동해요. 콘텐츠 생성과 카피·해시태그·미리보기는 그대로 사용 가능합니다.
          </p>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <Card className="p-5">
          <div className="text-sm text-zinc-500 font-medium">연결된 채널</div>
          <div className="mt-2 text-[28px] font-semibold tabular-nums tracking-tight">
            {connectedCount} <span className="text-lg text-zinc-400">/ {CHANNELS.length}</span>
          </div>
          <div className="text-xs text-zinc-500 mt-1.5">총 {CHANNELS.length}개 지원</div>
        </Card>
        <Card className="p-5">
          <div className="text-sm text-zinc-500 font-medium">이번주 예약</div>
          <div className="mt-2 text-[28px] font-semibold tabular-nums tracking-tight text-violet-600 dark:text-violet-400">{totalScheduled}</div>
          <div className="text-xs text-zinc-500 mt-1.5">발행 큐 활성</div>
        </Card>
        <Card className="p-5">
          <div className="text-sm text-zinc-500 font-medium">이번달 발행</div>
          <div className="mt-2 text-[28px] font-semibold tabular-nums tracking-tight">{totalPublished}</div>
          <div className="text-xs text-zinc-500 mt-1.5">전 채널 합산</div>
        </Card>
        <Card className="p-5">
          <div className="text-sm text-zinc-500 font-medium">시간 절감 (월)</div>
          <div className="mt-2 text-[28px] font-semibold tabular-nums tracking-tight text-emerald-600 dark:text-emerald-400">~{totalPublished * 0.6}h</div>
          <div className="text-xs text-zinc-500 mt-1.5">건당 ~36분 절감 가정</div>
        </Card>
      </div>

      {/* Channels grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {CHANNELS.map((ch, i) => {
          const conn = conns.find((c) => c.channelId === ch.id) ?? {
            channelId: ch.id,
            connected: false,
            health: "not-connected" as const,
          };
          const studio = CHANNEL_TO_STUDIO[ch.id];
          return (
            <motion.div
              key={ch.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <Card
                className={cn(
                  "p-5 transition-all flex flex-col",
                  conn.connected
                    ? "border-zinc-200 dark:border-zinc-800"
                    : "border-dashed border-zinc-200 dark:border-zinc-800 bg-zinc-50/40 dark:bg-zinc-900/30",
                )}
              >
                <div className="flex items-start justify-between mb-3.5 gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={cn(
                        "h-11 w-11 rounded-lg bg-gradient-to-br grid place-items-center text-white text-sm font-bold shrink-0",
                        ch.gradient,
                      )}
                    >
                      {ch.letter}
                    </div>
                    <div className="min-w-0">
                      <div className="text-base font-semibold tracking-tight truncate">{ch.name}</div>
                      <div className="text-xs text-zinc-500 truncate">{ch.vendor}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-500 font-semibold">
                      데모
                    </span>
                    <span className={cn("text-xs px-2.5 py-1 rounded-full font-semibold", HEALTH_COLOR[conn.health])}>
                      {HEALTH_LABEL[conn.health]}
                    </span>
                  </div>
                </div>

                <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed mb-3.5 line-clamp-2">
                  {ch.description}
                </p>

                <div className="flex flex-wrap gap-1.5 mb-3.5">
                  {ch.formats.slice(0, 3).map((f) => (
                    <span key={f} className="text-xs px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400">
                      {f}
                    </span>
                  ))}
                </div>

                {conn.connected ? (
                  <div className="text-sm text-zinc-500 space-y-1.5 mb-3.5">
                    {conn.accountHandle && (
                      <div className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300 font-medium">
                        <Check className="h-3.5 w-3.5 text-emerald-500" />
                        {conn.accountHandle}
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5" /> 마지막 동기화 {conn.lastSyncedAt ?? "—"}
                    </div>
                    {ch.bestTime && (
                      <div className="text-xs text-zinc-400">
                        최적 발행: {ch.bestTime}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-sm text-zinc-500 mb-3.5">
                    {ch.oauthType === "oauth2" ? `${ch.vendor} OAuth · 안전 연결` : "관리자 승인 필요"}
                  </div>
                )}

                <div className="mt-auto pt-3.5 border-t border-zinc-100 dark:border-zinc-900 flex items-center justify-between gap-2 flex-wrap">
                  {conn.connected ? (
                    <>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => resync(ch.id)}
                          className="text-sm inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
                          title="재동기화"
                        >
                          <RefreshCw className="h-3.5 w-3.5" /> 동기화
                        </button>
                        <button
                          onClick={() => disconnect(ch.id)}
                          className="text-sm inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:text-rose-600 dark:hover:text-rose-400"
                          title="연결 해제"
                        >
                          <Unplug className="h-3.5 w-3.5" /> 해제
                        </button>
                      </div>
                      {studio && (
                        <Button asChild size="sm" variant="outline">
                          <Link href={studio.href}>
                            {studio.label} <ArrowUpRight className="h-3.5 w-3.5" />
                          </Link>
                        </Button>
                      )}
                    </>
                  ) : (
                    <Button size="sm" onClick={() => connect(ch.id)} className="w-full">
                      <Plug className="h-4 w-4" /> 연결하기
                    </Button>
                  )}
                </div>

                {conn.health === "warning" && (
                  <div className="mt-2.5 text-xs text-amber-700 dark:text-amber-400 inline-flex items-center gap-1.5">
                    <AlertCircle className="h-3.5 w-3.5" /> 토큰 만료 임박 — 동기화 권장
                  </div>
                )}
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Studio shortcuts */}
      <Card className="p-5 mt-5">
        <h3 className="text-base font-semibold mb-4 flex items-center gap-2">
          <FileText className="h-4 w-4 text-violet-500" /> 채널별 콘텐츠 스튜디오 바로가기
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
          <StudioLink href="/reels" title="릴스" sub="9:16 영상 · 30초" />
          <StudioLink href="/cardnews" title="카드뉴스" sub="6-10장 캐러셀" />
          <StudioLink href="/threads" title="쓰레드" sub="500자 텍스트" />
          <StudioLink href="/blog" title="네이버 블로그" sub="SEO 본문" />
          <StudioLink href="/scheduler" title="발행 스케줄러" sub="예약·발행 큐" />
        </div>
      </Card>

      {/* 워크플로우 푸터 — 이전 (브랜드) / 다음 (콘텐츠) */}
      <div className="mt-5">
        <NextStepCard />
      </div>
    </div>
  );
}

function StudioLink({ href, title, sub }: { href: string; title: string; sub: string }) {
  return (
    <Link
      href={href}
      className="rounded-lg border border-zinc-100 dark:border-zinc-800 p-3 hover:border-zinc-900 dark:hover:border-zinc-100 transition-colors group"
    >
      <div className="text-sm font-semibold tracking-tight">{title}</div>
      <div className="text-xs text-zinc-500 mt-0.5 truncate">{sub}</div>
      <div className="mt-2 text-xs text-zinc-400 inline-flex items-center gap-1 group-hover:gap-1.5 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 transition-all">
        열기 <ArrowUpRight className="h-2.5 w-2.5" />
      </div>
    </Link>
  );
}
