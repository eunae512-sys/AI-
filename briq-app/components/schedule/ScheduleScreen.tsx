"use client";

import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Plus, Pause, Play, MoreHorizontal, X, Send, Trash2, Edit3 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useBrand } from "@/components/brand/BrandProvider";
import { useToast } from "@/components/ui/toast";
import { getBrandDetail } from "@/lib/dummy/brand-detail";

const CHANNELS = [
  { id: "instagram", name: "Instagram", icon: "IG", grad: "from-fuchsia-500 to-orange-400", state: "● 연결 · 4 계정", count: 7 },
  { id: "naver", name: "네이버 블로그", icon: "N", grad: "from-emerald-600 to-emerald-500", state: "● 연결 · 3 계정", count: 3 },
  { id: "kakao", name: "카카오 채널", icon: "K", grad: "from-yellow-400 to-amber-500", state: "● 부분 · 2/4", count: 1 },
  { id: "threads", name: "Threads", icon: "@", grad: "from-zinc-900 to-zinc-700", state: "● 연결 · 2 계정", count: 1 },
];

const BEST_TIMES: Record<string, { hour: string; pct: number; highlight?: boolean }[]> = {
  miokdang: [
    { hour: "07-09", pct: 18 }, { hour: "09-11", pct: 34 },
    { hour: "11-13", pct: 88, highlight: true }, { hour: "13-17", pct: 42 },
    { hour: "17-19", pct: 54 }, { hour: "19-21", pct: 92, highlight: true },
    { hour: "21-23", pct: 64 },
  ],
  "roastery-1985": [
    { hour: "07-09", pct: 82, highlight: true }, { hour: "09-11", pct: 76 },
    { hour: "11-13", pct: 64 }, { hour: "13-17", pct: 48 },
    { hour: "17-19", pct: 58 }, { hour: "19-21", pct: 44 },
    { hour: "21-23", pct: 22 },
  ],
  "seochon-stay": [
    { hour: "07-09", pct: 28 }, { hour: "09-11", pct: 42 },
    { hour: "11-13", pct: 46 }, { hour: "13-17", pct: 38 },
    { hour: "17-19", pct: 62 }, { hour: "19-21", pct: 88, highlight: true },
    { hour: "21-23", pct: 76, highlight: true },
  ],
  "dolce-dessert": [
    { hour: "07-09", pct: 22 }, { hour: "09-11", pct: 48 },
    { hour: "11-13", pct: 72 }, { hour: "13-17", pct: 86, highlight: true },
    { hour: "17-19", pct: 78, highlight: true }, { hour: "19-21", pct: 62 },
    { hour: "21-23", pct: 34 },
  ],
  "luna-hair": [
    { hour: "07-09", pct: 14 }, { hour: "09-11", pct: 38 },
    { hour: "11-13", pct: 62 }, { hour: "13-17", pct: 58 },
    { hour: "17-19", pct: 78, highlight: true }, { hour: "19-21", pct: 84, highlight: true },
    { hour: "21-23", pct: 52 },
  ],
  "forum-fashion": [
    { hour: "07-09", pct: 24 }, { hour: "09-11", pct: 42 },
    { hour: "11-13", pct: 56 }, { hour: "13-17", pct: 48 },
    { hour: "17-19", pct: 68 }, { hour: "19-21", pct: 82, highlight: true },
    { hour: "21-23", pct: 88, highlight: true },
  ],
};

type QueueItem = { id: string; title: string; channel: string; date: string; time: string; status: "scheduled" | "paused" };

export function ScheduleScreen() {
  const { brand } = useBrand();
  const detail = getBrandDetail(brand.id);
  const toast = useToast();
  const bestTimes = BEST_TIMES[brand.id] ?? BEST_TIMES.miokdang;

  // 큐 상태 — 브랜드 전환 시 리셋
  const [queue, setQueue] = React.useState<QueueItem[]>(() =>
    (detail?.upcoming ?? []).map((u, i) => ({
      id: `q-${i}`,
      title: u.title,
      channel: u.channel,
      date: u.date,
      time: u.time,
      status: "scheduled",
    }))
  );

  React.useEffect(() => {
    const next = getBrandDetail(brand.id)?.upcoming ?? [];
    setQueue(next.map((u, i) => ({ id: `q-${i}`, title: u.title, channel: u.channel, date: u.date, time: u.time, status: "scheduled" })));
  }, [brand.id]);

  // 다이얼로그
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [form, setForm] = React.useState({ title: "", date: "", time: "11:30", channel: "instagram" });
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [menuFor, setMenuFor] = React.useState<string | null>(null);

  const today = new Date().toISOString().slice(0, 10);

  const channelIdFromLabel = (label: string) =>
    CHANNELS.find((c) => c.name === label)?.id ?? "instagram";

  const openDialog = () => {
    setEditingId(null);
    setForm({
      title: detail?.upcoming?.[0]?.title ?? "새 콘텐츠",
      date: today,
      time: "11:30",
      channel: "instagram",
    });
    setDialogOpen(true);
  };

  const openEditDialog = (id: string) => {
    const item = queue.find((q) => q.id === id);
    if (!item) return;
    setEditingId(id);
    // date label "5/12" → today's year + parsed; if fails, fall back to today
    let isoDate = today;
    const m = item.date.match(/^(\d{1,2})\/(\d{1,2})$/);
    if (m) {
      const year = new Date().getFullYear();
      isoDate = `${year}-${m[1].padStart(2, "0")}-${m[2].padStart(2, "0")}`;
    }
    setForm({
      title: item.title,
      date: isoDate,
      time: item.time,
      channel: channelIdFromLabel(item.channel),
    });
    setDialogOpen(true);
    setMenuFor(null);
  };

  const submitBooking = (e: React.FormEvent) => {
    e.preventDefault();
    const channelLabel = CHANNELS.find((c) => c.id === form.channel)?.name ?? "Instagram";
    const dateLabel = form.date ? form.date.slice(5).replace("-", "/") : "오늘";
    const titleClean = form.title.trim() || "새 콘텐츠";

    if (editingId) {
      setQueue((q) =>
        q.map((it) =>
          it.id === editingId
            ? { ...it, title: titleClean, channel: channelLabel, date: dateLabel, time: form.time }
            : it,
        ),
      );
      toast.success(`예약 편집 완료 · ${dateLabel} ${form.time} ${channelLabel}`);
    } else {
      const newItem: QueueItem = {
        id: `q-${Date.now()}`,
        title: titleClean,
        channel: channelLabel,
        date: dateLabel,
        time: form.time,
        status: "scheduled",
      };
      setQueue((q) => [newItem, ...q]);
      toast.success(`${brand.name} · ${dateLabel} ${form.time} 예약 완료\n${channelLabel} 채널로 자동 발행됩니다`);
    }
    setDialogOpen(false);
    setEditingId(null);
  };

  const togglePause = (id: string) => {
    setQueue((q) =>
      q.map((it) => {
        if (it.id !== id) return it;
        const next = it.status === "paused" ? "scheduled" : "paused";
        toast.info(next === "paused" ? `"${it.title}" 일시 정지됨` : `"${it.title}" 재개됨`);
        return { ...it, status: next };
      })
    );
  };

  const removeItem = (id: string) => {
    const item = queue.find((q) => q.id === id);
    setQueue((q) => q.filter((it) => it.id !== id));
    toast.warn(`"${item?.title ?? ""}" 예약 취소됨`);
    setMenuFor(null);
  };

  const publishNow = (id: string) => {
    const item = queue.find((q) => q.id === id);
    setQueue((q) => q.filter((it) => it.id !== id));
    toast.success(`"${item?.title ?? ""}" 즉시 발행됨`);
    setMenuFor(null);
  };

  const pauseAll = () => {
    const anyScheduled = queue.some((q) => q.status === "scheduled");
    setQueue((q) => q.map((it) => ({ ...it, status: anyScheduled ? "paused" : "scheduled" })));
    toast.info(anyScheduled ? "전체 큐 일시정지됨" : "전체 큐 재개됨");
  };

  return (
    <div className="px-4 sm:px-6 py-4 sm:py-6">
      <div className="flex items-end justify-between gap-4 flex-wrap mb-6">
        <div>
          <div className="text-[11px] uppercase tracking-widest text-sky-600 dark:text-sky-400 font-semibold">
            UPLOAD QUEUE · {brand.name}
          </div>
          <h1 className="mt-2 text-2xl sm:text-3xl font-semibold tracking-tight">예약 업로드 큐</h1>
          <p className="mt-1 text-sm text-zinc-500 max-w-2xl">
            인스타 · 블로그 · Threads · 카카오 채널 동시 예약. BRIQ가 학습한 최적 시간으로 자동 보정합니다.
          </p>
        </div>
        <Button size="sm" onClick={openDialog}>
          <Plus className="h-3.5 w-3.5" />콘텐츠 예약
        </Button>
      </div>

      {/* Channels */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        {CHANNELS.map((c) => (
          <button
            key={c.id}
            onClick={() => toast.info(`${c.name} · ${c.state}\n연결 관리는 설정에서`)}
            className="text-left"
          >
            <Card className="p-4 flex items-center gap-3 hover:border-zinc-900 dark:hover:border-zinc-100 transition-colors cursor-pointer">
              <div className={`h-9 w-9 rounded-lg bg-gradient-to-br ${c.grad} grid place-items-center text-white font-bold text-sm`}>
                {c.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium truncate">{c.name}</div>
                <div className="text-[10px] text-emerald-600">{c.state}</div>
              </div>
              <div className="text-xs tabular-nums font-semibold">{c.count}</div>
            </Card>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <Card className="lg:col-span-2 overflow-hidden">
          <div className="px-5 py-3 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
            <h3 className="text-sm font-semibold">{brand.name} · 큐 ({queue.length}건)</h3>
            <div className="flex items-center gap-2 text-[11px]">
              <button
                onClick={() => toast.info("시간순으로 정렬됨")}
                className="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
              >
                시간순
              </button>
              <span className="text-zinc-300">·</span>
              <button onClick={pauseAll} className="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100">
                {queue.some((q) => q.status === "scheduled") ? "전체 일시정지" : "전체 재개"}
              </button>
            </div>
          </div>
          <AnimatePresence mode="popLayout">
            <ul key={brand.id} className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {queue.map((u, i) => (
                <motion.li
                  key={u.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  transition={{ delay: i * 0.04 }}
                  className={`p-3 sm:p-4 flex items-center gap-3 sm:gap-4 ${u.status === "paused" ? "opacity-50" : ""}`}
                >
                  <div className="text-xs font-semibold tabular-nums w-12 sm:w-14 text-emerald-600 shrink-0">
                    {u.time}
                    <div className="text-[10px] font-normal text-zinc-500">{u.date}</div>
                  </div>
                  <div className={`h-10 w-10 sm:h-12 sm:w-12 rounded-md bg-gradient-to-br ${brand.gradient} shrink-0 grid place-items-center text-white font-bold text-sm`}>
                    {brand.letter}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium truncate">{u.title}</div>
                    <div className="text-[11px] text-zinc-500 mt-0.5 truncate">{u.channel}</div>
                  </div>
                  <Badge tone={u.status === "paused" ? "default" : i === 0 ? "emerald" : "sky"} className="hidden sm:inline-flex">
                    {u.status === "paused" ? "일시정지" : i === 0 ? "최적시간 ★" : "예약"}
                  </Badge>
                  <div className="flex items-center gap-1 relative">
                    <button
                      onClick={() => togglePause(u.id)}
                      className="text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 p-1.5 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800"
                      title={u.status === "paused" ? "재개" : "일시정지"}
                    >
                      {u.status === "paused" ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
                    </button>
                    <button
                      onClick={() => setMenuFor(menuFor === u.id ? null : u.id)}
                      className="text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 p-1.5 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800"
                      title="더보기"
                    >
                      <MoreHorizontal className="h-3.5 w-3.5" />
                    </button>
                    {menuFor === u.id && (
                      <div className="absolute right-0 top-full mt-1 w-44 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-xl z-30 overflow-hidden">
                        <button
                          onClick={() => publishNow(u.id)}
                          className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-zinc-50 dark:hover:bg-zinc-900"
                        >
                          <Send className="h-3 w-3" />지금 즉시 발행
                        </button>
                        <button
                          onClick={() => openEditDialog(u.id)}
                          className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-zinc-50 dark:hover:bg-zinc-900"
                        >
                          <Edit3 className="h-3 w-3" />편집
                        </button>
                        <button
                          onClick={() => removeItem(u.id)}
                          className="w-full flex items-center gap-2 px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10"
                        >
                          <Trash2 className="h-3 w-3" />예약 취소
                        </button>
                      </div>
                    )}
                  </div>
                </motion.li>
              ))}
              {queue.length === 0 && (
                <li className="p-12 text-center text-sm text-zinc-500">
                  예약된 콘텐츠가 없습니다.
                  <div className="mt-3">
                    <Button size="sm" onClick={openDialog}>
                      <Plus className="h-3.5 w-3.5" />첫 콘텐츠 예약
                    </Button>
                  </div>
                </li>
              )}
            </ul>
          </AnimatePresence>
        </Card>

        <Card className="p-5">
          <h3 className="text-sm font-semibold mb-1">시간대별 최적 발행</h3>
          <p className="text-[11px] text-zinc-500 mb-4">{brand.name} · 90일 학습</p>
          <div className="space-y-2">
            {bestTimes.map((t) => (
              <button
                key={t.hour}
                onClick={() => {
                  setForm({ title: "새 콘텐츠", date: today, time: t.hour.split("-")[0] + ":00", channel: "instagram" });
                  setDialogOpen(true);
                }}
                className="w-full flex items-center gap-2 group"
              >
                <span className={`text-[10px] tabular-nums w-10 text-left ${t.highlight ? "text-emerald-600 font-bold" : "text-zinc-500"}`}>{t.hour}</span>
                <div className="flex-1 h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <motion.div
                    key={`${brand.id}-${t.hour}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${t.pct}%` }}
                    transition={{ duration: 0.5 }}
                    className={`h-full ${t.highlight ? "bg-emerald-500" : "bg-zinc-400 dark:bg-zinc-600 group-hover:bg-zinc-500"}`}
                  />
                </div>
                <span className={`text-[10px] tabular-nums ${t.highlight ? "text-emerald-600 font-bold" : "text-zinc-500"}`}>{t.pct}%</span>
              </button>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
            <div className="text-[10px] uppercase tracking-widest text-zinc-400 font-semibold mb-1.5">자동 보정 규칙</div>
            <ul className="text-[11px] space-y-1 text-zinc-600 dark:text-zinc-400">
              <li>· 비 오는 날 +30분 앞당김</li>
              <li>· 공휴일 -2시간 (가족 동반 시간)</li>
              <li>· 휴무일 자동 회피</li>
            </ul>
          </div>
        </Card>
      </div>

      {/* 외부 클릭 시 메뉴 닫기 */}
      {menuFor && <div className="fixed inset-0 z-20" onClick={() => setMenuFor(null)} />}

      {/* Booking dialog */}
      <AnimatePresence>
        {dialogOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-40"
              onClick={() => setDialogOpen(false)}
            />
            <motion.form
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ duration: 0.2 }}
              onSubmit={submitBooking}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[440px] max-w-[calc(100vw-24px)] max-h-[90vh] overflow-y-auto rounded-2xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-2xl"
            >
              <div className="px-5 py-4 border-b border-zinc-100 dark:border-zinc-900 flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-widest text-sky-600 dark:text-sky-400">
                    {editingId ? "EDIT BOOKING" : "NEW BOOKING"}
                  </div>
                  <h2 className="text-base font-semibold mt-0.5">
                    {editingId ? `${brand.name} 예약 편집` : `${brand.name} 콘텐츠 예약`}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setDialogOpen(false)}
                  className="text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="p-5 space-y-4">
                <div>
                  <label className="text-xs font-medium">콘텐츠 제목</label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="예: 장마 감성 릴스"
                    required
                    className="mt-1.5 w-full h-10 px-3 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-100"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium">발행 날짜</label>
                    <input
                      type="date"
                      value={form.date}
                      onChange={(e) => setForm({ ...form, date: e.target.value })}
                      min={today}
                      required
                      className="mt-1.5 w-full h-10 px-3 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-100"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium">발행 시간</label>
                    <input
                      type="time"
                      value={form.time}
                      onChange={(e) => setForm({ ...form, time: e.target.value })}
                      required
                      className="mt-1.5 w-full h-10 px-3 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium">채널</label>
                  <div className="mt-1.5 grid grid-cols-2 gap-1.5">
                    {CHANNELS.map((c) => {
                      const active = form.channel === c.id;
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => setForm({ ...form, channel: c.id })}
                          className={`flex items-center gap-2 px-3 py-2 rounded-md border text-xs text-left transition ${
                            active
                              ? "border-zinc-900 dark:border-zinc-100 bg-zinc-50 dark:bg-zinc-900"
                              : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600"
                          }`}
                        >
                          <span className={`h-5 w-5 rounded bg-gradient-to-br ${c.grad} grid place-items-center text-white text-[9px] font-bold`}>
                            {c.icon}
                          </span>
                          <span className="font-medium">{c.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="rounded-lg bg-emerald-50/40 dark:bg-emerald-500/5 border border-emerald-100 dark:border-emerald-900/40 p-3 text-xs">
                  <div className="text-[10px] uppercase tracking-widest text-emerald-700 dark:text-emerald-400 font-semibold mb-1">
                    BRIQ 추천
                  </div>
                  <div className="text-emerald-900 dark:text-emerald-300">
                    {brand.name} 평균 저장률 기준 <b>{bestTimes.find((t) => t.highlight)?.hour ?? "19-21"}시</b> 발행이 최적입니다.
                  </div>
                </div>
              </div>

              <div className="px-5 py-3 border-t border-zinc-100 dark:border-zinc-900 flex items-center justify-end gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setDialogOpen(false)}>
                  취소
                </Button>
                <Button type="submit" size="sm">
                  <Send className="h-3.5 w-3.5" />{editingId ? "변경 저장" : "예약 확정"}
                </Button>
              </div>
            </motion.form>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
