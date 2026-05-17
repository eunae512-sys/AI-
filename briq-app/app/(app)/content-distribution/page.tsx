"use client";

// /content-distribution — 분배 허브.
//
// 한 캠페인 토픽 + 브랜드 → 10 플랫폼 아웃풋이 하나의 디스트리뷰션 보드에 정렬된다.
// 각 카드는 자기 플랫폼의 상태 (draft/ready/scheduled/published/failed/skipped) 를 가지고,
// 일괄 예약 / 개별 예약 / 외부 webhook / 수동 복사 — 4가지 분배 경로를 한 화면에서 다룬다.
//
// 영구 저장은 localStorage. Supabase 마이그레이션 시 같은 API 시그니처 유지.

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { Topbar } from "@/components/layout/Topbar";
import { useBrand } from "@/components/brand/BrandProvider";
import { generateMultiChannelCampaign } from "@/lib/content/multi-channel-generator";
import { PlatformDistributionCard } from "@/components/distribution/PlatformDistributionCard";
import { ConnectionStatusStrip } from "@/components/distribution/ConnectionStatusStrip";
import { BulkActionsBar } from "@/components/distribution/BulkActionsBar";
import { DistributionLog } from "@/components/distribution/DistributionLog";
import { WebhookConfigModal } from "@/components/distribution/WebhookConfigModal";
import {
  initCampaignDistribution,
  updatePlatformStatus,
  appendLog,
  loadLog,
  loadConnections,
  saveConnections,
  loadWebhook,
  saveWebhook,
} from "@/lib/distribution/storage";
import { sendViaWebhook, sendViaApi, sendViaManual, type SendPayload } from "@/lib/distribution/sender";
import { useUsage } from "@/lib/billing/use-usage";
import { isFeatureAllowed } from "@/lib/billing/gate";
import { FeatureLockedModal } from "@/components/billing/FeatureLockedModal";
import type { FeatureKey } from "@/lib/billing/gate";
import type {
  CampaignDistribution,
  DistributionLogEvent,
  PlatformConnection,
  WebhookConfig,
} from "@/lib/distribution/types";
import type { PlatformId } from "@/lib/content/multi-channel-types";

// 11 플랫폼 정렬 — 네이버 플레이스가 한국 소상공인 1순위 채널이라 가장 앞.
const PLATFORM_ORDER: PlatformId[] = [
  "naver-place",
  "instagram-cardnews",
  "instagram-caption",
  "instagram-reels",
  "facebook",
  "naver-blog",
  "naver-clip",
  "kakao-channel",
  "threads",
  "tiktok",
  "youtube-shorts",
];

// 사장님 시점 그룹화 — 11개 채널이 한 그리드에 펼쳐지면 막막함.
// 자주 쓰는 곳 / 가끔 / 확장 으로 묶고, 확장은 접힘 기본.
const PLATFORM_GROUPS: { id: string; label: string; sub: string; ids: PlatformId[]; defaultOpen: boolean }[] = [
  {
    id: "core",
    label: "자주 쓰는 곳",
    sub: "한국 소상공인 검색·발견 1순위",
    ids: ["naver-place", "instagram-cardnews", "instagram-caption", "naver-blog"],
    defaultOpen: true,
  },
  {
    id: "regular",
    label: "가끔 쓰는 곳",
    sub: "단골·짧은 영상·페이스북",
    ids: ["instagram-reels", "kakao-channel", "naver-clip", "facebook"],
    defaultOpen: true,
  },
  {
    id: "extra",
    label: "확장 — 나중에 열어보세요",
    sub: "여유 생기면 추가 채널",
    ids: ["threads", "tiktok", "youtube-shorts"],
    defaultOpen: false,
  },
];

const PLATFORM_LABEL: Record<PlatformId, string> = {
  "naver-place": "네이버 플레이스",
  "instagram-cardnews": "Instagram 피드",
  "instagram-caption": "Instagram 캡션",
  "instagram-reels": "Instagram 릴스",
  "naver-blog": "네이버 블로그",
  "naver-clip": "네이버 클립",
  "facebook": "페이스북",
  "threads": "스레드",
  "tiktok": "틱톡",
  "youtube-shorts": "유튜브 쇼츠",
  "kakao-channel": "카카오 채널",
};

const PLATFORM_FORMAT: Record<PlatformId, string> = {
  "naver-place": "새소식·소개글·한 줄 — 검색 결과 1순위",
  "instagram-cardnews": "7장 카드뉴스 — 감성 · 저장 유도",
  "instagram-caption": "캡션 + 해시태그 + CTA",
  "instagram-reels": "15-30초 릴스 대본",
  "naver-blog": "1500+자 SEO 본문",
  "naver-clip": "15·30·45초 검색 숏폼",
  "facebook": "300-500자 정보형 포스트",
  "threads": "1-3개 연결 스레드",
  "tiktok": "3초 후킹 · 빠른 컷",
  "youtube-shorts": "제목 5개 + 고정댓글",
  "kakao-channel": "80-120자 클릭 메시지",
};

export default function ContentDistributionPage() {
  const { brand } = useBrand();
  const params = useSearchParams();
  const topic = params.get("topic") ?? brand.campaign;

  const result = React.useMemo(
    () => generateMultiChannelCampaign(topic, brand),
    [topic, brand],
  );

  // ── 상태 ────────────────────────────────────────────────────────────────
  const [mounted, setMounted] = React.useState(false);
  const [distribution, setDistribution] = React.useState<CampaignDistribution | null>(null);
  const [connections, setConnections] = React.useState<PlatformConnection[]>([]);
  const [webhook, setWebhookState] = React.useState<WebhookConfig>({});
  const [log, setLog] = React.useState<DistributionLogEvent[]>([]);
  const [webhookOpen, setWebhookOpen] = React.useState(false);
  // 플랜 게이팅 — Free 가 잠긴 기능 누르면 모달
  const { planId, isMounted: planMounted } = useUsage();
  const [lockedFeature, setLockedFeature] = React.useState<FeatureKey | null>(null);
  // 모드별 허용 여부 — SSR 첫 렌더에선 보수적으로 (cycle 깜빡임 방지)
  const allowWebhook = planMounted ? isFeatureAllowed("distribution:webhook", planId) : true;
  const allowApiPublish = planMounted ? isFeatureAllowed("distribution:api-publish", planId) : true;

  // 클라이언트 마운트 후 localStorage 로드
  React.useEffect(() => {
    setMounted(true);
    const cd = initCampaignDistribution(brand.id, topic, PLATFORM_ORDER);
    setDistribution(cd);
    setConnections(loadConnections());
    setWebhookState(loadWebhook());
    setLog(loadLog());
  }, [brand.id, topic]);

  // 다른 탭/창에서 로그·연결·webhook 업데이트되면 동기화
  React.useEffect(() => {
    if (!mounted) return;
    const onLog = () => setLog(loadLog());
    const onConn = () => setConnections(loadConnections());
    const onWh = () => setWebhookState(loadWebhook());
    window.addEventListener("briq:distribution-log-updated", onLog);
    window.addEventListener("briq:distribution-connections-updated", onConn);
    window.addEventListener("briq:distribution-webhook-updated", onWh);
    return () => {
      window.removeEventListener("briq:distribution-log-updated", onLog);
      window.removeEventListener("briq:distribution-connections-updated", onConn);
      window.removeEventListener("briq:distribution-webhook-updated", onWh);
    };
  }, [mounted]);

  // ── 플랫폼별 primary + 보조 블록 derive ─────────────────────────────────
  const platformContent = React.useMemo(() => {
    const r = result;
    const m: Partial<Record<PlatformId, { primary: string; blocks: { label: string; value: string; inline?: boolean }[] }>> = {};

    m["naver-place"] = {
      primary: r.naverPlace.news,
      blocks: [
        { label: "한 줄 소개 후보", value: r.naverPlace.taglineCandidates.map((t, i) => `${i + 1}. ${t}`).join("\n") },
        { label: "짧은 안내", value: r.naverPlace.noticeShort, inline: true },
        { label: "가게 소개글 (200-400자)", value: r.naverPlace.introduction },
        { label: "리뷰 답글 톤 가이드", value: r.naverPlace.reviewReplyTone },
        { label: "플레이스 SEO 키워드", value: r.naverPlace.placeKeywords.join(" · "), inline: true },
        {
          label: "체크리스트",
          value: r.naverPlace.checklist
            .map((c) => `${c.status === "ok" ? "●" : c.status === "warn" ? "◐" : "○"} ${c.label} — ${c.target}`)
            .join("\n"),
        },
      ],
    };
    m["instagram-cardnews"] = {
      primary: r.instagramCardnews.headline,
      blocks: [
        { label: "구성", value: `${r.instagramCardnews.slideCount}장 카드뉴스 — /campaigns 에서 슬라이드 편집` },
      ],
    };
    m["instagram-caption"] = {
      primary: r.instagramCaption.caption,
      blocks: [
        { label: "해시태그", value: r.instagramCaption.hashtags.join(" "), inline: true },
        { label: "CTA", value: r.instagramCaption.cta },
      ],
    };
    m["instagram-reels"] = {
      primary: r.instagramReels.hook3s,
      blocks: [
        {
          label: "씬 시퀀스",
          value: r.instagramReels.scenes
            .map((s) => `${String(s.at).padStart(2, "0")}s · ${s.visual} → ${s.subtitle}`)
            .join("\n"),
        },
        { label: "캡션", value: r.instagramReels.caption },
      ],
    };
    m["naver-blog"] = {
      primary: r.naverBlog.titleCandidates[0],
      blocks: [
        { label: "제목 후보", value: r.naverBlog.titleCandidates.map((t, i) => `${i + 1}. ${t}`).join("\n") },
        { label: "도입", value: r.naverBlog.body.intro },
        { label: "본문", value: r.naverBlog.body.main.join("\n\n") },
        { label: "정리", value: r.naverBlog.body.summary },
        { label: "CTA", value: r.naverBlog.body.cta },
        {
          label: "SEO 키워드",
          value: [
            `[핵심] ${r.naverBlog.keywords.primary.join(" · ")}`,
            `[보조] ${r.naverBlog.keywords.secondary.join(" · ")}`,
            `[롱테일] ${r.naverBlog.keywords.longTail.join(" · ")}`,
            `[지역] ${r.naverBlog.keywords.local.join(" · ")}`,
          ].join("\n"),
        },
      ],
    };
    m["naver-clip"] = {
      primary: r.naverClip.hookLine,
      blocks: [
        { label: "제목 후보", value: r.naverClip.titleCandidates.map((t, i) => `${i + 1}. ${t}`).join("\n") },
        ...r.naverClip.variants.map((v) => ({
          label: `${v.duration}초 시퀀스`,
          value: v.scenes
            .map((s) => `${String(s.at).padStart(2, "0")}s · ${s.visual} | ${s.subtitle} · "${s.narration}"`)
            .join("\n"),
        })),
        { label: "설명문", value: r.naverClip.description },
        { label: "해시태그", value: r.naverClip.hashtags.join(" "), inline: true },
        { label: "CTA", value: r.naverClip.cta },
      ],
    };
    m["facebook"] = {
      primary: r.facebook.post,
      blocks: [{ label: "CTA", value: r.facebook.cta }],
    };
    m["threads"] = {
      primary: r.threads.posts[0],
      blocks: r.threads.posts.slice(1).map((p, i) => ({ label: `Thread ${i + 2}`, value: p })),
    };
    m["tiktok"] = {
      primary: r.tiktok.hook3s,
      blocks: [
        {
          label: "씬 스크립트",
          value: r.tiktok.script
            .map((s) => `${String(s.at).padStart(2, "0")}s · ${s.visual} → ${s.subtitle}`)
            .join("\n"),
        },
        { label: "캡션", value: r.tiktok.caption },
        { label: "해시태그", value: r.tiktok.hashtags.join(" "), inline: true },
        { label: "CTA", value: r.tiktok.cta },
      ],
    };
    m["youtube-shorts"] = {
      primary: r.youtubeShorts.titleCandidates[0],
      blocks: [
        { label: "제목 후보", value: r.youtubeShorts.titleCandidates.map((t, i) => `${i + 1}. ${t}`).join("\n") },
        { label: "설명", value: r.youtubeShorts.description },
        { label: "해시태그", value: r.youtubeShorts.hashtags.join(" "), inline: true },
        { label: "고정댓글", value: r.youtubeShorts.pinnedComment },
        { label: "CTA", value: r.youtubeShorts.cta },
      ],
    };
    m["kakao-channel"] = {
      primary: r.kakaoChannel.message,
      blocks: [{ label: "버튼 라벨", value: r.kakaoChannel.linkLabel, inline: true }],
    };

    return m;
  }, [result]);

  // ── 액션 핸들러 ────────────────────────────────────────────────────────
  const logEvent = React.useCallback(
    (platformId: PlatformId, action: DistributionLogEvent["action"], detail: string) => {
      appendLog({ brandId: brand.id, platformId, action, detail });
      setLog(loadLog());
    },
    [brand.id],
  );

  const handleSchedule = (platformId: PlatformId, iso: string | undefined) => {
    if (!distribution) return;
    const next = updatePlatformStatus(distribution, platformId, {
      status: iso ? "scheduled" : "ready",
      scheduledAt: iso,
      lastActionAt: new Date().toISOString(),
      errorReason: undefined,
    });
    setDistribution(next);
    if (iso) {
      logEvent(platformId, "schedule", `${new Date(iso).toLocaleString("ko-KR")} 예약`);
    }
  };

  const buildPayload = React.useCallback(
    (platformId: PlatformId): SendPayload | null => {
      if (!distribution) return null;
      const content = platformContent[platformId];
      if (!content) return null;
      const state = distribution.platforms[platformId];
      return {
        platform: platformId,
        brandId: brand.id,
        brandName: brand.name,
        campaign: topic,
        scheduledAt: state?.scheduledAt,
        primary: content.primary,
        blocks: content.blocks.map((b) => ({ label: b.label, value: b.value })),
      };
    },
    [distribution, platformContent, brand.id, brand.name, topic],
  );

  const handleSend = async (platformId: PlatformId) => {
    if (!distribution) return;
    const conn = connections.find((c) => c.id === platformId);
    const mode = conn?.mode ?? "manual";
    const payload = buildPayload(platformId);
    if (!payload) {
      logEvent(platformId, "fail", "콘텐츠 페이로드 생성 실패");
      return;
    }

    // 0) 플랜 게이팅 — Free 가 webhook/api 누르면 잠금 모달
    if (mode === "webhook" && !allowWebhook) {
      setLockedFeature("distribution:webhook");
      return;
    }
    if (mode === "api" && !allowApiPublish) {
      setLockedFeature("distribution:api-publish");
      return;
    }

    // 1) 보내는 중 상태로 즉시 마킹 — 사용자가 클릭한 게 반영되는 것이 보이게
    let next = updatePlatformStatus(distribution, platformId, {
      lastActionAt: new Date().toISOString(),
    });
    setDistribution(next);

    if (mode === "api") {
      if (!conn?.connected) {
        next = updatePlatformStatus(next, platformId, {
          status: "failed",
          errorReason: "계정 미연결 — 연결 상태 스트립에서 연결 후 재시도",
        });
        setDistribution(next);
        logEvent(platformId, "fail", "계정 미연결 — 연결 후 재시도");
        return;
      }
      const result = await sendViaApi(payload);
      if (result.ok) {
        next = updatePlatformStatus(next, platformId, {
          status: "scheduled",
          errorReason: undefined,
        });
        setDistribution(next);
        logEvent(platformId, "queue", result.detail);
      } else {
        next = updatePlatformStatus(next, platformId, {
          status: "failed",
          errorReason: result.reason,
        });
        setDistribution(next);
        logEvent(platformId, "fail", result.reason);
      }
      return;
    }

    if (mode === "webhook") {
      if (!webhook.url) {
        setWebhookOpen(true);
        next = updatePlatformStatus(next, platformId, {
          status: "failed",
          errorReason: "Webhook URL 미설정 — 모달에서 등록 필요",
        });
        setDistribution(next);
        logEvent(platformId, "fail", "Webhook URL 미설정 — 모달에서 등록 필요");
        return;
      }
      const result = await sendViaWebhook(payload, webhook);
      if (result.ok) {
        next = updatePlatformStatus(next, platformId, {
          status: "scheduled",
          errorReason: undefined,
        });
        setDistribution(next);
        logEvent(platformId, "webhook", result.detail);
      } else {
        next = updatePlatformStatus(next, platformId, {
          status: "failed",
          errorReason: result.reason,
        });
        setDistribution(next);
        logEvent(platformId, "fail", result.reason);
      }
      return;
    }

    // manual — 클립보드 + 발행 페이지 새 탭
    const result = await sendViaManual(payload);
    if (result.ok) {
      next = updatePlatformStatus(next, platformId, {
        status: "ready",
        errorReason: undefined,
      });
      setDistribution(next);
      logEvent(platformId, "copy", result.detail);
    } else {
      next = updatePlatformStatus(next, platformId, {
        status: "failed",
        errorReason: result.reason,
      });
      setDistribution(next);
      logEvent(platformId, "fail", result.reason);
    }
  };

  const handleSkip = (platformId: PlatformId) => {
    if (!distribution) return;
    const current = distribution.platforms[platformId];
    const newStatus = current?.status === "skipped" ? "draft" : "skipped";
    const next = updatePlatformStatus(distribution, platformId, {
      status: newStatus,
      lastActionAt: new Date().toISOString(),
    });
    setDistribution(next);
    logEvent(platformId, "skip", newStatus === "skipped" ? "건너뜀" : "복원");
  };

  const handleCopy = (platformId: PlatformId) => {
    logEvent(platformId, "copy", "클립보드 복사");
  };

  const handleScheduleAll = (iso: string, stagger: number) => {
    if (!distribution) return;
    const base = new Date(iso).getTime();
    let next = distribution;
    PLATFORM_ORDER.forEach((id, i) => {
      if (next.platforms[id]?.status === "skipped") return;
      const at = new Date(base + i * stagger * 60_000).toISOString();
      next = updatePlatformStatus(next, id, {
        status: "scheduled",
        scheduledAt: at,
        lastActionAt: new Date().toISOString(),
      });
      appendLog({
        brandId: brand.id,
        platformId: id,
        action: "schedule",
        detail: `일괄 예약 +${i * stagger}분 → ${new Date(at).toLocaleString("ko-KR")}`,
      });
    });
    setDistribution(next);
    setLog(loadLog());
  };

  const handleDistributeAll = async () => {
    if (!distribution) return;
    // 일괄 — manual 은 새 탭 폭주를 방지하기 위해 자동 오픈 대신 클립보드만.
    // webhook 은 실 POST 일괄, api 는 토큰 검증만.
    // 플랜 게이팅 — Free 가 일괄을 누르면, 그 안에 webhook/api 카드가 섞여있어도 게이팅 막힘 트리거.
    if (!allowWebhook) {
      // Free 가 일괄 분배 시도 — manual 외엔 막힘
      const hasNonManual = PLATFORM_ORDER.some((id) => {
        const c = connections.find((cn) => cn.id === id);
        return c && c.mode !== "manual" && distribution.platforms[id]?.status !== "skipped";
      });
      if (hasNonManual) {
        setLockedFeature("distribution:webhook");
        return;
      }
    }
    let queued = 0;
    let failed = 0;
    for (const id of PLATFORM_ORDER) {
      const conn = connections.find((c) => c.id === id);
      if (!conn) continue;
      if (distribution.platforms[id]?.status === "skipped") continue;
      const payload = buildPayload(id);
      if (!payload) continue;

      if (conn.mode === "webhook") {
        if (!webhook.url) {
          failed += 1;
          appendLog({ brandId: brand.id, platformId: id, action: "fail", detail: "Webhook URL 미설정" });
          continue;
        }
        const r = await sendViaWebhook(payload, webhook);
        if (r.ok) {
          queued += 1;
          appendLog({ brandId: brand.id, platformId: id, action: "webhook", detail: `일괄 · ${r.detail}` });
        } else {
          failed += 1;
          appendLog({ brandId: brand.id, platformId: id, action: "fail", detail: `일괄 · ${r.reason}` });
        }
      } else if (conn.mode === "api") {
        if (!conn.connected) {
          failed += 1;
          appendLog({ brandId: brand.id, platformId: id, action: "fail", detail: "일괄 · 계정 미연결" });
          continue;
        }
        const r = await sendViaApi(payload);
        if (r.ok) {
          queued += 1;
          appendLog({ brandId: brand.id, platformId: id, action: "queue", detail: `일괄 · ${r.detail}` });
        } else {
          failed += 1;
          appendLog({ brandId: brand.id, platformId: id, action: "fail", detail: `일괄 · ${r.reason}` });
        }
      } else {
        // manual — 일괄에서는 새 탭을 열지 않고 큐 상태만. 사용자가 카드별로 직접 발행.
        queued += 1;
        appendLog({ brandId: brand.id, platformId: id, action: "queue", detail: "일괄 · 수동 보조 큐 등록 — 카드에서 직접 발행" });
      }
    }

    // 상태 일괄 갱신
    let next = distribution;
    PLATFORM_ORDER.forEach((id) => {
      const conn = connections.find((c) => c.id === id);
      if (!conn) return;
      if (next.platforms[id]?.status === "skipped") return;
      if (conn.mode === "webhook" && !webhook.url) {
        next = updatePlatformStatus(next, id, { status: "failed", errorReason: "Webhook URL 미설정", lastActionAt: new Date().toISOString() });
      } else if (conn.mode === "api" && !conn.connected) {
        next = updatePlatformStatus(next, id, { status: "failed", errorReason: "계정 미연결", lastActionAt: new Date().toISOString() });
      } else {
        next = updatePlatformStatus(next, id, {
          status: conn.mode === "manual" ? "ready" : "scheduled",
          lastActionAt: new Date().toISOString(),
          errorReason: undefined,
        });
      }
    });
    setDistribution(next);
    setLog(loadLog());

    if (queued === 0 && failed === 0) {
      appendLog({
        brandId: brand.id,
        platformId: "instagram-cardnews",
        action: "fail",
        detail: "큐에 등록할 플랫폼 없음 — 연결 또는 webhook 설정 확인",
      });
      setLog(loadLog());
    }
  };

  const handleResetAll = () => {
    if (!distribution) return;
    let next = distribution;
    PLATFORM_ORDER.forEach((id) => {
      next = updatePlatformStatus(next, id, {
        status: "draft",
        scheduledAt: undefined,
        lastActionAt: undefined,
        errorReason: undefined,
      });
    });
    setDistribution(next);
  };

  const handleToggleConnection = (id: PlatformConnection["id"]) => {
    const next = connections.map((c) => (c.id === id ? { ...c, connected: !c.connected } : c));
    setConnections(next);
    saveConnections(next);
  };

  const handleSaveWebhook = (cfg: WebhookConfig) => {
    setWebhookState(cfg);
    saveWebhook(cfg);
  };

  // ── 카운터 ─────────────────────────────────────────────────────────────
  const counters = React.useMemo(() => {
    if (!distribution) return { scheduled: 0, published: 0 };
    let scheduled = 0;
    let published = 0;
    PLATFORM_ORDER.forEach((id) => {
      const s = distribution.platforms[id]?.status;
      if (s === "scheduled") scheduled += 1;
      if (s === "published") published += 1;
    });
    return { scheduled, published };
  }, [distribution]);

  // SSR 가드 — localStorage 의존 데이터가 마운트 전엔 placeholder
  if (!mounted || !distribution) {
    return (
      <>
        <Topbar title="Content Distribution" breadcrumb="한 캠페인 · 10 플랫폼 · 12 아웃풋" />
        <div className="max-w-[1280px] mx-auto px-5 sm:px-10 md:px-14 pt-10 sm:pt-16 pb-24">
          <div className="text-[12px] text-zinc-500">분배 보드 로딩 중...</div>
        </div>
      </>
    );
  }

  return (
    <>
      <Topbar title="Content Distribution" breadcrumb="한 캠페인 · 10 플랫폼 · 12 아웃풋" />
      <div className="max-w-[1280px] mx-auto px-5 sm:px-10 md:px-14 pt-10 sm:pt-16 pb-24">
        {/* Masthead */}
        <header className="pb-8 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-baseline justify-between">
            <div className="editorial-label">Distribution Hub</div>
            <div className="text-[11px] tabular-nums text-zinc-500">
              {new Date(result.generatedAt).toLocaleString("ko-KR")}
            </div>
          </div>
          <h1
            className="mt-3 text-[32px] sm:text-[44px] leading-[0.98] tracking-[-0.02em] font-medium"
            style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 500 }}
          >
            {result.instagramCardnews.headline}
          </h1>
          <p className="mt-4 max-w-[680px] text-[13.5px] text-zinc-600 dark:text-zinc-400 leading-[1.65]">
            한 줄 토픽 <span className="text-zinc-900 dark:text-zinc-100">· {topic} ·</span>{" "}
            브랜드 <span className="text-zinc-900 dark:text-zinc-100">{brand.name}</span>.{" "}
            10 플랫폼이 한 보드 위에 정렬됩니다. 각 카드에서 예약·분배·건너뜀을 직접 다루거나, 위 일괄 컨트롤로 전체를 한 번에 처리하세요.
          </p>
        </header>

        {/* 일괄 액션 바 */}
        <BulkActionsBar
          total={PLATFORM_ORDER.length}
          scheduledCount={counters.scheduled}
          publishedCount={counters.published}
          webhookConfigured={Boolean(webhook.url)}
          webhookLocked={!allowWebhook}
          onScheduleAll={handleScheduleAll}
          onDistributeAll={handleDistributeAll}
          onResetAll={handleResetAll}
          onOpenWebhook={() => {
            if (!allowWebhook) {
              setLockedFeature("distribution:webhook");
              return;
            }
            setWebhookOpen(true);
          }}
        />

        {/* 연결 상태 스트립 */}
        <ConnectionStatusStrip connections={connections} onToggle={handleToggleConnection} />

        {/* 플랫폼 카드 그리드 — 사장님 시점 3그룹 (자주/가끔/확장) */}
        <section className="pt-10">
          <div className="flex items-baseline justify-between mb-5">
            <div>
              <div className="editorial-label">플랫폼 분배 보드</div>
              <p className="mt-1 text-[12px] text-zinc-500">
                각 카드는 자기 플랫폼의 상태·콘텐츠·액션을 담습니다. 회색 카드는 건너뜀 — 다시 누르면 복원.
              </p>
            </div>
          </div>
          <PlatformGroupedBoard
            groups={PLATFORM_GROUPS}
            renderCard={(id) => {
              const conn = connections.find((c) => c.id === id);
              const content = platformContent[id];
              const state = distribution.platforms[id] ?? { platformId: id, status: "draft" as const };
              if (!conn || !content) return null;
              return (
                <PlatformDistributionCard
                  key={id}
                  platformId={id}
                  label={PLATFORM_LABEL[id]}
                  format={PLATFORM_FORMAT[id]}
                  mode={conn.mode}
                  connected={conn.connected}
                  connectionNote={conn.note}
                  state={state}
                  primary={content.primary}
                  blocks={content.blocks}
                  externalLink={
                    id === "naver-place"
                      ? { href: "https://new.smartplace.naver.com/", label: "네이버 스마트플레이스 매니저" }
                      : id === "naver-blog"
                        ? { href: "https://blog.naver.com", label: "네이버 블로그 발행 페이지" }
                        : id === "naver-clip"
                          ? { href: "https://naver.me/clip-create", label: "네이버 클립 업로드" }
                          : id === "kakao-channel"
                            ? { href: "https://center-pf.kakao.com", label: "카카오 채널 관리자" }
                            : undefined
                  }
                  onSchedule={(iso) => handleSchedule(id, iso)}
                  onSend={() => handleSend(id)}
                  onSkip={() => handleSkip(id)}
                  onCopy={() => handleCopy(id)}
                />
              );
            }}
          />
        </section>

        {/* 분배 로그 */}
        <section className="pt-14">
          <div className="flex items-baseline justify-between mb-4">
            <div>
              <div className="editorial-label">최근 활동</div>
              <p className="mt-1 text-[12px] text-zinc-500">분배 보드의 모든 액션이 시간순으로 기록됩니다.</p>
            </div>
            <span className="text-[10.5px] tabular-nums text-zinc-400">최근 200건</span>
          </div>
          <DistributionLog events={log} />
        </section>
      </div>

      {/* Webhook 설정 모달 */}
      <WebhookConfigModal
        open={webhookOpen}
        config={webhook}
        onClose={() => setWebhookOpen(false)}
        onSave={handleSaveWebhook}
      />

      {/* 플랜 잠금 모달 — Free 가 webhook/API 누르면 노출 */}
      <FeatureLockedModal
        open={lockedFeature !== null}
        feature={lockedFeature ?? "distribution:webhook"}
        onClose={() => setLockedFeature(null)}
      />
    </>
  );
}

// 3티어로 묶인 플랫폼 보드 — 자주 쓰는 곳은 펼쳐서, 확장은 접어서.
function PlatformGroupedBoard({
  groups,
  renderCard,
}: {
  groups: { id: string; label: string; sub: string; ids: PlatformId[]; defaultOpen: boolean }[];
  renderCard: (id: PlatformId) => React.ReactNode;
}) {
  const [openGroups, setOpenGroups] = React.useState<Record<string, boolean>>(() =>
    Object.fromEntries(groups.map((g) => [g.id, g.defaultOpen])),
  );
  const toggle = (id: string) =>
    setOpenGroups((cur) => ({ ...cur, [id]: !cur[id] }));

  return (
    <div className="space-y-10">
      {groups.map((g) => {
        const open = openGroups[g.id];
        return (
          <div key={g.id}>
            <button
              type="button"
              onClick={() => toggle(g.id)}
              aria-expanded={open}
              className="w-full flex items-baseline justify-between gap-3 mb-4 pb-2 border-b border-zinc-200 dark:border-zinc-800 text-left group"
            >
              <div className="flex items-baseline gap-3">
                <span className="text-[14px] tracking-tight font-medium text-zinc-900 dark:text-zinc-100">
                  {g.label}
                </span>
                <span className="text-[11px] text-zinc-500">
                  {g.sub} · {g.ids.length}개
                </span>
              </div>
              <ChevronDown
                className={`h-3.5 w-3.5 text-zinc-400 transition-transform shrink-0 ${open ? "rotate-180" : ""}`}
              />
            </button>
            {open && (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {g.ids.map((id) => renderCard(id))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
