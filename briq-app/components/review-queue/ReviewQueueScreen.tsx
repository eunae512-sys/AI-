"use client";

import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import { CheckCircle2, AlertTriangle, Eye, Send, X, Edit3 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useBrand } from "@/components/brand/BrandProvider";
import { useToast } from "@/components/ui/toast";

type Severity = "ok" | "warning" | "danger";

type QueueItem = {
  id: string;
  type: string;
  title: string;
  channel: string;
  issue: string | null;
  severity: Severity;
  ago: string;
  reviewer?: string;
};

// 브랜드별 검토 큐 아이템
const QUEUE_BY_BRAND: Record<string, Omit<QueueItem, "id">[]> = {
  miokdang: [
    { type: "카드뉴스", title: "5월 봄나물 코스 6장", channel: "인스타 캐러셀", issue: null, severity: "ok", ago: "방금" },
    { type: "릴스", title: "장마 감성 릴스 · 비 오는 날", channel: "인스타 + 블로그", issue: null, severity: "ok", ago: "8분 전" },
    { type: "블로그", title: "양평 시장 이야기", channel: "네이버 블로그", issue: "권장: 이모지 1개 이하 (현재 3개)", severity: "warning", ago: "14분 전", reviewer: "허은애" },
    { type: "릴스", title: "여정식 6종 plating", channel: "인스타 릴스", issue: "톤 v3 일관성 4/5 슬라이드 미스매치", severity: "warning", ago: "31분 전", reviewer: "AI" },
    { type: "카드뉴스", title: "어버이날 효도 패키지", channel: "전 채널", issue: null, severity: "ok", ago: "1시간 전" },
    { type: "스토리", title: "오늘의 정식", channel: "인스타 스토리", issue: null, severity: "ok", ago: "2시간 전" },
    { type: "블로그", title: "양평 산지 인터뷰", channel: "네이버 블로그", issue: '"탁월한" AI 인공 표현 1건', severity: "danger", ago: "3시간 전", reviewer: "허은애" },
  ],
  "roastery-1985": [
    { type: "릴스", title: "오늘 새 원두 도착", channel: "인스타 릴스", issue: null, severity: "ok", ago: "방금" },
    { type: "카드뉴스", title: "콜드브루 6시간 추출", channel: "인스타 + 블로그", issue: null, severity: "ok", ago: "12분 전" },
    { type: "블로그", title: "에티오피아 예가체프 노트", channel: "네이버 블로그", issue: "권장: 산지 명시 누락", severity: "warning", ago: "24분 전", reviewer: "김민준" },
  ],
  "seochon-stay": [
    { type: "릴스", title: "한옥 새벽 빛", channel: "인스타 릴스", issue: null, severity: "ok", ago: "방금" },
    { type: "카드뉴스", title: "효도 스테이 패키지", channel: "전 채널", issue: null, severity: "ok", ago: "18분 전" },
    { type: "스토리", title: "오늘의 마당", channel: "인스타 스토리", issue: '"럭셔리" 금지어 검출', severity: "danger", ago: "42분 전", reviewer: "사장님" },
  ],
  "dolce-dessert": [
    { type: "릴스", title: "수박 케이크 ASMR", channel: "인스타 릴스", issue: null, severity: "ok", ago: "방금" },
    { type: "카드뉴스", title: "5월 한정 마카롱", channel: "인스타 캐러셀", issue: null, severity: "ok", ago: "6분 전" },
    { type: "스토리", title: "오늘 갓 나온", channel: "인스타 스토리", issue: "권장: 이모지 1개 이하 (현재 4개)", severity: "warning", ago: "21분 전", reviewer: "AI" },
    { type: "블로그", title: "디저트 트렌드 2026", channel: "네이버 블로그", issue: null, severity: "ok", ago: "1시간 전" },
  ],
  "luna-hair": [
    { type: "릴스", title: "결이 살아요 ASMR", channel: "인스타 릴스", issue: null, severity: "ok", ago: "방금" },
    { type: "카드뉴스", title: "5월 봄 컬러 추천 6", channel: "인스타 캐러셀", issue: null, severity: "ok", ago: "14분 전" },
    { type: "릴스", title: "수국 컬러 매칭", channel: "전 채널", issue: '"완벽한" 금지어 1건', severity: "danger", ago: "52분 전", reviewer: "이가영" },
  ],
  "forum-fashion": [
    { type: "카드뉴스", title: "S/S 26 룩북 12장", channel: "인스타 + Threads", issue: null, severity: "ok", ago: "방금" },
    { type: "릴스", title: "ONE FABRIC, TWO WAYS", channel: "인스타 릴스", issue: null, severity: "ok", ago: "17분 전" },
  ],
};

const SEVERITY_TONE: Record<Severity, "emerald" | "amber" | "rose"> = {
  ok: "emerald",
  warning: "amber",
  danger: "rose",
};
const SEVERITY_LABEL: Record<Severity, string> = {
  ok: "통과",
  warning: "검토",
  danger: "차단",
};

const buildQueue = (brandId: string): QueueItem[] =>
  (QUEUE_BY_BRAND[brandId] ?? QUEUE_BY_BRAND.miokdang).map((it, i) => ({
    ...it,
    id: `${brandId}-${i}`,
  }));

export function ReviewQueueScreen() {
  const { brand } = useBrand();
  const toast = useToast();
  const [queue, setQueue] = React.useState<QueueItem[]>(() => buildQueue(brand.id));

  React.useEffect(() => {
    setQueue(buildQueue(brand.id));
  }, [brand.id]);

  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [draft, setDraft] = React.useState<{ title: string; issue: string; severity: Severity }>({
    title: "",
    issue: "",
    severity: "warning",
  });

  const openEdit = (id: string) => {
    const item = queue.find((q) => q.id === id);
    if (!item) return;
    setEditingId(id);
    setDraft({ title: item.title, issue: item.issue ?? "", severity: item.severity });
  };

  const closeEdit = () => setEditingId(null);

  const submitEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;
    setQueue((q) =>
      q.map((it) =>
        it.id === editingId
          ? {
              ...it,
              title: draft.title.trim() || it.title,
              issue: draft.issue.trim() ? draft.issue.trim() : null,
              severity: draft.severity,
              reviewer: "허은애",
              ago: "방금",
            }
          : it,
      ),
    );
    toast.success(`"${draft.title.trim() || "콘텐츠"}" 수정 저장됨`);
    setEditingId(null);
  };

  // 검수 통과 → 발행 큐(publish_jobs) enqueue. 연결된 자동 채널은 cron 이 처리,
  // 미연결/미설정이면 큐에 남아 후속 처리(어댑터 미연결 시 실패로 기록).
  const enqueuePublish = async (item: { title: string; id: string }) => {
    try {
      await fetch("/api/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel: "instagram",
          asset: { caption: item.title, aiLabeled: true, sourceId: item.id },
        }),
      });
    } catch {
      // 네트워크 실패는 무시(낙관적 UI) — 잡 미생성 시 다음 시도에서 재등록 가능
    }
  };

  const approve = (id: string) => {
    const item = queue.find((q) => q.id === id);
    if (!item) return;
    setQueue((q) => q.filter((it) => it.id !== id));
    void enqueuePublish(item);
    toast.success(`"${item.title}" 승인 — 발행 큐에 등록됐어요`);
  };

  const autoPublish = (id: string) => {
    const item = queue.find((q) => q.id === id);
    if (!item) return;
    setQueue((q) => q.filter((it) => it.id !== id));
    void enqueuePublish(item);
    toast.success(`"${item.title}" 발행 큐로 이동됨`);
  };

  const okCount = queue.filter((q) => q.severity === "ok").length;
  const warnCount = queue.filter((q) => q.severity === "warning").length;
  const dangerCount = queue.filter((q) => q.severity === "danger").length;

  return (
    <div className="px-4 sm:px-6 py-4 sm:py-6">
      <div className="mb-6">
        <div className="text-[11px] uppercase tracking-[0.15em] text-amber-600 dark:text-amber-400 font-semibold">
          REVIEW QUEUE · {brand.name}
        </div>
        <h1 className="mt-2 text-[22px] sm:text-2xl md:text-3xl font-semibold tracking-tight leading-[1.15]">발행 전 자동 검수</h1>
        <p className="mt-1 text-sm text-zinc-500 max-w-2xl">
          {brand.name} 톤 v{brand.toneVersion} · 금지어 · 의광법 · 가이드라인. 모든 콘텐츠는 발행 전 BRIQ 자동 검수를 거칩니다.
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <Card className="p-4">
          <div className="text-[10px] uppercase tracking-[0.15em] text-zinc-400 font-semibold">전체 큐</div>
          <div className="mt-1.5 text-2xl font-semibold tabular-nums">{queue.length}</div>
        </Card>
        <Card className="p-4">
          <div className="text-[10px] uppercase tracking-[0.15em] text-zinc-400 font-semibold">통과 · 자동 발행</div>
          <div className="mt-1.5 text-2xl font-semibold tabular-nums text-emerald-600">{okCount}</div>
        </Card>
        <Card className="p-4">
          <div className="text-[10px] uppercase tracking-[0.15em] text-zinc-400 font-semibold">검토 필요</div>
          <div className="mt-1.5 text-2xl font-semibold tabular-nums text-amber-600">{warnCount}</div>
        </Card>
        <Card className="p-4">
          <div className="text-[10px] uppercase tracking-[0.15em] text-zinc-400 font-semibold">차단 · 사장님 확인</div>
          <div className="mt-1.5 text-2xl font-semibold tabular-nums text-rose-600">{dangerCount}</div>
        </Card>
      </div>

      {/* Queue list */}
      <Card className="overflow-hidden">
        <div className="px-5 py-3 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
          <h3 className="text-sm font-semibold">{brand.name} 검토 큐</h3>
          <span className="text-[11px] text-zinc-500">실시간 검수 · 자동 통과 90%</span>
        </div>
        <AnimatePresence mode="popLayout">
          <ul key={brand.id} className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {queue.map((item, i) => (
              <motion.li
                key={item.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: i * 0.04 }}
                className="p-3 sm:p-4 flex items-start gap-3"
              >
                <div
                  className={`h-8 w-8 rounded-md grid place-items-center shrink-0 ${
                    item.severity === "ok"
                      ? "bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                      : item.severity === "warning"
                      ? "bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400"
                      : "bg-rose-100 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400"
                  }`}
                >
                  {item.severity === "ok" ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                </div>
                <div className={`hidden sm:grid h-12 w-12 rounded-md bg-gradient-to-br ${brand.gradient} shrink-0 place-items-center text-white font-bold text-sm`}>
                  {brand.letter}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                    <Badge tone="default">{item.type}</Badge>
                    <Badge tone={SEVERITY_TONE[item.severity]}>
                      {SEVERITY_LABEL[item.severity]}
                    </Badge>
                  </div>
                  <div className="mt-1.5 text-sm font-medium leading-snug break-keep">
                    {item.title}
                  </div>
                  <div className="mt-1 text-[11px] text-zinc-500">
                    {item.channel} · {item.ago}
                    {item.reviewer && (
                      <>
                        {" · "}검토 담당: <b>{item.reviewer}</b>
                      </>
                    )}
                  </div>
                  {item.issue && (
                    <div
                      className={`mt-2 rounded-md p-2.5 text-[11px] border ${
                        item.severity === "danger"
                          ? "bg-rose-50/30 dark:bg-rose-500/5 border-rose-100 dark:border-rose-900/40 text-rose-700 dark:text-rose-300"
                          : "bg-amber-50/30 dark:bg-amber-500/5 border-amber-100 dark:border-amber-900/40 text-amber-700 dark:text-amber-300"
                      }`}
                    >
                      ⚠ {item.issue}
                    </div>
                  )}
                  <div className="mt-2 flex items-center gap-2 flex-wrap">
                    {item.severity === "ok" ? (
                      <Button size="sm" className="h-9 sm:h-7 text-xs sm:text-[11px]" onClick={() => autoPublish(item.id)}>
                        <Send className="h-3 w-3" />자동 발행
                      </Button>
                    ) : (
                      <>
                        <Button size="sm" className="h-9 sm:h-7 text-xs sm:text-[11px]" onClick={() => approve(item.id)}>
                          <CheckCircle2 className="h-3 w-3" />승인 + 발행
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-9 sm:h-7 text-xs sm:text-[11px]"
                          onClick={() => openEdit(item.id)}
                        >
                          <Edit3 className="h-3 w-3" />수정
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </motion.li>
            ))}
            {queue.length === 0 && (
              <li className="p-12 text-center text-sm text-zinc-500">
                <Eye className="h-5 w-5 mx-auto mb-2 text-zinc-300" />
                검토 대기 콘텐츠가 없습니다.
              </li>
            )}
          </ul>
        </AnimatePresence>
      </Card>

      {/* Edit dialog */}
      <AnimatePresence>
        {editingId && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-40"
              onClick={closeEdit}
            />
            <motion.form
              onSubmit={submitEdit}
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[min(480px,calc(100vw-24px))] max-h-[90vh] overflow-y-auto rounded-2xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden"
            >
              <div className="px-5 py-4 border-b border-zinc-100 dark:border-zinc-900 flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.15em] text-amber-600 dark:text-amber-400">
                    EDIT REVIEW ITEM
                  </div>
                  <h2 className="text-base font-semibold mt-0.5">콘텐츠 수정</h2>
                </div>
                <button
                  type="button"
                  onClick={closeEdit}
                  className="text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="p-5 space-y-4">
                <div>
                  <label className="text-xs font-medium">제목</label>
                  <input
                    type="text"
                    value={draft.title}
                    onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                    required
                    className="mt-1.5 w-full h-11 sm:h-10 px-3 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-100"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium">검수 코멘트 (비우면 통과)</label>
                  <textarea
                    value={draft.issue}
                    onChange={(e) => setDraft({ ...draft, issue: e.target.value })}
                    rows={3}
                    placeholder="예: 권장 이모지 1개 이하 / 톤 일관성 4/5 미스매치 / 금지어 검출"
                    className="mt-1.5 w-full px-3 py-2 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-100 resize-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium">심각도</label>
                  <div className="mt-1.5 inline-flex rounded-lg border border-zinc-200 dark:border-zinc-800 p-1 bg-zinc-50 dark:bg-zinc-900/40">
                    {(Object.keys(SEVERITY_LABEL) as Severity[]).map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setDraft({ ...draft, severity: s })}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                          draft.severity === s
                            ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm"
                            : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                        }`}
                      >
                        {SEVERITY_LABEL[s]}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="px-5 py-3 border-t border-zinc-100 dark:border-zinc-900 flex items-center justify-end gap-2 bg-zinc-50/40 dark:bg-zinc-900/40">
                <Button type="button" variant="outline" size="sm" onClick={closeEdit}>
                  취소
                </Button>
                <Button type="submit" size="sm">
                  변경 저장
                </Button>
              </div>
            </motion.form>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
